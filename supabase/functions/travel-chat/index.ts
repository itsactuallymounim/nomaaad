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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileContext = profile
      ? `
User profile:
- Traveler type: ${profile.traveler_type || "not specified"}
- Monthly budget: ${profile.monthly_budget || "not specified"}
- Accommodation style: ${profile.accommodation_style || "not specified"}
- Work setup: ${profile.work_setup || "not specified"}
- Travel vibe: ${(profile.travel_vibe || []).join(", ") || "not specified"}
- Search priorities: ${(profile.search_priorities || []).join(", ") || "not specified"}
`
      : "";

    const systemPrompt = `You are an expert digital nomad travel planner. Generate detailed, actionable travel plans for digital nomads.

${profileContext}

When given a travel query, respond with a well-structured travel plan using markdown formatting:

## 🗺️ [City] — [Duration] Digital Nomad Guide

### 💰 Budget Overview
A brief budget breakdown.

### 🏠 Where to Stay
Top 2-3 accommodation recommendations with prices.

### 💻 Where to Work
Top 2-3 coworking spaces or cafés with Wi-Fi ratings.

### 📅 Day-by-Day Itinerary
For each day, include:
- **Morning**: Work or explore activity
- **Afternoon**: Activity
- **Evening**: Activity
Include specific place names, neighborhoods, and estimated costs.

### 🍽️ Food & Drink
Top local food recommendations with price ranges.

### 💡 Nomad Tips
3-5 practical tips for digital nomads in this city.

Keep it practical, specific, and budget-conscious. Use real place names and current pricing estimates.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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
