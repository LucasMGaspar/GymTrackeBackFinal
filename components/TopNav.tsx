'use client';

import { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface TopNavProps {
  profile: Profile;
  title: string;
}

export function TopNav({ profile, title }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isStudent = profile.role === 'student';
  const isPersonal = profile.role === 'personal';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{profile.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition"
          >
            Sair
          </button>
        </div>

        {/* Student Navigation */}
        {isStudent && (
          <div className="flex gap-2 px-4 pb-3">
            <Link
              href="/app/student/today"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/app/student/today'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏋️ Treino do Dia
            </Link>
            <Link
              href="/app/student/history"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/app/student/history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Histórico
            </Link>
          </div>
        )}

        {/* Personal Navigation */}
        {isPersonal && pathname.startsWith('/app/personal') && !pathname.includes('/students/') && (
          <div className="flex gap-2 px-4 pb-3">
            <Link
              href="/app/personal"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/app/personal'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏠 Dashboard
            </Link>
            <Link
              href="/app/personal/students"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/app/personal/students'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              👥 Alunos
            </Link>
            <Link
              href="/app/personal/exercises"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/app/personal/exercises'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              💪 Exercícios
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
