export interface Community {
  id: string;
  code?: string;
  name: string;
  mobile?: string;
  address?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  admin?: string[];
  memberCount?: number;
  images?: string[];
  createdAt?: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  uid: string;
  member: boolean;
  createdAt?: string;
  name?: string;
  mobileNumber?: string;
  bloodGroup?: string;
}
