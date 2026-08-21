import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoBadge, EmptyState, Stars, VerifiedBadge } from "@/components/ui-bits";
import {
  createRentalRequest,
  fetchListing,
  fetchListingReviews,
  primaryImage,
} from "@/lib/api";
import { daysBetween, formatDate, friendlyError, inr, todayISO } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/item/$id")({
  head: () => ({
    meta: [
      { title: "Rental details — SHAREUP" },
      {
        name: "description",
        content: "See price per day, deposit, availability and owner details before requesting.",
      },
      { property: "og:title", content: "Rental details — SHAREUP" },
      { property: "og:description", content: "Rent this item by the day from a verified student." },
    ],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [start, setStart] = useState(todayISO(1));
  const [end, setEnd] = useState(todayISO(3));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });
  const reviews = useQuery({
    queryKey: ["listing-reviews", id],
    queryFn: () => fetchListingReviews(id),
  });

  if (listing.isLoading) {
    return (
      <div className="container-page grid gap-6 py-6 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const item = listing.data;
  if (!item) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Listing not found"
          description="This item may have been removed by its owner."
          actionLabel="Explore rentals"
          actionTo="/explore"
        />
      </div>
    );
  }

  const days = Math.max(daysBetween(start, end), item.min_days);
  const rent = Number(item.price_per_day) * days;
  const total = rent + Number(item.deposit);
  const isOwner = user?.id === item.owner_id;
  const avgRating = reviews.data?.length
    ? reviews.data.reduce((sum, review) => sum + review.rating, 0) / reviews.data.length
    : 0;

  const request = async () => {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await createRentalRequest({
        listing_id: item.id,
        renter_id: user.id,
        start_date: start,
        end_date: end,
        message,
      });
      toast.success("Rental request sent to the owner");
      void navigate({ to: "/checkout/$requestId", params: { requestId: created.id } });
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const images = [...item.listing_images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="container-page py-6">
      <RentalSteps />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border bg-surface-muted">
            <img
              src={primaryImage(item) ?? ""}
              alt={item.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt=""
                  className="aspect-square w-full rounded-xl border object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-bold">About this item</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {item.description}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Condition" value={item.item_condition} />
              <Detail label="Pickup" value={item.location} />
              <Detail label="Minimum rental" value={`${item.min_days} day(s)`} />
              <Detail label="Maximum rental" value={`${item.max_days} day(s)`} />
            </dl>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold">Reviews</h2>
            {reviews.data?.length ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Stars rating={avgRating} />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.data.length})</span>
                </div>
                {reviews.data.map((review) => (
                  <div key={review.id} className="rounded-2xl border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {review.author?.full_name ?? "Student"}
                      </p>
                      <Stars rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No reviews yet — be the first to rent this item.
              </p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.categories?.name}
                </p>
                <h1 className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                  {item.title}
                </h1>
              </div>
              {item.is_demo && <DemoBadge />}
            </div>

            <p className="mt-4 text-2xl font-extrabold text-primary">
              {inr(item.price_per_day)}
              <span className="text-sm font-medium text-muted-foreground"> /day</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Refundable security deposit {inr(item.deposit)}
            </p>

            <div className="mt-4 rounded-xl bg-surface-muted p-3">
              <p className="text-sm font-semibold">Owner</p>
              <p className="text-sm">{item.owner?.full_name ?? "Student"}</p>
              <p className="text-xs text-muted-foreground">{item.owner?.college}</p>
              <VerifiedBadge status={item.owner?.verification_status} />
            </div>

            {isOwner ? (
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/dashboard">Manage this listing</Link>
              </Button>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start">Start date</Label>
                    <Input
                      id="start"
                      type="date"
                      value={start}
                      min={todayISO()}
                      onChange={(event) => setStart(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end">End date</Label>
                    <Input
                      id="end"
                      type="date"
                      value={end}
                      min={start}
                      onChange={(event) => setEnd(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Message to owner (optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    maxLength={500}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="When and where would you like to collect?"
                  />
                </div>

                <div className="rounded-xl bg-primary-soft p-3 text-sm">
                  <Row label={`Rent × ${days} day(s)`} value={inr(rent)} />
                  <Row label="Deposit (refundable)" value={inr(item.deposit)} />
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                    <span>Estimated total</span>
                    <span>{inr(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full press"
                  size="lg"
                  disabled={submitting || !item.is_available}
                  onClick={() => void request()}
                >
                  {item.is_available
                    ? submitting
                      ? "Sending request…"
                      : "Request rental"
                    : "Currently unavailable"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Owner approval is required. Payment in this MVP is demo only.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const FLOW = ["Browse", "View item", "Request", "Owner approval", "Demo payment", "Collect", "Return", "Review"];

function RentalSteps() {
  return (
    <ol className="mb-5 flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FLOW.map((step, index) => (
        <li
          key={step}
          className={
            index < 3
              ? "shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-primary"
              : "shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-muted-foreground"
          }
        >
          {index + 1}. {step}
        </li>
      ))}
    </ol>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-surface p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
