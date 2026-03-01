import React, { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Users } from 'lucide-react-native';
import { colors, spacing, typography, SCREEN_PADDING_H } from '@/theme';
import { FeedCard } from '@/components/community/FeedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFeed, useLikeFeedItem } from '@/hooks';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CommunityScreen() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();

  const likeMutation = useLikeFeedItem();

  // Flatten all pages into a single array
  const feedItems = data?.pages.flatMap((page) => page.data) ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <LoadingSpinner fullScreen message="Chargement du fil..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Communaute</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <FeedCard
            id={item.id}
            userName={item.user?.name || 'Pecheur'}
            userImage={item.user?.image}
            photoUrl={(item as any).photoUrl ?? (item as any).catch?.photoUrl ?? null}
            species={(item as any).catch?.species ?? null}
            weight={(item as any).catch?.weight ?? null}
            caption={(item as any).caption ?? null}
            spotName={(item as any).catch?.spot?.name ?? null}
            likeCount={item._count?.likes ?? 0}
            commentCount={item._count?.comments ?? 0}
            isLiked={item.isLikedByMe ?? false}
            createdAt={item.createdAt}
            onLike={() => likeMutation.mutate(item.id)}
            onComment={() => {
              // Comment functionality could navigate to a detail screen
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={48} color={colors.gray[300]} />}
            title="Aucune publication"
            description="Soyez le premier a partager votre prise avec la communaute !"
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <LoadingSpinner message="Chargement..." />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    ...typography.h1,
    color: colors.gray[900],
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
});
