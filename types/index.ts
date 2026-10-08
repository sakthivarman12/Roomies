export type ID = string;
export type ISODate = string;

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type ExpenseCategory =
  | "Rent" | "Electricity" | "Water" | "Internet" | "Groceries" | "Food"
  | "Transport" | "Cleaning" | "Furniture" | "Maintenance" | "Other";

export type PaymentMethod = "UPI" | "Cash" | "Bank Transfer";
export type SplitMode = "equal" | "percentage" | "custom";
export type ChoreStatus = "upcoming" | "in_progress" | "completed" | "overdue";
export type Priority = "low" | "medium" | "high";
export type Frequency = "once" | "daily" | "weekly" | "monthly";
export type NotificationType =
  | "expense_added" | "expense_split" | "payment_received" | "payment_requested"
  | "chore_assigned" | "chore_overdue" | "bill_reminder" | "announcement";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
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
  rooms: number;
  rules: string[];
  inviteCode: string;
  createdAt: ISODate;
}

export interface HouseholdMember {
  id: ID;
  householdId: ID;
  userId: ID;
  role: Role;
  joinedAt: ISODate;
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

export interface GalleryPhoto {
  id: ID;
  householdId: ID;
  src: string; // data URL in the prototype; Supabase Storage URL later
  caption?: string;
  addedBy: ID;
  /** Hidden-folder photos are only visible to (and usable by) the person who added them. */
  hidden: boolean;
  /** Included in the rotating Home background. */
  useAsBackground: boolean;
  createdAt: ISODate;
}

export interface Preferences {
  hiddenUnlocked?: boolean;
  darkMode: boolean;
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
  receipts: Record<ID, Receipt>;
  session: { userId: ID | null; householdId: ID | null };
  prefs: Record<ID, Preferences>;
}
