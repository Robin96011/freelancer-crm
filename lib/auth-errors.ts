/**
 * Supabase GoTrue rate limits and similar errors (HTTP 429, over_email_send_rate_limit, etc.)
 */

export const AUTH_RATE_LIMIT_MESSAGE =
  "Too many email attempts. Please wait a few minutes before trying again.";

/** Minimum time between auth form submits (rapid double-clicks / spam). */
export const MIN_SUBMIT_INTERVAL_MS = 2_500;

/** Client-side cooldown after a detected rate-limit error. */
export const RATE_LIMIT_COOLDOWN_MS = 120_000;

/** Suggested wait after signup sent a confirmation email (UX copy / soft cooldown). */
export const POST_EMAIL_SEND_COOLDOWN_MS = 120_000;

export function isAuthRateLimitError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const e = error as {
    message?: string;
    status?: number;
    code?: string;
    name?: string;
  };
  if (e.status === 429) return true;
  const msg = (e.message ?? "").toLowerCase();
  const code = String(e.code ?? "").toLowerCase();
  if (
    code === "over_email_send_rate_limit" ||
    code === "too_many_requests" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email rate") ||
    msg.includes("over_email") ||
    msg.includes("too_many") ||
    msg.includes("429")
  ) {
    return true;
  }
  return false;
}

export function mapAuthErrorForUi(error: unknown): string {
  if (isAuthRateLimitError(error)) return AUTH_RATE_LIMIT_MESSAGE;
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Something went wrong. Try again.";
}

/** Countdown label for cooldown UI (M:SS or Ns). */
export function formatWaitLabel(seconds: number): string {
  if (seconds <= 0) return "";
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return `${seconds}s`;
}
