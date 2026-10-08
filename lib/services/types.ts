import type {
  Announcement, Bill, EventItem, GalleryPhoto, RsvpStatus, Chore, Db, Expense, ExpenseCategory, ExpenseSplit, Frequency, Household,
  HouseholdMember, PaymentMethod, Preferences, Priority, Receipt, Role, ShoppingItem, SplitMode, User,
} from "@/types";

/** Service contracts. Local implementations live beside these; Supabase ones can replace them. */

export interface SignupInput { name: string; email: string; phone: string; password: string }

export interface AuthService {
  login(email: string, password: string): User;
  signup(input: SignupInput): User;
  logout(): void;
  getCurrentUser(): User | null;
  requestPasswordReset(email: string): void;
  resetPassword(email: string, newPassword: string): void;
  updateProfile(patch: Partial<Pick<User, "name" | "phone" | "email" | "photo" | "avatarColor">>): User;
  changePassword(current: string, next: string): void;
  updatePrefs(patch: Partial<Preferences>): void;
}

export interface HouseholdInput {
  name: string; address: string; monthlyRent: number; rentDueDay: number; rooms: number; rules: string[];
}

export interface RoomService {
  createHousehold(input: HouseholdInput): Household;
  joinByCode(code: string): Household;
  switchHousehold(id: string): void;
  updateHousehold(id: string, patch: Partial<HouseholdInput>): Household;
  addMember(householdId: string, input: { name: string; email: string }): HouseholdMember;
  removeMember(householdId: string, userId: string): void;
  changeRole(householdId: string, userId: string, role: Role): void;
  leaveHousehold(householdId: string): void;
  regenerateInvite(householdId: string): string;
}

export interface ExpenseInput {
  title: string; amount: number; category: ExpenseCategory; date: string; paidBy: string;
  splitMode: SplitMode; splits: ExpenseSplit[]; notes?: string; receiptImage?: string;
}

export interface ExpenseService {
  create(input: ExpenseInput): { expense: Expense; receipt: Receipt };
  update(id: string, input: ExpenseInput): Expense;
  remove(id: string): void;
}

export interface PaymentService {
  settle(input: { toUserId: string; amount: number; method: PaymentMethod; note?: string }): { receipt: Receipt };
  request(fromUserId: string, amount: number): void;
  payBill(billId: string, method: PaymentMethod): { receipt: Receipt };
}

export interface BillInput {
  title: string; category: ExpenseCategory; amount: number; dueDate: string; recurring: boolean; assignedTo: string[];
}

export interface BillService {
  create(input: BillInput): Bill;
  remove(id: string): void;
}

export interface ChoreInput {
  title: string; description?: string; assignedTo: string; dueDate: string; frequency: Frequency;
  priority: Priority; rotation: string[];
}

export interface ChoreService {
  create(input: ChoreInput): Chore;
  update(id: string, patch: Partial<ChoreInput>): Chore;
  setInProgress(id: string): void;
  complete(id: string): void;
  reopen(id: string): void;
  remove(id: string): void;
}

export interface HouseService {
  addShoppingItem(name: string, quantity: string): ShoppingItem;
  toggleShoppingItem(id: string): void;
  removeShoppingItem(id: string): void;
  clearPurchased(): void;
  createAnnouncement(title: string, body: string): Announcement;
  reactToAnnouncement(id: string, emoji: string): void;
  acknowledgeAnnouncement(id: string): void;
  deleteAnnouncement(id: string): void;
  addDocument(name: string, note: string): void;
  removeDocument(id: string): void;
  addRule(rule: string): void;
  removeRule(index: number): void;
}

export interface EventInput { title: string; description?: string; location?: string; startsAt: string }

export interface EventService {
  create(input: EventInput): EventItem;
  remove(id: string): void;
  rsvp(id: string, status: RsvpStatus): void;
}

export interface GalleryService {
  add(photos: { src: string; caption?: string }[], hidden: boolean): GalleryPhoto[];
  setBackground(id: string, on: boolean): void;
  setHidden(id: string, hidden: boolean): void;
  setCaption(id: string, caption: string): void;
  remove(id: string): void;
}

export interface NotificationService {
  markRead(id: string): void;
  markAllRead(): void;
  clearAll(): void;
}

export interface DevService {
  resetDemoData(): void;
}

export type { Db };
