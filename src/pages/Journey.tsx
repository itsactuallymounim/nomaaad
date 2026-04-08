import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, Wallet, Zap, Globe, Calendar, Crown, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

const DAYS_OPTIONS = [3, 5, 7, 10, 14];

const sliderConfig = [
  { key: 'budget', icon: Wallet, label: 'Budget', left: 'Budget', right: 'Luxury', color: 'primary' },
  { key: 'pace', icon: Zap, label: 'Pace', left: 'Relaxed', right: 'Action-Packed', color: 'accent' },
  { key: 'vibe', icon: Globe, label: 'Vibe', left: 'Local Secrets', right: 'Global Highlights', color: 'primary' },
] as const;

type SliderKey = (typeof sliderConfig)[number]['key'];

// Onboarding-style preference steps
const PREFERENCE_STEPS = [
  {
    key: 'traveler_type',
    title: 'What kind of traveler are you?',
    type: 'single' as const,
    options: [
      { value: 'slow', emoji: '🌍', label: 'Slow traveler' },
      { value: 'fast', emoji: '✈️', label: 'Fast explorer' },
      { value: 'work-first', emoji: '💻', label: 'Work-first nomad' },
      { value: 'backpacker', emoji: '🎒', label: 'Budget backpacker' },
      { value: 'lifestyle', emoji: '🏝', label: 'Lifestyle nomad' },
    ],
  },
  {
    key: 'search_priorities',
    title: 'What do you search first in a new city?',
    type: 'multi' as const,
    options: [
      { value: 'coworking', emoji: '🧑‍💻', label: 'Coworking spaces' },
      { value: 'hostels', emoji: '🛏', label: 'Affordable hostels' },
      { value: 'cafes', emoji: '☕', label: 'Cafés to work from' },
      { value: 'food', emoji: '🍜', label: 'Local food spots' },
      { value: 'explore', emoji: '📍', label: 'Things to explore' },
    ],
  },
  {
    key: 'travel_vibe',
    title: "What's your travel vibe?",
    type: 'multi' as const,
    options: [
      { value: 'nature', emoji: '🌴', label: 'Chill & nature' },
      { value: 'cities', emoji: '🏙', label: 'Big cities' },
      { value: 'nightlife', emoji: '🎉', label: 'Nightlife' },
      { value: 'wellness', emoji: '🧘', label: 'Wellness' },
      { value: 'food', emoji: '🍜', label: 'Food culture' },
    ],
  },
];

export default function Journey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const { t } = useI18n();
  const location = useLocation();

  // Accept prefill from Explore page
  const prefill = (location.state as any) || {};

  // Step: 0 = destination + sliders, 1-3 = preference steps (if not onboarded)
  const needsPrefs = profile && !profile.onboarding_completed;
  const totalPrefSteps = needsPrefs ? PREFERENCE_STEPS.length : 0;

  const [currentStep, setCurrentStep] = useState(0); // 0 = main form, 1+ = pref steps
  const [destination, setDestination] = useState(prefill.prefillDestination || '');
  const [numDays, setNumDays] = useState(prefill.prefillDays || 7);
  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    budget: 50, pace: 50, vibe: 50,
  });
  const [prefAnswers, setPrefAnswers] = useState<Record<string, string | string[]>>({
    traveler_type: profile?.traveler_type || '',
    search_priorities: profile?.search_priorities || [],
    travel_vibe: profile?.travel_vibe || [],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const allSet = destination.trim().length >= 2;

  const handleSliderChange = (key: SliderKey, value: number[]) => {
    setSliders(prev => ({ ...prev, [key]: value[0] }));
  };

  const handlePrefSelect = (stepKey: string, value: string, isMulti: boolean) => {
    setPrefAnswers(prev => {
      if (!isMulti) return { ...prev, [stepKey]: value };
      const arr = (prev[stepKey] as string[]) || [];
      return {
        ...prev,
        [stepKey]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const canProceedPref = () => {
    if (currentStep === 0) return allSet;
    const step = PREFERENCE_STEPS[currentStep - 1];
    const val = prefAnswers[step.key];
    if (step.type === 'single') return !!val;
    return (val as string[])?.length > 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && needsPrefs) {
      setCurrentStep(1);
    } else {
      buildJourney();
    }
  };

  const handlePrefNext = () => {
    if (currentStep < totalPrefSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      buildJourney();
    }
  };

  const buildJourney = async () => {
    if (!allSet) return;
    setIsGenerating(true);

    // Save preferences if user went through pref steps
    if (needsPrefs) {
      try {
        await updateProfile.mutateAsync({
          traveler_type: prefAnswers.traveler_type as string,
          search_priorities: prefAnswers.search_priorities as string[],
          travel_vibe: prefAnswers.travel_vibe as string[],
          onboarding_completed: true,
        });
      } catch { /* non-blocking */ }
    }

    const budgetLabel = sliders.budget < 33 ? 'budget-friendly' : sliders.budget < 66 ? 'mid-range' : 'luxury';
    const paceLabel = sliders.pace < 33 ? 'relaxed' : sliders.pace < 66 ? 'moderate' : 'action-packed';
    const vibeLabel = sliders.vibe < 33 ? 'local hidden gems and off-the-beaten-path spots' : sliders.vibe < 66 ? 'mix of local and popular spots' : 'must-see global highlights and iconic landmarks';

    const travelerType = (prefAnswers.traveler_type as string) || profile?.traveler_type || 'digital nomad';
    const vibes = ((prefAnswers.travel_vibe as string[])?.length ? prefAnswers.travel_vibe : profile?.travel_vibe) || [];

    const query = `Plan a trip to ${destination}. Duration: ${numDays} days. Style: ${budgetLabel} budget, ${paceLabel} pace, focusing on ${vibeLabel}. Traveler type: ${travelerType}. Vibes: ${(vibes as string[]).join(', ') || 'balanced'}.`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, profile }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to generate plan');
      }
      const data = await resp.json();
      if (!data?.plan) throw new Error('No plan returned');

      navigate('/explore', { state: { plan: data.plan, destination, sliders, numDays } });
    } catch (err: any) {
      console.error('Journey generation failed:', err);
      toast.error(err?.message || 'Failed to generate your journey. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preference step UI
  if (currentStep > 0 && needsPrefs) {
    const step = PREFERENCE_STEPS[currentStep - 1];
    const progress = (currentStep / (totalPrefSteps + 1)) * 100;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="px-6 pt-6 pb-2 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">{currentStep} of {totalPrefSteps}</span>
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-lg w-full">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                <h2 className="text-2xl font-sans font-bold text-foreground">{step.title}</h2>
                {step.type === 'multi' && <p className="text-sm text-muted-foreground">Select all that apply.</p>}

                <div className="grid gap-3">
                  {step.options.map(opt => {
                    const isMulti = step.type === 'multi';
                    const isSelected = isMulti
                      ? (prefAnswers[step.key] as string[])?.includes(opt.value)
                      : prefAnswers[step.key] === opt.value;

                    return (
                      <button
                        key={opt.value}
                        onClick={() => handlePrefSelect(step.key, opt.value, isMulti)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                          isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        <span className="font-medium text-foreground text-sm flex-1">{opt.label}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <div className="px-6 pb-8 max-w-lg mx-auto w-full">
          <Button onClick={handlePrefNext} disabled={!canProceedPref()} className="w-full h-12 rounded-2xl text-base" size="lg">
            {currentStep === totalPrefSteps ? (isGenerating ? 'Crafting...' : 'Build My Journey') : 'Continue'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg space-y-8">
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

          {/* Number of Days */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Number of days</span>
            </div>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setNumDays(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    numDays === d
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Sensory Sliders */}
          <div className="space-y-4">
            {sliderConfig.map((cfg, i) => (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <cfg.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{sliders[cfg.key]}</span>
                </div>
                <Slider value={[sliders[cfg.key]]} onValueChange={v => handleSliderChange(cfg.key, v)} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cfg.left}</span>
                  <span>{cfg.right}</span>
                </div>
              </motion.div>
            ))}
          </div>




          {/* Build Button */}
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: allSet ? 1 : 0.5, scale: allSet ? 1 : 0.98 }} transition={{ duration: 0.3 }}>
              <Button onClick={handleNext} disabled={!allSet || isGenerating} size="lg" className="w-full h-14 text-base font-semibold gap-2 shadow-md">
                {isGenerating ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    Crafting your journey...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {needsPrefs ? 'Next: Your Preferences' : 'Build My Journey'}
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
