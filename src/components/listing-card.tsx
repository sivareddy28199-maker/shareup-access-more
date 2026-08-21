import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { DemoBadge } from "@/components/ui-bits";
import { inr } from "@/lib/format";
import { primaryImage, type Listing } from "@/lib/api";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = primaryImage(listing);

  return (
    <Link
      to="/item/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
        {listing.is_demo && <DemoBadge className="absolute left-2 top-2 text-[10px]" />}
        {!listing.is_available && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-[11px] font-semibold text-background">
            Currently unavailable
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {listing.categories?.name ?? "Rental"}
          </p>
          <span
            className={
              listing.is_available
                ? "shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-success"
                : "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            }
          >
            {listing.is_available ? "Available" : "Booked"}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="line-clamp-1">{listing.location}</span>
        </p>
        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-primary">
            {inr(listing.price_per_day)}
            <span className="text-xs font-medium text-muted-foreground"> /day</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Refundable deposit {inr(listing.deposit)}
          </p>
          <span className="press mt-2 flex h-9 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
            View &amp; Rent
          </span>
        </div>
      </div>
    </Link>
  );
}
