import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db as prisma } from "./prisma"  // Use the shared Prisma instance

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      groupId?: number
      is_active: boolean
    }
  }
  interface User {
    role: string
    groupId?: number
    is_active: boolean
  }
}

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.warn('[NEXTAUTH_SECRET_MISSING] NEXTAUTH_SECRET is not set, falling back to local development secret. Set NEXTAUTH_SECRET in your environment to avoid session decryption errors.');
}
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isRegistering: { label: "Is Registering", type: "text" }
      },
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check if this is a registration request
        if (credentials.isRegistering === 'true') {
          // Check if user already exists
          const existingUser = await prisma.users.findUnique({
            where: { email: credentials.email }
          })

          if (existingUser) {
            return null
          }

          // Get the USER role
          const userRole = await prisma.roles.findFirst({
            where: {
              name: 'USER'
            }
          })

          if (!userRole) {
            return null
          }

          // Create new user
          const hashedPassword = await bcrypt.hash(credentials.password, 12)
          const user = await prisma.users.create({
            data: {
              email: credentials.email,
              name: credentials.name as string,
              password_hash: hashedPassword,
              role_id: userRole.id,
              is_active: true
            }
          })

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'USER', // Default role for new users
            role_name: 'USER',
            is_active: !!user.is_active
          }
        }

        // Login flow
        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        if (!user.password_hash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        // Update last login
        await prisma.users.update({
          where: { id: user.id },
          data: { last_login: new Date() }
        })

        // Get user role
        const roleId = user.role_id
        if (!roleId) {
          return null
        }
        const userRole = await prisma.roles.findUnique({
          where: { id: roleId }
        })

        if (!userRole) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userRole.name,
          role_name: userRole.name,
          avatar: user.avatar ?? undefined,
          groupId: user.group_id ?? undefined,
          is_active: !!user.is_active
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.groupId = user.groupId
        token.is_active = user.is_active
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.groupId = token.groupId as number
        session.user.is_active = token.is_active as boolean
        session.user.id = token.sub as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: secret || "8de0f0296ac805dee48992a98a5b38a48405b85c34801617d8853719daa5531e"
}