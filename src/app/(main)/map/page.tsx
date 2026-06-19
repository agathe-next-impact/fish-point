import { redirect } from 'next/navigation';

/**
 * `/map` est orphelin (hors navigation) depuis la fusion Carte + Liste dans l'Explorer.
 * L'Explorer (`/spots`) couvre désormais carte ET liste avec un état de filtres UNIQUE
 * (sous-étape 4). On redirige vers la surface canonique plutôt que de maintenir une
 * seconde carte autonome divergente.
 */
export default function MapPage() {
  redirect('/spots');
}
