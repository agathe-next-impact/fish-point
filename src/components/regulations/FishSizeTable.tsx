import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler } from 'lucide-react';
import { DEFAULT_SIZE_LIMITS } from '@/config/regulations';

export function FishSizeTable() {
  const entries = Object.entries(DEFAULT_SIZE_LIMITS);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Tailles légales minimales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Espèce</th>
                <th className="text-right py-2 font-medium">Taille min.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, size]) => (
                <tr key={name} className="border-b last:border-0">
                  <td className="py-2">{name}</td>
                  <td className="text-right py-2 font-mono">{size} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
