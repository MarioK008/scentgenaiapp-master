import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Layout from "@/components/Layout";
import { AnimatedPage } from "@/components/AnimatedPage";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, History, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useSEO({ 
    title: 'MyScentGenAI', 
    description: 'Chat with your AI perfume consultant' 
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <PageSkeleton variant="branded" />
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage className="max-w-6xl mx-auto">
        {/* Premium Hero Section */}
        <div className="text-center mb-16 space-y-8">
          {/* Animated icon */}
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-glow-pulse">
              <Sparkles className="w-16 h-16 text-white" strokeWidth={1} />
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-4 rounded-full border border-accent/20" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-playfair">
              <span className="gradient-text">MyScentGenAI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Your personal AI fragrance consultant, ready to help you discover your perfect scent
            </p>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          <Card 
            className="group cursor-pointer card-hover-lift border-primary/20 hover:border-primary/40 relative overflow-hidden"
            onClick={() => navigate('/voice-live')}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            
            <CardHeader className="space-y-6 relative">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto group-hover:animate-glow-pulse">
                <Mic className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl">Live Conversation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Speak naturally with your AI consultant in real-time voice-to-voice conversation
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="premium" className="w-full" size="lg">
                Start Speaking
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer card-hover-lift border-accent/20 hover:border-accent/40 relative overflow-hidden"
            onClick={() => navigate('/voice-chat')}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            
            <CardHeader className="space-y-6 relative">
              <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center shadow-gold mx-auto group-hover:animate-glow-pulse">
                <MessageSquare className="w-10 h-10 text-accent" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl">Dictate & Edit</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Record your message, review and edit it, then send when you're ready
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full" size="lg">
                Open Chat
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer card-hover-lift relative overflow-hidden"
            onClick={() => navigate('/voice-history')}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            
            <CardHeader className="space-y-6 relative">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto group-hover:bg-secondary/80 transition-smooth">
                <History className="w-10 h-10 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl">Conversation History</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Review and manage all your previous conversations with the AI consultant
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="lg">
                View History
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">Tip:</span> Ask about fragrance families, seasonal recommendations, or help finding a signature scent
          </p>
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default VoiceAssistant;
