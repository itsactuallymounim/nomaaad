import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { ArrowLeft, Star, RefreshCw, Store, CheckCircle2, MapPin } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';

const CATEGORIES = ['restaurant', 'cafe', 'coworking', 'hotel', 'activity', 'shop', 'wellness', 'other'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'MAD', 'THB', 'COP'];
const PRICE_LEVELS = [1, 2, 3, 4];

interface GoogleReview {
  author: string;
  avatar: string | null;
  rating: number | null;
  text: string;
  relative_time: string;
  published_at: string | null;
}

interface GoogleMatch {
  place_id: string | null;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  review_count: number | null;
  price_level: number | null;
  website: string | null;
  phone: string | null;
  reviews: GoogleReview[];
}

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  category: z.string().min(1),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required').max(120),
  phone: z.string().trim().max(60).optional().or(z.literal('')),
  website: z.string().trim().url('Enter a valid URL').max(300).optional().or(z.literal('')),
  contact_email: z.string().trim().email('Enter a valid email').max(255).optional().or(z.literal('')),
  image_url: z.string().trim().url('Enter a valid image URL').max(500).optional().or(z.literal('')),
  price_min: z.string().optional(),
  price_max: z.string().optional(),
  currency: z.string().min(1),
  price_level: z.string().min(1),
});

export default function BusinessSignup() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', category: 'restaurant', description: '', address: '', city: '',
    phone: '', website: '', contact_email: '', image_url: '',
    price_min: '', price_max: '', currency: 'EUR', price_level: '2',
  });
  const [match, setMatch] = useState<GoogleMatch | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const syncReviews = async () => {
    if (form.name.trim().length < 2) {
      toast({ title: t('business.needName'), variant: 'destructive' });
      return;
    }
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews', {
        body: { name: form.name, address: form.address, city: form.city },
      });
      if (error) throw error;
      if (!data?.match) {
        setMatch(null);
        toast({ title: t('business.noMatch'), description: t('business.noMatchDesc') });
        return;
      }
      const m = data.match as GoogleMatch;
      setMatch(m);
      setForm((prev) => ({
        ...prev,
        address: prev.address || m.address || '',
        website: prev.website || m.website || '',
        phone: prev.phone || m.phone || '',
        price_level: m.price_level ? String(m.price_level) : prev.price_level,
      }));
      toast({
        title: t('business.syncDone'),
        description: `${m.name ?? form.name} · ${m.rating ?? '—'}★ · ${m.review_count ?? 0} ${t('business.reviews')}`,
      });
    } catch (e) {
      toast({
        title: t('business.syncFailed'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({ title: first?.message ?? t('business.invalid'), variant: 'destructive' });
      return;
    }
    const min = form.price_min ? Number(form.price_min) : null;
    const max = form.price_max ? Number(form.price_max) : null;
    if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) {
      toast({ title: t('business.invalidPrice'), variant: 'destructive' });
      return;
    }
    if (min !== null && max !== null && max < min) {
      toast({ title: t('business.invalidRange'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('businesses').insert({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      address: (form.address || match?.address || '').trim(),
      city: form.city.trim(),
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      contact_email: form.contact_email.trim() || null,
      image_url: form.image_url.trim() || null,
      price_min: min,
      price_max: max,
      currency: form.currency,
      price_level: Number(form.price_level),
      lat: match?.lat ?? null,
      lng: match?.lng ?? null,
      google_place_id: match?.place_id ?? null,
      google_name: match?.name ?? null,
      google_address: match?.address ?? null,
      google_rating: match?.rating ?? null,
      google_review_count: match?.review_count ?? null,
      google_reviews: match?.reviews ?? [],
      google_synced_at: match ? new Date().toISOString() : null,
    });
    setSaving(false);

    if (error) {
      toast({ title: t('business.saveFailed'), description: error.message, variant: 'destructive' });
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-3xl max-w-md text-center border-border/50 shadow-sm">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">{t('business.successTitle')}</h1>
                <p className="text-sm text-muted-foreground">{t('business.successDesc')}</p>
                <div className="flex gap-2 justify-center pt-2">
                  <Button variant="outline" className="rounded-full" onClick={() => { setDone(false); setMatch(null); setForm({ ...form, name: '', description: '', address: '', image_url: '', price_min: '', price_max: '' }); }}>
                    {t('business.addAnother')}
                  </Button>
                  <Button className="rounded-full" onClick={() => navigate('/')}>{t('business.backHome')}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" />{t('business.back')}</Link>
        </Button>

        <div className="space-y-2">
          <Badge variant="secondary" className="rounded-full">
            <Store className="h-3.5 w-3.5 mr-1.5" />{t('business.badge')}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{t('business.title')}</h1>
          <p className="text-muted-foreground">{t('business.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold">{t('business.sectionBasics')}</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-name">{t('business.name')} *</Label>
                  <Input id="biz-name" value={form.name} maxLength={120} required
                    onChange={(e) => set('name')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('business.category')}</Label>
                  <Select value={form.category} onValueChange={set('category')}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{t(`business.cat.${c}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biz-city">{t('business.city')} *</Label>
                  <Input id="biz-city" value={form.city} maxLength={120} required
                    onChange={(e) => set('city')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biz-address">{t('business.address')}</Label>
                  <Input id="biz-address" value={form.address} maxLength={300}
                    onChange={(e) => set('address')(e.target.value)} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-desc">{t('business.description')}</Label>
                <Textarea id="biz-desc" value={form.description} maxLength={2000} rows={3}
                  onChange={(e) => set('description')(e.target.value)} className="rounded-2xl" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-phone">{t('business.phone')}</Label>
                  <Input id="biz-phone" value={form.phone} maxLength={60}
                    onChange={(e) => set('phone')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biz-site">{t('business.website')}</Label>
                  <Input id="biz-site" type="url" placeholder="https://" value={form.website} maxLength={300}
                    onChange={(e) => set('website')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biz-email">{t('business.email')}</Label>
                  <Input id="biz-email" type="email" value={form.contact_email} maxLength={255}
                    onChange={(e) => set('contact_email')(e.target.value)} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-img">{t('business.imageUrl')}</Label>
                <Input id="biz-img" type="url" placeholder="https://" value={form.image_url} maxLength={500}
                  onChange={(e) => set('image_url')(e.target.value)} className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold">{t('business.sectionPricing')}</h2>
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-min">{t('business.priceMin')}</Label>
                  <Input id="biz-min" type="number" min={0} step="0.01" value={form.price_min}
                    onChange={(e) => set('price_min')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biz-max">{t('business.priceMax')}</Label>
                  <Input id="biz-max" type="number" min={0} step="0.01" value={form.price_max}
                    onChange={(e) => set('price_max')(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('business.currency')}</Label>
                  <Select value={form.currency} onValueChange={set('currency')}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('business.priceLevel')}</Label>
                  <Select value={form.price_level} onValueChange={set('price_level')}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {PRICE_LEVELS.map((l) => (
                        <SelectItem key={l} value={String(l)}>{'$'.repeat(l)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{t('business.sectionReviews')}</h2>
                  <p className="text-sm text-muted-foreground">{t('business.reviewsHint')}</p>
                </div>
                <Button type="button" variant="outline" className="rounded-full shrink-0"
                  onClick={syncReviews} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? t('business.syncing') : t('business.sync')}
                </Button>
              </div>

              {match && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-muted/50 p-4 space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      {match.name ?? form.name}
                    </div>
                    {match.address && <p className="text-xs text-muted-foreground">{match.address}</p>}
                    <div className="flex items-center gap-1.5 text-sm pt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{match.rating ?? '—'}</span>
                      <span className="text-muted-foreground">
                        · {match.review_count ?? 0} {t('business.reviews')}
                      </span>
                    </div>
                  </div>

                  {match.reviews.map((r, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{r.author}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {r.rating ?? '—'} · {r.relative_time}
                        </span>
                      </div>
                      {r.text && <p className="text-sm text-muted-foreground line-clamp-4">{r.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="rounded-full w-full" disabled={saving}>
            {saving ? t('business.submitting') : t('business.submit')}
          </Button>
        </form>
      </main>
    </div>
  );
}
