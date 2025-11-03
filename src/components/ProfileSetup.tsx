import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface ProfileSetupProps {
  onComplete: () => void;
  userId: string;
}

const COMMON_SKILLS = [
  "JavaScript", "Python", "React", "Node.js", "TypeScript", "SQL",
  "Git", "AWS", "Docker", "Java", "C++", "MongoDB", "GraphQL",
  "Machine Learning", "System Design", "Algorithms", "Data Structures"
];

const ProfileSetup = ({ onComplete, userId }: ProfileSetupProps) => {
  const [careerGoal, setCareerGoal] = useState("");
  const [currentJobRole, setCurrentJobRole] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    loadExistingProfile();
  }, [userId]);

  const loadExistingProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setExistingProfile(data);
        setCareerGoal(data.career_goal || "");
        setCurrentJobRole(data.current_job_role || "");
        setExperienceYears(data.experience_years || 0);
        setSkills(data.skills || []);
        setBio(data.bio || "");
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        user_id: userId,
        career_goal: careerGoal,
        current_job_role: currentJobRole,
        experience_years: experienceYears,
        skills: skills,
        bio: bio,
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(profileData);

      if (error) throw error;

      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-scale-in">
      <CardHeader>
        <CardTitle>
          {existingProfile ? "Update Your Profile" : "Create Your Profile"}
        </CardTitle>
        <CardDescription>
          Help us understand your background and goals to create a personalized roadmap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="careerGoal">Career Goal *</Label>
            <Textarea
              id="careerGoal"
              placeholder="E.g., Become a Senior Full-Stack Developer, Master Machine Learning, Get into FAANG companies..."
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentJobRole">Current Role</Label>
              <Input
                id="currentJobRole"
                placeholder="E.g., Junior Developer, Student..."
                value={currentJobRole}
                onChange={(e) => setCurrentJobRole(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills *</Label>
            <p className="text-sm text-muted-foreground">
              Select from common skills or add your own
            </p>
            
            {/* Common skills */}
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
              {COMMON_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => {
                    if (skills.includes(skill)) {
                      removeSkill(skill);
                    } else {
                      addSkill(skill);
                    }
                  }}
                >
                  {skill}
                  {skills.includes(skill) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>

            {/* Selected skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <Badge key={skill} className="gradient-primary text-white">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add custom skill */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(newSkill);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSkill(newSkill)}
                disabled={!newSkill}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About You (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself, your interests, and what you're passionate about..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-white shadow-glow"
            disabled={loading || !careerGoal || skills.length === 0}
          >
            {loading ? "Saving..." : existingProfile ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup;