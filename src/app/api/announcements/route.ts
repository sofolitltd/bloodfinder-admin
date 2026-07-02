import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COLLECTION = "announcements";

function formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title || "",
    body: data.body || "",
    target: data.target || "",
    country: data.country || null,
    type: data.type || "",
    link: data.link || undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
  };
}

/** GET /api/announcements — list all announcements */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ announcements: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const db = getDb();

    const snap = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const announcements = snap.docs.map(formatDoc);
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ announcements: [] }, { status: 500 });
  }
}

/** DELETE /api/announcements?id=xxx — delete an announcement */
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

    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}
