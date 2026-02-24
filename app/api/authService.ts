// Auth Service (API-side)
// Refactored to Prisma: removed direct raw SQL helper usage.
// NOTE: There is also a parallel implementation in lib/auth/authService.ts used by server logic.
// Future consolidation: prefer a single shared service in lib/auth and make this file a thin re-export.
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/passwordPolicy'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || '8de0f0296ac805dee48992a98a5b38a48405b85c34801617d8853719daa5531e'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  groupId?: number
  avatar?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface ProfileUpdateData {
  name?: string
  email?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

class AuthService {
  // Generate JWT token
  generateToken(payload: { userId: string; email: string; role: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials

      // Find user by email with role relation
      const user = await prisma.users.findUnique({
        where: { email },
        include: { roles: true }
      })

      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated')
      }

      // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        throw new Error('Invalid email or password')
      }

      // Update last login
      await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date() }
      })

      // Generate token with correct payload structure
      const tokenPayload = {
        userId: user.id,
        email: user.email,
  role: user.roles?.name || 'user'
      };
      const token = this.generateToken(tokenPayload)

      return {
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roles?.name || 'user',
          groupId: user.group_id || undefined,
          avatar: user.avatar || undefined,
          lastLogin: user.last_login?.toISOString?.() || undefined,
          createdAt: user.created_at?.toISOString?.() || '',
          updatedAt: user.updated_at?.toISOString?.() || ''
        },
        token
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  // Get user by ID
  public async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { roles: true }
      })
      if (!user) return null
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        groupId: user.group_id || undefined,
        avatar: user.avatar || undefined,
        lastLogin: user.last_login?.toISOString?.() || undefined,
        createdAt: user.created_at?.toISOString?.() || '',
        updatedAt: user.updated_at?.toISOString?.() || ''
      }
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  // Register new user
  public async register(userData: {
    name: string
    email: string
    password: string
    role?: string
  }): Promise<AuthResponse> {
    try {
  const { name, email, password, role = 'user' } = userData

      const existing = await prisma.users.findUnique({ where: { email } })
      if (existing) throw new Error('User already exists with this email')

      // Password policy: for public registration use system default (medium) for now.
      const policyLevel = 'medium';
      const pwCheck = validatePassword(password, policyLevel as any);
      if (!pwCheck.valid) {
        throw new Error('Password does not meet policy: ' + pwCheck.errors.join('; '));
      }

      // Resolve role relation if provided
      let roleRecord = null
      if (role) {
        roleRecord = await prisma.roles.findUnique({ where: { name: role } })
      }
      const hashedPassword = await bcrypt.hash(password, 12)
      const user = await prisma.users.create({
        data: {
          name,
            email,
            password_hash: hashedPassword,
            roles: roleRecord ? { connect: { id: roleRecord.id } } : undefined
        },
        include: { roles: true }
      })

      const token = this.generateToken({ userId: user.id, email: user.email, role: user.roles?.name || 'user' })

      return {
        message: 'Registration successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roles?.name || 'user',
          groupId: user.group_id || undefined,
          avatar: user.avatar || undefined,
          lastLogin: user.last_login?.toISOString?.() || undefined,
          createdAt: user.created_at?.toISOString?.() || '',
          updatedAt: user.updated_at?.toISOString?.() || ''
        },
        token
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  // Update user profile
  public async updateProfile(
    userId: string,
    updateData: ProfileUpdateData
  ): Promise<User> {
    try {
      const { name, email } = updateData
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (name) {
        updates.push(`name = $${paramIndex}`)
        values.push(name)
        paramIndex++
      }

      if (email) {
        const existing = await prisma.users.findFirst({ where: { email, NOT: { id: userId } } })
        if (existing) throw new Error('Email is already taken by another user')
        updates.push(`email = $${paramIndex}`)
        values.push(email)
        paramIndex++
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update')
      }

      updates.push(`updated_at = NOW()`)
      values.push(userId)

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      // Simpler via Prisma update
      const user = await prisma.users.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          updated_at: new Date()
        },
        include: { roles: true }
      })
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        groupId: user.group_id || undefined,
        avatar: user.avatar || undefined,
        lastLogin: user.last_login?.toISOString?.() || undefined,
        createdAt: user.created_at?.toISOString?.() || '',
        updatedAt: user.updated_at?.toISOString?.() || ''
      }
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed')
    }
  }

  // Change password
  public async changePassword(
    userId: string,
    passwordData: PasswordChangeData
  ): Promise<{ message: string }> {
    try {
      const { currentPassword, newPassword } = passwordData

      // Get current user password hash
      const user = await prisma.users.findUnique({ where: { id: userId }, select: { password_hash: true } })
      if (!user) throw new Error('User not found')
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await prisma.users.update({ where: { id: userId }, data: { password_hash: hashedNewPassword, updated_at: new Date() } })

      return { message: 'Password changed successfully' }
    } catch (error: any) {
      throw new Error(error.message || 'Password change failed')
    }
  }

  // Validate token and get current user
  public async getCurrentUser(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token)
      if (!decoded) {
        return null
      }

      return await this.getUserById(decoded.userId)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Delete user account
  public async deleteAccount(userId: string): Promise<{ message: string }> {
    try {
      await prisma.users.delete({ where: { id: userId } })

      return { message: 'Account deleted successfully' }
    } catch (error: any) {
      throw new Error(error.message || 'Account deletion failed')
    }
  }

  // Get all users (admin only)
  public async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.users.findMany({
        orderBy: { created_at: 'desc' },
        include: { roles: true }
      })
      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        groupId: user.group_id || undefined,
        avatar: user.avatar || undefined,
        lastLogin: user.last_login?.toISOString?.() || undefined,
        createdAt: user.created_at?.toISOString?.() || '',
        updatedAt: user.updated_at?.toISOString?.() || ''
      }))
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get users')
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService
