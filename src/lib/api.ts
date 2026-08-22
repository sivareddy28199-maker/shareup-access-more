import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Category = Tables["categories"]["Row"];
export type ListingRow = Tables["listings"]["Row"];
export type ListingImage = Tables["listing_images"]["Row"];
export type RentalRequest = Tables["rental_requests"]["Row"];
export type Rental = Tables["rentals"]["Row"];
export type Review = Tables["reviews"]["Row"];
export type ProfileRow = Tables["profiles"]["Row"];

export type PublicProfile = Pick<
  ProfileRow,
  "id" | "full_name" | "college" | "avatar_url" | "is_demo" | "verification_status"
>;

export type Listing = ListingRow & {
  categories: Pick<Category, "name" | "slug"> | null;
  listing_images: Pick<ListingImage, "id" | "url" | "sort_order">[];
  owner: PublicProfile | null;
};

const LISTING_SELECT =
  "*, categories(name, slug), listing_images(id, url, sort_order), owner:profiles!listings_owner_id_fkey(id, full_name, college, avatar_url, is_demo, verification_status)";

function unwrap<T>({
  data,
  error,
}: {
  data: T | null;
  error: { message: string } | null;
}): NonNullable<T> {
  if (error) throw new Error(error.message);
  if (data === null || data === undefined) throw new Error("No data returned");
  return data as NonNullable<T>;
}

export function primaryImage(listing: { listing_images?: { url: string; sort_order: number }[] }) {
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return images[0]?.url ?? null;
}

/* ---------------------------------- reads --------------------------------- */

export async function fetchCategories(): Promise<Category[]> {
  return unwrap(await supabase.from("categories").select("*").order("sort_order"));
}

export type ListingFilters = {
  search?: string;
  categorySlug?: string | null;
  sort?: "recent" | "price_asc" | "price_desc";
  maxPrice?: number | null;
  ownerId?: string | null;
  availableOnly?: boolean;
  limit?: number;
};

export async function fetchListings(filters: ListingFilters = {}): Promise<Listing[]> {
  let query = supabase.from("listings").select(LISTING_SELECT);

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, " ");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (filters.categorySlug) {
    const categories = await fetchCategories();
    const match = categories.find((c) => c.slug === filters.categorySlug);
    if (match) query = query.eq("category_id", match.id);
  }
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.availableOnly) query = query.eq("is_available", true);
  if (filters.maxPrice) query = query.lte("price_per_day", filters.maxPrice);

  if (filters.sort === "price_asc") query = query.order("price_per_day", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price_per_day", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (filters.limit) query = query.limit(filters.limit);

  return (unwrap(await query) as unknown as Listing[]) ?? [];
}

export async function fetchListing(id: string): Promise<Listing> {
  return unwrap(
    await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle(),
  ) as unknown as Listing;
}

export async function fetchProfiles(ids: string[]): Promise<Record<string, PublicProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const rows = unwrap(
    await supabase
      .from("profiles")
      .select("id, full_name, college, avatar_url, is_demo, verification_status")
      .in("id", unique),
  );
  return Object.fromEntries((rows as PublicProfile[]).map((p) => [p.id, p]));
}

export type MyProfileRow = Pick<
  ProfileRow,
  | "id"
  | "full_name"
  | "college"
  | "department"
  | "year"
  | "phone"
  | "avatar_url"
  | "verification_status"
  | "created_at"
>;

export async function fetchMyProfile(): Promise<MyProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  // Sensitive columns (phone, department, year) are not readable via the table
  // API; this security-definer function returns only the caller's own row.
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error) throw new Error(error.message);
  const rows = (data as MyProfileRow[] | null) ?? [];
  return rows[0] ?? null;
}

export async function fetchListingReviews(listingId: string) {
  const reviews = unwrap(
    await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false }),
  );
  const authors = await fetchProfiles(reviews.map((r) => r.reviewer_id));
  return reviews.map((r) => ({ ...r, author: authors[r.reviewer_id] ?? null }));
}

export async function fetchListingBookedRanges(listingId: string) {
  return unwrap(
    await supabase
      .from("rentals")
      .select("start_date, end_date, status")
      .eq("listing_id", listingId)
      .in("status", ["paid", "active", "overdue"]),
  );
}

export type RequestWithListing = RentalRequest & {
  listings: (Pick<ListingRow, "id" | "title" | "price_per_day" | "deposit" | "is_demo"> & {
    listing_images: Pick<ListingImage, "url" | "sort_order">[];
  }) | null;
};

const REQUEST_SELECT = "*, listings(id, title, price_per_day, deposit, is_demo, listing_images(url, sort_order))";

export async function fetchRequests(role: "renter" | "owner", userId: string) {
  const column = role === "renter" ? "renter_id" : "owner_id";
  const rows = unwrap(
    await supabase
      .from("rental_requests")
      .select(REQUEST_SELECT)
      .eq(column, userId)
      .order("created_at", { ascending: false }),
  ) as unknown as RequestWithListing[];
  const counterparts = await fetchProfiles(
    rows.map((r) => (role === "renter" ? r.owner_id : r.renter_id)),
  );
  return rows.map((r) => ({
    ...r,
    counterpart: counterparts[role === "renter" ? r.owner_id : r.renter_id] ?? null,
  }));
}

export async function fetchRequest(id: string) {
  const row = unwrap(
    await supabase.from("rental_requests").select(REQUEST_SELECT).eq("id", id).maybeSingle(),
  ) as unknown as RequestWithListing;
  return row;
}

export type RentalWithListing = Rental & {
  listings: (Pick<ListingRow, "id" | "title" | "price_per_day" | "is_demo"> & {
    listing_images: Pick<ListingImage, "url" | "sort_order">[];
  }) | null;
};

const RENTAL_SELECT = "*, listings(id, title, price_per_day, is_demo, listing_images(url, sort_order))";

export async function fetchRentals(role: "renter" | "owner", userId: string) {
  const column = role === "renter" ? "renter_id" : "owner_id";
  const rows = unwrap(
    await supabase
      .from("rentals")
      .select(RENTAL_SELECT)
      .eq(column, userId)
      .order("start_date", { ascending: false }),
  ) as unknown as RentalWithListing[];
  const counterparts = await fetchProfiles(
    rows.map((r) => (role === "renter" ? r.owner_id : r.renter_id)),
  );
  return rows.map((r) => ({
    ...r,
    counterpart: counterparts[role === "renter" ? r.owner_id : r.renter_id] ?? null,
  }));
}

export async function fetchRental(id: string) {
  const rental = unwrap(
    await supabase.from("rentals").select(RENTAL_SELECT).eq("id", id).maybeSingle(),
  ) as unknown as RentalWithListing;
  if (!rental) throw new Error("Rental not found");
  const people = await fetchProfiles([rental.renter_id, rental.owner_id]);
  const reviews = unwrap(await supabase.from("reviews").select("*").eq("rental_id", id));
  const payments = unwrap(
    await supabase.from("demo_payments").select("*").eq("rental_id", id).order("created_at"),
  );
  return {
    rental,
    renter: people[rental.renter_id] ?? null,
    owner: people[rental.owner_id] ?? null,
    reviews,
    payments,
  };
}

export async function fetchMyVerification(userId: string) {
  const rows = unwrap(
    await supabase
      .from("student_verifications")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1),
  );
  return rows[0] ?? null;
}

/* --------------------------------- writes --------------------------------- */

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadListingImage(file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const signed = await supabase.storage.from("listing-images").createSignedUrl(path, TEN_YEARS);
  if (signed.error) throw new Error(signed.error.message);
  return { path, url: signed.data.signedUrl };
}

export async function uploadStudentId(file: File, userId: string, studentIdNumber: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}-id.${ext}`;
  const upload = await supabase.storage.from("student-ids").upload(path, file, { upsert: true });
  if (upload.error) throw new Error(upload.error.message);
  const { error } = await supabase.from("student_verifications").insert({
    user_id: userId,
    id_card_path: path,
    student_id_number: studentIdNumber || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
  return path;
}

export type ListingInput = {
  title: string;
  description: string;
  category_id: string;
  price_per_day: number;
  deposit: number;
  item_condition: string;
  location: string;
  min_days: number;
  max_days: number;
  is_available: boolean;
};

export async function createListing(
  input: ListingInput,
  _ownerId: string,
  images: { url: string; path?: string }[],
) {
  // owner_id must always be the authenticated auth.uid(), and the referenced
  // profiles row must exist first (FK: listings_owner_id_fkey).
  const ownerId = await ensureProfileForCurrentUser();
  const created = await supabase
    .from("listings")
    .insert({ ...input, owner_id: ownerId, is_demo: false })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);
  const listingId = created.data.id;
  if (images.length) {
    const { error } = await supabase.from("listing_images").insert(
      images.map((image, index) => ({
        listing_id: listingId,
        url: image.url,
        storage_path: image.path ?? null,
        sort_order: index,
      })),
    );
    if (error) throw new Error(error.message);
  }
  return listingId;
}

export async function updateListing(
  id: string,
  input: Partial<ListingInput>,
  newImages: { url: string; path?: string }[] = [],
) {
  const { error } = await supabase.from("listings").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  if (newImages.length) {
    const existing = unwrap(await supabase.from("listing_images").select("id").eq("listing_id", id));
    const { error: imageError } = await supabase.from("listing_images").insert(
      newImages.map((image, index) => ({
        listing_id: id,
        url: image.url,
        storage_path: image.path ?? null,
        sort_order: existing.length + index,
      })),
    );
    if (imageError) throw new Error(imageError.message);
  }
}

export async function deleteListingImage(imageId: string) {
  const { error } = await supabase.from("listing_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createRentalRequest(input: {
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  message?: string;
}) {
  // owner_id / pricing / days are recalculated and validated server-side by a
  // database trigger, so client values here are only placeholders.
  const created = await supabase
    .from("rental_requests")
    .insert({
      listing_id: input.listing_id,
      renter_id: input.renter_id,
      owner_id: input.renter_id,
      start_date: input.start_date,
      end_date: input.end_date,
      days: 1,
      price_per_day: 0,
      total_amount: 0,
      message: input.message ?? null,
    })
    .select("*")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data as RentalRequest;
}

export async function respondToRequest(id: string, decision: "approved" | "rejected") {
  const { error } = await supabase
    .from("rental_requests")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "requested");
  if (error) throw new Error(error.message);
}

export async function cancelRequest(id: string) {
  const { error } = await supabase
    .from("rental_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .in("status", ["requested", "approved"]);
  if (error) throw new Error(error.message);
}

/** Demo-only payment: records a simulated payment and starts the rental. */
export async function payDemoAndStartRental(request: RentalRequest, method: string) {
  const created = await supabase
    .from("rentals")
    .insert({
      request_id: request.id,
      listing_id: request.listing_id,
      renter_id: request.renter_id,
      owner_id: request.owner_id,
      start_date: request.start_date,
      end_date: request.end_date,
    })
    .select("*")
    .single();
  if (created.error) throw new Error(created.error.message);
  const rental = created.data;
  const { error } = await supabase.from("demo_payments").insert({
    rental_id: rental.id,
    request_id: request.id,
    payer_id: request.renter_id,
    rent_amount: Number(request.price_per_day) * request.days,
    deposit_amount: Number(request.deposit),
    amount: Number(request.total_amount),
    method,
    is_demo: true,
  });
  if (error) throw new Error(error.message);
  return rental;
}

export async function markCollected(rentalId: string) {
  const { error } = await supabase
    .from("rentals")
    .update({ status: "active", collected_at: new Date().toISOString() })
    .eq("id", rentalId)
    .eq("status", "paid");
  if (error) throw new Error(error.message);
}

export async function markReturned(rentalId: string) {
  const { error } = await supabase
    .from("rentals")
    .update({ status: "returned", returned_at: new Date().toISOString() })
    .eq("id", rentalId)
    .in("status", ["active", "overdue", "paid"]);
  if (error) throw new Error(error.message);
}

export async function completeRental(rentalId: string) {
  const { error } = await supabase
    .from("rentals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", rentalId)
    .eq("status", "returned");
  if (error) throw new Error(error.message);
}

export async function createReview(input: {
  rental_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
}) {
  // listing_id / reviewee_id are derived server-side by a database trigger.
  const { error } = await supabase.from("reviews").insert({
    rental_id: input.rental_id,
    reviewer_id: input.reviewer_id,
    reviewee_id: input.reviewer_id,
    listing_id: "00000000-0000-0000-0000-000000000000",
    rating: input.rating,
    comment: input.comment || null,
  });
  if (error) throw new Error(error.message);
}

export async function updateProfile(
  userId: string,
  input: {
    full_name?: string;
    college?: string;
    department?: string | null;
    year?: number | null;
    phone?: string | null;
  },
) {
  const { error } = await supabase.from("profiles").update(input).eq("id", userId);
  if (error) throw new Error(error.message);
}

export const DEFAULT_COLLEGE = "Student";

/**
 * Idempotent profile synchronisation. `listings.owner_id` has a FK to
 * `profiles.id`, so a profile row MUST exist before any owner-side insert.
 * Existing rows are never blown away: we only fill in a missing row, or
 * backfill an empty name/college.
 */
export async function ensureProfile(
  userId: string,
  input: {
    full_name?: string;
    college?: string;
    department?: string | null;
    year?: number | null;
    phone?: string | null;
  } = {},
) {
  const existing = await supabase
    .from("profiles")
    .select("id, full_name, college")
    .eq("id", userId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  if (!existing.data) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: (input.full_name ?? "").trim() || "SHAREUP member",
        college: (input.college ?? "").trim() || DEFAULT_COLLEGE,
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return;
  }

  const patch: { full_name?: string; college?: string } = {};
  if (!existing.data.full_name?.trim() && input.full_name?.trim()) {
    patch.full_name = input.full_name.trim();
  }
  if (!existing.data.college?.trim() && input.college?.trim()) {
    patch.college = input.college.trim();
  }
  if (Object.keys(patch).length) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw new Error(error.message);
  }
}

/**
 * Guarantees a live session and a matching profile row, and returns the
 * authenticated user id — the only value that may be used as `owner_id`.
 */
export async function ensureProfileForCurrentUser(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");
  const meta = (data.user.user_metadata ?? {}) as { full_name?: string; college?: string };
  await ensureProfile(data.user.id, {
    full_name: meta.full_name ?? data.user.email?.split("@")[0] ?? "",
    college: meta.college ?? DEFAULT_COLLEGE,
  });
  return data.user.id;
}
