import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/users/countries — distinct countries present among users, with counts */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ countries: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const db = getDb();
    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;

    const snap = await db.collection(usersCollection).select("country").get();

    const counts = new Map<string, number>();
    for (const doc of snap.docs) {
      const country = (doc.data().country as string | undefined)?.trim();
      if (!country) continue;
      counts.set(country, (counts.get(country) || 0) + 1);
    }

    const countries = [...counts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => a.country.localeCompare(b.country));

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("Countries fetch error:", error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
