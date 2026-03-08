import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, Compass, Sparkles, MapPin, Globe, Clock, Wallet, Route,
  Brain, Zap, Shield, Plane, FileText, AlertTriangle, Timer, Search
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';

/* ── Data ── */

interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  image: string;
  description: string;
  span: 'tall' | 'normal';
}

const CATEGORIES_KEYS = ['cat.all', 'cat.coworking', 'cat.cafes', 'cat.food', 'cat.explore', 'cat.coliving'] as const;

const ALL_PLACES: Place[] = [
  { id: '1', name: 'Canggu, Indonesia', city: 'Canggu', country: 'Indonesia', category: 'cat.coworking', image: '1537996194471-e657df975ab4', description: 'Surf, cowork and chill in Bali\'s digital nomad capital.', span: 'normal' },
  { id: '2', name: 'Paris, France', city: 'Paris', country: 'France', category: 'cat.cafes', image: '1502602898657-3e91760cbb34', description: 'Lose yourself in the charm of Paris, from iconic landmarks to world-class art and cuisine.', span: 'tall' },
  { id: '3', name: 'Barcelona, Spain', city: 'Barcelona', country: 'Spain', category: 'cat.food', image: '1539037116277-4db20889f2d4', description: 'Vibrant food markets, stunning architecture and Mediterranean vibes.', span: 'normal' },
  { id: '4', name: 'Kyoto, Japan', city: 'Kyoto', country: 'Japan', category: 'cat.explore', image: '1493976040374-85c8e12f0c0e', description: 'Experience the perfect blend of ancient temples and modern culture.', span: 'normal' },
  { id: '5', name: 'Lisbon, Portugal', city: 'Lisbon', country: 'Portugal', category: 'cat.coliving', image: '1536663815808-535e2280d2c2', description: 'Affordable coliving, great weather and a thriving nomad community.', span: 'tall' },
  { id: '6', name: 'Ubud, Indonesia', city: 'Ubud', country: 'Indonesia', category: 'cat.explore', image: '1555400038-63f5ba517a47', description: 'Relax and rejuvenate among Bali\'s lush rice terraces and vibrant culture.', span: 'normal' },
  { id: '7', name: 'Chiang Mai, Thailand', city: 'Chiang Mai', country: 'Thailand', category: 'cat.coworking', image: '1506665531195-3566af2b4dfa', description: 'Affordable living, amazing food and a legendary digital nomad scene.', span: 'normal' },
  { id: '8', name: 'Cape Town, South Africa', city: 'Cape Town', country: 'South Africa', category: 'cat.explore', image: '1580060839134-75a5edca2e99', description: 'Where the oceans meet the mountains in spectacular fashion.', span: 'tall' },
  { id: '9', name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', category: 'cat.coworking', image: '1526392060635-9d6019884377', description: 'Perfect weather year-round with a booming coworking culture.', span: 'normal' },
  { id: '10', name: 'Marrakech, Morocco', city: 'Marrakech', country: 'Morocco', category: 'cat.coliving', image: '1539020140153-e479b8c22e70', description: 'A magical city full of colour, spice markets and hidden riads.', span: 'normal' },
  { id: '11', name: 'Ho Chi Minh, Vietnam', city: 'Ho Chi Minh', country: 'Vietnam', category: 'cat.cafes', image: '1528127269322-539801943592', description: 'Incredible street food, cheap coffee, and buzzing energy.', span: 'normal' },
  { id: '12', name: 'Mexico City, Mexico', city: 'Mexico City', country: 'Mexico', category: 'cat.food', image: '1504544750208-dc0358e63f7f', description: 'Rich culture, world-class tacos and a growing remote work scene.', span: 'tall' },
  { id: '13', name: 'Tokyo, Japan', city: 'Tokyo', country: 'Japan', category: 'cat.explore', image: '1540959733332-eab4deabeeaf', description: 'Neon-lit streets, ancient shrines and the best ramen on earth.', span: 'normal' },
  { id: '14', name: 'Berlin, Germany', city: 'Berlin', country: 'Germany', category: 'cat.coworking', image: '1560969184-10fe8719e047', description: 'Creative capital of Europe with affordable coworking and nightlife.', span: 'tall' },
  { id: '15', name: 'Buenos Aires, Argentina', city: 'Buenos Aires', country: 'Argentina', category: 'cat.food', image: '1589909202802-8f4aadce1849', description: 'Tango, steak and a bohemian vibe that never gets old.', span: 'normal' },
  { id: '16', name: 'Amsterdam, Netherlands', city: 'Amsterdam', country: 'Netherlands', category: 'cat.cafes', image: '1534351590666-13e3e96b5017', description: 'Canals, world-class museums and the coziest café culture.', span: 'normal' },
  { id: '17', name: 'Tbilisi, Georgia', city: 'Tbilisi', country: 'Georgia', category: 'cat.coliving', image: '1565008576549-57569a49371d', description: 'Incredible food, low cost of living and a warm nomad community.', span: 'normal' },
  { id: '18', name: 'New York, United States', city: 'New York', country: 'United States', category: 'cat.explore', image: '1496442226666-8d4d0e62e6e9', description: 'The city that never sleeps — endless energy and inspiration.', span: 'tall' },
  { id: '19', name: 'Dubrovnik, Croatia', city: 'Dubrovnik', country: 'Croatia', category: 'cat.explore', image: '1555990538-1e15e83f5e9a', description: 'Medieval walls meet crystal-clear Adriatic waters.', span: 'normal' },
  { id: '20', name: 'Seoul, South Korea', city: 'Seoul', country: 'South Korea', category: 'cat.cafes', image: '1517154421773-0529f29ea451', description: 'K-culture, incredible street food and lightning-fast wifi.', span: 'normal' },
  { id: '21', name: 'Playa del Carmen, Mexico', city: 'Playa del Carmen', country: 'Mexico', category: 'cat.coworking', image: '1552074284-5e88ef1aef18', description: 'Beach life meets coworking on the Caribbean coast.', span: 'normal' },
  { id: '22', name: 'Prague, Czech Republic', city: 'Prague', country: 'Czech Republic', category: 'cat.cafes', image: '1519677100203-a0e668c92439', description: 'Fairytale architecture, great beer and a thriving café scene.', span: 'tall' },
  { id: '23', name: 'Taipei, Taiwan', city: 'Taipei', country: 'Taiwan', category: 'cat.food', image: '1470004914212-05527e49370b', description: 'Night markets, bubble tea and a tech-savvy nomad paradise.', span: 'normal' },
  { id: '24', name: 'Santorini, Greece', city: 'Santorini', country: 'Greece', category: 'cat.explore', image: '1570077188670-e3a8d69ac5ff', description: 'Breathtaking sunsets over white-washed cliffs and blue domes.', span: 'normal' },
];

const BATCH_SIZE = 12;

function generateBatch(batchIndex: number, category?: string): Place[] {
  const source = category && category !== 'cat.all'
    ? ALL_PLACES.filter(p => p.category === category)
    : ALL_PLACES;
  if (source.length === 0) return [];
  const start = batchIndex * BATCH_SIZE;
  if (start >= source.length) return [];
  return source.slice(start, start + BATCH_SIZE);
}

const SAMPLE_ITINERARY = [
  { time: '09:00', title: 'Best local breakfast near hostel', icon: '🍳' },
  { time: '10:30', title: 'Top attraction (low crowd time)', icon: '🏛️' },
  { time: '13:00', title: 'Cheap lunch spot nearby', icon: '🍜' },
  { time: '15:00', title: 'Walkable hidden spot', icon: '🗺️' },
  { time: '18:30', title: 'Sunset viewpoint', icon: '🌅' },
  { time: '20:00', title: 'Local dinner', icon: '🍽️' },
];

const BENEFITS = [
  { icon: Route, text: 'Geographically optimized' },
  { icon: Wallet, text: 'Budget-aware' },
  { icon: MapPin, text: 'Walkability optimized' },
  { icon: Clock, text: 'Realistic timing' },
];

/* ── Component ── */

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('cat.all');
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>(() => generateBatch(0));
  const [batchCount, setBatchCount] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [animatedStep, setAnimatedStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStep(prev => (prev + 1) % SAMPLE_ITINERARY.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = useCallback(() => {
    setBatchCount(prev => {
      const newBatch = generateBatch(prev, activeCategory);
      if (newBatch.length === 0) return prev;
      setIsLoadingMore(true);
      setVisiblePlaces(curr => [...curr, ...newBatch]);
      setTimeout(() => setIsLoadingMore(false), 300);
      return prev + 1;
    });
  }, [activeCategory]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    setVisiblePlaces(generateBatch(0, activeCategory));
    setBatchCount(1);
  }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[100vh] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/80" />
        </div>

        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-background/20 backdrop-blur-md flex items-center justify-center">
              <Compass className="h-4.5 w-4.5 text-background" />
            </div>
            <span className="font-bold text-lg tracking-tight text-background">nomaaad</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" className="text-background/80 hover:text-background hover:bg-background/10 hidden sm:inline-flex" asChild>
              <Link to="/destinations">{t('landing.destinations')}</Link>
            </Button>
            <Button size="sm" className="bg-background text-foreground hover:bg-background/90 shadow-sm" asChild>
              <Link to="/auth">{t('landing.getStarted')}</Link>
            </Button>
          </div>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 gap-10 lg:gap-16 py-12">
          {/* Left — Messaging */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-xl text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/15 backdrop-blur-md border border-background/20 mb-6">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-background/90 tracking-wide uppercase">AI-Powered</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold text-background tracking-tight leading-[1.05] mb-5">
              Your entire trip.<br />
              <span className="text-accent">Planned in 30 seconds.</span>
            </h1>

            <p className="text-background/70 text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Enter a city, pick your style. Get a complete day-by-day itinerary — geographically optimized, budget-aware, and realistically timed.
            </p>

            {/* ── Dynamic search bar ── */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 100 }}
              className="relative max-w-lg mx-auto lg:mx-0 mb-6"
            >
              <motion.div
                animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 30px 4px hsl(var(--primary) / 0.15)', '0 0 0 0 hsl(var(--primary) / 0)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-2xl"
              >
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="7 days in Bali as a digital nomad..."
                  className="w-full h-14 md:h-16 pl-14 pr-16 rounded-2xl bg-background/95 backdrop-blur-xl text-foreground text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-2xl border-0 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md"
                >
                  <ArrowUpRight className="h-4.5 w-4.5 text-primary-foreground" />
                </button>
              </motion.div>
            </motion.form>

            {/* Benefit pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {BENEFITS.map((b) => (
                <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/10 backdrop-blur-sm border border-background/15">
                  <b.icon className="h-3.5 w-3.5 text-background/70" />
                  <span className="text-xs text-background/80 font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Sample itinerary card */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateY: -5 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-sm"
          >
            <div className="bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-border/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary font-semibold">Generated in 28s</span>
                </div>
                <h3 className="font-bold text-foreground text-lg">Lisbon — Day 1</h3>
                <p className="text-xs text-muted-foreground">Budget · Digital Nomad · 7 Days</p>
              </div>

              <div className="px-5 py-4 space-y-1">
                {SAMPLE_ITINERARY.map((item, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor: animatedStep === i ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                      scale: animatedStep === i ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-11 shrink-0">{item.time}</span>
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-sm font-medium transition-colors ${animatedStep === i ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.title}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-border/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>6 activities · ~€35 estimated</span>
                  <span className="text-primary font-medium">View full plan →</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <div className="w-6 h-10 rounded-full border-2 border-background/30 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-background/60"
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="px-6 md:px-10 py-20 md:py-28" aria-label="How it works">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3 block">How it works</span>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">
              Three inputs. One perfect plan.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              No more hours of research, no decision fatigue. Just tell us where and how — we handle the rest.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', icon: MapPin, title: 'Pick your city', desc: 'Type any destination — Tokyo, Rome, Lisbon, Medellín... anywhere in the world.' },
              { step: '02', icon: Sparkles, title: 'Set your style', desc: 'Budget or luxury? Relaxed or action-packed? Local secrets or global highlights?' },
              { step: '03', icon: Zap, title: 'Get your plan', desc: 'In 30 seconds: a complete day-by-day itinerary with time blocks, places, costs, and routes.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 rounded-3xl bg-card border border-border/30 hover:border-primary/20 hover:shadow-lg transition-all duration-500"
              >
                <span className="text-5xl font-bold text-primary/10 absolute top-4 right-5 font-mono">{item.step}</span>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY NOMAAAD ═══════ */}
      <section className="px-6 md:px-10 py-16 md:py-24 bg-muted/30" aria-label="Why Nomaaad">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">
              Not just another AI chatbot.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              ChatGPT gives ideas. Nomaaad gives you a <strong className="text-foreground">complete, optimized travel plan</strong> you can follow step by step.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Clock, title: 'Structured day plans', desc: 'Time-blocked activities from morning to evening.' },
              { icon: Route, title: 'Distance optimized', desc: 'Activities ordered to minimize walking and transit.' },
              { icon: Wallet, title: 'Budget estimation', desc: 'Know your daily costs before you leave.' },
              { icon: Brain, title: 'Zero decision fatigue', desc: 'Everything planned — just show up and enjoy.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border border-border/30"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-lg md:text-xl font-serif italic text-foreground/80">
              "The fastest way to get a complete travel plan."
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ NOMAD ANXIETY ═══════ */}
      <section className="px-6 md:px-10 py-20 md:py-28 relative overflow-hidden" aria-label="Nomad Compliance">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-destructive/[0.03] blur-[120px]" />
        </div>

        <div className="max-w-[1100px] mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 mb-5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive tracking-wide uppercase">The real nomad problem</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-5 leading-tight">
              Planning is easy.<br />
              <span className="text-destructive">Staying legal isn't.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Every digital nomad knows the anxiety: <strong className="text-foreground">How many days do I have left on my visa?</strong> Am I accidentally becoming a tax resident? When's my next border run? One mistake can mean fines, deportation, or a surprise tax bill.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              { icon: Timer, title: 'Visa day tracker', pain: '"Am I overstaying?"', desc: 'Automatically counts your days in each country. Get alerts before your visa expires — never overstay again.', color: 'text-chart-1', bgColor: 'bg-chart-1/10' },
              { icon: FileText, title: 'Tax threshold alerts', pain: '"Am I a tax resident now?"', desc: 'Track the 183-day rule and country-specific thresholds. Know exactly when to leave before triggering tax obligations.', color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
              { icon: Plane, title: 'Border run planner', pain: '"Where do I go to reset?"', desc: 'Smart suggestions for the cheapest, fastest border runs. Optimized routes to reset your visa clock stress-free.', color: 'text-primary', bgColor: 'bg-primary/10' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 rounded-3xl bg-card border border-border/30 hover:border-destructive/20 hover:shadow-lg transition-all duration-500"
              >
                <div className={`w-11 h-11 rounded-2xl ${item.bgColor} flex items-center justify-center mb-4`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="text-xs font-medium text-destructive/70 italic mb-2">{item.pain}</p>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="p-5 rounded-2xl bg-card/80 border border-border/30 mb-8">
              <div className="flex items-start gap-3 text-left">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    This isn't just trip planning — it's peace of mind.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Other apps plan your restaurants. Nomaaad protects your freedom. We track the invisible rules that keep you legal, compliant, and stress-free.
                  </p>
                </div>
              </div>
            </div>

            <Button size="lg" className="gap-2" asChild>
              <Link to="/auth">
                <Shield className="h-4 w-4" />
                Stay legal, travel free
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Coming soon for Pro members</p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section className="px-6 md:px-10 py-20 md:py-28" aria-label="Destinations">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground">
                {t('landing.explorePlaces')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">{t('landing.exploreSubtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {CATEGORIES_KEYS.map(catKey => (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  role="tab"
                  aria-selected={activeCategory === catKey}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === catKey
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`}
                >
                  {t(catKey)}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" role="tabpanel">
            <AnimatePresence mode="popLayout">
              {visiblePlaces.map((place, i) => (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                  className={place.span === 'tall' ? 'sm:row-span-2' : ''}
                >
                  <Link
                    to="/auth"
                    className="group relative block rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 h-full"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={place.name}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        place.span === 'tall' ? 'h-full min-h-[420px] sm:min-h-full' : 'aspect-[4/3]'
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:bg-background transition-all duration-300 shadow-md">
                      <ArrowUpRight className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent">
                      <h3 className="text-background font-bold text-lg md:text-xl leading-tight mb-1">
                        {place.city}, {place.country}
                      </h3>
                      <p className="text-background/80 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {place.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section className="px-6 md:px-10 py-20 md:py-32 relative" aria-label="Call to action">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-lg mx-auto text-center relative"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">
            Stop planning. Start exploring.
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Your entire travel itinerary — generated instantly. Join thousands of travelers who plan smarter.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/auth">
              Get started — it's free
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 md:px-10 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
          <span>© 2026 nomaaad</span>
          <div className="flex gap-6">
            <Link to="/destinations" className="hover:text-foreground transition-colors">{t('landing.destinations')}</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">{t('landing.signUp')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
