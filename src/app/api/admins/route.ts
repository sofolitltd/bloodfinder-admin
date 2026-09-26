import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_ID = "super";

function superAdminEntry() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) return null;
  return {
    id: SUPER_ADMIN_ID,
    email,
    name: "Super Admin",
    isSuperAdmin: true,
  };
}

export async function GET() {
  const admins = [];
  const superAdmin = superAdminEntry();
  if (superAdmin) admins.push(superAdmin);

  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      const { getDb } = await import("@/lib/firebase/admin");
      const { COLLECTION_NAMES } = await import("@/lib/constants");
      const snapshot = await getDb()
        .collection(COLLECTION_NAMES.ADMIN)
        .orderBy("createdAt", "desc")
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        admins.push({
          id: doc.id,
          email: data.email,
          name: data.name || "",
          isSuperAdmin: false,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
        });
      }
    } catch (error) {
      console.error("Admins fetch error:", error);
    }
  }

  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { getDb } = await import("@/lib/firebase/admin");
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const bcrypt = await import("bcryptjs");
    const db = getDb();
    const collection = db.collection(COLLECTION_NAMES.ADMIN);

    if (email === (process.env.ADMIN_EMAIL || "").trim().toLowerCase()) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 409 }
      );
    }

    const existing = await collection.where("email", "==", email).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const docRef = await collection.add({
      email,
      name,
      passwordHash,
      createdAt: new Date(),
    });

    return NextResponse.json({
      admin: { id: docRef.id, email, name, isSuperAdmin: false },
    });
  } catch (error) {
    console.error("Admin create error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
