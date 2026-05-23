import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.identifier === "string"
            ? credentials.identifier.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!identifier || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { userName: identifier }],
          },
        });

        if (!user?.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.firstName ?? user.email,
          location: user.location,
        };
      },
    }),
    Google,
    Facebook({
      authorization: {
        params: {
          scope: "email public_profile",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
        token.userEmail = user.email;
        token.userName = user.name;
        token.userLocation =
          typeof user.location === "string" ? user.location : null;
      }

      if (user || trigger === "update" || !("isMentor" in token)) {
        const userId = user?.id ?? (typeof token.userId === "string" ? token.userId : null);
        if (userId) {
          const [mentor, dbUser] = await Promise.all([
            prisma.mentor.findUnique({ where: { userId } }),
            prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
          ]);
          token.isMentor = Boolean(mentor);
          token.isAdmin = Boolean(dbUser?.isAdmin);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.email = typeof token.userEmail === "string" ? token.userEmail : "";
        session.user.name = typeof token.userName === "string" ? token.userName : session.user.name;
        session.user.location =
          typeof token.userLocation === "string" ? token.userLocation : null;
        session.user.isMentor = Boolean(token.isMentor);
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
});
