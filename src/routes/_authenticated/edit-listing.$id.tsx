import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteListing,
  deleteListingImage,
  fetchCategories,
  fetchListing,
  updateListing,
  uploadListingImage,
} from "@/lib/api";
import { friendlyError } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  head: () => ({
    meta: [
      { title: "Edit your rental listing — SHAREUP" },
      {
        name: "description",
        content: "Update price, deposit, availability and photos for your SHAREUP rental listing.",
      },
      { property: "og:title", content: "Edit your rental listing — SHAREUP" },
      { property: "og:description", content: "Update price, deposit, availability and photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  if (listing.isLoading) {
    return <div className="container-page py-10 text-sm text-muted-foreground">Loading listing…</div>;
  }
  if (!listing.data) {
    return <div className="container-page py-10 text-sm text-muted-foreground">Listing not found.</div>;
  }
  if (user && listing.data.owner_id !== user.id) {
    return (
      <div className="container-page py-10 text-sm text-muted-foreground">
        You can only edit your own listings.
      </div>
    );
  }

  const item = listing.data;
  const isAvailable = available ?? item.is_available;
  const category = categoryId ?? item.category_id;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const price = Number(form.get("price_per_day"));
    if (title.length < 4) {
      toast.error("Give your listing a clearer title");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Enter a valid price per day");
      return;
    }

    setSaving(true);
    try {
      const images = [];
      for (const file of files.slice(0, 4)) {
        images.push(await uploadListingImage(file, user.id));
      }
      await updateListing(
        id,
        {
          title,
          description: String(form.get("description") ?? "").trim(),
          category_id: category,
          price_per_day: price,
          deposit: Number(form.get("deposit")) || 0,
          item_condition: String(form.get("item_condition") ?? "good"),
          location: String(form.get("location") ?? "").trim() || "Campus",
          min_days: Number(form.get("min_days")) || 1,
          max_days: Number(form.get("max_days")) || 14,
          is_available: isAvailable,
        },
        images,
      );
      toast.success("Listing updated");
      await queryClient.invalidateQueries({ queryKey: ["listing", id] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      void navigate({ to: "/item/$id", params: { id } });
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (imageId: string) => {
    try {
      await deleteListingImage(imageId);
      toast.success("Photo removed");
      await queryClient.invalidateQueries({ queryKey: ["listing", id] });
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  const removeListing = async () => {
    try {
      await deleteListing(id);
      toast.success("Listing deleted");
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Edit listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update your pricing, details and photos.</p>

      <form className="mt-6 space-y-4 rounded-3xl border bg-surface p-6 shadow-card" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" maxLength={100} required defaultValue={item.title} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            maxLength={1000}
            rows={4}
            defaultValue={item.description}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price_per_day">Price per day (₹)</Label>
            <Input
              id="price_per_day"
              name="price_per_day"
              type="number"
              min={1}
              required
              defaultValue={Number(item.price_per_day)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit">Security deposit (₹)</Label>
            <Input id="deposit" name="deposit" type="number" min={0} defaultValue={Number(item.deposit)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min_days">Minimum days</Label>
            <Input id="min_days" name="min_days" type="number" min={1} defaultValue={item.min_days} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_days">Maximum days</Label>
            <Input id="max_days" name="max_days" type="number" min={1} defaultValue={item.max_days} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item_condition">Condition</Label>
            <Input id="item_condition" name="item_condition" defaultValue={item.item_condition} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Pickup location</Label>
            <Input id="location" name="location" defaultValue={item.location} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border p-4">
          <div>
            <p className="text-sm font-semibold">Available for rent</p>
            <p className="text-xs text-muted-foreground">Turn off to pause new requests.</p>
          </div>
          <Switch checked={isAvailable} onCheckedChange={setAvailable} />
        </div>

        {item.listing_images.length > 0 && (
          <div className="space-y-2">
            <Label>Current photos</Label>
            <div className="flex flex-wrap gap-3">
              {item.listing_images.map((image) => (
                <div key={image.id} className="w-24">
                  <img
                    src={image.url}
                    alt={item.title}
                    className="h-24 w-24 rounded-xl border object-cover"
                    loading="lazy"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-1 w-full text-xs"
                    onClick={() => void removeImage(image.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="images">Add photos (up to 4)</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full text-destructive"
          onClick={() => void removeListing()}
        >
          Delete listing
        </Button>
      </form>
    </div>
  );
}
