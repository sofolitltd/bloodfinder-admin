import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const notConfigured = () =>
  NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

/** PATCH /api/communities/[id]/members/[uid] — approve a pending member */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { id, uid } = await params;
    const db = getDb();

    const memberRef = db.collection(COLLECTION_NAMES.COMMUNITY_MEMBERS).doc(`${id}_${uid}`);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await memberRef.update({ member: true });

    if (memberDoc.data()?.member !== true) {
      await db
        .collection(COLLECTION_NAMES.COMMUNITIES)
        .doc(id)
        .update({ memberCount: FieldValue.increment(1) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member approve error:", error);
    return NextResponse.json({ error: "Failed to approve member" }, { status: 500 });
  }
}

/** DELETE /api/communities/[id]/members/[uid] — remove a member or reject a join request */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { id, uid } = await params;
    const db = getDb();

    const memberRef = db.collection(COLLECTION_NAMES.COMMUNITY_MEMBERS).doc(`${id}_${uid}`);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const wasApproved = memberDoc.data()?.member === true;
    await memberRef.delete();

    if (wasApproved) {
      await db
        .collection(COLLECTION_NAMES.COMMUNITIES)
        .doc(id)
        .update({ memberCount: FieldValue.increment(-1) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member remove error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
