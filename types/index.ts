import type { ThemePrefs } from "@/lib/theme";

export type ID = string;
export type ISODate = string;

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type ExpenseCategory =
  | "Rent" | "Electricity" | "Water" | "Internet" | "Groceries" | "Food"
  | "Transport" | "Cleaning" | "Furniture" | "Maintenance" | "Other";

export type PaymentMethod = "UPI" | "GPay" | "PhonePe" | "Paytm" | "Cash" | "Bank Transfer";
export type SplitMode = "equal" | "percentage" | "custom";
export type ChoreStatus = "upcoming" | "in_progress" | "completed" | "overdue";
export type Priority = "low" | "medium" | "high";
export type Frequency = "once" | "daily" | "weekly" | "monthly";
export type NotificationType =
  | "expense_added" | "expense_split" | "payment_received" | "payment_requested"
  | "chore_assigned" | "chore_overdue" | "bill_reminder" | "announcement" | "join_request" | "fund";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  upiId?: string;
  passwordHash: string; // mock hash — Supabase Auth replaces this
  avatarColor: string;
  photo?: string;
  createdAt: ISODate;
}

export interface Household {
  id: ID;
  name: string;
  address: string;
  monthlyRent: number;
  rentDueDay: number;
  requireApproval?: boolean;
  lat?: number;
  lng?: number;
  rooms: number;
  rules: string[];
  inviteCode: string;
  createdAt: ISODate;
}

/** What a member is allowed to see/do. The owner (or an admin) sets these when approving and can change them later. */
export interface Restrictions {
  seeFund: boolean;
  seeAllExpenses: boolean;
  addExpenses: boolean;
  seeLocations: boolean;
}

export const FULL_ACCESS: Restrictions = { seeFund: true, seeAllExpenses: true, addExpenses: true, seeLocations: true };
export const GUEST_ACCESS: Restrictions = { seeFund: false, seeAllExpenses: false, addExpenses: true, seeLocations: false };

export type MemberKind = "resident" | "guest";

export interface HouseholdMember {
  id: ID;
  householdId: ID;
  userId: ID;
  role: Role;
  /** Residents live here; guests are friends who stay for a while and chip in. */
  kind?: MemberKind;
  restrictions?: Restrictions;
  stayUntil?: ISODate;
  joinedAt: ISODate;
}

export interface JoinRequest {
  id: ID;
  householdId: ID;
  userId: ID;
  note?: string;
  /** Set when an owner/admin adds someone directly; used as the default type when approving. */
  kind?: MemberKind;
  status: "pending" | "approved" | "rejected";
  createdAt: ISODate;
}

export interface FundEntry {
  id: ID;
  householdId: ID;
  userId: ID; // who contributed / who made the purchase
  kind: "contribution" | "spend";
  amount: number;
  note?: string;
  method?: PaymentMethod;
  expenseId?: ID;
  createdAt: ISODate;
}

export interface GalleryFolder {
  id: ID;
  householdId: ID;
  name: string;
  createdBy: ID;
  createdAt: ISODate;
}

export interface ExpenseSplit {
  userId: ID;
  amount: number;
}

export interface Expense {
  id: ID;
  householdId: ID;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: ISODate;
  paidBy: ID;
  splits: ExpenseSplit[];
  splitMode: SplitMode;
  notes?: string;
  receiptImage?: string;
  /** Paid from the shared room fund instead of one person (then nobody owes anybody). */
  paidFromFund?: boolean;
  /** Where it was bought, e.g. "Zepto". */
  source?: string;
  createdBy: ID;
  createdAt: ISODate;
}

export interface Payment {
  id: ID;
  householdId: ID;
  fromUserId: ID;
  toUserId: ID;
  amount: number;
  method: PaymentMethod;
  note?: string;
  billId?: ID;
  createdAt: ISODate;
}

export interface Bill {
  id: ID;
  householdId: ID;
  title: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: ISODate;
  recurring: boolean;
  paid: boolean;
  paidBy?: ID;
  assignedTo: ID[];
  createdAt: ISODate;
}

export interface Chore {
  id: ID;
  householdId: ID;
  title: string;
  description?: string;
  assignedTo: ID;
  dueDate: ISODate;
  frequency: Frequency;
  priority: Priority;
  completed: boolean;
  inProgress: boolean;
  rotation: ID[]; // roommates the chore rotates through
  createdAt: ISODate;
}

export interface ShoppingItem {
  id: ID;
  householdId: ID;
  name: string;
  quantity: string;
  addedBy: ID;
  purchased: boolean;
  createdAt: ISODate;
}

export interface Announcement {
  id: ID;
  householdId: ID;
  title: string;
  body: string;
  authorId: ID;
  reactions: Record<ID, string>;
  acknowledgedBy: ID[];
  createdAt: ISODate;
}

export interface AppNotification {
  id: ID;
  householdId: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  createdAt: ISODate;
}

export interface Invite {
  id: ID;
  householdId: ID;
  code: string;
  createdBy: ID;
  createdAt: ISODate;
}

export interface HouseDocument {
  id: ID;
  householdId: ID;
  name: string;
  note: string;
  createdAt: ISODate;
}

export interface Receipt {
  receiptNumber: string;
  date: ISODate;
  household: string;
  description: string;
  amount: number;
  paidBy: string;
  splitDetails: { name: string; amount: number }[];
  status: "PAID" | "ADDED" | "SETTLED";
  expenseId?: ID;
}

export interface Transaction {
  id: ID;
  kind: "expense" | "payment";
  date: ISODate;
  title: string;
  category: ExpenseCategory | "Settlement";
  amount: number;
  paidBy: ID;
  involved: ID[];
  /** net effect for the viewing user: +owed to you, -you owe, 0 neutral */
  net: number;
  settled: boolean;
  refId: ID;
}

export type RsvpStatus = "going" | "maybe" | "no";

export interface EventItem {
  id: ID;
  householdId: ID;
  title: string;
  description?: string;
  location?: string;
  startsAt: ISODate;
  createdBy: ID;
  rsvps: Record<ID, RsvpStatus>;
  createdAt: ISODate;
}

export interface MemberLocation {
  userId: ID;
  householdId: ID;
  lat: number;
  lng: number;
  accuracy?: number;
  sharing: boolean;
  updatedAt: ISODate;
}

export interface Story {
  id: ID;
  householdId: ID;
  userId: ID;
  kind: "image" | "video";
  src?: string; // image data URL
  mediaId?: ID; // video blob key in IndexedDB (app storage, never the phone's camera roll)
  caption?: string;
  lat?: number;
  lng?: number;
  viewedBy: ID[];
  createdAt: ISODate;
  expiresAt: ISODate;
}

export interface GalleryPhoto {
  id: ID;
  householdId: ID;
  kind?: "image" | "video";
  mediaId?: ID;
  folderId?: ID;
  src: string; // image data URL in the prototype; empty for videos (see mediaId); Supabase Storage URL later
  caption?: string;
  addedBy: ID;
  /** Hidden-folder photos are only visible to (and usable by) the person who added them. */
  hidden: boolean;
  /** Included in the rotating Home background. */
  useAsBackground: boolean;
  createdAt: ISODate;
}

export type PopupStyle = "balloon" | "blast" | "banner" | "off";

export interface NotifyPrefs {
  tone: string;
  volume: number; // 0..1
  vibrate: boolean;
  popup: PopupStyle;
  system: boolean; // also post to the device notification panel
}

export interface Preferences {
  notify?: Partial<NotifyPrefs>;
  hiddenUnlocked?: boolean;
  theme?: Partial<ThemePrefs>;
  currency: string;
  language: string;
  notifications: boolean;
}

export interface Db {
  version: number;
  users: User[];
  households: Household[];
  members: HouseholdMember[];
  expenses: Expense[];
  payments: Payment[];
  bills: Bill[];
  chores: Chore[];
  shopping: ShoppingItem[];
  announcements: Announcement[];
  notifications: AppNotification[];
  invites: Invite[];
  documents: HouseDocument[];
  events: EventItem[];
  galleryPhotos: GalleryPhoto[];
  locations: MemberLocation[];
  stories: Story[];
  joinRequests: JoinRequest[];
  fund: FundEntry[];
  galleryFolders: GalleryFolder[];
  receipts: Record<ID, Receipt>;
  session: { userId: ID | null; householdId: ID | null };
  prefs: Record<ID, Preferences>;
}
