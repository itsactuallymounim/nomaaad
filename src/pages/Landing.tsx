import { Compass, Map, MessageSquare, Route, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-travel.jpg';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat Planning',
    description: 'Describe your dream trip and get instant, personalized itineraries.',
  },
  {
    icon: Map,
    title: 'Interactive Maps',
    description: 'Visualize your entire journey with live markers and routes.',
  },
  {
    icon: Route,
    title: 'Smart Itineraries',
    description: 'Day-by-day timelines optimized for your pace and interests.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav — frosted glass */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40"
      >
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Compass className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/destinations">Destinations</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/explore">
                Start Exploring
              </Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-6xl mx-auto px-6 py-24 md:py-36 flex flex-col items-center text-center gap-5"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Travel</span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground max-w-4xl leading-[1.1]"
          >
            Plan your next adventure in seconds
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Tell us where you want to go. Our AI builds a complete itinerary with maps, timelines, and local insights.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }} className="flex gap-3 mt-3">
            <Button asChild size="lg" className="rounded-2xl h-12 px-8 text-base shadow-lg shadow-primary/20">
              <Link to="/explore">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl h-12 px-8 text-base">
              <Link to="/destinations">
                Explore
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-5xl mx-auto px-6 pb-20"
        >
          <div className="rounded-3xl overflow-hidden border border-border/40 shadow-2xl aspect-video">
            <img
              src={heroImage}
              alt="Travel planning interface showing a map with markers and an itinerary timeline"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
        className="max-w-4xl mx-auto px-6 py-24"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful tools to plan the perfect trip.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp} transition={{ duration: 0.5 }}>
              <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full rounded-3xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-8 px-6 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 py-16 pb-28 text-center"
      >
        <div className="rounded-3xl bg-primary/5 border border-primary/10 py-16 px-8 backdrop-blur-sm">
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Ready to explore?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Sign up for free and start planning your dream trip.
          </p>
          <Button asChild size="lg" className="rounded-2xl h-12 px-8 text-base shadow-lg shadow-primary/20">
            <Link to="/explore">
              Start Exploring
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="border-t py-8 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} nomaaad. Built with Lovable.</p>
      </motion.footer>
    </div>
  );
}
