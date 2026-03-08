import { supabase } from '@/integrations/supabase/client';

const EMBED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed`;

export async function getEmbeddings(texts: string[], inputType: 'document' | 'query' = 'document'): Promise<number[][] | null> {
  try {
    const resp = await fetch(EMBED_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ texts, input_type: inputType }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.embeddings;
  } catch {
    return null;
  }
}

export async function embedProfile(profileData: {
  traveler_type?: string | null;
  monthly_budget?: string | null;
  accommodation_style?: string | null;
  work_setup?: string | null;
  travel_vibe?: string[];
  search_priorities?: string[];
  app_goals?: string[];
}, userId: string) {
  const text = [
    profileData.traveler_type && `Traveler type: ${profileData.traveler_type}`,
    profileData.monthly_budget && `Budget: ${profileData.monthly_budget}`,
    profileData.accommodation_style && `Accommodation: ${profileData.accommodation_style}`,
    profileData.work_setup && `Work setup: ${profileData.work_setup}`,
    profileData.travel_vibe?.length && `Travel vibe: ${profileData.travel_vibe.join(', ')}`,
    profileData.search_priorities?.length && `Priorities: ${profileData.search_priorities.join(', ')}`,
    profileData.app_goals?.length && `Goals: ${profileData.app_goals.join(', ')}`,
  ].filter(Boolean).join('. ');

  if (!text) return;

  const embeddings = await getEmbeddings([text]);
  if (!embeddings?.[0]) return;

  await supabase
    .from('profiles')
    .update({ embedding: JSON.stringify(embeddings[0]) } as any)
    .eq('id', userId);
}

export async function embedSavedPlace(place: {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  category?: string | null;
}) {
  const text = [
    place.name,
    place.category && `Category: ${place.category}`,
    place.description,
    place.address && `Location: ${place.address}`,
  ].filter(Boolean).join('. ');

  const embeddings = await getEmbeddings([text]);
  if (!embeddings?.[0]) return;

  await supabase
    .from('saved_places')
    .update({ embedding: JSON.stringify(embeddings[0]) } as any)
    .eq('id', place.id);
}
