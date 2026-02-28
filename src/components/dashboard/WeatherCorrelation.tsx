'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CatchByWeather } from '@/services/dashboard.service';

interface WeatherCorrelationProps {
  data: CatchByWeather[];
}

export function WeatherCorrelation({ data }: WeatherCorrelationProps) {
  const scatterData = data
    .filter((d) => d.weatherTemp !== null && d.weight !== null)
    .map((d) => ({
      temp: d.weatherTemp,
      weight: d.weight,
      pressure: d.pressure || 1013,
      speciesName: d.speciesName,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Correlation meteo / prises</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75">
          {scatterData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune donnee meteo disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="temp"
                  name="Temperature"
                  unit="°C"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="weight"
                  name="Poids"
                  unit="kg"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ZAxis
                  type="number"
                  dataKey="pressure"
                  name="Pression"
                  range={[40, 400]}
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
                    if (name === 'Temperature') return [`${v}°C`, name];
                    if (name === 'Poids') return [`${v}kg`, name];
                    if (name === 'Pression') return [`${v}hPa`, name];
                    return [v, name];
                  }}
                  labelFormatter={() => ''}
                />
                <Scatter
                  data={scatterData}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
