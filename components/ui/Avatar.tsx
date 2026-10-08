import { cn, initials } from "@/lib/utils";
import type { User } from "@/types";

const SIZES = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };

export function Avatar({ user, size = "md", className }: { user: Pick<User, "name" | "avatarColor" | "photo">; size?: keyof typeof SIZES; className?: string }) {
  if (user.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.photo} alt={user.name} className={cn("rounded-full object-cover", SIZES[size], className)} />;
  }
  return (
    <span
      role="img"
      aria-label={user.name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", SIZES[size], className)}
      style={{ background: `linear-gradient(135deg, ${user.avatarColor}, color-mix(in srgb, ${user.avatarColor} 70%, #000))` }}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({ users, max = 4 }: { users: Pick<User, "name" | "avatarColor" | "photo">[]; max?: number }) {
  const shown = users.slice(0, max);
  return (
    <div className="flex -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={i} user={u} size="xs" className="ring-2 ring-surface" />
      ))}
      {users.length > max && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold ring-2 ring-surface">+{users.length - max}</span>
      )}
    </div>
  );
}
