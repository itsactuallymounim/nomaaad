import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? PLACES
    : PLACES.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header — photographer style */}
      <header className="px-6 md:px-10 pt-8 pb-6 md:pt-10 md:pb-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Brand + tagline */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-tight"
            >
              nomaaad
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap gap-x-6 gap-y-1 mt-3"
            >
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
            </motion.div>
          </div>

          {/* Right side — contact-style info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-right hidden md:block"
          >
            <p className="text-sm text-muted-foreground">Curated places for digital nomads</p>
            <Link
              to="/auth"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Join free →
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Gallery grid */}
      <main className="px-4 md:px-8 pb-16">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            layout
            className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4"
          >
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
                    className="group relative block rounded-2xl overflow-hidden cursor-pointer"
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

                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-500 flex items-end p-4`}>
                      <div className={`transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 w-full`}>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-background font-semibold text-sm md:text-base">
                              {place.name}
                            </p>
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

                    {/* Bottom caption — always visible on mobile */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent md:hidden">
                      <p className="text-background text-xs font-medium">{place.name}</p>
                      <p className="text-background/60 text-[10px]">{place.city} · {place.country}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mt-16 md:mt-24 max-w-lg mx-auto"
          >
            <p className="text-muted-foreground text-sm mb-6">
              500+ curated places across 40+ cities. Save them, organize them, share them.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Start exploring — it's free
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Minimal footer */}
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
