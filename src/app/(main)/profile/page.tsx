'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings, Fish, MapPinned, CreditCard, Bell, WifiOff, ChevronRight, type LucideIcon } from 'lucide-react';
import { UserAvatar } from '@/components/community/UserAvatar';
import { Button } from '@/components/ui/button';

interface SettingsRow {
  icon: LucideIcon;
  label: string;
  href: string;
  value?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const year = new Date().getFullYear();

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-fs-muted">Connectez-vous pour accéder à votre profil.</p>
        <Link href="/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  const stats = [
    { label: 'Prises', value: '0' },
    { label: 'Spots', value: '0' },
    { label: 'Points', value: '0' },
  ];

  const rows: SettingsRow[] = [
    { icon: Fish, label: 'Mes prises', href: '/catches' },
    { icon: MapPinned, label: 'Mes spots', href: '/my-spots' },
    { icon: CreditCard, label: 'Carte de pêche', href: '/profile/fishing-cards', value: `Valide ${year}` },
    { icon: Bell, label: 'Notifications', href: '/profile/settings' },
    { icon: WifiOff, label: 'Mode hors-ligne', href: '/profile/settings', value: 'PWA' },
  ];

  return (
    <div className="mx-auto max-w-2xl pb-6">
      {/* dark gradient header */}
      <div
        className="relative rounded-b-[26px] px-6 pb-8 pt-10 text-white"
        style={{ background: 'linear-gradient(160deg,#0c4350,#08303a)' }}
      >
        <Link href="/profile/settings" className="absolute right-5 top-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25">
            <Settings className="h-4 w-4" />
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <UserAvatar name={session.user.name || null} image={session.user.image || null} size="lg" />
          <div>
            <h1 className="fs-dsp text-2xl font-extrabold">{session.user.name}</h1>
            <p className="text-sm text-white/65">{session.user.email}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="fs-dsp text-xl font-extrabold text-aqua">{stat.value}</div>
              <div className="text-xs text-white/55">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* settings list */}
      <div className="mt-5 px-4">
        <div className="divide-y divide-line overflow-hidden rounded-fs-lg border border-line bg-card shadow-fs-sm">
          {rows.map((row) => (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-fs-sm bg-aqua-soft text-teal-deep">
                <row.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{row.label}</span>
              {row.value && <span className="text-xs text-fs-muted">{row.value}</span>}
              <ChevronRight className="h-4 w-4 text-fs-faint" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
