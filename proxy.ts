import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = Boolean(req.auth?.user);
  const isAdmin = Boolean(req.auth?.user?.isAdmin);

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname.startsWith("/dashboard") && isAdmin) {
    return NextResponse.redirect(new URL("/admin/disputes", req.nextUrl));
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }
  }

  if (
    (pathname.startsWith("/login") || pathname.startsWith("/register")) &&
    isAuthenticated
  ) {
    const dest = isAdmin ? "/admin/disputes" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
