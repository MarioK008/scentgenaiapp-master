import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceTranscription } from "@/hooks/useVoiceTranscription";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Send, Trash2 } from "lucide-react";

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

  const handleSend = async () => {
    if (!editableText.trim()) {
      toast({
        title: "Error",
        description: "Escribe o dicta un mensaje primero",
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
          includeAudio: false
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save conversation after each exchange
      if (messages.length === 0) {
        const title = `Chat con dictado - ${new Date().toLocaleDateString()}`;
        await saveConversation(title, 'dictated', [...messages, userMessage, assistantMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-lg">Cargando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/voice-assistant')}
          className="mb-6"
        >
          ← Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>✍️ Chat con Dictado</CardTitle>
            <CardDescription>
              Graba tu mensaje, edítalo y envíalo cuando estés listo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {messages.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm text-muted-foreground">Historial de chat:</h3>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-secondary/10 mr-8'}`}>
                    <div className="text-xs text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'Tú' : 'Asistente'}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tu mensaje:</label>
                <Textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder="Escribe aquí o usa el botón de dictar..."
                  className="min-h-32"
                  disabled={isRecording || isTranscribing}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDictate}
                  variant={isRecording ? "destructive" : "secondary"}
                  disabled={isTranscribing}
                  className="flex-1"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isRecording ? "Detener Grabación" : isTranscribing ? "Transcribiendo..." : "Dictar"}
                </Button>
                
                <Button
                  onClick={handleClear}
                  variant="outline"
                  disabled={!editableText && !isRecording}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
                
                <Button
                  onClick={handleSend}
                  disabled={!editableText.trim() || isSending || isRecording}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VoiceChat;