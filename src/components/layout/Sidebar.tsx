'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, List, PlusCircle, BookOpen, Users, Award, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/map', label: 'Carte', icon: MapPin },
  { href: '/spots', label: 'Spots', icon: List },
  { href: '/spots/new', label: 'Ajouter', icon: PlusCircle },
  { href: '/catches', label: 'Prises', icon: BarChart3 },
  { href: '/regulations', label: 'Réglementation', icon: BookOpen },
  { href: '/community', label: 'Communauté', icon: Users },
  { href: '/community/leaderboard', label: 'Classement', icon: Award },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-background h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/profile/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
      </div>
    </aside>
  );
}
