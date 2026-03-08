import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) {
    const pendingQuery = sessionStorage.getItem('nomaaad_pending_query');
    return <Navigate to={pendingQuery ? `/explore?q=${encodeURIComponent(pendingQuery)}` : '/explore'} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast({ title: t('auth.signInFailed'), description: error.message, variant: 'destructive' });
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    if (error) toast({ title: t('auth.signUpFailed'), description: error.message, variant: 'destructive' });
    else toast({ title: t('auth.checkEmail'), description: t('auth.confirmLink') });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-accent/[0.03] blur-[80px]" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm relative"
      >
        <Card className="rounded-[1.75rem] border-border/30 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl overflow-hidden mb-3 shadow-xl"
            >
              <Compass className="h-10 w-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-sans">{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-5 h-11 rounded-full border-border/40 hover:bg-secondary/50"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                if (error) toast({ title: 'Google sign-in failed', description: (error as Error).message, variant: 'destructive' });
              }}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('auth.google')}
            </Button>

            <div className="relative mb-5">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">{t('auth.or')}</span>
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-5 rounded-full h-10">
                <TabsTrigger value="signin" className="rounded-full">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm font-medium">{t('auth.email')}</Label>
                    <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm font-medium">{t('auth.password')}</Label>
                    <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl h-11" />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={isSubmitting}>
                    {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium">{t('auth.email')}</Label>
                    <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium">{t('auth.password')}</Label>
                    <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="rounded-xl h-11" />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={isSubmitting}>
                    {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
