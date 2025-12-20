import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { BottomNav } from '@/components/BottomNav';

export default async function PersonalLayout({
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

  if (!profile || profile.role !== 'personal') {
    redirect('/app/student/today');
  }

  return (
    <div className="min-h-screen mesh-gradient pb-24">
      <TopNav profile={profile} title="FitPro" />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNav role="personal" />
    </div>
  );
}
