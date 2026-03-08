import { useState, useEffect, useCallback, useRef } from 'react';
import { embedSavedPlace } from '@/lib/embeddings';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Search, MapPin, Plus, Check, Compass, Moon, Sun, LogOut, User,
  BookmarkPlus, Star, Coffee, Utensils, Camera, Wifi, Home, TreePine,
  ChevronRight, X, Sparkles, Loader2, ArrowUpRight
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

interface CuratedPlace {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  category: string;
  image: string;
  rating: number;
  tags: string[];
}

const CURATED_PLACES: CuratedPlace[] = [
  { id: '1', name: 'Dojo Bali', city: 'Canggu', country: 'Indonesia', description: 'Iconic coworking space with pool and tropical vibes', category: 'coworking', image: 'photo-1537996194471-e657df975ab4', rating: 4.7, tags: ['wifi', 'pool', 'community'] },
  { id: '2', name: 'Selina Lisbon', city: 'Lisbon', country: 'Portugal', description: 'Coliving and coworking in the heart of the city', category: 'coliving', image: 'photo-1536663815808-535e2280d2c2', rating: 4.5, tags: ['coliving', 'events', 'rooftop'] },
  { id: '3', name: 'Café de Flore', city: 'Paris', country: 'France', description: 'Legendary café with literary history and strong espresso', category: 'cafe', image: 'photo-1502602898657-3e91760cbb34', rating: 4.3, tags: ['historic', 'coffee', 'ambiance'] },
  { id: '4', name: 'Punspace', city: 'Chiang Mai', country: 'Thailand', description: 'Popular coworking space loved by digital nomads', category: 'coworking', image: 'photo-1506665531195-3566af2b4dfa', rating: 4.6, tags: ['wifi', 'affordable', 'community'] },
  { id: '5', name: 'La Boqueria', city: 'Barcelona', country: 'Spain', description: 'Vibrant food market with fresh local produce and tapas', category: 'food', image: 'photo-1539037116277-4db20889f2d4', rating: 4.8, tags: ['food', 'market', 'local'] },
  { id: '6', name: 'Ubud Rice Terraces', city: 'Ubud', country: 'Indonesia', description: 'UNESCO World Heritage rice paddies with stunning views', category: 'explore', image: 'photo-1555400038-63f5ba517a47', rating: 4.9, tags: ['nature', 'views', 'hiking'] },
  { id: '7', name: 'Outsite Lisbon', city: 'Lisbon', country: 'Portugal', description: 'Premium coliving space with ocean views', category: 'coliving', image: 'photo-1555881400-74d7acaacd8b', rating: 4.4, tags: ['ocean', 'modern', 'community'] },
  { id: '8', name: 'Taco Stand El Califa', city: 'Mexico City', country: 'Mexico', description: 'Legendary street tacos in the heart of CDMX', category: 'food', image: 'photo-1504544750208-dc0358e63f7f', rating: 4.7, tags: ['street food', 'authentic', 'cheap'] },
  { id: '9', name: 'KoHub', city: 'Koh Lanta', country: 'Thailand', description: 'Island coworking with beach access and sunsets', category: 'coworking', image: 'photo-1519451241324-20b4ea2c4220', rating: 4.5, tags: ['beach', 'island', 'wifi'] },
  { id: '10', name: 'Fushimi Inari Shrine', city: 'Kyoto', country: 'Japan', description: 'Thousands of vermillion torii gates up a mountain', category: 'explore', image: 'photo-1493976040374-85c8e12f0c0e', rating: 4.9, tags: ['temple', 'hiking', 'iconic'] },
  { id: '11', name: 'Hostel One Paralelo', city: 'Barcelona', country: 'Spain', description: 'Top-rated social hostel with free dinner and events', category: 'hostel', image: 'photo-1555854877-bab0e564b8d5', rating: 4.8, tags: ['social', 'events', 'budget'] },
  { id: '12', name: 'Café Saigon', city: 'Ho Chi Minh City', country: 'Vietnam', description: 'Vietnamese drip coffee in a colonial-era building', category: 'cafe', image: 'photo-1528127269322-539801943592', rating: 4.4, tags: ['coffee', 'wifi', 'cheap'] },
  { id: '13', name: 'Table Mountain', city: 'Cape Town', country: 'South Africa', description: 'Flat-topped mountain with panoramic city and ocean views', category: 'explore', image: 'photo-1580060839134-75a5edca2e99', rating: 4.9, tags: ['views', 'hiking', 'iconic'] },
  { id: '14', name: 'Cinta Cafe', city: 'Canggu', country: 'Indonesia', description: 'Trendy beachfront café with healthy bowls and sunset views', category: 'cafe', image: 'photo-1544551763-46a013bb70d5', rating: 4.3, tags: ['healthy', 'beach', 'wifi'] },
  { id: '15', name: 'Riad Yasmine', city: 'Marrakech', country: 'Morocco', description: 'Beautiful traditional riad with a pool in the medina', category: 'hostel', image: 'photo-1539020140153-e479b8c22e70', rating: 4.6, tags: ['traditional', 'pool', 'photogenic'] },
  { id: '16', name: 'Medellín Coworking', city: 'Medellín', country: 'Colombia', description: 'Modern workspace in El Poblado with fast internet', category: 'coworking', image: 'photo-1526392060635-9d6019884377', rating: 4.5, tags: ['wifi', 'modern', 'community'] },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'coworking', label: 'Coworking', icon: Wifi },
  { id: 'cafe', label: 'Cafés', icon: Coffee },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'explore', label: 'Explore', icon: Camera },
  { id: 'hostel', label: 'Hostels', icon: Home },
  { id: 'coliving', label: 'Coliving', icon: TreePine },
];

interface SavedListOption {
  id: string;
  name: string;
  icon: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`;

async function streamTravelPlan({
  query, profile, onDelta, onDone, onError,
}: {
  query: string; profile: any;
  onDelta: (text: string) => void; onDone: () => void; onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ query, profile }),
    });
    if (!resp.ok) { const err = await resp.json().catch(() => ({ error: 'Failed to generate plan' })); onError(err.error || `Error ${resp.status}`); return; }
    if (!resp.body) { onError('No response body'); return; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { buffer = line + '\n' + buffer; break; }
      }
    }
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try { const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content; if (content) onDelta(content); } catch { /* ignore */ }
      }
    }
    onDone();
  } catch (e) { onError(e instanceof Error ? e.message : 'Network error'); }
}

export default function Explore() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isDark, setIsDark] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<CuratedPlace | null>(null);
  const [lists, setLists] = useState<SavedListOption[]>([]);
  const [addedToList, setAddedToList] = useState<Record<string, string[]>>({});

  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => { setIsDark(document.documentElement.classList.contains('dark')); }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      sessionStorage.removeItem('nomaaad_pending_query');
      setAiQuery(q); setShowAiPanel(true); generatePlan(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const generatePlan = (query: string) => {
    setAiLoading(true); setAiResult(''); setShowAiPanel(true);
    let accumulated = '';
    streamTravelPlan({
      query, profile,
      onDelta: (chunk) => { accumulated += chunk; setAiResult(accumulated); },
      onDone: () => setAiLoading(false),
      onError: (error) => { setAiLoading(false); toast({ title: 'AI Error', description: error, variant: 'destructive' }); },
    });
  };

  const handleAiSearch = (e: React.FormEvent) => { e.preventDefault(); if (!aiQuery.trim()) return; generatePlan(aiQuery.trim()); };
  const toggleTheme = () => { document.documentElement.classList.toggle('dark'); setIsDark(!isDark); };

  const fetchLists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_lists').select('id, name, icon').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setLists(data as SavedListOption[]);
  }, [user]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const handleAddToList = async (listId: string) => {
    if (!user || !selectedPlace) return;
    const { data: inserted, error } = await supabase.from('saved_places').insert({
      list_id: listId, user_id: user.id, name: selectedPlace.name, description: selectedPlace.description,
      address: `${selectedPlace.city}, ${selectedPlace.country}`, category: selectedPlace.category,
    }).select('id').single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (inserted) {
      embedSavedPlace({ id: inserted.id, name: selectedPlace.name, description: selectedPlace.description, address: `${selectedPlace.city}, ${selectedPlace.country}`, category: selectedPlace.category }).catch(() => {});
    }
    setAddedToList(prev => ({ ...prev, [selectedPlace.id]: [...(prev[selectedPlace.id] || []), listId] }));
    toast({ title: t('explore.addedToList') });
    setAddDialogOpen(false); setSelectedPlace(null);
  };

  const openAddDialog = (place: CuratedPlace) => { setSelectedPlace(place); setAddDialogOpen(true); };

  const filtered = CURATED_PLACES.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  const mascotEmoji = profile?.mascot === 'panda' ? '🐼' : profile?.mascot === 'cat' ? '🐱' : profile?.mascot === 'dog' ? '🐶' : '👋';

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
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Compass className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
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
                  <DropdownMenuItem asChild><Link to="/lists" className="cursor-pointer"><BookmarkPlus className="h-4 w-4 mr-2" /> {t('explore.myLists')}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> {t('explore.signOut')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.nav>

      <div className="max-w-2xl mx-auto px-4">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-5">
          <h1 className="text-2xl font-serif font-bold text-foreground">{mascotEmoji} {t('explore.greeting')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('explore.greetingSub')}</p>
        </motion.div>

        {/* AI Search bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 relative">
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/8 via-primary/4 to-transparent blur-xl pointer-events-none" aria-hidden="true" />
          <form onSubmit={handleAiSearch} className="relative" role="search" aria-label="AI travel planner">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"><Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /></div>
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder={t('explore.aiPlaceholder')}
              className="relative w-full h-13 pl-11 pr-14 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all shadow-lg shadow-primary/[0.04]"
              aria-label={t('explore.aiPlaceholder')}
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
              aria-label="Generate travel plan"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4 text-primary-foreground" aria-hidden="true" />}
            </button>
          </form>
        </motion.div>

        {/* AI Travel Plan result */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div ref={aiPanelRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} className="mb-6 overflow-hidden" role="region" aria-label="AI Travel Plan" aria-live="polite">
              <Card className="rounded-[1.75rem] border-border/30 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{t('explore.aiTitle')}</span>
                    {aiLoading && <span className="text-xs text-muted-foreground animate-pulse" role="status">{t('explore.generating')}</span>}
                  </div>
                  <button onClick={() => { setShowAiPanel(false); setAiResult(''); setAiQuery(''); }} className="w-7 h-7 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors" aria-label="Close AI panel"><X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /></button>
                </div>
                <CardContent className="px-5 pb-5 pt-2">
                  {aiResult ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2">
                      <ReactMarkdown>{aiResult}</ReactMarkdown>
                    </div>
                  ) : aiLoading ? (
                    <div className="flex items-center gap-3 py-8 justify-center" role="status">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">{t('explore.building')}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Places search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('explore.filterPlaceholder')} className="pl-10 rounded-2xl h-11 bg-card/60 border-border/30" aria-label={t('explore.filterPlaceholder')} />
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex gap-2 overflow-x-auto pb-5 scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                category === cat.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Places grid — 2 cols on larger screens */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
        >
          <AnimatePresence>
            {filtered.map(place => (
              <motion.div key={place.id} variants={fadeUp} transition={{ duration: 0.4 }} layout>
                <Card className="rounded-[1.5rem] border-border/30 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => openAddDialog(place)}
                        className="w-9 h-9 rounded-2xl bg-background/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-background hover:scale-110 active:scale-95 transition-all"
                      >
                        <Plus className="h-4 w-4 text-foreground" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                        <MapPin className="h-3 w-3 mr-1" />{place.city}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full bg-background/80 backdrop-blur-md text-foreground text-xs border-0 shadow-sm">
                        <Star className="h-3 w-3 mr-1 fill-chart-1 text-chart-1" />{place.rating}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground text-sm">{place.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {place.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground font-medium capitalize">{tag}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" aria-hidden="true" />
              <p className="font-medium">{t('explore.noPlaces')}</p>
              <p className="text-sm mt-1">{t('explore.noPlacesSub')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add to list dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-[1.75rem] max-w-sm" aria-describedby="save-dialog-desc">
          <DialogHeader><DialogTitle className="text-lg">{t('explore.saveToList')}</DialogTitle></DialogHeader>
          <p id="save-dialog-desc" className="sr-only">Choose a list to save this place to.</p>
          {selectedPlace && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{selectedPlace.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPlace.city}, {selectedPlace.country}</p>
                </div>
              </div>
              {lists.length === 0 ? (
                <div className="text-center py-6">
                  <BookmarkPlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground mb-3">{t('explore.noLists')}</p>
                  <Button asChild variant="outline" className="rounded-full" size="sm">
                    <Link to="/lists" onClick={() => setAddDialogOpen(false)}>{t('explore.createList')} <ChevronRight className="h-3 w-3 ml-1" aria-hidden="true" /></Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lists.map(list => {
                    const alreadyAdded = addedToList[selectedPlace.id]?.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        onClick={() => !alreadyAdded && handleAddToList(list.id)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${alreadyAdded ? 'bg-primary/5 border border-primary/20' : 'bg-card border border-border/30 hover:border-primary/30 hover:bg-card/80'}`}
                      >
                        <span className="text-xl">{list.icon}</span>
                        <span className="flex-1 font-medium text-sm">{list.name}</span>
                        {alreadyAdded && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating bottom nav — pill style */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-card/90 backdrop-blur-2xl border border-border/20 shadow-2xl shadow-foreground/10">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-5 rounded-full bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-primary font-semibold">{t('cat.explore')}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-5 rounded-full" asChild>
            <Link to="/destinations">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t('explore.places')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-2 px-5 rounded-full" asChild>
            <Link to="/lists">
              <BookmarkPlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t('explore.lists')}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
