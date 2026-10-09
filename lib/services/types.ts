import type {
  Announcement, Bill, EventItem, FundEntry, GalleryFolder, JoinRequest, MemberKind, Restrictions, GalleryPhoto, MemberLocation, RsvpStatus, Story, Chore, Db, Expense, ExpenseCategory, ExpenseSplit, Frequency, Household,
  HouseholdMember, PaymentMethod, Preferences, Priority, Receipt, Role, ShoppingItem, SplitMode, User,
} from "@/types";
import type { ThemePrefs } from "@/lib/theme";

/** Service contracts. Local implementations live beside these; Supabase ones can replace them. */

export interface SignupInput { name: string; email: string; phone: string; password: string }

export interface AuthService {
  login(email: string, password: string): User;
  signup(input: SignupInput): User;
  logout(): void;
  getCurrentUser(): User | null;
  requestPasswordReset(email: string): void;
  resetPassword(email: string, newPassword: string): void;
  updateProfile(patch: Partial<Pick<User, "name" | "phone" | "email" | "photo" | "avatarColor" | "upiId">>): User;
  changePassword(current: string, next: string): void;
  updatePrefs(patch: Partial<Preferences>): void;
  updateTheme(patch: Partial<ThemePrefs>): void;
}

export interface SharedCostInput { title: string; category: ExpenseCategory; amount: number; dueDay: number }

export interface HouseholdInput {
  name: string; address: string; monthlyRent: number; rentDueDay: number; rooms: number; rules: string[];
  /** Recurring shared costs to set up as bills (rent, Wi-Fi, drinking water, sump/tank water, outside help…). */
  sharedCosts?: SharedCostInput[];
  requireApproval?: boolean;
}

export interface ApprovalInput { kind: MemberKind; restrictions: Restrictions; stayUntil?: string }

export interface RoomService {
  createHousehold(input: HouseholdInput): Household;
  joinByCode(code: string): { household: Household; status: "joined" | "pending" };
  approveRequest(requestId: string, input: ApprovalInput): void;
  rejectRequest(requestId: string): void;
  updateMemberAccess(householdId: string, userId: string, input: ApprovalInput): void;
  getPendingRequests(): JoinRequest[];
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
  paidFromFund?: boolean; source?: string;
}

export interface ExpenseService {
  create(input: ExpenseInput): { expense: Expense; receipt: Receipt };
  update(id: string, input: ExpenseInput): Expense;
  remove(id: string): void;
}

export interface PaymentService {
  settle(input: { toUserId: string; amount: number; method: PaymentMethod; note?: string }): { receipt: Receipt };
  request(fromUserId: string, amount: number): void;
  payBill(billId: string, method: PaymentMethod, fromFund?: boolean): { receipt: Receipt };
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
  add(photos: { src: string; caption?: string; kind?: "image" | "video"; mediaId?: string }[], hidden: boolean, folderId?: string): GalleryPhoto[];
  createFolder(name: string): GalleryFolder;
  deleteFolder(id: string): void;
  movePhoto(id: string, folderId: string | null): void;
  setBackground(id: string, on: boolean): void;
  setHidden(id: string, hidden: boolean): void;
  setCaption(id: string, caption: string): void;
  remove(id: string): void;
}

export interface StoryInput {
  kind: "image" | "video";
  src?: string;
  mediaId?: string;
  caption?: string;
  lat?: number;
  lng?: number;
  /** Also keep a copy in the household gallery (app storage, never the phone's camera roll). */
  saveToGallery: boolean;
}

export interface GeoService {
  setSharing(on: boolean): void;
  updateLocation(lat: number, lng: number, accuracy?: number): void;
  createStory(input: StoryInput): Story;
  removeStory(id: string): void;
  markStoryViewed(id: string): void;
  getLocations(): MemberLocation[];
}

export interface FundService {
  contribute(input: { amount: number; method: PaymentMethod; note?: string }): FundEntry;
}

export interface NotificationService {
  markRead(id: string): void;
  markAllRead(): void;
  clearAll(): void;
  sendTest(): void;
}

export interface DevService {
  resetDemoData(): void;
}

export type { Db };
