'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Heart, MessageCircle, MapPin, Fish, Ruler, Weight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/community/UserAvatar';
import { useLikeSharedCatch, useComments, useAddComment } from '@/hooks/useFeed';
import { formatRelativeTime } from '@/lib/utils';
import type { SharedCatchFeedItem } from '@/types/feed';

interface SharedCatchCardProps {
  item: SharedCatchFeedItem;
}

export function SharedCatchCard({ item }: SharedCatchCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const likeMutation = useLikeSharedCatch();
  const { data: commentsData, isLoading: commentsLoading } = useComments(
    showComments ? item.id : '',
  );
  const addCommentMutation = useAddComment();

  const handleLike = () => {
    likeMutation.mutate(item.id);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(
      { sharedCatchId: item.id, content: commentText },
      { onSuccess: () => setCommentText('') },
    );
  };

  const catchData = item.catch;

  return (
    <Card className="overflow-hidden">
      {/* User header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <UserAvatar name={item.user.name} image={item.user.image} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {item.user.name || item.user.username || 'Anonyme'}
          </p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
        </div>
      </div>

      {/* Catch image */}
      {catchData.imageUrl && (
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={catchData.imageUrl}
            alt={catchData.species.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
      )}

      <CardContent className="p-4">
        {/* Species and details */}
        <div className="flex items-center gap-2 mb-2">
          <Fish className="h-4 w-4 text-primary" />
          <span className="font-semibold">{catchData.species.name}</span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
          {catchData.length && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {catchData.length} cm
            </span>
          )}
          {catchData.weight && (
            <span className="flex items-center gap-1">
              <Weight className="h-3.5 w-3.5" /> {(catchData.weight / 1000).toFixed(1)} kg
            </span>
          )}
          {catchData.technique && (
            <span className="text-xs">{catchData.technique}</span>
          )}
        </div>

        {/* Spot name (blurred location) */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{catchData.spot.name}</span>
          {item.blurLocation && (
            <span className="text-xs text-muted-foreground/60">(zone approximative)</span>
          )}
        </div>

        {/* Caption */}
        {item.caption && (
          <p className="text-sm mb-3">{item.caption}</p>
        )}

        {/* Like and comment buttons */}
        <div className="flex items-center gap-4 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <Heart
              className={`h-4 w-4 ${item.isLikedByMe ? 'fill-red-500 text-red-500' : ''}`}
            />
            <span className="text-sm">{item._count.likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{item._count.comments}</span>
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 border-t pt-3 space-y-3">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              commentsData?.data?.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <UserAvatar name={comment.user.name} image={comment.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{comment.user.name || 'Anonyme'}</span>{' '}
                      {comment.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                isLoading={addCommentMutation.isPending}
              >
                Envoyer
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
