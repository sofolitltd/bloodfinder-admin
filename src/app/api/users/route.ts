import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Return empty if Firebase not configured
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ users: [], totalPages: 1, totalCount: 0, page: 1 });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const district = searchParams.get("district") || "";
    const donorStatus = searchParams.get("donorStatus") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limitParam = parseInt(searchParams.get("limit") || "20");
    const PAGE_SIZE = Math.min(Math.max(limitParam, 1), 10000);
    const db = getDb();
    const usersCollection = process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;
    let query: FirebaseFirestore.Query = db.collection(usersCollection);

    if (bloodGroup) query = query.where("bloodGroup", "==", bloodGroup);
    if (district) query = query.where("district", "==", district);
    if (donorStatus === "donor") query = query.where("isDonor", "==", true);
    else if (donorStatus === "non-donor") query = query.where("isDonor", "==", false);

    query = query.orderBy("createdAt", "desc");

    const countSnap = await query.count().get();
    const totalCount = countSnap.data().count;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const offset = (page - 1) * PAGE_SIZE;
    const snapshot = await query.offset(offset).limit(PAGE_SIZE).get();

    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Record<string, unknown>[];

    if (search) {
      const lowerSearch = search.toLowerCase();
      users = users.filter(
        (u: Record<string, unknown>) =>
          String(u.firstName || "").toLowerCase().includes(lowerSearch) ||
          String(u.lastName || "").toLowerCase().includes(lowerSearch) ||
          String(u.mobileNumber || "").toLowerCase().includes(lowerSearch) ||
          String(u.email || "").toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({ users, totalPages, totalCount, page });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ users: [], totalPages: 1, totalCount: 0, page: 1 });
  }
}
