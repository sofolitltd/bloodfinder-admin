import { NextRequest, NextResponse } from "next/server";
import { createSession, getCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    let authenticated = email === adminEmail && password === adminPassword;

    if (!authenticated && process.env.FIREBASE_PROJECT_ID) {
      try {
        const { getDb } = await import("@/lib/firebase/admin");
        const { COLLECTION_NAMES } = await import("@/lib/constants");
        const bcrypt = await import("bcryptjs");

        const snapshot = await getDb()
          .collection(COLLECTION_NAMES.ADMIN)
          .where("email", "==", email.trim().toLowerCase())
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const passwordHash = snapshot.docs[0].data().passwordHash as string;
          authenticated = await bcrypt.compare(password, passwordHash);
        }
      } catch (error) {
        console.error("Admin lookup error:", error);
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createSession(email);
    const cookieOptions = getCookieOptions(process.env.NODE_ENV === "production");

    const response = NextResponse.json(
      { success: true, email },
      { status: 200 }
    );

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
