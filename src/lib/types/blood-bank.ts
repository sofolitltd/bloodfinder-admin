export interface BloodBank {
  id: string;
  name: string;
  slug?: string;
  address: string;
  mobile1: string;
  mobile2?: string;
  imageUrl?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  locationAddress?: string;
  country?: string;
  createdAt?: string;
}
