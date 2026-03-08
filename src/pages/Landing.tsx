import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Compass, Sparkles, MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import penguinCharacter from '@/assets/characters/penguin-icecream.png';
import dogCharacter from '@/assets/characters/dog-icecream.png';
import catCharacter from '@/assets/characters/cat-banana.png';
import gorillaCharacter from '@/assets/characters/gorilla-pizza.png';

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
  // Batch 1
  { id: '1', name: 'Canggu, Indonesia', city: 'Canggu', country: 'Indonesia', category: 'cat.coworking', image: 'photo-1537996194471-e657df975ab4', description: 'Surf, cowork and chill in Bali\'s digital nomad capital.', span: 'normal' },
  { id: '2', name: 'Paris, France', city: 'Paris', country: 'France', category: 'cat.cafes', image: 'photo-1502602898657-3e91760cbb34', description: 'Lose yourself in the charm of Paris, from iconic landmarks to world-class art and cuisine.', span: 'tall' },
  { id: '3', name: 'Barcelona, Spain', city: 'Barcelona', country: 'Spain', category: 'cat.food', image: 'photo-1539037116277-4db20889f2d4', description: 'Vibrant food markets, stunning architecture and Mediterranean vibes.', span: 'normal' },
  { id: '4', name: 'Kyoto, Japan', city: 'Kyoto', country: 'Japan', category: 'cat.explore', image: 'photo-1493976040374-85c8e12f0c0e', description: 'Experience the perfect blend of ancient temples and modern culture.', span: 'normal' },
  { id: '5', name: 'Lisbon, Portugal', city: 'Lisbon', country: 'Portugal', category: 'cat.coliving', image: 'photo-1536663815808-535e2280d2c2', description: 'Affordable coliving, great weather and a thriving nomad community.', span: 'tall' },
  { id: '6', name: 'Ubud, Indonesia', city: 'Ubud', country: 'Indonesia', category: 'cat.explore', image: 'photo-1555400038-63f5ba517a47', description: 'Relax and rejuvenate among Bali\'s lush rice terraces and vibrant culture.', span: 'normal' },
  { id: '7', name: 'Chiang Mai, Thailand', city: 'Chiang Mai', country: 'Thailand', category: 'cat.coworking', image: 'photo-1506665531195-3566af2b4dfa', description: 'Affordable living, amazing food and a legendary digital nomad scene.', span: 'normal' },
  { id: '8', name: 'Cape Town, South Africa', city: 'Cape Town', country: 'South Africa', category: 'cat.explore', image: 'photo-1580060839134-75a5edca2e99', description: 'Where the oceans meet the mountains in spectacular fashion.', span: 'tall' },
  { id: '9', name: 'Medellín, Colombia', city: 'Medellín', country: 'Colombia', category: 'cat.coworking', image: 'photo-1526392060635-9d6019884377', description: 'Perfect weather year-round with a booming coworking culture.', span: 'normal' },
  { id: '10', name: 'Marrakech, Morocco', city: 'Marrakech', country: 'Morocco', category: 'cat.coliving', image: 'photo-1539020140153-e479b8c22e70', description: 'A magical city full of colour, spice markets and hidden riads.', span: 'normal' },
  { id: '11', name: 'Ho Chi Minh, Vietnam', city: 'Ho Chi Minh', country: 'Vietnam', category: 'cat.cafes', image: 'photo-1528127269322-539801943592', description: 'Incredible street food, cheap coffee, and buzzing energy.', span: 'normal' },
  { id: '12', name: 'Mexico City, Mexico', city: 'Mexico City', country: 'Mexico', category: 'cat.food', image: 'photo-1504544750208-dc0358e63f7f', description: 'Rich culture, world-class tacos and a growing remote work scene.', span: 'tall' },
  // Batch 2
  { id: '13', name: 'Tokyo, Japan', city: 'Tokyo', country: 'Japan', category: 'cat.explore', image: 'photo-1540959733332-eab4deabeeaf', description: 'Neon-lit streets, ancient shrines and the best ramen on earth.', span: 'normal' },
  { id: '14', name: 'Berlin, Germany', city: 'Berlin', country: 'Germany', category: 'cat.coworking', image: 'photo-1560969184-10fe8719e047', description: 'Creative capital of Europe with affordable coworking and nightlife.', span: 'tall' },
  { id: '15', name: 'Buenos Aires, Argentina', city: 'Buenos Aires', country: 'Argentina', category: 'cat.food', image: 'photo-1589909202802-8f4aadce1849', description: 'Tango, steak and a bohemian vibe that never gets old.', span: 'normal' },
  { id: '16', name: 'Amsterdam, Netherlands', city: 'Amsterdam', country: 'Netherlands', category: 'cat.cafes', image: 'photo-1534351590666-13e3e96b5017', description: 'Canals, world-class museums and the coziest café culture.', span: 'normal' },
  { id: '17', name: 'Tbilisi, Georgia', city: 'Tbilisi', country: 'Georgia', category: 'cat.coliving', image: 'photo-1565008576549-57569a49371d', description: 'Incredible food, low cost of living and a warm nomad community.', span: 'normal' },
  { id: '18', name: 'New York, United States', city: 'New York', country: 'United States', category: 'cat.explore', image: 'photo-1496442226666-8d4d0e62e6e9', description: 'The city that never sleeps — endless energy and inspiration.', span: 'tall' },
  { id: '19', name: 'Dubrovnik, Croatia', city: 'Dubrovnik', country: 'Croatia', category: 'cat.explore', image: 'photo-1555990538-1e15e83f5e9a', description: 'Medieval walls meet crystal-clear Adriatic waters.', span: 'normal' },
  { id: '20', name: 'Seoul, South Korea', city: 'Seoul', country: 'South Korea', category: 'cat.cafes', image: 'photo-1517154421773-0529f29ea451', description: 'K-culture, incredible street food and lightning-fast wifi.', span: 'normal' },
  { id: '21', name: 'Playa del Carmen, Mexico', city: 'Playa del Carmen', country: 'Mexico', category: 'cat.coworking', image: 'photo-1552074284-5e88ef1aef18', description: 'Beach life meets coworking on the Caribbean coast.', span: 'normal' },
  { id: '22', name: 'Prague, Czech Republic', city: 'Prague', country: 'Czech Republic', category: 'cat.cafes', image: 'photo-1519677100203-a0e668c92439', description: 'Fairytale architecture, great beer and a thriving café scene.', span: 'tall' },
  { id: '23', name: 'Taipei, Taiwan', city: 'Taipei', country: 'Taiwan', category: 'cat.food', image: 'photo-1470004914212-05527e49370b', description: 'Night markets, bubble tea and a tech-savvy nomad paradise.', span: 'normal' },
  { id: '24', name: 'Santorini, Greece', city: 'Santorini', country: 'Greece', category: 'cat.explore', image: 'photo-1570077188670-e3a8d69ac5ff', description: 'Breathtaking sunsets over white-washed cliffs and blue domes.', span: 'normal' },
  // Batch 3
  { id: '25', name: 'Dubai, UAE', city: 'Dubai', country: 'UAE', category: 'cat.explore', image: 'photo-1512453979798-5ea266f8880c', description: 'Futuristic skyline, desert adventures and world-class luxury.', span: 'tall' },
  { id: '26', name: 'Reykjavik, Iceland', city: 'Reykjavik', country: 'Iceland', category: 'cat.explore', image: 'photo-1504829857797-ddff29c27927', description: 'Northern lights, geothermal pools and raw natural beauty.', span: 'normal' },
  { id: '27', name: 'Da Nang, Vietnam', city: 'Da Nang', country: 'Vietnam', category: 'cat.coworking', image: 'photo-1559592413-7cec4d0cae2b', description: 'Beachfront coworking with incredible Vietnamese cuisine.', span: 'normal' },
  { id: '28', name: 'Split, Croatia', city: 'Split', country: 'Croatia', category: 'cat.coliving', image: 'photo-1580137189272-c9379f8864fd', description: 'Roman ruins, island hopping and Mediterranean slow living.', span: 'normal' },
  { id: '29', name: 'Bangkok, Thailand', city: 'Bangkok', country: 'Thailand', category: 'cat.food', image: 'photo-1508009603885-50cf7c579365', description: 'Street food heaven with temples, markets and rooftop bars.', span: 'tall' },
  { id: '30', name: 'Edinburgh, Scotland', city: 'Edinburgh', country: 'Scotland', category: 'cat.cafes', image: 'photo-1506377585622-bedcbb027afc', description: 'Historic charm, cozy pubs and stunning hilltop views.', span: 'normal' },
  { id: '31', name: 'Lima, Peru', city: 'Lima', country: 'Peru', category: 'cat.food', image: 'photo-1531968455001-5c5272a67c71', description: 'The gastronomic capital of South America awaits.', span: 'normal' },
  { id: '32', name: 'Singapore', city: 'Singapore', country: 'Singapore', category: 'cat.coworking', image: 'photo-1525625293386-3f8f99389edd', description: 'Ultra-modern city-state with world-class infrastructure.', span: 'normal' },
  { id: '33', name: 'Oaxaca, Mexico', city: 'Oaxaca', country: 'Mexico', category: 'cat.food', image: 'photo-1547995886-6dc09384c6e6', description: 'Mole, mezcal and the heart of Mexican folk culture.', span: 'tall' },
  { id: '34', name: 'Tallinn, Estonia', city: 'Tallinn', country: 'Estonia', category: 'cat.coworking', image: 'photo-1560448204-603e6b2a0a04', description: 'Digital nomad visa pioneer with a charming old town.', span: 'normal' },
  { id: '35', name: 'Cusco, Peru', city: 'Cusco', country: 'Peru', category: 'cat.explore', image: 'photo-1526392060635-9d6019884377', description: 'Gateway to Machu Picchu and Andean adventures.', span: 'normal' },
  { id: '36', name: 'Porto, Portugal', city: 'Porto', country: 'Portugal', category: 'cat.cafes', image: 'photo-1555881400-74d7acaacd8b', description: 'Port wine, azulejo tiles and riverside charm.', span: 'normal' },
];

const BATCH_SIZE = 12;
const BASE_PLACES = ALL_PLACES.slice(0, BATCH_SIZE);

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('cat.all');
  const [searchValue, setSearchValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>(() => BASE_PLACES);
  const [batchCount, setBatchCount] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const EXAMPLE_QUERY = 'Plan 7 days in Lisbon for a digital nomad — Budget: €900';

  // Typewriter effect
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

  // Infinite scroll
  const loadMore = useCallback(() => {
    setBatchCount(prev => {
      const next = prev + 1;
      const newBatch = BASE_PLACES.map((p, i) => ({
        ...p,
        id: `${p.id}-batch${next}-${i}`,
      }));
      setVisiblePlaces(curr => [...curr, ...newBatch]);
      return next;
    });
  }, []);

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
    const base = activeCategory === 'cat.all'
      ? BASE_PLACES
      : BASE_PLACES.filter(p => p.category === activeCategory);
    setVisiblePlaces(base);
    setBatchCount(1);
  }, [activeCategory]);

  const handleSearchFocus = () => { setIsTyping(true); setSearchValue(''); };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) sessionStorage.setItem('nomaaad_pending_query', searchValue.trim());
    navigate('/auth');
  };

  const filtered = activeCategory === 'cat.all' ? visiblePlaces : visiblePlaces.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero — Full-screen with background image */}
      <section className="relative min-h-[100vh] flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-foreground/60" />
        </div>

        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-background/20 backdrop-blur-md flex items-center justify-center">
              <Compass className="h-5 w-5 text-background" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight text-background">nomaaad</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link
              to="/destinations"
              className="text-sm text-background/80 hover:text-background transition-colors hidden sm:block px-4 py-2 rounded-full bg-background/10 backdrop-blur-md border border-background/20"
            >
              {t('landing.destinations')}
            </Link>
            <Link
              to="/auth"
              className="text-sm font-semibold px-5 py-2.5 rounded-full bg-background text-foreground hover:bg-background/90 transition-all shadow-sm"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4"
          >
            <span className="text-background/70 text-sm md:text-base font-medium tracking-[0.2em] uppercase">
              {t('landing.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-sans font-bold text-background tracking-tight leading-[0.9] mb-6"
          >
            {t('landing.headline2').toUpperCase()}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-background/70 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-10"
          >
            {t('landing.subtitle')}
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="w-full max-w-2xl mx-auto"
          >
            <form onSubmit={handleSearchSubmit} className="relative" role="search" aria-label="AI travel search">
              <div className="flex items-center bg-background/95 backdrop-blur-xl rounded-full shadow-2xl border border-background/20 overflow-hidden">
                <div className="flex items-center gap-2 pl-5">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <input
                  value={searchValue}
                  onChange={e => { setIsTyping(true); setSearchValue(e.target.value); }}
                  onFocus={handleSearchFocus}
                  onBlur={() => { if (!searchValue) setIsTyping(false); }}
                  className="flex-1 h-14 md:h-16 px-3 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                  placeholder={t('landing.searchPlaceholder')}
                  aria-label={t('landing.searchPlaceholder')}
                />
                <button
                  type="submit"
                  className="mr-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/25"
                  aria-label="Search"
                >
                  <ArrowUpRight className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                </button>
              </div>
            </form>
            <p className="text-center text-xs text-background/40 mt-4">
              {t('landing.searchHints')}
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
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

      {/* Value Props with characters */}
      <section className="px-6 md:px-10 py-20 md:py-28" aria-label="Features">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid md:grid-cols-3 gap-5 md:gap-6 mb-20 md:mb-28"
          >
            {[
              { icon: Compass, titleKey: 'landing.valueProp1Title' as const, descKey: 'landing.valueProp1Desc' as const, character: dogCharacter },
              { icon: MapPin, titleKey: 'landing.valueProp2Title' as const, descKey: 'landing.valueProp2Desc' as const, character: catCharacter },
              { icon: Sparkles, titleKey: 'landing.valueProp3Title' as const, descKey: 'landing.valueProp3Desc' as const, character: gorillaCharacter },
            ].map((prop, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                className="group relative text-center md:text-left p-7 rounded-[1.75rem] bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.04] transition-all duration-500 overflow-hidden"
              >
                <img src={prop.character} alt="" className="absolute -bottom-4 -right-4 w-28 h-28 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full" aria-hidden="true" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 mx-auto md:mx-0 group-hover:scale-110 transition-transform duration-500" aria-hidden="true">
                  <prop.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2 relative">{t(prop.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed relative">{t(prop.descKey)}</p>
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
              <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground">
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

          {/* Destination cards — reference-style grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" role="tabpanel">
            <AnimatePresence mode="popLayout">
              {filtered.map((place, i) => (
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
                    className="group relative block rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 h-full"
                    aria-label={`${place.name}`}
                  >
                    <img
                      src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={`${place.name}`}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        place.span === 'tall' ? 'h-full min-h-[420px] sm:min-h-full' : 'aspect-[4/3]'
                      }`}
                      loading="lazy"
                    />

                    {/* Arrow button top-right */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:bg-background transition-all duration-300 shadow-lg">
                      <ArrowUpRight className="h-4 w-4 text-foreground" aria-hidden="true" />
                    </div>

                    {/* Text overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent">
                      <h3 className="text-background font-bold text-lg md:text-xl leading-tight mb-1">
                        {place.city}, {place.country}
                      </h3>
                      <p className="text-background/70 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {place.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
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
          <img src={penguinCharacter} alt="" className="w-32 h-32 mx-auto mb-6 rounded-3xl object-cover shadow-xl" />
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-foreground mb-4">
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
