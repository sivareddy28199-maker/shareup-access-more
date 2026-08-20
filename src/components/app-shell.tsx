import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Home,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";

import { BrandLockup, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/my-rentals", label: "My Rentals", icon: ShoppingBag },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void navigate({ to: "/explore", search: { q: term || undefined } });
  };

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container-page flex h-16 min-w-0 items-center gap-3 sm:gap-4">
          <BrandLockup />

          <form onSubmit={submitSearch} className="relative ml-2 hidden flex-1 md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search calculators, cameras, textbooks…"
              aria-label="Search rentals"
              className="h-11 rounded-xl border-white/60 bg-white/70 pl-9"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.slice(0, 2).map((item) => (
              <Button key={item.to} asChild variant="ghost" size="sm">
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
            {user && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/my-rentals">My Rentals</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button asChild size="sm" className="hidden press sm:inline-flex">
              <Link to="/list-item">
                <Plus className="size-4" aria-hidden />
                List an Item
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" aria-label="Account menu">
                    <UserIcon className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {profile?.full_name || user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/verify">Student verification</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-rentals">My rentals</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Owner dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={submitSearch} className="container-page pb-3 md:hidden">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search rentals near you"
              aria-label="Search rentals"
              className="h-11 rounded-xl border-white/60 bg-white/70 pl-9"
            />
          </div>
        </form>
      </header>

      <main className="flex-1 pb-24 md:pb-10">{children}</main>

      <footer className="hidden border-t bg-surface py-8 md:block">
        <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="text-sm font-semibold">SHAREUP · Own less, access more</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Student rental marketplace · Starting at SJGC · Payments in this MVP are demo only
          </p>
        </div>
      </footer>

      {/* Mobile bottom navigation + prominent list action */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface shadow-nav md:hidden"
        aria-label="Primary"
      >
        <div className="relative mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-1 pt-2">
          {NAV.slice(0, 2).map((item) => (
            <BottomLink key={item.to} {...item} active={pathname === item.to} />
          ))}

          <Link
            to="/list-item"
            className="press mx-auto -mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift"
            aria-label="List an item"
          >
            <Plus className="size-6" aria-hidden />
          </Link>

          {NAV.slice(2).map((item) => (
            <BottomLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function BottomLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </Link>
  );
}
