import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, MessageSquare } from "lucide-react";
import { AudioRecorder, AudioQueue, encodeAudioForAPI, createWavFromPCM } from "@/utils/RealtimeAudio";

const VoiceAssistant = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const startConversation = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context and queue
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);

      // Connect to edge function WebSocket
      const wsUrl = `wss://gmsezowrwgveggssefss.supabase.co/functions/v1/realtime-perfume-chat`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("Connected to voice assistant");
        setIsConnected(true);
        setIsListening(true);
        
        toast({
          title: "Connected",
          description: "Voice assistant is ready. Start speaking!",
        });

        startRecording();
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received event:", data.type);

        if (data.type === "response.audio.delta") {
          setIsSpeaking(true);
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
        }
        
        if (data.type === "response.audio.done") {
          setIsSpeaking(false);
        }

        if (data.type === "conversation.item.input_audio_transcription.completed") {
          setTranscript(prev => [...prev, `You: ${data.transcript}`]);
        }

        if (data.type === "response.audio_transcript.delta") {
          setTranscript(prev => {
            const newTranscript = [...prev];
            const lastIndex = newTranscript.length - 1;
            if (lastIndex >= 0 && newTranscript[lastIndex].startsWith("Assistant: ")) {
              newTranscript[lastIndex] += data.delta;
            } else {
              newTranscript.push(`Assistant: ${data.delta}`);
            }
            return newTranscript;
          });
        }

        if (data.type === "error") {
          toast({
            title: "Error",
            description: data.error || "An error occurred",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice assistant",
          variant: "destructive",
        });
        endConversation();
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket closed");
        endConversation();
      };

    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encoded = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });
      await recorderRef.current.start();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const endConversation = () => {
    recorderRef.current?.stop();
    wsRef.current?.close();
    audioQueueRef.current?.clear();
    audioContextRef.current?.close();
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            AI Perfume Assistant
          </h1>
          <p className="text-muted-foreground">
            Have a natural conversation about your fragrance preferences
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>Voice Consultation</CardTitle>
            <CardDescription>
              Speak naturally about what you're looking for in a perfume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={startConversation}
                  className="gap-2"
                >
                  <Mic className="h-5 w-5" />
                  Start Voice Consultation
                </Button>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-2 ${isListening ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isListening ? <Mic className="h-5 w-5 animate-pulse" /> : <MicOff className="h-5 w-5" />}
                      <span className="text-sm font-medium">
                        {isListening ? 'Listening...' : 'Not listening'}
                      </span>
                    </div>
                    {isSpeaking && (
                      <div className="flex items-center gap-2 text-accent">
                        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-sm font-medium">Assistant speaking</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={endConversation}
                  >
                    End Conversation
                  </Button>
                </div>
              )}
            </div>

            {transcript.length > 0 && (
              <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-semibold text-muted-foreground">Conversation:</h3>
                {transcript.map((text, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      text.startsWith("You:") 
                        ? "bg-secondary text-secondary-foreground ml-8" 
                        : "bg-primary/10 text-foreground mr-8"
                    }`}
                  >
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for best results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Speak clearly and naturally about your preferences</p>
            <p>• Describe occasions where you'd wear the perfume</p>
            <p>• Mention scents or notes you like or dislike</p>
            <p>• Share your lifestyle and personal style</p>
            <p>• The assistant will ask follow-up questions to help narrow down options</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VoiceAssistant;
