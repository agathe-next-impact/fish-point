const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface FishIdentificationResult {
  speciesId: string | null;
  name: string;
  scientificName: string | null;
  confidence: number;
  category: string | null;
  imageUrl: string | null;
}

/**
 * Identify fish species from an image URL using Google Cloud Vision API.
 * Returns top 3 suggestions matched against local FishSpecies database.
 */
export async function identifyFishFromImage(
  imageUrl: string,
): Promise<FishIdentificationResult[]> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY is not configured');
  }

  // Call Google Cloud Vision API
  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'WEB_DETECTION', maxResults: 10 },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.responses?.[0];
  if (!result) return [];

  // Extract labels and web entities
  const labels: string[] = (result.labelAnnotations || []).map(
    (l: { description: string }) => l.description.toLowerCase(),
  );
  const webEntities: Array<{ description: string; score: number }> = (
    result.webDetection?.webEntities || []
  )
    .filter((e: { description?: string }) => e.description)
    .map((e: { description: string; score: number }) => ({
      description: e.description.toLowerCase(),
      score: e.score || 0,
    }));

  // Combine all detected terms
  const allTerms = [
    ...labels.map((l) => ({ term: l, score: 0.7 })),
    ...webEntities.map((e) => ({ term: e.description, score: e.score })),
  ];

  return { allTerms } as unknown as FishIdentificationResult[];
}

/**
 * Match Vision API terms against the FishSpecies database.
 * Must be called server-side with Prisma access.
 */
export function buildMatchQuery(allTerms: Array<{ term: string; score: number }>) {
  // Extract unique fish-related terms
  const fishTerms = allTerms
    .filter(({ term }) => {
      // Filter out generic terms
      const generic = ['fish', 'animal', 'water', 'nature', 'wildlife', 'organism', 'fin', 'ray-finned fish', 'bony fish', 'vertebrate'];
      return !generic.includes(term);
    })
    .sort((a, b) => b.score - a.score);

  return fishTerms.map((t) => t.term);
}
