import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAuth } from "./lib/auth/actions";

export async function proxy(request: NextRequest) {
  //   return NextResponse.redirect(new URL("/home", request.url));
  const currentpath = request.nextUrl.pathname;

  // First Auth Layer
  const { user } = await getServerAuth();
  if (!user && !(currentpath.startsWith("/auth") || currentpath === "/")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
