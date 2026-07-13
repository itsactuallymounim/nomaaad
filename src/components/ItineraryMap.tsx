import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MapActivity {
  title: string;
  location: string;
  time: string;
}

declare global {
  interface Window {
    google?: any;
    __nomaaadInitMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

function loadMapsApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('gmaps-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    window.__nomaaadInitMap = () => resolve();
    const s = document.createElement('script');
    s.id = 'gmaps-js';
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__nomaaadInitMap&channel=${TRACKING_ID || ''}`;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function ItineraryMap({
  activities,
  dayLabel,
  city,
}: {
  activities: MapActivity[];
  dayLabel: string;
  city?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!BROWSER_KEY) {
      setError('Maps key missing');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await loadMapsApi();
        if (cancelled || !containerRef.current || !window.google) return;
        const g = window.google;
        const geocoder = new g.maps.Geocoder();

        const map = new g.maps.Map(containerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          disableDefaultUI: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: true,
          styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
        });

        const bounds = new g.maps.LatLngBounds();
        const geocode = (addr: string) =>
          new Promise<any>((resolve) => {
            geocoder.geocode({ address: addr }, (results: any, status: string) => {
              resolve(status === 'OK' && results?.[0] ? results[0].geometry.location : null);
            });
          });

        // Center on city first so user sees the destination immediately
        if (city) {
          const cityLoc = await geocode(city);
          if (cityLoc && !cancelled) {
            map.setCenter(cityLoc);
            map.setZoom(12);
            bounds.extend(cityLoc);
          }
        }

        // Activity markers (numbered)
        const locations = await Promise.all(activities.map((a) => geocode(a.location)));
        const pathCoords: any[] = [];
        locations.forEach((loc, i) => {
          if (!loc) return;
          bounds.extend(loc);
          pathCoords.push(loc);
          new g.maps.Marker({
            position: loc,
            map,
            label: { text: String(i + 1), color: '#fff', fontWeight: '700', fontSize: '12px' },
            title: `${activities[i].time} — ${activities[i].title}`,
          });
        });

        if (pathCoords.length >= 2) {
          new g.maps.Polyline({
            path: pathCoords,
            map,
            geodesic: true,
            strokeColor: '#2563eb',
            strokeOpacity: 0.7,
            strokeWeight: 3,
          });
        }

        // Saved places from user's Lists — plotted as red hearts
        if (user) {
          const { data: saved } = await supabase
            .from('saved_places')
            .select('name, address')
            .eq('user_id', user.id)
            .not('address', 'is', null)
            .limit(50);
          if (saved && saved.length > 0 && !cancelled) {
            const savedLocs = await Promise.all(
              saved.map((p: any) => geocode(p.address as string)),
            );
            const heartIcon = {
              path: 'M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z',
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
              scale: 1.3,
              anchor: new g.maps.Point(12, 22),
            };
            let plotted = 0;
            savedLocs.forEach((loc, i) => {
              if (!loc) return;
              bounds.extend(loc);
              plotted++;
              const marker = new g.maps.Marker({
                position: loc,
                map,
                icon: heartIcon,
                title: saved[i].name,
              });
              const info = new g.maps.InfoWindow({
                content: `<div style="font-size:12px;font-weight:600">❤ ${saved[i].name}</div>`,
              });
              marker.addListener('click', () => info.open({ map, anchor: marker }));
            });
            if (!cancelled) setSavedCount(plotted);
          }
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 60);
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error('Map load failed:', e);
        if (!cancelled) {
          setError('Could not load map');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activities, city, user]);

  const gmapsHref = (() => {
    const pts = activities.map((a) => encodeURIComponent(a.location)).filter(Boolean);
    if (pts.length < 2) {
      const q = pts[0] || (city ? encodeURIComponent(city) : '');
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    const origin = pts[0];
    const destination = pts[pts.length - 1];
    const waypoints = pts.slice(1, -1).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=walking`;
  })();

  return (
    <div className="mb-6 -mx-4 md:-mx-8 rounded-none md:rounded-[1.5rem] overflow-hidden border-y md:border border-border/30 bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{dayLabel} · Map itinerary</span>
          {savedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[11px] font-medium">
              ❤ {savedCount} saved
            </span>
          )}
        </div>
        <a
          href={gmapsHref}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Open in Google Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="relative w-full h-[75vh] min-h-[480px] bg-secondary/30">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}