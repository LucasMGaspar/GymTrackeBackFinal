import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  Dumbbell, 
  Plus, 
  Search,
  MoreVertical,
  Target
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

async function getExercises(personalId: string) {
  const supabase = await createClient();
  
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('personal_id', personalId)
    .order('muscle_group', { ascending: true })
    .order('name', { ascending: true });

  return exercises || [];
}

export default async function ExercisesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const exercises = await getExercises(user.id);

  // Group by muscle group
  type ExerciseType = typeof exercises[number];
  const groupedExercises = exercises.reduce<Record<string, ExerciseType[]>>((acc, exercise) => {
    const group = exercise.muscle_group || 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(exercise);
    return acc;
  }, {});

  const muscleGroupColors: Record<string, string> = {
    'Peito': 'bg-red-100 text-red-700',
    'Costas': 'bg-blue-100 text-blue-700',
    'Ombros': 'bg-purple-100 text-purple-700',
    'Bíceps': 'bg-orange-100 text-orange-700',
    'Tríceps': 'bg-amber-100 text-amber-700',
    'Pernas': 'bg-green-100 text-green-700',
    'Glúteos': 'bg-pink-100 text-pink-700',
    'Abdômen': 'bg-cyan-100 text-cyan-700',
    'Outros': 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-primary-500" />
            Exercícios
          </h1>
          <p className="text-gray-500 mt-1">
            {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'} na biblioteca
          </p>
        </div>
        
        <Link
          href="/app/personal/exercises/new"
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Exercício</span>
        </Link>
      </div>

      {/* Search */}
      {exercises.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            className="input pl-12"
          />
        </div>
      )}

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="Nenhum exercício cadastrado"
          description="Adicione exercícios à sua biblioteca para criar treinos personalizados."
          action={{
            label: 'Adicionar Exercício',
            onClick: () => {},
          }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([group, groupExercises]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {group}
                </h2>
                <span className="text-xs text-gray-400">({groupExercises.length})</span>
              </div>
              
              <div className="space-y-2">
                {groupExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="card card-hover flex items-center gap-4 py-4"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      muscleGroupColors[group] || muscleGroupColors['Outros']
                    }`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {exercise.name}
                      </h3>
                      {exercise.notes && (
                        <p className="text-sm text-gray-500 truncate">
                          {exercise.notes}
                        </p>
                      )}
                    </div>

                    {/* Badge */}
                    <span className={`badge text-xs ${muscleGroupColors[group] || muscleGroupColors['Outros']}`}>
                      {group}
                    </span>

                    {/* Actions */}
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
