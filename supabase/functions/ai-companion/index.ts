import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLLM(messages: any[], openrouterKey: string, lovableKey?: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openrouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nomaaad.lovable.app",
      "X-Title": "nomaaad",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });

  if (response.ok) return response;

  if ((response.status === 402 || response.status === 429) && lovableKey) {
    console.log("OpenRouter unavailable, falling back to Lovable AI");
    await response.text();
    return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });
  }

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const VOYAGE_API_KEY = Deno.env.get("VOYAGE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) throw new Error("No LLM API key configured");
    if (!VOYAGE_API_KEY) throw new Error("VOYAGE_AI_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Embed the question using Voyage AI for semantic search
    let matchedPlaces: any[] = [];
    try {
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

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        const queryEmbedding = embedData.data[0].embedding;

        const { data } = await supabase.rpc("match_saved_places", {
          query_embedding: JSON.stringify(queryEmbedding),
          match_user_id: userId,
          match_threshold: 0.3,
          match_count: 8,
        });
        if (data) matchedPlaces = data;
      }
    } catch (e) {
      console.error("Embedding/search error (non-fatal):", e);
    }

    // Get all saved places for context
    const { data: allPlaces } = await supabase
      .from("saved_places")
      .select("name, description, address, category")
      .eq("user_id", userId)
      .limit(50);

    const { data: lists } = await supabase
      .from("saved_lists")
      .select("name, icon")
      .eq("user_id", userId);

    // Build context
    const profileContext = profile
      ? `User profile: type "${profile.traveler_type}", budget "${profile.monthly_budget}", accommodation "${profile.accommodation_style}", work "${profile.work_setup}", vibes: ${(profile.travel_vibe || []).join(", ")}`
      : "";

    const placesContext = matchedPlaces.length > 0
      ? `\nSemantically relevant saved places:\n${matchedPlaces.map((p: any) => `- ${p.name} (${p.category}) — ${p.address}`).join("\n")}`
      : "";

    const allPlacesContext = allPlaces && allPlaces.length > 0
      ? `\nAll saved places:\n${allPlaces.map((p: any) => `- ${p.name} (${p.category}): ${p.description || ""} — ${p.address || ""}`).join("\n")}`
      : "\nNo saved places yet.";

    const listsContext = lists && lists.length > 0
      ? `\nLists: ${lists.map((l: any) => `${l.icon} ${l.name}`).join(", ")}`
      : "";

    const systemPrompt = `You are a friendly AI travel companion for digital nomads. You know the user's preferences and their saved places.

${profileContext}${placesContext}${allPlacesContext}${listsContext}

Answer helpfully and concisely with markdown. Reference the user's saved places when relevant. Give specific recommendations with place names, prices, and practical tips. Keep responses to 2-4 focused paragraphs unless they ask for a full plan.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const response = await callLLM(messages, OPENROUTER_API_KEY, LOVABLE_API_KEY);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM error:", response.status, errorText);
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
