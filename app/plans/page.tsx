import { createClient } from '@/lib/supabase/server';
import { PlansPublicClient } from './PlansPublicClient';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createClient();
  
  // Fetch plans - public access, no auth required
  // Filter out free plan to keep cards organized
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .neq('slug', 'free') // Exclude free plan
    .order('price_cents', { ascending: true });

  if (error) {
    console.error('[Plans] Error fetching plans:', error);
  }

  return (
    <PlansPublicClient plans={plans || []} />
  );
}

