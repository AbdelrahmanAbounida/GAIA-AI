import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAuth } from "./lib/auth/actions";

export async function proxy(request: NextRequest) {
  const currentpath = request.nextUrl.pathname;
  const { user } = await getServerAuth();

  if (!user && !(currentpath.startsWith("/auth") || currentpath === "/")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
