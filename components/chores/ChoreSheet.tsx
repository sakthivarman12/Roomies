"use client";

import { useState } from "react";
import { useOnOpen } from "@/hooks/useOnOpen";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PersonChips } from "@/components/ui/Chips";
import { DatePicker, Input, Select, Textarea } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/hooks/useApp";
import { fromInputDate, toInputDate } from "@/lib/format";
import { choreService } from "@/lib/services";
import type { Chore, Frequency, Priority } from "@/types";

export function ChoreSheet({ open, onClose, chore }: { open: boolean; onClose: () => void; chore?: Chore | null }) {
  const app = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [due, setDue] = useState(toInputDate(new Date()));
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [priority, setPriority] = useState<Priority>("medium");
  const [rotation, setRotation] = useState<string[]>([]);
  const [error, setError] = useState("");

  useOnOpen(open, () => {
    if (!app) return;
    if (chore) {
      setTitle(chore.title); setDescription(chore.description ?? ""); setAssignedTo(chore.assignedTo); setDue(toInputDate(chore.dueDate));
      setFrequency(chore.frequency); setPriority(chore.priority); setRotation(chore.rotation);
    } else {
      setTitle(""); setDescription(""); setAssignedTo(app.user.id); setDue(toInputDate(new Date())); setFrequency("weekly"); setPriority("medium");
      setRotation(app.members.map((m) => m.user.id));
    }
    setError("");
  });

  if (!app) return null;
  const submit = () => {
    try {
      const input = { title, description, assignedTo, dueDate: fromInputDate(due), frequency, priority, rotation };
      if (chore) { choreService.update(chore.id, input); toast.show("Chore updated"); }
      else { choreService.create(input); toast.show("Chore added"); }
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't save chore."); }
  };
  const people = app.members.map((m) => m.user);

  return (
    <BottomSheet open={open} onClose={onClose} title={chore ? "Edit chore" : "Add chore"} description="Keep the house running smoothly"
      footer={<Button size="lg" block onClick={submit}>{chore ? "Save changes" : "Add chore"}</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Chore" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clean kitchen" />
        <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div><p className="mb-2 px-1 text-[13px] font-semibold text-muted">Assigned to</p>
          <PersonChips single label="Assigned to" people={people} selected={[assignedTo]} onToggle={setAssignedTo} meId={app.user.id} /></div>
        <div className="grid grid-cols-2 gap-3">
          <DatePicker label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} options={[{ value: "once", label: "One-time" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />
        </div>
        <div><p className="mb-2 px-1 text-[13px] font-semibold text-muted">Priority</p>
          <SegmentedControl<Priority> label="Priority" value={priority} onChange={setPriority} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} /></div>
        {frequency !== "once" && (
          <div><p className="mb-1 px-1 text-[13px] font-semibold text-muted">Rotate between</p>
            <p className="mb-2 px-1 text-xs text-muted">When completed, the next turn goes to the next person in this list.</p>
            <PersonChips label="Rotation" people={people} selected={rotation} meId={app.user.id}
              onToggle={(id) => setRotation((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))} /></div>
        )}
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
