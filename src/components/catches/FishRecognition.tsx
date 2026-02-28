'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Check, Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FishSuggestion {
  speciesId: string;
  name: string;
  scientificName: string | null;
  category: string | null;
  imageUrl: string | null;
  minLegalSize: number | null;
  confidence: number;
}

interface FishRecognitionProps {
  onSpeciesSelect?: (speciesId: string, speciesName: string) => void;
  isPremium?: boolean;
}

export function FishRecognition({ onSpeciesSelect, isPremium = false }: FishRecognitionProps) {
  const [suggestions, setSuggestions] = useState<FishSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format accepté : JPEG, PNG ou WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Taille maximum : 5 Mo');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setSuggestions([]);
    setSelectedId(null);

    try {
      // Upload to R2
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Échec de l\'upload');

      const { url } = await uploadRes.json();

      // Identify fish
      const identifyRes = await fetch('/api/identify-fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!identifyRes.ok) {
        const data = await identifyRes.json();
        throw new Error(data.error || 'Erreur d\'identification');
      }

      const { suggestions: results } = await identifyRes.json();
      setSuggestions(results || []);

      if (!results || results.length === 0) {
        setError('Aucune espèce reconnue. Essayez avec une photo plus nette.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelect = (suggestion: FishSuggestion) => {
    setSelectedId(suggestion.speciesId);
    onSpeciesSelect?.(suggestion.speciesId, suggestion.name);
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Reconnaissance d&apos;espèce
            <Badge variant="warning" className="text-[10px]">Premium</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Identifiez les espèces par photo avec un abonnement Premium.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Reconnaissance d&apos;espèce
          <Badge variant="warning" className="text-[10px]">Premium</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {suggestions.length === 0 && !isAnalyzing && (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Prenez une photo de votre poisson pour identifier l&apos;espèce
            </p>
            <Button variant="outline" size="sm" type="button">
              <Camera className="h-4 w-4 mr-2" />
              Prendre une photo
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analyse en cours...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sélectionnez l&apos;espèce identifiée :</p>
            {suggestions.map((s) => (
              <button
                key={s.speciesId}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selectedId === s.speciesId
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <Fish className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.scientificName && (
                    <p className="text-xs text-muted-foreground italic">{s.scientificName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{s.confidence}%</span>
                  {selectedId === s.speciesId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setSuggestions([]);
                setSelectedId(null);
                setError(null);
              }}
              className="w-full text-xs"
            >
              Nouvelle photo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
