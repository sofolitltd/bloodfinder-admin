import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ email: null }, { status: 401 });
  }

  const isSuperAdmin =
    session.email.toLowerCase() === (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  return NextResponse.json({ email: session.email, isSuperAdmin });
}
