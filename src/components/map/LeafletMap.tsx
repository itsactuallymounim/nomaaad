import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapSync } from '@/hooks/useMapSync';
import { useTravelStore } from '@/store/travelStore';
import { ZoomIn, ZoomOut, Maximize2, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/trip';

const categoryColors: Record<string, string> = {
  accommodation: '#3B82F6',
  restaurant: '#EF4444',
  attraction: '#8B5CF6',
  transport: '#F59E0B',
  activity: '#10B981',
  shopping: '#EC4899',
  nightlife: '#6366F1'
};

// Custom marker icon creator
function createMarkerIcon(color: string, isSelected: boolean, isHovered: boolean): L.DivIcon {
  const size = isSelected || isHovered ? 36 : 28;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

export function LeafletMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  const [showRoute, setShowRoute] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    mapViewState,
    selectedActivityId,
    hoveredActivityId,
    handleActivityClick,
    getAllActivities
  } = useMapSync();

  const { setMapViewState } = useTravelStore();
  const activities = getAllActivities();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [mapViewState.center.lat, mapViewState.center.lng],
      zoom: mapViewState.zoom,
      zoomControl: false,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;
    setIsInitialized(true);

    // Sync map state on user interactions
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapViewState({
        center: { lat: center.lat, lng: center.lng },
        zoom
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map view when state changes externally
  useEffect(() => {
    if (!mapRef.current || !isInitialized) return;
    
    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    const needsUpdate = 
      Math.abs(currentCenter.lat - mapViewState.center.lat) > 0.0001 ||
      Math.abs(currentCenter.lng - mapViewState.center.lng) > 0.0001 ||
      currentZoom !== mapViewState.zoom;
    
    if (needsUpdate) {
      map.flyTo(
        [mapViewState.center.lat, mapViewState.center.lng],
        mapViewState.zoom,
        { duration: 0.8 }
      );
    }
  }, [mapViewState, isInitialized]);

  // Update markers when activities change
  useEffect(() => {
    if (!mapRef.current || !isInitialized) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create new markers
    activities.forEach((activity) => {
      const isSelected = activity.id === selectedActivityId;
      const isHovered = activity.id === hoveredActivityId;
      const color = categoryColors[activity.category] || '#3B82F6';

      const marker = L.marker(
        [activity.coordinates.lat, activity.coordinates.lng],
        { icon: createMarkerIcon(color, isSelected, isHovered) }
      ).addTo(map);

      // Popup content
      const popupContent = `
        <div style="padding: 4px; min-width: 120px;">
          <strong style="font-size: 14px;">${activity.name}</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: capitalize;">${activity.category}</p>
          ${activity.rating ? `<p style="margin: 4px 0 0; font-size: 12px;">⭐ ${activity.rating}</p>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);

      // Click handler
      marker.on('click', () => {
        handleActivityClick(activity.id);
      });

      markersRef.current.push(marker);
    });
  }, [activities, selectedActivityId, hoveredActivityId, isInitialized, handleActivityClick]);

  // Draw route polyline
  useEffect(() => {
    if (!mapRef.current || !isInitialized) return;

    const map = mapRef.current;

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!showRoute || activities.length < 2) return;

    // Create path from activities
    const path: L.LatLngExpression[] = activities.map(a => [
      a.coordinates.lat,
      a.coordinates.lng
    ]);

    polylineRef.current = L.polyline(path, {
      color: '#7C3AED',
      weight: 3,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);
  }, [activities, isInitialized, showRoute]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleFitBounds = () => {
    if (!mapRef.current || activities.length === 0) return;

    const bounds = L.latLngBounds(
      activities.map(a => [a.coordinates.lat, a.coordinates.lng])
    );
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
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
          onClick={handleFitBounds}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant={showRoute ? "default" : "secondary"}
          size="icon"
          className={cn(
            "shadow-lg backdrop-blur-sm",
            !showRoute && "bg-card/90"
          )}
          onClick={() => setShowRoute(!showRoute)}
        >
          <Route className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-card/90 backdrop-blur-sm rounded-lg shadow-lg z-[1000]">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(categoryColors).slice(0, 6).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full text-xs font-mono shadow-lg z-[1000]">
        {mapViewState.center.lat.toFixed(4)}, {mapViewState.center.lng.toFixed(4)}
      </div>
    </div>
  );
}
