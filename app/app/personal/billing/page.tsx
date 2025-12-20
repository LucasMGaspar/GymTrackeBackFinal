import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BillingClient } from './BillingClient';

export default async function BillingPage() {
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

  // Fetch current subscription directly from database
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('personal_id', user.id)
    .in('status', ['trialing', 'active', 'past_due', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = subscriptionData || null;

  return (
    <BillingClient 
      subscription={subscription}
      userEmail={user.email || ''}
    />
  );
}

