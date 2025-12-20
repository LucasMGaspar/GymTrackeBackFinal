import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PlansClient } from './PlansClient';

export default async function PlansPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'personal') {
    redirect('/app/student/dashboard');
  }

  // Fetch plans directly from database
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  // Fetch current subscription directly from database
  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('personal_id', user.id)
    .in('status', ['trialing', 'active', 'past_due', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PlansClient 
      plans={plans || []}
      currentSubscription={currentSubscription || null}
      userEmail={user.email || ''}
    />
  );
}

