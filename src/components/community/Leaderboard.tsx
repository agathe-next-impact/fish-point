import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types/user';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title: string;
}

export function Leaderboard({ entries, title }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                entry.rank <= 3 && 'bg-muted',
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                entry.rank === 1 && 'bg-yellow-100 text-yellow-700',
                entry.rank === 2 && 'bg-gray-100 text-gray-700',
                entry.rank === 3 && 'bg-orange-100 text-orange-700',
                entry.rank > 3 && 'text-muted-foreground',
              )}>
                {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : entry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                {getInitials(entry.name)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.name || entry.username}</p>
              </div>
              <span className="font-bold text-sm">{entry.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
