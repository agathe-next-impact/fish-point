import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
      <p className="text-muted-foreground mb-6 text-center">
        Ce spot n&apos;existe pas ou a été déplacé.
      </p>
      <Link href="/">
        <Button>Retour à l&apos;accueil</Button>
      </Link>
    </div>
  );
}
