import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from "@/utils/RealtimeAudio";
import { useConversationHistory } from "@/hooks/useConversationHistory";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const VoiceLive = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { saveConversation } = useConversationHistory();

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const startConversation = async () => {
    try {
      // Obtener el session token para autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No estás autenticado');
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'gmsezowrwgveggssefss';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-perfume-chat?token=${session.access_token}`;
      
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to voice assistant');
        setIsConnected(true);
        toast({
          title: "Conectado",
          description: "Puedes empezar a hablar",
        });
        startRecording();
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message type:', data.type);

          if (data.type === 'response.audio.delta' && data.delta) {
            setIsSpeaking(true);
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await audioQueueRef.current?.addToQueue(bytes);
          } else if (data.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
            const userMessage: Message = {
              role: 'user',
              content: data.transcript,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMessage]);
            setCurrentTranscript("");
          } else if (data.type === 'response.audio_transcript.delta') {
            setCurrentTranscript(prev => prev + (data.delta || ''));
          } else if (data.type === 'response.audio_transcript.done') {
            const assistantMessage: Message = {
              role: 'assistant',
              content: data.transcript || currentTranscript,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setCurrentTranscript("");
          } else if (data.type === 'input_audio_buffer.speech_started') {
            setIsListening(true);
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            setIsListening(false);
          } else if (data.type === 'error') {
            console.error('Server error:', data.message);
            toast({
              title: "Error",
              description: data.message || "Error en la conexión",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el asistente",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar la conversación",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder((audioData: Float32Array) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encoded = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });
      await audioRecorderRef.current.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    audioRecorderRef.current?.stop();
    wsRef.current?.close();
    audioQueueRef.current?.clear();
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);

    // Save conversation if there are messages
    if (messages.length > 0) {
      try {
        const title = `Conversación en vivo - ${new Date().toLocaleDateString()}`;
        await saveConversation(title, 'live', messages);
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }

    toast({
      title: "Conversación finalizada",
      description: "La conversación ha sido guardada",
    });
  };

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
            <CardTitle>🎤 Conversación en Vivo</CardTitle>
            <CardDescription>
              Habla naturalmente con el asistente de perfumes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-4">
              {!isConnected ? (
                <Button onClick={startConversation} size="lg" className="w-full max-w-xs">
                  Iniciar Conversación
                </Button>
              ) : (
                <>
                  <Button onClick={endConversation} variant="destructive" size="lg">
                    Terminar Conversación
                  </Button>
                  <div className="flex items-center gap-4">
                    {isListening && (
                      <div className="flex items-center gap-2 text-primary">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-sm font-medium">Escuchando</span>
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="flex items-center gap-2 text-secondary">
                        <div className="w-3 h-3 rounded-full bg-secondary animate-pulse"></div>
                        <span className="text-sm font-medium">Hablando</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {messages.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm text-muted-foreground">Transcripción:</h3>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-secondary/10 mr-8'}`}>
                    <div className="text-xs text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'Tú' : 'Asistente'}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                ))}
                {currentTranscript && (
                  <div className="p-3 rounded-lg bg-secondary/10 mr-8 opacity-70">
                    <div className="text-xs text-muted-foreground mb-1">Asistente (escribiendo...)</div>
                    <div className="text-sm">{currentTranscript}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VoiceLive;