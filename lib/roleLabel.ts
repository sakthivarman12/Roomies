import type { Role } from "@/types";

/** Display label only: the owner role is stored and checked as OWNER everywhere, but shown as RM. */
export function roleLabel(role: Role): string {
  return role === "OWNER" ? "RM" : role;
}
