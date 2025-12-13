import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_PROMPT_ID = Deno.env.get("OPENAI_PROMPT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

  // Extract and validate authentication token from URL
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    console.error("❌ No authentication token provided");
    return new Response("Authentication required", { status: 401 });
  }

  // Validate token with Supabase
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("❌ Invalid or expired token:", authError?.message);
    return new Response("Invalid authentication token", { status: 401 });
  }

  console.log("✅ User authenticated:", user.id);

  // Fetch perfumes from database BEFORE websocket upgrade to give AI context
  let perfumeContext = "";
  try {
    const { data: perfumes } = await supabase
      .from("perfumes")
      .select("name, brand:brands(name), main_accord:accords(name)")
      .limit(100);
    
    if (perfumes && perfumes.length > 0) {
      const perfumeList = perfumes.map((p: any) => {
        const brandName = p.brand ? (Array.isArray(p.brand) ? p.brand[0]?.name : p.brand.name) : "Unknown";
        const accordName = p.main_accord ? (Array.isArray(p.main_accord) ? p.main_accord[0]?.name : p.main_accord.name) : "";
        return `- ${p.name} by ${brandName}${accordName ? ` (${accordName})` : ""}`;
      }).join("\n");
      perfumeContext = `\n\nYou have access to these perfumes in our database:\n${perfumeList}\n\nWhen recommending, prefer suggesting perfumes from this list when relevant.`;
      console.log(`📋 Loaded ${perfumes.length} perfumes into context`);
    }
  } catch (dbError) {
    console.error("⚠️ Could not load perfumes:", dbError);
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openaiWs: WebSocket | null = null;
  let sessionConfigured = false;

  socket.onopen = () => {
    console.log("✅ Client WebSocket connected successfully for user:", user.id);
    
    // Connect to OpenAI Realtime API with UPDATED model (2024-12-17)
    const openaiUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    console.log("🔄 Attempting to connect to OpenAI:", openaiUrl);
    
    try {
      openaiWs = new WebSocket(openaiUrl, [
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

        // Configure session after it's created
        if (data.type === "session.created" && !sessionConfigured) {
          sessionConfigured = true;
          console.log("⚙️ Configuring session with Prompt ID:", OPENAI_PROMPT_ID ? "✓ Using custom prompt" : "✗ Using fallback");
        
          const sessionConfig = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: `You are ScentGenAI, an expert fragrance consultant helping users discover their perfect perfume.

CRITICAL: You MUST respond in English only, even if the user speaks Spanish or any other language. This is mandatory.

Your role:
- Ask thoughtful questions about their scent preferences, lifestyle, and occasions
- Suggest specific perfumes from our database when appropriate
- Explain fragrance notes and families in simple terms
- Help them understand what might work for them based on their answers
- Be warm, friendly, and enthusiastic about fragrances

Guidelines:
- Keep responses concise and conversational (2-3 sentences max)
- Ask one question at a time
- Show genuine interest in their preferences
- Recommend specific perfumes from our database when you have enough information
- Explain why certain scents might appeal to them
- ALWAYS respond in English regardless of user's language${perfumeContext}`,
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
                silence_duration_ms: 800,
                create_response: true
              },
              temperature: 0.8,
              max_response_output_tokens: 150
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
    console.log("📨 Message from client (user:", user.id, ")");
    // Forward client messages to OpenAI
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(event.data);
    } else {
      console.warn("⚠️ OpenAI WebSocket not ready, state:", openaiWs?.readyState);
    }
  };

  socket.onclose = () => {
    console.log("🔌 Client WebSocket closed for user:", user.id);
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
