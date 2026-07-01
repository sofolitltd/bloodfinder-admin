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

    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    const doc = await db.collection(usersCollection).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = { id: doc.id, ...doc.data() };

    // Gracefully fetch relational data — skip silently if index is missing
    let donations: Record<string, unknown>[] = [];
    let bloodRequests: Record<string, unknown>[] = [];
    try {
      const donationsSnap = await db.collection(COLLECTION_NAMES.DONATIONS).where("uid", "==", id).orderBy("date", "desc").limit(10).get();
      donations = donationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch { /* index not created yet */ }
    try {
      const requestsSnap = await db.collection(COLLECTION_NAMES.BLOOD_REQUESTS).where("uid", "==", id).orderBy("createdAt", "desc").limit(10).get();
      bloodRequests = requestsSnap.docs.map((r) => ({ id: r.id, ...r.data() }));
    } catch { /* index not created yet */ }

    return NextResponse.json({ user, donations, bloodRequests });
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "isBanned", "isDonor", "isEmergencyDonor",
      "firstName", "lastName", "mobileNumber", "email",
      "bloodGroup", "district", "subdistrict", "currentAddress", "gender",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    updates.updatedAt = new Date();

    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    await getDb().collection(usersCollection).doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { id } = await params;

    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    await getDb().collection(usersCollection).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
