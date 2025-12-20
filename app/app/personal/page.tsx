import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  Users, 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default async function PersonalDashboard() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get stats
  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('personal_id', user.id);

  const { count: exercisesCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('personal_id', user.id);

  const today = new Date().toISOString().split('T')[0];
  const { count: todayWorkouts } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('session_date', today);

  const quickActions = [
    {
      href: '/app/personal/students',
      icon: Users,
      title: 'Alunos',
      description: 'Gerenciar alunos e treinos',
      gradient: 'from-primary-500 to-primary-700',
    },
    {
      href: '/app/personal/exercises',
      icon: Dumbbell,
      title: 'Exercícios',
      description: 'Biblioteca de exercícios',
      gradient: 'from-accent-500 to-accent-700',
    },
  ];

  const stats = [
    { label: 'Alunos', value: studentsCount || 0, icon: Users, color: 'primary' },
    { label: 'Treinos Hoje', value: todayWorkouts || 0, icon: Calendar, color: 'success' },
    { label: 'Exercícios', value: exercisesCount || 0, icon: Dumbbell, color: 'accent' },
  ];

  const nextSteps = [
    { icon: Dumbbell, text: 'Adicione exercícios na sua biblioteca', done: (exercisesCount || 0) > 0 },
    { icon: Users, text: 'Cadastre seus alunos', done: (studentsCount || 0) > 0 },
    { icon: Calendar, text: 'Monte treinos por dia da semana', done: false },
    { icon: Target, text: 'Acompanhe o progresso de cada aluno', done: false },
  ];

  const showOnboarding = (exercisesCount || 0) === 0 || (studentsCount || 0) === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Bem-vindo de volta!</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Olá, {profile?.name?.split(' ')[0] || 'Personal'}! 
            </h1>
            <p className="text-gray-500">
              Gerencie seus alunos e acompanhe o progresso de cada um.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              stat.color === 'primary' ? 'bg-primary-100' :
              stat.color === 'success' ? 'bg-success-100' :
              'bg-accent-100'
            }`}>
              <stat.icon className={`w-6 h-6 ${
                stat.color === 'primary' ? 'text-primary-600' :
                stat.color === 'success' ? 'text-success-600' :
                'text-accent-600'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          Acesso Rápido
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="card card-hover group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${action.gradient} shadow-lg`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started (only show if incomplete) */}
      {showOnboarding && (
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">
                Primeiros Passos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure sua conta para começar a gerenciar seus alunos
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nextSteps.map((step, index) => (
                  <div key={index} className={`flex items-center gap-3 text-sm ${step.done ? 'opacity-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                      step.done ? 'bg-success-100' : 'bg-white'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-success-600" />
                      ) : (
                        <step.icon className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <span className={`text-gray-700 ${step.done ? 'line-through' : ''}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
