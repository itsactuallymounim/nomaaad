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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { query, profile } = (body ?? {}) as { query?: unknown; profile?: unknown };

    // Validate query
    if (typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request: 'query' must be a non-empty string" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (query.length > 4000) {
      return new Response(JSON.stringify({ error: "Query too long (max 4000 characters)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate profile (optional)
    const sanitizeStr = (v: unknown, max = 200): string | null =>
      typeof v === "string" && v.length <= max ? v : null;
    const sanitizeArr = (v: unknown, maxItems = 20, maxLen = 100): string[] =>
      Array.isArray(v)
        ? v.filter((x) => typeof x === "string" && x.length <= maxLen).slice(0, maxItems)
        : [];
    let safeProfile: Record<string, unknown> | null = null;
    if (profile && typeof profile === "object") {
      const p = profile as Record<string, unknown>;
      safeProfile = {
        traveler_type: sanitizeStr(p.traveler_type),
        monthly_budget: sanitizeStr(p.monthly_budget),
        accommodation_style: sanitizeStr(p.accommodation_style),
        work_setup: sanitizeStr(p.work_setup),
        travel_vibe: sanitizeArr(p.travel_vibe),
        search_priorities: sanitizeArr(p.search_priorities),
        app_goals: sanitizeArr(p.app_goals),
      };
    }
    const safeQuery = query.trim();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileContext = safeProfile
      ? `
User's digital nomad profile:
- Traveler type: ${safeProfile.traveler_type || "not specified"}
- Monthly budget: ${safeProfile.monthly_budget || "not specified"}
- Accommodation style: ${safeProfile.accommodation_style || "not specified"}
- Work setup: ${safeProfile.work_setup || "not specified"}
- Travel vibe: ${(safeProfile.travel_vibe as string[]).join(", ") || "not specified"}
- Search priorities: ${(safeProfile.search_priorities as string[]).join(", ") || "not specified"}
- App goals: ${(safeProfile.app_goals as string[]).join(", ") || "not specified"}
`
      : "";

    const systemPrompt = `You are an expert digital nomad travel planner. Given a travel query, generate a structured travel plan with activity cards.

${profileContext}

Return a JSON object with this structure using the travel_plan tool. Generate 4-6 activity cards PER DAY covering work spots, food, exploration and social activities. Use REAL, well-known place names with full address (street + city + country) so they can be geocoded on Google Maps. Keep descriptions short (max 20 words). Distribute activities across days evenly.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: safeQuery },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
        stream: false,
        tools: [
          {
            type: "function",
            function: {
              name: "travel_plan",
              description: "Return a structured travel plan with activity cards",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Plan title e.g. 'Lisbon — 7 Day Nomad Guide'" },
                  summary: { type: "string", description: "2-3 sentence overview of the plan" },
                  budget_summary: { type: "string", description: "Brief budget overview with key costs" },
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "number", description: "Day number (1-based)" },
                        time: { type: "string", description: "Time in HH:MM 24h format" },
                        duration: { type: "number", description: "Duration in minutes" },
                        title: { type: "string", description: "Activity name" },
                        description: { type: "string", description: "Brief description (1-2 sentences)" },
                        category: { type: "string", enum: ["food", "work", "explore", "transport", "social", "wellness"] },
                        location: { type: "string", description: "Specific place name and address" },
                        cost: { type: "string", description: "Estimated cost e.g. '€5' or 'Free'" },
                      },
                      required: ["day", "time", "duration", "title", "description", "category", "location", "cost"],
                      additionalProperties: false,
                    },
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 practical nomad tips",
                  },
                },
                required: ["title", "summary", "budget_summary", "activities", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "travel_plan" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM error:", response.status, errorText);
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
      return new Response(
        JSON.stringify({ error: "Failed to generate travel plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to parse travel plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let plan;
    try {
      plan = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call args:", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Failed to parse travel plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("travel-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
