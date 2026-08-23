import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Award, Sparkles, Trophy, Flame, Zap } from "lucide-react";

interface AchievementsPanelProps {
  userId: string;
  milestones: any[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_icon: string;
  tier: "bronze" | "silver" | "gold";
  awarded_at: string;
}

const LEVELS = [
  { name: "Beginner", min: 0, max: 50 },
  { name: "Learner", min: 50, max: 150 },
  { name: "Achiever", min: 150, max: 300 },
  { name: "Expert", min: 300, max: 500 },
  { name: "Master", min: 500, max: 500 },
];

const tierIcon: Record<string, JSX.Element> = {
  bronze: <Sparkles className="w-5 h-5" />,
  silver: <Award className="w-5 h-5" />,
  gold: <Trophy className="w-5 h-5" />,
};

const tierStyle: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800 border-amber-300",
  silver: "bg-slate-100 text-slate-700 border-slate-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-400",
};

const AchievementsPanel = ({ userId, milestones }: AchievementsPanelProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    loadData();
  }, [userId, milestones]);

  const loadData = async () => {
    try {
      const [{ data: achievementsData, error: achError }, { data: profileData, error: profileError }] =
        await Promise.all([
          supabase
            .from("achievements")
            .select("*")
            .eq("user_id", userId)
            .order("awarded_at", { ascending: false }),
          supabase
            .from("user_profiles")
            .select("xp, level")
            .eq("user_id", userId)
            .single(),
        ]);

      if (achError) throw achError;
      if (profileError) throw profileError;

      const newList = achievementsData || [];

      if (knownIds.current !== null) {
        const newlyUnlocked = newList.filter((a) => !knownIds.current!.has(a.id));
        newlyUnlocked.forEach((a) => {
          toast.success(`Achievement unlocked: ${a.name}! 🎉`, {
            description: a.description,
          });
        });
      }
      knownIds.current = new Set(newList.map((a) => a.id));

      setAchievements(newList);
      setXp(profileData?.xp ?? 0);
      setLevel(profileData?.level ?? "Beginner");
    } catch (error: any) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = () => {
    const completedDates = milestones
      .filter((m) => m.status === "completed" && m.completed_at)
      .map((m) => new Date(m.completed_at).toDateString());

    const uniqueDates = Array.from(new Set(completedDates))
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (uniqueDates.length === 0) return 0;

    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mostRecent = uniqueDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    if (today.getTime() - mostRecent.getTime() > oneDay) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = uniqueDates[i - 1];
      const curr = uniqueDates[i];
      const diff = Math.round((prev.getTime() - curr.getTime()) / oneDay);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const currentLevelInfo = LEVELS.find((l) => l.name === level) || LEVELS[0];
  const isMaxLevel = currentLevelInfo.name === "Master";
  const levelProgress = isMaxLevel
    ? 100
    : ((xp - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100;

  if (loading) return null;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
            </CardTitle>
            <CardDescription>Earn XP, level up, and unlock badges as you learn</CardDescription>
          </div>
          {streak > 0 && (
            <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600">
              <Flame className="w-3 h-3" />
              {streak} day{streak > 1 ? "s" : ""} streak
            </Badge>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-4 h-4 text-primary" />
              {level}
            </span>
            <span className="text-muted-foreground">
              {xp} XP {!isMaxLevel && `· ${currentLevelInfo.max - xp} to next level`}
            </span>
          </div>
          <Progress value={Math.min(levelProgress, 100)} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete your first milestone to earn a badge.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                title={a.description}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${tierStyle[a.tier] || tierStyle.bronze}`}
              >
                {tierIcon[a.tier] || tierIcon.bronze}
                <span className="text-sm font-medium">{a.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;