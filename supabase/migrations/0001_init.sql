-- ============================================================================
-- ROOMIES — Initial schema, RLS policies, storage buckets, realtime
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type room_role as enum ('admin', 'member');
create type split_method as enum ('equal', 'custom', 'percentage', 'shares');
create type settlement_status as enum ('pending', 'paid', 'cancelled');
create type event_rsvp_status as enum ('joined', 'declined', 'maybe', 'invited');
create type message_type as enum ('text', 'image', 'video', 'voice', 'event_card', 'expense_card', 'system');
create type media_type as enum ('image', 'video');
create type notification_type as enum (
  'message', 'photo', 'video', 'voice', 'expense', 'mention',
  'settlement_request', 'event_created', 'event_reminder', 'member_joined', 'memory_uploaded'
);

-- ---------------------------------------------------------------------------
-- USERS  (mirrors auth.users; created via trigger on signup)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'New Roomie',
  phone text unique,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_phone_idx on public.users(phone);
create index users_email_idx on public.users(email);

-- Auto-create a public.users row when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'New Roomie'),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ROOMS
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  created_by uuid not null references public.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role room_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index room_members_room_idx on public.room_members(room_id);
create index room_members_user_idx on public.room_members(user_id);

-- Helper: is the current user a member of a given room?
create or replace function public.is_room_member(p_room_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.is_room_admin(p_room_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- EXPENSES & SPLITS
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  paid_by uuid not null references public.users(id),
  description text,
  receipt_url text,
  split_method split_method not null default 'equal',
  expense_date date not null default current_date,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  percentage numeric(5,2),
  shares numeric(6,2),
  unique (expense_id, user_id)
);

create index expenses_room_idx on public.expenses(room_id, expense_date desc);
create index expense_splits_expense_idx on public.expense_splits(expense_id);
create index expense_splits_user_idx on public.expense_splits(user_id);

-- ---------------------------------------------------------------------------
-- SETTLEMENTS
-- ---------------------------------------------------------------------------
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  from_user uuid not null references public.users(id),
  to_user uuid not null references public.users(id),
  amount numeric(12,2) not null check (amount > 0),
  status settlement_status not null default 'pending',
  note text,
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index settlements_room_idx on public.settlements(room_id, created_at desc);

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  cover_url text,
  reminder_minutes_before int,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status event_rsvp_status not null default 'invited',
  unique (event_id, user_id)
);

create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploaded_by uuid not null references public.users(id),
  media_type media_type not null,
  media_url text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create index events_room_idx on public.events(room_id, start_time);
create index event_members_event_idx on public.event_members(event_id);
create index event_comments_event_idx on public.event_comments(event_id);

-- ---------------------------------------------------------------------------
-- CHAT
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  message_type message_type not null default 'text',
  text text,
  media_url text,
  thumbnail_url text,
  duration numeric(6,2),
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, reaction)
);

create index messages_conversation_idx on public.messages(conversation_id, created_at desc);
create index message_reactions_message_idx on public.message_reactions(message_id);

-- Auto-create a conversation whenever a room is created
create or replace function public.handle_new_room()
returns trigger as $$
begin
  insert into public.conversations (room_id) values (new.id);
  insert into public.room_members (room_id, user_id, role) values (new.id, new.created_by, 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_room_created
  after insert on public.rooms
  for each row execute function public.handle_new_room();

-- ---------------------------------------------------------------------------
-- MEMORIES (private shared gallery)
-- ---------------------------------------------------------------------------
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  cover_url text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  uploaded_by uuid not null references public.users(id),
  media_type media_type not null,
  media_url text not null,
  thumbnail_url text,
  caption text,
  album_id uuid references public.albums(id) on delete set null,
  tagged_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  unique (memory_id, user_id, reaction)
);

create table public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index memories_room_idx on public.memories(room_id, created_at desc);
create index albums_room_idx on public.albums(room_id);
create index memory_reactions_memory_idx on public.memory_reactions(memory_id);
create index memory_comments_memory_idx on public.memory_comments(memory_id);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  reference_id uuid,
  room_id uuid references public.rooms(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  messages boolean not null default true,
  media boolean not null default true,
  expenses boolean not null default true,
  events boolean not null default true,
  mentions boolean not null default true,
  member_activity boolean not null default true
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.event_comments enable row level security;
alter table public.event_media enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.albums enable row level security;
alter table public.memories enable row level security;
alter table public.memory_reactions enable row level security;
alter table public.memory_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;

-- USERS: anyone authenticated can read basic profile info (needed to render names/avatars in shared rooms); only self can update
create policy "users_select_all_authenticated" on public.users for select using (auth.uid() is not null);
create policy "users_update_self" on public.users for update using (id = auth.uid());
create policy "users_insert_self" on public.users for insert with check (id = auth.uid());

-- ROOMS: members only
create policy "rooms_select_member" on public.rooms for select using (public.is_room_member(id));
create policy "rooms_insert_authenticated" on public.rooms for insert with check (created_by = auth.uid());
create policy "rooms_update_admin" on public.rooms for update using (public.is_room_admin(id));
create policy "rooms_delete_admin" on public.rooms for delete using (public.is_room_admin(id));

-- ROOM_MEMBERS: members can see the roster; admins manage membership; users can remove themselves (leave)
create policy "room_members_select_member" on public.room_members for select using (public.is_room_member(room_id));
create policy "room_members_insert_self_or_admin" on public.room_members for insert with check (
  user_id = auth.uid() or public.is_room_admin(room_id)
);
create policy "room_members_update_admin" on public.room_members for update using (public.is_room_admin(room_id));
create policy "room_members_delete_self_or_admin" on public.room_members for delete using (
  user_id = auth.uid() or public.is_room_admin(room_id)
);

-- EXPENSES
create policy "expenses_select_member" on public.expenses for select using (public.is_room_member(room_id));
create policy "expenses_insert_member" on public.expenses for insert with check (public.is_room_member(room_id) and created_by = auth.uid());
create policy "expenses_update_owner_or_admin" on public.expenses for update using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);
create policy "expenses_delete_owner_or_admin" on public.expenses for delete using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);

-- EXPENSE_SPLITS
create policy "expense_splits_select_member" on public.expense_splits for select using (
  exists (select 1 from public.expenses e where e.id = expense_id and public.is_room_member(e.room_id))
);
create policy "expense_splits_write_member" on public.expense_splits for insert with check (
  exists (select 1 from public.expenses e where e.id = expense_id and public.is_room_member(e.room_id))
);
create policy "expense_splits_update_member" on public.expense_splits for update using (
  exists (select 1 from public.expenses e where e.id = expense_id and public.is_room_member(e.room_id))
);
create policy "expense_splits_delete_member" on public.expense_splits for delete using (
  exists (select 1 from public.expenses e where e.id = expense_id and public.is_room_member(e.room_id))
);

-- SETTLEMENTS
create policy "settlements_select_member" on public.settlements for select using (public.is_room_member(room_id));
create policy "settlements_insert_member" on public.settlements for insert with check (
  public.is_room_member(room_id) and (from_user = auth.uid() or to_user = auth.uid())
);
create policy "settlements_update_participant" on public.settlements for update using (
  public.is_room_member(room_id) and (from_user = auth.uid() or to_user = auth.uid())
);

-- EVENTS
create policy "events_select_member" on public.events for select using (public.is_room_member(room_id));
create policy "events_insert_member" on public.events for insert with check (public.is_room_member(room_id) and created_by = auth.uid());
create policy "events_update_owner_or_admin" on public.events for update using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);
create policy "events_delete_owner_or_admin" on public.events for delete using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);

-- EVENT_MEMBERS
create policy "event_members_select_member" on public.event_members for select using (
  exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_members_upsert_self" on public.event_members for insert with check (
  exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_members_update_self" on public.event_members for update using (
  user_id = auth.uid() or exists (
    select 1 from public.events e where e.id = event_id and public.is_room_admin(e.room_id)
  )
);

-- EVENT_COMMENTS
create policy "event_comments_select_member" on public.event_comments for select using (
  exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_comments_insert_member" on public.event_comments for insert with check (
  user_id = auth.uid() and exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_comments_delete_owner" on public.event_comments for delete using (user_id = auth.uid());

-- EVENT_MEDIA
create policy "event_media_select_member" on public.event_media for select using (
  exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_media_insert_member" on public.event_media for insert with check (
  uploaded_by = auth.uid() and exists (select 1 from public.events e where e.id = event_id and public.is_room_member(e.room_id))
);
create policy "event_media_delete_owner_or_admin" on public.event_media for delete using (
  uploaded_by = auth.uid() or exists (select 1 from public.events e where e.id = event_id and public.is_room_admin(e.room_id))
);

-- CONVERSATIONS
create policy "conversations_select_member" on public.conversations for select using (public.is_room_member(room_id));

-- MESSAGES
create policy "messages_select_member" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and public.is_room_member(c.room_id))
);
create policy "messages_insert_member" on public.messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and public.is_room_member(c.room_id))
);
create policy "messages_delete_owner" on public.messages for delete using (sender_id = auth.uid());

-- MESSAGE_REACTIONS
create policy "message_reactions_select_member" on public.message_reactions for select using (
  exists (
    select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
    where m.id = message_id and public.is_room_member(c.room_id)
  )
);
create policy "message_reactions_insert_member" on public.message_reactions for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
    where m.id = message_id and public.is_room_member(c.room_id)
  )
);
create policy "message_reactions_delete_owner" on public.message_reactions for delete using (user_id = auth.uid());

-- ALBUMS
create policy "albums_select_member" on public.albums for select using (public.is_room_member(room_id));
create policy "albums_insert_member" on public.albums for insert with check (public.is_room_member(room_id) and created_by = auth.uid());
create policy "albums_update_owner_or_admin" on public.albums for update using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);
create policy "albums_delete_owner_or_admin" on public.albums for delete using (
  public.is_room_member(room_id) and (created_by = auth.uid() or public.is_room_admin(room_id))
);

-- MEMORIES
create policy "memories_select_member" on public.memories for select using (public.is_room_member(room_id));
create policy "memories_insert_member" on public.memories for insert with check (public.is_room_member(room_id) and uploaded_by = auth.uid());
create policy "memories_delete_owner_or_admin" on public.memories for delete using (
  public.is_room_member(room_id) and (uploaded_by = auth.uid() or public.is_room_admin(room_id))
);

-- MEMORY_REACTIONS
create policy "memory_reactions_select_member" on public.memory_reactions for select using (
  exists (select 1 from public.memories m where m.id = memory_id and public.is_room_member(m.room_id))
);
create policy "memory_reactions_insert_member" on public.memory_reactions for insert with check (
  user_id = auth.uid() and exists (select 1 from public.memories m where m.id = memory_id and public.is_room_member(m.room_id))
);
create policy "memory_reactions_delete_owner" on public.memory_reactions for delete using (user_id = auth.uid());

-- MEMORY_COMMENTS
create policy "memory_comments_select_member" on public.memory_comments for select using (
  exists (select 1 from public.memories m where m.id = memory_id and public.is_room_member(m.room_id))
);
create policy "memory_comments_insert_member" on public.memory_comments for insert with check (
  user_id = auth.uid() and exists (select 1 from public.memories m where m.id = memory_id and public.is_room_member(m.room_id))
);
create policy "memory_comments_delete_owner" on public.memory_comments for delete using (user_id = auth.uid());

-- NOTIFICATIONS: strictly own
create policy "notifications_select_self" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_self" on public.notifications for update using (user_id = auth.uid());
create policy "notifications_insert_self" on public.notifications for insert with check (user_id = auth.uid());

-- PUSH_TOKENS: strictly own
create policy "push_tokens_all_self" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- NOTIFICATION_PREFERENCES: strictly own
create policy "notification_prefs_all_self" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- REALTIME
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_members;
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.memory_reactions;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.notifications;

-- ============================================================================
-- STORAGE BUCKETS (private — access via RLS-gated signed URLs only)
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('room-images', 'room-images', false),
  ('receipts', 'receipts', false),
  ('chat-media', 'chat-media', false),
  ('event-media', 'event-media', false),
  ('memories', 'memories', false)
on conflict (id) do nothing;

-- Storage path convention: {room_id}/{filename} for room-scoped buckets, {user_id}/{filename} for avatars.
-- This lets RLS check room membership by parsing the first path segment.

create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatars_owner_update" on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "room_scoped_read" on storage.objects for select using (
  bucket_id in ('room-images', 'receipts', 'chat-media', 'event-media', 'memories')
  and public.is_room_member(((storage.foldername(name))[1])::uuid)
);
create policy "room_scoped_write" on storage.objects for insert with check (
  bucket_id in ('room-images', 'receipts', 'chat-media', 'event-media', 'memories')
  and public.is_room_member(((storage.foldername(name))[1])::uuid)
);
create policy "room_scoped_delete" on storage.objects for delete using (
  bucket_id in ('room-images', 'receipts', 'chat-media', 'event-media', 'memories')
  and (owner = auth.uid() or public.is_room_admin(((storage.foldername(name))[1])::uuid))
);
