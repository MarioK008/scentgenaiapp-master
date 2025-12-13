import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { Trash2, MessageSquare, Mic } from "lucide-react";
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

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  if (loading || isLoading) {
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
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/voice-assistant')}
          >
            ← Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Conversations</h1>
          <p className="text-muted-foreground">
            {conversations.length} saved conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You don't have any saved conversations yet
              </p>
              <Button onClick={() => navigate('/voice-assistant')}>
                Start a conversation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {conversation.conversation_type === 'live' ? (
                          <Mic className="w-5 h-5 text-primary" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{conversation.title}</CardTitle>
                        <CardDescription>
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
                        <Button variant="ghost" size="icon">
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
                          <AlertDialogAction onClick={() => handleDelete(conversation.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {conversation.messages.slice(0, 3).map((msg, idx) => (
                      <div key={idx} className={`text-sm p-2 rounded ${msg.role === 'user' ? 'bg-primary/5' : 'bg-secondary/5'}`}>
                        <span className="font-medium text-xs text-muted-foreground">
                          {msg.role === 'user' ? 'You' : 'Assistant'}:
                        </span>{' '}
                        {msg.content.length > 150 ? msg.content.slice(0, 150) + '...' : msg.content}
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
      </div>
    </Layout>
  );
};

export default VoiceHistory;
