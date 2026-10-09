import type { ExpenseCategory } from "@/types";

/**
 * SAMPLE catalogue. Roomies can't read live prices or place orders on Swiggy/Zepto/etc. (they have no public APIs for that),
 * so prices and delivery times below are illustrative. "Order" opens the real app/site; the purchase is then recorded here and split.
 */
export interface Provider {
  id: string;
  name: string;
  kind: "grocery" | "food";
  url: string;
  tagline: string;
  /** price multiplier vs. the base price */
  factor: number;
  etaMin: number;
  freeAbove: number; // free delivery above this cart value (₹)
  fee: number;
  color: string;
}

export const PROVIDERS: Provider[] = [
  { id: "zepto", name: "Zepto", kind: "grocery", url: "https://www.zeptonow.com", tagline: "10-minute groceries", factor: 1.0, etaMin: 10, freeAbove: 199, fee: 25, color: "#7c3aed" },
  { id: "instamart", name: "Swiggy Instamart", kind: "grocery", url: "https://www.swiggy.com/instamart", tagline: "Groceries in minutes", factor: 1.02, etaMin: 15, freeAbove: 199, fee: 30, color: "#f97316" },
  { id: "blinkit", name: "Blinkit", kind: "grocery", url: "https://blinkit.com", tagline: "Everything in minutes", factor: 1.01, etaMin: 12, freeAbove: 199, fee: 25, color: "#eab308" },
  { id: "amazon", name: "Amazon Fresh / Now", kind: "grocery", url: "https://www.amazon.in/fresh", tagline: "Fresh & quick delivery", factor: 0.97, etaMin: 45, freeAbove: 149, fee: 29, color: "#0ea5e9" },
  { id: "swiggy", name: "Swiggy", kind: "food", url: "https://www.swiggy.com", tagline: "Food delivery", factor: 1.0, etaMin: 30, freeAbove: 299, fee: 35, color: "#ea580c" },
  { id: "zomato", name: "Zomato", kind: "food", url: "https://www.zomato.com", tagline: "Food delivery", factor: 1.03, etaMin: 32, freeAbove: 299, fee: 35, color: "#dc2626" },
];

export interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  group: "Groceries" | "Food";
  emoji: string;
  /** Set for live results (e.g. Instamart via Mindcase): price is already the store price. */
  live?: boolean;
  mrp?: number;
  image?: string;
  inStock?: boolean;
  brand?: string;
  url?: string;
}

export const CATALOG: CatalogItem[] = [
  { id: "milk", name: "Toned milk", unit: "1 L", price: 56, group: "Groceries", emoji: "🥛" },
  { id: "eggs", name: "Farm eggs", unit: "12 pcs", price: 96, group: "Groceries", emoji: "🥚" },
  { id: "bread", name: "Brown bread", unit: "400 g", price: 48, group: "Groceries", emoji: "🍞" },
  { id: "rice", name: "Sona masoori rice", unit: "5 kg", price: 340, group: "Groceries", emoji: "🍚" },
  { id: "atta", name: "Whole wheat atta", unit: "5 kg", price: 245, group: "Groceries", emoji: "🌾" },
  { id: "dal", name: "Toor dal", unit: "1 kg", price: 165, group: "Groceries", emoji: "🫘" },
  { id: "oil", name: "Sunflower oil", unit: "1 L", price: 142, group: "Groceries", emoji: "🛢️" },
  { id: "tomato", name: "Tomatoes", unit: "1 kg", price: 44, group: "Groceries", emoji: "🍅" },
  { id: "onion", name: "Onions", unit: "1 kg", price: 38, group: "Groceries", emoji: "🧅" },
  { id: "banana", name: "Bananas", unit: "6 pcs", price: 42, group: "Groceries", emoji: "🍌" },
  { id: "coffee", name: "Filter coffee powder", unit: "250 g", price: 185, group: "Groceries", emoji: "☕" },
  { id: "water", name: "Drinking water can", unit: "20 L", price: 70, group: "Groceries", emoji: "💧" },
  { id: "soap", name: "Dish wash liquid", unit: "750 ml", price: 135, group: "Groceries", emoji: "🧼" },
  { id: "biryani", name: "Chicken biryani", unit: "1 plate", price: 260, group: "Food", emoji: "🍛" },
  { id: "pizza", name: "Margherita pizza", unit: "medium", price: 299, group: "Food", emoji: "🍕" },
  { id: "burger", name: "Veg burger combo", unit: "1 combo", price: 189, group: "Food", emoji: "🍔" },
  { id: "dosa", name: "Masala dosa", unit: "2 pcs", price: 140, group: "Food", emoji: "🥞" },
  { id: "noodles", name: "Hakka noodles", unit: "1 bowl", price: 175, group: "Food", emoji: "🍜" },
  { id: "paneer", name: "Paneer butter masala + naan", unit: "1 meal", price: 285, group: "Food", emoji: "🧈" },
  { id: "icecream", name: "Ice-cream tub", unit: "500 ml", price: 220, group: "Food", emoji: "🍨" },
];

export function priceAt(item: CatalogItem, provider: Provider): number {
  return item.live ? item.price : Math.round(item.price * provider.factor);
}

export function categoryFor(group: CatalogItem["group"]): ExpenseCategory {
  return group === "Food" ? "Food" : "Groceries";
}
