import { MessageSquare, Map, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTravelStore } from '@/store/travelStore';
import { cn } from '@/lib/utils';

const views = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'map' as const, label: 'Map', icon: Map },
  { id: 'itinerary' as const, label: 'Itinerary', icon: Calendar }
];

export function MobileNavigation() {
  const { mobileView, setMobileView } = useTravelStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {views.map(view => (
          <Button
            key={view.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-1 h-auto py-2",
              mobileView === view.id && "bg-muted text-primary"
            )}
            onClick={() => setMobileView(view.id)}
          >
            <view.icon className={cn(
              "h-5 w-5",
              mobileView === view.id ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs",
              mobileView === view.id ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {view.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
