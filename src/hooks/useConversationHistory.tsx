import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DbConversation = Database['public']['Tables']['voice_conversations']['Row'];

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  conversation_type: 'live' | 'dictated';
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('voice_conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData: Conversation[] = (data || []).map((row: DbConversation) => ({
        id: row.id,
        title: row.title,
        conversation_type: row.conversation_type as 'live' | 'dictated',
        messages: (row.messages as unknown as ConversationMessage[]) || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setConversations(typedData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async (
    title: string,
    type: 'live' | 'dictated',
    messages: ConversationMessage[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('voice_conversations')
        .insert({
          title,
          conversation_type: type,
          messages: messages as unknown as Database['public']['Tables']['voice_conversations']['Insert']['messages'],
        } as Database['public']['Tables']['voice_conversations']['Insert'])
        .select()
        .single();

      if (error) throw error;

      const typedData: Conversation = {
        id: data.id,
        title: data.title,
        conversation_type: data.conversation_type as 'live' | 'dictated',
        messages: (data.messages as unknown as ConversationMessage[]) || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setConversations(prev => [typedData, ...prev]);
      
      toast({
        title: "Guardado",
        description: "Conversación guardada correctamente",
      });

      return typedData;
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la conversación",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('voice_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      toast({
        title: "Eliminado",
        description: "Conversación eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    isLoading,
    fetchConversations,
    saveConversation,
    deleteConversation,
  };
}