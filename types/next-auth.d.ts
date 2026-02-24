import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      role_name: string
      groupId?: number
      is_active: boolean
      avatar?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    role_name: string
    groupId?: number
    is_active: boolean
    avatar?: string
  }
}