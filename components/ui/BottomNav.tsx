'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => ReactElement;
}

const studentNav: NavItem[] = [
  {
    href: '/app/student/dashboard',
    label: 'Dashboard',
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/app/student/today',
    label: 'Treino',
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/app/student/history',
    label: 'Histórico',
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200/50 lg:hidden z-40 safe-area-bottom">
      <div className="grid grid-cols-3 h-16">
        {studentNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-b-full" />
              )}
              
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon(isActive)}
              </div>
              <span className={`text-xs font-semibold transition-all ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
