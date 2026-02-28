import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface FeedItemProps {
  item: {
    id: string;
    type: 'catch' | 'spot' | 'review';
    title: string;
    description: string;
    imageUrl?: string;
    user: { name: string | null; image: string | null };
    createdAt: string;
    likesCount: number;
    commentsCount: number;
  };
}

export function FeedItem({ item }: FeedItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {getInitials(item.user.name)}
          </div>
          <div>
            <p className="font-medium text-sm">{item.user.name || 'Anonyme'}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
          </div>
        </div>

        <h3 className="font-semibold mb-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

        <div className="flex items-center gap-4 pt-3 border-t">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Heart className="h-4 w-4 mr-1" /> {item.likesCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-1" /> {item.commentsCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
