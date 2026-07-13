import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';

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

export default function ItineraryMap({ activities, dayLabel }: { activities: MapActivity[]; dayLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!BROWSER_KEY) {
      setError('Maps key missing');
      setLoading(false);
      return;
    }
    if (!activities.length) {
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
          center: { lat: 0, lng: 0 },
          zoom: 2,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
        });

        const bounds = new g.maps.LatLngBounds();
        const geocode = (addr: string) =>
          new Promise<any>((resolve) => {
            geocoder.geocode({ address: addr }, (results: any, status: string) => {
              resolve(status === 'OK' && results?.[0] ? results[0].geometry.location : null);
            });
          });

        const locations = await Promise.all(activities.map((a) => geocode(a.location)));
        const pathCoords: any[] = [];
        locations.forEach((loc, i) => {
          if (!loc) return;
          bounds.extend(loc);
          pathCoords.push(loc);
          new g.maps.Marker({
            position: loc,
            map,
            label: { text: String(i + 1), color: '#fff', fontWeight: '600', fontSize: '12px' },
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
        if (pathCoords.length > 0) {
          map.fitBounds(bounds, 60);
          if (pathCoords.length === 1) map.setZoom(14);
        }
        setLoading(false);
      } catch (e) {
        console.error('Map load failed:', e);
        setError('Could not load map');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activities]);

  const gmapsHref = (() => {
    const pts = activities.map((a) => encodeURIComponent(a.location)).filter(Boolean);
    if (pts.length < 2) return `https://www.google.com/maps/search/?api=1&query=${pts[0] || ''}`;
    const origin = pts[0];
    const destination = pts[pts.length - 1];
    const waypoints = pts.slice(1, -1).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=walking`;
  })();

  if (!activities.length) return null;

  return (
    <div className="mb-6 rounded-[1.5rem] overflow-hidden border border-border/30 bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{dayLabel} · Map itinerary</span>
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
      <div className="relative w-full h-[320px] bg-secondary/30">
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