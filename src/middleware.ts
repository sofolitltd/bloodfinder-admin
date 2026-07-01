import { NextResponse } from "next/server";

// Dev mode — bypass auth, allow all requests
export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
