import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui-bits";
import { updateProfile } from "@/lib/api";
import { friendlyError } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SHAREUP" },
      { name: "description", content: "Manage your name, college, department, year and phone." },
      { property: "og:title", content: "Your profile — SHAREUP" },
      { property: "og:description", content: "Keep your campus rental profile up to date." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, profile, refreshProfile } = useAuth();

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateProfile(user.id, {
        full_name: String(form.get("full_name") ?? "").trim(),
        college: String(form.get("college") ?? "").trim(),
        department: String(form.get("department") ?? "").trim() || null,
        year: Number(form.get("year")) || null,
        phone: String(form.get("phone") ?? "").trim() || null,
      });
      await refreshProfile();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  const status = profile?.verification_status ?? "unverified";

  return (
    <div className="container-page max-w-xl py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Your profile</h1>
      <div className="mt-3 flex items-center gap-3">
        <StatusPill
          status={status === "verified" ? "completed" : status === "rejected" ? "rejected" : "requested"}
          label={
            status === "verified"
              ? "Verified student"
              : status === "pending"
                ? "Verification pending"
                : status === "rejected"
                  ? "Verification rejected"
                  : "Not verified"
          }
        />
        <Button asChild variant="ghost" size="sm">
          <Link to="/verify">Manage verification</Link>
        </Button>
      </div>

      <form className="mt-6 space-y-4 rounded-3xl border bg-surface p-6 shadow-card" onSubmit={save}>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="college">College</Label>
          <Input id="college" name="college" defaultValue={profile?.college ?? ""} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" defaultValue={profile?.department ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" name="year" type="number" min={1} max={6} defaultValue={profile?.year ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
        </div>
        <Button type="submit" className="w-full">
          Save changes
        </Button>
      </form>
    </div>
  );
}
