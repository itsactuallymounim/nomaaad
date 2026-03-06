import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  type DropResult,
  type DraggableProvided,
  type DroppableProvided
} from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Star, Trash2, GripVertical, ChevronDown, ChevronRight,
  Hotel, Utensils, Camera, Car, Activity, ShoppingBag, Moon, CalendarDays,
  FileDown, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTravelStore } from '@/store/travelStore';
import { useMapSync } from '@/hooks/useMapSync';
import type { Activity as ActivityType, Day } from '@/types/trip';
import { cn } from '@/lib/utils';
import { TripPdfTemplate } from './TripPdfTemplate';
import { exportTripPdf } from '@/lib/exportPdf';

const categoryIcons: Record<string, React.ElementType> = {
  accommodation: Hotel,
  restaurant: Utensils,
  attraction: Camera,
  transport: Car,
  activity: Activity,
  shopping: ShoppingBag,
  nightlife: Moon
};

interface ActivityCardProps {
  activity: ActivityType;
  dayId: string;
  index: number;
  provided: DraggableProvided;
  isDragging: boolean;
  onDelete: (dayId: string, activityId: string) => void;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}

function ActivityCard({ 
  activity, 
  dayId, 
  index,
  provided,
  isDragging,
  onDelete, 
  isSelected, 
  isHovered,
  onSelect,
  onHover
}: ActivityCardProps) {
  const Icon = categoryIcons[activity.category] || Activity;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        "relative group cursor-pointer",
        "before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border",
        "first:before:top-6 last:before:bottom-1/2",
        isDragging && "z-50"
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
          isHovered && !isSelected && "shadow-md",
          isDragging && "shadow-xl ring-2 ring-primary rotate-2"
        )}>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              {/* Drag handle */}
              <div 
                {...provided.dragHandleProps}
                className="p-1 -ml-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

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
    </div>
  );
}

interface DayGroupProps {
  day: Day;
  onDeleteActivity: (dayId: string, activityId: string) => void;
  selectedActivityId: string | null;
  hoveredActivityId: string | null;
  onSelectActivity: (id: string) => void;
  onHoverActivity: (id: string | null) => void;
}

function DayGroup({ 
  day, 
  onDeleteActivity, 
  selectedActivityId,
  hoveredActivityId,
  onSelectActivity,
  onHoverActivity
}: DayGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
                  {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
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
            <Droppable droppableId={day.id} type="activity">
              {(provided: DroppableProvided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[60px] rounded-lg transition-colors",
                    snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
                  )}
                >
                  {day.activities.length > 0 ? (
                    <div className="space-y-2">
                      {day.activities.map((activity, index) => (
                        <Draggable 
                          key={activity.id} 
                          draggableId={activity.id} 
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <ActivityCard
                              activity={activity}
                              dayId={day.id}
                              index={index}
                              provided={dragProvided}
                              isDragging={dragSnapshot.isDragging}
                              onDelete={onDeleteActivity}
                              isSelected={selectedActivityId === activity.id}
                              isHovered={hoveredActivityId === activity.id}
                              onSelect={() => onSelectActivity(activity.id)}
                              onHover={onHoverActivity}
                            />
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Drop activities here or ask AI for suggestions!
                    </p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function ItineraryTimeline() {
  const [isExporting, setIsExporting] = useState(false);
  const { 
    activeItinerary, 
    removeActivity, 
    reorderActivity, 
    moveActivityBetweenDays 
  } = useTravelStore();
  
  const { 
    selectedActivityId, 
    hoveredActivityId, 
    handleActivityClick, 
    handleActivityHover 
  } = useMapSync();

  const handleExportPdf = useCallback(async () => {
    if (!activeItinerary) return;
    setIsExporting(true);
    try {
      // Give the hidden template a moment to render
      await new Promise(r => setTimeout(r, 200));
      await exportTripPdf('trip-pdf-template', activeItinerary.name || 'trip-itinerary');
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setIsExporting(false);
    }
  }, [activeItinerary]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Same day reorder
    if (source.droppableId === destination.droppableId) {
      reorderActivity(source.droppableId, source.index, destination.index);
    } else {
      // Move between days
      moveActivityBetweenDays(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
    }
  }, [reorderActivity, moveActivityBetweenDays]);

  if (!activeItinerary) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No itinerary loaded
      </div>
    );
  }

  return (
    <>
      {/* Hidden PDF template rendered off-screen for capture */}
      {createPortal(
        <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, pointerEvents: 'none' }}>
          <TripPdfTemplate trip={activeItinerary} />
        </div>,
        document.body
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">{activeItinerary.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {activeItinerary.destination}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <WhatsAppShareButton trip={activeItinerary} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="shrink-0 h-8 text-xs gap-1.5 rounded-xl"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              {isExporting ? 'Exporting…' : 'PDF'}
            </Button>
          </div>
        </div>

        {/* Timeline with DnD — scrolls within whatever container it's placed in */}
        <div className="flex-1 overflow-y-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
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
                      onDeleteActivity={removeActivity}
                      selectedActivityId={selectedActivityId}
                      hoveredActivityId={hoveredActivityId}
                      onSelectActivity={handleActivityClick}
                      onHoverActivity={handleActivityHover}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </DragDropContext>
        </div>
      </div>
    </>
  );
}

