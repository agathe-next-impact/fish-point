import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface SeasonCalendarProps {
  title: string;
  openMonths: number[];
}

export function SeasonCalendar({ title, openMonths }: SeasonCalendarProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-1">
          {MONTHS.map((month, i) => (
            <div key={month} className="text-center">
              <div
                className={`h-8 rounded-sm flex items-center justify-center text-[10px] font-medium ${
                  openMonths.includes(i + 1)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {month}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-100" /> Ouvert</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-100" /> Fermé</span>
        </div>
      </CardContent>
    </Card>
  );
}
