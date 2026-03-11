import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ShareableTripCard from '@/components/ShareableTripCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, DollarSign, MapPin, Plus, Share2,
  MessageCircle, Twitter, Linkedin, Instagram, Copy, ExternalLink
} from 'lucide-react';

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

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', work: '💻', explore: '🏛', transport: '🚌', social: '🎉', wellness: '🧘',
};

function buildGoogleCalendarUrl(activity: AiActivity, city: string, baseDate: Date) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + activity.day - 1);
  const [h, m] = activity.time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  const end = new Date(d.getTime() + activity.duration * 60 * 1000);
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    details: activity.description,
    location: `${activity.location}, ${city}`,
    dates: `${fmt(d)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan: AiPlan | null = location.state?.plan || null;
  const tripId: string | null = location.state?.tripId || null;

  const [loadedPlan, setLoadedPlan] = useState<AiPlan | null>(plan);
  const [activeDay, setActiveDay] = useState(1);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', time: '12:00', category: 'explore', location: '', description: '' });

  // Load trip from DB if tripId provided
  useEffect(() => {
    if (plan || !tripId || !user) return;
    const load = async () => {
      const { data: trip } = await supabase.from('trips').select('name, destination').eq('id', tripId).single();
      if (!trip) { navigate('/explore', { replace: true }); return; }

      const { data: days } = await supabase.from('days').select('id, day_number, title').eq('trip_id', tripId).order('day_number');
      if (!days?.length) { navigate('/explore', { replace: true }); return; }

      const activities: AiActivity[] = [];
      for (const day of days) {
        const { data: acts } = await supabase.from('activities').select('*').eq('day_id', day.id).order('sort_order');
        if (acts) {
          for (const a of acts) {
            activities.push({
              day: day.day_number,
              time: a.time_slot || '09:00',
              duration: a.duration || 60,
              title: a.name,
              description: a.description || '',
              category: a.category || 'explore',
              location: a.address || '',
              cost: a.price ? `€${a.price}` : 'Free',
            });
          }
        }
      }

      setLoadedPlan({
        title: trip.name,
        summary: `Your trip to ${trip.destination}`,
        budget_summary: '',
        activities,
        tips: [],
      });
    };
    load();
  }, [tripId, plan, user, navigate]);

  useEffect(() => {
    if (!loadedPlan && !tripId) navigate('/explore', { replace: true });
  }, [loadedPlan, tripId, navigate]);

  if (!loadedPlan) return null;

  const city = loadedPlan.title?.split('—')?.[0]?.trim() || 'City';
  const days = Array.from(new Set(loadedPlan.activities.map(a => a.day))).sort((a, b) => a - b);
  const activitiesForDay = loadedPlan.activities.filter(a => a.day === activeDay).sort((a, b) => a.time.localeCompare(b.time));
  const categories: Record<string, number> = {};
  loadedPlan.activities.forEach(a => { categories[a.category] = (categories[a.category] || 0) + 1; });
  const baseDate = new Date(); baseDate.setDate(baseDate.getDate() + 7);

  // Sharing helpers
  const shareText = `🗺 ${loadedPlan.title}\n\n${loadedPlan.summary}\n\n${days.length} days · ${loadedPlan.activities.length} activities\n\nPlanned with nomaaad ✈️`;
  const shareUrl = 'https://nomaaad.lovable.app';

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  const shareInstagram = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: '📋 Copied to clipboard', description: 'Paste this into your Instagram story or post.' });
  };
  const copyLink = () => {
    navigator.clipboard.writeText(shareText + '\n' + shareUrl);
    toast({ title: '📋 Copied!' });
  };

  const addAllToCalendar = () => {
    activitiesForDay.forEach((act, i) => {
      setTimeout(() => window.open(buildGoogleCalendarUrl(act, city, baseDate), '_blank'), i * 400);
    });
    toast({ title: '📅 Opening Google Calendar', description: `${activitiesForDay.length} events for Day ${activeDay}.` });
  };

  const handleAddPlace = () => {
    if (!newPlace.name.trim()) return;
    const newAct: AiActivity = {
      day: activeDay,
      time: newPlace.time,
      duration: 60,
      title: newPlace.name,
      description: newPlace.description,
      category: newPlace.category,
      location: newPlace.location,
      cost: 'TBD',
    };
    setLoadedPlan(prev => prev ? { ...prev, activities: [...prev.activities, newAct] } : prev);
    setNewPlace({ name: '', time: '12:00', category: 'explore', location: '', description: '' });
    setAddPlaceOpen(false);
    toast({ title: '📍 Place added!' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Back + Title */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/explore')} className="mb-4 gap-1.5 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back to trips
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">{loadedPlan.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{loadedPlan.summary}</p>
          {loadedPlan.budget_summary && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
              <DollarSign className="h-3 w-3" />{loadedPlan.budget_summary}
            </p>
          )}
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-5 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={addAllToCalendar}>
            <Calendar className="h-3.5 w-3.5" /> Add to Calendar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-sm">
              <DialogHeader>
                <DialogTitle>Share your trip</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={shareWhatsApp} className="rounded-xl h-12 gap-2">
                  <MessageCircle className="h-4 w-4 text-chart-2" /> WhatsApp
                </Button>
                <Button variant="outline" onClick={shareTwitter} className="rounded-xl h-12 gap-2">
                  <Twitter className="h-4 w-4 text-primary" /> Twitter/X
                </Button>
                <Button variant="outline" onClick={shareLinkedIn} className="rounded-xl h-12 gap-2">
                  <Linkedin className="h-4 w-4 text-primary" /> LinkedIn
                </Button>
                <Button variant="outline" onClick={shareInstagram} className="rounded-xl h-12 gap-2">
                  <Instagram className="h-4 w-4 text-chart-4" /> Instagram
                </Button>
                <Button variant="outline" onClick={copyLink} className="rounded-xl h-12 gap-2 col-span-2">
                  <Copy className="h-4 w-4" /> Copy to clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto py-5 scrollbar-hide -mx-4 px-4">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeDay === day
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Day {day}
            </button>
          ))}
        </div>

        {/* Activities timeline */}
        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
            {activitiesForDay.map((activity, idx) => {
              const emoji = CATEGORY_EMOJI[activity.category] || '📍';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="rounded-2xl border-border/30 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-primary">{activity.time}</span>
                            <Badge variant="secondary" className="text-[10px] rounded-full capitalize">{activity.category}</Badge>
                            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />{activity.cost}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-foreground">{activity.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{activity.location}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{activity.duration}min
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-xl shrink-0"
                          onClick={() => window.open(buildGoogleCalendarUrl(activity, city, baseDate), '_blank')}
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Add place button */}
            <Dialog open={addPlaceOpen} onOpenChange={setAddPlaceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-2xl h-12 border-dashed border-border/50 gap-2">
                  <Plus className="h-4 w-4" /> Add a place to Day {activeDay}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Add a place</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="text-sm">Place name</Label>
                    <Input value={newPlace.name} onChange={e => setNewPlace(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Café Lisboa" className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Time</Label>
                    <Input type="time" value={newPlace.time} onChange={e => setNewPlace(p => ({ ...p, time: e.target.value }))} className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Location</Label>
                    <Input value={newPlace.location} onChange={e => setNewPlace(p => ({ ...p, location: e.target.value }))} placeholder="Address or area" className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Category</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {Object.entries(CATEGORY_EMOJI).map(([cat, emoji]) => (
                        <button
                          key={cat}
                          onClick={() => setNewPlace(p => ({ ...p, category: cat }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                            newPlace.category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                          }`}
                        >
                          {emoji} {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddPlace} disabled={!newPlace.name.trim()} className="w-full rounded-2xl h-11">
                    Add Place
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </AnimatePresence>

        {/* Tips */}
        {loadedPlan.tips?.length > 0 && (
          <div className="mt-8 bg-card border border-border/30 rounded-2xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-2">💡 Tips</h3>
            <ul className="space-y-1">
              {loadedPlan.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shareable card */}
        <ShareableTripCard
          destination={city}
          totalDays={days.length}
          totalActivities={loadedPlan.activities.length}
          budgetSummary={loadedPlan.budget_summary}
          categories={categories}
        />
      </main>
    </div>
  );
}
