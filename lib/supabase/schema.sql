-- ROOMIES future Supabase schema (not applied automatically).
-- Run in the Supabase SQL editor after wiring the service layer.

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null, phone text, avatar_color text, photo_url text,
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, monthly_rent numeric(12,2) default 0,
  rent_due_day int default 5, rooms int default 1, invite_code text unique not null,
  created_at timestamptz not null default now()
);

create type member_role as enum ('OWNER','ADMIN','MEMBER');

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role member_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  code text unique not null, created_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null, amount numeric(12,2) not null check (amount > 0), category text not null,
  date timestamptz not null, paid_by uuid not null references profiles, split_mode text not null default 'equal',
  notes text, receipt_url text, created_by uuid references profiles, created_at timestamptz not null default now()
);

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses on delete cascade,
  user_id uuid not null references profiles, amount numeric(12,2) not null
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  from_user uuid not null references profiles, to_user uuid not null references profiles,
  amount numeric(12,2) not null check (amount > 0), method text not null, note text,
  created_at timestamptz not null default now()
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null, category text not null, amount numeric(12,2) not null, due_date timestamptz not null,
  recurring boolean default true, paid boolean default false, paid_by uuid references profiles,
  assigned_to uuid[] default '{}', created_at timestamptz not null default now()
);

create table chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null, description text, due_date timestamptz not null, frequency text default 'weekly',
  priority text default 'medium', completed boolean default false, in_progress boolean default false,
  created_at timestamptz not null default now()
);

create table chore_assignments (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references chores on delete cascade,
  user_id uuid not null references profiles, position int not null default 0, is_current boolean default false
);

create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null, quantity text default '1', added_by uuid references profiles,
  purchased boolean default false, created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null, body text not null, author_id uuid references profiles,
  reactions jsonb default '{}', acknowledged_by uuid[] default '{}', created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles, type text not null, title text not null, description text,
  read boolean default false, created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  kind text not null, ref_id uuid not null, created_at timestamptz not null default now()
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  ref_id uuid not null, receipt_number text unique not null, payload jsonb not null,
  created_at timestamptz not null default now()
);

create table house_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade, rule text not null, position int default 0
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null, note text, storage_path text, created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  actor_id uuid references profiles, action text not null, meta jsonb, created_at timestamptz not null default now()
);

-- Row Level Security: a user only ever sees rows for households they belong to.
create or replace function is_household_member(hid uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid());
$$;

alter table households enable row level security;
alter table household_members enable row level security;
alter table expenses enable row level security;
alter table payments enable row level security;
alter table bills enable row level security;
alter table chores enable row level security;
alter table shopping_items enable row level security;
alter table announcements enable row level security;
alter table notifications enable row level security;

create policy "members read household" on households for select using (is_household_member(id));
create policy "members read members" on household_members for select using (is_household_member(household_id));
create policy "members read expenses" on expenses for select using (is_household_member(household_id));
create policy "members write expenses" on expenses for insert with check (is_household_member(household_id));
create policy "members read payments" on payments for select using (is_household_member(household_id));
create policy "members read bills" on bills for select using (is_household_member(household_id));
create policy "members read chores" on chores for select using (is_household_member(household_id));
create policy "members read shopping" on shopping_items for select using (is_household_member(household_id));
create policy "members read announcements" on announcements for select using (is_household_member(household_id));
create policy "own notifications" on notifications for select using (user_id = auth.uid());
-- Add insert/update/delete policies per table, restricting owner/admin actions via household_members.role.
