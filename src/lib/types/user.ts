import type { BloodGroup, BadgeLevel } from "../constants";
import type { FirebaseTimestamp } from "./common";

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  bloodGroup: string;
  district: string;
  subdistrict: string;
  currentAddress?: string;
  gender?: string;
  dateOfBirth?: string;
  isDonor: boolean;
  isBanned?: boolean;
  isEmergencyDonor: boolean;
  isOnline: boolean;
  donationCount?: number;
  badge?: string;
  image?: string;
  token?: string;
  communities?: string[];
  createdAt: string;
  lastDonationDate?: FirebaseTimestamp;
  fcmToken?: string;
  photoUrl?: string;
}

export interface UserRow {
  id: string;
  uid: string;
  firstName: string;
  lastName: string;
  name: string;
  mobileNumber: string;
  phone: string;
  email?: string;
  bloodGroup: string;
  district: string;
  subdistrict: string;
  currentAddress?: string;
  gender?: string;
  dateOfBirth?: string;
  isDonor: boolean;
  isBanned?: boolean;
  isEmergencyDonor: boolean;
  isOnline: boolean;
  donationCount: number;
  badge?: string;
  image?: string;
  communities?: string[];
  createdAt: string;
}
