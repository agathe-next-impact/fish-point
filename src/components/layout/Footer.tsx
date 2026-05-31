import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Explorer',
    links: [
      { href: '/map', label: 'Carte' },
      { href: '/spots', label: 'Spots' },
      { href: '/explore', label: 'Par département' },
      { href: '/regulations', label: 'Réglementation' },
    ],
  },
  {
    title: 'Communauté',
    links: [
      { href: '/community', label: 'Feed' },
      { href: '/community/leaderboard', label: 'Classements' },
      { href: '/spots/new', label: 'Ajouter un spot' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '#', label: 'Mentions légales' },
      { href: '#', label: 'Politique de confidentialité' },
      { href: '#', label: 'CGU' },
      { href: '#', label: 'Contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#06262e] text-white/70">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <BrandLogo textClassName="text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Les meilleurs spots de pêche autorisés en France. Carte interactive, réglementation et
              conditions en temps réel.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.05em] text-white/45">{col.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/65 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/45">
          <p>&copy; {new Date().getFullYear()} FishSpot. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
