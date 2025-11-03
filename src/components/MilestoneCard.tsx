import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Play, Youtube } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MilestoneCardProps {
  milestone: any;
  index: number;
  userId: string;
  onUpdate: () => void;
}

const MilestoneCard = ({ milestone, index, userId, onUpdate }: MilestoneCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);

  const isCompleted = milestone.status === "completed";
  const isInProgress = milestone.status === "in_progress";

  const toggleStatus = async () => {
    try {
      const newStatus = isCompleted ? "not_started" : isInProgress ? "completed" : "in_progress";
      
      const { error } = await supabase
        .from("milestones")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", milestone.id);

      if (error) throw error;
      
      toast.success(
        newStatus === "completed" 
          ? "Milestone completed! 🎉" 
          : "Milestone status updated"
      );
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchVideos = async () => {
    if (videos.length > 0) return; // Already fetched
    
    setLoadingVideos(true);
    try {
      // Fetch videos for the first topic
      const topic = milestone.topics[0];
      const { data, error } = await supabase.functions.invoke("fetch-videos", {
        body: { topic },
      });

      if (error) throw error;
      setVideos(data.videos || []);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && videos.length === 0) {
      fetchVideos();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpen}>
      <Card className="transition-smooth hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                <span className="text-sm font-semibold">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">{milestone.title}</CardTitle>
                  {isCompleted && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                  {isInProgress && <Play className="w-5 h-5 text-secondary flex-shrink-0" />}
                </div>
                <CardDescription className="line-clamp-2">
                  {milestone.description}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-3">
                  {milestone.duration_weeks && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {milestone.duration_weeks} weeks
                    </Badge>
                  )}
                  {milestone.topics?.slice(0, 3).map((topic: string) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                  {milestone.topics?.length > 3 && (
                    <Badge variant="secondary">
                      +{milestone.topics.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"}
                size="sm"
                onClick={toggleStatus}
                className="gap-2"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isInProgress ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                {isCompleted ? "Done" : isInProgress ? "In Progress" : "Start"}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isOpen ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Topics */}
            {milestone.topics && milestone.topics.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Topics to Master</h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.topics.map((topic: string) => (
                    <Badge key={topic} className="gradient-primary text-white">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            <div>
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Youtube className="w-4 h-4 text-destructive" />
                Recommended Videos
              </h4>
              {loadingVideos ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading videos...
                </div>
              ) : videos.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos.slice(0, 3).map((video: any) => (
                    <a
                      key={video.videoId}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="relative rounded-lg overflow-hidden aspect-video mb-2">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-smooth">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{video.channel}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No videos available yet
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MilestoneCard;