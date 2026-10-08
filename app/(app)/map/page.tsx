"use client";

import { Camera, Crosshair, LocateFixed, MapPinOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useActions } from "@/components/AppActions";
import { AddMenu } from "@/components/AddMenu";
import type { MapPerson } from "@/components/map/MapView";
import { StoriesStrip } from "@/components/map/StoriesStrip";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/States";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { relativeTime } from "@/lib/format";
import { requestPermission } from "@/lib/notify";
import { activeStories } from "@/lib/selectors";
import { geoService } from "@/lib/services";
import { initials } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

export default function MapPage() {
  const app = useApp();
  const actions = useActions();
  const toast = useToast();
  const [focus, setFocus] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const stories = useMemo(() => (app ? activeStories(app.db, app.household.id) : []), [app]);
  const people: MapPerson[] = useMemo(() => {
    if (!app) return [];
    return app.db.locations
      .filter((l) => l.householdId === app.household.id && l.sharing)
      .flatMap((l) => {
        const u = app.userById(l.userId);
        if (!u) return [];
        return [{ id: u.id, name: u.id === app.user.id ? "You" : u.name, color: u.avatarColor, photo: u.photo, initials: initials(u.name), lat: l.lat, lng: l.lng,
          hasStory: stories.some((s) => s.userId === u.id), isMe: u.id === app.user.id, updated: relativeTime(l.updatedAt) }];
      });
  }, [app, stories]);

  if (!app) return null;
  const mine = app.db.locations.find((l) => l.userId === app.user.id && l.householdId === app.household.id);
  const sharing = Boolean(mine?.sharing);
  const home = app.household.lat !== undefined && app.household.lng !== undefined ? { lat: app.household.lat, lng: app.household.lng, name: app.household.name } : undefined;

  const locate = async () => {
    if (!("geolocation" in navigator)) return toast.show("Location isn't available on this device.", "error");
    setLocating(true);
    const state = await requestPermission("location");
    if (state !== "granted") { setLocating(false); return toast.show("Location is blocked — allow it in your browser settings.", "error"); }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          geoService.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude, nonce: Date.now() });
          toast.show("Location updated");
        } catch (err) { toast.show(err instanceof Error ? err.message : "Couldn't update location", "error"); }
        setLocating(false);
      },
      () => { setLocating(false); toast.show("Couldn't get your location.", "error"); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const toggleSharing = async (on: boolean) => {
    if (on) {
      const state = await requestPermission("location");
      if (state === "denied") return toast.show("Location is blocked — allow it in your browser settings first.", "error");
      geoService.setSharing(true);
      void locate();
    } else {
      geoService.setSharing(false);
      toast.show("Location sharing off — roommates can't see you", "info");
    }
  };

  return (
    <div>
      <PageHeader title="Map" subtitle="Where everyone is & what they're up to" right={<AddMenu />} />
      <div className="space-y-4 px-4 pt-2 pb-6">
        <StoriesStrip />

        <Card className="flex items-center gap-3 !p-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">{sharing ? <LocateFixed className="h-5 w-5" /> : <MapPinOff className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold">Share my location</p><p className="text-xs text-muted">{sharing ? `Roommates can see you${mine ? ` · updated ${relativeTime(mine.updatedAt)}` : ""}` : "Off — only you can see where you are"}</p></div>
          <Toggle label="Share my location" checked={sharing} onChange={(v) => void toggleSharing(v)} />
        </Card>

        <div className="relative h-[52dvh] min-h-[320px] overflow-hidden rounded-[28px] border border-line shadow-card">
          <MapView people={people} home={home} focus={focus} onSelect={(id) => { const p = people.find((x) => x.id === id); if (p) { setFocus({ lat: p.lat, lng: p.lng, nonce: Date.now() }); if (stories.some((s) => s.userId === id)) actions.viewStory(id); } }} />
          <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
            <button onClick={() => void locate()} disabled={locating} aria-label="Find me on the map" className="flex h-11 w-11 items-center justify-center rounded-full bg-strong/90 text-primary shadow-float backdrop-blur disabled:opacity-60"><Crosshair className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} /></button>
            <button onClick={actions.addStory} aria-label="Share an update" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-ink shadow-float"><Camera className="h-5 w-5" /></button>
          </div>
        </div>

        <section aria-label="Roommates" className="space-y-2.5">
          <h2 className="px-1 text-[15px] font-bold">Roommates</h2>
          {app.members.map(({ user }) => {
            const loc = app.db.locations.find((l) => l.userId === user.id && l.householdId === app.household.id && l.sharing);
            const has = stories.some((s) => s.userId === user.id);
            return (
              <Card key={user.id} className="flex items-center gap-3 !p-3">
                <Avatar user={user} size="md" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.id === app.user.id ? "You" : user.name}</p>
                  <p className="text-xs text-muted">{loc ? `Updated ${relativeTime(loc.updatedAt)}` : "Not sharing location"}</p></div>
                {has && <Button size="sm" variant="soft" onClick={() => actions.viewStory(user.id)}>Update</Button>}
                {loc ? <Button size="sm" variant="secondary" onClick={() => setFocus({ lat: loc.lat, lng: loc.lng, nonce: Date.now() })} aria-label={`Show ${user.name} on map`}>Locate</Button> : <Badge tone="neutral">Hidden</Badge>}
              </Card>
            );
          })}
        </section>
        <p className="px-1 text-xs text-muted">Prototype: positions are stored on this device. Real-time sharing between phones comes with the Supabase step. Map tiles © OpenStreetMap contributors.</p>
      </div>
    </div>
  );
}
