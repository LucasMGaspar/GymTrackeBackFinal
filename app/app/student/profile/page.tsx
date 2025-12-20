import { createClient } from '@/lib/supabase/server';
import { 
  User, 
  Mail,
  Calendar,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  Dumbbell,
  TrendingUp
} from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get stats
  const { count: totalWorkouts } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_user_id', user.id)
    .eq('status', 'done');

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'N/A';

  const stats = [
    { icon: Dumbbell, label: 'Treinos Completos', value: totalWorkouts || 0 },
    { icon: TrendingUp, label: 'Sequência Atual', value: '0 dias' },
    { icon: Award, label: 'Conquistas', value: '0' },
  ];

  const menuItems = [
    { icon: User, label: 'Editar Perfil', href: '/app/student/profile/edit' },
    { icon: Settings, label: 'Configurações', href: '/app/student/profile/settings' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="card text-center">
        <div className="w-24 h-24 rounded-3xl gradient-hero-alt flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
          <span className="text-white font-bold text-4xl">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
        <p className="text-gray-500 flex items-center justify-center gap-2 mt-1">
          <Mail className="w-4 h-4" />
          {user.email}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Membro desde {memberSince}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center py-4">
            <stat.icon className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="card p-0 overflow-hidden divide-y divide-gray-100">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="flex-1 font-medium text-gray-900">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </a>
        ))}
      </div>

      {/* Logout */}
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="w-full card flex items-center gap-4 text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Sair da conta</span>
        </button>
      </form>

      {/* Version */}
      <p className="text-center text-sm text-gray-400">
        FitPro v1.0.0
      </p>
    </div>
  );
}
