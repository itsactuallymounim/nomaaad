import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Nomaaad, a friendly and knowledgeable AI travel planning assistant. You help users plan trips by suggesting activities, restaurants, accommodations, and attractions.

When the user asks for recommendations, you MUST call the "suggest_activities" tool to provide structured activity proposals alongside your conversational response.

Guidelines:
- Always provide coordinates (lat/lng) for locations you suggest. Be accurate.
- Suggest activities appropriate to the destination and time of day.
- Include estimated prices in USD when possible.
- Include ratings (1-5 scale) based on your knowledge.
- Be enthusiastic but concise.
- When suggesting activities, also provide a brief conversational message explaining your picks.
- Category must be one of: accommodation, restaurant, attraction, transport, activity, shopping, nightlife
- TimeSlot must be one of: morning, afternoon, evening, night

ACCOMMODATION FOCUS:
- When users ask about places to stay, hostels, or budget accommodation, recommend real hostels and budget stays that are commonly listed on Hostelworld.
- Include the hostel name, approximate nightly price, rating, and address.
- Mention that users can book these on Hostelworld.com for the best hostel deals.
- Prioritize well-known, highly-rated hostels in the destination.

Current itinerary context will be provided so you can make relevant suggestions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Authentication ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages, itineraryContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemMessages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (itineraryContext) {
      systemMessages.push({
        role: "system",
        content: `Current itinerary context:\n${JSON.stringify(itineraryContext, null, 2)}`,
      });
    }

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
          messages: [...systemMessages, ...messages],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_activities",
                description:
                  "Suggest travel activities, restaurants, or attractions to add to the itinerary. Call this whenever you recommend specific places or activities.",
                parameters: {
                  type: "object",
                  properties: {
                    activities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Name of the place or activity" },
                          description: { type: "string", description: "Brief description (1-2 sentences)" },
                          lat: { type: "number", description: "Latitude coordinate" },
                          lng: { type: "number", description: "Longitude coordinate" },
                          category: {
                            type: "string",
                            enum: ["accommodation", "restaurant", "attraction", "transport", "activity", "shopping", "nightlife"],
                          },
                          timeSlot: {
                            type: "string",
                            enum: ["morning", "afternoon", "evening", "night"],
                          },
                          duration: { type: "number", description: "Duration in minutes" },
                          price: { type: "number", description: "Estimated price in USD" },
                          rating: { type: "number", description: "Rating out of 5" },
                          address: { type: "string", description: "Address of the place" },
                        },
                        required: ["name", "description", "lat", "lng", "category", "timeSlot"],
                      },
                    },
                  },
                  required: ["activities"],
                },
              },
            },
          ],
          tool_choice: "auto",
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const choice = data.choices?.[0];
    const message = choice?.message;

    let content = message?.content || "";
    let activities: any[] = [];

    // Extract tool calls
    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.name === "suggest_activities") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            activities = args.activities || [];
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
          }
        }
      }
    }

    // If we got activities but no text content, add a default message
    if (!content && activities.length > 0) {
      content = "Here are some great options I found for you:";
    }

    return new Response(
      JSON.stringify({ content, activities }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("travel-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
