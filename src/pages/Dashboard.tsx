import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GraduationCap, LogOut, Plus, Sparkles } from "lucide-react";
import ProfileSetup from "@/components/ProfileSetup";
import RoadmapView from "@/components/RoadmapView";
import AIChatBot from "@/components/AIChatBot";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      setHasProfile(!!data);
      if (!data) {
        setShowProfileSetup(true);
      }
    } catch (error: any) {
      console.error("Error checking profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const handleProfileComplete = () => {
    setShowProfileSetup(false);
    setHasProfile(true);
    toast.success("Profile created successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary shadow-glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              AI Career Mentor
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {hasProfile && !showProfileSetup && (
              <Button
                variant="outline"
                onClick={() => setShowProfileSetup(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showProfileSetup || !hasProfile ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center animate-fade-in">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">Let's Get Started!</h2>
              <p className="text-muted-foreground">
                Tell us about your goals so we can create a personalized learning path
              </p>
            </div>
            <ProfileSetup onComplete={handleProfileComplete} userId={user?.id || ""} />
          </div>
        ) : (
          <RoadmapView userId={user?.id || ""} />
        )}
      </main>

      {/* AI Chatbot */}
      {hasProfile && !showProfileSetup && <AIChatBot userId={user?.id || ""} />}
    </div>
  );
};

export default Dashboard;