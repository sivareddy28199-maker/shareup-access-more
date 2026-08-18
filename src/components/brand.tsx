import { Link } from "@tanstack/react-router";

import logo from "@/assets/shareup-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={logo}
      alt="SHAREUP logo"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 press" aria-label="SHAREUP home">
      <Logo size={compact ? 30 : 36} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight">SHAREUP</span>
        {!compact && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Own less, access more
          </span>
        )}
      </span>
    </Link>
  );
}
