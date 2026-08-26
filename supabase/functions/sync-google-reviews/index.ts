import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.reviews',
].join(',');

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max).trim() : '';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return json({ error: 'Missing Google Maps credentials' }, 500);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);

    const name = clean((body as Record<string, unknown>).name, 160);
    const address = clean((body as Record<string, unknown>).address, 300);
    const city = clean((body as Record<string, unknown>).city, 120);

    if (name.length < 2) return json({ error: 'A business name of at least 2 characters is required' }, 400);

    const textQuery = [name, address, city].filter(Boolean).join(', ');

    const resp = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({ textQuery, maxResultCount: 1 }),
    });

    if (!resp.ok) {
      console.error('places searchText failed', resp.status, await resp.text());
      return json({ error: 'Google place lookup failed' }, 502);
    }

    const data = await resp.json();
    const place = data?.places?.[0];
    if (!place) return json({ match: null });

    const reviews = Array.isArray(place.reviews)
      ? place.reviews.slice(0, 5).map((r: Record<string, any>) => ({
          author: r?.authorAttribution?.displayName ?? 'Google user',
          avatar: r?.authorAttribution?.photoUri ?? null,
          rating: typeof r?.rating === 'number' ? r.rating : null,
          text: clean(r?.originalText?.text ?? r?.text?.text, 1200),
          relative_time: clean(r?.relativePublishTimeDescription, 80),
          published_at: clean(r?.publishTime, 40) || null,
        }))
      : [];

    return json({
      match: {
        place_id: clean(place.id, 200) || null,
        name: clean(place.displayName?.text, 200) || null,
        address: clean(place.formattedAddress, 300) || null,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
        rating: typeof place.rating === 'number' ? place.rating : null,
        review_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
        price_level: PRICE_LEVEL_MAP[place.priceLevel as string] ?? null,
        website: clean(place.websiteUri, 300) || null,
        phone: clean(place.nationalPhoneNumber, 60) || null,
        reviews,
      },
    });
  } catch (e) {
    console.error('sync-google-reviews error', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
