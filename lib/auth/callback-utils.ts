/**
 * Safe internal path for post-auth redirects (blocks open redirects).
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (next == null || typeof next !== "string") {
    return "/dashboard";
  }
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  return trimmed;
}

/** Build default callback URL for Supabase emailRedirectTo / OAuth redirectTo. */
export function getAuthCallbackUrl(appUrl: string, nextPath: string = "/dashboard"): string {
  const base = appUrl.replace(/\/$/, "");
  const next = encodeURIComponent(sanitizeNextPath(nextPath));
  return `${base}/auth/callback?next=${next}`;
}
