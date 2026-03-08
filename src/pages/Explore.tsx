import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin, Plus, Check, Compass, Moon, Sun, LogOut, User,
  BookmarkPlus, Coffee, Utensils, Camera, Wifi, Heart, Train,
  Sparkles, Loader2, ArrowUpRight, Calendar,
  CalendarPlus, Clock, DollarSign, X
} from 'lucide-react';
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

const AI_CATEGORY_ICONS: Record<string, typeof Coffee> = {
  food: Utensils,
  work: Wifi,
  explore: Camera,
  transport: Train,
  social: Heart,
  wellness: Heart,
};

const AI_CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-chart-1/10 text-chart-1',
  work: 'bg-primary/10 text-primary',
  explore: 'bg-chart-2/10 text-chart-2',
  transport: 'bg-chart-3/10 text-chart-3',
  social: 'bg-chart-4/10 text-chart-4',
  wellness: 'bg-chart-5/10 text-chart-5',
};

// Unsplash images for activity categories
const CATEGORY_IMAGES: Record<string, string> = {
  food: 'photo-1504674900247-0877df9cc836',
  work: 'photo-1497366216548-37526070297c',
  explore: 'photo-1469854523086-cc02fe5d8800',
  transport: 'photo-1544620347-c4fd4a3d5957',
  social: 'photo-1529156069898-49953e39b3ac',
  wellness: 'photo-1544161515-4ab6ce6db874',
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`;

function buildGoogleCalendarUrl(activity: AiActivity, startDate: string, city: string) {
  const [hours, minutes] = activity.time.split(':').map(Number);
  const d = new Date(startDate);
  d.setDate(d.getDate() + activity.day - 1);
  d.setHours(hours, minutes, 0, 0);
  const end = new Date(d.getTime() + activity.duration * 60 * 1000);
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    details: `${activity.description}\n💰 ${activity.cost}\n📍 ${activity.location}`,
    location: `${activity.location}, ${city}`,
    dates: `${fmt(d)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function Explore() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(false);

  const [aiQuery, setAiQuery] = useState('');
  const [aiPlan, setAiPlan] = useState<AiPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const hasTriggeredRef = useRef(false);

  const [timelineStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => { setIsDark(document.documentElement.classList.contains('dark')); }, []);

  // Handle query param from landing page
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      sessionStorage.removeItem('nomaaad_pending_query');
      setAiQuery(q);
      generatePlan(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Auto-generate a plan from profile after onboarding if no query
  useEffect(() => {
    if (hasTriggeredRef.current || aiPlan || aiLoading) return;
    if (!profile?.onboarding_completed) return;
    if (!profile.favorite_destinations?.length) return;

    hasTriggeredRef.current = true;
    const dest = profile.favorite_destinations[0];
    const budget = profile.monthly_budget || 'mid-range';
    const vibe = profile.travel_vibe?.join(', ') || 'balanced';
    const query = `Plan a 7-day trip to ${dest}. Budget: ${budget}. Vibe: ${vibe}. I'm a ${profile.traveler_type || 'digital nomad'}.`;
    setAiQuery(query);
    generatePlan(query);
  }, [profile, aiPlan, aiLoading]);

  const generatePlan = async (query: string) => {
    setAiLoading(true);
    setAiPlan(null);
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, profile }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to generate plan');
      }
      const data = await resp.json();
      setAiPlan(data.plan);
      setActiveDay(1);
    } catch (e) {
      toast({ title: 'AI Error', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    hasTriggeredRef.current = true;
    generatePlan(aiQuery.trim());
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const exportAllToGoogleCalendar = () => {
    if (!aiPlan) return;
    const city = aiPlan.title?.split('—')?.[0]?.trim() || 'Trip';
    aiPlan.activities.forEach((activity, i) => {
      setTimeout(() => {
        window.open(buildGoogleCalendarUrl(activity, timelineStartDate, city), '_blank');
      }, i * 400);
    });
  };

  // Get unique days from plan
  const days = aiPlan
    ? Array.from(new Set(aiPlan.activities.map(a => a.day))).sort((a, b) => a - b)
    : [];

  const activitiesForDay = aiPlan
    ? aiPlan.activities.filter(a => a.day === activeDay).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-border/20"
      >
        <div className="flex items-center justify-between px-4 md:px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Link to="/journey"><Sparkles className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Link to="/lists"><BookmarkPlus className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl w-56">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/lists" className="cursor-pointer"><BookmarkPlus className="h-4 w-4 mr-2" /> {t('explore.myLists')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> {t('explore.signOut')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-5">
          <h1 className="text-2xl font-sans font-bold text-foreground">{t('explore.greeting')} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {aiPlan ? aiPlan.summary : 'Generate your personalized travel plan below.'}
          </p>
        </motion.div>

        {/* AI Search bar */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Crafting your itinerary...</p>
              <p className="text-sm text-muted-foreground mt-1">This usually takes about 30 seconds</p>
            </div>
          </motion.div>
        )}

        {/* Plan loaded — Day tabs + Activity cards */}
        {aiPlan && !aiLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Plan header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{aiPlan.title}</h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />{aiPlan.budget_summary}
              </p>
            </div>

            {/* Day tabs — horizontal scroll */}
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

            {/* Activity cards grid — reference design style */}
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2"
            >
              {activitiesForDay.map((activity, idx) => {
                const Icon = AI_CATEGORY_ICONS[activity.category] || Camera;
                const colorClass = AI_CATEGORY_COLORS[activity.category] || 'bg-secondary text-muted-foreground';
                const imgKey = CATEGORY_IMAGES[activity.category] || CATEGORY_IMAGES.explore;

                return (
                  <motion.div
                    key={`${activeDay}-${idx}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="rounded-[1.5rem] border-border/30 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={`https://images.unsplash.com/${imgKey}?auto=format&fit=crop&w=800&q=80`}
                          alt={activity.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />

                        {/* Add to calendar button */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => {
                              const city = aiPlan.title?.split('—')?.[0]?.trim() || 'Trip';
                              window.open(buildGoogleCalendarUrl(activity, timelineStartDate, city), '_blank');
                            }}
                            className="w-9 h-9 rounded-2xl bg-background/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-background hover:scale-110 active:scale-95 transition-all"
                            title="Add to Google Calendar"
                          >
                            <Plus className="h-4 w-4 text-foreground" />
                          </button>
                        </div>

                        {/* Bottom badges */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                            <Clock className="h-3 w-3 mr-1" />{activity.time}
                          </Badge>
                          <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                            <DollarSign className="h-3 w-3 mr-1" />{activity.cost}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground text-sm">{activity.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${colorClass}`}>
                            <Icon className="h-3 w-3" />{activity.category}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground font-medium">
                            {activity.duration}min
                          </span>
                          {activity.location && (
                            <span className="px-2.5 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground font-medium flex items-center gap-1 max-w-[180px]">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{activity.location.split(',')[0]}</span>
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Tips + Export */}
            <div className="mt-10 max-w-2xl">
              {aiPlan.tips?.length > 0 && (
                <div className="mb-6 bg-card border border-border/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground text-sm mb-2">💡 Nomad Tips</h3>
                  <ul className="space-y-1">
                    {aiPlan.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={exportAllToGoogleCalendar} className="w-full rounded-xl h-12 gap-2" size="lg">
                <CalendarPlus className="h-4 w-4" />
                Export all {aiPlan.activities.length} activities to Google Calendar
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Each activity opens in a new tab for you to confirm
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty state — no plan yet, not loading */}
        {!aiPlan && !aiLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
              <Sparkles className="h-9 w-9 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Plan your perfect trip</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Type a destination above — like "7 days in Tokyo as a foodie" — and we'll generate a complete day-by-day itinerary in 30 seconds.
            </p>
          </motion.div>
        )}
      </div>

      {/* Floating bottom nav — mobile */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-card/90 backdrop-blur-2xl border border-border/20 shadow-2xl shadow-foreground/10">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-primary font-semibold">Explore</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full" asChild>
            <Link to="/journey">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Journey</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full" asChild>
            <Link to="/destinations">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Places</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 rounded-full" asChild>
            <Link to="/lists">
              <BookmarkPlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Lists</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
