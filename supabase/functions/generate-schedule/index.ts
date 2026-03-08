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
    const { city, days, startDate, profile } = await req.json();
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

    const systemPrompt = `You are an expert travel planner. Generate a day-by-day schedule as JSON.

${profileContext}

Return ONLY a valid JSON array (no markdown, no code fences). Each element is a day object:
[
  {
    "day": 1,
    "title": "Arrival & Settling In",
    "activities": [
      {
        "time": "09:00",
        "duration": 60,
        "title": "Activity title",
        "description": "Brief description",
        "category": "food|work|explore|transport|social|wellness",
        "location": "Place name, address"
      }
    ]
  }
]

Rules:
- Generate exactly ${days} days for ${city}
- Start date is ${startDate}
- Each day should have 4-7 activities from morning to evening
- Use 24h time format (HH:MM)
- Duration in minutes
- Mix work, food, explore, and social activities based on user preferences
- Be specific with real place names
- Include breakfast, lunch, dinner
- For work-first nomads, include morning/afternoon work blocks`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create a ${days}-day schedule for ${city} starting ${startDate}` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate schedule" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response, handling potential markdown code fences
    let schedule;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      schedule = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse schedule JSON:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse schedule" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ schedule }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-schedule error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
