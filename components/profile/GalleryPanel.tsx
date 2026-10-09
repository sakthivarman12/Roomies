"use client";

import { motion } from "framer-motion";
import { Camera, EyeOff, FolderOpen, FolderPlus, ImagePlus, Images, Lock, MonitorPlay, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/States";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useAction } from "@/hooks/useAction";
import { useApp } from "@/hooks/useApp";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { processMediaFile } from "@/lib/media";
import { galleryService } from "@/lib/services";
import type { GalleryPhoto } from "@/types";

type Folder = "all" | "hidden";

function Thumb({ p }: { p: GalleryPhoto }) {
  const url = useMediaUrl(p);
  if (!url) return <span className="block h-full w-full skeleton" />;
  // eslint-disable-next-line @next/next/no-img-element
  return p.kind === "video" ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={url} alt={p.caption ?? "House photo"} loading="lazy" className="h-full w-full object-cover" />;
}

function Full({ p }: { p: GalleryPhoto }) {
  const url = useMediaUrl(p);
  if (!url) return <div className="h-48 w-full rounded-2xl skeleton" />;
  // eslint-disable-next-line @next/next/no-img-element
  return p.kind === "video" ? <video src={url} controls playsInline className="max-h-[50dvh] w-full rounded-2xl bg-black object-contain" /> : <img src={url} alt={p.caption ?? "House photo"} className="max-h-[50dvh] w-full rounded-2xl bg-surface2 object-contain" />;
}

export function GalleryPanel() {
  const app = useApp();
  const run = useAction();
  const toast = useToast();
  const [folder, setFolder] = useState<Folder>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dir, setDir] = useState<string>("all"); // "all" | "none" (unfiled) | folder id
  const [newFolder, setNewFolder] = useState<string | null>(null);
  if (!app) return null;

  const unlocked = Boolean(app.prefs.hiddenUnlocked);
  // Hidden photos are private to whoever added them.
  const mine = app.db.galleryPhotos.filter((p) => p.householdId === app.household.id);
  const shared = mine.filter((p) => !p.hidden);
  const hidden = mine.filter((p) => p.hidden && p.addedBy === app.user.id);
  const inHidden = unlocked && folder === "hidden";
  const folders = app.db.galleryFolders.filter((f) => f.householdId === app.household.id);
  const activeFolder = folders.find((f) => f.id === dir) ?? null;
  const inDir = dir === "all" ? shared : dir === "none" ? shared.filter((p) => !p.folderId) : shared.filter((p) => p.folderId === dir);
  const list: GalleryPhoto[] = inHidden ? hidden : inDir;
  const current = openId ? mine.find((p) => p.id === openId && (!p.hidden || (unlocked && p.addedBy === app.user.id))) ?? null : null;
  const bgCount = shared.filter((p) => p.useAsBackground).length;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await Promise.all([...files].map((f) => processMediaFile(f)));
      run(() => galleryService.add(items.map((m) => ({ src: m.src ?? "", kind: m.kind, mediaId: m.mediaId })), inHidden, activeFolder?.id), `${items.length} item${items.length > 1 ? "s" : ""} added${inHidden ? " to hidden folder" : activeFolder ? ` to ${activeFolder.name}` : ""}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Couldn't add those files.", "error");
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

      {!inHidden && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Gallery folders">
          {[{ id: "all", name: `All · ${shared.length}` }, { id: "none", name: "Unfiled" }, ...folders.map((f) => ({ id: f.id, name: `${f.name} · ${shared.filter((p) => p.folderId === f.id).length}` }))].map((f) => (
            <button key={f.id} role="tab" aria-selected={dir === f.id} onClick={() => setDir(f.id)}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold ${dir === f.id ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted"}`}>
              {f.id !== "all" && f.id !== "none" && <FolderOpen className="h-3.5 w-3.5" />}{f.name}
            </button>
          ))}
          <button onClick={() => setNewFolder("")} className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-dashed border-primary px-3.5 text-[13px] font-bold text-primary"><FolderPlus className="h-4 w-4" />New folder</button>
        </div>
      )}
      {activeFolder && !inHidden && (activeFolder.createdBy === app.user.id || app.canManage) && (
        <button onClick={() => { run(() => galleryService.deleteFolder(activeFolder.id), "Folder deleted — photos kept"); setDir("all"); }} className="px-1 text-xs font-semibold text-muted underline">Delete folder “{activeFolder.name}” (photos are kept)</button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-soft text-sm font-bold text-primary">
          <ImagePlus className="h-5 w-5" /> {busy ? "Adding…" : inHidden ? "Add (hidden)" : activeFolder ? `Add to ${activeFolder.name}` : "Add photos"}
          <input type="file" accept="image/*,video/*" multiple className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
        <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold">
          <Camera className="h-5 w-5" /> Take photo
          <input type="file" accept="image/*,video/*" capture="environment" className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      {!inHidden && <p className="px-1 text-xs text-muted">{bgCount > 0 ? `${bgCount} photo${bgCount > 1 ? "s" : ""} slowly rotate inside the Home summary card.` : "Open a photo and switch on “Home background” to show it in the Home summary card."}</p>}

      {list.length === 0 ? (
        <EmptyState icon={inHidden ? <EyeOff className="h-7 w-7" /> : <Images className="h-7 w-7" />} title={inHidden ? "Hidden folder is empty" : "No photos yet"} description={inHidden ? "Photos you hide are only visible to you." : "Share moments from the house."} />
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {list.map((p, i) => (
            <motion.li key={p.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
              <button onClick={() => setOpenId(p.id)} aria-label={p.caption ? `Open photo: ${p.caption}` : "Open photo"} className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-surface2">
                <Thumb p={p} />
                {p.kind === "video" && <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"><Play className="h-3 w-3" fill="currentColor" /></span>}
                {p.useAsBackground && <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" title="Used as Home background"><MonitorPlay className="h-3.5 w-3.5" /></span>}
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Modal open={newFolder !== null} onClose={() => setNewFolder(null)} title="New folder" description="Everyone in the house can see it"
        footer={<Button block size="lg" onClick={() => { const n = newFolder ?? ""; const f = run(() => galleryService.createFolder(n), `Folder “${n.trim()}” created`); if (f) { setDir(f.id); setNewFolder(null); } }}>Create folder</Button>}>
        <div className="pb-3"><input aria-label="Folder name" autoFocus value={newFolder ?? ""} onChange={(e) => setNewFolder(e.target.value)} placeholder="Trip to Ooty" className="min-h-[48px] w-full rounded-2xl border border-line bg-surface px-4 text-[15px] focus:border-primary focus:outline-none" /></div>
      </Modal>
      <Modal open={Boolean(current)} onClose={() => setOpenId(null)} title={current?.caption || "Photo"} description={current ? `Added by ${app.nameOf(current.addedBy)}` : undefined}>
        {current && (
          <div className="space-y-4 pb-3">
            <Full p={current} />
            {!current.hidden && current.kind !== "video" && (
              <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
                <MonitorPlay className="h-5 w-5 text-primary" />
                <div className="flex-1"><p className="text-sm font-bold">Home background</p><p className="text-xs text-muted">Fades slowly inside the Home card</p></div>
                <Toggle label="Use as Home background" checked={current.useAsBackground} onChange={(v) => run(() => galleryService.setBackground(current.id, v))} />
              </div>
            )}
            {!current.hidden && (current.addedBy === app.user.id || app.canManage) && (
              <label className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5 text-sm font-bold"><FolderOpen className="h-5 w-5 text-primary" /><span className="flex-1">Folder</span>
                <select aria-label="Move to folder" value={current.folderId ?? ""} onChange={(e) => run(() => galleryService.movePhoto(current.id, e.target.value || null), "Moved")} className="min-h-[40px] rounded-xl border border-line bg-surface px-2 text-sm font-semibold">
                  <option value="">Unfiled</option>{folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select></label>
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
