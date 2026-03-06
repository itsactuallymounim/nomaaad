import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Trip } from '@/types/trip';

interface WhatsAppShareProps {
  trip: Trip;
  className?: string;
}

export function WhatsAppShareButton({ trip, className }: WhatsAppShareProps) {
  const handleShare = () => {
    const days = trip.days.map(d => {
      const activities = d.activities.map(a => `  • ${a.name}${a.address ? ` — ${a.address}` : ''}`).join('\n');
      return `📅 Day ${d.dayNumber}: ${d.title}\n${activities}`;
    }).join('\n\n');

    const text = `✈️ ${trip.name} — ${trip.destination}\n\n${days}\n\nPlanned with nomaaad 🧭`;

    if (navigator.share) {
      navigator.share({ title: trip.name, text }).catch(() => {
        // Fallback to WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`rounded-xl gap-1.5 ${className || ''}`}
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>
  );
}
