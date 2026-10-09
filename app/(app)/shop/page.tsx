"use client";

import { Bike, ExternalLink, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
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

  const providers = PROVIDERS.filter((p) => p.kind === kind);
  const provider = providers.find((p) => p.id === providerId) ?? providers[0];
  const items = useMemo(() => CATALOG.filter((i) => i.group === (kind === "food" ? "Food" : "Groceries") && i.name.toLowerCase().includes(q.toLowerCase())), [kind, q]);
  const lines = CATALOG.filter((i) => cart[i.id] && i.group === (kind === "food" ? "Food" : "Groceries"));
  const subtotal = sum(lines.map((i) => priceAt(i, provider) * cart[i.id]));
  const delivery = subtotal === 0 ? 0 : subtotal >= provider.freeAbove ? 0 : provider.fee;
  const count = sum(lines.map((i) => cart[i.id]));

  if (!app) return null;
  const change = (item: CatalogItem, d: number) => setCart((c) => { const n = Math.max(0, (c[item.id] ?? 0) + d); const next = { ...c }; if (n) next[item.id] = n; else delete next[item.id]; return next; });
  const switchKind = (k: Kind) => { setKind(k); setProviderId(PROVIDERS.find((p) => p.kind === k)!.id); };

  return (
    <div>
      <PageHeader title="Shopping" back="/profile" subtitle="Groceries & food from quick-delivery apps" />
      <div className="space-y-4 px-4 pt-2 pb-36">
        <Tabs<Kind> label="Shop type" value={kind} onChange={switchKind} options={[{ value: "grocery", label: "Groceries" }, { value: "food", label: "Food delivery" }]} />

        <div role="radiogroup" aria-label="Delivery app" className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
          {providers.map((p) => (
            <button key={p.id} role="radio" aria-checked={provider.id === p.id} onClick={() => setProviderId(p.id)}
              className={cn("w-[150px] shrink-0 rounded-3xl border p-3 text-left transition-all", provider.id === p.id ? "border-primary bg-primary-soft" : "border-line bg-surface")}>
              <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: p.color }}><Zap className="h-4 w-4" /></span>
              <span className="block text-sm font-extrabold leading-tight">{p.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted"><Bike className="h-3 w-3" />~{p.etaMin} min</span>
              <span className="block text-[11px] font-semibold text-success">Free over {money(p.freeAbove)}</span>
            </button>
          ))}
        </div>
        <p className="rounded-2xl bg-warning-soft px-3.5 py-2.5 text-xs font-medium text-warning">Sample prices &amp; delivery times — Roomies can&apos;t read live prices from these apps. Build your basket, open the app to order, then record &amp; split it here.</p>

        <SearchBox value={q} onChange={setQ} placeholder={kind === "food" ? "Search dishes" : "Search groceries"} />

        {items.length === 0 ? <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="Nothing found" description="Try another search." /> : (
          <ul className="grid grid-cols-2 gap-3">
            {items.map((i) => (
              <li key={i.id}>
                <Card className="flex h-full flex-col !p-3">
                  <span className="text-3xl" aria-hidden>{i.emoji}</span>
                  <p className="mt-1.5 text-sm font-bold leading-snug">{i.name}</p>
                  <p className="text-xs text-muted">{i.unit}</p>
                  <div className="mt-auto flex items-center justify-between pt-2.5">
                    <span className="tnum text-[15px] font-extrabold">{money(priceAt(i, provider))}</span>
                    {cart[i.id] ? (
                      <span className="flex items-center rounded-full bg-primary text-primary-ink">
                        <button aria-label={`Remove one ${i.name}`} onClick={() => change(i, -1)} className="flex h-9 w-9 items-center justify-center"><Minus className="h-4 w-4" /></button>
                        <span className="tnum w-5 text-center text-sm font-bold">{cart[i.id]}</span>
                        <button aria-label={`Add one ${i.name}`} onClick={() => change(i, 1)} className="flex h-9 w-9 items-center justify-center"><Plus className="h-4 w-4" /></button>
                      </span>
                    ) : <Button size="sm" variant="soft" aria-label={`Add ${i.name}`} onClick={() => change(i, 1)}>Add</Button>}
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
