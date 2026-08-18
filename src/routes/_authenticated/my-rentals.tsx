import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState, RowSkeleton, StatusPill } from "@/components/ui-bits";
import { fetchRentals, fetchRequests } from "@/lib/api";
import { RENTAL_STATUS_LABEL, REQUEST_STATUS_LABEL, formatDateShort, inr } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/my-rentals")({
  head: () => ({
    meta: [
      { title: "My rentals — SHAREUP" },
      { name: "description", content: "Track your requests, active rentals and rental history." },
      { property: "og:title", content: "My rentals — SHAREUP" },
      { property: "og:description", content: "Requests, active rentals and history in one place." },
    ],
  }),
  component: MyRentals;
});

function MyRentals() {
  const { user } = useAuth();
  const requests = useQuery({
    queryKey: ["requests", "renter", user?.id],
    queryFn: () => fetchRequests("renter", user!.id),
    enabled: Boolean(user),
  });
  const rentals = useQuery({
    queryKey: ["rentals", "renter", user?.id],
    queryFn: () => fetchRentals("renter", user!.id),
    enabled: Boolean(user),
  });

  const active = (rentals.data ?? []).filter((rental) =>
    ["paid", "active", "overdue", "returned"].includes(rental.status),
  );
  const completed = (rentals.data ?? []).filter((rental) =>
    ["completed", "cancelled"].includes(rental.status),
  );

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-extrabold tracking-tight">My rentals</h1>

      <Tabs defaultValue="requests" className="mt-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="pt-4">
          {requests.isLoading ? (
            <RowSkeleton />
          ) : requests.data?.length ? (
            <div className="space-y-3">
              {requests.data.map((request) => (
                <div key={request.id} className="flex items-center gap-3 rounded-2xl border bg-surface p-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{request.listings?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(request.start_date)} – {formatDateShort(request.end_date)} ·{" "}
                      {inr(request.total_amount)}
                    </p>
                  </div>
                  <StatusPill
                    status={request.status}
                    label={REQUEST_STATUS_LABEL[request.status] ?? request.status}
                  />
                  {request.status === "approved" && (
                    <Button asChild size="sm">
                      <Link to="/checkout/$requestId" params={{ requestId: request.id }}>
                        Pay (demo)
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No rental requests yet"
              description="Find something you need and send your first request."
              actionLabel="Explore rentals"
              actionTo="/explore"
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="pt-4">
          {rentals.isLoading ? (
            <RowSkeleton />
          ) : active.length ? (
            <div className="space-y-3">
              {active.map((rental) => (
                <Link
                  key={rental.id}
                  to="/rental/$id"
                  params={{ id: rental.id }}
                  className="flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-shadow hover:shadow-lift"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rental.listings?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(rental.start_date)} – {formatDateShort(rental.end_date)}
                    </p>
                  </div>
                  <StatusPill
                    status={rental.status}
                    label={RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active rentals"
              description="Once an owner approves and you complete the demo payment, it shows up here."
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          {completed.length ? (
            <div className="space-y-3">
              {completed.map((rental) => (
                <Link
                  key={rental.id}
                  to="/rental/$id"
                  params={{ id: rental.id }}
                  className="flex items-center gap-3 rounded-2xl border bg-surface p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rental.listings?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Ended {formatDateShort(rental.end_date)}
                    </p>
                  </div>
                  <StatusPill
                    status={rental.status}
                    label={RENTAL_STATUS_LABEL[rental.status] ?? rental.status}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No history yet" description="Completed rentals will appear here." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
