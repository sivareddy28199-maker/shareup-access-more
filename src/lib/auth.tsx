import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, fetchMyProfile } from "@/lib/api";

type MyProfile = Awaited<ReturnType<typeof fetchMyProfile>>;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: MyProfile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MyProfile>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadProfile = async (sessionUser?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      try {
        if (sessionUser) {
          const meta = (sessionUser.user_metadata ?? {}) as { full_name?: string; college?: string };
          // Keeps profiles in sync with auth.uid() (idempotent) so owner-side
          // inserts never hit the listings_owner_id_fkey constraint.
          await ensureProfile(sessionUser.id, {
            full_name: meta.full_name ?? sessionUser.email?.split("@")[0] ?? "",
            college: meta.college,
          });
        }
        const next = await fetchMyProfile();
        if (active) setProfile(next);
      } catch {
        if (active) setProfile(null);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (data.session) void loadProfile(data.session.user);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") {
        setProfile(null);
        return;
      }
      queryClient.invalidateQueries();
      void loadProfile(nextSession?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile: async () => {
        try {
          if (session?.user) {
            await ensureProfile(session.user.id, {
              full_name:
                (session.user.user_metadata as { full_name?: string } | undefined)?.full_name ??
                session.user.email?.split("@")[0] ??
                "",
            });
          }
          setProfile(await fetchMyProfile());
        } catch {
          setProfile(null);
        }
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
