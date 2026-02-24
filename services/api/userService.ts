export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

class UserService {
  async getCurrentUser(): Promise<User | null> {
    try {
      // Mock user data for now
      return {
        id: '1',
        email: 'admin@scanly.indovisual.co.id',
        full_name: 'Admin User',
        role: 'admin',
        avatar: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (_error) {
      console.error('Error getting current user:', _error);
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User | null> {
    try {
      // Mock update - in real app, this would call API
      console.warn('Updating profile with data:', data);
      return {
        id: '1',
        email: 'admin@scanly.indovisual.co.id',
        full_name: data.full_name || 'Admin User',
        role: 'admin',
        avatar: data.avatar || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (_error) {
      console.error('Error updating profile:', _error);
      return null;
    }
  }

  async uploadAvatar(file: File): Promise<{ avatar: string } | null> {
    try {
      // Mock avatar upload - in real app, this would upload to storage
      console.warn('Uploading avatar:', file.name);
      return {
        avatar: '/placeholder-user.jpg'
      };
    } catch (_error) {
      console.error('Error uploading avatar:', _error);
      return null;
    }
  }

  async removeAvatar(): Promise<boolean> {
    try {
      // Mock avatar removal
      console.warn('Removing avatar');
      return true;
    } catch (_error) {
      console.error('Error removing avatar:', _error);
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Mock password change - in real app, this would call API
      console.warn('Changing password');
      if (!currentPassword || !newPassword) {
        throw new Error('Current and new passwords are required');
      }
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (_error) {
      console.error('Error changing password:', _error);
      throw _error;
    }
  }
}

const userService = new UserService();
export default userService;
