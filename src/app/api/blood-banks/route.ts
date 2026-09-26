import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/blood-banks — list all blood banks */
export async function GET() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ bloodBanks: [] });
  }

  try {
    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const db = getDb();

    const snap = await db.collection(COLLECTION_NAMES.BLOOD_BANKS).orderBy("name").get();
    const bloodBanks = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    return NextResponse.json({ bloodBanks });
  } catch (error) {
    console.error("Blood banks fetch error:", error);
    return NextResponse.json({ bloodBanks: [] }, { status: 500 });
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/** POST /api/blood-banks — create a blood bank */
export async function POST(request: NextRequest) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();
    const mobile1 = String(body.mobile1 || "").trim();

    if (!name || !address || !mobile1) {
      return NextResponse.json(
        { error: "Name, address, and mobile number are required" },
        { status: 400 }
      );
    }

    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const { encodeGeohash } = await import("@/lib/geohash");
    const db = getDb();
    const collection = db.collection(COLLECTION_NAMES.BLOOD_BANKS);

    const existing = await collection.where("name", "==", name).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "A blood bank with this name already exists" },
        { status: 409 }
      );
    }

    const mobile2 = String(body.mobile2 || "").trim();
    const country = String(body.country || "").trim();
    const locationAddress = String(body.locationAddress || "").trim();
    const latitude = body.latitude != null ? Number(body.latitude) : undefined;
    const longitude = body.longitude != null ? Number(body.longitude) : undefined;

    const data: Record<string, unknown> = {
      name,
      slug: slugify(name),
      address,
      mobile1,
      createdAt: new Date(),
    };
    if (mobile2) data.mobile2 = mobile2;
    if (country) data.country = country;
    if (locationAddress) data.locationAddress = locationAddress;
    if (latitude != null && !Number.isNaN(latitude)) data.latitude = latitude;
    if (longitude != null && !Number.isNaN(longitude)) data.longitude = longitude;
    if (data.latitude != null && data.longitude != null) {
      data.geohash = encodeGeohash(data.latitude as number, data.longitude as number);
    }

    const docRef = await collection.add(data);
    return NextResponse.json({ bloodBank: { id: docRef.id, ...data } });
  } catch (error) {
    console.error("Blood bank create error:", error);
    return NextResponse.json({ error: "Failed to create blood bank" }, { status: 500 });
  }
}
