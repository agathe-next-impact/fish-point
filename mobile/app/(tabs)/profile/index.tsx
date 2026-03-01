import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Fish,
  BarChart3,
  MapPinOff,
  CreditCard,
  Bell,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
  Trophy,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, SCREEN_PADDING_H } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProfile, useLogout } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: <Fish size={20} color={colors.primary[600]} />,
    label: 'Mes captures',
    route: '/catches',
  },
  {
    icon: <BarChart3 size={20} color={colors.primary[600]} />,
    label: 'Dashboard',
    route: '/dashboard',
  },
  {
    icon: <MapPinOff size={20} color={colors.primary[600]} />,
    label: 'Mes spots prives',
    route: '/my-spots',
  },
  {
    icon: <CreditCard size={20} color={colors.primary[600]} />,
    label: 'Cartes de peche',
    route: '/catches', // placeholder route
  },
  {
    icon: <Bell size={20} color={colors.primary[600]} />,
    label: 'Alertes',
    route: '/alerts',
  },
  {
    icon: <BookOpen size={20} color={colors.primary[600]} />,
    label: 'Reglementations',
    route: '/regulations',
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isLoading } = useProfile();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnecter',
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingSpinner fullScreen message="Chargement du profil..." />
      </SafeAreaView>
    );
  }

  const level = (user as any)?.level ?? 1;
  const xp = (user as any)?.xp ?? 0;
  const xpForNext = level * 100;
  const xpProgress = Math.min(xp / xpForNext, 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar
            name={user?.name || 'Pecheur'}
            uri={user?.image}
            size="xl"
          />
          <Text style={styles.name}>{user?.name || 'Pecheur'}</Text>
          {(user as any)?.username && (
            <Text style={styles.username}>@{(user as any).username}</Text>
          )}

          {/* Level + XP */}
          <View style={styles.levelRow}>
            <Trophy size={16} color={colors.warning[500]} />
            <Text style={styles.levelText}>Niveau {level}</Text>
          </View>

          {/* XP bar */}
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBar, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>{xp} / {xpForNext} XP</Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {(user as any)?._count?.catches ?? 0}
            </Text>
            <Text style={styles.statLabel}>Captures</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {(user as any)?._count?.reviews ?? 0}
            </Text>
            <Text style={styles.statLabel}>Avis</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {(user as any)?._count?.favorites ?? 0}
            </Text>
            <Text style={styles.statLabel}>Spots</Text>
          </Card>
        </View>

        {/* Menu items */}
        <Card style={styles.menuCard} padded={false}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.error[600]} />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  profileHeader: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: SCREEN_PADDING_H,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  name: {
    ...typography.h2,
    color: colors.gray[900],
    marginTop: spacing.md,
  },
  username: {
    ...typography.body,
    color: colors.gray[500],
    marginTop: spacing.xxs,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  levelText: {
    ...typography.bodyMedium,
    color: colors.warning[600],
  },
  xpBarContainer: {
    width: '60%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: colors.warning[500],
    borderRadius: 3,
  },
  xpText: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary[700],
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: spacing.xxs,
  },
  menuCard: {
    marginHorizontal: SCREEN_PADDING_H,
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.gray[800],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: SCREEN_PADDING_H,
    paddingVertical: spacing.lg,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.error[600],
  },
});
