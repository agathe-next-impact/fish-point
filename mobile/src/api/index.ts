// API client core
export {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getToken,
  setToken,
  clearToken,
  setOnUnauthorized,
} from './client';
export type { ApiError } from './client';

// Spots
export {
  getSpots,
  getSpot,
  getSpotsBbox,
  searchSpots,
  getNearbySpots,
  getSpotWeather,
  getSpotWater,
  getSpotScore,
  toggleFavorite,
  createSpot,
  getSpotReviews,
  createReview,
} from './spots';
export type { SpotReview, SpotScore, ReviewCreateInput } from './spots';

// Catches
export {
  getCatches,
  getCatch,
  createCatch,
  updateCatch,
  deleteCatch,
  getCatchStats,
  syncOfflineCatches,
  shareCatch,
} from './catches';
export type { CatchCreateExtendedInput, ShareCatchInput, SyncResult } from './catches';

// Community (Feed & Groups)
export {
  getFeed,
  likeFeedItem,
  unlikeFeedItem,
  getFeedComments,
  addFeedComment,
  getGroups,
  getGroup,
  createGroup,
  joinGroup,
  getGroupTrips,
  createGroupTrip,
} from './community';
export type { CreateGroupInput, CreateGroupTripInput } from './community';

// Auth
export {
  login,
  register,
  getProfile,
  updateProfile,
  savePushToken,
} from './auth';
export type { LoginInput, RegisterInput, AuthResponse, UpdateProfileInput } from './auth';

// Dashboard
export {
  getCatchesBySpecies,
  getCatchesByWeather,
  getCatchesByHour,
  getCatchesByBait,
  getProgression,
} from './dashboard';
export type {
  CatchBySpeciesItem,
  CatchByWeatherItem,
  CatchByHourItem,
  CatchByBaitItem,
  ProgressionItem,
  DashboardFilters,
} from './dashboard';

// Alerts
export {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getNotifications,
} from './alerts';
export type { CreateSubscriptionInput, UpdateSubscriptionInput } from './alerts';

// Regulations
export { getRegulations } from './regulations';

// Private Spots
export {
  getPrivateSpots,
  getPrivateSpot,
  createPrivateSpot,
  updatePrivateSpot,
  deletePrivateSpot,
  getPrivateSpotsBbox,
  getPrivateSpotVisits,
  createPrivateSpotVisit,
} from './private-spots';
export type {
  PrivateSpotCreateInput,
  PrivateSpotUpdateInput,
  VisitCreateInput,
} from './private-spots';

// Fishing Cards
export {
  getFishingCards,
  getFishingCard,
  createFishingCard,
  updateFishingCard,
  deleteFishingCard,
} from './fishing-cards';
