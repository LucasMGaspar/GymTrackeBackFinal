'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
  profile: Profile;
  children: React.ReactNode;
}

export function AppLayout({ profile, children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isStudent = profile.role === 'student';
  const isPersonal = profile.role === 'personal';

  const studentNav = [
    { href: '/app/student/dashboard', label: 'Dashboard', icon: 'chart' },
    { href: '/app/student/today', label: 'Treino', icon: 'workout' },
    { href: '/app/student/history', label: 'Histórico', icon: 'history' },
  ];

  const personalNav = [
    { href: '/app/personal', label: 'Dashboard', icon: 'home' },
    { href: '/app/personal/students', label: 'Alunos', icon: 'users' },
    { href: '/app/personal/exercises', label: 'Exercícios', icon: 'workout' },
  ];

  const navigation = isStudent ? studentNav : personalNav;

  const getIcon = (icon: string, isActive: boolean) => {
    const strokeWidth = isActive ? 2.5 : 2;
    const className = "w-5 h-5";
    
    switch (icon) {
      case 'chart':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        );
      case 'workout':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        );
      case 'history':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'home':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        );
      case 'users':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        );
      default:
        return null;
    }
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
    <div className="min-h-screen gradient-hero">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-dark-200/60 transform transition-transform duration-300 ease-smooth lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-dark-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-dark-900">FitCoach</span>
                <span className="text-lg font-bold text-primary-500">Pro</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 text-dark-400 hover:text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Card */}
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 border border-dark-100">
              <div className="avatar avatar-md">
                {getInitials(profile.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-900 truncate">{profile.name}</p>
                <p className="text-xs text-dark-500 capitalize">
                  {isStudent ? 'Aluno' : 'Personal Trainer'}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-success-500 ring-2 ring-success-500/20" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
            <p className="px-3 pt-2 pb-3 text-2xs font-semibold text-dark-400 uppercase tracking-wider">
              Menu Principal
            </p>
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/app/personal' && item.href !== '/app/student/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'text-dark-600 hover:text-dark-900 hover:bg-dark-100'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {getIcon(item.icon, isActive)}
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-dark-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-dark-500 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-dark-200/50">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-dark-500 hover:text-dark-700 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="font-bold text-dark-900">FitCoach<span className="text-primary-500">Pro</span></span>
            </div>
            
            <div className="avatar avatar-sm text-xs">
              {getInitials(profile.name)}
            </div>
          </div>
        </header>

        {/* Bottom navigation for mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-dark-200/50 safe-area-bottom">
          <div className="grid grid-cols-3 h-16">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/app/personal' && item.href !== '/app/student/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary-500' : 'text-dark-400'
                  }`}
                >
                  <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                    {getIcon(item.icon, isActive)}
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <span className={`text-2xs font-semibold ${isActive ? 'text-primary-600' : 'text-dark-400'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Page content */}
        <main className="p-4 pb-24 lg:pb-8 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
