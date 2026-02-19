import { CatchForm } from '@/components/catches/CatchForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enregistrer une prise' };

export default function NewCatchPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <CatchForm />
    </div>
  );
}
