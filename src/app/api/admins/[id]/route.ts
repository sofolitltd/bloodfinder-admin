import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });
  }

  try {
    const { id } = await params;

    if (id === "super") {
      return NextResponse.json(
        { error: "The super admin cannot be removed" },
        { status: 400 }
      );
    }

    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const docRef = getDb().collection(COLLECTION_NAMES.ADMIN).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (session && session.email.toLowerCase() === String(doc.data()?.email || "").toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot remove your own account" },
        { status: 400 }
      );
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
