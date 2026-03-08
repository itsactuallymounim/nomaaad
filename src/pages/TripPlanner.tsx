import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Compass, MapPin, Calendar, Clock, Check, ChevronRight, ChevronDown,
  Loader2, ArrowLeft, Plus, Coffee, Utensils, Camera, Wifi, Heart,
  Train, CalendarPlus, ExternalLink, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

interface Activity {
  time: string;
  duration: number;
  title: string;
  description: string;
  category: string;
  location: string;
  done?: boolean;
}

interface DaySchedule {
  day: number;
  title: string;
  activities: Activity[];
}

const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  food: Utensils,
  work: Wifi,
  explore: Camera,
  transport: Train,
  social: Heart,
  wellness: Heart,
};

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-chart-1/10 text-chart-1',
  work: 'bg-primary/10 text-primary',
  explore: 'bg-chart-2/10 text-chart-2',
  transport: 'bg-chart-3/10 text-chart-3',
  social: 'bg-chart-4/10 text-chart-4',
  wellness: 'bg-chart-5/10 text-chart-5',
};

const POPULAR_CITIES = [
  'Lisbon', 'Bali', 'Bangkok', 'Barcelona', 'Chiang Mai',
  'Mexico City', 'Berlin', 'Medellín', 'Tokyo', 'Porto',
];

const SCHEDULE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`;

function buildGoogleCalendarUrl(activity: Activity, date: string, city: string) {
  const [hours, minutes] = activity.time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);

  const end = new Date(start.getTime() + activity.duration * 60 * 1000);

  const format = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    details: `${activity.description}\n\n📍 ${activity.location}`,
    location: `${activity.location}, ${city}`,
    dates: `${format(start)}/${format(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function TripPlanner() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useI18n();

  const [city, setCity] = useState('');
  const [days, setDays] = useState(5);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number>(0);

  const generateSchedule = useCallback(async () => {
    if (!city.trim()) {
      toast({ title: 'Please enter a city', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSchedule(null);

    try {
      const resp = await fetch(SCHEDULE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ city: city.trim(), days, startDate, profile }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to generate schedule');
      }

      const data = await resp.json();
      setSchedule(data.schedule);
      setExpandedDay(0);
    } catch (e) {
      toast({
        title: 'Error generating schedule',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [city, days, startDate, profile]);

  const toggleActivity = (dayIdx: number, actIdx: number) => {
    setSchedule(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      const day = { ...updated[dayIdx] };
      const activities = [...day.activities];
      activities[actIdx] = { ...activities[actIdx], done: !activities[actIdx].done };
      day.activities = activities;
      updated[dayIdx] = day;
      return updated;
    });
  };

  const addAllDayToCalendar = (dayIdx: number) => {
    if (!schedule) return;
    const daySchedule = schedule[dayIdx];
    const date = addDays(startDate, dayIdx);
    daySchedule.activities.forEach((activity, i) => {
      setTimeout(() => {
        window.open(buildGoogleCalendarUrl(activity, date, city), '_blank');
      }, i * 300);
    });
  };

  const completedCount = (daySchedule: DaySchedule) =>
    daySchedule.activities.filter(a => a.done).length;

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
            <Link to="/explore" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Trip Planner</span>
          </div>
          <LanguageToggle />
        </div>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {/* Setup form */}
        {!schedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-10"
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-sans font-bold text-foreground mb-2">
                Plan your trip
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Tell us where you're going and how long you'll stay. We'll create a personalized daily schedule.
              </p>
            </div>

            <Card className="rounded-[1.75rem] border-border/30 shadow-lg">
              <CardContent className="p-6 space-y-5">
                {/* City input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Where are you going?</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Enter a city..."
                      className="pl-10 rounded-2xl h-12 bg-card border-border/30"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CITIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          city === c
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">How many days?</label>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10, 14].map(d => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${
                          days === d
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="rounded-2xl h-12 bg-card border-border/30"
                  />
                </div>

                <Button
                  onClick={generateSchedule}
                  disabled={loading || !city.trim()}
                  className="w-full h-13 rounded-2xl text-base font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating your schedule...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {days}-day schedule
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && !schedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Creating your personalized {days}-day schedule for {city}...
            </p>
          </motion.div>
        )}

        {/* Schedule view */}
        {schedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-sans font-bold text-foreground">
                  {city} · {days} days
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatDate(startDate)} → {formatDate(addDays(startDate, days - 1))}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setSchedule(null)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> New plan
              </Button>
            </div>

            {/* Day accordions */}
            <div className="space-y-3">
              {schedule.map((daySchedule, dayIdx) => {
                const date = addDays(startDate, dayIdx);
                const isExpanded = expandedDay === dayIdx;
                const completed = completedCount(daySchedule);
                const total = daySchedule.activities.length;

                return (
                  <motion.div
                    key={dayIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIdx * 0.05 }}
                  >
                    <Card className={`rounded-[1.5rem] border-border/30 overflow-hidden transition-all ${
                      isExpanded ? 'shadow-lg' : 'shadow-sm'
                    }`}>
                      {/* Day header */}
                      <button
                        onClick={() => setExpandedDay(isExpanded ? -1 : dayIdx)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/20 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                            Day
                          </span>
                          <span className="text-lg font-bold text-primary leading-none">
                            {daySchedule.day}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {daySchedule.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(date)} · {completed}/{total} done
                          </p>
                        </div>
                        {/* Progress ring */}
                        <div className="relative w-10 h-10 shrink-0">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              strokeDasharray={`${(completed / total) * 94.2} 94.2`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                            {Math.round((completed / total) * 100)}%
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </button>

                      {/* Activities */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-2">
                              {/* Add all to calendar button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl mb-2 border-dashed"
                                onClick={() => addAllDayToCalendar(dayIdx)}
                              >
                                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                                Add all to Google Calendar
                              </Button>

                              {daySchedule.activities.map((activity, actIdx) => {
                                const Icon = CATEGORY_ICONS[activity.category] || Camera;
                                const colorClass = CATEGORY_COLORS[activity.category] || 'bg-secondary text-muted-foreground';

                                return (
                                  <motion.div
                                    key={actIdx}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: actIdx * 0.03 }}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                                      activity.done
                                        ? 'bg-primary/[0.03] border-primary/20'
                                        : 'bg-card border-border/30 hover:border-border/50'
                                    }`}
                                  >
                                    {/* Checkbox */}
                                    <button
                                      onClick={() => toggleActivity(dayIdx, actIdx)}
                                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                        activity.done
                                          ? 'bg-primary border-primary'
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      {activity.done && (
                                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                      )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-muted-foreground">
                                          {activity.time}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className={`rounded-full text-[10px] px-2 py-0 h-5 capitalize ${colorClass}`}
                                        >
                                          <Icon className="h-2.5 w-2.5 mr-1" />
                                          {activity.category}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                          {activity.duration}min
                                        </span>
                                      </div>
                                      <h4 className={`text-sm font-medium ${
                                        activity.done ? 'line-through text-muted-foreground' : 'text-foreground'
                                      }`}>
                                        {activity.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {activity.description}
                                      </p>
                                      {activity.location && (
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                          <MapPin className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{activity.location}</span>
                                        </p>
                                      )}
                                    </div>

                                    {/* Google Calendar button */}
                                    <button
                                      onClick={() =>
                                        window.open(
                                          buildGoogleCalendarUrl(activity, date, city),
                                          '_blank'
                                        )
                                      }
                                      className="mt-0.5 w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center shrink-0 transition-colors"
                                      title="Add to Google Calendar"
                                    >
                                      <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
