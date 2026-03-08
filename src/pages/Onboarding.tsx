import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Search, Mountain, Cat, Dog, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { embedProfile } from '@/lib/embeddings';

const STEPS = [
  {
    key: 'mascot',
    title: 'Choose your travel companion 🧭',
    subtitle: 'Your companion will guide you through trips and recommendations.',
    type: 'single' as const,
    options: [
      { value: 'gorilla', emoji: '🦍', label: 'Gorilla', desc: 'Bold explorer', lucideIcon: Mountain },
      { value: 'cat', emoji: '🐱', label: 'Cat', desc: 'Curious wanderer', lucideIcon: Cat },
      { value: 'dog', emoji: '🐶', label: 'Dog', desc: 'Social adventurer', lucideIcon: Dog },
    ],
  },
  {
    key: 'traveler_type',
    title: 'What kind of traveler are you?',
    subtitle: 'This helps us personalize your recommendations.',
    type: 'single' as const,
    options: [
      { value: 'slow', emoji: '🌍', label: 'Slow traveler', desc: '1–3 months per city' },
      { value: 'fast', emoji: '✈️', label: 'Fast explorer', desc: '1–2 weeks per place' },
      { value: 'work-first', emoji: '💻', label: 'Work-first nomad', desc: '' },
      { value: 'backpacker', emoji: '🎒', label: 'Budget backpacker', desc: '' },
      { value: 'lifestyle', emoji: '🏝', label: 'Lifestyle nomad', desc: '' },
    ],
  },
  {
    key: 'search_priorities',
    title: 'When you arrive in a new city, what do you search first?',
    subtitle: 'Select all that apply.',
    type: 'multi' as const,
    options: [
      { value: 'coworking', emoji: '🧑‍💻', label: 'Coworking spaces', desc: '' },
      { value: 'hostels', emoji: '🛏', label: 'Affordable hostels', desc: '' },
      { value: 'cafes', emoji: '☕', label: 'Cafés to work from', desc: '' },
      { value: 'food', emoji: '🍜', label: 'Local food spots', desc: '' },
      { value: 'explore', emoji: '📍', label: 'Things to explore', desc: '' },
    ],
  },
  {
    key: 'monthly_budget',
    title: "What's your usual monthly travel budget?",
    subtitle: 'We\'ll filter recommendations to match.',
    type: 'single' as const,
    options: [
      { value: 'under-800', emoji: '💸', label: 'Under €800', desc: '' },
      { value: '800-1500', emoji: '💰', label: '€800 – €1500', desc: '' },
      { value: '1500-2500', emoji: '💳', label: '€1500 – €2500', desc: '' },
      { value: '2500+', emoji: '✨', label: '€2500+', desc: '' },
    ],
  },
  {
    key: 'accommodation_style',
    title: 'Where do you usually stay?',
    subtitle: '',
    type: 'single' as const,
    options: [
      { value: 'hostels', emoji: '🏨', label: 'Hostels', desc: '' },
      { value: 'airbnb', emoji: '🏠', label: 'Airbnb / apartments', desc: '' },
      { value: 'coliving', emoji: '🧑‍🤝‍🧑', label: 'Coliving spaces', desc: '' },
      { value: 'guesthouses', emoji: '🏡', label: 'Guesthouses', desc: '' },
      { value: 'mix', emoji: '🔄', label: 'Mix of everything', desc: '' },
    ],
  },
  {
    key: 'work_setup',
    title: 'Where do you prefer working?',
    subtitle: '',
    type: 'single' as const,
    options: [
      { value: 'coworking', emoji: '💻', label: 'Coworking spaces', desc: '' },
      { value: 'cafes', emoji: '☕', label: 'Cafés', desc: '' },
      { value: 'accommodation', emoji: '🏡', label: 'Accommodation', desc: '' },
      { value: 'anywhere', emoji: '🌴', label: 'Anywhere with Wi-Fi', desc: '' },
    ],
  },
  {
    key: 'app_goals',
    title: 'What do you want help with the most?',
    subtitle: 'Select all that apply.',
    type: 'multi' as const,
    options: [
      { value: 'places', emoji: '📍', label: 'Finding cool places', desc: '' },
      { value: 'guides', emoji: '📅', label: '7-day travel guides', desc: '' },
      { value: 'coworking', emoji: '🧑‍💻', label: 'Coworking recommendations', desc: '' },
      { value: 'hostels', emoji: '🛏', label: 'Budget hostels', desc: '' },
      { value: 'lists', emoji: '📝', label: 'Saving places into lists', desc: '' },
    ],
  },
  {
    key: 'favorite_destinations',
    title: 'Where do you want to go next?',
    subtitle: 'Search and pick 3–5 destinations.',
    type: 'destinations' as const,
    options: [],
  },
  {
    key: 'travel_vibe',
    title: "What's your travel vibe?",
    subtitle: 'Select all that apply.',
    type: 'multi' as const,
    options: [
      { value: 'nature', emoji: '🌴', label: 'Chill & nature', desc: '' },
      { value: 'cities', emoji: '🏙', label: 'Big cities', desc: '' },
      { value: 'nightlife', emoji: '🎉', label: 'Nightlife', desc: '' },
      { value: 'wellness', emoji: '🧘', label: 'Wellness', desc: '' },
      { value: 'food', emoji: '🍜', label: 'Food culture', desc: '' },
    ],
  },
  {
    key: 'notification_prefs',
    title: 'Want smart travel alerts?',
    subtitle: 'Select all that apply.',
    type: 'multi' as const,
    options: [
      { value: 'coworking', emoji: '🔔', label: 'New coworking spots', desc: '' },
      { value: 'hostels', emoji: '💸', label: 'Cheap hostels', desc: '' },
      { value: 'gems', emoji: '📍', label: 'Hidden gems', desc: '' },
      { value: 'guides', emoji: '🗺', label: 'New 7-day guides', desc: '' },
    ],
  },
];

const POPULAR_DESTINATIONS = [
  'Bali', 'Lisbon', 'Mexico City', 'Bangkok', 'Medellín',
  'Barcelona', 'Chiang Mai', 'Porto', 'Buenos Aires', 'Cape Town',
  'Berlin', 'Tokyo', 'Tbilisi', 'Ho Chi Minh City', 'Canggu',
  'Split', 'Marrakech', 'Bogotá', 'Playa del Carmen', 'Da Nang',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    search_priorities: [],
    app_goals: [],
    favorite_destinations: [],
    travel_vibe: [],
    notification_prefs: [],
  });
  const [destSearch, setDestSearch] = useState('');

  const current = STEPS[step];
  const totalSteps = STEPS.length;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;

  const handleSingleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  };

  const handleMultiSelect = (value: string) => {
    setAnswers((prev) => {
      const arr = (prev[current.key] as string[]) || [];
      return {
        ...prev,
        [current.key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleDestToggle = (city: string) => {
    setAnswers((prev) => {
      const arr = (prev.favorite_destinations as string[]) || [];
      if (arr.includes(city)) return { ...prev, favorite_destinations: arr.filter((v) => v !== city) };
      if (arr.length >= 5) return prev;
      return { ...prev, favorite_destinations: [...arr, city] };
    });
  };

  const canProceed = () => {
    const val = answers[current.key];
    if (current.type === 'single') return !!val;
    if (current.type === 'multi') return (val as string[])?.length > 0;
    if (current.type === 'destinations') return (val as string[])?.length >= 1;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({
        mascot: answers.mascot as string,
        traveler_type: answers.traveler_type as string,
        search_priorities: answers.search_priorities as string[],
        monthly_budget: answers.monthly_budget as string,
        accommodation_style: answers.accommodation_style as string,
        work_setup: answers.work_setup as string,
        app_goals: answers.app_goals as string[],
        favorite_destinations: answers.favorite_destinations as string[],
        travel_vibe: answers.travel_vibe as string[],
        notification_prefs: answers.notification_prefs as string[],
        onboarding_completed: true,
      });
      // Embed profile in background (non-blocking)
      if (user?.id) {
        embedProfile({
          traveler_type: answers.traveler_type as string,
          monthly_budget: answers.monthly_budget as string,
          accommodation_style: answers.accommodation_style as string,
          work_setup: answers.work_setup as string,
          travel_vibe: answers.travel_vibe as string[],
          search_priorities: answers.search_priorities as string[],
          app_goals: answers.app_goals as string[],
        }, user.id).catch(() => {});
      }
      setStep(totalSteps); // show final screen
    } catch {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    }
  };

  const filteredDest = POPULAR_DESTINATIONS.filter((d) =>
    d.toLowerCase().includes(destSearch.toLowerCase())
  );

  const mascotImage = answers.mascot === 'gorilla' ? gorillaCharacter : answers.mascot === 'cat' ? catCharacter : answers.mascot === 'dog' ? dogCharacter : catCharacter;

  // Final screen
  if (step === totalSteps) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <img src={mascotImage} alt="" className="w-32 h-32 mx-auto rounded-3xl object-cover shadow-xl" />
          </motion.div>
          <h1 className="text-3xl font-sans font-bold text-foreground">
            Your nomad profile is ready
          </h1>
          <p className="text-muted-foreground">
            Your {answers.mascot === 'gorilla' ? 'Gorilla' : answers.mascot === 'cat' ? 'Cat' : 'Dog'} companion is preparing your first destinations.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button size="lg" onClick={() => navigate('/explore')} className="mt-4">
              Start Exploring
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-6 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {step + 1} of {totalSteps}
          </span>
          {step > 0 && (
            <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-sans font-bold text-foreground">
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p className="text-sm text-muted-foreground">{current.subtitle}</p>
                )}
              </div>

              {/* Destinations step */}
              {current.type === 'destinations' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cities..."
                      value={destSearch}
                      onChange={(e) => setDestSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredDest.map((city) => {
                      const selected = (answers.favorite_destinations as string[])?.includes(city);
                      return (
                        <button
                          key={city}
                          onClick={() => handleDestToggle(city)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {city}
                          {selected && <Check className="inline ml-1 h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(answers.favorite_destinations as string[])?.length || 0} / 5 selected
                  </p>
                </div>
              ) : (
                /* Single / Multi select options */
                <div className="grid gap-3">
                  {current.options.map((opt) => {
                    const isMulti = current.type === 'multi';
                    const isSelected = isMulti
                      ? (answers[current.key] as string[])?.includes(opt.value)
                      : answers[current.key] === opt.value;

                    return (
                      <button
                        key={opt.value}
                        onClick={() => isMulti ? handleMultiSelect(opt.value) : handleSingleSelect(opt.value)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border bg-card hover:border-primary/30 hover:bg-card/80'
                        }`}
                      >
                        {(opt as any).image ? (
                          <img src={(opt as any).image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground text-sm">{opt.label}</span>
                          {opt.desc && (
                            <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                          )}
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-8 max-w-lg mx-auto w-full">
        <Button
          onClick={handleNext}
          disabled={!canProceed() || updateProfile.isPending}
          className="w-full h-12 rounded-2xl text-base"
          size="lg"
        >
          {step === totalSteps - 1
            ? updateProfile.isPending ? 'Saving...' : 'Finish'
            : 'Continue'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
