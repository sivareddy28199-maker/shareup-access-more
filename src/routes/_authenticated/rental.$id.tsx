import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatusPill, Stars } from "@/components/ui-bits";
import {
  completeRental,
  createReview,
  fetchRental,
  markCollected,
  markReturned,
} from "@/lib/api";
import { RENTAL_STATUS_LABEL, formatDate, friendlyError, inr } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/rental/$id")({
  head: () => ({
    meta: [
      { title: "Rental details — SHAREUP" },
      { name: "description", content: "Track collection, return and reviews for this rental." },
      { property: "og:title", content: "Rental details — SHAREUP" },
      { property: "og:description", content: "Collect, return and review your rental." },
    ],
  }),
  component: RentalDetail,
});

function RentalDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useQuery({ queryKey: ["rental", id], queryFn: () => fetchRental(id) });

  if (query.isLoading) {
    return (
      <div className="container-page max-w-2xl py-8">
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }
  if (!query.data) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Rental not found"
          description="You may not have access to this rental."
          actionLabel="My rentals"
          actionTo="/my-rentals"
        />
      </div>
    );
  }

  const { rental, renter, owner, reviews } = query.data;
  const isOwner = user?.id === rental.owner_id;
  const alreadyReviewed = reviews.some((review) => review.reviewer_id === user?.id);

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await query.refetch();
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="rounded-3xl border bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{rental.listings?.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(rental.start_date)} → {formatDate(rental.end_date)}
            </p>
          </div>
          <StatusPill
            status={rental.status}
            label={RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="Owner" value={owner?.full_name ?? "Student"} />
          <Info label="Renter" value={renter?.full_name ?? "Student"} />
          <Info label="Rent" value={inr(rental.rent_amount)} />
          <Info label="Deposit" value={inr(rental.deposit_amount)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {rental.status === "paid" && (
            <Button
              disabled={busy}
              onClick={() => void run(() => markCollected(rental.id), "Marked as collected")}
            >
              Mark collected
            </Button>
          )}
          {rental.status === "active" && (
            <Button
              disabled={busy}
              onClick={() => void run(() => markReturned(rental.id), "Marked as returned")}
            >
              Mark returned
            </Button>
          )}
          {rental.status === "returned" && isOwner && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => completeRental(rental.id), "Rental completed and deposit released")
              }
            >
              Confirm & complete
            </Button>
          )}
        </div>

        {rental.status === "completed" && !alreadyReviewed && user && (
          <form
            className="mt-6 space-y-3 rounded-2xl border bg-surface-muted p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => createReview({ rental_id: rental.id, reviewer_id: user.id, rating, comment }),
                "Thanks for your review",
              );
            }}
          >
            <p className="text-sm font-semibold">Leave a review</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value}`}
                >
                  <Stars rating={value <= rating ? 5 : 0} className={value <= rating ? "" : "opacity-40"} />
                </button>
              ))}
              <span className="text-sm font-semibold">{rating}/5</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                maxLength={500}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy}>
              Submit review
            </Button>
          </form>
        )}

        {reviews.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold">Reviews for this rental</p>
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border p-3">
                <Stars rating={review.rating} />
                {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-surface p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
