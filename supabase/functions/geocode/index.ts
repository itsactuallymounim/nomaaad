import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

interface Query { address: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Google Maps credentials' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const queries: Query[] = Array.isArray(body?.queries) ? body.queries : [];
    if (!queries.length || queries.length > 60) {
      return new Response(JSON.stringify({ error: 'queries must be an array (max 60)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bias = typeof body?.city === 'string' ? body.city : undefined;

    const results = await Promise.all(queries.map(async (q) => {
      const addr = typeof q?.address === 'string' ? q.address.slice(0, 300).trim() : '';
      if (!addr) return null;
      const textQuery = bias && !addr.toLowerCase().includes(bias.toLowerCase())
        ? `${addr}, ${bias}` : addr;
      try {
        const resp = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': 'places.location,places.displayName,places.formattedAddress',
          },
          body: JSON.stringify({ textQuery, maxResultCount: 1 }),
        });
        if (!resp.ok) {
          console.error('places searchText failed', resp.status, await resp.text());
          return null;
        }
        const data = await resp.json();
        const p = data?.places?.[0];
        if (!p?.location) return null;
        return {
          lat: p.location.latitude,
          lng: p.location.longitude,
          name: p.displayName?.text || null,
          address: p.formattedAddress || null,
        };
      } catch (e) {
        console.error('geocode error', e);
        return null;
      }
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('geocode fn error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});