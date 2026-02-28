'use client';

import { useState, useEffect } from 'react';
import { Leaf, Fish, Bug, Bird } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SpotBiodiversityProps {
  spotId: string;
}

interface INatObservation {
  id: number;
  speciesName: string;
  scientificName: string;
  observedOn: string;
}

interface GBIFSpecies {
  speciesName: string;
  scientificName: string;
  count: number;
  lastObserved: string | null;
}

interface BiodiversityData {
  inaturalist: {
    fish: INatObservation[];
    insects: INatObservation[];
    birds: INatObservation[];
    totalCount: number;
  };
  gbif: GBIFSpecies[];
}

export function SpotBiodiversity({ spotId }: SpotBiodiversityProps) {
  const [data, setData] = useState<BiodiversityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/spots/${spotId}/biodiversity`);
        if (!res.ok) return;
        const body = await res.json();
        setData(body.data);
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [spotId]);

  if (isLoading || !data) return null;

  const { inaturalist, gbif } = data;
  const hasData = inaturalist.totalCount > 0 || gbif.length > 0;
  if (!hasData) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-600" />
        Biodiversité autour du spot
      </h2>

      <div className="space-y-4">
        {/* iNaturalist observations */}
        {inaturalist.fish.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Fish className="h-3.5 w-3.5 text-blue-500" />
              Poissons observés
              <Badge variant="secondary" className="text-[10px] px-1.5">{inaturalist.fish.length}</Badge>
            </h3>
            <div className="flex flex-wrap gap-1">
              {inaturalist.fish.map((obs) => (
                <Badge key={obs.id} variant="outline" className="text-xs">
                  {obs.speciesName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {inaturalist.insects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Bug className="h-3.5 w-3.5 text-amber-600" />
              Insectes aquatiques
              <Badge variant="secondary" className="text-[10px] px-1.5">{inaturalist.insects.length}</Badge>
            </h3>
            <p className="text-xs text-muted-foreground mb-1.5">
              Présence d&apos;insectes = nourriture pour les poissons
            </p>
            <div className="flex flex-wrap gap-1">
              {inaturalist.insects.slice(0, 10).map((obs) => (
                <Badge key={obs.id} variant="outline" className="text-xs">
                  {obs.speciesName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {inaturalist.birds.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Bird className="h-3.5 w-3.5 text-sky-500" />
              Oiseaux piscivores
              <Badge variant="secondary" className="text-[10px] px-1.5">{inaturalist.birds.length}</Badge>
            </h3>
            <p className="text-xs text-muted-foreground mb-1.5">
              Hérons, martins-pêcheurs = indicateur de présence de poissons
            </p>
            <div className="flex flex-wrap gap-1">
              {inaturalist.birds.slice(0, 10).map((obs) => (
                <Badge key={obs.id} variant="outline" className="text-xs">
                  {obs.speciesName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* GBIF confirmed species */}
        {gbif.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Fish className="h-3.5 w-3.5 text-emerald-600" />
              Espèces confirmées (GBIF)
              <Badge variant="secondary" className="text-[10px] px-1.5">{gbif.length}</Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {gbif.slice(0, 12).map((sp) => (
                <div key={sp.scientificName} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/50">
                  <span className="truncate">{sp.speciesName}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{sp.count} obs.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Sources : iNaturalist (observations communautaires) · GBIF (données scientifiques)
        </p>
      </div>
    </section>
  );
}
