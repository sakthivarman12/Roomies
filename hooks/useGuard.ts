"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  const { ready, user, household } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (mode === "guest-only" && user) router.replace(household ? "/home" : "/household");
    if (mode === "auth-only" && !user) router.replace("/welcome");
    if (mode === "needs-household") {
      if (!user) router.replace("/welcome");
      else if (!household) router.replace("/household");
    }
  }, [ready, user, household, mode, router]);

  if (!ready) return false;
  if (mode === "guest-only") return !user;
  if (mode === "auth-only") return !!user;
  return !!user && !!household;
}
