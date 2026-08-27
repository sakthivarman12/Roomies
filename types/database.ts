export type SplitMethod = 'equal' | 'custom' | 'percentage' | 'shares';
export type SettlementStatus = 'pending' | 'paid' | 'cancelled';
export type EventRsvpStatus = 'joined' | 'declined' | 'maybe' | 'invited';
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'voice'
  | 'event_card'
  | 'expense_card'
  | 'system';
export type MediaType = 'image' | 'video';
export type RoomRole = 'admin' | 'member';
export type NotificationType =
  | 'message'
  | 'photo'
  | 'video'
  | 'voice'
  | 'expense'
  | 'mention'
  | 'settlement_request'
  | 'event_created'
  | 'event_reminder'
  | 'member_joined'
  | 'memory_uploaded';

export interface UserRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomRow {
  id: string;
  name: string;
  image_url: string | null;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface RoomMemberRow {
  id: string;
  room_id: string;
  user_id: string;
  role: RoomRole;
  joined_at: string;
  user?: UserRow;
}

export interface ExpenseRow {
  id: string;
  room_id: string;
  title: string;
  amount: number;
  category: string;
  paid_by: string;
  description: string | null;
  receipt_url: string | null;
  split_method: SplitMethod;
  expense_date: string;
  created_by: string;
  created_at: string;
  paid_by_user?: UserRow;
  splits?: ExpenseSplitRow[];
}

export interface ExpenseSplitRow {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  shares: number | null;
  user?: UserRow;
}

export interface SettlementRow {
  id: string;
  room_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: SettlementStatus;
  note: string | null;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  from_user_profile?: UserRow;
  to_user_profile?: UserRow;
}

export interface EventRow {
  id: string;
  room_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  cover_url: string | null;
  reminder_minutes_before: number | null;
  created_by: string;
  created_at: string;
  members?: EventMemberRow[];
}

export interface EventMemberRow {
  id: string;
  event_id: string;
  user_id: string;
  status: EventRsvpStatus;
  user?: UserRow;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  text: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  reference_id: string | null;
  created_at: string;
  sender?: UserRow;
  reactions?: { reaction: string; user_id: string }[];
}

export interface MemoryRow {
  id: string;
  room_id: string;
  uploaded_by: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  album_id: string | null;
  tagged_user_ids: string[];
  created_at: string;
  uploader?: UserRow;
}

export interface AlbumRow {
  id: string;
  room_id: string;
  name: string;
  cover_url: string | null;
  created_by: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  reference_id: string | null;
  room_id: string | null;
  read: boolean;
  created_at: string;
}

// Minimal Database type placeholder — Supabase client works untyped-safe with this.
export type Database = any;

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Internet',
  'Groceries',
  'Food',
  'Water',
  'Gas',
  'Cleaning',
  'Repairs',
  'Travel',
  'Entertainment',
  'Other',
] as const;

export const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '🎉'] as const;
