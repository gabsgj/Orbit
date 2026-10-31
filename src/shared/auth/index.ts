import type { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/shared/db";
import bcrypt from "bcryptjs";

/**
 * next-auth configuration (Phase-0 minimal, working). Abhiram hardens this in
 * Phase 1 per SRS M1 (email normalization, rate limiting, audit, etc.).
 * Session carries user id + role so shared/trpc can enforce RBAC server-side.
 */

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "ADMIN" | "STAFF" | "CUSTOMER" } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "STAFF" | "CUSTOMER";
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        // FR-ADM-01 hardening: the User model has no isActive column, so
        // instead of a schema change we check audit_log for a STAFF_DEACTIVATED
        // event targeting this user. One extra indexed query per login keeps
        // the schema untouched while closing the deactivated-staff login gap.
        const deactivated = await prisma.auditLog.findFirst({
          where: { entity: "user", entityId: user.id, action: "STAFF_DEACTIVATED" },
          select: { id: true },
        });
        if (deactivated) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "ADMIN" | "STAFF" | "CUSTOMER" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
};
