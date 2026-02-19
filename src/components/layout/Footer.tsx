import Link from 'next/link';
import { Fish } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Fish className="h-5 w-5 text-primary" />
              <span className="font-bold">FishSpot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Les meilleurs spots de pêche autorisés en France.
              Carte interactive, réglementation et conditions en temps réel.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Explorer</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/map" className="hover:text-foreground transition-colors">Carte</Link></li>
              <li><Link href="/spots" className="hover:text-foreground transition-colors">Spots</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Par département</Link></li>
              <li><Link href="/regulations" className="hover:text-foreground transition-colors">Réglementation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Communauté</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/community" className="hover:text-foreground transition-colors">Feed</Link></li>
              <li><Link href="/community/leaderboard" className="hover:text-foreground transition-colors">Classements</Link></li>
              <li><Link href="/spots/new" className="hover:text-foreground transition-colors">Ajouter un spot</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Mentions légales</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">CGU</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FishSpot. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
