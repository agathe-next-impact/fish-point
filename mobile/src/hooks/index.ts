// Spots
export {
  useSpots,
  useSpot,
  useMapSpots,
  useNearbySpots,
  useCreateSpot,
  useToggleFavorite,
  spotKeys,
} from './useSpots';

// Catches
export {
  useCatches,
  useCatch,
  useCatchStats,
  useCreateCatch,
  useDeleteCatch,
  catchKeys,
} from './useCatches';

// Community (Feed & Groups)
export {
  useFeed,
  useLikeFeedItem,
  useFeedComments,
  useAddComment,
  useGroups,
  useGroup,
  useCreateGroup,
  useJoinGroup,
  communityKeys,
} from './useCommunity';

// Dashboard
export {
  useCatchesBySpecies,
  useCatchesByWeather,
  useCatchesByHour,
  useCatchesByBait,
  useProgression,
  dashboardKeys,
} from './useDashboard';

// Alerts
export {
  useSubscriptions,
  useNotifications,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  alertKeys,
} from './useAlerts';

// Location
export { useLocation } from './useLocation';
export type { LocationData } from './useLocation';

// Auth
export {
  useLogin,
  useRegister,
  useLogout,
  useProfile,
  authKeys,
} from './useAuth';

// Offline sync
export { useOfflineSync } from './useOfflineSync';

// Push notifications
export { usePushNotifications } from './usePushNotifications';
