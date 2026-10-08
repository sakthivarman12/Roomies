"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useApp } from "@/hooks/useApp";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const ROTATE_MS = 14000;

/**
 * Slowly crossfading photos from the household gallery (non-hidden photos switched on as Home background).
 * Fills its positioned parent; keep it low-opacity so overlaid text stays readable.
 */
export function PhotoSlideshow({ className, opacity = 0.4 }: { className?: string; opacity?: number }) {
  const app = useApp();
  const reduce = useReducedMotion();
  const photos = app
    ? app.db.galleryPhotos.filter((p) => p.householdId === app.household.id && p.useAsBackground && !p.hidden && p.kind !== "video" && Boolean(p.src))
    : [];
  const key = photos.map((p) => p.id).join("|");
  const count = photos.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const pick = () => setIndex((prev) => {
      let next = Math.floor(Math.random() * count);
      if (next === prev) next = (next + 1) % count;
      return next;
    });
    const first = setTimeout(pick, 60); // begin on a random photo
    const timer = setInterval(pick, ROTATE_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [count, key]);

  if (!count) return null;
  const photo = photos[index % count];

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={photo.id}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${photo.src}")` }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity, scale: reduce ? 1.04 : 1.14 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 4, ease: "easeInOut" }, scale: { duration: ROTATE_MS / 1000 + 6, ease: "linear" } }}
        />
      </AnimatePresence>
    </div>
  );
}
