import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { BottomNav } from '@/components/ui/BottomNav';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!profile || profile.role !== 'student') {
    redirect('/app/personal');
  }

  return (
    <ToastProvider>
      <AppLayout profile={profile}>
        <div className="pb-20 lg:pb-0">{children}</div>
        <BottomNav />
      </AppLayout>
    </ToastProvider>
  );
}
