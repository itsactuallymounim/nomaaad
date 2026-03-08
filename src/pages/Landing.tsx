import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MapPin, BookmarkPlus, Share2, Compass, Search, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'Coworking', 'Cafés', 'Food', 'Explore', 'Coliving'];

interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  image: string;
  span: 'tall' | 'wide' | 'normal';
}

const PLACES: Place[] = [
  { id: '1', name: 'Dojo Bali', city: 'Canggu', country: 'Indonesia', category: 'Coworking', image: 'photo-1537996194471-e657df975ab4', span: 'tall' },
  { id: '2', name: 'Café de Flore', city: 'Paris', country: 'France', category: 'Cafés', image: 'photo-1502602898657-3e91760cbb34', span: 'normal' },
  { id: '3', name: 'La Boqueria', city: 'Barcelona', country: 'Spain', category: 'Food', image: 'photo-1539037116277-4db20889f2d4', span: 'normal' },
  { id: '4', name: 'Fushimi Inari', city: 'Kyoto', country: 'Japan', category: 'Explore', image: 'photo-1493976040374-85c8e12f0c0e', span: 'wide' },
  { id: '5', name: 'Selina Lisbon', city: 'Lisbon', country: 'Portugal', category: 'Coliving', image: 'photo-1536663815808-535e2280d2c2', span: 'normal' },
  { id: '6', name: 'Ubud Rice Terraces', city: 'Ubud', country: 'Indonesia', category: 'Explore', image: 'photo-1555400038-63f5ba517a47', span: 'tall' },
  { id: '7', name: 'Punspace', city: 'Chiang Mai', country: 'Thailand', category: 'Coworking', image: 'photo-1506665531195-3566af2b4dfa', span: 'normal' },
  { id: '8', name: 'Table Mountain', city: 'Cape Town', country: 'South Africa', category: 'Explore', image: 'photo-1580060839134-75a5edca2e99', span: 'wide' },
  { id: '9', name: 'Cinta Cafe', city: 'Canggu', country: 'Indonesia', category: 'Cafés', image: 'photo-1544551763-46a013bb70d5', span: 'normal' },
  { id: '10', name: 'Riad Yasmine', city: 'Marrakech', country: 'Morocco', category: 'Coliving', image: 'photo-1539020140153-e479b8c22e70', span: 'normal' },
];

const VALUE_PROPS = [
  {
    icon: Compass,
    title: 'Discover curated spots',
    description: 'Hand-picked coworking spaces, cafés, and hidden gems — vetted by real nomads.',
  },
  {
    icon: BookmarkPlus,
    title: 'Save & organize',
    description: 'Create custom lists by city or vibe. Works offline, always in your pocket.',
  },
  {
    icon: Share2,
    title: 'Share with your crew',
    description: 'Send your favorite spots to friends in one tap. Plan together, travel better.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const EXAMPLE_QUERY = 'Plan 7 days in Lisbon for a digital nomad — Budget: €900';

  // Typewriter effect for placeholder
  useEffect(() => {
    if (isTyping) return;
    let i = 0;
    let direction: 'forward' | 'pause' | 'backward' = 'forward';
    let pauseTimer = 0;
    const interval = setInterval(() => {
      if (direction === 'forward') {
        i++;
        setSearchValue(EXAMPLE_QUERY.slice(0, i));
        if (i === EXAMPLE_QUERY.length) {
          direction = 'pause';
          pauseTimer = 0;
        }
      } else if (direction === 'pause') {
        pauseTimer++;
        if (pauseTimer > 30) {
          direction = 'backward';
        }
      } else {
        i--;
        setSearchValue(EXAMPLE_QUERY.slice(0, i));
        if (i === 0) {
          direction = 'forward';
        }
      }
    }, 60);
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSearchFocus = () => {
    setIsTyping(true);
    setSearchValue('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      sessionStorage.setItem('nomaaad_pending_query', searchValue.trim());
    }
    navigate('/auth');
  };

  const filtered = activeCategory === 'All'
    ? PLACES
    : PLACES.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — bold UVP like Roamy */}
      <section className="relative px-6 md:px-10 pt-8 md:pt-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Nav row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-12 md:mb-16"
          >
            <span className="font-bold text-lg tracking-tight text-foreground">nomaaad</span>
            <div className="flex items-center gap-3">
              <Link
                to="/destinations"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Destinations
              </Link>
              <Link
                to="/auth"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Sign up →
              </Link>
            </div>
          </motion.div>

          {/* UVP headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground tracking-tight leading-[1.1]">
              You discover the world.
              <br />
              <span className="text-primary">We organize it.</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-5 max-w-lg mx-auto leading-relaxed">
              Curated places for digital nomads — save them, list them, share them with friends.
            </p>
          </motion.div>

          {/* Search bar with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-xl mx-auto mb-4 relative"
          >
            {/* Gradient glow behind */}
            <div className="absolute -inset-4 md:-inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-2xl pointer-events-none" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-60 blur-md pointer-events-none" />

            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <input
                ref={inputRef}
                value={searchValue}
                onChange={e => { setIsTyping(true); setSearchValue(e.target.value); }}
                onFocus={handleSearchFocus}
                onBlur={() => { if (!searchValue) setIsTyping(false); }}
                className="relative w-full h-14 pl-11 pr-14 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-lg shadow-primary/5"
                placeholder="Where do you want to go?"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
              >
                <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
              </button>
            </form>
          </motion.div>

          {/* Subtle hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center text-xs text-muted-foreground/60 mb-16 md:mb-20"
          >
            Try: "7 days in Bali" · "Coworking in Medellín" · "Budget trip to Bangkok"
          </motion.p>
        </div>
      </section>

      {/* Value Props — 3-column like Roamy's feature blocks */}
      <section className="px-6 md:px-10 pb-16 md:pb-20">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20"
          >
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                className="text-center md:text-left p-6 rounded-3xl bg-card border border-border/40"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <prop.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{prop.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Section divider + gallery intro */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                Explore places
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Click any spot to get started</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-sm transition-all ${
                    activeCategory === cat
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Gallery grid */}
          <motion.div layout className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((place, i) => (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="break-inside-avoid mb-3 md:mb-4"
                >
                  <Link
                    to="/auth"
                    className="group relative block rounded-2xl overflow-hidden"
                    onMouseEnter={() => setHoveredPlace(place.id)}
                    onMouseLeave={() => setHoveredPlace(null)}
                  >
                    <img
                      src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={place.name}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        place.span === 'tall' ? 'aspect-[3/4]' :
                        place.span === 'wide' ? 'aspect-[4/3]' :
                        'aspect-square'
                      }`}
                      loading="lazy"
                    />

                    {/* Hover overlay — desktop */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-500 flex items-end p-4 hidden md:flex">
                      <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 w-full">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-background font-semibold text-sm">{place.name}</p>
                            <p className="text-background/70 text-xs flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {place.city}, {place.country}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-background" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Always-visible caption — mobile */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent md:hidden">
                      <p className="text-background text-xs font-medium">{place.name}</p>
                      <p className="text-background/60 text-[10px]">{place.city} · {place.country}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 md:px-10 py-16 md:py-24 border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Ready to explore?
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Join thousands of nomads discovering the world's best places. Free forever.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Get started
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 md:px-10 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 nomaaad</span>
          <div className="flex gap-6">
            <Link to="/destinations" className="hover:text-foreground transition-colors">Destinations</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
