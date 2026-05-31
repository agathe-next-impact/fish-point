'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Search, Bell, Menu, User, LogOut, Settings, BarChart3, MapPinned, AlertTriangle, Users, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/map', label: 'Carte' },
  { href: '/spots', label: 'Spots' },
  { href: '/explore', label: 'Par département' },
  { href: '/regulations', label: 'Réglementation' },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-7">
          <BrandLogo />

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-[9px] px-3 py-1.5 text-sm font-semibold transition-colors',
                  isActive(link.href)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href="/spots?focus=search">
            <Button variant="ghost" size="icon" aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          <ThemeToggle />

          {session?.user ? (
            <>
              <Link href="/catches">
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Menu utilisateur">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/catches">Mes prises</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-spots">
                      <MapPinned className="h-4 w-4 mr-2" />
                      Mes spots privés
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/alerts">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Alertes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/community">
                      <Users className="h-4 w-4 mr-2" />
                      Communauté
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/fishing-cards">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Carte de pêche
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Connexion</Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Inscription</Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-card">
          <nav className="flex flex-col p-4 gap-1">
            {[...NAV_LINKS, { href: '/community', label: 'Communauté' }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive(link.href)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-foreground hover:bg-secondary/50',
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
