import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const notConfigured = () =>
  NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { id } = await params;
    const db = getDb();

    const doc = await db.collection(COLLECTION_NAMES.COMMUNITIES).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    const community = { ...doc.data(), id: doc.id };

    const membersSnap = await db
      .collection(COLLECTION_NAMES.COMMUNITY_MEMBERS)
      .where("communityId", "==", id)
      .get();

    const members = membersSnap.docs.map((m) => ({ id: m.id, ...m.data() })) as Record<
      string,
      unknown
    >[];

    const usersCollection =
      process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    const uids = [...new Set(members.map((m) => m.uid as string).filter(Boolean))];
    const userMap: Record<string, Record<string, unknown>> = {};

    if (uids.length > 0) {
      const userDocs = await Promise.all(
        uids.map((uid) => db.collection(usersCollection).doc(uid).get())
      );
      for (const userDoc of userDocs) {
        if (userDoc.exists) userMap[userDoc.id] = userDoc.data()!;
      }
    }

    const enrich = (m: Record<string, unknown>) => {
      const user = userMap[m.uid as string];
      const name = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"
        : "Unknown";
      return {
        ...m,
        name,
        mobileNumber: user?.mobileNumber || "",
        bloodGroup: user?.bloodGroup || "",
      };
    };

    const approvedMembers = members.filter((m) => m.member === true).map(enrich);
    const pendingMembers = members.filter((m) => m.member !== true).map(enrich);

    return NextResponse.json({ community, approvedMembers, pendingMembers });
  } catch (error) {
    console.error("Community detail error:", error);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { id } = await params;
    const { deleteCommunityCascade } = await import("@/lib/firebase/community-cascade");
    await deleteCommunityCascade(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community delete error:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
