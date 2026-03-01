export interface SharedCatchFeedItem {
  id: string;
  catchId: string;
  userId: string;
  blurLocation: boolean;
  caption: string | null;
  createdAt: string;
  catch: {
    id: string;
    weight: number | null;
    length: number | null;
    technique: string | null;
    imageUrl: string | null;
    caughtAt: string;
    species: {
      id: string;
      name: string;
    };
    spot: {
      id: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
    };
  };
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLikedByMe: boolean;
}

export interface SharedCatchComment {
  id: string;
  sharedCatchId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
