import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, History, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold font-playfair gradient-primary bg-clip-text text-transparent mb-4">
            Voice Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you want to interact with our perfume consultant
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate('/voice-live')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow mx-auto">
                <Mic className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-xl text-center">Live Conversation</CardTitle>
              <CardDescription className="text-center">
                Speak directly with the assistant in real time. Natural voice-to-voice conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="premium" className="w-full" onClick={() => navigate('/voice-live')}>
                Start Conversation
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate('/voice-chat')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center shadow-gold mx-auto">
                <MessageSquare className="w-8 h-8 text-accent" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-xl text-center">Dictate & Edit</CardTitle>
              <CardDescription className="text-center">
                Record your message, edit it, and send when ready. Full control over your communication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full" onClick={() => navigate('/voice-chat')}>
                Go to Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group animate-scale-in" onClick={() => navigate('/voice-history')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shadow-elegant mx-auto">
                <History className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-xl text-center">My Conversations</CardTitle>
              <CardDescription className="text-center">
                View and manage the history of all your previous conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full" onClick={() => navigate('/voice-history')}>
                View History
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-smooth cursor-pointer group gradient-accent border-primary/30 animate-scale-in" onClick={() => navigate('/knowledge')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center shadow-gold mx-auto">
                <Brain className="w-8 h-8 text-accent" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-xl text-center">Knowledge Base</CardTitle>
              <CardDescription className="text-center">
                Upload documents to enhance the assistant's knowledge about perfumes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost-gold" className="w-full" onClick={() => navigate('/knowledge')}>
                Manage Knowledge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VoiceAssistant;
