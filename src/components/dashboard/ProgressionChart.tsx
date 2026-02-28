'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ProgressionEntry } from '@/services/dashboard.service';

interface ProgressionChartProps {
  data: ProgressionEntry[];
}

export function ProgressionChart({ data }: ProgressionChartProps) {
  const formattedData = data.map((d) => {
    const [year, month] = d.month.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return {
      ...d,
      label: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progression mensuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                formatter={(value: number | undefined, name: string | undefined) => {
                  const v = value ?? 0;
                  if (name === 'count') return [`${v} prise${v > 1 ? 's' : ''}`, 'Prises'];
                  if (name === 'totalWeight') return [`${v}kg`, 'Poids total'];
                  return [v, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
