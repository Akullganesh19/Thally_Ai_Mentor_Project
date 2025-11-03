import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, Target, TrendingUp, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Career Mentoring</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Your Personal Path to
            <span className="block gradient-primary bg-clip-text text-transparent">
              Career Success
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized learning roadmaps, curated video tutorials, and AI mentor guidance
            tailored to your skills, experience, and career goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="gradient-primary text-white shadow-glow text-lg gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              Get Started Free
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              variant="outline"
              className="text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-smooth hover:shadow-lg animate-slide-up">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Personalized Roadmaps</h3>
            <p className="text-muted-foreground">
              AI analyzes your profile and generates custom learning paths with realistic milestones
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-smooth hover:shadow-lg animate-slide-up delay-100">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-secondary flex items-center justify-center shadow-glow-secondary">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Curated Resources</h3>
            <p className="text-muted-foreground">
              Access high-quality video tutorials and learning materials for each milestone
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-smooth hover:shadow-lg animate-slide-up delay-200">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-accent flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your journey with smart milestones and celebrate achievements
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 max-w-3xl mx-auto text-center p-12 rounded-3xl gradient-hero">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of professionals who are achieving their career goals with AI-powered guidance
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-lg text-lg gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
