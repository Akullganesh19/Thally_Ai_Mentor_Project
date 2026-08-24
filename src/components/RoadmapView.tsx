import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Circle, Clock, Target, TrendingUp } from "lucide-react";
import MilestoneCard from "@/components/MilestoneCard";
import AchievementsPanel from "@/components/AchievementsPanel";
import LastActiveBadge from "@/components/LastActiveBadge";



interface RoadmapViewProps {
  userId: string;
}

const RoadmapView = ({ userId }: RoadmapViewProps) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    loadRoadmap();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (roadmapError) throw roadmapError;

      if (roadmapData) {
        setRoadmap(roadmapData);

        const { data: milestonesData, error: milestonesError } = await supabase
          .from("milestones")
          .select("*")
          .eq("roadmap_id", roadmapData.id)
          .order("order_index");

        if (milestonesError) throw milestonesError;
        setMilestones(milestonesData || []);
      }
    } catch (error: any) {
      console.error("Error loading roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: { profile },
      });

      if (error) throw error;

      const roadmapData = data.roadmap;
      
      // Save roadmap
      const { data: savedRoadmap, error: saveError } = await supabase
        .from("roadmaps")
        .insert({
          user_id: userId,
          title: roadmapData.title,
          description: roadmapData.description,
          roadmap_data: roadmapData,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Save milestones
      const milestonesToInsert = roadmapData.milestones.map((m: any, index: number) => ({
        roadmap_id: savedRoadmap.id,
        title: m.title,
        description: m.description,
        duration_weeks: m.duration_weeks,
        order_index: index,
        topics: m.topics,
      }));

      const { error: milestonesError } = await supabase
        .from("milestones")
        .insert(milestonesToInsert);

      if (milestonesError) throw milestonesError;

      toast.success("Roadmap generated successfully!");
      await loadRoadmap();
    } catch (error: any) {
      console.error("Error generating roadmap:", error);
      toast.error(error.message || "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === "completed").length;
    return (completed / milestones.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        <Card className="border-dashed border-2">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Target className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Ready to Start Your Journey?</CardTitle>
            <CardDescription className="text-base">
              Generate a personalized learning roadmap based on your profile and career goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateRoadmap}
              disabled={generating}
              className="gradient-primary text-white shadow-glow gap-2"
              size="lg"
            >
              {generating ? (
                <>Generating your roadmap...</>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My Roadmap
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();
  const completedMilestones = milestones.filter(m => m.status === "completed").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Card */}
      <Card className="gradient-subtle border-none shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Active
                </Badge>
              </div>
              <CardTitle className="text-3xl mb-2">{roadmap.title}</CardTitle>
              <CardDescription className="text-base">
                {roadmap.description}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={generateRoadmap}
              disabled={generating}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">
                {completedMilestones} / {milestones.length} Milestones
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% complete
            </p>
          </div>
        </CardHeader>
        </Card>
	      <div className="flex justify-end">
        <LastActiveBadge milestones={milestones} />
      </div>
	      

      {/* Achievements */}
      <AchievementsPanel userId={userId} milestones={milestones} />

      {/* Milestones */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          Learning Milestones
        </h2>
        <div className="grid gap-4">
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              index={index}
              userId={userId}
              onUpdate={loadRoadmap}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;