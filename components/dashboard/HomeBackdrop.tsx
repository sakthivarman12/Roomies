"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useApp } from "@/hooks/useApp";

const ROTATE_MS = 14000;

/**
 * Slowly crossfading, low-opacity photo backdrop for the Home tab.
 * Uses the household's non-hidden gallery photos that are switched on as Home background.
 */
export function HomeBackdrop() {
  const app = useApp();
  const reduce = useReducedMotion();
  const photos = app
    ? app.db.galleryPhotos.filter((p) => p.householdId === app.household.id && p.useAsBackground && !p.hidden)
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
    const first = setTimeout(pick, 60); // start on a random photo
    const timer = setInterval(pick, ROTATE_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [count, key]);

  if (!count) return null;
  const photo = photos[index % count];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={photo.id}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${photo.src}")` }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 0.22, scale: reduce ? 1.04 : 1.14 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 4, ease: "easeInOut" }, scale: { duration: ROTATE_MS / 1000 + 6, ease: "linear" } }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/50 to-bg/90" />
    </div>
  );
}
