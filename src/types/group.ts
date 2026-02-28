export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export interface GroupTrip {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  spotId: string | null;
  date: string;
  createdBy: string;
  createdAt: string;
  spot?: {
    id: string;
    name: string;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

export interface FishingGroup {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  _count?: {
    members: number;
  };
  members?: GroupMember[];
  trips?: GroupTrip[];
}
