export function inr(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function friendlyError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";
  const message =
    typeof error === "string"
      ? error
      : ((error as { message?: string }).message ?? "Something went wrong. Please try again.");
  return message.replace(/^.*violates row-level security.*$/i, "You do not have permission to do that.");
}

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  requested: "Awaiting owner approval",
  approved: "Approved — pay to confirm",
  rejected: "Declined by owner",
  cancelled: "Cancelled",
  paid: "Confirmed",
};

export const RENTAL_STATUS_LABEL: Record<string, string> = {
  paid: "Ready to collect",
  active: "Active rental",
  overdue: "Overdue",
  returned: "Returned — awaiting owner",
  completed: "Completed",
  cancelled: "Cancelled",
};
