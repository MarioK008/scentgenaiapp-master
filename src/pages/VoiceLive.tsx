import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage } from "@/components/AnimatedPage";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from "@/utils/RealtimeAudio";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { ArrowLeft, Mic, MicOff, Volume2 } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import AudioWaveform from "@/components/AudioWaveform";

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
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

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
        throw new Error('You are not authenticated');
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const projectId =
        import.meta.env.VITE_SUPABASE_PROJECT_ID ||
        (supabaseUrl ? new URL(supabaseUrl).hostname.split('.supabase.co')[0] : '');
      if (!projectId) {
        throw new Error('Supabase project ID is not configured');
      }
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-perfume-chat`;
      
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to voice assistant');
        // Send authentication frame as the very first message
        wsRef.current?.send(JSON.stringify({ type: 'authenticate', token: session.access_token }));
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "You can start speaking",
        });
        startRecording();
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message type:', data.type);

          if (data.type === 'response.audio.delta' && data.delta) {
            setIsSpeaking(true);
            setIsAssistantThinking(false);
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
            setIsAssistantThinking(false);
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
            // User started speaking - interrupt any ongoing AI response
            if (isSpeaking) {
              console.log('User interrupting - clearing audio queue and canceling response');
              audioQueueRef.current?.clear();
              // Cancel ongoing response
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
              }
              setIsSpeaking(false);
            }
            setIsAssistantThinking(false);
            setIsListening(true);
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            setIsListening(false);
            setIsAssistantThinking(true);
          } else if (data.type === 'error') {
            console.error('Server error:', data.message);
            toast({
              title: "Error",
              description: data.message || "Connection error",
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
          title: "Connection error",
          description: "Could not connect to the assistant",
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
        description: error instanceof Error ? error.message : "Could not start conversation",
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
      setAnalyser(audioRecorderRef.current.analyser);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    audioRecorderRef.current?.stop();
    wsRef.current?.close();
    audioQueueRef.current?.clear();
    setAnalyser(null);

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsAssistantThinking(false);

    // Save conversation if there are messages
    if (messages.length > 0) {
      try {
        const title = `Live Conversation - ${new Date().toLocaleDateString()}`;
        await saveConversation(title, 'live', messages);
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }

    toast({
      title: "Conversation ended",
      description: "The conversation has been saved",
    });
  };

  if (loading) {
    return (
      <Layout>
        <PageSkeleton variant="branded" />
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

        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <span className="text-4xl">🎤</span>
              Live Conversation
            </CardTitle>
            <CardDescription className="text-lg">
              Speak naturally with your AI perfume consultant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Connection controls */}
            <div className="flex flex-col items-center gap-6">
              {!isConnected ? (
                <Button 
                  onClick={startConversation} 
                  size="lg" 
                  variant="premium"
                  className="w-full max-w-xs h-14 text-lg"
                >
                  <Mic className="h-6 w-6 mr-2" />
                  Start Conversation
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-6 w-full">
                  {/* Status indicators */}
                  <div className="flex items-center justify-center gap-8">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all ${
                      isListening ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground'
                    }`}>
                      {isListening ? (
                        <Mic className="w-5 h-5 animate-pulse" />
                      ) : (
                        <MicOff className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {isListening ? 'Listening...' : 'Not listening'}
                      </span>
                    </div>
                    
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all ${
                      isSpeaking ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground'
                    }`}>
                      <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      <span className="font-medium">
                        {isSpeaking ? 'Speaking...' : 'Silent'}
                      </span>
                    </div>
                  </div>

                  {/* Live audio waveform */}
                  <AudioWaveform analyser={analyser} active={isListening} />

                  <Button 
                    onClick={endConversation} 
                    variant="destructive" 
                    size="lg"
                    className="h-12"
                  >
                    End Conversation
                  </Button>
                </div>
              )}
            </div>

            {/* Transcript */}
            {messages.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 glass rounded-2xl">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Transcript</h3>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl animate-fade-in ${
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
                {currentTranscript && (
                  <div className="p-4 rounded-xl bg-secondary/30 mr-8 opacity-70 border-l-2 border-accent/30">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                      Assistant (typing...)
                    </div>
                    <div className="text-sm leading-relaxed">{currentTranscript}</div>
                  </div>
                )}
                {isAssistantThinking && !currentTranscript && <TypingIndicator />}
              </div>
            )}

            {/* Tips */}
            {!isConnected && messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">
                💡 Click "Start Conversation" and speak naturally about fragrances
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedPage>
    </Layout>
  );
};

export default VoiceLive;
