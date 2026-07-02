import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/feedback — list all feedbacks with user names */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ feedbacks: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const db = getDb();
    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;

    const snap = await db
      .collection("feedbacks")
      .orderBy("createdAt", "desc")
      .get();

    const feedbacks = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user names for all unique uids
    const uids = [...new Set(feedbacks.map((f: Record<string, unknown>) => f.uid as string).filter(Boolean))];
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

    const enriched = feedbacks.map((fb: Record<string, unknown>) => ({
      ...fb,
      userName: userNameMap[fb.uid as string] || "Unknown",
    }));

    return NextResponse.json({ feedbacks: enriched });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ feedbacks: [] }, { status: 500 });
  }
}

/** DELETE /api/feedback?id=xxx — delete a feedback */
export async function DELETE(request: NextRequest) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id parameter" },
        { status: 400 }
      );
    }

    await db.collection("feedbacks").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}
