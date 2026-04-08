import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import TripTimelineCard from '@/components/TripTimelineCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useI18n } from '@/lib/i18n';

interface SavedTrip {
  id: string;
  name: string;
  destination: string;
  created_at: string;
  days?: { day_number: number; activities: { time_slot: string; name: string; category: string }[] }[];
}

export default function Trips() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadTrips = async () => {
      setLoading(true);
      try {
        const { data: trips } = await supabase
          .from('trips')
          .select('id, name, destination, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (trips && trips.length > 0) {
          const tripsWithData = await Promise.all(trips.map(async (trip) => {
            const { data: days } = await supabase
              .from('days')
              .select('id, day_number')
              .eq('trip_id', trip.id)
              .order('day_number');
            if (!days?.length) return { ...trip, days: [] };
            const daysWithActivities = await Promise.all(days.map(async (day) => {
              const { data: activities } = await supabase
                .from('activities')
                .select('time_slot, name, category')
                .eq('day_id', day.id)
                .order('sort_order');
              return { day_number: day.day_number, activities: activities || [] };
            }));
            return { ...trip, days: daysWithActivities };
          }));
          setSavedTrips(tripsWithData);
        }
      } catch (e) {
        console.error('Failed to load trips:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t('header.yourTrips')}
        </h1>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}

        {!loading && savedTrips.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No trips yet. Start exploring!</p>
          </div>
        )}

        {!loading && savedTrips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedTrips.map((trip, idx) => {
              const day1 = trip.days?.find(d => d.day_number === 1);
              const totalDays = trip.days?.length || 0;
              return (
                <motion.div key={trip.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <TripTimelineCard
                    destination={trip.destination || trip.name}
                    dayNumber={1}
                    totalDays={totalDays}
                    travelerType={profile?.traveler_type || 'Digital Nomad'}
                    budgetLabel={profile?.monthly_budget || 'Budget'}
                    activities={day1?.activities.map(a => ({
                      time: a.time_slot,
                      title: a.name,
                      category: a.category,
                    })) || []}
                    totalCost="~€35 estimated"
                    onViewFullPlan={() => navigate('/itinerary', { state: { tripId: trip.id } })}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
