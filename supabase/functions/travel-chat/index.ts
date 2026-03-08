import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLLM(messages: any[], apiKey: string) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileContext = profile
      ? `
User's digital nomad profile:
- Traveler type: ${profile.traveler_type || "not specified"}
- Monthly budget: ${profile.monthly_budget || "not specified"}
- Accommodation style: ${profile.accommodation_style || "not specified"}
- Work setup: ${profile.work_setup || "not specified"}
- Travel vibe: ${(profile.travel_vibe || []).join(", ") || "not specified"}
- Search priorities: ${(profile.search_priorities || []).join(", ") || "not specified"}
- App goals: ${(profile.app_goals || []).join(", ") || "not specified"}
`
      : "";

    const systemPrompt = `You are an expert digital nomad travel planner powered by real local knowledge. Generate detailed, actionable travel plans personalized to the user.

${profileContext}

When given a travel query, respond with a well-structured travel plan using markdown:

## 🗺️ [City] — [Duration] Digital Nomad Guide

### 💰 Budget Overview
Detailed budget breakdown with specific prices in local currency + EUR/USD.

### 🏠 Where to Stay
Top 3 accommodation recommendations matching the user's style, with:
- Name, neighborhood, price per night
- Wi-Fi speed rating, nomad-friendliness

### 💻 Where to Work
Top 3 coworking spaces or work-friendly cafés with:
- Name, address, daily/weekly pass price
- Wi-Fi speed, power outlets, vibe

### 📅 Day-by-Day Itinerary
For each day include:
| Time | Activity | Location | Est. Cost |
Morning work spot, lunch, afternoon activity, evening social/cultural activity.

### 🍽️ Food & Drink
Budget meals, mid-range favorites, must-try local dishes.

### 💡 Nomad Tips
5 practical tips: SIM cards, transport, safety, community meetups, visa info.

Be specific with real place names and practical details.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ];

    const response = await callLLM(messages, LOVABLE_API_KEY);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: response.status === 429 ? "Rate limit exceeded" : "Failed to generate travel plan" }),
        { status: response.status >= 400 ? response.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("travel-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
