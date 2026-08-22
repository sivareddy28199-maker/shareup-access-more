import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Backpack,
  BookOpen,
  Calculator,
  Camera,
  CircleDollarSign,
  Cpu,
  GraduationCap,
  Handshake,
  Hammer,
  PartyPopper,
  PlugZap,
  Search,
  Shirt,
  Sparkles,
  Trophy,
  Undo2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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

const CATEGORY_ICON: Record<string, LucideIcon> = {
  books: BookOpen,
  calculators: Calculator,
  electronics: Cpu,
  sports: Trophy,
  formal: Shirt,
  bags: Backpack,
  cameras: Camera,
  chargers: PlugZap,
  tools: Hammer,
  events: PartyPopper,
};

const CATEGORY_PRIORITY = ["books", "calculators", "electronics", "sports", "formal"];

/** Hidden on the home screen only — still filterable on Explore. */
const HOME_HIDDEN_CATEGORIES = new Set(["bags"]);
const HOME_CATEGORY_LIMIT = 9;

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Search", icon: Search },
  { label: "Request", icon: Handshake },
  { label: "Rent", icon: Wallet },
  { label: "Return", icon: Undo2 },
];

const VALUES: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Save Money", description: "Pay per day instead of buying", icon: CircleDollarSign },
  { title: "Earn from Unused Items", description: "Idle gear becomes income", icon: Sparkles },
  { title: "Student-Focused Marketplace", description: "Built for campus life", icon: GraduationCap },
];

function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const featured = useQuery({
    queryKey: ["listings", { limit: 8, availableOnly: true }],
    queryFn: () => fetchListings({ limit: 8, availableOnly: true }),
  });

  const orderedCategories = useMemo(
    () =>
      (categories.data ?? [])
        .filter((category) => !HOME_HIDDEN_CATEGORIES.has(category.slug))
        .sort((a, b) => {
          const ai = CATEGORY_PRIORITY.indexOf(a.slug);
          const bi = CATEGORY_PRIORITY.indexOf(b.slug);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
        .slice(0, HOME_CATEGORY_LIMIT),
    [categories.data],
  );

  return (
    <div className="pb-8">
      <section className="relative overflow-hidden border-b glass-hero">
        <div className="container-page py-8 sm:py-14">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-card">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">Student-to-student rentals</span>
            </span>
            <h1 className="mt-4 whitespace-nowrap font-display text-[1.15rem] font-extrabold leading-tight tracking-tight sm:whitespace-normal sm:text-4xl">
              Rent it. Use it. Return it.
            </h1>
            <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-primary sm:text-lg">
              Own less, access more
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Rent from fellow students. Earn from items you already own.
            </p>
            <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
              Calculators, textbooks, cameras, sports gear and formal wear — by the day.
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
                  className="h-12 rounded-xl border-white/60 bg-white/80 pl-9 backdrop-blur"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 press">
                Browse Rentals
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-primary/25 bg-white/75 text-primary backdrop-blur press"
              >
                <Link to="/list-item">List an Item · earn from it</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How SHAREUP works */}
      <section className="container-page pt-6">
        <div className="glass grid grid-cols-2 gap-2 rounded-2xl p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <step.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </span>
                <span className="block truncate text-sm font-bold">{step.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Why SHAREUP */}
      <section className="container-page pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="glass flex min-w-0 items-center gap-3 rounded-2xl p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <value.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{value.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {value.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <SectionHeading title="Browse by category" subtitle="Everything students actually need" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {orderedCategories.map((category) => {
            const Icon = CATEGORY_ICON[category.slug] ?? Sparkles;
            return (
              <Link
                key={category.id}
                to="/explore"
                search={{ category: category.slug }}
                className="glass press flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary sm:size-14">
                  <Icon className="size-5 sm:size-6" aria-hidden />
                </span>
                <span className="text-[11px] font-semibold leading-snug sm:text-sm">
                  {category.name}
                </span>
              </Link>
            );
          })}
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

      <section className="container-page pb-4 pt-6">
        <div className="glass flex flex-col items-start gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold sm:text-lg">Have an unused item?</h2>
            <p className="text-sm text-muted-foreground">
              List it on SHAREUP and earn rental income from your campus.
            </p>
          </div>
          <Button asChild size="lg" className="press w-full sm:w-auto">
            <Link to="/list-item">List an Item</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
