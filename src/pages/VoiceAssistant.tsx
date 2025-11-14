import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, History, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🎤 Asistente de Voz</h1>
          <p className="text-muted-foreground text-lg">
            Elige cómo quieres interactuar con nuestro consultor de perfumes
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/voice-live')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>💬 Conversación en Vivo</CardTitle>
              <CardDescription>
                Habla directamente con el asistente en tiempo real. Conversación natural de voz a voz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/voice-live')}>
                Iniciar Conversación
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/voice-chat')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>✍️ Dictar y Editar</CardTitle>
              <CardDescription>
                Graba tu mensaje, edítalo y envíalo cuando estés listo. Control total sobre tu comunicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" onClick={() => navigate('/voice-chat')}>
                Ir a Chat con Dictado
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/voice-history')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <History className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>📚 Mis Conversaciones</CardTitle>
              <CardDescription>
                Ver y gestionar el historial de todas tus conversaciones anteriores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/voice-history')}>
                Ver Historial
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={() => navigate('/knowledge')}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>🧠 Base de Conocimiento</CardTitle>
              <CardDescription>
                Sube documentos PDF para mejorar la precisión del asistente con información personalizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default" onClick={() => navigate('/knowledge')}>
                Gestionar Conocimiento
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💡 Consejos para mejores resultados</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Habla con claridad y en un ambiente tranquilo</li>
            <li>• Sé específico sobre tus preferencias de perfumes</li>
            <li>• Menciona ocasiones, estaciones o estilos que te gusten</li>
            <li>• No dudes en pedir recomendaciones alternativas</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default VoiceAssistant;
