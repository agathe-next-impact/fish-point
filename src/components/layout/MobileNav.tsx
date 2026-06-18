'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen, Plus, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/spots', label: 'Explorer', icon: Compass },
  { href: '/catches', label: 'Prises', icon: BookOpen },
  { href: '/dashboard', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Profil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-card/85 backdrop-blur-xl lg:hidden safe-area-bottom">
      <div className="relative flex h-16 items-center justify-around px-2">
        {/* left two tabs */}
        {tabs.slice(0, 2).map((tab) => (
          <TabLink key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}

        {/* center FAB */}
        <Link
          href="/catches/new"
          aria-label="Nouvelle prise"
          className="flex flex-col items-center justify-center"
          style={{ transform: 'translateY(-22px)' }}
        >
          <span
            className="flex h-[54px] w-[54px] items-center justify-center rounded-[18px] text-white"
            style={{
              background: 'var(--fs-accent)',
              boxShadow: '0 8px 20px rgba(var(--fs-accent-glow), 0.4)',
            }}
          >
            <Plus className="h-7 w-7" strokeWidth={2.4} />
          </span>
        </Link>

        {/* right two tabs */}
        {tabs.slice(2).map((tab) => (
          <TabLink key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Compass;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} />
      <span>{label}</span>
    </Link>
  );
}
