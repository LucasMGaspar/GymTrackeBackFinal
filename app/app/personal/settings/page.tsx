import { createClient } from '@/lib/supabase/server';
import { 
  Settings, 
  User, 
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Palette
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const settingsSections = [
    {
      title: 'Conta',
      items: [
        { icon: User, label: 'Editar Perfil', href: '/app/personal/settings/profile' },
        { icon: Bell, label: 'Notificações', href: '/app/personal/settings/notifications' },
        { icon: Palette, label: 'Aparência', href: '/app/personal/settings/appearance' },
      ],
    },
    {
      title: 'Suporte',
      items: [
        { icon: HelpCircle, label: 'Ajuda e FAQ', href: '/app/personal/settings/help' },
        { icon: Shield, label: 'Privacidade', href: '/app/personal/settings/privacy' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary-500" />
          Configurações
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-hero-alt flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="badge badge-primary mt-2">Personal Trainer</span>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            {section.title}
          </h3>
          <div className="card p-0 overflow-hidden divide-y divide-gray-100">
            {section.items.map((item) => (
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
        </div>
      ))}

      {/* Logout Button */}
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
