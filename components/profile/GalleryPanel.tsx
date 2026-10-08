"use client";

import { motion } from "framer-motion";
import { EyeOff, ImagePlus, Images, Lock, MonitorPlay, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/States";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { resizeImage } from "@/lib/image";
import { galleryService } from "@/lib/services";
import type { GalleryPhoto } from "@/types";

type Folder = "all" | "hidden";

export function GalleryPanel() {
  const app = useApp();
  const run = useAction();
  const toast = useToast();
  const [folder, setFolder] = useState<Folder>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!app) return null;

  const unlocked = Boolean(app.prefs.hiddenUnlocked);
  // Hidden photos are private to whoever added them.
  const mine = app.db.galleryPhotos.filter((p) => p.householdId === app.household.id);
  const shared = mine.filter((p) => !p.hidden);
  const hidden = mine.filter((p) => p.hidden && p.addedBy === app.user.id);
  const inHidden = unlocked && folder === "hidden";
  const list: GalleryPhoto[] = inHidden ? hidden : shared;
  const current = openId ? mine.find((p) => p.id === openId && (!p.hidden || (unlocked && p.addedBy === app.user.id))) ?? null : null;
  const bgCount = shared.filter((p) => p.useAsBackground).length;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const srcs = await Promise.all([...files].map((f) => resizeImage(f)));
      run(() => galleryService.add(srcs.map((src) => ({ src })), inHidden), `${srcs.length} photo${srcs.length > 1 ? "s" : ""} added${inHidden ? " to hidden folder" : ""}`);
    } catch {
      toast.show("Couldn't add those photos. They may be too large for local storage.", "error");
    } finally {
      setBusy(false);
    }
  };

  const canEdit = current ? current.addedBy === app.user.id || (!current.hidden && app.canManage) : false;

  return (
    <div className="space-y-4">
      {unlocked && (
        <SegmentedControl<Folder> label="Gallery folder" value={folder} onChange={setFolder}
          options={[{ value: "all", label: `Photos · ${shared.length}` }, { value: "hidden", label: `Hidden · ${hidden.length}` }]} />
      )}
      {inHidden && <p className="flex items-center gap-2 rounded-2xl bg-violet-soft px-4 py-3 text-xs font-semibold text-violet"><Lock className="h-4 w-4 shrink-0" />Only you can see this folder. Triple-tap the Gallery tab to lock it again.</p>}

      <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-soft text-sm font-bold text-primary">
        <ImagePlus className="h-5 w-5" /> {busy ? "Adding…" : inHidden ? "Add to hidden folder" : "Add photos"}
        <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      </label>

      {!inHidden && <p className="px-1 text-xs text-muted">{bgCount > 0 ? `${bgCount} photo${bgCount > 1 ? "s" : ""} slowly rotate behind your Home screen.` : "Open a photo and switch on “Home background” to see it behind Home."}</p>}

      {list.length === 0 ? (
        <EmptyState icon={inHidden ? <EyeOff className="h-7 w-7" /> : <Images className="h-7 w-7" />} title={inHidden ? "Hidden folder is empty" : "No photos yet"} description={inHidden ? "Photos you hide are only visible to you." : "Share moments from the house."} />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {list.map((p, i) => (
            <motion.li key={p.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
              <button onClick={() => setOpenId(p.id)} aria-label={p.caption ? `Open photo: ${p.caption}` : "Open photo"} className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-surface2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.caption ?? "House photo"} loading="lazy" className="h-full w-full object-cover" />
                {p.useAsBackground && <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" title="Used as Home background"><MonitorPlay className="h-3.5 w-3.5" /></span>}
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(current)} onClose={() => setOpenId(null)} title={current?.caption || "Photo"} description={current ? `Added by ${app.nameOf(current.addedBy)}` : undefined}>
        {current && (
          <div className="space-y-4 pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.caption ?? "House photo"} className="max-h-[50dvh] w-full rounded-2xl object-contain bg-surface2" />
            {!current.hidden && (
              <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
                <MonitorPlay className="h-5 w-5 text-primary" />
                <div className="flex-1"><p className="text-sm font-bold">Home background</p><p className="text-xs text-muted">Fades in slowly behind Home</p></div>
                <Toggle label="Use as Home background" checked={current.useAsBackground} onChange={(v) => run(() => galleryService.setBackground(current.id, v))} />
              </div>
            )}
            {current.addedBy === app.user.id && unlocked && (
              <Button variant="secondary" block onClick={() => { run(() => galleryService.setHidden(current.id, !current.hidden), current.hidden ? "Moved back to Photos" : "Moved to hidden folder"); setOpenId(null); }}>
                <EyeOff className="h-4 w-4" />{current.hidden ? "Move out of hidden folder" : "Move to hidden folder"}
              </Button>
            )}
            {canEdit && <Button variant="ghost" block className="text-danger" onClick={() => { run(() => galleryService.remove(current.id), "Photo deleted"); setOpenId(null); }}><Trash2 className="h-4 w-4" />Delete photo</Button>}
          </div>
        )}
      </Modal>
    </div>
  );
}
