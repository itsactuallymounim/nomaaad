import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, Wallet, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const sliderConfig = [
  {
    key: 'budget',
    icon: Wallet,
    label: 'Budget',
    left: 'Budget',
    right: 'Luxury',
    color: 'primary',
  },
  {
    key: 'pace',
    icon: Zap,
    label: 'Pace',
    left: 'Relaxed',
    right: 'Action-Packed',
    color: 'accent',
  },
  {
    key: 'vibe',
    icon: Globe,
    label: 'Vibe',
    left: 'Local Secrets',
    right: 'Global Highlights',
    color: 'primary',
  },
] as const;

type SliderKey = (typeof sliderConfig)[number]['key'];

export default function Journey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [destination, setDestination] = useState('');
  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    budget: 50,
    pace: 50,
    vibe: 50,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const allSet = destination.trim().length >= 2;

  const handleSliderChange = (key: SliderKey, value: number[]) => {
    setSliders((prev) => ({ ...prev, [key]: value[0] }));
  };

  const buildJourney = async () => {
    if (!allSet) return;
    setIsGenerating(true);

    const budgetLabel = sliders.budget < 33 ? 'budget-friendly' : sliders.budget < 66 ? 'mid-range' : 'luxury';
    const paceLabel = sliders.pace < 33 ? 'relaxed' : sliders.pace < 66 ? 'moderate' : 'action-packed';
    const vibeLabel = sliders.vibe < 33 ? 'local hidden gems and off-the-beaten-path spots' : sliders.vibe < 66 ? 'mix of local and popular spots' : 'must-see global highlights and iconic landmarks';

    const query = `Plan a trip to ${destination}. Style: ${budgetLabel} budget, ${paceLabel} pace, focusing on ${vibeLabel}. Duration: 3 days.`;

    try {
      const { data, error } = await supabase.functions.invoke('travel-chat', {
        body: { query, profile },
      });

      if (error) throw error;
      if (!data?.plan) throw new Error('No plan returned');

      // Navigate to itinerary view with the plan data
      navigate('/itinerary', { state: { plan: data.plan, destination, sliders } });
    } catch (err: any) {
      console.error('Journey generation failed:', err);
      toast.error(err?.message || 'Failed to generate your journey. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-8"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Where is Nomaaad taking you today?
            </h1>
            <p className="text-muted-foreground text-sm">
              Set your destination and vibe — we'll craft the perfect journey.
            </p>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tokyo, Rome, Lisbon..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-12 h-14 text-lg rounded-2xl border-border bg-card shadow-sm focus-visible:ring-primary"
            />
          </div>

          {/* Sensory Sliders */}
          <div className="space-y-6">
            {sliderConfig.map((cfg) => (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * sliderConfig.indexOf(cfg) }}
                className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <cfg.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">
                    {sliders[cfg.key]}
                  </span>
                </div>
                <Slider
                  value={[sliders[cfg.key]]}
                  onValueChange={(v) => handleSliderChange(cfg.key, v)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cfg.left}</span>
                  <span>{cfg.right}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Build Button */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: allSet ? 1 : 0.5,
                scale: allSet ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={buildJourney}
                disabled={!allSet || isGenerating}
                size="lg"
                className="w-full h-14 text-base font-semibold gap-2 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    Crafting your journey...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Build My Journey
                  </>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
