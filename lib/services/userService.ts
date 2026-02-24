// Real User Service - Database Integration
import { authenticatedGet, authenticatedPut } from '@/lib/auth-fetch';

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar?: string
  role: string
  group_id?: number
  group_name?: string
  created_at: string
  updated_at: string
}

export interface UserStats {
  qrCodesCreated: number
  shortUrlsCreated: number
  totalScans: number
  totalClicks: number
  lastActivity: string
  joinedDate: string
  recentActivity: Array<{
    id: number
    type: 'qr_scan' | 'url_click'
    description: string
    timestamp: string
  }>
}

export interface UpdateUserRequest {
  full_name: string
  email: string
  group_id?: string | null
}

class UserService {
  private baseUrl = '/api/users'

  // Get current user profile from database
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await authenticatedGet(`${this.baseUrl}/me`)
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching current user:', error)
      throw error
    }
  }

  // Get user statistics from database
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await authenticatedGet(`${this.baseUrl}/me/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  // Update user profile in database
  async updateUserProfile(data: UpdateUserRequest): Promise<UserProfile> {
    try {
      const response = await authenticatedPut(`${this.baseUrl}/me`, data)
      
      if (!response.ok) {
        throw new Error('Failed to update user profile')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  // Upload user avatar (placeholder - would integrate with file upload service)
  async uploadAvatar(file: File): Promise<string> {
    try {
      // This would typically upload to a storage service like AWS S3, Supabase Storage, etc.
      // For now, returning a placeholder URL
      console.warn('Avatar upload requested for file:', file.name)
      return '/placeholder-user.jpg'
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  // Get user preferences (could be extended)
  async getUserPreferences(): Promise<any> {
    try {
      // Could be extended to fetch user-specific preferences from database
      return {
        theme: 'system',
        language: 'en',
        notifications: true,
        emailUpdates: true,
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      throw error
    }
  }
}

// Export singleton instance
export const userService = new UserService()

// Export default
export default userService
