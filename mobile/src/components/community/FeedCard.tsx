import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { formatWeight, formatRelativeTime } from '@/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedCardProps {
  id: string;
  userName: string;
  userImage?: string | null;
  photoUrl?: string | null;
  species?: string | null;
  weight?: number | null;
  caption?: string | null;
  spotName?: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  onLike: () => void;
  onComment: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedCard({
  userName,
  userImage,
  photoUrl,
  species,
  weight,
  caption,
  spotName,
  likeCount,
  commentCount,
  isLiked,
  createdAt,
  onLike,
  onComment,
}: FeedCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar name={userName} uri={userImage} size="sm" />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.time}>{formatRelativeTime(createdAt)}</Text>
        </View>
      </View>

      {/* Photo */}
      {photoUrl && (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
        />
      )}

      {/* Catch info */}
      <View style={styles.body}>
        <View style={styles.catchInfo}>
          {species && (
            <Text style={styles.species}>{species}</Text>
          )}
          {weight != null && (
            <Text style={styles.weight}>{formatWeight(weight)}</Text>
          )}
        </View>

        {spotName && (
          <Text style={styles.spot}>{spotName}</Text>
        )}

        {caption && (
          <Text style={styles.caption}>{caption}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Heart
              size={20}
              color={isLiked ? colors.error[500] : colors.gray[400]}
              fill={isLiked ? colors.error[500] : 'none'}
            />
            <Text
              style={[styles.actionText, isLiked && { color: colors.error[500] }]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MessageCircle size={20} color={colors.gray[400]} />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    ...typography.bodyMedium,
    color: colors.gray[900],
  },
  time: {
    ...typography.caption,
    color: colors.gray[400],
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  body: {
    padding: spacing.md,
  },
  catchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  species: {
    ...typography.h4,
    color: colors.gray[900],
  },
  weight: {
    ...typography.bodyMedium,
    color: colors.primary[600],
  },
  spot: {
    ...typography.small,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  caption: {
    ...typography.body,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.small,
    color: colors.gray[500],
    fontWeight: '600',
  },
});
