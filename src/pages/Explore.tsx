import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Plus, Check, Compass, Moon, Sun, LogOut, User,
  BookmarkPlus, Coffee, Utensils, Camera, Wifi, Heart, Train,
  Sparkles, Loader2, ArrowUpRight, Calendar,
  CalendarPlus, Clock, DollarSign, X, Share2,
  Wallet, Zap, Globe, SlidersHorizontal, Crown, ArrowRight
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import ShareableTripCard from '@/components/ShareableTripCard';
import TripTimelineCard from '@/components/TripTimelineCard';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremium } from '@/hooks/usePremium';
import { toast } from '@/hooks/use-toast';

interface AiActivity {
  day: number;
  time: string;
  duration: number;
  title: string;
  description: string;
  category: string;
  location: string;
  cost: string;
}

interface AiPlan {
  title: string;
  summary: string;
  budget_summary: string;
  activities: AiActivity[];
  tips: string[];
}

interface SavedTrip {
  id: string;
  name: string;
  destination: string;
  created_at: string;
  plan?: AiPlan;
  days?: { day_number: number; activities: { time_slot: string; name: string; category: string }[] }[];
}

const AI_CATEGORY_ICONS: Record<string, typeof Coffee> = {
  food: Utensils, work: Wifi, explore: Camera, transport: Train, social: Heart, wellness: Heart,
};

const AI_CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-chart-1/10 text-chart-1', work: 'bg-primary/10 text-primary',
  explore: 'bg-chart-2/10 text-chart-2', transport: 'bg-chart-3/10 text-chart-3',
  social: 'bg-chart-4/10 text-chart-4', wellness: 'bg-chart-5/10 text-chart-5',
};

const CATEGORY_IMAGES: Record<string, string> = {
  food: 'photo-1504674900247-0877df9cc836', work: 'photo-1497366216548-37526070297c',
  explore: 'photo-1469854523086-cc02fe5d8800', transport: 'photo-1544620347-c4fd4a3d5957',
  social: 'photo-1529156069898-49953e39b3ac', wellness: 'photo-1544161515-4ab6ce6db874',
};

// AI-powered destination suggestions
const DESTINATION_SUGGESTIONS = [
  { destination: 'Lisbon', days: 7, emoji: '🇵🇹', label: 'Lisbon · 7 days', vibe: 'Digital Nomad Hub' },
  { destination: 'Bali', days: 14, emoji: '🌴', label: 'Bali · 14 days', vibe: 'Tropical Coworking' },
  { destination: 'Tokyo', days: 5, emoji: '🇯🇵', label: 'Tokyo · 5 days', vibe: 'Culture & Tech' },
  { destination: 'Medellín', days: 10, emoji: '🇨🇴', label: 'Medellín · 10 days', vibe: 'Affordable Paradise' },
  { destination: 'Bangkok', days: 7, emoji: '🇹🇭', label: 'Bangkok · 7 days', vibe: 'Street Food Capital' },
  { destination: 'Barcelona', days: 5, emoji: '🇪🇸', label: 'Barcelona · 5 days', vibe: 'Beach & Architecture' },
  { destination: 'Chiang Mai', days: 14, emoji: '🏯', label: 'Chiang Mai · 14 days', vibe: 'Nomad Classic' },
  { destination: 'Mexico City', days: 7, emoji: '🇲🇽', label: 'CDMX · 7 days', vibe: 'Art & Tacos' },
  { destination: 'Tbilisi', days: 10, emoji: '🇬🇪', label: 'Tbilisi · 10 days', vibe: 'Hidden Gem' },
  { destination: 'Porto', days: 5, emoji: '🍷', label: 'Porto · 5 days', vibe: 'Wine & Coastal Charm' },
  { destination: 'Seoul', days: 7, emoji: '🇰🇷', label: 'Seoul · 7 days', vibe: 'K-Culture & Cafés' },
  { destination: 'Cape Town', days: 10, emoji: '🇿🇦', label: 'Cape Town · 10 days', vibe: 'Nature Meets City' },
];

const FEED_CATEGORIES = ['Coworking', 'Café', 'Hostel', 'Restaurant', 'Temple', 'Market', 'Beach', 'Park'] as const;

const FEED_LOCATIONS = [
  { name: 'Hubud Coworking', city: 'Bali', category: 'Coworking', rating: 4.6, image: 'photo-1497366216548-37526070297c', description: 'Iconic bamboo coworking in Ubud with fast wifi and rice paddy views.' },
  { name: 'Café de Flore', city: 'Paris', category: 'Café', rating: 4.4, image: 'photo-1509042239860-f550ce710b93', description: 'Historic Parisian café on Boulevard Saint-Germain.' },
  { name: 'Selina Lisbon', city: 'Lisbon', category: 'Hostel', rating: 4.3, image: 'photo-1555854877-bab0e564b8d5', description: 'Trendy co-living & hostel with rooftop terrace and events.' },
  { name: 'Punspace', city: 'Chiang Mai', category: 'Coworking', rating: 4.7, image: 'photo-1527192491265-7e15c55b1ed2', description: 'One of Chiang Mai\'s best coworking spaces in Nimman area.' },
  { name: 'Tsukiji Outer Market', city: 'Tokyo', category: 'Market', rating: 4.8, image: 'photo-1553621042-f6e147245754', description: 'Fresh sushi and street food paradise near Ginza.' },
  { name: 'Fushimi Inari Shrine', city: 'Kyoto', category: 'Temple', rating: 4.9, image: 'photo-1478436127897-769e1b3f0f36', description: 'Thousands of vermilion torii gates winding through the mountain.' },
  { name: 'Outsite Bali', city: 'Bali', category: 'Hostel', rating: 4.5, image: 'photo-1537996194471-e657df975ab4', description: 'Coliving space for remote workers in Canggu with pool.' },
  { name: 'Café Lempicka', city: 'Prague', category: 'Café', rating: 4.3, image: 'photo-1501339847302-ac426a4a7cbb', description: 'Art deco café with great pastries near Old Town.' },
  { name: 'El Born Market', city: 'Barcelona', category: 'Market', rating: 4.5, image: 'photo-1534531173927-aeb928d54385', description: 'Historic cast-iron market turned cultural center.' },
  { name: 'Echo Beach', city: 'Bali', category: 'Beach', rating: 4.4, image: 'photo-1507525428034-b723cf961d3e', description: 'Surfer beach with sunset bars in Canggu.' },
  { name: 'Dojo Bali', city: 'Bali', category: 'Coworking', rating: 4.5, image: 'photo-1517502884422-41eaead166d4', description: 'Open-air coworking with pool, right in Canggu.' },
  { name: 'Hoi An Market', city: 'Hoi An', category: 'Market', rating: 4.6, image: 'photo-1555992336-fb0d29498b13', description: 'Vibrant morning market with fresh produce and Banh Mi.' },
];

const ITEMS_PER_PAGE = 8;

export default function Explore() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isPremium, startCheckout } = usePremium();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(false);

  const [aiQuery, setAiQuery] = useState('');
  const [aiPlan, setAiPlan] = useState<AiPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const hasTriggeredRef = useRef(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  const [savedActivities, setSavedActivities] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState<string | null>(null);

  // Saved trips from DB
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [feedCategory, setFeedCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const feedSentinelRef = useRef<HTMLDivElement>(null);
  const [savedFeedItems, setSavedFeedItems] = useState<Set<string>>(new Set());

  const filteredFeed = feedCategory === 'All' ? FEED_LOCATIONS : FEED_LOCATIONS.filter(l => l.category === feedCategory);
  const feedItems = filteredFeed.slice(0, visibleCount);
  const hasMoreFeed = visibleCount < filteredFeed.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [feedCategory]);

  useEffect(() => {
    const sentinel = feedSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMoreFeed) setVisibleCount(prev => prev + ITEMS_PER_PAGE); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreFeed, feedCategory]);

  useEffect(() => { setIsDark(document.documentElement.classList.contains('dark')); }, []);

  // Load saved trips
  useEffect(() => {
    if (!user) return;
    const loadTrips = async () => {
      setTripsLoading(true);
      try {
        const { data: trips } = await supabase
          .from('trips')
          .select('id, name, destination, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (trips && trips.length > 0) {
          // Load days + activities for each trip
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
        setTripsLoading(false);
      }
    };
    loadTrips();
  }, [user]);

  // Accept plan from Journey page via location state
  useEffect(() => {
    const state = location.state as any;
    if (state?.plan && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setAiPlan(state.plan);
      setActiveDay(1);
      if (state.generationTime) setGenerationTime(state.generationTime);
      // Save trip to DB
      saveTripToDb(state.plan, state.destination || '', state.numDays || 7);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      sessionStorage.removeItem('nomaaad_pending_query');
      setAiQuery(q);
      // If not onboarded, redirect to journey with query
      if (profile && !profile.onboarding_completed) {
        navigate('/journey', { state: { prefillDestination: q } });
        return;
      }
      generatePlan(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, profile]);

  const generatePlan = async (query: string) => {
    setAiLoading(true);
    setAiPlan(null);
    setSavedActivities(new Set());
    const startTime = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, profile }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to generate plan');
      }
      const data = await resp.json();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setGenerationTime(elapsed);
      setAiPlan(data.plan);
      setActiveDay(1);
      // Save to DB
      const dest = data.plan?.title?.split('—')?.[0]?.trim() || query.split(' ').slice(0, 3).join(' ');
      saveTripToDb(data.plan, dest, Math.max(...(data.plan?.activities?.map((a: AiActivity) => a.day) || [7])));
    } catch (e) {
      toast({ title: 'AI Error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const saveTripToDb = async (plan: AiPlan, destination: string, numDays: number) => {
    if (!user || !plan) return;
    try {
      const { data: trip, error: tripErr } = await supabase.from('trips').insert({
        user_id: user.id,
        name: plan.title || `Trip to ${destination}`,
        destination,
      }).select().single();
      if (tripErr || !trip) return;

      const days = Array.from(new Set(plan.activities.map(a => a.day))).sort((a, b) => a - b);
      for (const dayNum of days) {
        const { data: day, error: dayErr } = await supabase.from('days').insert({
          trip_id: trip.id,
          day_number: dayNum,
          title: `Day ${dayNum}`,
        }).select().single();
        if (dayErr || !day) continue;

        const dayActivities = plan.activities
          .filter(a => a.day === dayNum)
          .sort((a, b) => a.time.localeCompare(b.time));

        for (let i = 0; i < dayActivities.length; i++) {
          const act = dayActivities[i];
          await supabase.from('activities').insert({
            day_id: day.id,
            name: act.title,
            description: act.description,
            category: act.category,
            time_slot: act.time,
            duration: act.duration,
            sort_order: i,
            address: act.location,
          });
        }
      }

      // Refresh saved trips
      const { data: allTrips } = await supabase
        .from('trips')
        .select('id, name, destination, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (allTrips) {
        const tripsWithData = await Promise.all(allTrips.map(async (t) => {
          const { data: daysData } = await supabase.from('days').select('id, day_number').eq('trip_id', t.id).order('day_number');
          if (!daysData?.length) return { ...t, days: [] };
          const daysWithActs = await Promise.all(daysData.map(async (d) => {
            const { data: acts } = await supabase.from('activities').select('time_slot, name, category').eq('day_id', d.id).order('sort_order');
            return { day_number: d.day_number, activities: acts || [] };
          }));
          return { ...t, days: daysWithActs };
        }));
        setSavedTrips(tripsWithData);
      }
    } catch (e) {
      console.error('Failed to save trip:', e);
    }
  };

  const handleSearchOrSuggestion = (destination: string, days: number) => {
    if (profile && !profile.onboarding_completed) {
      navigate('/journey', { state: { prefillDestination: destination, prefillDays: days } });
      return;
    }
    // Already onboarded — generate directly
    const travelerType = profile?.traveler_type || 'digital nomad';
    const vibes = profile?.travel_vibe?.join(', ') || 'balanced';
    const budget = profile?.monthly_budget || 'mid-range';
    const query = `Plan a trip to ${destination}. Duration: ${days} days. Budget: ${budget}. Vibes: ${vibes}. Traveler type: ${travelerType}.`;
    setAiQuery(destination);
    hasTriggeredRef.current = true;
    generatePlan(query);
  };

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    handleSearchOrSuggestion(aiQuery.trim(), 7);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const saveActivityToList = async (activity: AiActivity) => {
    if (!user) return;
    const activityKey = `${activity.day}-${activity.time}-${activity.title}`;
    if (savedActivities.has(activityKey)) return;

    try {
      let { data: lists } = await supabase.from('saved_lists').select('id').eq('user_id', user.id).eq('name', 'My Itinerary').limit(1);
      let listId: string;
      if (lists && lists.length > 0) {
        listId = lists[0].id;
      } else {
        const { data: newList, error } = await supabase.from('saved_lists').insert({ user_id: user.id, name: 'My Itinerary', icon: '✈️' }).select().single();
        if (error) throw error;
        listId = newList.id;
      }

      const city = aiPlan?.title?.split('—')?.[0]?.trim() || '';
      const { error } = await supabase.from('saved_places').insert({
        list_id: listId, user_id: user.id,
        name: `Day ${activity.day} · ${activity.time} — ${activity.title}`,
        description: `${activity.description}\n💰 ${activity.cost}`,
        address: `${activity.location}${city ? `, ${city}` : ''}`,
        category: activity.category,
      });
      if (error) throw error;

      setSavedActivities(prev => new Set(prev).add(activityKey));
      setJustSaved(activityKey);
      setTimeout(() => setJustSaved(null), 2500);
      toast({ title: '✅ Saved to My Itinerary', description: 'Find your schedule in Lists.' });
    } catch (e) {
      toast({ title: 'Error saving', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const days = aiPlan ? Array.from(new Set(aiPlan.activities.map(a => a.day))).sort((a, b) => a - b) : [];
  const activitiesForDay = aiPlan ? aiPlan.activities.filter(a => a.day === activeDay).sort((a, b) => a.time.localeCompare(b.time)) : [];

  // View: Dashboard (no active plan) vs Plan view
  const showDashboard = !aiPlan && !aiLoading;

  return (
    <div className="min-h-screen bg-background pb-28 flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      {/* Nav */}
      <motion.nav initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-border/20">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-1">
            {user && !isPremium && (
              <Button size="sm" onClick={startCheckout} className="gap-1.5 mr-1">
                <Crown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('header.upgrade')}</span>
              </Button>
            )}
            {user && isPremium && (
              <span className="text-xs font-medium text-primary flex items-center gap-1 px-2">
                <Crown className="h-3.5 w-3.5" /> {t('header.premium')}
              </span>
            )}
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><User className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl w-56">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/lists" className="cursor-pointer"><BookmarkPlus className="h-4 w-4 mr-2" /> {t('explore.myLists')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/explore" className="cursor-pointer"><Calendar className="h-4 w-4 mr-2" /> {t('explore.myTrips')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> {t('explore.signOut')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1 flex flex-col w-full">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-5">
          <h1 className="text-2xl font-sans font-bold text-foreground">{t('explore.greeting')} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {aiPlan ? aiPlan.summary : t('explore.greetingSub')}
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-6 relative max-w-3xl"
        >
          <form onSubmit={handleAiSearch} className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder={t('explore.aiPlaceholder')}
              className="w-full h-14 pl-14 pr-16 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 text-foreground text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" /> : <ArrowUpRight className="h-4 w-4 text-primary-foreground" />}
            </button>
          </form>
        </motion.div>

        {/* Loading state */}
        {aiLoading && !aiPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{t('explore.crafting')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('explore.craftingSub')}</p>
            </div>
          </motion.div>
        )}

        {/* Active plan view */}
        {aiPlan && !aiLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{aiPlan.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />{aiPlan.budget_summary}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setAiPlan(null); setAiQuery(''); hasTriggeredRef.current = false; }} className="rounded-xl gap-1">
                <X className="h-3.5 w-3.5" /> Back
              </Button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-5 scrollbar-hide -mx-4 px-4">
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeDay === day
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Day {day}
                </button>
              ))}
            </div>

            {/* Activity cards grid */}
            <motion.div key={activeDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
              {activitiesForDay.map((activity, idx) => {
                const Icon = AI_CATEGORY_ICONS[activity.category] || Camera;
                const colorClass = AI_CATEGORY_COLORS[activity.category] || 'bg-secondary text-muted-foreground';
                const imgKey = CATEGORY_IMAGES[activity.category] || CATEGORY_IMAGES.explore;
                const activityKey = `${activity.day}-${activity.time}-${activity.title}`;
                const isSaved = savedActivities.has(activityKey);
                const isJustSaved = justSaved === activityKey;

                return (
                  <motion.div key={`${activeDay}-${idx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="rounded-[1.5rem] border-border/30 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={`https://images.unsplash.com/${imgKey}?auto=format&fit=crop&w=800&q=80`} alt={activity.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <motion.button onClick={() => saveActivityToList(activity)} whileTap={{ scale: 0.85 }} animate={isSaved ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}
                            className={`w-9 h-9 rounded-2xl backdrop-blur-md flex items-center justify-center shadow-lg transition-all ${isSaved ? 'bg-primary text-primary-foreground' : 'bg-background/80 hover:bg-background hover:scale-110'}`} title="Save to My Itinerary">
                            {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-foreground" />}
                          </motion.button>
                          <AnimatePresence>
                            {isJustSaved && (
                              <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.9 }} className="absolute top-full right-0 mt-2 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                                  <BookmarkPlus className="h-3 w-3" /> Saved!
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                            <Clock className="h-3 w-3 mr-1" />{activity.time}
                          </Badge>
                          <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                            <DollarSign className="h-3 w-3 mr-1" />{activity.cost}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground text-sm">{activity.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${colorClass}`}>
                            <Icon className="h-3 w-3" />{activity.category}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground font-medium">{activity.duration}min</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Tips + Save All */}
            <div className="mt-10 max-w-2xl">
              {aiPlan.tips?.length > 0 && (
                <div className="mb-6 bg-card border border-border/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground text-sm mb-2">💡 {t('explore.nomadTips')}</h3>
                  <ul className="space-y-1">
                    {aiPlan.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={async () => {
                  if (!aiPlan) return;
                  for (const activity of aiPlan.activities) await saveActivityToList(activity);
                  toast({ title: '🎉 All activities saved!', description: 'Go to Lists to view your itinerary.' });
                }}
                className="w-full rounded-xl h-12 gap-2" size="lg"
              >
                <BookmarkPlus className="h-4 w-4" />
                {t('explore.saveAll')}
              </Button>

              {user && !isPremium && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Unlock unlimited plans</p>
                    <p className="text-xs text-muted-foreground">Upgrade to Premium for unlimited AI itineraries.</p>
                  </div>
                  <Button size="sm" onClick={startCheckout} className="shrink-0 gap-1">
                    <Crown className="h-3.5 w-3.5" /> Upgrade
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== DASHBOARD VIEW ===== */}
        {showDashboard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">

            {/* Destination Suggestions */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('explore.suggestionsTitle')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {DESTINATION_SUGGESTIONS.map((sug, idx) => (
                  <motion.button
                    key={sug.destination}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleSearchOrSuggestion(sug.destination, sug.days)}
                    className="text-left p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <span className="text-2xl">{sug.emoji}</span>
                    <p className="font-semibold text-sm text-foreground mt-2">{sug.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sug.vibe}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Saved Trips as Timeline Cards */}
            {savedTrips.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {t('explore.myTrips')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedTrips.map((trip) => {
                    const day1 = trip.days?.find(d => d.day_number === 1);
                    const totalDays = trip.days?.length || 0;
                    const totalActivities = trip.days?.reduce((sum, d) => sum + d.activities.length, 0) || 0;

                    return (
                      <TripTimelineCard
                        key={trip.id}
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
                        onViewFullPlan={() => {
                          // Navigate to itinerary view for this trip
                          navigate('/itinerary', { state: { tripId: trip.id } });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {tripsLoading && savedTrips.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
            )}

            {/* Upgrade CTA for dashboard */}
            {user && !isPremium && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                <Crown className="h-6 w-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Unlock unlimited AI plans</p>
                  <p className="text-xs text-muted-foreground">Generate unlimited itineraries, save all your trips, and access premium features.</p>
                </div>
                <Button size="sm" onClick={startCheckout} className="shrink-0 gap-1">
                  <Crown className="h-3.5 w-3.5" /> Upgrade
                </Button>
              </motion.div>
            )}

            {/* Location Feed */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t('explore.discoverPlaces')}
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {['All', ...FEED_CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setFeedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      feedCategory === cat ? 'bg-foreground text-background shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 flex-1">
              {feedItems.map((loc, idx) => {
                const isSaved = savedFeedItems.has(loc.name);
                return (
                  <motion.div key={loc.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx % ITEMS_PER_PAGE) * 0.04 }}>
                    <Card className="rounded-[1.5rem] border-border/30 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={`https://images.unsplash.com/${loc.image}?auto=format&fit=crop&w=800&q=80`} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <motion.button whileTap={{ scale: 0.85 }} onClick={async () => {
                            if (!user || isSaved) return;
                            try {
                              let { data: lists } = await supabase.from('saved_lists').select('id').eq('user_id', user.id).eq('name', 'Saved Places').limit(1);
                              let listId: string;
                              if (lists && lists.length > 0) { listId = lists[0].id; }
                              else {
                                const { data: newList, error } = await supabase.from('saved_lists').insert({ user_id: user.id, name: 'Saved Places', icon: '📍' }).select().single();
                                if (error) throw error;
                                listId = newList.id;
                              }
                              const { error } = await supabase.from('saved_places').insert({ list_id: listId, user_id: user.id, name: loc.name, description: loc.description, category: loc.category });
                              if (error) throw error;
                              setSavedFeedItems(prev => new Set(prev).add(loc.name));
                              toast({ title: '📍 Saved!', description: `${loc.name} added to Saved Places.` });
                            } catch (e) {
                              toast({ title: 'Error', description: e instanceof Error ? e.message : 'Unknown', variant: 'destructive' });
                            }
                          }}
                            className={`w-9 h-9 rounded-2xl backdrop-blur-md flex items-center justify-center shadow-lg transition-all ${isSaved ? 'bg-primary text-primary-foreground' : 'bg-background/80 hover:bg-background hover:scale-110'}`}>
                            {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-foreground" />}
                          </motion.button>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-xs text-primary-foreground/70 font-medium">{loc.city}</p>
                          <h3 className="text-sm font-bold text-primary-foreground leading-tight">{loc.name}</h3>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground line-clamp-2">{loc.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className="rounded-full text-[11px]">{loc.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">⭐ {loc.rating}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div ref={feedSentinelRef} className="h-10" />
            {hasMoreFeed && (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-muted-foreground animate-spin" /></div>
            )}
            {!hasMoreFeed && feedItems.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">{t('explore.seenAll')}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating bottom nav — mobile */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-card/90 backdrop-blur-2xl border border-border/20 shadow-2xl shadow-foreground/10">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-primary font-semibold">{t('explore.explore')}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full" asChild>
            <Link to="/journey">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t('explore.journey')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full" asChild>
            <Link to="/destinations">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t('explore.placesNav')}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
