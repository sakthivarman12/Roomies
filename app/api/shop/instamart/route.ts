import { NextResponse, type NextRequest } from "next/server";

/**
 * Live Instamart product search through the Mindcase data API.
 * The API key stays on the server (MINDCASE_API_KEY) and never reaches the browser.
 * Docs: https://api.mindcase.co — agent "instamart/products", billed per returned product.
 */
export const dynamic = "force-dynamic";

const MINDCASE_URL = "https://api.mindcase.co/v1/data/instamart/products/run?wait=true&wait_timeout=45";
const MAX_RESULTS = 24;

interface MindcaseRow {
  productName?: string;
  brand?: string;
  variantId?: string;
  productId?: string;
  price?: number;
  mrp?: number;
  discount?: number | string;
  packSize?: string;
  inStock?: boolean;
  rating?: number;
  images?: string[] | string;
  productUrl?: string;
}

interface MindcaseResponse {
  status?: string;
  error?: string;
  data?: MindcaseRow[];
}

// Best-effort abuse guard (per server instance): the endpoint spends prepaid Mindcase credits.
const hits = new Map<string, number[]>();
const LIMIT = 8;
const WINDOW_MS = 60_000;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > LIMIT;
}

function num(v: string | null, min: number, max: number): number | null {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function firstImage(images: MindcaseRow["images"]): string | undefined {
  const src = Array.isArray(images) ? images[0] : images;
  return typeof src === "string" && /^https:\/\//.test(src) ? src : undefined;
}

export async function GET(req: NextRequest) {
  const key = process.env.MINDCASE_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured", message: "Live Instamart prices need MINDCASE_API_KEY on the server." }, { status: 501 });

  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return NextResponse.json({ error: "forbidden", message: "Same-origin requests only." }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited", message: "Too many searches — try again in a minute." }, { status: 429 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 60) return NextResponse.json({ error: "bad_query", message: "Search for 2–60 characters." }, { status: 400 });

  const lat = num(req.nextUrl.searchParams.get("lat"), -90, 90);
  const lon = num(req.nextUrl.searchParams.get("lon"), -180, 180);
  if (lat === null || lon === null) return NextResponse.json({ error: "bad_location", message: "A delivery location (lat/lon) is required." }, { status: 400 });
  const max = Math.min(num(req.nextUrl.searchParams.get("max"), 1, MAX_RESULTS) ?? 12, MAX_RESULTS);

  try {
    const res = await fetch(MINDCASE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ params: { query: q, lat, lon, maxResults: max } }),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });
    if (res.status === 401) return NextResponse.json({ error: "unauthorized", message: "The Mindcase API key was rejected." }, { status: 502 });
    if (res.status === 402) return NextResponse.json({ error: "no_balance", message: "The Mindcase wallet is out of balance." }, { status: 502 });
    if (res.status === 429) return NextResponse.json({ error: "rate_limited", message: "Too many searches — try again in a minute." }, { status: 429 });
    const body = (await res.json()) as MindcaseResponse;
    if (!res.ok || body.status === "failed" || body.status === "cancelled" || body.status === "rejected_balance") {
      return NextResponse.json({ error: "upstream", message: body.error ?? `Instamart search failed (${body.status ?? res.status}).` }, { status: 502 });
    }
    if (body.status !== "completed") return NextResponse.json({ error: "slow", message: "Instamart is taking too long. Try again." }, { status: 504 });

    const items = (body.data ?? []).filter((r) => r.productName && typeof r.price === "number").map((r) => ({
      id: String(r.variantId ?? r.productId ?? r.productName),
      name: r.productName as string,
      brand: r.brand,
      unit: r.packSize ?? "",
      price: Math.round(r.price as number),
      mrp: typeof r.mrp === "number" ? Math.round(r.mrp) : undefined,
      inStock: r.inStock !== false,
      image: firstImage(r.images),
      url: r.productUrl && /^https:\/\//.test(r.productUrl) ? r.productUrl : undefined,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json({ error: timeout ? "slow" : "network", message: timeout ? "Instamart is taking too long. Try again." : "Couldn't reach the price service." }, { status: 504 });
  }
}
