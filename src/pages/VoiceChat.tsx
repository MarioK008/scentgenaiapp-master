import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedPage } from "@/components/AnimatedPage";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceTranscription } from "@/hooks/useVoiceTranscription";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Send, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import ConversationStarters from "@/components/ConversationStarters";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const VoiceChat = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { saveConversation } = useConversationHistory();
  
  const {
    isRecording,
    transcription,
    isTranscribing,
    startRecording,
    stopRecording,
    clearTranscription,
    setTranscription,
  } = useVoiceTranscription();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editableText, setEditableText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (transcription) {
      setEditableText(transcription);
    }
  }, [transcription]);

  const handleDictate = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      clearTranscription();
      await startRecording();
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText ?? editableText).trim();
    if (!textToSend) {
      toast({
        title: "Error",
        description: "Please type or dictate a message first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);

      const userMessage: ChatMessage = {
        role: 'user',
        content: editableText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setEditableText("");
      clearTranscription();

      const { data, error } = await supabase.functions.invoke('chat-with-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          includeAudio: false,
          userId: user?.id
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Persist the FULL conversation after every assistant response.
      // Insert on first turn, update on subsequent turns using the tracked ID.
      const fullMessages = [...messages, userMessage, assistantMessage];
      try {
        if (!conversationIdRef.current) {
          const title = `Dictated Chat - ${new Date().toLocaleDateString()}`;
          const { data: inserted, error: insertError } = await supabase
            .from('voice_conversations')
            .insert({
              user_id: user!.id,
              title,
              conversation_type: 'dictated',
              messages: fullMessages as any,
            })
            .select('id')
            .single();
          if (insertError) throw insertError;
          conversationIdRef.current = inserted.id;
        } else {
          const { error: updateError } = await supabase
            .from('voice_conversations')
            .update({ messages: fullMessages as any })
            .eq('id', conversationIdRef.current);
          if (updateError) throw updateError;
        }
      } catch (persistErr) {
        console.error('Error persisting conversation:', persistErr);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setEditableText("");
    clearTranscription();
  };

  if (loading) {
    return (
      <Layout>
        <PageSkeleton variant="minimal" />
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/voice-assistant')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to MyScentGenAI
        </Button>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <span className="text-3xl">✍️</span>
              Dictate & Edit
            </CardTitle>
            <CardDescription className="text-base">
              Record your message, review and edit it, then send when you're ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {messages.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 glass rounded-2xl">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Chat History</h3>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 ml-8 border-l-2 border-primary/50' 
                        : 'bg-secondary/50 mr-8 border-l-2 border-accent/50'
                    }`}
                  >
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="text-sm leading-relaxed">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Your message</label>
                <Textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder="Type here or use the dictate button..."
                  className="min-h-32 rounded-xl text-base"
                  disabled={isRecording || isTranscribing}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDictate}
                  variant={isRecording ? "destructive" : "outline"}
                  disabled={isTranscribing}
                  className="flex-1 h-12 touch-target"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {isRecording ? "Stop Recording" : isTranscribing ? "Transcribing..." : "Dictate"}
                </Button>
                
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  disabled={!editableText && !isRecording}
                  className="touch-target"
                  size="lg"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={handleSend}
                  disabled={!editableText.trim() || isSending || isRecording}
                  variant="hero"
                  className="flex-1 h-12 touch-target"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedPage>
    </Layout>
  );
};

export default VoiceChat;
