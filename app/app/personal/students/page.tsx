import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search,
  UserPlus,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

async function getStudents(personalId: string) {
  const supabase = await createClient();
  
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('personal_id', personalId)
    .order('created_at', { ascending: false });

  return students || [];
}

export default async function StudentsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const students = await getStudents(user.id);

  const statusConfig = {
    active: { label: 'Ativo', icon: CheckCircle2, color: 'success' },
    invited: { label: 'Convidado', icon: Clock, color: 'warning' },
    inactive: { label: 'Inativo', icon: XCircle, color: 'gray' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-500" />
            Meus Alunos
          </h1>
          <p className="text-gray-500 mt-1">
            {students.length} {students.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
          </p>
        </div>
        
        <Link
          href="/app/personal/students/new"
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Aluno</span>
        </Link>
      </div>

      {/* Search */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            className="input pl-12"
          />
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="Nenhum aluno cadastrado"
          description="Adicione seu primeiro aluno para começar a criar treinos personalizados."
          action={{
            label: 'Adicionar Aluno',
            onClick: () => {},
          }}
        />
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const status = statusConfig[student.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            
            return (
              <Link
                key={student.id}
                href={`/app/personal/students/${student.id}`}
                className="card card-hover flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl gradient-hero-alt flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {student.student_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {student.student_name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5" />
                    {student.student_email}
                  </p>
                </div>

                {/* Status Badge */}
                <div className={`badge badge-${status.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>

                {/* Actions */}
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
