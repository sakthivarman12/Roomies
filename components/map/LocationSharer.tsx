"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/hooks/useApp";
import { geoService } from "@/lib/services";

const MIN_INTERVAL_MS = 20000;

/** While the user has sharing switched on, keeps their position fresh (only while Roomies is open). */
export function LocationSharer() {
  const app = useApp();
  const sharing = app ? app.db.locations.some((l) => l.userId === app.user.id && l.householdId === app.household.id && l.sharing) : false;
  const last = useRef(0);

  useEffect(() => {
    if (!sharing || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last.current < MIN_INTERVAL_MS) return;
        last.current = now;
        try { geoService.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy); } catch { /* ignore bad fixes */ }
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sharing]);

  return null;
}
