import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/api";
import { friendlyError } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — SHAREUP student rentals" },
      {
        name: "description",
        content:
          "Create your SHAREUP account to rent and list items on campus. Verify with your student ID card.",
      },
      { property: "og:title", content: "Sign in or join — SHAREUP student rentals" },
      {
        property: "og:description",
        content: "Join the student rental marketplace. Verify with your student ID and start renting.",
      },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  college: z.string().trim().min(2, "Enter your college").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      if (error) throw error;
      toast.success("Welcome back to SHAREUP");
      void navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      full_name: form.get("full_name"),
      college: form.get("college"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: parsed.data.full_name, college: parsed.data.college },
        },
      });
      if (error) throw error;
      if (data.session && data.user) {
        await ensureProfile(data.user.id, {
          full_name: parsed.data.full_name,
          college: parsed.data.college,
        });
        toast.success("Account created — verify your student ID next");
        void navigate({ to: "/verify", replace: true });
      } else {
        setSentConfirmation(true);
      }
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-3xl border bg-surface p-6 shadow-card animate-fade-in sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Welcome to SHAREUP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Own less, access more. Student-to-student rentals.
          </p>
        </div>

        {sentConfirmation ? (
          <div className="rounded-2xl bg-success-soft p-4 text-center text-sm text-success">
            <p className="font-semibold">Check your email to confirm your account</p>
            <p className="mt-1 text-success/90">
              Once confirmed, sign in and upload your student ID to get verified.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-4 pt-2" onSubmit={signIn}>
                <Field label="Email" name="email" type="email" autoComplete="email" />
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 pt-2" onSubmit={signUp}>
                <Field label="Full name" name="full_name" autoComplete="name" />
                <Field label="College" name="college" placeholder="Your college name" />
                <Field label="Email" name="email" type="email" autoComplete="email" />
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  hint="Minimum 8 characters"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  After signing up you'll upload your student ID card for verification.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}

      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  hint,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required {...rest} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
