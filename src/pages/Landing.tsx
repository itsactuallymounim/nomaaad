import { Compass, ArrowRight, Sparkles, MapPin, BookmarkPlus, Globe, Star, Zap, Users, Coffee, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  {
    title: 'Discover curated\nplaces worldwide',
    description: 'Browse hand-picked coworking spaces, cafés, hostels, and hidden gems in every city. Each place is vetted by real nomads — not algorithms.',
    align: 'left' as const,
    emoji: '🌍',
    highlights: ['Coworking', 'Cafés', 'Hostels', 'Hidden gems'],
  },
  {
    title: 'Save places\ninto your lists',
    description: 'Organize everything into custom lists — by city, by vibe, by trip. Your lists are cached locally so they work even when you\'re offline.',
    align: 'right' as const,
    emoji: '📋',
    highlights: ['Offline access', 'Custom lists', 'Drag & drop'],
  },
  {
    title: 'Share with\nyour crew',
    description: 'Send your curated lists to friends on WhatsApp in one tap. Plan trips together without the back-and-forth.',
    align: 'left' as const,
    emoji: '🤝',
    highlights: ['WhatsApp', 'One-tap share', 'Collaborate'],
  },
  {
    title: 'Personalized\nfor your style',
    description: 'After onboarding, everything adapts to your budget, travel vibe, and work style. No two nomads see the same feed.',
    align: 'right' as const,
    emoji: '✨',
    highlights: ['AI-powered', 'Budget-aware', 'Vibe-matched'],
  },
];

const TRUSTED_BY = [
  '🇵🇹 Lisbon', '🇮🇩 Bali', '🇹🇭 Chiang Mai', '🇲🇽 CDMX',
  '🇪🇸 Barcelona', '🇨🇴 Medellín', '🇻🇳 Da Nang', '🇿🇦 Cape Town',
];

const FAQ = [
  { q: 'Is nomaaad free to use?', a: 'Yes! You can explore curated places, create lists, and share them for free. Premium features like AI trip planning are coming soon.' },
  { q: 'Can I use it offline?', a: 'Absolutely. Your saved lists are cached locally so you can access your places even without an internet connection.' },
  { q: 'How are places curated?', a: 'Places are hand-picked and reviewed by real digital nomads and travelers. We focus on quality over quantity.' },
  { q: 'Can I share my lists with friends?', a: 'Yes! You can share any list via WhatsApp or the native share menu on your device with one tap.' },
  { q: 'Do I need an account?', a: 'You need a free account to save places and create lists. Browsing destinations is available without signing up.' },
];

const TESTIMONIALS = [
  { text: "nomaaad is the travel app I've been waiting for. Finally, a tool that gets how nomads actually travel.", author: 'Sarah K.', role: 'Digital nomad, Lisbon' },
  { text: "The lists feature is incredible. I saved all my favorite spots in Bali and shared them with friends arriving next month.", author: 'Marco T.', role: 'Remote developer, Canggu' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40"
      >
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Compass className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl hidden sm:flex">
              <Link to="/destinations">Destinations</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl hidden sm:flex">
              <a href="#features">Features</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl hidden sm:flex">
              <a href="#faq">FAQ</a>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto px-6 pt-20 md:pt-32 pb-16 text-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Made for digital nomads</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-foreground leading-[1.05] mb-6"
          >
            Travel planning
            <br />
            as smooth as{' '}
            <span className="text-primary">IRL</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
          >
            Discover curated places, save them into lists, and share with friends.
            Your next adventure starts here.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Button asChild size="lg" className="rounded-2xl h-14 px-10 text-base shadow-lg shadow-primary/20">
              <Link to="/auth">
                Start exploring — it's free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 px-10 text-base">
              <Link to="/destinations">
                Browse destinations
              </Link>
            </Button>
          </motion.div>

          {/* Floating cards preview */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 relative"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { emoji: '☕', name: 'Café de Flore', city: 'Paris' },
                { emoji: '🧑‍💻', name: 'Dojo Bali', city: 'Canggu' },
                { emoji: '🍜', name: 'La Boqueria', city: 'Barcelona' },
                { emoji: '⛩️', name: 'Fushimi Inari', city: 'Kyoto' },
              ].map((place, i) => (
                <motion.div
                  key={place.name}
                  initial={{ opacity: 0, y: 20, rotate: i % 2 === 0 ? -2 : 2 }}
                  animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -1 : 1 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                >
                  <Card className="rounded-3xl border-border/50 bg-card/90 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1">
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl block mb-2">{place.emoji}</span>
                      <p className="font-semibold text-sm text-foreground">{place.name}</p>
                      <p className="text-xs text-muted-foreground">{place.city}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trusted by / cities */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 border-y border-border/40"
      >
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            Nomads explore with nomaaad in
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {TRUSTED_BY.map(city => (
              <span key={city} className="text-sm font-semibold text-foreground/70 whitespace-nowrap">
                {city}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features — alternating sections */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <Badge variant="secondary" className="rounded-xl mb-4 text-xs">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
              Everything you need,
              <br />
              nothing you don't
            </h2>
          </motion.div>

          <div className="space-y-24 md:space-y-32">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={stagger}
                className={`flex flex-col gap-8 md:gap-16 items-center ${
                  feature.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                {/* Text */}
                <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex-1 space-y-4">
                  <span className="text-5xl">{feature.emoji}</span>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground whitespace-pre-line leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    {feature.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {feature.highlights.map(h => (
                      <Badge key={h} variant="outline" className="rounded-xl text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </motion.div>

                {/* Visual card */}
                <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="flex-1 w-full">
                  <div className="rounded-3xl bg-secondary/50 border border-border/40 p-8 md:p-12 flex items-center justify-center min-h-[280px]">
                    <div className="text-center space-y-3">
                      <span className="text-7xl block">{feature.emoji}</span>
                      <p className="text-sm font-medium text-muted-foreground">{feature.highlights[0]}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
        className="py-20 bg-primary/5 border-y border-primary/10"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Curated places' },
              { value: '40+', label: 'Cities worldwide' },
              { value: '10k+', label: 'Lists created' },
              { value: '4.9', label: 'Average rating' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }}>
                <p className="text-3xl md:text-4xl font-serif font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="rounded-xl mb-4 text-xs">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Loved by nomads
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card className="rounded-3xl border-border/50 bg-card/80 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-chart-1 text-chart-1" />
                      ))}
                    </div>
                    <p className="text-foreground font-medium leading-relaxed text-lg">
                      "{t.text}"
                    </p>
                    <div className="pt-2">
                      <p className="font-semibold text-sm text-foreground">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Frequently asked questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/50 rounded-2xl px-6 bg-card/80 backdrop-blur-sm data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-28"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="rounded-3xl bg-primary/5 border border-primary/10 py-16 md:py-20 px-8 backdrop-blur-sm">
            <span className="text-5xl block mb-6">🧭</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Join thousands of nomads discovering the world's best places.
              It's free to get started.
            </p>
            <Button asChild size="lg" className="rounded-2xl h-14 px-10 text-base shadow-lg shadow-primary/20">
              <Link to="/auth">
                Start exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Compass className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm">nomaaad</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/destinations" className="hover:text-foreground transition-colors">Destinations</Link>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} nomaaad
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
