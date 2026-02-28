'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CatchByBait } from '@/services/dashboard.service';

interface BaitSuccessChartProps {
  data: CatchByBait[];
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
];

export function BaitSuccessChart({ data }: BaitSuccessChartProps) {
  const top10 = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appats les plus efficaces</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          {top10.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top10}
                  dataKey="count"
                  nameKey="bait"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }: { name?: string | number; percent?: number }) =>
                    `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {top10.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number | undefined, name: string | undefined, props: { payload?: CatchByBait }) => [
                    `${value ?? 0} prise${(value ?? 0) > 1 ? 's' : ''} (moy. ${props.payload?.avgWeight ?? 0}kg)`,
                    name ?? '',
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
