import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// Use shared Prisma singleton
import { prisma } from "@/lib/prisma";

interface CustomUser extends User {
  id: string;
  email: string;
  name: string;
  role: string;
  role_id: string;
  is_active: boolean;
  two_factor_enabled?: boolean;
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req });
  return token?.id as string || null;
}

// Determine if the current authenticated user is an administrator.
// Uses DB join on users -> roles and checks role name.
export async function isAdministrator(req: NextRequest): Promise<boolean> {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) return false;

    // Fetch role via relation to ensure we get the name (role_id may be null temporarily)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { roles: { select: { name: true } } }
    });

    const roleName = user?.roles?.name;
    if (!roleName) return false;
    return ["ADMIN", "admin", "Administrator", "administrator"].includes(roleName);
  } catch (err) {
    console.error("[AUTH] Failed to determine administrator role (Prisma):", err);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email,
            is_active: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            password_hash: true,
            role_id: true,
            is_active: true,
            user_settings_user_settings_user_idTousers: {
              select: { enable_two_factor: true }
            }
          }
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        const twoFactorEnabled = !!(user as any).user_settings_user_settings_user_idTousers?.enable_two_factor;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: String(user.role_id),
          role_id: String(user.role_id),
          is_active: user.is_active,
          two_factor_enabled: twoFactorEnabled
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as CustomUser).role;
        token.is_active = (user as CustomUser).is_active;
        token.two_factor_enabled = (user as CustomUser).two_factor_enabled;
        // Initialize lastActivity on initial login
        token.lastActivity = Date.now();
      } else {
        // Update lastActivity opportunistically (throttle to once per 30s to reduce JWT churn)
        const now = Date.now();
        const last = token.lastActivity as number | undefined;
        if (!last || (now - last) > 30_000) {
          token.lastActivity = now;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as CustomUser).is_active = token.is_active as boolean;
        (session.user as CustomUser).two_factor_enabled = token.two_factor_enabled as boolean | undefined;
      }
      return session;
    }
  }
};