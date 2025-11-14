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
          <div className="animate-pulse text-lg">Cargando...</div>
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
            ← Volver
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📚 Mis Conversaciones</h1>
          <p className="text-muted-foreground">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''} guardada{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tienes conversaciones guardadas
              </p>
              <Button onClick={() => navigate('/voice-assistant')}>
                Iniciar una conversación
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
                          {new Date(conversation.created_at).toLocaleString('es-ES', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                          {' • '}
                          {conversation.messages.length} mensaje{conversation.messages.length !== 1 ? 's' : ''}
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
                          <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La conversación será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(conversation.id)}>
                            Eliminar
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
                          {msg.role === 'user' ? 'Tú' : 'Asistente'}:
                        </span>{' '}
                        {msg.content.length > 150 ? msg.content.slice(0, 150) + '...' : msg.content}
                      </div>
                    ))}
                    {conversation.messages.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ... y {conversation.messages.length - 3} mensaje{conversation.messages.length - 3 !== 1 ? 's' : ''} más
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