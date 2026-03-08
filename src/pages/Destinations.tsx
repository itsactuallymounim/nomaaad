import { Compass, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

const destinations = [
  { city: 'Tokyo', country: 'Japan', tagline: 'Where tradition meets the future', unsplashId: 'photo-1540959733332-eab4deabeeaf', color: 'from-foreground/60' },
  { city: 'Paris', country: 'France', tagline: 'The city of light and love', unsplashId: 'photo-1502602898657-3e91760cbb34', color: 'from-foreground/60' },
  { city: 'New York', country: 'United States', tagline: 'The city that never sleeps', unsplashId: 'photo-1496442226666-8d4d0e62e6e9', color: 'from-foreground/60' },
  { city: 'Barcelona', country: 'Spain', tagline: 'Art, architecture and tapas', unsplashId: 'photo-1539037116277-4db20889f2d4', color: 'from-foreground/60' },
  { city: 'Bali', country: 'Indonesia', tagline: 'Island of the gods', unsplashId: 'photo-1537996194471-e657df975ab4', color: 'from-foreground/60' },
  { city: 'Rome', country: 'Italy', tagline: 'The eternal city', unsplashId: 'photo-1552832230-c0197dd311b5', color: 'from-foreground/60' },
  { city: 'Kyoto', country: 'Japan', tagline: 'Ancient temples and bamboo groves', unsplashId: 'photo-1493976040374-85c8e12f0c0e', color: 'from-foreground/60' },
  { city: 'Santorini', country: 'Greece', tagline: 'Sunsets over the caldera', unsplashId: 'photo-1570077188670-e3a8d69ac5ff', color: 'from-foreground/60' },
  { city: 'Cape Town', country: 'South Africa', tagline: 'Where the oceans meet the mountains', unsplashId: 'photo-1580060839134-75a5edca2e99', color: 'from-foreground/60' },
  { city: 'Marrakech', country: 'Morocco', tagline: 'A sensory feast of colour and spice', unsplashId: 'photo-1539020140153-e479b8c22e70', color: 'from-foreground/60' },
  { city: 'Amsterdam', country: 'Netherlands', tagline: 'Canals, culture and cycling', unsplashId: 'photo-1534351590666-13e3e96b5017', color: 'from-foreground/60' },
  { city: 'Lisbon', country: 'Portugal', tagline: 'Seven hills of fado and sunshine', unsplashId: 'photo-1536663815808-535e2280d2c2', color: 'from-foreground/60' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function Destinations() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = destinations.filter(
    (d) => d.city.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-[30%] -right-[20%] w-[70vw] h-[70vw] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-border/20"
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Compass className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/auth">{t('landing.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4"
        >
          {t('dest.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground text-lg max-w-lg mx-auto mb-10"
        >
          {t('dest.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative max-w-sm mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dest.searchPlaceholder')}
            className="pl-10 rounded-full h-12 bg-card/60 border-border/30"
            aria-label={t('dest.searchPlaceholder')}
          />
        </motion.div>
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        role="list"
      >
        {filtered.map((dest) => (
          <motion.div
            key={dest.city}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            className="group cursor-pointer"
            onClick={() => navigate('/auth')}
            role="listitem"
          >
            <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/3] shadow-md hover:shadow-2xl border border-border/20 transition-shadow duration-500">
              <img
                src={`https://images.unsplash.com/${dest.unsplashId}?auto=format&fit=crop&w=800&q=80`}
                alt={`${dest.city}, ${dest.country}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${dest.color} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xs text-primary-foreground/70 font-medium tracking-wide uppercase mb-1">{dest.country}</p>
                <h3 className="text-xl font-bold text-primary-foreground leading-tight mb-1">{dest.city}</h3>
                <p className="text-primary-foreground/80 text-xs line-clamp-1">{dest.tagline}</p>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <div className="bg-background/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-foreground shadow-lg">
                  {t('dest.planTrip')} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">{t('dest.noResults')} "{search}"</div>
        )}
      </motion.div>

      <footer className="border-t border-border/20 py-8 text-center text-sm text-muted-foreground/60">
        <p>© {new Date().getFullYear()} nomaaad</p>
      </footer>
    </div>
  );
}
