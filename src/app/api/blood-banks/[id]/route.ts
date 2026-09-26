import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const notConfigured = () =>
  NextResponse.json({ error: "Firebase not configured" }, { status: 503 });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.FIREBASE_PROJECT_ID) return notConfigured();

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { encodeGeohash } = await import("@/lib/geohash");
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name",
      "address",
      "mobile1",
      "mobile2",
      "country",
      "locationAddress",
      "latitude",
      "longitude",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const value = body[field];
        updates[field] =
          field === "latitude" || field === "longitude" ? Number(value) : value;
      }
    }

    const latitude = updates.latitude as number | undefined;
    const longitude = updates.longitude as number | undefined;
    if (latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      updates.geohash = encodeGeohash(latitude, longitude);
    }

    await getDb().collection(COLLECTION_NAMES.BLOOD_BANKS).doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blood bank update error:", error);
    return NextResponse.json({ error: "Failed to update blood bank" }, { status: 500 });
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

    await getDb().collection(COLLECTION_NAMES.BLOOD_BANKS).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blood bank delete error:", error);
    return NextResponse.json({ error: "Failed to delete blood bank" }, { status: 500 });
  }
}
