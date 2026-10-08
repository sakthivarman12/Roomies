"use client";

import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AvatarStack } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DatePicker, Input, Textarea } from "@/components/ui/Fields";
import { EmptyState } from "@/components/ui/States";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { useOnOpen } from "@/hooks/useOnOpen";
import { useToast } from "@/components/ui/Toast";
import { canManageHousehold } from "@/lib/permissions";
import { daysFromNow, toInputDate } from "@/lib/format";
import { eventService } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { EventItem, RsvpStatus } from "@/types";

const RSVP: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "Going" }, { value: "maybe", label: "Maybe" }, { value: "no", label: "Can't" },
];

function EventCard({ event, past }: { event: EventItem; past: boolean }) {
  const app = useApp();
  const run = useAction();
  if (!app) return null;
  const d = new Date(event.startsAt);
  const mine = event.rsvps[app.user.id];
  const going = Object.entries(event.rsvps).filter(([, s]) => s === "going").map(([id]) => app.userById(id)).filter((u) => !!u);
  const canDelete = event.createdBy === app.user.id || canManageHousehold(app.db, app.user, app.household.id);

  return (
    <Card className={cn(past && "opacity-70")}>
      <div className="flex items-start gap-3.5">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <span className="text-[10px] font-extrabold uppercase">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
          <span className="text-xl font-black leading-none">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-snug">{event.title}</h3>
          <p className="text-xs text-muted">{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · by {app.nameOf(event.createdBy)}</p>
          {event.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3.5 w-3.5" />{event.location}</p>}
        </div>
        {canDelete && <button onClick={() => run(() => eventService.remove(event.id), "Event deleted")} aria-label={`Delete ${event.title}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
      </div>
      {event.description && <p className="mt-3 text-sm text-muted">{event.description}</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        {going.length > 0 ? <div className="flex items-center gap-2"><AvatarStack users={going as NonNullable<(typeof going)[number]>[]} /><span className="text-xs font-semibold text-muted">{going.length} going</span></div> : <span className="text-xs text-muted">No RSVPs yet</span>}
      </div>
      {!past && (
        <div role="group" aria-label={`RSVP for ${event.title}`} className="mt-3 grid grid-cols-3 gap-2">
          {RSVP.map((r) => (
            <Button key={r.value} size="sm" variant={mine === r.value ? "primary" : "secondary"} aria-pressed={mine === r.value} onClick={() => run(() => eventService.rsvp(event.id, r.value))}>{r.label}</Button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function EventSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toInputDate(new Date()));
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useOnOpen(open, () => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    setTitle(""); setDate(toInputDate(d)); setTime("19:00"); setLocation(""); setDescription(""); setError("");
  });

  const submit = () => {
    try {
      const [y, m, day] = date.split("-").map(Number);
      const [hh, mm] = time.split(":").map(Number);
      eventService.create({ title, location, description, startsAt: new Date(y, m - 1, day, hh || 0, mm || 0).toISOString() });
      toast.show("Event created");
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't create event."); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="New event" description="Everyone in the house will be notified"
      footer={<Button size="lg" block onClick={submit}>Create event</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="House dinner night" />
        <div className="grid grid-cols-2 gap-3">
          <DatePicker label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Living room" />
        <Textarea label="Details (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}

export function EventsPanel() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  if (!app) return null;
  const all = app.db.events.filter((e) => e.householdId === app.household.id);
  const upcoming = all.filter((e) => daysFromNow(e.startsAt) >= 0).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = all.filter((e) => !upcoming.includes(e)).sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  return (
    <div className="space-y-5">
      <Button variant="soft" block onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add event</Button>
      {all.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="No events yet" description="Plan a house dinner, a visit or a party." actionLabel="Add event" onAction={() => setOpen(true)} />
      ) : (
        <>
          <section aria-label="Upcoming events" className="space-y-3">
            <h2 className="px-1 text-[15px] font-bold">Upcoming</h2>
            {upcoming.length === 0 ? <Card className="text-center text-sm text-muted">Nothing planned. Add something fun!</Card> : upcoming.map((e) => <EventCard key={e.id} event={e} past={false} />)}
          </section>
          {past.length > 0 && (
            <section aria-label="Past events" className="space-y-3">
              <h2 className="px-1 text-[15px] font-bold">Past</h2>
              {past.map((e) => <EventCard key={e.id} event={e} past />)}
            </section>
          )}
        </>
      )}
      <EventSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
