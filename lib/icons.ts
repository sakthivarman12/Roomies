import {
  Bell, Bike, Zap, CalendarClock, Car, Droplets, HandCoins, Hammer, Home, Megaphone, Receipt, ShoppingBasket,
  Sofa, SprayCan, Utensils, Wifi, ClipboardCheck, type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory, NotificationType } from "@/types";

export const CATEGORY_ICON: Record<ExpenseCategory, LucideIcon> = {
  Rent: Home, Electricity: Zap, Water: Droplets, Internet: Wifi, Groceries: ShoppingBasket, Food: Utensils,
  Transport: Car, Cleaning: SprayCan, Furniture: Sofa, Maintenance: Hammer, Other: Receipt,
};

export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  expense_added: Receipt, expense_split: Receipt, payment_received: HandCoins, payment_requested: HandCoins,
  chore_assigned: ClipboardCheck, chore_overdue: Bike, bill_reminder: CalendarClock, announcement: Megaphone,
};

export const FALLBACK_ICON = Bell;
