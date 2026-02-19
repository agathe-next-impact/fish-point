import Link from 'next/link';
import { Shield, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FishSizeTable } from '@/components/regulations/FishSizeTable';
import { SeasonCalendar } from '@/components/regulations/SeasonCalendar';
import { DEPARTMENTS } from '@/config/departments';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Réglementation pêche' };

export default function RegulationsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        Réglementation pêche
      </h1>
      <p className="text-muted-foreground mb-6">Consultez la réglementation par département, espèce et cours d&apos;eau.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SeasonCalendar title="1ère catégorie (Salmonidés)" openMonths={[3, 4, 5, 6, 7, 8, 9]} />
        <SeasonCalendar title="2ème catégorie (Cyprinidés)" openMonths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
      </div>

      <div className="mb-8">
        <FishSizeTable />
      </div>

      <h2 className="text-xl font-semibold mb-4">Par département</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {DEPARTMENTS.map((dept) => (
          <Link key={dept.code} href={`/regulations/${dept.code}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{dept.name} ({dept.code})</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
