import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePremium() {
  const { user } = useAuth();

  const { data: isPremium = false, isLoading } = useQuery({
    queryKey: ['premium', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-payment');
      if (error) throw error;
      return data?.isPremium ?? false;
    },
    enabled: !!user,
    staleTime: 60_000,
    retry: 1,
  });

  const startCheckout = async () => {
    const { data, error } = await supabase.functions.invoke('create-payment');
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  return { isPremium, isLoading, startCheckout };
}
