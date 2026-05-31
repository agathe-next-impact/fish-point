import { SpotForm } from '@/components/spots/SpotForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ajouter un spot' };

export default function NewSpotPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="fs-dsp text-2xl font-extrabold text-ink mb-6">Ajouter un spot de pêche</h1>
      <SpotForm />
    </div>
  );
}
