'use client';

import { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dumbbell, LogOut, User, ChevronDown } from 'lucide-react';

interface TopNavProps {
  profile: Profile;
  title: string;
}

export function TopNav({ profile, title }: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="gradient-hero-alt p-2 rounded-xl">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">FitPro</span>
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile.role === 'student' ? 'Aluno' : 'Personal'}</p>
                </div>
                <div className="gradient-hero-alt w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{getInitials(profile.name)}</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft-xl border border-gray-100 py-2 z-50 animate-slide-down">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{profile.email || ''}</p>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {loggingOut ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span>{loggingOut ? 'Saindo...' : 'Sair da conta'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
