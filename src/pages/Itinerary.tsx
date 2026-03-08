import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();
  const plan = location.state?.plan;

  useEffect(() => {
    if (!plan) navigate('/journey', { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate('/journey')} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">{plan.title}</h1>
        <p className="text-muted-foreground text-sm mb-6">{plan.summary}</p>
        <p className="text-xs text-muted-foreground mb-8 font-mono">{plan.budget_summary}</p>

        {/* Placeholder — Phase 3 will build the full timeline here */}
        <div className="space-y-4">
          {plan.activities?.map((activity: any, i: number) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-primary">Day {activity.day} · {activity.time}</span>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{activity.category}</span>
                <span className="ml-auto text-xs text-muted-foreground">{activity.cost}</span>
              </div>
              <h3 className="font-semibold text-foreground">{activity.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">📍 {activity.location}</p>
            </div>
          ))}
        </div>

        {plan.tips?.length > 0 && (
          <div className="mt-8 bg-card border border-border/50 rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-2">💡 Tips</h3>
            <ul className="space-y-1">
              {plan.tips.map((tip: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
