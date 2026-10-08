"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { activeStories } from "@/lib/selectors";
import { geoService } from "@/lib/services";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const IMAGE_MS = 5000;

function StoryPlayer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const app = useApp();
  const [index, setIndex] = useState(0);
  const stories = app ? activeStories(app.db, app.household.id).filter((s) => s.userId === userId) : [];
  const story = stories[Math.min(index, Math.max(stories.length - 1, 0))];
  const url = useMediaUrl(story);
  const user = app?.userById(userId);

  const next = useCallback(() => {
    if (index + 1 >= stories.length) onClose();
    else setIndex(index + 1);
  }, [index, stories.length, onClose]);

  useEffect(() => { if (story) geoService.markStoryViewed(story.id); }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!story || story.kind !== "image" || !url) return;
    const t = setTimeout(next, IMAGE_MS);
    return () => clearTimeout(t);
  }, [story, url, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1)); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, onClose]);

  if (!app || !user || !story) return null;
  const mine = story.userId === app.user.id;

  return (
    <motion.div className="fixed inset-0 z-[75] flex flex-col bg-black text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${user.name}'s update`}>
      <div className="flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {stories.map((s, i) => (
          <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.span key={`${s.id}-${index}`} className="block h-full bg-white" initial={{ width: i < index ? "100%" : "0%" }}
              animate={{ width: i < index ? "100%" : i === index && s.kind === "image" ? "100%" : i === index ? "0%" : "0%" }}
              transition={{ duration: i === index && s.kind === "image" ? IMAGE_MS / 1000 : 0, ease: "linear" }} />
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar user={user} size="sm" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{mine ? "Your update" : user.name}</p><p className="text-[11px] text-white/70">{relativeTime(story.createdAt)}</p></div>
        {mine && <button aria-label="Delete update" onClick={() => { geoService.removeStory(story.id); if (stories.length <= 1) onClose(); else setIndex(0); }} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><Trash2 className="h-5 w-5" /></button>}
        <button aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={story.id} className="flex h-full w-full items-center justify-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            {!url ? <span className="text-sm text-white/60">Loading…</span>
              : story.kind === "video"
                ? <video key={url} src={url} autoPlay playsInline controls onEnded={next} className="max-h-full max-w-full object-contain" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={url} alt={story.caption ?? "Update"} className="max-h-full max-w-full object-contain" />}
          </motion.div>
        </AnimatePresence>
        {story.kind === "image" && (
          <>
            <button aria-label="Previous" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setIndex((i) => Math.max(0, i - 1))} />
            <button aria-label="Next" className="absolute inset-y-0 right-0 w-1/3" onClick={next} />
          </>
        )}
      </div>
      <div className={cn("px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3", !story.caption && !story.lat && "hidden")}>
        {story.caption && <p className="text-[15px] font-medium">{story.caption}</p>}
        {story.lat !== undefined && <p className="mt-1 flex items-center gap-1 text-xs text-white/70"><MapPin className="h-3.5 w-3.5" />Shared from {story.lat.toFixed(3)}, {story.lng?.toFixed(3)}</p>}
      </div>
    </motion.div>
  );
}

export function StoryViewer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  return <AnimatePresence>{userId && <StoryPlayer key={userId} userId={userId} onClose={onClose} />}</AnimatePresence>;
}
