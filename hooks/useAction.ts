"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Runs a service call, surfacing thrown errors as toasts.
 * Returns the result, or undefined if the call failed.
 */
export function useAction() {
  const toast = useToast();
  return useCallback(
    <T,>(fn: () => T, successMessage?: string): T | undefined => {
      try {
        const result = fn();
        if (successMessage) toast.show(successMessage, "success");
        return result;
      } catch (err) {
        toast.show(err instanceof Error ? err.message : "Something went wrong.", "error");
        return undefined;
      }
    },
    [toast],
  );
}
