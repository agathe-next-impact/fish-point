import { AlertTriangle, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { REGULATION_TYPE_LABELS } from '@/lib/constants';
import { formatRegulationPeriod } from '@/services/regulations.service';

interface RegulationCardProps {
  regulation: {
    id: string;
    type: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
    source: string | null;
  };
}

export function RegulationCard({ regulation }: RegulationCardProps) {
  const isAlert = ['POLLUTION_ALERT', 'DROUGHT_ALERT', 'FLOOD_ALERT'].includes(regulation.type);

  return (
    <Card className={isAlert ? 'border-red-300' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isAlert ? (
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          ) : (
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{REGULATION_TYPE_LABELS[regulation.type] || regulation.type}</span>
              <Badge variant={regulation.isActive ? 'default' : 'secondary'} className="text-[10px]">
                {regulation.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{regulation.description}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRegulationPeriod(regulation.startDate, regulation.endDate)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
