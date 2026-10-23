import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPage, canAccessPwaPersona } from "@/lib/permissions";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Static, data-free fallback must stay publicly cacheable by the service worker.
  if (pathname === "/pwa/offline") return NextResponse.next();

  if (!token || token.isActive === false || !token.employeeId) {
    const signIn = new URL("/auth/signin", request.url);
    signIn.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  }

  const role = typeof token.role === "string" ? token.role : undefined;
  if (pathname.startsWith("/pwa")) {
    return canAccessPwaPersona(role, pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/auth/access-denied", request.url));
  }
  if (role === "DRIVER") return NextResponse.redirect(new URL("/driver-app", request.url));
  if (!canAccessPage(role, pathname)) {
    return NextResponse.redirect(new URL("/auth/access-denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/overview/:path*",
    "/purchasing/:path*",
    "/delivery/:path*",
    "/procurement/:path*",
    "/inventory/:path*",
    "/sales/:path*",
    "/logistics/:path*",
    "/debts/:path*",
    "/finance/:path*",
    "/hr-misa/:path*",
    "/documents/:path*",
    "/workspace/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/pwa/:path*",
  ],
};
