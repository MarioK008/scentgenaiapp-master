import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage } from "@/components/AnimatedPage";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Trash2, MessageSquare, Mic, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const VoiceHistory = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { conversations, isLoading, fetchConversations, deleteConversation } = useConversationHistory();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);


  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <PageSkeleton variant="minimal" />
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage className="max-w-4xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/voice-assistant')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to MyScentGenAI
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-playfair">Conversation History</h1>
          <p className="text-muted-foreground">
            {conversations.length} saved conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {conversations.length === 0 ? (
          <EmptyState
            variant="conversation"
            actionLabel="Start a conversation"
            onAction={() => navigate('/voice-assistant')}
          />
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation, index) => (
              <Card 
                key={conversation.id}
                className="card-hover-lift animate-fade-in opacity-0"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "forwards"
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        conversation.conversation_type === 'live' 
                          ? 'gradient-primary shadow-elegant' 
                          : 'bg-accent/20 shadow-gold'
                      }`}>
                        {conversation.conversation_type === 'live' ? (
                          <Mic className="w-6 h-6 text-white" strokeWidth={1.5} />
                        ) : (
                          <MessageSquare className="w-6 h-6 text-accent" strokeWidth={1.5} />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{conversation.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(conversation.created_at).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                          {' • '}
                          {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="touch-target">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The conversation will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(conversation.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {conversation.messages.slice(0, 3).map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`text-sm p-3 rounded-xl ${
                          msg.role === 'user' 
                            ? 'bg-primary/5 ml-4 border-l-2 border-primary/30' 
                            : 'bg-secondary/30 mr-4 border-l-2 border-accent/30'
                        }`}
                      >
                        <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                          {msg.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <p className="mt-1 leading-relaxed">
                          {msg.content.length > 150 ? msg.content.slice(0, 150) + '...' : msg.content}
                        </p>
                      </div>
                    ))}
                    {conversation.messages.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ... and {conversation.messages.length - 3} more message{conversation.messages.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  );
};

export default VoiceHistory;
