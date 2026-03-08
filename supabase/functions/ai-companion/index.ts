import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const VOYAGE_API_KEY = Deno.env.get("VOYAGE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
    if (!VOYAGE_API_KEY) throw new Error("VOYAGE_AI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // 1. Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 2. Embed the question using Voyage AI
    const embedResponse = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voyage-3",
        input: [question],
        input_type: "query",
      }),
    });

    if (!embedResponse.ok) {
      const errText = await embedResponse.text();
      console.error("Voyage embed error:", errText);
      throw new Error("Failed to embed question");
    }

    const embedData = await embedResponse.json();
    const queryEmbedding = embedData.data[0].embedding;

    // 3. Semantic search on saved places
    const { data: matchedPlaces, error: matchError } = await supabase.rpc(
      "match_saved_places",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_user_id: userId,
        match_threshold: 0.3,
        match_count: 8,
      }
    );

    if (matchError) {
      console.error("Match error:", matchError);
    }

    // 4. Get user's saved lists for context
    const { data: lists } = await supabase
      .from("saved_lists")
      .select("name, icon")
      .eq("user_id", userId);

    // 5. Get all saved places for broader context
    const { data: allPlaces } = await supabase
      .from("saved_places")
      .select("name, description, address, category")
      .eq("user_id", userId)
      .limit(50);

    // 6. Build context for the LLM
    const profileContext = profile
      ? `User profile: traveler type "${profile.traveler_type}", budget "${profile.monthly_budget}", accommodation "${profile.accommodation_style}", work setup "${profile.work_setup}", vibes: ${(profile.travel_vibe || []).join(", ")}`
      : "No profile available";

    const placesContext = matchedPlaces && matchedPlaces.length > 0
      ? `\nRelevant saved places (semantic match):\n${matchedPlaces.map((p: any) => `- ${p.name} (${p.category}) at ${p.address} — similarity: ${p.similarity.toFixed(2)}`).join("\n")}`
      : "";

    const allPlacesContext = allPlaces && allPlaces.length > 0
      ? `\nAll saved places:\n${allPlaces.map((p: any) => `- ${p.name} (${p.category}): ${p.description || ""} — ${p.address || ""}`).join("\n")}`
      : "\nUser has no saved places yet.";

    const listsContext = lists && lists.length > 0
      ? `\nUser's lists: ${lists.map((l: any) => `${l.icon} ${l.name}`).join(", ")}`
      : "";

    const systemPrompt = `You are a friendly, knowledgeable AI travel companion for digital nomads. You have access to the user's profile and their saved places.

${profileContext}
${placesContext}
${allPlacesContext}
${listsContext}

Answer the user's question in a helpful, concise way. If they ask about places, reference their saved ones when relevant. Suggest specific places, times, and practical tips. Use markdown formatting. Keep responses focused and actionable — 2-4 paragraphs max unless they ask for a full plan.`;

    // 7. Stream response from OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nomaaad.lovable.app",
        "X-Title": "nomaaad",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-companion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
