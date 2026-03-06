import { MessageSquare, Map, Calendar, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTravelStore } from '@/store/travelStore';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const views = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'map' as const, label: 'Map', icon: Map },
  { id: 'itinerary' as const, label: 'Itinerary', icon: Calendar },
];

export function MobileNavigation() {
  const { mobileView, setMobileView } = useTravelStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/40 md:hidden safe-area-pb">
      <div className="flex items-center justify-around py-2 px-3">
        {views.map(view => (
          <Button
            key={view.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 h-auto py-2 rounded-2xl transition-all",
              mobileView === view.id && "bg-primary/10"
            )}
            onClick={() => setMobileView(view.id)}
          >
            <view.icon className={cn(
              "h-5 w-5",
              mobileView === view.id ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[10px]",
              mobileView === view.id ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {view.label}
            </span>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 rounded-2xl"
          asChild
        >
          <Link to="/lists">
            <BookmarkPlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Lists</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
