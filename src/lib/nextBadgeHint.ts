// Returns a short hint telling the user how many completed
// milestones stand between them and their next achievement badge.
const BADGE_THRESHOLDS = [1, 5, 10];

export function nextBadgeHint(completedCount: number): string | null {
  const next = BADGE_THRESHOLDS.find((t) => t > completedCount);
  if (!next) return null;
  const remaining = next - completedCount;
  return `${remaining} more milestone${remaining > 1 ? "s" : ""} to your next badge`;
}