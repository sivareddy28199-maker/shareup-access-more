import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui-bits";
import { fetchMyVerification, uploadStudentId } from "@/lib/api";
import { friendlyError, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({
    meta: [
      { title: "Student ID verification — SHAREUP" },
      {
        name: "description",
        content: "Upload your student ID card to get verified and start renting on SHAREUP.",
      },
      { property: "og:title", content: "Student ID verification — SHAREUP" },
      { property: "og:description", content: "Verification keeps the campus marketplace safe." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { user, refreshProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [uploading, setUploading] = useState(false);

  const verification = useQuery({
    queryKey: ["verification", user?.id],
    queryFn: () => fetchMyVerification(user!.id),
    enabled: Boolean(user),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !file) {
      toast.error("Select your student ID card image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      await uploadStudentId(file, user.id, idNumber.trim());
      toast.success("ID submitted — our team will review it shortly");
      setFile(null);
      await verification.refetch();
      await refreshProfile();
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setUploading(false);
    }
  };

  const status = verification.data?.status ?? "unverified";

  return (
    <div className="container-page max-w-xl py-8">
      <div className="rounded-3xl border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Student ID verification</h1>
            <p className="text-sm text-muted-foreground">
              Required to build trust across campus rentals.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current status:</span>
          <StatusPill
            status={status === "verified" ? "completed" : status === "rejected" ? "rejected" : "requested"}
            label={status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : status === "pending" ? "Pending review" : "Not submitted"}
          />
        </div>
        {verification.data && (
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatDate(verification.data.submitted_at)}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="student_id_number">Student ID number</Label>
            <Input
              id="student_id_number"
              value={idNumber}
              maxLength={40}
              onChange={(event) => setIdNumber(event.target.value)}
              placeholder="e.g. 21BCOM123"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="id_card">Student ID card photo</Label>
            <Input
              id="id_card"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Stored privately — only reviewers can access your ID file. Never shown publicly.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={uploading || !file}>
            {uploading ? "Uploading…" : "Submit for verification"}
          </Button>
        </form>
      </div>
    </div>
  );
}
