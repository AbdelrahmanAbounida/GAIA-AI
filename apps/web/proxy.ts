import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAuth, getServerSession } from "./lib/auth/actions";

export async function proxy(request: NextRequest) {
  //   return NextResponse.redirect(new URL("/home", request.url));
  const currentpath = request.nextUrl.pathname;

  // First Auth Layer
  const { user } = await getServerAuth();
  if (!user && !(currentpath.startsWith("/login") || currentpath === "/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
