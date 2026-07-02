import { NextResponse } from "next/server";

// Dev mode — bypass auth, allow all requests
export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
