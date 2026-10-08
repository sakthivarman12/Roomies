import { AVATAR_COLORS, DB_VERSION, DEMO_PASSWORD } from "@/lib/constants";
import { mockHash } from "@/lib/utils";
import type {
  MemberLocation, EventItem, GalleryPhoto, Announcement, AppNotification, Bill, Chore, Db, Expense, ExpenseCategory, ExpenseSplit,
  HouseholdMember, Payment, Receipt, ShoppingItem, User,
} from "@/types";

const HID = "11111111-1111-4111-8111-111111111111";
const U = {
  sakthi: "aaaaaaa1-0000-4000-8000-000000000001",
  devi: "aaaaaaa2-0000-4000-8000-000000000002",
  arun: "aaaaaaa3-0000-4000-8000-000000000003",
  rahul: "aaaaaaa4-0000-4000-8000-000000000004",
};
const ALL = [U.sakthi, U.devi, U.arun, U.rahul];

/** Days back, clamped so "this month" seed data stays in the current month. */
function recent(n: number): number {
  return Math.min(n, new Date().getDate() - 1);
}
function monthsBack(months: number, day: number): number {
  const target = new Date(new Date().getFullYear(), new Date().getMonth() - months, day, 12);
  return Math.round((Date.now() - target.getTime()) / 86400000);
}

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  // Never seed timestamps in the future (e.g. "today at 8 AM" when it's 3 AM).
  if (d.getTime() > Date.now()) d.setTime(Date.now() - 60 * 60 * 1000);
  return d.toISOString();
}
function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
function equal(amount: number, ids: string[]): ExpenseSplit[] {
  const share = Math.floor((amount / ids.length) * 100) / 100;
  const splits = ids.map((userId) => ({ userId, amount: share }));
  splits[0].amount = Math.round((amount - share * (ids.length - 1)) * 100) / 100;
  return splits;
}

let counter = 0;
const id = (prefix: string) => `${prefix}-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

function expense(
  title: string, amount: number, category: ExpenseCategory, ago: number, paidBy: string,
  ids: string[] = ALL, notes?: string,
): Expense {
  return {
    id: id("e0000000"), householdId: HID, title, amount, category, date: daysAgo(ago), paidBy,
    splits: equal(amount, ids), splitMode: "equal", notes, createdBy: paidBy, createdAt: daysAgo(ago),
  };
}

function scene(from: string, to: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><circle cx="620" cy="260" r="120" fill="${accent}" opacity=".55"/><path d="M0 760 L220 520 L400 700 L560 560 L800 780 V1000 H0Z" fill="#000" opacity=".22"/><path d="M0 860 L260 660 L480 820 L800 640 V1000 H0Z" fill="#000" opacity=".28"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildSeedMedia(): { events: EventItem[]; galleryPhotos: GalleryPhoto[] } {
  const eid = (n: number) => `e1000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const photo = (n: number, src: string, caption: string, addedBy: string): GalleryPhoto => ({
    id: `91000000-0000-4000-8000-${String(n).padStart(12, "0")}`, householdId: HID, src, caption, addedBy,
    hidden: false, useAsBackground: true, createdAt: daysAgo(n * 3),
  });
  return {
    events: [
      { id: eid(1), householdId: HID, title: "House dinner night", description: "Everyone cooks one dish. Devi is on dessert!", location: "Living room", startsAt: daysAhead(3), createdBy: U.devi, rsvps: { [U.devi]: "going", [U.arun]: "going", [U.rahul]: "maybe" }, createdAt: daysAgo(2) },
      { id: eid(2), householdId: HID, title: "Landlord visit", description: "Annual inspection — keep common areas tidy.", location: "Green Villa", startsAt: daysAhead(9), createdBy: U.sakthi, rsvps: { [U.sakthi]: "going" }, createdAt: daysAgo(1) },
      { id: eid(3), householdId: HID, title: "Housewarming", description: "Small get-together with friends.", location: "Rooftop", startsAt: daysAgo(12), createdBy: U.arun, rsvps: { [U.sakthi]: "going", [U.devi]: "going", [U.arun]: "going", [U.rahul]: "no" }, createdAt: daysAgo(20) },
    ],
    galleryPhotos: [
      photo(1, scene("#312e81", "#6d5ef0", "#fbbf24"), "Sunset from the balcony", U.sakthi),
      photo(2, scene("#064e3b", "#10b981", "#fde68a"), "Garden morning", U.devi),
      photo(3, scene("#7c2d12", "#f97316", "#fff7ed"), "Rooftop evening", U.arun),
    ],
  };
}

export function buildSeedGeo(): { locations: MemberLocation[]; stories: [] } {
  const at = (userId: string, lat: number, lng: number, minsAgo: number): MemberLocation => ({
    userId, householdId: HID, lat, lng, accuracy: 25, sharing: true, updatedAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
  });
  return {
    locations: [at(U.devi, 12.9279, 77.6271, 4), at(U.arun, 12.9716, 77.5946, 18), at(U.rahul, 12.9352, 77.6245, 1)],
    stories: [],
  };
}

export function buildSeed(): Db {
  counter = 0;
  const names: [string, string, string][] = [
    [U.sakthi, "Sakthi", "9876500001"], [U.devi, "Devi", "9876500002"],
    [U.arun, "Arun", "9876500003"], [U.rahul, "Rahul", "9876500004"],
  ];
  const users: User[] = names.map(([userId, name, phone], i) => ({
    id: userId, name, email: `${name.toLowerCase()}@roomies.local`, phone,
    passwordHash: mockHash(DEMO_PASSWORD), avatarColor: AVATAR_COLORS[i], createdAt: daysAgo(90),
  }));
  const members: HouseholdMember[] = ALL.map((userId, i) => ({
    id: id("m0000000"), householdId: HID, userId, role: i === 0 ? "OWNER" : "MEMBER", joinedAt: daysAgo(90),
  }));

  const r = recent;
  const expenses: Expense[] = [
    expense("Monthly Rent", 24000, "Rent", r(8), U.sakthi, ALL, "Monthly rent to landlord"),
    expense("Electricity Bill", 2448, "Electricity", r(6), U.devi),
    expense("Wi-Fi Fibre Plan", 996, "Internet", r(5), U.arun),
    expense("BigBasket Groceries", 3640, "Groceries", r(4), U.rahul),
    expense("Pizza Night", 1470, "Food", r(3), U.sakthi, [U.sakthi, U.devi, U.arun]),
    expense("Cleaning Supplies", 620, "Cleaning", r(3), U.devi),
    expense("Water Can Refills", 360, "Water", r(2), U.arun),
    expense("Cab to Airport", 840, "Transport", r(2), U.rahul, [U.rahul, U.sakthi]),
    expense("New Study Lamp", 1800, "Furniture", r(1), U.sakthi, [U.sakthi, U.devi]),
    expense("Plumber Visit", 748, "Maintenance", r(1), U.arun),
    expense("Weekend Groceries", 2212, "Groceries", r(0), U.devi),
    // Earlier months feed the trend chart and the "vs last month" delta.
    expense("Monthly Rent", 24000, "Rent", monthsBack(1, 5), U.sakthi),
    expense("Electricity Bill", 2320, "Electricity", monthsBack(1, 7), U.devi),
    expense("Wi-Fi Fibre Plan", 996, "Internet", monthsBack(1, 8), U.arun),
    expense("Groceries", 6800, "Groceries", monthsBack(1, 14), U.rahul),
    expense("Swiggy Dinner", 1260, "Food", monthsBack(1, 20), U.rahul),
    expense("Cleaning Supplies", 560, "Cleaning", monthsBack(1, 24), U.devi),
    expense("Monthly Rent", 24000, "Rent", monthsBack(2, 5), U.sakthi),
    expense("Electricity Bill", 2800, "Electricity", monthsBack(2, 8), U.devi),
    expense("Groceries", 4800, "Groceries", monthsBack(2, 15), U.rahul),
    expense("Monthly Rent", 24000, "Rent", monthsBack(3, 5), U.sakthi),
    expense("Groceries", 3900, "Groceries", monthsBack(3, 16), U.arun),
    expense("Monthly Rent", 24000, "Rent", monthsBack(4, 5), U.sakthi),
    expense("Groceries", 4200, "Groceries", monthsBack(4, 12), U.devi),
  ];

  const payments: Payment[] = [
    { id: id("p0000000"), householdId: HID, fromUserId: U.devi, toUserId: U.sakthi, amount: 6000, method: "UPI", note: "Rent share", createdAt: daysAgo(r(5)) },
    { id: id("p0000000"), householdId: HID, fromUserId: U.rahul, toUserId: U.sakthi, amount: 4500, method: "UPI", note: "Part of rent", createdAt: daysAgo(r(4)) },
    { id: id("p0000000"), householdId: HID, fromUserId: U.arun, toUserId: U.devi, amount: 400, method: "Cash", createdAt: daysAgo(r(2)) },
  ];

  // Settle everything before this month so only current activity shows balances.
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const past = expenses.filter((e) => new Date(e.date).getTime() < startOfMonth);
  for (let a = 0; a < ALL.length; a++) {
    for (let b = a + 1; b < ALL.length; b++) {
      // positive => ALL[b] owes ALL[a]
      let bal = 0;
      for (const e of past) {
        if (e.paidBy === ALL[a]) bal += e.splits.find((x) => x.userId === ALL[b])?.amount ?? 0;
        if (e.paidBy === ALL[b]) bal -= e.splits.find((x) => x.userId === ALL[a])?.amount ?? 0;
      }
      bal = Math.round(bal * 100) / 100;
      if (bal !== 0) {
        payments.push({
          id: id("p0000000"), householdId: HID, fromUserId: bal > 0 ? ALL[b] : ALL[a], toUserId: bal > 0 ? ALL[a] : ALL[b],
          amount: Math.abs(bal), method: "UPI", note: "Settled last month", createdAt: daysAgo(monthsBack(1, 28) > 0 ? monthsBack(1, 28) : 1),
        });
      }
    }
  }


  const bill = (title: string, category: ExpenseCategory, amount: number, due: string, paid = false, paidBy?: string): Bill => ({
    id: id("b0000000"), householdId: HID, title, category, amount, dueDate: due, recurring: true,
    paid, paidBy, assignedTo: ALL, createdAt: daysAgo(10),
  });
  const bills: Bill[] = [
    bill("Electricity", "Electricity", 2448, daysAhead(3)),
    bill("Internet", "Internet", 996, daysAhead(8)),
    bill("Water", "Water", 600, daysAhead(11)),
    bill("Rent", "Rent", 24000, daysAhead(14)),
    bill("Maintenance", "Maintenance", 1500, daysAgo(4), true, U.sakthi),
  ];

  const chore = (
    title: string, assignedTo: string, due: string, frequency: Chore["frequency"],
    priority: Chore["priority"], extra: Partial<Chore> = {},
  ): Chore => ({
    id: id("c0000000"), householdId: HID, title, assignedTo, dueDate: due, frequency, priority,
    completed: false, inProgress: false, rotation: frequency === "once" ? [] : ALL, createdAt: daysAgo(14), ...extra,
  });
  const chores: Chore[] = [
    chore("Clean kitchen", U.sakthi, daysAhead(0), "weekly", "high", { description: "Counters, stove, sink and floor" }),
    chore("Take garbage out", U.devi, daysAhead(1), "daily", "medium"),
    chore("Clean bathroom", U.arun, daysAhead(3), "weekly", "medium", { inProgress: true }),
    chore("Clean living room", U.rahul, daysAhead(2), "weekly", "low"),
    chore("Buy groceries", U.devi, daysAhead(4), "weekly", "medium"),
    chore("Pay electricity bill", U.sakthi, daysAhead(3), "monthly", "high"),
    chore("Water the plants", U.arun, daysAgo(2), "weekly", "low"),
    chore("Wash balcony", U.rahul, daysAgo(1), "once", "low", { completed: true }),
  ];

  const shoppingRows: [string, string, string, boolean][] = [
    ["Milk", "2 L", U.devi, false], ["Eggs", "1 tray", U.sakthi, false], ["Rice", "5 kg", U.rahul, false],
    ["Dish soap", "1", U.arun, false], ["Toilet cleaner", "2", U.devi, true], ["Coffee powder", "250 g", U.sakthi, true],
  ];
  const shopping: ShoppingItem[] = shoppingRows.map(([name, quantity, addedBy, purchased]) => ({
    id: id("s0000000"), householdId: HID, name, quantity, addedBy, purchased, createdAt: daysAgo(1),
  }));

  const announcements: Announcement[] = [
    { id: id("a0000000"), householdId: HID, title: "Water maintenance tomorrow", body: "Water maintenance tomorrow 10 AM. Please store water tonight.", authorId: U.sakthi, reactions: { [U.devi]: "👍" }, acknowledgedBy: [U.devi], createdAt: daysAgo(0, 8) },
    { id: id("a0000000"), householdId: HID, title: "Rent due on the 5th", body: "Rent due on 5th. Please settle your share by the 4th.", authorId: U.sakthi, reactions: {}, acknowledgedBy: [U.sakthi, U.arun], createdAt: daysAgo(3) },
    { id: id("a0000000"), householdId: HID, title: "Kitchen etiquette", body: "Please clean kitchen after cooking. Thanks, team!", authorId: U.devi, reactions: { [U.rahul]: "🙌" }, acknowledgedBy: [], createdAt: daysAgo(6) },
  ];

  const notifications: AppNotification[] = [];
  for (const userId of ALL) {
    const mk = (type: AppNotification["type"], title: string, description: string, ago: number, read = false) =>
      notifications.push({ id: id("n0000000"), householdId: HID, userId, type, title, description, read, createdAt: daysAgo(ago, 12) });
    mk("expense_split", "New split expense", "Devi added Weekend Groceries — ₹2,212", 0);
    mk("bill_reminder", "Electricity bill due soon", "₹2,448 is due in 3 days", 0);
    mk("announcement", "New announcement", "Water maintenance tomorrow", 0, true);
    mk("chore_assigned", "Chore assigned", "Kitchen duty is on the board this week", 2, true);
  }

  const receipts: Record<string, Receipt> = {};
  for (const e of expenses) {
    const payer = users.find((u) => u.id === e.paidBy)?.name ?? "";
    receipts[e.id] = {
      receiptNumber: `RM-${e.id.slice(-6)}`, date: e.date, household: "GREEN VILLA",
      description: e.title, amount: e.amount, paidBy: payer, status: "ADDED", expenseId: e.id,
      splitDetails: e.splits.map((s) => ({ name: users.find((u) => u.id === s.userId)?.name ?? "", amount: s.amount })),
    };
  }

  return {
    version: DB_VERSION, users,
    households: [{
      id: HID, name: "Green Villa", address: "12, Lake View Road, Koramangala, Bengaluru", monthlyRent: 24000,
      rentDueDay: 5, rooms: 4, lat: 12.9352, lng: 77.6245, inviteCode: "RM-7X92KP", createdAt: daysAgo(90),
      rules: ["Clean the kitchen after cooking", "Quiet hours 11 PM – 6 AM", "Guests: inform roommates in advance", "Rent by the 5th"],
    }],
    members, expenses, payments, bills, chores, shopping, announcements, notifications,
    invites: [{ id: id("i0000000"), householdId: HID, code: "RM-7X92KP", createdBy: U.sakthi, createdAt: daysAgo(90) }],
    documents: [
      { id: id("d0000000"), householdId: HID, name: "Rental Agreement.pdf", note: "Signed 11-month lease", createdAt: daysAgo(90) },
      { id: id("d0000000"), householdId: HID, name: "Wi-Fi Router Manual", note: "Admin password is on the router sticker", createdAt: daysAgo(60) },
    ],
    ...buildSeedMedia(),
    ...buildSeedGeo(),
    receipts,
    session: { userId: null, householdId: null },
    prefs: {},
  };
}
