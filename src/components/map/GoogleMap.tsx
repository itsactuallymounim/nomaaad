/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapSync } from '@/hooks/useMapSync';
import { useTravelStore } from '@/store/travelStore';
import { ZoomIn, ZoomOut, Maximize2, Route, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/trip';

const GOOGLE_MAPS_API_KEY = 'GOOGLE_MAPS_API_KEY';

const categoryColors: Record<string, string> = {
  accommodation: '#3B82F6', // blue
  restaurant: '#EF4444', // red
  attraction: '#8B5CF6', // purple
  transport: '#F59E0B', // amber
  activity: '#10B981', // green
  shopping: '#EC4899', // pink
  nightlife: '#6366F1'  // indigo
};

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(true);

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
    const initMap = async () => {
      try {
        await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);
        
        if (!mapRef.current || googleMapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: mapViewState.center.lat, lng: mapViewState.center.lng },
          zoom: mapViewState.zoom,
          styles: getMapStyles(),
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        googleMapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setIsLoaded(true);

        // Sync map state on user interactions
        map.addListener('idle', () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          if (center && zoom) {
            setMapViewState({
              center: { lat: center.lat(), lng: center.lng() },
              zoom
            });
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
      }
    };

    initMap();
  }, []);

  // Update map center and zoom when state changes
  useEffect(() => {
    if (!googleMapRef.current) return;
    
    const map = googleMapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    if (currentCenter && currentZoom) {
      const needsUpdate = 
        Math.abs(currentCenter.lat() - mapViewState.center.lat) > 0.0001 ||
        Math.abs(currentCenter.lng() - mapViewState.center.lng) > 0.0001 ||
        currentZoom !== mapViewState.zoom;
      
      if (needsUpdate) {
        map.panTo({ lat: mapViewState.center.lat, lng: mapViewState.center.lng });
        map.setZoom(mapViewState.zoom);
      }
    }
  }, [mapViewState]);

  // Create custom marker icon
  const createMarkerIcon = useCallback((activity: Activity, isSelected: boolean, isHovered: boolean): google.maps.Symbol => {
    const color = categoryColors[activity.category] || '#3B82F6';
    const scale = isSelected || isHovered ? 1.3 : 1;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: isSelected ? 3 : 2,
      scale: 12 * scale
    };
  }, []);

  // Update markers when activities change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const map = googleMapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    activities.forEach((activity, index) => {
      const isSelected = activity.id === selectedActivityId;
      const isHovered = activity.id === hoveredActivityId;

      const marker = new google.maps.Marker({
        position: { lat: activity.coordinates.lat, lng: activity.coordinates.lng },
        map,
        icon: createMarkerIcon(activity, isSelected, isHovered),
        label: {
          text: String(index + 1),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold'
        },
        title: activity.name,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
        zIndex: isSelected ? 1000 : isHovered ? 999 : index
      });

      // Click handler
      marker.addListener('click', () => {
        handleActivityClick(activity.id);
        
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">${activity.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: capitalize;">${activity.category}</p>
              ${activity.rating ? `<p style="margin: 4px 0 0; font-size: 12px;">⭐ ${activity.rating}</p>` : ''}
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      // Hover handlers
      marker.addListener('mouseover', () => {
        marker.setIcon(createMarkerIcon(activity, isSelected, true));
      });

      marker.addListener('mouseout', () => {
        marker.setIcon(createMarkerIcon(activity, isSelected, false));
      });

      markersRef.current.push(marker);
    });

    // Stop bounce animation after a short delay
    if (selectedActivityId) {
      setTimeout(() => {
        markersRef.current.forEach(marker => {
          marker.setAnimation(null);
        });
      }, 1500);
    }
  }, [activities, selectedActivityId, hoveredActivityId, isLoaded, createMarkerIcon, handleActivityClick]);

  // Draw route polyline
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded || !showRoute) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const map = googleMapRef.current;

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (activities.length < 2) return;

    // Create path from activities
    const path = activities.map(a => ({
      lat: a.coordinates.lat,
      lng: a.coordinates.lng
    }));

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#7C3AED',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor: '#7C3AED'
        },
        offset: '50%',
        repeat: '100px'
      }],
      map
    });
  }, [activities, isLoaded, showRoute]);

  const handleZoomIn = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 11;
      googleMapRef.current.setZoom(Math.min(currentZoom + 1, 20));
    }
  };

  const handleZoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 11;
      googleMapRef.current.setZoom(Math.max(currentZoom - 1, 3));
    }
  };

  const handleFitBounds = () => {
    if (!googleMapRef.current || activities.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    activities.forEach(a => {
      bounds.extend({ lat: a.coordinates.lat, lng: a.coordinates.lng });
    });
    googleMapRef.current.fitBounds(bounds, 50);
  };

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">Please check your API key</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {!isLoaded && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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
      <div className="absolute bottom-4 left-4 p-3 bg-card/90 backdrop-blur-sm rounded-lg shadow-lg z-10">
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
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full text-xs font-mono shadow-lg z-10">
        {mapViewState.center.lat.toFixed(4)}, {mapViewState.center.lng.toFixed(4)}
      </div>
    </div>
  );
}

// Custom map styles for a cleaner look
function getMapStyles(): google.maps.MapTypeStyle[] {
  return [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'simplified' }]
    }
  ];
}
