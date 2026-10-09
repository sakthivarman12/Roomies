"use client";

import { Bike, ExternalLink, Loader2, Minus, Plus, Search, ShoppingCart, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { PurchaseSheet } from "@/components/shop/PurchaseSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchBox } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { money } from "@/lib/format";
import { CATALOG, PROVIDERS, priceAt, type CatalogItem } from "@/lib/shopCatalog";
import { cn, sum } from "@/lib/utils";

type Kind = "grocery" | "food";

export default function ShopPage() {
  const app = useApp();
  const [kind, setKind] = useState<Kind>("grocery");
  const [providerId, setProviderId] = useState("zepto");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buy, setBuy] = useState(false);
  const [live, setLive] = useState<CatalogItem[] | null>(null);
  const [liveQuery, setLiveQuery] = useState("");
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error" | "unconfigured">("idle");
  const [liveMsg, setLiveMsg] = useState("");
  const [known, setKnown] = useState<Record<string, CatalogItem>>({});

  const providers = PROVIDERS.filter((p) => p.kind === kind);
  const isInstamart = providerId === "instamart" && kind === "grocery";
  const provider = providers.find((p) => p.id === providerId) ?? providers[0];
  const sample = useMemo(() => CATALOG.filter((i) => i.group === (kind === "food" ? "Food" : "Groceries") && i.name.toLowerCase().includes(q.toLowerCase())), [kind, q]);
  const showLive = isInstamart && live !== null && liveState !== "unconfigured";
  const items = showLive ? live : sample;
  const lines = Object.keys(cart)
    .map((id) => known[id] ?? CATALOG.find((i) => i.id === id))
    .filter((i): i is CatalogItem => Boolean(i))
    .filter((i) => (i.live ? isInstamart : !isInstamart && i.group === (kind === "food" ? "Food" : "Groceries")));
  const subtotal = sum(lines.map((i) => priceAt(i, provider) * cart[i.id]));
  const delivery = subtotal === 0 ? 0 : subtotal >= provider.freeAbove ? 0 : provider.fee;
  const count = sum(lines.map((i) => cart[i.id]));

  if (!app) return null;
  const searchLive = async () => {
    const term = q.trim();
    if (term.length < 2) { setLiveState("error"); setLiveMsg("Type at least 2 letters to search Instamart."); return; }
    setLiveState("loading"); setLiveMsg("");
    try {
      const lat = app.household.lat ?? 12.9716;
      const lon = app.household.lng ?? 77.5946;
      const res = await fetch(`/api/shop/instamart?q=${encodeURIComponent(term)}&lat=${lat}&lon=${lon}&max=12`);
      const body = (await res.json()) as { items?: { id: string; name: string; brand?: string; unit: string; price: number; mrp?: number; inStock: boolean; image?: string; url?: string }[]; message?: string };
      if (res.status === 501) { setLiveState("unconfigured"); setLiveMsg(body.message ?? ""); setLive(null); return; }
      if (!res.ok || !body.items) { setLiveState("error"); setLiveMsg(body.message ?? "Couldn't load Instamart prices."); return; }
      const mapped: CatalogItem[] = body.items.map((r) => ({ id: `im:${r.id}`, name: r.name, unit: r.unit, price: r.price, mrp: r.mrp, image: r.image, inStock: r.inStock, brand: r.brand, url: r.url, group: "Groceries", emoji: "🛒", live: true }));
      setKnown((k) => ({ ...k, ...Object.fromEntries(mapped.map((m) => [m.id, m])) }));
      setLive(mapped); setLiveQuery(term); setLiveState("idle");
    } catch { setLiveState("error"); setLiveMsg("Couldn't reach the price service."); }
  };
  const change = (item: CatalogItem, d: number) => { setKnown((k) => ({ ...k, [item.id]: item })); setCart((c) => { const n = Math.max(0, (c[item.id] ?? 0) + d); const next = { ...c }; if (n) next[item.id] = n; else delete next[item.id]; return next; }); };
  const switchKind = (k: Kind) => { setKind(k); setProviderId(PROVIDERS.find((p) => p.kind === k)!.id); setLive(null); setLiveState("idle"); };

  return (
    <div>
      <PageHeader title="Shopping" back="/profile" subtitle="Groceries & food from quick-delivery apps" />
      <div className="space-y-4 px-4 pt-2 pb-36">
        <Tabs<Kind> label="Shop type" value={kind} onChange={switchKind} options={[{ value: "grocery", label: "Groceries" }, { value: "food", label: "Food delivery" }]} />

        <div role="radiogroup" aria-label="Delivery app" className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
          {providers.map((p) => (
            <button key={p.id} role="radio" aria-checked={provider.id === p.id} onClick={() => { setProviderId(p.id); if (p.id !== "instamart") setLive(null); setLiveState("idle"); }}
              className={cn("w-[150px] shrink-0 rounded-3xl border p-3 text-left transition-all", provider.id === p.id ? "border-primary bg-primary-soft" : "border-line bg-surface")}>
              <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: p.color }}><Zap className="h-4 w-4" /></span>
              <span className="block text-sm font-extrabold leading-tight">{p.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><Bike className="h-3 w-3" />~{p.etaMin} min</span>
              <span className="block text-[11px] font-semibold text-success">Free over {money(p.freeAbove)}</span>
            </button>
          ))}
        </div>
        <p className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium ${showLive ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
          {showLive ? `Live Instamart prices near ${app.household.name} for “${liveQuery}”. Other apps still show sample prices.` : isInstamart && liveState !== "unconfigured" ? "Search to load live Instamart prices (the list below is a sample). Each search fetches fresh prices." : "Sample prices & delivery times for this app. Build your basket, open the app to order, then record & split it here."}
        </p>
        {isInstamart && liveState === "unconfigured" && <p className="rounded-2xl bg-surface2 px-3.5 py-2.5 text-xs text-muted">Live Instamart prices aren&apos;t switched on yet — the owner needs to add a MINDCASE_API_KEY to the server. Showing sample prices.</p>}

        <form onSubmit={(e) => { e.preventDefault(); if (isInstamart) void searchLive(); }} className="flex gap-2">
          <div className="min-w-0 flex-1"><SearchBox value={q} onChange={setQ} placeholder={kind === "food" ? "Search dishes" : isInstamart ? "Search Instamart (e.g. amul milk)" : "Search groceries"} /></div>
          {isInstamart && <Button type="submit" disabled={liveState === "loading"} aria-label="Search Instamart" className="w-12 px-0">{liveState === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}</Button>}
        </form>
        {isInstamart && liveState === "error" && <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-xs font-semibold text-danger">{liveMsg}</p>}

        {items.length === 0 ? <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="Nothing found" description={showLive ? "Instamart has nothing for that here. Try another word." : "Try another search."} /> : (
          <ul className="grid grid-cols-2 gap-3">
            {items.map((i) => (
              <li key={i.id}>
                <Card className="flex h-full flex-col !p-3">
                  {i.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={i.image} alt="" loading="lazy" className="h-20 w-full rounded-xl bg-white object-contain" />
                    : <span className="text-3xl" aria-hidden>{i.emoji}</span>}
                  <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug">{i.name}</p>
                  <p className="text-xs text-muted">{i.unit}{i.inStock === false ? " · Out of stock" : ""}</p>
                  <div className="mt-auto flex items-center justify-between pt-2.5">
                    <span className="tnum text-[15px] font-extrabold">{money(priceAt(i, provider))}{i.mrp && i.mrp > priceAt(i, provider) && <span className="ml-1 text-[11px] font-medium text-muted line-through">{money(i.mrp)}</span>}</span>
                    {cart[i.id] ? (
                      <span className="flex items-center rounded-full bg-primary text-primary-ink">
                        <button aria-label={`Remove one ${i.name}`} onClick={() => change(i, -1)} className="flex h-9 w-9 items-center justify-center"><Minus className="h-4 w-4" /></button>
                        <span className="tnum w-5 text-center text-sm font-bold">{cart[i.id]}</span>
                        <button aria-label={`Add one ${i.name}`} onClick={() => change(i, 1)} className="flex h-9 w-9 items-center justify-center"><Plus className="h-4 w-4" /></button>
                      </span>
                    ) : <Button size="sm" variant="soft" aria-label={`Add ${i.name}`} disabled={i.inStock === false} onClick={() => change(i, 1)}>Add</Button>}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(var(--nav-h)+0.75rem)] z-30 px-4 lg:bottom-6 lg:left-[264px]">
          <div className="mx-auto max-w-[608px] rounded-3xl border border-line bg-strong p-3.5 shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">{count} item{count > 1 ? "s" : ""} · {provider.name}</span>
              <span className="tnum font-extrabold">{money(subtotal + delivery)}</span>
            </div>
            <p className="text-[11px] text-muted">{delivery === 0 ? "Free delivery" : `Delivery ${money(delivery)} · add ${money(provider.freeAbove - subtotal)} more for free delivery`}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <a href={provider.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-line text-sm font-bold"><ExternalLink className="h-4 w-4" />Open {provider.name.split(" ")[0]}</a>
              <Button onClick={() => setBuy(true)}>I ordered — split it</Button>
            </div>
          </div>
        </div>
      )}
      <PurchaseSheet open={buy} onClose={() => setBuy(false)} provider={provider} lines={lines.map((i) => ({ item: i, qty: cart[i.id], price: priceAt(i, provider) }))} total={subtotal + delivery}
        onDone={() => setCart({})} />
    </div>
  );
}
