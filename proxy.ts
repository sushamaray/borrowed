export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*", "/register/:path*"],
};
