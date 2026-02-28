'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, BookOpen, BarChart3, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/map', label: 'Carte', icon: MapPin },
  { href: '/catches', label: 'Prises', icon: BookOpen },
  { href: '/catches/new', label: 'Ajouter', icon: PlusCircle },
  { href: '/dashboard', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Profil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
