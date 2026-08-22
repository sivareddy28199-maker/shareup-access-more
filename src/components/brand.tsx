import { Link } from "@tanstack/react-router";

import markAsset from "@/assets/shareup-mark.png.asset.json";
import { cn } from "@/lib/utils";

export const SHAREUP_MARK = markAsset.url;

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={SHAREUP_MARK}
      alt="SHAREUP logo"
      width={size}
      height={size}
      decoding="async"
      className={cn("shrink-0", className)}
    />
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 press" aria-label="SHAREUP home">
      <Logo size={compact ? 34 : 42} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-[1.45rem] font-extrabold leading-none tracking-tight sm:text-[1.7rem]">
          SHAREUP
        </span>
        {!compact && (
          <span className="mt-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px]">
            Own less, access more
          </span>
        )}
      </span>
    </Link>
  );
}
