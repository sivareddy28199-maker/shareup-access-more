import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, PackageOpen, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-warning/40 bg-warning-soft text-warning-foreground", className)}
    >
      Demo listing
    </Badge>
  );
}

export function VerifiedBadge({ status }: { status: string | null | undefined }) {
  if (status !== "verified") return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
      <BadgeCheck className="size-3.5" aria-hidden />
      Verified student
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  requested: "bg-warning-soft text-warning-foreground border-warning/30",
  approved: "bg-primary-soft text-primary border-primary/20",
  paid: "bg-success-soft text-success border-success/30",
  active: "bg-success-soft text-success border-success/30",
  completed: "bg-success-soft text-success border-success/30",
  returned: "bg-primary-soft text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        STATUS_TONE[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {label}
    </span>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            "size-3.5",
            value <= Math.round(rating) ? "fill-warning text-warning" : "text-border",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface px-6 py-14 text-center animate-fade-in">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon ?? <PackageOpen className="size-6" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo && (
        <Button asChild className="mt-5">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-surface">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-2xl border bg-surface p-3">
          <Skeleton className="size-20 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
