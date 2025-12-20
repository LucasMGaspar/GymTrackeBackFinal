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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="glass border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">{profile.name}</p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile.role === 'student' ? 'Aluno' : 'Personal Trainer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Student Navigation */}
        {isStudent && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <Link
              href="/app/student/dashboard"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/student/dashboard'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/app/student/today"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/student/today'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Treino do Dia
            </Link>
            <Link
              href="/app/student/history"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/student/history'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico
            </Link>
          </div>
        )}

        {/* Personal Navigation */}
        {isPersonal && pathname.startsWith('/app/personal') && !pathname.includes('/students/') && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <Link
              href="/app/personal"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/personal'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/app/personal/students"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/personal/students'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Alunos
            </Link>
            <Link
              href="/app/personal/exercises"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                pathname === '/app/personal/exercises'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Exercícios
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
