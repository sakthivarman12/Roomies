import type { ExpenseCategory, PaymentMethod } from "@/types";

export const STORAGE_KEY = "roomies.db.v1";
export const DB_VERSION = 5;

export const CATEGORIES: ExpenseCategory[] = [
  "Rent", "Electricity", "Water", "Internet", "Groceries", "Food",
  "Transport", "Cleaning", "Furniture", "Maintenance", "Other",
];

export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Cash", "Bank Transfer"];

/** Chart/category colour tokens (CSS variables defined in globals.css). */
export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  Rent: "var(--c-indigo)",
  Electricity: "var(--c-amber)",
  Water: "var(--c-sky)",
  Internet: "var(--c-violet)",
  Groceries: "var(--c-green)",
  Food: "var(--c-orange)",
  Transport: "var(--c-teal)",
  Cleaning: "var(--c-pink)",
  Furniture: "var(--c-brown)",
  Maintenance: "var(--c-slate)",
  Other: "var(--c-gray)",
};

export const BREAKDOWN_GROUPS: Record<string, ExpenseCategory[]> = {
  Rent: ["Rent"],
  Electricity: ["Electricity"],
  Internet: ["Internet"],
  Groceries: ["Groceries", "Food"],
  Other: ["Water", "Transport", "Cleaning", "Furniture", "Maintenance", "Other"],
};

export const GROUP_COLOR: Record<string, string> = {
  Rent: "var(--c-indigo)",
  Electricity: "var(--c-amber)",
  Internet: "var(--c-violet)",
  Groceries: "var(--c-green)",
  Other: "var(--c-gray)",
};

export const AVATAR_COLORS = ["#4f46e5", "#0d9488", "#db2777", "#ea580c", "#7c3aed", "#0284c7"];
export const DEMO_PASSWORD = "roomies123";
export const TAGLINE = "Live together. Split smarter.";
