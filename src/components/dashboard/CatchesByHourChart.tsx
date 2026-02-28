'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CatchByHour } from '@/services/dashboard.service';

interface CatchesByHourChartProps {
  data: CatchByHour[];
}

export function CatchesByHourChart({ data }: CatchesByHourChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: `${String(d.hour).padStart(2, '0')}h`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Prises par heure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                labelFormatter={(label) => `Heure: ${label}`}
                formatter={(value: number | undefined) => [`${value ?? 0} prise${(value ?? 0) > 1 ? 's' : ''}`, 'Nombre']}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
