// Central Auth Service (server-side & business logic)
// Prisma-based implementation replacing legacy raw SQL usage.
// Consolidation target: Other API-layer auth helpers should defer to this module.
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || '8de0f0296ac805dee48992a98a5b38a48405b85c34801617d8853719daa5531e';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Changed to string to support dynamic roles from database
  avatar?: string;
  is_active: boolean;
  group_id?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authService = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  },

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Generate JWT token
  generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  },

  // Verify JWT token
  verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error);
      return null;
    }
  },

  // Register new user
  async register(email: string, password: string, name: string, role: string = 'user'): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) {
        return { success: false, message: 'User already exists' };
      }
      const roleRecord = await prisma.roles.findUnique({ where: { name: role } });
      if (!roleRecord) return { success: false, message: `Invalid role: ${role}` };

      // Hash password
      const hashedPassword = await this.hashPassword(password);
      const user = await prisma.users.create({
        data: {
          name,
          email,
          password_hash: hashedPassword,
          role_id: roleRecord.id,
          is_active: true
        },
        include: { roles: true }
      });
      const mapped: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || role,
        avatar: user.avatar || undefined,
        is_active: !!user.is_active,
        group_id: user.group_id || undefined,
        created_at: user.created_at?.toISOString?.() || '',
        updated_at: user.updated_at?.toISOString?.() || ''
      };
      return { success: true, user: mapped };
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
    try {
      // Get user with role information
      const user = await prisma.users.findUnique({
        where: { email },
        include: { roles: true }
      });

      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check if user is active
      if (!user.is_active) {
        return { success: false, message: 'Account is deactivated' };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      await prisma.users.update({ where: { id: user.id }, data: { last_login: new Date() } });

      // Remove password hash from user object
      const mapped: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        avatar: user.avatar || undefined,
        is_active: !!user.is_active,
        group_id: user.group_id || undefined,
        created_at: user.created_at?.toISOString?.() || '',
        updated_at: user.updated_at?.toISOString?.() || ''
      };
      const token = this.generateToken(mapped);
      return { success: true, user: mapped, token };
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { roles: true }
      });
      if (!user || !user.is_active) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        avatar: user.avatar || undefined,
        is_active: !!user.is_active,
        group_id: user.group_id || undefined,
        created_at: user.created_at?.toISOString?.() || '',
        updated_at: user.updated_at?.toISOString?.() || ''
      };
    } catch (error) {
      console.error('[AUTH] Get user error:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      if (!updates.name && !updates.avatar) {
        return { success: false, message: 'No updates provided' };
      }
      const user = await prisma.users.update({
        where: { id: userId },
        data: {
          name: updates.name || undefined,
          avatar: updates.avatar || undefined,
          updated_at: new Date()
        },
        include: { roles: true }
      });
      const mapped: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || 'user',
        avatar: user.avatar || undefined,
        is_active: !!user.is_active,
        group_id: user.group_id || undefined,
        created_at: user.created_at?.toISOString?.() || '',
        updated_at: user.updated_at?.toISOString?.() || ''
      };
      return { success: true, user: mapped };
    } catch (error) {
      console.error('[AUTH] Update profile error:', error);
      return { success: false, message: 'Update failed' };
    }
  },

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get current password hash
      const user = await prisma.users.findUnique({ where: { id: userId }, select: { password_hash: true } });
      if (!user) return { success: false, message: 'User not found' };
      const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.users.update({ where: { id: userId }, data: { password_hash: hashedNewPassword, updated_at: new Date() } });

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('[AUTH] Change password error:', error);
      return { success: false, message: 'Password change failed' };
    }
  }
};

export default authService;