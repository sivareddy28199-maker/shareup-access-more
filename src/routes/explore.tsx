import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ListingCard } from "@/components/listing-card";
import { CardGridSkeleton, EmptyState, SectionHeading } from "@/components/ui-bits";
import { fetchCategories, fetchListings } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc"]).optional(),
  available: z.boolean().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explore rentals — SHAREUP" },
      {
        name: "description",
        content:
          "Search and filter student rentals by category, price and availability. Calculators, books, cameras, sports gear and more.",
      },
      { property: "og:title", content: "Explore rentals — SHAREUP" },
      {
        property: "og:description",
        content: "Filter campus rentals by category, price and availability.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const filters = {
    search: search.q ?? "",
    categorySlug: search.category ?? null,
    sort: search.sort ?? "recent",
    availableOnly: search.available ?? false,
  } as const;

  const listings = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });

  const update = (next: Partial<z.infer<typeof searchSchema>>) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }) });

  return (
    <div className="container-page py-6">
      <SectionHeading
        title="Explore rentals"
        subtitle={`${listings.data?.length ?? 0} items available to rent`}
      />

      <div className="mb-5 grid gap-3 rounded-2xl border bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            defaultValue={search.q ?? ""}
            placeholder="Calculator, blazer, camera…"
            onChange={(event) => update({ q: event.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={search.category ?? "all"}
            onValueChange={(value) => update({ category: value === "all" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Sort by</Label>
          <Select
            value={search.sort ?? "recent"}
            onValueChange={(value) =>
              update({ sort: value as z.infer<typeof searchSchema>["sort"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="available"
              checked={search.available ?? false}
              onCheckedChange={(checked) => update({ available: checked || undefined })}
            />
            <Label htmlFor="available">Available only</Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ search: {} })}
          >
            Reset
          </Button>
        </div>
      </div>

      {listings.isLoading ? (
        <CardGridSkeleton />
      ) : listings.data?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {listings.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matches found"
          description="Try a different search term or clear the filters."
          actionLabel="List an Item"
          actionTo="/list-item"
        />
      )}
    </div>
  );
}
