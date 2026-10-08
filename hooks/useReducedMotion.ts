"use client";

import { useReducedMotion as useSystemReducedMotion } from "framer-motion";
import { useTheme } from "@/lib/theme";

/** True when the OS asks for reduced motion OR the app theme's animation level is not "full". */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const { motion } = useTheme();
  return Boolean(system) || motion !== "full";
}
