import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DEPARTMENTS } from '@/config/departments';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Explorer par département' };

export default function ExplorePage() {
  const regions = [...new Set(DEPARTMENTS.map((d) => d.region))].sort();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Explorer par département</h1>
      {regions.map((region) => (
        <div key={region} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{region}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {DEPARTMENTS.filter((d) => d.region === region).map((dept) => (
              <Link key={dept.code} href={`/explore/${dept.code}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.code}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
