import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatusPill } from "@/components/ui-bits";
import { fetchRequest, payDemoAndStartRental } from "@/lib/api";
import { REQUEST_STATUS_LABEL, formatDate, friendlyError, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/checkout/$requestId")({
  head: () => ({
    meta: [
      { title: "Demo payment — SHAREUP" },
      {
        name: "description",
        content: "Simulated deposit and rent payment for the SHAREUP competition MVP.",
      },
      { property: "og:title", content: "Demo payment — SHAREUP" },
      { property: "og:description", content: "No real money moves in this MVP." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const request = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => fetchRequest(requestId),
  });

  if (request.isLoading) {
    return (
      <div className="container-page max-w-lg py-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const data = request.data;
  if (!data) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Request not found"
          description="This rental request is no longer available."
          actionLabel="My rentals"
          actionTo="/my-rentals"
        />
      </div>
    );
  }

  const pay = async () => {
    setPaying(true);
    try {
      const rental = await payDemoAndStartRental(data, "demo_upi");
      toast.success("Demo payment recorded — rental confirmed");
      void navigate({ to: "/rental/$id", params: { id: rental.id } });
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="container-page max-w-lg py-8">
      <div className="rounded-3xl border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight">Rental checkout</h1>
          <StatusPill status={data.status} label={REQUEST_STATUS_LABEL[data.status] ?? data.status} />
        </div>

        <div className="mt-4 rounded-2xl bg-warning-soft p-3 text-xs font-semibold text-warning-foreground">
          DEMO ONLY — this records a simulated payment. No real money is charged.
        </div>

        <div className="mt-5 space-y-1 text-sm">
          <p className="font-semibold">{data.listings?.title}</p>
          <p className="text-muted-foreground">
            {formatDate(data.start_date)} → {formatDate(data.end_date)} · {data.days} day(s)
          </p>
        </div>

        <div className="mt-5 space-y-1.5 rounded-2xl bg-surface-muted p-4 text-sm">
          <Row label={`Rent (${inr(data.price_per_day)} × ${data.days})`} value={inr(Number(data.price_per_day) * data.days)} />
          <Row label="Refundable deposit" value={inr(data.deposit)} />
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>{inr(data.total_amount)}</span>
          </div>
        </div>

        {data.status === "approved" ? (
          <Button className="mt-5 w-full press" size="lg" disabled={paying} onClick={() => void pay()}>
            {paying ? "Processing demo payment…" : "Pay with demo UPI"}
          </Button>
        ) : (
          <p className="mt-5 rounded-2xl bg-primary-soft p-3 text-center text-sm text-primary">
            {data.status === "requested"
              ? "Waiting for the owner to approve your request."
              : "This request can no longer be paid."}
          </p>
        )}
      </div>
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
