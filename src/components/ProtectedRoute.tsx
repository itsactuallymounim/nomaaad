import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Compass } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

function FullScreenLoader() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
        <Compass className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user) return <Navigate to="/auth" replace />;

  if (user && profileLoading) return <FullScreenLoader />;

  // Redirect to onboarding if not completed — remember where the user was headed
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/onboarding" replace state={{ from }} />;
  }

  return <>{children}</>;
}
