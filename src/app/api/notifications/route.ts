import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/notifications — list all admin-type notifications with user names */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const db = getDb();
    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;

    const snap = await db
      .collection("notifications")
      .where("type", "==", "admin")
      .orderBy("createdAt", "desc")
      .get();

    const notifications = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || null,
        title: data.title || "",
        body: data.body || "",
        type: data.type || "",
        read: data.read ?? false,
        link: data.link || undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
      };
    });

    // Fetch user names for all unique uids
    const uids = [...new Set(notifications.map((n) => n.uid).filter(Boolean))] as string[];
    const userNameMap: Record<string, string> = {};

    if (uids.length > 0) {
      const userDocs = await Promise.all(
        uids.map((uid) => db.collection(usersCollection).doc(uid).get()),
      );
      for (const userDoc of userDocs) {
        if (userDoc.exists) {
          const data = userDoc.data()!;
          const first = (data.firstName as string) || "";
          const last = (data.lastName as string) || "";
          userNameMap[userDoc.id] = `${first} ${last}`.trim() || "Unknown";
        }
      }
    }

    const enriched = notifications.map((n) => ({
      ...n,
      userName: n.uid ? userNameMap[n.uid] || "Unknown" : null,
    }));

    return NextResponse.json({ notifications: enriched });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
