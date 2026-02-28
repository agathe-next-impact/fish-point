import { ActivityFeed } from '@/components/community/ActivityFeed';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Communauté' };

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Communauté</h1>
      <ActivityFeed activities={[]} />
    </div>
  );
}
