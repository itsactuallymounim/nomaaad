import { useMapSync } from '@/hooks/useMapSync';
import { useTravelStore } from '@/store/travelStore';
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import heroImage from '@/assets/hero-travel.jpg';

const categoryColors: Record<string, string> = {
  accommodation: 'bg-chart-1',
  restaurant: 'bg-chart-2',
  attraction: 'bg-chart-3',
  transport: 'bg-chart-4',
  activity: 'bg-chart-5',
  shopping: 'bg-primary',
  nightlife: 'bg-accent'
};

export function MapView() {
  const {
    mapViewState,
    selectedActivityId,
    hoveredActivityId,
    handleActivityClick,
    fitBoundsToActivities,
    getAllActivities
  } = useMapSync();

  const { setMapViewState } = useTravelStore();

  const activities = getAllActivities();

  const handleZoomIn = () => {
    setMapViewState({ zoom: Math.min(mapViewState.zoom + 1, 18) });
  };

  const handleZoomOut = () => {
    setMapViewState({ zoom: Math.max(mapViewState.zoom - 1, 3) });
  };

  // Convert coordinates to percentage positions on the map
  // This is a simplified projection for demo purposes
  const coordToPosition = (lat: number, lng: number) => {
    // Base coordinates for Amalfi Coast area
    const baseLat = 40.63;
    const baseLng = 14.55;
    const scale = mapViewState.zoom * 8;
    
    return {
      x: 50 + (lng - baseLng) * scale,
      y: 50 - (lat - baseLat) * scale
    };
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-muted">
      {/* Map background with travel image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          transform: `scale(${1 + (mapViewState.zoom - 11) * 0.1})`
        }}
      >
        <div className="absolute inset-0 bg-background/20" />
      </div>

      {/* Map grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Activity markers */}
      {activities.map(activity => {
        const pos = coordToPosition(activity.coordinates.lat, activity.coordinates.lng);
        const isSelected = activity.id === selectedActivityId;
        const isHovered = activity.id === hoveredActivityId;

        return (
          <button
            key={activity.id}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 z-10",
              "group cursor-pointer",
              (isSelected || isHovered) && "z-20"
            )}
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`
            }}
            onClick={() => handleActivityClick(activity.id)}
          >
            {/* Marker pin */}
            <div className={cn(
              "relative flex flex-col items-center",
              (isSelected || isHovered) && "scale-125"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all",
                categoryColors[activity.category] || 'bg-primary',
                isSelected && "ring-2 ring-offset-2 ring-primary"
              )}>
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              
              {/* Pin tail */}
              <div className={cn(
                "w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent -mt-1",
                `border-t-current`,
                categoryColors[activity.category] || 'text-primary'
              )} 
              style={{ 
                borderTopColor: 'inherit' 
              }}
              />

              {/* Tooltip */}
              <div className={cn(
                "absolute bottom-full mb-2 px-3 py-2 bg-card rounded-lg shadow-xl",
                "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                "min-w-[150px] max-w-[200px]",
                isSelected && "opacity-100"
              )}>
                <p className="text-sm font-medium line-clamp-1">{activity.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{activity.category}</p>
              </div>
            </div>
          </button>
        );
      })}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={fitBoundsToActivities}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium shadow-lg">
        Zoom: {mapViewState.zoom.toFixed(1)}x
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full text-xs font-mono shadow-lg">
        {mapViewState.center.lat.toFixed(4)}, {mapViewState.center.lng.toFixed(4)}
      </div>
    </div>
  );
}
