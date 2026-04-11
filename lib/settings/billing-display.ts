/** UI label for subscription (simplified Trial vs Pro). */
export function getPlanLabel(subscriptionStatus: string | null): "Pro" | "Trial" {
  if (subscriptionStatus === "active") {
    return "Pro";
  }
  return "Trial";
}

export function trialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) {
    return 0;
  }
  const end = new Date(trialEndsAt).getTime();
  const diff = end - Date.now();
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}
