import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildLoginPath } from "@/lib/auth-redirect";

const SESSION_COOKIE_NAME = "bp_session";
const CURRENT_PATH_HEADER = "x-business-current-path";

export default function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname + request.nextUrl.search;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CURRENT_PATH_HEADER, currentPath);

  const isLoginRoute = request.nextUrl.pathname === "/login";
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!isLoginRoute && !hasSessionCookie) {
    return NextResponse.redirect(new URL(buildLoginPath(currentPath), request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};