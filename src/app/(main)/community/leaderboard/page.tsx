import { Leaderboard } from '@/components/community/Leaderboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Classement' };

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Classement</h1>
      <Leaderboard title="Top pêcheurs du mois" entries={[]} />
    </div>
  );
}
