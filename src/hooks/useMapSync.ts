import { useCallback, useEffect, useRef } from 'react';
import { useTravelStore } from '@/store/travelStore';
import type { Coordinates } from '@/types/trip';

export function useMapSync() {
  const {
    mapViewState,
    selectedActivityId,
    hoveredActivityId,
    setMapViewState,
    flyToCoordinates,
    setSelectedActivity,
    setHoveredActivity,
    getAllActivities,
    getActivityById
  } = useTravelStore();

  const animationRef = useRef<number | null>(null);

  // Smooth fly-to animation
  const animatedFlyTo = useCallback((targetCoords: Coordinates, targetZoom: number = 14) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startCenter = { ...mapViewState.center };
    const startZoom = mapViewState.zoom;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const newCenter = {
        lat: startCenter.lat + (targetCoords.lat - startCenter.lat) * eased,
        lng: startCenter.lng + (targetCoords.lng - startCenter.lng) * eased
      };
      const newZoom = startZoom + (targetZoom - startZoom) * eased;

      setMapViewState({ center: newCenter, zoom: newZoom });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [mapViewState.center, mapViewState.zoom, setMapViewState]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleActivityClick = useCallback((activityId: string) => {
    setSelectedActivity(activityId);
    const activity = getActivityById(activityId);
    if (activity) {
      animatedFlyTo(activity.coordinates, 15);
    }
  }, [setSelectedActivity, getActivityById, animatedFlyTo]);

  const handleActivityHover = useCallback((activityId: string | null) => {
    setHoveredActivity(activityId);
  }, [setHoveredActivity]);

  const fitBoundsToActivities = useCallback(() => {
    const activities = getAllActivities();
    if (activities.length === 0) return;

    const lats = activities.map(a => a.coordinates.lat);
    const lngs = activities.map(a => a.coordinates.lng);

    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Calculate zoom based on bounds spread
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const spread = Math.max(latSpread, lngSpread);
    
    let zoom = 12;
    if (spread > 1) zoom = 8;
    else if (spread > 0.5) zoom = 10;
    else if (spread > 0.1) zoom = 12;
    else zoom = 14;

    animatedFlyTo({ lat: centerLat, lng: centerLng }, zoom);
  }, [getAllActivities, animatedFlyTo]);

  return {
    mapViewState,
    selectedActivityId,
    hoveredActivityId,
    flyToCoordinates: animatedFlyTo,
    handleActivityClick,
    handleActivityHover,
    fitBoundsToActivities,
    getAllActivities
  };
}
