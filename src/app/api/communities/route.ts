import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/communities — list all communities */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ communities: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const db = getDb();

    const snap = await db
      .collection(COLLECTION_NAMES.COMMUNITIES)
      .orderBy("createdAt", "desc")
      .get();

    const communities = snap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("Communities fetch error:", error);
    return NextResponse.json({ communities: [] }, { status: 500 });
  }
}

/** DELETE /api/communities?id=xxx — delete a community and its memberships */
export async function DELETE(request: NextRequest) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id parameter" },
        { status: 400 },
      );
    }

    const { deleteCommunityCascade } = await import("@/lib/firebase/community-cascade");
    await deleteCommunityCascade(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 },
    );
  }
}
