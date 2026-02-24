import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Initialize Prisma Client
const prisma = new PrismaClient()

interface CustomUser extends User {
  id: string
  email: string
  name: string
  role: string
  role_id: number
  is_active: boolean
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req })
  return token?.id as string || null
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
          throw new Error("Email and password required")
        }

        try {
          // Get user with their role information
          const user = await prisma.users.findUnique({
            where: {
              email: credentials.email,
              is_active: true
            },
            include: {
              roles: true // Include the role relation to get role name
            }
          })

          if (!user) {
            console.warn("Login attempt failed: User not found -", credentials.email)
            throw new Error("Invalid email or password")
          }

          if (!user.is_active) {
            console.warn("Login attempt failed: Inactive user -", credentials.email)
            throw new Error("Account is inactive")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          if (!isPasswordValid) {
            console.warn("Login attempt failed: Invalid password -", credentials.email)
            throw new Error("Invalid email or password")
          }

          // Log successful login
          console.log("Login successful:", {
            userId: user.id,
            email: user.email,
            role: user.roles?.name,
            roleId: user.role_id
          })

          // Return user with role name
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.roles?.name?.toUpperCase() || 'USER', // Use actual role name
            role_id: user.role_id,
            is_active: user.is_active
          }

        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser
        token.id = customUser.id
        token.role = customUser.role
        token.role_id = customUser.role_id
        token.is_active = customUser.is_active
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const customUser = session.user as unknown as CustomUser
        customUser.id = token.id as string
        customUser.role = token.role as string
        customUser.role_id = token.role_id as number
        customUser.is_active = token.is_active as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}