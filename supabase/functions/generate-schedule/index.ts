import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { city, days, startDate, profile, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user preference history
    let preferenceContext = "";
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: prefs } = await supabase
        .from("preference_logs")
        .select("activity_title, activity_category, rating, feedback, city")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (prefs && prefs.length > 0) {
        const liked = prefs.filter((p) => p.rating && p.rating >= 4);
        const disliked = prefs.filter((p) => p.rating && p.rating <= 2);

        const categoryStats: Record<string, { total: number; sum: number }> = {};
        prefs.forEach((p) => {
          if (!p.rating) return;
          if (!categoryStats[p.activity_category]) categoryStats[p.activity_category] = { total: 0, sum: 0 };
          categoryStats[p.activity_category].total++;
          categoryStats[p.activity_category].sum += p.rating;
        });

        const favCategories = Object.entries(categoryStats)
          .map(([cat, s]) => ({ cat, avg: s.sum / s.total }))
          .sort((a, b) => b.avg - a.avg);

        preferenceContext = `
LEARNED USER PREFERENCES (from ${prefs.length} past ratings):
- Favorite activity categories: ${favCategories.slice(0, 3).map((c) => `${c.cat} (avg ${c.avg.toFixed(1)}/5)`).join(", ")}
- Activities they loved: ${liked.slice(0, 5).map((p) => `"${p.activity_title}" in ${p.city}`).join(", ") || "none yet"}
- Activities they disliked: ${disliked.slice(0, 5).map((p) => `"${p.activity_title}" in ${p.city}`).join(", ") || "none yet"}
- User feedback: ${prefs.filter((p) => p.feedback).slice(0, 3).map((p) => `"${p.feedback}"`).join("; ") || "none"}

IMPORTANT: Use these preferences to personalize the schedule. Suggest MORE activities similar to what they loved. AVOID types of activities they disliked.
`;
      }
    }

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
${preferenceContext}

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("LLM error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate schedule" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

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
