import type { Trip } from '@/types/trip';
import {
  Hotel, Utensils, Camera, Car, Activity, ShoppingBag, Moon,
  MapPin, Clock, Star
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  accommodation: Hotel,
  restaurant: Utensils,
  attraction: Camera,
  transport: Car,
  activity: Activity,
  shopping: ShoppingBag,
  nightlife: Moon,
};

interface Props {
  trip: Trip;
}

/** Rendered off-screen for html2canvas capture. Uses only inline styles / plain HTML so it's independent of Tailwind dark-mode. */
export function TripPdfTemplate({ trip }: Props) {
  return (
    <div
      id="trip-pdf-template"
      style={{
        width: 794,
        background: '#ffffff',
        color: '#111827',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: '40px 48px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32, borderBottom: '2px solid #6366f1', paddingBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          Trip Itinerary • nomaaad
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 6 }}>{trip.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
          <span>📍</span>
          <span>{trip.destination}</span>
          {trip.startDate && trip.endDate && (
            <>
              <span style={{ margin: '0 4px' }}>·</span>
              <span>{trip.startDate} → {trip.endDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Days */}
      {trip.days.map((day) => (
        <div key={day.id} style={{ marginBottom: 32 }}>
          {/* Day header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f5f3ff', borderRadius: 8, padding: '10px 16px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}
            >
              {day.dayNumber}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Day {day.dayNumber}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{day.title}</div>
            </div>
          </div>

          {/* Activities */}
          {day.activities.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', marginLeft: 16 }}>No activities planned.</p>
          ) : (
            <div style={{ paddingLeft: 16 }}>
              {day.activities.map((activity, i) => {
                const Icon = categoryIcons[activity.category] || Activity;
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex', gap: 12, marginBottom: 12,
                      borderLeft: '2px solid #e5e7eb', paddingLeft: 16, paddingBottom: 4,
                    }}
                  >
                    {/* Category dot */}
                    <div
                      style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#6366f1', flexShrink: 0, marginTop: 5,
                        marginLeft: -21,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{activity.name}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#6b7280', flexShrink: 0, marginLeft: 8 }}>
                          {activity.duration && (
                            <span>⏱ {Math.floor(activity.duration / 60)}h{activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ''}</span>
                          )}
                          {activity.rating && <span>⭐ {activity.rating}</span>}
                          {activity.price !== undefined && activity.price !== null && <span>💰 ${activity.price}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        <span style={{
                          display: 'inline-block', background: '#f3f4f6',
                          borderRadius: 4, padding: '1px 6px', marginRight: 6, fontSize: 11, textTransform: 'capitalize'
                        }}>
                          {activity.timeSlot}
                        </span>
                        <span style={{ textTransform: 'capitalize' }}>{activity.category}</span>
                        {activity.address && <span> · {activity.address}</span>}
                      </div>
                      {activity.description && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, lineHeight: 1.5 }}>
                          {activity.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 16, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        Generated by nomaaad · {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
