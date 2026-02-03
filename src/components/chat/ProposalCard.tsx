import { motion } from 'framer-motion';
import { Plus, Check, MapPin, Clock, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityProposal, Day } from '@/types/trip';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  proposal: ActivityProposal;
  messageId: string;
  days: Day[];
  onAddToItinerary: (messageId: string, proposal: ActivityProposal, dayId: string) => void;
}

const categoryColors: Record<string, string> = {
  accommodation: 'bg-chart-1/20 text-chart-1',
  restaurant: 'bg-chart-2/20 text-chart-2',
  attraction: 'bg-chart-3/20 text-chart-3',
  transport: 'bg-chart-4/20 text-chart-4',
  activity: 'bg-chart-5/20 text-chart-5',
  shopping: 'bg-primary/20 text-primary',
  nightlife: 'bg-accent/20 text-accent-foreground'
};

const timeSlotIcons: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙'
};

export function ProposalCard({ proposal, messageId, days, onAddToItinerary }: ProposalCardProps) {
  const { activity, isAdded } = proposal;

  const handleAdd = (dayId: string) => {
    onAddToItinerary(messageId, proposal, dayId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-200",
        isAdded ? "opacity-60 border-chart-2" : "hover:shadow-md"
      )}>
        {activity.mediaUrl && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={activity.mediaUrl} 
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-sm leading-tight">{activity.name}</h4>
            <Badge variant="secondary" className={cn("text-xs shrink-0", categoryColors[activity.category])}>
              {activity.category}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {activity.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{timeSlotIcons[activity.timeSlot]}</span>
              <span className="capitalize">{activity.timeSlot}</span>
            </div>
            
            {activity.duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{Math.floor(activity.duration / 60)}h {activity.duration % 60}m</span>
              </div>
            )}
            
            {activity.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-chart-1 text-chart-1" />
                <span>{activity.rating}</span>
              </div>
            )}
            
            {activity.price && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>${activity.price}</span>
              </div>
            )}
          </div>

          {activity.address && (
            <div className="flex items-start gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{activity.address}</span>
            </div>
          )}

          {isAdded ? (
            <div className="flex items-center gap-2 text-sm text-chart-2">
              <Check className="h-4 w-4" />
              <span>Added to itinerary</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {days.slice(0, 3).map(day => (
                <Button
                  key={day.id}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => handleAdd(day.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Day {day.dayNumber}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
