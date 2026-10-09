"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { pendingRequestFor } from "@/lib/access";
import { useSession } from "./useApp";

type Mode = "auth-only" | "guest-only" | "needs-household";

/**
 * Client-side route guard.
 *  - "guest-only": redirects signed-in users into the app.
 *  - "auth-only": requires a session (used for the household/onboarding steps).
 *  - "needs-household": requires a session AND an active household.
 * Returns true once it is safe to render.
 */
export function useGuard(mode: Mode): boolean {
  const router = useRouter();
  const { ready, db, user, household } = useSession();
  const noHouse = user && db && pendingRequestFor(db, user.id) ? "/pending" : "/household";

  useEffect(() => {
    if (!ready) return;
    if (mode === "guest-only" && user) router.replace(household ? "/home" : noHouse);
    if (mode === "auth-only" && !user) router.replace("/welcome");
    if (mode === "needs-household") {
      if (!user) router.replace("/welcome");
      else if (!household) router.replace(noHouse);
    }
  }, [ready, user, household, mode, router, noHouse]);

  if (!ready) return false;
  if (mode === "guest-only") return !user;
  if (mode === "auth-only") return !!user;
  return !!user && !!household;
}
