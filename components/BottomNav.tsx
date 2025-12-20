'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, User, Calendar, Users, Settings } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface BottomNavProps {
  role: 'student' | 'personal';
}

const studentNavItems: NavItem[] = [
  { href: '/app/student/today', label: 'Hoje', icon: Calendar },
  { href: '/app/student/history', label: 'Histórico', icon: Dumbbell },
  { href: '/app/student/profile', label: 'Perfil', icon: User },
];

const personalNavItems: NavItem[] = [
  { href: '/app/personal', label: 'Início', icon: Home },
  { href: '/app/personal/students', label: 'Alunos', icon: Users },
  { href: '/app/personal/exercises', label: 'Exercícios', icon: Dumbbell },
  { href: '/app/personal/settings', label: 'Config', icon: Settings },
];

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = role === 'student' ? studentNavItems : personalNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-primary-100' : ''
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
