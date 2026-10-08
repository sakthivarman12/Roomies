"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "./Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | string;
  right?: React.ReactNode;
}

/** Sticky blurred header used by every inner screen. */
export function PageHeader({ title, subtitle, back, right }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 -mb-1 border-b border-transparent bg-bg/85 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex min-h-11 items-center gap-3">
        {back && (
          <IconButton label="Go back" tone="filled" onClick={() => (typeof back === "string" ? router.push(back) : router.back())}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
