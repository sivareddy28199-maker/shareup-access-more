import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createListing, ensureProfileForCurrentUser, fetchCategories, uploadListingImage } from "@/lib/api";
import { friendlyError } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/list-item")({
  head: () => ({
    meta: [
      { title: "List your item for rent — SHAREUP" },
      {
        name: "description",
        content: "Earn from what's idle. Set your own daily price and deposit, and add photos.",
      },
      { property: "og:title", content: "List your item for rent — SHAREUP" },
      { property: "og:description", content: "Set your price, add photos and start earning." },
    ],
  }),
  component: ListItem,
});

function ListItem() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [categoryId, setCategoryId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast.error("Your session isn't ready yet. Please sign in again.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const price = Number(form.get("price_per_day"));
    const deposit = Number(form.get("deposit"));

    if (title.length < 4) {
      toast.error("Give your listing a clearer title");
      return;
    }
    if (!categoryId) {
      toast.error("Pick a category");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Enter a valid price per day");
      return;
    }

    setSaving(true);
    try {
      // Make sure the profile row backing listings.owner_id exists first.
      const ownerId = await ensureProfileForCurrentUser();
      const images = [];
      for (const file of files.slice(0, 4)) {
        images.push(await uploadListingImage(file, ownerId));
      }
      const id = await createListing(
        {
          title,
          description,
          category_id: categoryId,
          price_per_day: price,
          deposit: Number.isFinite(deposit) ? deposit : 0,
          item_condition: String(form.get("item_condition") ?? "good"),
          location: String(form.get("location") ?? "").trim() || "Campus",
          min_days: Number(form.get("min_days")) || 1,
          max_days: Number(form.get("max_days")) || 14,
          is_available: true,
        },
        ownerId,
        images,
      );
      toast.success("Listing published");
      void navigate({ to: "/item/$id", params: { id } });
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">List your item</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You set the daily price and refundable deposit.
      </p>

      <form className="mt-6 space-y-4 rounded-3xl border bg-surface p-6 shadow-card" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" maxLength={100} required placeholder="Casio FX-991EX scientific calculator" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" maxLength={1000} required rows={4} />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {(categories.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price_per_day">Price per day (₹)</Label>
            <Input id="price_per_day" name="price_per_day" type="number" min={1} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit">Security deposit (₹)</Label>
            <Input id="deposit" name="deposit" type="number" min={0} defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min_days">Minimum days</Label>
            <Input id="min_days" name="min_days" type="number" min={1} defaultValue={1} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_days">Maximum days</Label>
            <Input id="max_days" name="max_days" type="number" min={1} defaultValue={14} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item_condition">Condition</Label>
            <Input id="item_condition" name="item_condition" defaultValue="good" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Pickup location</Label>
            <Input id="location" name="location" placeholder="e.g. Main campus gate" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="images">Photos (up to 4)</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={saving || authLoading || !user}
        >
          {authLoading ? "Preparing your account…" : saving ? "Publishing…" : "Publish listing"}
        </Button>
        {!authLoading && !user && (
          <p className="text-center text-xs text-destructive">
            Your session expired — please sign in again to publish.
          </p>
        )}
      </form>
    </div>
  );
}
