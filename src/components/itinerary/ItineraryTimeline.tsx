import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  MapPin, Clock, Star, Trash2, GripVertical, ChevronDown, ChevronRight,
  Hotel, Utensils, Camera, Car, Activity, ShoppingBag, Moon, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTravelPlanner } from '@/hooks/useTravelPlanner';
import { useMapSync } from '@/hooks/useMapSync';
import type { Activity as ActivityType, Day } from '@/types/trip';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const categoryIcons: Record<string, React.ElementType> = {
  accommodation: Hotel,
  restaurant: Utensils,
  attraction: Camera,
  transport: Car,
  activity: Activity,
  shopping: ShoppingBag,
  nightlife: Moon
};

const timeSlotOrder = ['morning', 'afternoon', 'evening', 'night'];

interface ActivityCardProps {
  activity: ActivityType;
  dayId: string;
  onDelete: (dayId: string, activityId: string) => void;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}

function ActivityCard({ 
  activity, 
  dayId, 
  onDelete, 
  isSelected, 
  isHovered,
  onSelect,
  onHover
}: ActivityCardProps) {
  const Icon = categoryIcons[activity.category] || Activity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative group cursor-pointer",
        "before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border",
        "first:before:top-6 last:before:bottom-1/2"
      )}
      onClick={onSelect}
      onMouseEnter={() => onHover(activity.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex gap-3 pl-2">
        {/* Timeline dot */}
        <div className={cn(
          "relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-3 transition-colors",
          isSelected || isHovered
            ? "border-primary bg-primary" 
            : "border-muted-foreground/30 bg-background"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isSelected || isHovered ? "bg-primary-foreground" : "bg-muted-foreground/50"
          )} />
        </div>

        {/* Card */}
        <Card className={cn(
          "flex-1 transition-all duration-200",
          isSelected && "ring-2 ring-primary shadow-lg",
          isHovered && !isSelected && "shadow-md"
        )}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm line-clamp-1">{activity.name}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(dayId, activity.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {activity.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {activity.timeSlot}
                  </Badge>
                  
                  {activity.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{Math.floor(activity.duration / 60)}h{activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ''}</span>
                    </div>
                  )}
                  
                  {activity.rating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-chart-1 text-chart-1" />
                      <span>{activity.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

interface DayGroupProps {
  day: Day;
  onDeleteActivity: (dayId: string, activityId: string) => void;
  onDeleteDay: (dayId: string) => void;
  selectedActivityId: string | null;
  hoveredActivityId: string | null;
  onSelectActivity: (id: string) => void;
  onHoverActivity: (id: string | null) => void;
}

function DayGroup({ 
  day, 
  onDeleteActivity, 
  onDeleteDay,
  selectedActivityId,
  hoveredActivityId,
  onSelectActivity,
  onHoverActivity
}: DayGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Sort activities by time slot
  const sortedActivities = [...day.activities].sort((a, b) => 
    timeSlotOrder.indexOf(a.timeSlot) - timeSlotOrder.indexOf(b.timeSlot)
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Day {day.dayNumber}</CardTitle>
                  <p className="text-xs text-muted-foreground">{day.title}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {day.activities.length} activities
                </Badge>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {sortedActivities.length > 0 ? (
                  <div className="space-y-2">
                    {sortedActivities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        dayId={day.id}
                        onDelete={onDeleteActivity}
                        isSelected={selectedActivityId === activity.id}
                        isHovered={hoveredActivityId === activity.id}
                        onSelect={() => onSelectActivity(activity.id)}
                        onHover={onHoverActivity}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activities yet. Ask AI for suggestions!
                  </p>
                )}
              </AnimatePresence>
            </LayoutGroup>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function ItineraryTimeline() {
  const { activeItinerary, deleteDayFromItinerary, deleteActivityFromItinerary } = useTravelPlanner();
  const { selectedActivityId, hoveredActivityId, handleActivityClick, handleActivityHover } = useMapSync();

  if (!activeItinerary) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No itinerary loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <h2 className="font-semibold">{activeItinerary.name}</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {activeItinerary.destination}
        </p>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeItinerary.days.map(day => (
              <motion.div
                key={day.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DayGroup
                  day={day}
                  onDeleteActivity={deleteActivityFromItinerary}
                  onDeleteDay={deleteDayFromItinerary}
                  selectedActivityId={selectedActivityId}
                  hoveredActivityId={hoveredActivityId}
                  onSelectActivity={handleActivityClick}
                  onHoverActivity={handleActivityHover}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
