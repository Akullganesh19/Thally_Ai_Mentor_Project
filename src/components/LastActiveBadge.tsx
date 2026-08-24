import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface LastActiveBadgeProps {
  milestones: any[];
}

const LastActiveBadge = ({ milestones }: LastActiveBadgeProps) => {
  const completedDates = milestones
    .filter((m) => m.status === "completed" && m.completed_at)
    .map((m) => new Date(m.completed_at).getTime());

  if (completedDates.length === 0) return null;

  const mostRecent = new Date(Math.max(...completedDates));
  const daysAgo = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

  const label =
    daysAgo === 0 ? "Active today" : daysAgo === 1 ? "Active yesterday" : `Active ${daysAgo} days ago`;

  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="w-3 h-3" />
      {label}
    </Badge>
  );
};

export default LastActiveBadge;