"use client";

import { Camera, ImagePlus, MapPin, X } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useOnOpen } from "@/hooks/useOnOpen";
import { processMediaFile, type ProcessedMedia } from "@/lib/media";
import { geoService } from "@/lib/services";
import { mediaStore } from "@/lib/mediaStore";
import { useMediaUrl } from "@/hooks/useMediaUrl";

interface SheetProps { open: boolean; onClose: () => void }

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Location isn't available on this device."));
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 });
  });
}

/** Post a photo/video update (story). Saved in the app (and optionally the gallery) — never to the phone's camera roll. */
export function StoryComposer({ open, onClose }: SheetProps) {
  const toast = useToast();
  const [media, setMedia] = useState<ProcessedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [withLocation, setWithLocation] = useState(true);
  const [toGallery, setToGallery] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useMediaUrl(media);

  const discardVideo = (m: ProcessedMedia | null) => { if (m?.mediaId) void mediaStore.remove(m.mediaId).catch(() => undefined); };

  useOnOpen(open, () => { setMedia(null); setCaption(""); setWithLocation(true); setToGallery(true); setBusy(false); setError(""); });

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");
    try {
      discardVideo(media);
      setMedia(await processMediaFile(file, 1080));
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't use that file."); }
  };

  const post = async () => {
    if (!media) return setError("Add a photo or video first.");
    setBusy(true); setError("");
    try {
      let lat: number | undefined; let lng: number | undefined;
      if (withLocation) {
        try { const p = await currentPosition(); lat = p.coords.latitude; lng = p.coords.longitude; geoService.updateLocation(lat, lng, p.coords.accuracy); }
        catch { toast.show("Couldn't get your location — posting without it", "info"); }
      }
      geoService.createStory({ kind: media.kind, src: media.src, mediaId: media.mediaId, caption, lat, lng, saveToGallery: toGallery });
      toast.show("Update posted for 24 hours");
      setMedia(null);
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't post."); }
    finally { setBusy(false); }
  };

  const close = () => { discardVideo(media); setMedia(null); onClose(); };

  return (
    <BottomSheet open={open} onClose={close} title="Share an update" description="Visible to your household for 24 hours"
      footer={<Button size="lg" block loading={busy} onClick={() => void post()}>Post update</Button>}>
      <div className="space-y-4 pb-3 pt-2">
        {preview && media ? (
          <div className="relative overflow-hidden rounded-3xl bg-black">
            {media.kind === "video"
              ? <video src={preview} controls playsInline className="max-h-[42dvh] w-full object-contain" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={preview} alt="Update preview" className="max-h-[42dvh] w-full object-contain" />}
            <button type="button" aria-label="Remove media" onClick={() => { discardVideo(media); setMedia(null); }} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl bg-primary-soft text-sm font-bold text-primary">
              <Camera className="h-7 w-7" /> Camera
              <input type="file" accept="image/*,video/*" capture="environment" className="sr-only" onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
            </label>
            <label className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-line text-sm font-bold">
              <ImagePlus className="h-7 w-7" /> Choose file
              <input type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
            </label>
          </div>
        )}
        <Input label="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What are you up to?" />
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
          <MapPin className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-bold">Attach my location</p><p className="text-xs text-muted">Pins this update on the map</p></div>
          <Toggle label="Attach my location" checked={withLocation} onChange={setWithLocation} />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3.5">
          <ImagePlus className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-bold">Save to Gallery</p><p className="text-xs text-muted">Kept in Roomies, not on your phone</p></div>
          <Toggle label="Save to Gallery" checked={toGallery} onChange={setToGallery} />
        </div>
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
      </div>
    </BottomSheet>
  );
}
