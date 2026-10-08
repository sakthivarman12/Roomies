"use client";

import { useState } from "react";

/**
 * Runs `init` once each time `open` flips to true (used to reset sheet form state).
 * Uses React's "adjust state while rendering" pattern instead of an effect, so there is no extra render pass.
 */
export function useOnOpen(open: boolean, init: () => void): void {
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) init();
  }
}
