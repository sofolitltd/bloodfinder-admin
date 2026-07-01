export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const BLOOD_REQUEST_STATUS = ["active", "fulfilled", "cancelled"] as const;
export type BloodRequestStatus = (typeof BLOOD_REQUEST_STATUS)[number];

export const DONATION_TYPES = ["whole_blood", "plasma", "platelets", "rbc"] as const;
export type DonationType = (typeof DONATION_TYPES)[number];

export const COMMUNITY_MEMBER_STATUS = ["pending", "approved", "rejected"] as const;
export type CommunityMemberStatus = (typeof COMMUNITY_MEMBER_STATUS)[number];

export const COMMUNITY_MEMBER_ROLES = ["member", "admin"] as const;
export type CommunityMemberRole = (typeof COMMUNITY_MEMBER_ROLES)[number];

export const EVENT_RSVP_STATUS = ["going", "maybe", "declined"] as const;
export type EventRsvpStatus = (typeof EVENT_RSVP_STATUS)[number];

export const BADGE_LEVELS = [
  "first_hero",
  "bronze",
  "silver",
  "gold",
  "legend",
] as const;
export type BadgeLevel = (typeof BADGE_LEVELS)[number];

export const BANGLADESH_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

export const DISTRICTS: Record<string, string[]> = {
  Dhaka: [
    "Dhaka",
    "Gazipur",
    "Narayanganj",
    "Tangail",
    "Kishoreganj",
    "Manikganj",
    "Munshiganj",
    "Narsingdi",
  ],
  Chattogram: [
    "Chattogram",
    "Cox's Bazar",
    "Comilla",
    "Noakhali",
    "Feni",
    "Lakshmipur",
    "Brahmanbaria",
    "Chandpur",
  ],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Chapainawabganj"],
  Khulna: ["Khulna", "Jessore", "Bagerhat", "Satkhira", "Kushtia", "Jhenaidah"],
  Barishal: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Potuakhali"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Lalmonirhat", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Netrokona", "Jamalpur", "Sherpur"],
};

/** Firestore collection names. */
export const COLLECTION_NAMES = {
  USERS: "users",
  DONATIONS: "donations",
  BLOOD_REQUESTS: "blood_requests",
  COMMUNITIES: "communities",
  COMMUNITY_MEMBERS: "community_members",
  EVENTS: "events",
  EVENT_RSVPS: "event_rsvps",
  BLOOD_BANKS: "blood_bank",
  EMERGENCY_DONORS: "emergency_donor",
  NOTIFICATIONS: "notifications",
  FEEDBACK: "feedbacks",
  ADMIN: "admin",
  SETTINGS: "settings",
} as const;
