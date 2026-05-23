import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    location?: string | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      location?: string | null;
      isMentor: boolean;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    userEmail?: string | null;
    userName?: string | null;
    userLocation?: string | null;
    isMentor?: boolean;
    isAdmin?: boolean;
  }
}
