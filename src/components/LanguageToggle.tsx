import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { t, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      aria-label="Toggle language"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 ${className}`}
    >
      <Globe className="h-3.5 w-3.5" />
      {t('lang.toggle')}
    </button>
  );
}
