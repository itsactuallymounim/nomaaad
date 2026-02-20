import { Compass, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const destinations = [
  {
    city: 'Tokyo',
    country: 'Japan',
    tagline: 'Where tradition meets the future',
    unsplashId: 'photo-1540959733332-eab4deabeeaf',
    color: 'from-rose-900/60',
  },
  {
    city: 'Paris',
    country: 'France',
    tagline: 'The city of light and love',
    unsplashId: 'photo-1502602898657-3e91760cbb34',
    color: 'from-indigo-900/60',
  },
  {
    city: 'New York',
    country: 'United States',
    tagline: 'The city that never sleeps',
    unsplashId: 'photo-1496442226666-8d4d0e62e6e9',
    color: 'from-slate-900/60',
  },
  {
    city: 'Barcelona',
    country: 'Spain',
    tagline: 'Art, architecture and tapas',
    unsplashId: 'photo-1539037116277-4db20889f2d4',
    color: 'from-orange-900/60',
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    tagline: 'Island of the gods',
    unsplashId: 'photo-1537996194471-e657df975ab4',
    color: 'from-emerald-900/60',
  },
  {
    city: 'Rome',
    country: 'Italy',
    tagline: 'The eternal city',
    unsplashId: 'photo-1552832230-c0197dd311b5',
    color: 'from-amber-900/60',
  },
  {
    city: 'Kyoto',
    country: 'Japan',
    tagline: 'Ancient temples and bamboo groves',
    unsplashId: 'photo-1493976040374-85c8e12f0c0e',
    color: 'from-red-900/60',
  },
  {
    city: 'Santorini',
    country: 'Greece',
    tagline: 'Sunsets over the caldera',
    unsplashId: 'photo-1570077188670-e3a8d69ac5ff',
    color: 'from-blue-900/60',
  },
  {
    city: 'Cape Town',
    country: 'South Africa',
    tagline: 'Where the oceans meet the mountains',
    unsplashId: 'photo-1580060839134-75a5edca2e99',
    color: 'from-teal-900/60',
  },
  {
    city: 'Marrakech',
    country: 'Morocco',
    tagline: 'A sensory feast of colour and spice',
    unsplashId: 'photo-1539020140153-e479b8c22e70',
    color: 'from-orange-900/60',
  },
  {
    city: 'Amsterdam',
    country: 'Netherlands',
    tagline: 'Canals, culture and cycling',
    unsplashId: 'photo-1534351590666-13e3e96b5017',
    color: 'from-cyan-900/60',
  },
  {
    city: 'Lisbon',
    country: 'Portugal',
    tagline: 'Seven hills of fado and sunshine',
    unsplashId: 'photo-1585208798174-6cedd4b9ccd8',
    color: 'from-yellow-900/60',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function Destinations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = destinations.filter(
    (d) =>
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleCityClick = (city: string) => {
    navigate(`/planner?city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">nomaaad</span>
        </Link>
        <Button asChild size="sm">
          <Link to="/planner">Start Planning</Link>
        </Button>
      </motion.nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm font-medium text-primary tracking-wide uppercase mb-3"
        >
          Explore the world
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4"
        >
          Popular destinations
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-muted-foreground max-w-lg mx-auto mb-8"
        >
          Pick a city and let our AI plan the perfect trip for you in seconds.
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative max-w-sm mx-auto"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations..."
            className="pl-9"
          />
        </motion.div>
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {filtered.map((dest) => (
          <motion.div
            key={dest.city}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="group cursor-pointer"
            onClick={() => handleCityClick(dest.city)}
          >
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] shadow-md border border-border/40">
              {/* Unsplash image */}
              <img
                src={`https://images.unsplash.com/${dest.unsplashId}?auto=format&fit=crop&w=800&q=80`}
                alt={`${dest.city}, ${dest.country}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${dest.color} to-transparent`}
              />

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-xs text-white/70 font-medium tracking-wide uppercase mb-0.5">
                  {dest.country}
                </p>
                <h3 className="text-xl font-bold text-white leading-tight mb-1">
                  {dest.city}
                </h3>
                <p className="text-white/80 text-xs line-clamp-1">{dest.tagline}</p>
              </div>

              {/* Hover CTA */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground shadow">
                  Plan trip
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No destinations found for "{search}"
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} nomaaad. Built with Lovable.</p>
      </footer>
    </div>
  );
}
