import { createClient } from '@/lib/supabase/server';
import { ExercisesClient } from './ExercisesClient';
import type { Exercise } from '@/lib/types';

export default async function ExercisesPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('personal_id', user.id)
    .order('name');

  return (
    <ExercisesClient 
      initialExercises={(exercises || []) as Exercise[]}
      personalId={user.id}
    />
  );
}
