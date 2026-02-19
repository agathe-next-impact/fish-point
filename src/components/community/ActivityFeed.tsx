import { FeedItem } from './FeedItem';

interface Activity {
  id: string;
  type: 'catch' | 'spot' | 'review';
  title: string;
  description: string;
  imageUrl?: string;
  user: { name: string | null; image: string | null };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <FeedItem key={activity.id} item={activity} />
      ))}
    </div>
  );
}
