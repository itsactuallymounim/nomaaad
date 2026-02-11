import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTravelStore } from '@/store/travelStore';
import { useAuth } from '@/hooks/useAuth';
import type { Trip, Day, Activity } from '@/types/trip';
import { toast } from '@/hooks/use-toast';

export function useTripPersistence() {
  const { user } = useAuth();
  const { activeItinerary, setActiveItinerary } = useTravelStore();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load trip on mount
  useEffect(() => {
    if (!user) {
      setActiveItinerary(null);
      return;
    }
    loadTrip();
  }, [user]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!user || !activeItinerary) return;
    
    const serialized = JSON.stringify(activeItinerary);
    if (serialized === lastSavedRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTrip(activeItinerary);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user, activeItinerary]);

  const loadTrip = useCallback(async () => {
    if (!user) return;

    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to load trips:', error);
      return;
    }

    if (!trips || trips.length === 0) return;

    const tripRow = trips[0];

    const { data: dayRows, error: daysError } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripRow.id)
      .order('day_number', { ascending: true });

    if (daysError) {
      console.error('Failed to load days:', daysError);
      return;
    }

    const dayIds = (dayRows || []).map(d => d.id);
    let activityRows: any[] = [];
    if (dayIds.length > 0) {
      const { data, error: actError } = await supabase
        .from('activities')
        .select('*')
        .in('day_id', dayIds)
        .order('sort_order', { ascending: true });

      if (actError) {
        console.error('Failed to load activities:', actError);
        return;
      }
      activityRows = data || [];
    }

    const days: Day[] = (dayRows || []).map(d => ({
      id: d.id,
      dayNumber: d.day_number,
      date: d.date || '',
      title: d.title,
      activities: activityRows
        .filter(a => a.day_id === d.id)
        .map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          coordinates: { lat: a.lat, lng: a.lng },
          category: a.category as Activity['category'],
          timeSlot: a.time_slot as Activity['timeSlot'],
          mediaUrl: a.media_url || undefined,
          duration: a.duration || undefined,
          price: a.price ? Number(a.price) : undefined,
          rating: a.rating ? Number(a.rating) : undefined,
          address: a.address || undefined,
        })),
    }));

    const trip: Trip = {
      id: tripRow.id,
      name: tripRow.name,
      destination: tripRow.destination,
      startDate: tripRow.start_date || '',
      endDate: tripRow.end_date || '',
      coverImage: tripRow.cover_image || undefined,
      days,
      createdAt: tripRow.created_at,
      updatedAt: tripRow.updated_at,
    };

    lastSavedRef.current = JSON.stringify(trip);
    setActiveItinerary(trip);
  }, [user, setActiveItinerary]);

  const saveTrip = useCallback(async (trip: Trip) => {
    if (!user) return;

    try {
      // Upsert trip
      const { error: tripError } = await supabase
        .from('trips')
        .upsert({
          id: trip.id,
          user_id: user.id,
          name: trip.name,
          destination: trip.destination,
          start_date: trip.startDate || null,
          end_date: trip.endDate || null,
          cover_image: trip.coverImage || null,
        });

      if (tripError) throw tripError;

      // Delete existing days & activities (cascade), then re-insert
      await supabase.from('days').delete().eq('trip_id', trip.id);

      for (const day of trip.days) {
        const { error: dayError } = await supabase.from('days').insert({
          id: day.id,
          trip_id: trip.id,
          day_number: day.dayNumber,
          date: day.date || null,
          title: day.title,
        });
        if (dayError) throw dayError;

        if (day.activities.length > 0) {
          const actRows = day.activities.map((a, idx) => ({
            id: a.id,
            day_id: day.id,
            name: a.name,
            description: a.description,
            lat: a.coordinates.lat,
            lng: a.coordinates.lng,
            category: a.category,
            time_slot: a.timeSlot,
            media_url: a.mediaUrl || null,
            duration: a.duration || null,
            price: a.price || null,
            rating: a.rating || null,
            address: a.address || null,
            sort_order: idx,
          }));
          const { error: actError } = await supabase.from('activities').insert(actRows);
          if (actError) throw actError;
        }
      }

      lastSavedRef.current = JSON.stringify(trip);
    } catch (err: any) {
      console.error('Failed to save trip:', err);
      toast({ title: 'Save failed', description: 'Could not save your trip.', variant: 'destructive' });
    }
  }, [user]);

  const createNewTrip = useCallback(async (name: string, destination: string) => {
    if (!user) return;

    const id = crypto.randomUUID();
    const trip: Trip = {
      id,
      name,
      destination,
      startDate: '',
      endDate: '',
      days: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveItinerary(trip);
    await saveTrip(trip);
  }, [user, setActiveItinerary, saveTrip]);

  return { loadTrip, saveTrip, createNewTrip };
}
