import { money } from "@/lib/format";
import type { Db } from "@/types";

export interface ActivityItem {
  id: string;
  kind: "expense" | "payment" | "announcement" | "chore";
  actorId: string;
  text: string;
  date: string;
  href?: string;
}

export function activityFeed(db: Db, householdId: string, limit = 8): ActivityItem[] {
  const name = (id: string) => db.users.find((u) => u.id === id)?.name ?? "Someone";
  const items: ActivityItem[] = [];
  for (const e of db.expenses.filter((x) => x.householdId === householdId)) {
    items.push({ id: `e-${e.id}`, kind: "expense", actorId: e.paidBy, text: `${name(e.paidBy)} paid ${money(e.amount)} for ${e.title}`, date: e.createdAt, href: `/expenses/${e.id}` });
  }
  for (const p of db.payments.filter((x) => x.householdId === householdId)) {
    items.push({ id: `p-${p.id}`, kind: "payment", actorId: p.fromUserId, text: `${name(p.fromUserId)} paid ${name(p.toUserId)} ${money(p.amount)}`, date: p.createdAt });
  }
  for (const a of db.announcements.filter((x) => x.householdId === householdId)) {
    items.push({ id: `a-${a.id}`, kind: "announcement", actorId: a.authorId, text: `${name(a.authorId)} posted “${a.title}”`, date: a.createdAt, href: "/house" });
  }
  return items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, limit);
}
