import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, RowSkeleton, StatusPill } from "@/components/ui-bits";
import {
  deleteListing,
  fetchListings,
  fetchRentals,
  fetchRequests,
  respondToRequest,
} from "@/lib/api";
import { RENTAL_STATUS_LABEL, REQUEST_STATUS_LABEL, formatDateShort, friendlyError, inr } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — SHAREUP" },
      {
        name: "description",
        content: "Manage your listings, approve rental requests and track your earnings.",
      },
      { property: "og:title", content: "Owner dashboard — SHAREUP" },
      { property: "og:description", content: "Listings, requests, active rentals and earnings." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listings = useQuery({
    queryKey: ["listings", { ownerId: user?.id }],
    queryFn: () => fetchListings({ ownerId: user!.id }),
    enabled: Boolean(user),
  });
  const requests = useQuery({
    queryKey: ["requests", "owner", user?.id],
    queryFn: () => fetchRequests("owner", user!.id),
    enabled: Boolean(user),
  });
  const rentals = useQuery({
    queryKey: ["rentals", "owner", user?.id],
    queryFn: () => fetchRentals("owner", user!.id),
    enabled: Boolean(user),
  });

  const earnings = (rentals.data ?? [])
    .filter((rental) => ["paid", "active", "returned", "completed", "overdue"].includes(rental.status))
    .reduce((sum, rental) => sum + Number(rental.rent_amount ?? 0), 0);

  const respond = async (id: string, decision: "approved" | "rejected") => {
    try {
      await respondToRequest(id, decision);
      toast.success(decision === "approved" ? "Request approved" : "Request rejected");
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteListing(id);
      toast.success("Listing deleted");
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Owner dashboard</h1>
        <Button asChild size="sm">
          <Link to="/list-item">List an Item</Link>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Listings" value={String(listings.data?.length ?? 0)} />
        <Stat
          label="Open requests"
          value={String((requests.data ?? []).filter((r) => r.status === "requested").length)}
        />
        <Stat label="Earnings (demo)" value={inr(earnings)} />
      </div>

      <Tabs defaultValue="requests" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="pt-4">
          {requests.isLoading ? (
            <RowSkeleton />
          ) : requests.data?.length ? (
            <div className="space-y-3">
              {requests.data.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border bg-surface p-4"
                >
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold">{request.listings?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.counterpart?.full_name ?? "Student"} ·{" "}
                      {formatDateShort(request.start_date)} – {formatDateShort(request.end_date)} ·{" "}
                      {inr(request.total_amount)}
                    </p>
                  </div>
                  <StatusPill
                    status={request.status}
                    label={REQUEST_STATUS_LABEL[request.status] ?? request.status}
                  />
                  {request.status === "requested" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void respond(request.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void respond(request.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No requests yet" description="Requests for your items appear here." />
          )}
        </TabsContent>

        <TabsContent value="rentals" className="pt-4">
          {rentals.data?.length ? (
            <div className="space-y-3">
              {rentals.data.map((rental) => (
                <Link
                  key={rental.id}
                  to="/rental/$id"
                  params={{ id: rental.id }}
                  className="flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-shadow hover:shadow-lift"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rental.listings?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rental.counterpart?.full_name ?? "Renter"} ·{" "}
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
            <EmptyState title="No rentals yet" description="Approved and paid rentals show here." />
          )}
        </TabsContent>

        <TabsContent value="listings" className="pt-4">
          {listings.isLoading ? (
            <RowSkeleton />
          ) : listings.data?.length ? (
            <div className="space-y-3">
              {listings.data.map((listing) => (
                <div key={listing.id} className="flex items-center gap-3 rounded-2xl border bg-surface p-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {inr(listing.price_per_day)}/day · deposit {inr(listing.deposit)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/item/$id" params={{ id: listing.id }}>
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/edit-listing/$id" params={{ id: listing.id }}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(listing.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No listings yet"
              description="List your first item and start earning."
              actionLabel="List an Item"
              actionTo="/list-item"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
