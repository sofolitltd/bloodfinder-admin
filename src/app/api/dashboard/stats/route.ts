import { NextResponse } from "next/server";
import { toTitleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS_OF_TREND = 14;
const MONTHS_OF_TREND = 6;

/** Handles Firestore Timestamps, {_seconds} objects, ISO strings, and Dates uniformly. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; _seconds?: number };
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v._seconds === "number") return new Date(v._seconds * 1000);
  }
  return null;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ configured: false });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES, BLOOD_GROUPS } = await import("@/lib/constants");
    const db = getDb();
    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    const usersRef = db.collection(usersCollection);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - (DAYS_OF_TREND - 1));
    fourteenDaysAgo.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - (MONTHS_OF_TREND - 1), 1);

    const [
      totalUsersSnap,
      totalDonorsSnap,
      emergencyDonorsSnap,
      communitiesSnap,
      bloodBanksSnap,
      feedbackSnap,
      upcomingEventsSnap,
      newUsersRangeSnap,
      donationsRangeSnap,
      activeRequestsSnap,
      recentUsersSnap,
      recentRequestsSnap,
      recentFeedbackSnap,
      countrySnap,
    ] = await Promise.all([
      usersRef.count().get(),
      usersRef.where("isDonor", "==", true).count().get(),
      usersRef.where("isEmergencyDonor", "==", true).count().get(),
      db.collection(COLLECTION_NAMES.COMMUNITIES).count().get(),
      db.collection(COLLECTION_NAMES.BLOOD_BANKS).count().get(),
      db.collection(COLLECTION_NAMES.FEEDBACK).count().get(),
      db.collection(COLLECTION_NAMES.EVENTS).where("eventDate", ">=", now).count().get(),
      usersRef.where("createdAt", ">=", fourteenDaysAgo.toISOString()).get(),
      db.collection(COLLECTION_NAMES.DONATIONS).where("donationDate", ">=", sixMonthsAgo).get(),
      db.collection(COLLECTION_NAMES.BLOOD_REQUESTS).where("status", "==", "active").limit(1000).get(),
      usersRef.orderBy("createdAt", "desc").limit(5).get(),
      db.collection(COLLECTION_NAMES.BLOOD_REQUESTS).orderBy("createdAt", "desc").limit(5).get(),
      db.collection(COLLECTION_NAMES.FEEDBACK).orderBy("createdAt", "desc").limit(5).get(),
      usersRef.select("country").get(),
    ]);

    // ── New users per day (last 14 days) ──────────────────────────────
    const newUsersByDayMap = new Map<string, number>();
    for (let i = 0; i < DAYS_OF_TREND; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      newUsersByDayMap.set(dateKey(d), 0);
    }
    for (const doc of newUsersRangeSnap.docs) {
      const d = toDate(doc.data().createdAt);
      if (!d) continue;
      const key = dateKey(d);
      if (newUsersByDayMap.has(key)) {
        newUsersByDayMap.set(key, (newUsersByDayMap.get(key) || 0) + 1);
      }
    }
    const newUsersByDay = [...newUsersByDayMap.entries()].map(([date, count]) => ({ date, count }));

    // ── Donations per month (last 6 months) + this-month count ────────
    const donationsByMonthMap = new Map<string, number>();
    for (let i = 0; i < MONTHS_OF_TREND; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      donationsByMonthMap.set(monthKey(d), 0);
    }
    let donationsThisMonth = 0;
    for (const doc of donationsRangeSnap.docs) {
      const d = toDate(doc.data().donationDate);
      if (!d) continue;
      const key = monthKey(d);
      if (donationsByMonthMap.has(key)) {
        donationsByMonthMap.set(key, (donationsByMonthMap.get(key) || 0) + 1);
      }
      if (d >= startOfThisMonth) donationsThisMonth++;
    }
    const donationsByMonth = [...donationsByMonthMap.entries()].map(([month, count]) => ({ month, count }));

    // ── Active requests by blood group ─────────────────────────────────
    const bloodGroupCounts = new Map<string, number>(BLOOD_GROUPS.map((bg) => [bg, 0]));
    for (const doc of activeRequestsSnap.docs) {
      const bg = doc.data().bloodGroup as string | undefined;
      if (bg && bloodGroupCounts.has(bg)) {
        bloodGroupCounts.set(bg, (bloodGroupCounts.get(bg) || 0) + 1);
      }
    }
    const requestsByBloodGroup = [...bloodGroupCounts.entries()].map(([bloodGroup, count]) => ({
      bloodGroup,
      count,
    }));

    // ── Users by country ────────────────────────────────────────────────
    const countryCounts = new Map<string, number>();
    for (const doc of countrySnap.docs) {
      const country = (doc.data().country as string | undefined)?.trim() || "Unknown";
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    }
    const usersByCountry = [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // ── Recent activity (enrich requests + feedback with submitter name) ──
    const recentRequests = recentRequestsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Record<
      string,
      unknown
    >[];
    const recentFeedbackDocs = recentFeedbackSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Record<
      string,
      unknown
    >[];

    const submitterUids = [
      ...new Set(
        [...recentRequests, ...recentFeedbackDocs].map((r) => r.uid as string).filter(Boolean)
      ),
    ];
    const submitterNames: Record<string, string> = {};
    if (submitterUids.length > 0) {
      const submitterDocs = await Promise.all(submitterUids.map((uid) => usersRef.doc(uid).get()));
      for (const doc of submitterDocs) {
        if (doc.exists) {
          const data = doc.data()!;
          submitterNames[doc.id] = toTitleCase(`${data.firstName || ""} ${data.lastName || ""}`.trim()) || "Unknown";
        }
      }
    }

    const recentUsers = recentUsersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: toTitleCase(`${data.firstName || ""} ${data.lastName || ""}`.trim()) || "Unknown",
        bloodGroup: data.bloodGroup || null,
        createdAt: data.createdAt || null,
      };
    });

    const recentBloodRequests = recentRequests.map((r) => ({
      id: r.id,
      requesterName:
        submitterNames[r.uid as string] || toTitleCase((r.userName as string) || "") || "Unknown",
      bloodGroup: r.bloodGroup,
      status: r.status,
      createdAt: r.createdAt,
    }));

    const recentFeedback = recentFeedbackDocs.map((f) => ({
      id: f.id,
      userName: submitterNames[f.uid as string] || "Unknown",
      category: (f.category as string) || "general",
      message: (f.message as string) || "",
      createdAt: f.createdAt || null,
    }));

    return NextResponse.json({
      configured: true,
      stats: {
        totalUsers: totalUsersSnap.data().count,
        totalDonors: totalDonorsSnap.data().count,
        emergencyDonors: emergencyDonorsSnap.data().count,
        activeBloodRequests: activeRequestsSnap.size,
        totalCommunities: communitiesSnap.data().count,
        totalBloodBanks: bloodBanksSnap.data().count,
        totalFeedback: feedbackSnap.data().count,
        upcomingEvents: upcomingEventsSnap.data().count,
        donationsThisMonth,
      },
      charts: {
        newUsersByDay,
        donationsByMonth,
        requestsByBloodGroup,
        usersByCountry,
      },
      recent: {
        users: recentUsers,
        bloodRequests: recentBloodRequests,
        feedback: recentFeedback,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ configured: true, error: "Failed to load stats" }, { status: 500 });
  }
}
