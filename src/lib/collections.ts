/**
 * Collections de spots enregistrés — dérivées du champ `listName` du modèle
 * `Favorite`. Il n'existe PAS de table `Collection` : une « collection » est
 * simplement l'ensemble des favoris partageant la même valeur `listName`.
 *
 * Conséquence : créer une collection = poster un favori avec une nouvelle valeur
 * `listName` ; la lister = regrouper les `listName` distincts présents. Aucune
 * migration, aucun endpoint dédié.
 *
 * Ce module est volontairement pur (zéro dépendance React/serveur) pour être
 * partageable client ↔ route handler et testable unitairement.
 */

/** Valeur technique de la collection par défaut (1-clic « Enregistrer »). */
export const DEFAULT_LIST_NAME = 'default';

/** Libellé produit (FR) de la collection par défaut. */
export const DEFAULT_LIST_LABEL = 'Favoris';

/** Longueur max d'un nom de collection (cohérente avec le schéma Zod de la route). */
export const MAX_LIST_NAME_LENGTH = 60;

/**
 * Collections proposées au moment d'enregistrer. La 1re (`default`) est le
 * comportement 1-clic actuel ; les autres sont des valeurs `listName` libres.
 * « Nouvelle collection… » n'est PAS dans cette liste : c'est une action de
 * saisie gérée par l'UI.
 */
export const SUGGESTED_COLLECTIONS: ReadonlyArray<{ listName: string; label: string }> = [
  { listName: DEFAULT_LIST_NAME, label: DEFAULT_LIST_LABEL },
  { listName: 'a-tester', label: 'À tester' },
  { listName: 'sortie-samedi', label: 'Sortie de samedi' },
];

/**
 * Normalise un nom de collection saisi par l'utilisateur.
 * Trim, espaces internes compactés, tronqué à {@link MAX_LIST_NAME_LENGTH}.
 * Retourne {@link DEFAULT_LIST_NAME} si la saisie est vide après nettoyage,
 * pour ne jamais produire une collection au nom aberrant ou vide.
 */
export function normalizeListName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_LIST_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : DEFAULT_LIST_NAME;
}

/**
 * Libellé affichable d'une collection à partir de sa valeur `listName`.
 * Mappe les valeurs suggérées sur leur label produit ; sinon renvoie le
 * `listName` tel quel (collection créée librement par l'utilisateur).
 */
export function listNameLabel(listName: string): string {
  const suggested = SUGGESTED_COLLECTIONS.find((c) => c.listName === listName);
  return suggested ? suggested.label : listName;
}

/** Une collection dérivée : sa clé `listName`, son libellé et son effectif. */
export interface DerivedCollection {
  listName: string;
  label: string;
  count: number;
}

/**
 * Dérive les collections distinctes à partir des `listName` d'une liste de
 * favoris. Ordre stable et lisible : la collection par défaut (« Favoris »)
 * d'abord si présente, puis les autres triées par effectif décroissant, départage
 * alphabétique sur le libellé. Les entrées sans `listName` retombent sur le défaut.
 */
export function deriveCollections(
  favorites: ReadonlyArray<{ listName?: string | null }>,
): DerivedCollection[] {
  const counts = new Map<string, number>();
  for (const fav of favorites) {
    const key = fav.listName && fav.listName.length > 0 ? fav.listName : DEFAULT_LIST_NAME;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([listName, count]) => ({ listName, label: listNameLabel(listName), count }))
    .sort((a, b) => {
      if (a.listName === DEFAULT_LIST_NAME) return -1;
      if (b.listName === DEFAULT_LIST_NAME) return 1;
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label, 'fr');
    });
}
