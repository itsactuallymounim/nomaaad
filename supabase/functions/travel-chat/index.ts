import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { query, profile } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

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
- Booking tip

### 💻 Where to Work
Top 3 coworking spaces or work-friendly cafés with:
- Name, address, daily/weekly pass price
- Wi-Fi speed, power outlets, vibe
- Best for: (focus work / calls / casual)

### 📅 Day-by-Day Itinerary
For each day include a structured table:
| Time | Activity | Location | Est. Cost |
Morning work spot, lunch recommendation, afternoon activity, evening social/cultural activity.
Include specific place names, neighborhoods.

### 🍽️ Food & Drink
- Budget meals (under €5-10)
- Mid-range favorites
- Must-try local dishes with where to find them

### 💡 Nomad Tips
5 practical tips: SIM cards, transport, safety, community meetups, visa info.

Be specific with real place names, current pricing, and practical details. Tailor everything to the user's profile.`;

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
          { role: "user", content: query },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to generate travel plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
