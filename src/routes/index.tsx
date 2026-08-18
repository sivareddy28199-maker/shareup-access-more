import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/listing-card";
import { CardGridSkeleton, EmptyState, SectionHeading } from "@/components/ui-bits";
import { fetchCategories, fetchListings } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SHAREUP — Rent from students, own less, access more" },
      {
        name: "description",
        content:
          "Why buy what you only need temporarily? Rent calculators, textbooks, cameras, blazers and more from verified students on campus.",
      },
      { property: "og:title", content: "SHAREUP — Student rental marketplace" },
      {
        property: "og:description",
        content: "Rent what you need by the day from verified students. Own less, access more.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const featured = useQuery({
    queryKey: ["listings", { limit: 8, availableOnly: true }],
    queryFn: () => fetchListings({ limit: 8, availableOnly: true }),
  });

  return (
    <div className="pb-8">
      <section className="border-b bg-primary-soft/60">
        <div className="container-page py-10 sm:py-14">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-card">
              <Sparkles className="size-3.5" aria-hidden /> Starting at SJGC
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Why buy what you only need temporarily?
            </h1>
            <p className="mt-3 text-base font-semibold uppercase tracking-[0.2em] text-primary">
              Own less, access more
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              SHAREUP is a student rental marketplace. Rent calculators, textbooks, cameras, sports
              gear and formal wear by the day — or earn from what's sitting idle in your room.
            </p>

            <form
              className="mt-6 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void navigate({ to: "/explore", search: { q: term || undefined } });
              }}
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="What do you need? e.g. scientific calculator"
                  aria-label="Search rentals"
                  className="h-12 rounded-xl bg-surface pl-9"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 press">
                Browse Rentals
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="lg" className="h-12 bg-surface">
                <Link to="/list-item">List an Item</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Perk icon={<Wallet className="size-4" aria-hidden />} title="Pay per day">
                Owner-set prices with a refundable deposit.
              </Perk>
              <Perk icon={<ShieldCheck className="size-4" aria-hidden />} title="Verified students">
                Every member uploads a student ID card.
              </Perk>
              <Perk icon={<Sparkles className="size-4" aria-hidden />} title="Campus pickup">
                Collect and return right on campus.
              </Perk>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <SectionHeading title="Browse by category" subtitle="Everything students actually need" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(categories.data ?? []).map((category) => (
            <Link
              key={category.id}
              to="/explore"
              search={{ category: category.slug }}
              className="press rounded-2xl border bg-surface p-4 text-sm font-semibold shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <SectionHeading
          title="Featured rentals near you"
          subtitle="Available now on campus"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/explore">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          }
        />
        {featured.isLoading ? (
          <CardGridSkeleton />
        ) : featured.data?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No rentals yet"
            description="Be the first to list something your campus needs."
            actionLabel="List an Item"
            actionTo="/list-item"
          />
        )}
      </section>
    </div>
  );
}

function Perk({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="text-sm font-bold">{title}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
