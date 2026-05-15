import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useVoiceTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording in progress'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsRecording(false);
          setIsTranscribing(true);

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Audio = reader.result?.toString().split(',')[1];
              
              if (!base64Audio) {
                throw new Error('Failed to convert audio to base64');
              }

              // Call transcription edge function
              const { data, error } = await supabase.functions.invoke('voice-transcribe', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

              setTranscription(data.text);
              setIsTranscribing(false);
              
              toast({
                title: "Transcripción completa",
                description: "Puedes editar el texto antes de enviarlo",
              });
              
              resolve(data.text);
            } catch (error) {
              console.error('Transcription error:', error);
              setIsTranscribing(false);
              toast({
                title: "Error",
                description: "No se pudo transcribir el audio",
                variant: "destructive",
              });
              reject(error);
            }
          };
        } catch (error) {
          setIsTranscribing(false);
          reject(error);
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  };

  const clearTranscription = () => {
    setTranscription('');
  };

  return {
    isRecording,
    transcription,
    isTranscribing,
    startRecording,
    stopRecording,
    clearTranscription,
    setTranscription,
  };
}