import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface TimelineActivity {
  time: string;
  title: string;
  category: string;
}

interface TripTimelineCardProps {
  destination: string;
  dayNumber: number;
  totalDays: number;
  travelerType: string;
  budgetLabel: string;
  activities: TimelineActivity[];
  totalCost: string;
  generatedIn?: number;
  onViewFullPlan: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜',
  work: '💻',
  explore: '🏛',
  transport: '🚌',
  social: '🎉',
  wellness: '🧘',
};

export default function TripTimelineCard({
  destination,
  dayNumber,
  totalDays,
  travelerType,
  budgetLabel,
  activities,
  totalCost,
  generatedIn,
  onViewFullPlan,
}: TripTimelineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl border border-border/30 shadow-lg p-6 w-full max-w-md"
    >
      {/* Header */}
      {generatedIn && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-mono text-primary">Generated in {generatedIn}s</span>
        </div>
      )}
      <h3 className="text-xl font-bold text-foreground">
        {destination} — Day {dayNumber}
      </h3>
      <p className="text-sm text-muted-foreground mt-0.5">
        {budgetLabel} · {travelerType} · {totalDays} Days
      </p>

      {/* Timeline */}
      <div className="mt-6 space-y-0">
        {activities.slice(0, 7).map((act, idx) => {
          const emoji = CATEGORY_EMOJI[act.category] || '📍';
          const isHighlighted = idx === 3; // highlight one for visual interest
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${
                isHighlighted ? 'bg-secondary/60' : ''
              }`}
            >
              <span className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                {act.time}
              </span>
              <span className="text-xl shrink-0">{emoji}</span>
              <span className="text-sm font-medium text-foreground truncate">
                {act.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {activities.length} activities · {totalCost}
        </span>
        <button
          onClick={onViewFullPlan}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          View full plan <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
