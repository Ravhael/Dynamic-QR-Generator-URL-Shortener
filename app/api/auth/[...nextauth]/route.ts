import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

// Ensure PrismaClient is a singleton
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email,
            is_active: true
          },
          include: {
            roles: true
          }
        })

        if (!user) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name, // legacy (NextAuth default)
          full_name: user.name, // explicit field consumed by UI
          email: user.email,
          role: (user.roles?.name || 'user').toLowerCase(),
          role_name: (user.roles?.name || 'user').toLowerCase(),
          is_active: user.is_active
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        ;(token as any).role_name = (user as any).role_name
        token.is_active = (user as any).is_active
        ;(token as any).full_name = (user as any).full_name || (user as any).name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        ;(session.user as any).role_name = (token as any).role_name as string
        session.user.is_active = token.is_active as boolean
        ;(session.user as any).full_name = (token as any).full_name || session.user.name
        // Also mirror full_name into standard name if name empty
        if (!session.user.name && (token as any).full_name) {
          session.user.name = (token as any).full_name
        }
      }
      return session
    }
  }
  ,
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }