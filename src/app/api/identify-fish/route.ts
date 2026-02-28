import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

const identifySchema = z.object({
  imageUrl: z.string().url(),
});

// Generic terms to filter out from Vision API results
const GENERIC_TERMS = new Set([
  'fish', 'animal', 'water', 'nature', 'wildlife', 'organism', 'fin',
  'ray-finned fish', 'bony fish', 'vertebrate', 'aquatic', 'fishing',
  'catch', 'freshwater', 'saltwater', 'marine', 'river', 'lake',
  'pond', 'sport fishing', 'angling', 'poisson', 'pêche',
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Check premium (fish ID is a premium feature)
  if (!session.user.isPremium) {
    return NextResponse.json(
      { error: 'Fonctionnalité réservée aux membres premium' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { imageUrl } = identifySchema.parse(body);

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service d\'identification non configuré' },
        { status: 503 },
      );
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'WEB_DETECTION', maxResults: 15 },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      console.error('Vision API error:', visionResponse.status);
      return NextResponse.json(
        { error: 'Erreur du service d\'identification' },
        { status: 502 },
      );
    }

    const visionData = await visionResponse.json();
    const result = visionData.responses?.[0];

    if (!result) {
      return NextResponse.json({ suggestions: [] });
    }

    // Extract meaningful terms from labels and web entities
    const labels: string[] = (result.labelAnnotations || [])
      .map((l: { description: string }) => l.description.toLowerCase())
      .filter((l: string) => !GENERIC_TERMS.has(l));

    const webEntities: string[] = (result.webDetection?.webEntities || [])
      .filter((e: { description?: string; score?: number }) => e.description && (e.score || 0) > 0.3)
      .map((e: { description: string }) => e.description.toLowerCase())
      .filter((e: string) => !GENERIC_TERMS.has(e));

    const searchTerms = [...new Set([...labels, ...webEntities])];

    if (searchTerms.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Match against FishSpecies database
    const allSpecies = await prisma.fishSpecies.findMany({
      select: {
        id: true,
        name: true,
        scientificName: true,
        category: true,
        imageUrl: true,
        minLegalSize: true,
      },
    });

    // Score each species against detected terms
    const scored = allSpecies
      .map((species) => {
        let score = 0;
        const nameLower = species.name.toLowerCase();
        const sciNameLower = species.scientificName?.toLowerCase() || '';

        for (const term of searchTerms) {
          // Exact name match
          if (term === nameLower || term === sciNameLower) {
            score += 100;
          }
          // Name contains term or term contains name
          else if (nameLower.includes(term) || term.includes(nameLower)) {
            score += 60;
          }
          // Scientific name partial match
          else if (sciNameLower && (sciNameLower.includes(term) || term.includes(sciNameLower))) {
            score += 50;
          }
          // Genus-level match (first word of scientific name)
          else if (sciNameLower) {
            const genus = sciNameLower.split(' ')[0];
            if (term.includes(genus) || genus.includes(term)) {
              score += 30;
            }
          }
        }

        return { species, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const maxScore = scored[0]?.score || 1;

    const suggestions = scored.map(({ species, score }) => ({
      speciesId: species.id,
      name: species.name,
      scientificName: species.scientificName,
      category: species.category,
      imageUrl: species.imageUrl,
      minLegalSize: species.minLegalSize,
      confidence: Math.round((score / maxScore) * 100),
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'URL d\'image invalide' }, { status: 400 });
    }
    console.error('Fish identification error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
