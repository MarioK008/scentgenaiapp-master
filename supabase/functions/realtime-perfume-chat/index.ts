import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_PROMPT_ID = Deno.env.get("OPENAI_PROMPT_ID");

serve(async (req) => {
  console.log("🔌 New WebSocket connection request received");
  
  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  if (req.headers.get("upgrade") !== "websocket") {
    console.log("❌ Request is not a WebSocket upgrade");
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openaiWs: WebSocket | null = null;
  let sessionConfigured = false;

  socket.onopen = () => {
    console.log("✅ Client WebSocket connected successfully");
    
    // Connect to OpenAI Realtime API with UPDATED model (2024-12-17)
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    console.log("🔄 Attempting to connect to OpenAI:", url);
    
    try {
      openaiWs = new WebSocket(url, [
        "realtime",
        `openai-insecure-api-key.${OPENAI_API_KEY}`,
        "openai-beta.realtime-v1"
      ]);

      openaiWs.onopen = () => {
        console.log("✅ Connected to OpenAI Realtime API successfully");
      };

      openaiWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 OpenAI event received:", data.type);

        // Configure session after it's created - USE PROMPT ID if available
        if (data.type === "session.created" && !sessionConfigured) {
          sessionConfigured = true;
          console.log("⚙️ Configuring session with Prompt ID:", OPENAI_PROMPT_ID ? "✓ Using custom prompt" : "✗ Using fallback");
        
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: OPENAI_PROMPT_ID || `You are an expert fragrance consultant helping users discover their perfect perfume. 
            
Your role:
- Ask thoughtful questions about their scent preferences, lifestyle, and occasions
- Suggest specific perfumes from popular brands when appropriate
- Explain fragrance notes and families in simple terms
- Help them understand what might work for them based on their answers
- Be warm, friendly, and enthusiastic about fragrances

Guidelines:
- Keep responses concise and conversational
- Ask one question at a time
- Show genuine interest in their preferences
- Recommend specific perfumes when you have enough information
- Explain why certain scents might appeal to them`,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        };

          console.log("📤 Sending session configuration");
          openaiWs?.send(JSON.stringify(sessionConfig));
        }

        // Forward all events to client
        socket.send(event.data);
      };

      openaiWs.onerror = (error) => {
        console.error("❌ OpenAI WebSocket error:", error);
        socket.send(JSON.stringify({ 
          type: "error", 
          error: "Connection to AI failed. Verify API key has Realtime API access.",
          details: error.toString()
        }));
      };

      openaiWs.onclose = (event) => {
        console.log("🔌 OpenAI WebSocket closed:", event.code, event.reason);
        socket.close();
      };
    } catch (error) {
      console.error("❌ Error creating OpenAI WebSocket:", error);
      socket.send(JSON.stringify({
        type: "error",
        error: "Failed to initialize AI connection",
        details: error instanceof Error ? error.message : String(error)
      }));
      socket.close();
    }
  };

  socket.onmessage = (event) => {
    console.log("📨 Message from client");
    // Forward client messages to OpenAI
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(event.data);
    } else {
      console.warn("⚠️ OpenAI WebSocket not ready, state:", openaiWs?.readyState);
    }
  };

  socket.onclose = () => {
    console.log("🔌 Client WebSocket closed");
    if (openaiWs) {
      openaiWs.close();
    }
  };

  socket.onerror = (error) => {
    console.error("❌ Client WebSocket error:", error);
    if (openaiWs) {
      openaiWs.close();
    }
  };

  return response;
});
