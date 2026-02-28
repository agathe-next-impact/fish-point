'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { MapPin, Search, Bell, Menu, User, LogOut, Settings, Fish, BarChart3, MapPinned, AlertTriangle, Users, CreditCard } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Fish className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold hidden sm:inline-block">FishSpot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/map"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="h-4 w-4 inline mr-1" />
              Carte
            </Link>
            <Link
              href="/spots"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Spots
            </Link>
            <Link
              href="/explore"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Communauté
            </Link>
            <Link
              href="/regulations"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Réglementation
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
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
                    <Link href="/community/groups">
                      <Users className="h-4 w-4 mr-2" />
                      Mes groupes
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
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            <Link href="/map" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
              <MapPin className="h-4 w-4" /> Carte
            </Link>
            <Link href="/spots" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
              Spots
            </Link>
            <Link href="/explore" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
              Explorer
            </Link>
            <Link href="/community" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
              Communauté
            </Link>
            <Link href="/regulations" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
              Réglementation
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
