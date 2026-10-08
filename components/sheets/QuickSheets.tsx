"use client";

import { ImagePlus, Video } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import { useOnOpen } from "@/hooks/useOnOpen";
import { processMediaFile } from "@/lib/media";
import { galleryService, houseService } from "@/lib/services";

interface SheetProps { open: boolean; onClose: () => void }

function ErrorLine({ error }: { error: string }) {
  return error ? <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null;
}

export function ShoppingSheet({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setName(""); setQty(""); setError(""); });
  const submit = () => {
    try { houseService.addShoppingItem(name, qty); toast.show("Added to shopping list"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't add item."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Shopping item" description="Add something the house needs"
      footer={<Button size="lg" block onClick={submit}>Add to list</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Item" value={name} onChange={(e) => setName(e.target.value)} placeholder="Milk" />
        <Input label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="2 L" />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

export function DocumentSheet({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useOnOpen(open, () => { setName(""); setNote(""); setError(""); });
  const submit = () => {
    try { houseService.addDocument(name, note); toast.show("Document saved"); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't save document."); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="Add document" description="Save the name and a note for now"
      footer={<Button size="lg" block onClick={submit}>Save document</Button>}>
      <div className="space-y-4 pb-2 pt-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rental agreement" />
        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where it's kept, expiry, etc." />
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}

/** Add photos/videos straight to the household gallery (stored in the app, not on the phone). */
export function PhotosSheet({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useOnOpen(open, () => { setBusy(false); setError(""); });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      const items = await Promise.all([...files].map((f) => processMediaFile(f)));
      galleryService.add(items.map((m) => ({ src: m.src ?? "", kind: m.kind, mediaId: m.mediaId })), false);
      toast.show(`${items.length} item${items.length > 1 ? "s" : ""} added to Gallery`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add those files.");
    } finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to gallery" description="Saved in Roomies, not in your phone's camera roll">
      <div className="space-y-3 pb-3 pt-2">
        <label className="flex min-h-[64px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-primary-soft text-sm font-bold text-primary">
          <ImagePlus className="h-5 w-5" /> {busy ? "Adding…" : "Choose photos or videos"}
          <input type="file" accept="image/*,video/*" multiple disabled={busy} className="sr-only" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
        <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-line text-sm font-bold">
          <Video className="h-5 w-5" /> Take a photo or video
          <input type="file" accept="image/*,video/*" capture="environment" disabled={busy} className="sr-only" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
        <ErrorLine error={error} />
      </div>
    </BottomSheet>
  );
}
