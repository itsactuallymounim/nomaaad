import { Compass, Map, MessageSquare, Route, ArrowRight } from 'lucide-react';
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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">nomaaad</span>
        </div>
        <Button asChild size="sm">
          <Link to="/planner">Start Planning</Link>
        </Button>
      </motion.nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center gap-6"
        >
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-sm font-medium text-primary tracking-wide uppercase">
            AI-Powered Travel
          </motion.p>
          <motion.h1 variants={fadeUp} transition={{ duration: 0.5 }} className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-foreground max-w-3xl leading-tight">
            Plan your next adventure in seconds
          </motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-muted-foreground max-w-xl">
            Tell us where you want to go. Our AI builds a complete itinerary with maps, timelines, and local insights — instantly.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex gap-3 mt-2">
            <Button asChild size="lg">
              <Link to="/planner">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-5xl mx-auto px-6 pb-16"
        >
          <div className="rounded-xl overflow-hidden border shadow-lg aspect-video">
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
        className="max-w-4xl mx-auto px-6 py-20"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp} transition={{ duration: 0.5 }}>
              <Card className="border bg-card h-full">
                <CardContent className="pt-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
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
        className="max-w-6xl mx-auto px-6 py-16 pb-24 text-center"
      >
        <div className="rounded-xl bg-primary/5 border border-primary/10 py-14 px-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
            Ready to explore?
          </h2>
          <p className="text-muted-foreground mb-6">
            No sign-up required. Just describe your trip and go.
          </p>
          <Button asChild size="lg">
            <Link to="/planner">
              Start Planning
              <ArrowRight className="ml-1 h-4 w-4" />
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
        className="border-t py-6 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} nomaaad. Built with Lovable.</p>
      </motion.footer>
    </div>
  );
}
