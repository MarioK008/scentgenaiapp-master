import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_PROMPT_ID = Deno.env.get("OPENAI_PROMPT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const AUTH_TIMEOUT_MS = 5000;

serve(async (req) => {
  console.log("🔌 New WebSocket connection request received");

  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  let openaiWs: WebSocket | null = null;
  let sessionConfigured = false;
  let authenticated = false;
  let authTimeout: number | undefined;

  // Connect to OpenAI only after the client authenticates
  const connectToOpenAI = (perfumeContext: string, userId: string) => {
    const openaiUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    console.log("🔄 Connecting to OpenAI for user:", userId);

    openaiWs = new WebSocket(openaiUrl, [
      "realtime",
      `openai-insecure-api-key.${OPENAI_API_KEY}`,
      "openai-beta.realtime-v1",
    ]);

    openaiWs.onopen = () => console.log("✅ OpenAI Realtime connected");

    openaiWs.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "session.created" && !sessionConfigured) {
        sessionConfigured = true;
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: `You are ScentGenAI, an expert fragrance consultant helping users discover their perfect perfume.

LANGUAGE: Always respond in the same language the user is speaking.

Your role:
- Ask thoughtful questions about their scent preferences, lifestyle, and occasions
- Suggest specific perfumes from our database when appropriate
- Explain fragrance notes and families in simple terms
- Be warm, friendly, and enthusiastic about fragrances

Guidelines:
- Keep responses concise and conversational (2-3 sentences max)
- Ask one question at a time${perfumeContext}`,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
              create_response: true,
            },
            temperature: 0.8,
            max_response_output_tokens: 500,
          },
        };
        openaiWs?.send(JSON.stringify(sessionConfig));
      }

      socket.send(event.data);
    };

    openaiWs.onerror = (error) => {
      console.error("❌ OpenAI WebSocket error:", error);
      try {
        socket.send(JSON.stringify({ type: "error", message: "AI connection failed" }));
      } catch (_) { /* noop */ }
    };

    openaiWs.onclose = (event) => {
      console.log("🔌 OpenAI WebSocket closed:", event.code);
      try { socket.close(); } catch (_) { /* noop */ }
    };
  };

  socket.onopen = () => {
    console.log("✅ Client WebSocket connected — awaiting authentication frame");
    authTimeout = setTimeout(() => {
      if (!authenticated) {
        console.error("❌ Authentication timed out");
        try {
          socket.send(JSON.stringify({ type: "error", message: "Authentication timeout" }));
        } catch (_) { /* noop */ }
        socket.close(1008, "Authentication timeout");
      }
    }, AUTH_TIMEOUT_MS) as unknown as number;
  };

  socket.onmessage = async (event) => {
    if (!authenticated) {
      // Expect first message to be { type: 'authenticate', token }
      let parsed: any;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Expected authentication frame" }));
        socket.close(1008, "Invalid auth frame");
        return;
      }

      if (parsed?.type !== "authenticate" || typeof parsed.token !== "string") {
        socket.send(JSON.stringify({ type: "error", message: "Expected authentication frame" }));
        socket.close(1008, "Invalid auth frame");
        return;
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      const { data: { user }, error: authError } = await supabase.auth.getUser(parsed.token);

      if (authError || !user) {
        console.error("❌ Invalid auth token:", authError?.message);
        socket.send(JSON.stringify({ type: "error", message: "Invalid authentication token" }));
        socket.close(1008, "Invalid token");
        return;
      }

      authenticated = true;
      if (authTimeout) clearTimeout(authTimeout);
      console.log("✅ User authenticated:", user.id);

      // Load perfume context
      let perfumeContext = "";
      try {
        const { data: perfumes } = await supabase
          .from("perfumes")
          .select("name, brand:brands!brand_id(name), main_accord:accords!main_accord_id(name)")
          .limit(100);

        if (perfumes && perfumes.length > 0) {
          const perfumeList = perfumes.map((p: any) => {
            const brandName = p.brand ? (Array.isArray(p.brand) ? p.brand[0]?.name : p.brand.name) : "Unknown";
            const accordName = p.main_accord ? (Array.isArray(p.main_accord) ? p.main_accord[0]?.name : p.main_accord.name) : "";
            return `- ${p.name} by ${brandName}${accordName ? ` (${accordName})` : ""}`;
          }).join("\n");
          perfumeContext = `\n\nYou have access to these perfumes in our database:\n${perfumeList}\n\nWhen recommending, prefer suggesting perfumes from this list when relevant.`;
        }
      } catch (e) {
        console.error("⚠️ Could not load perfumes:", e);
      }

      socket.send(JSON.stringify({ type: "authenticated" }));
      connectToOpenAI(perfumeContext, user.id);
      return;
    }

    // Forward subsequent messages to OpenAI
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(event.data);
    }
  };

  socket.onclose = () => {
    if (authTimeout) clearTimeout(authTimeout);
    if (openaiWs) openaiWs.close();
  };

  socket.onerror = (error) => {
    console.error("❌ Client WebSocket error:", error);
    if (openaiWs) openaiWs.close();
  };

  return response;
});
