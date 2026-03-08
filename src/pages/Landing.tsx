import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, MapPin, Compass, Sparkles, Globe, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

const CATEGORIES_KEYS = ['cat.all', 'cat.coworking', 'cat.cafes', 'cat.food', 'cat.explore', 'cat.coliving'] as const;

interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  image: string;
  span: 'tall' | 'wide' | 'normal';
}

const BASE_PLACES: Place[] = [
  { id: '1', name: 'Dojo Bali', city: 'Canggu', country: 'Indonesia', category: 'cat.coworking', image: 'photo-1537996194471-e657df975ab4', span: 'tall' },
  { id: '2', name: 'Café de Flore', city: 'Paris', country: 'France', category: 'cat.cafes', image: 'photo-1502602898657-3e91760cbb34', span: 'normal' },
  { id: '3', name: 'La Boqueria', city: 'Barcelona', country: 'Spain', category: 'cat.food', image: 'photo-1539037116277-4db20889f2d4', span: 'normal' },
  { id: '4', name: 'Fushimi Inari', city: 'Kyoto', country: 'Japan', category: 'cat.explore', image: 'photo-1493976040374-85c8e12f0c0e', span: 'wide' },
  { id: '5', name: 'Selina Lisbon', city: 'Lisbon', country: 'Portugal', category: 'cat.coliving', image: 'photo-1536663815808-535e2280d2c2', span: 'normal' },
  { id: '6', name: 'Ubud Rice Terraces', city: 'Ubud', country: 'Indonesia', category: 'cat.explore', image: 'photo-1555400038-63f5ba517a47', span: 'tall' },
  { id: '7', name: 'Punspace', city: 'Chiang Mai', country: 'Thailand', category: 'cat.coworking', image: 'photo-1506665531195-3566af2b4dfa', span: 'normal' },
  { id: '8', name: 'Table Mountain', city: 'Cape Town', country: 'South Africa', category: 'cat.explore', image: 'photo-1580060839134-75a5edca2e99', span: 'wide' },
  { id: '9', name: 'Cinta Cafe', city: 'Canggu', country: 'Indonesia', category: 'cat.cafes', image: 'photo-1544551763-46a013bb70d5', span: 'normal' },
  { id: '10', name: 'Riad Yasmine', city: 'Marrakech', country: 'Morocco', category: 'cat.coliving', image: 'photo-1539020140153-e479b8c22e70', span: 'normal' },
  { id: '11', name: 'Hubud', city: 'Ubud', country: 'Indonesia', category: 'cat.coworking', image: 'photo-1555400038-63f5ba517a47', span: 'normal' },
  { id: '12', name: 'Outsite Lisbon', city: 'Lisbon', country: 'Portugal', category: 'cat.coliving', image: 'photo-1536663815808-535e2280d2c2', span: 'tall' },
  { id: '13', name: 'Taco Stand CDMX', city: 'Mexico City', country: 'Mexico', category: 'cat.food', image: 'photo-1504544750208-dc0358e63f7f', span: 'normal' },
  { id: '14', name: 'KoHub', city: 'Koh Lanta', country: 'Thailand', category: 'cat.coworking', image: 'photo-1519451241324-20b4ea2c4220', span: 'wide' },
  { id: '15', name: 'Café Saigon', city: 'Ho Chi Minh', country: 'Vietnam', category: 'cat.cafes', image: 'photo-1528127269322-539801943592', span: 'normal' },
  { id: '16', name: 'Medellín Hub', city: 'Medellín', country: 'Colombia', category: 'cat.coworking', image: 'photo-1526392060635-9d6019884377', span: 'normal' },
];

// Shuffle helper for variety on each batch
function shuffleSpans(places: Place[]): Place[] {
  const spans: Place['span'][] = ['tall', 'wide', 'normal', 'normal', 'normal'];
  return places.map((p, i) => ({ ...p, span: spans[i % spans.length] }));
}

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('cat.all');
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const EXAMPLE_QUERY = 'Plan 7 days in Lisbon for a digital nomad — Budget: €900';

  useEffect(() => {
    if (isTyping) return;
    let i = 0;
    let direction: 'forward' | 'pause' | 'backward' = 'forward';
    let pauseTimer = 0;
    const interval = setInterval(() => {
      if (direction === 'forward') {
        i++;
        setSearchValue(EXAMPLE_QUERY.slice(0, i));
        if (i === EXAMPLE_QUERY.length) { direction = 'pause'; pauseTimer = 0; }
      } else if (direction === 'pause') {
        pauseTimer++;
        if (pauseTimer > 30) direction = 'backward';
      } else {
        i--;
        setSearchValue(EXAMPLE_QUERY.slice(0, i));
        if (i === 0) direction = 'forward';
      }
    }, 60);
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSearchFocus = () => { setIsTyping(true); setSearchValue(''); };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) sessionStorage.setItem('nomaaad_pending_query', searchValue.trim());
    navigate('/auth');
  };

  const filtered = activeCategory === 'cat.all' ? PLACES : PLACES.filter(p => p.category === activeCategory);

  const VALUE_PROPS = [
    { icon: Compass, titleKey: 'landing.valueProp1Title' as const, descKey: 'landing.valueProp1Desc' as const },
    { icon: Layers, titleKey: 'landing.valueProp2Title' as const, descKey: 'landing.valueProp2Desc' as const },
    { icon: Globe, titleKey: 'landing.valueProp3Title' as const, descKey: 'landing.valueProp3Desc' as const },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-2xl focus:bg-primary focus:text-primary-foreground focus:text-sm">
        Skip to content
      </a>

      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      {/* Hero */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="relative px-6 md:px-10 pt-8 md:pt-12" id="main-content">
        <div className="max-w-[1400px] mx-auto">
          {/* Nav */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-16 md:mb-20"
            aria-label="Main navigation"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <Compass className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">nomaaad</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                to="/destinations"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                {t('landing.destinations')}
              </Link>
              <Link
                to="/auth"
                className="text-sm font-semibold px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
              >
                {t('landing.getStarted')}
              </Link>
            </div>
          </motion.nav>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-6" role="status">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('landing.badge')}
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif font-bold text-foreground tracking-tight leading-[1.05]">
              {t('landing.headline1')}
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {t('landing.headline2')}
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-md mx-auto leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-xl mx-auto mb-5 relative"
          >
            <div className="absolute -inset-4 md:-inset-6 rounded-[2rem] bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-accent/20 pointer-events-none" aria-hidden="true" />
            <form onSubmit={handleSearchSubmit} className="relative" role="search" aria-label="AI travel search">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <input
                ref={inputRef}
                value={searchValue}
                onChange={e => { setIsTyping(true); setSearchValue(e.target.value); }}
                onFocus={handleSearchFocus}
                onBlur={() => { if (!searchValue) setIsTyping(false); }}
                className="relative w-full h-14 pl-11 pr-14 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/30 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all shadow-xl shadow-primary/[0.06]"
                placeholder={t('landing.searchPlaceholder')}
                aria-label={t('landing.searchPlaceholder')}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/25"
                aria-label="Search"
              >
                <ArrowUpRight className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center text-xs text-muted-foreground/50 mb-20 md:mb-24"
            aria-hidden="true"
          >
            {t('landing.searchHints')}
          </motion.p>
        </div>
      </motion.section>

      {/* Value Props */}
      <section className="px-6 md:px-10 pb-20 md:pb-28" aria-label="Features">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid md:grid-cols-3 gap-5 md:gap-6 mb-20 md:mb-28"
          >
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                className="group relative text-center md:text-left p-7 rounded-[1.75rem] bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.04] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-500" aria-hidden="true">
                  <prop.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{t(prop.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(prop.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Gallery header */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {t('landing.explorePlaces')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">{t('landing.exploreSubtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Place categories">
              {CATEGORIES_KEYS.map(catKey => (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  role="tab"
                  aria-selected={activeCategory === catKey}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === catKey
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {t(catKey)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Gallery grid */}
          <motion.div layout className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4" role="tabpanel">
            <AnimatePresence mode="popLayout">
              {filtered.map((place, i) => (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, delay: i * 0.04 }}
                  className="break-inside-avoid mb-3 md:mb-4"
                >
                  <Link
                    to="/auth"
                    className="group relative block rounded-[1.25rem] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500"
                    onMouseEnter={() => setHoveredPlace(place.id)}
                    onMouseLeave={() => setHoveredPlace(null)}
                    aria-label={`${place.name} — ${place.city}, ${place.country}`}
                  >
                    <img
                      src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={`${place.name}, ${place.city}`}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                        place.span === 'tall' ? 'aspect-[3/4]' :
                        place.span === 'wide' ? 'aspect-[4/3]' :
                        'aspect-square'
                      }`}
                      loading="lazy"
                    />

                    {/* Overlay — desktop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4 hidden md:flex">
                      <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 w-full">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-background font-semibold text-sm">{place.name}</p>
                            <p className="text-background/70 text-xs flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {place.city}, {place.country}
                            </p>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg transition-all duration-300">
                            <ArrowUpRight className="h-4 w-4 text-background" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Caption — mobile */}
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
      <section className="px-6 md:px-10 py-20 md:py-32 relative" aria-label="Call to action">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-lg mx-auto text-center relative"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-10">
            {t('landing.ctaSubtitle')}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2.5 px-9 py-4.5 rounded-full bg-foreground text-background font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
          >
            {t('landing.ctaButton')}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
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
