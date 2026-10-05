import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { can, permissionForPath } from "@/lib/permissions";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

function isPublicAsset(pathname: string) {
  return pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname.includes(".");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isLogin = pathname === "/login";

  if (!session) {
    if (isLogin) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const permission = permissionForPath(pathname);
  if (permission) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { role: true, permissions: true },
    });
    if (!user || !can(user, permission)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
