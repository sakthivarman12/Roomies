"use client";

import { useState } from "react";
import { Announcements } from "@/components/room/Announcements";
import { HouseOverview } from "@/components/room/HouseOverview";
import { RoommatesPanel } from "@/components/room/RoommatesPanel";
import { ShoppingList } from "@/components/room/ShoppingList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { useApp } from "@/hooks/useApp";
import { money } from "@/lib/format";
import { monthTotal } from "@/lib/selectors";

type Tab = "overview" | "roommates" | "shopping" | "notices";

export default function HousePage() {
  const app = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  if (!app) return null;
  const { household } = app;

  return (
    <div>
      <PageHeader title={household.name.toUpperCase()} subtitle={`${app.members.length} roommates · ${money(monthTotal(app.db, household.id))} this month`} />
      <div className="space-y-5 px-4 pt-2 pb-6">
        <Tabs<Tab> label="House sections" value={tab} onChange={setTab} options={[
          { value: "overview", label: "Overview" }, { value: "roommates", label: "Roommates", count: app.members.length },
          { value: "shopping", label: "Shopping" }, { value: "notices", label: "Announcements" },
        ]} />
        {tab === "overview" && <HouseOverview />}
        {tab === "roommates" && <RoommatesPanel />}
        {tab === "shopping" && <ShoppingList />}
        {tab === "notices" && <Announcements />}
      </div>
    </div>
  );
}
