import apiClient from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  groupId?: number | null;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  roleId?: string; // optional explicit role UUID
  groupId?: number | null;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
  groupId?: number | null;
}

export interface UserPaginationResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class UserService {
  // ==== ADMIN LEVEL ====

  // Get all users
  public async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    groupId?: number;
  } = {}): Promise<UserPaginationResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.groupId) queryParams.append('groupId', params.groupId.toString());

    const url = `/users?${queryParams.toString()}`;
    return await apiClient.get(url);
  }

  // Get single user by ID
  public async getUser(id: string): Promise<{ user: User }> {
    return await apiClient.get(`/users/${id}`);
  }

  // Create user
  public async createUser(data: UserCreateData): Promise<{ message: string; user: User }> {
    // Debug log for role vs roleId usage
    console.warn('[UserService] createUser payload:', data);
    return await apiClient.post('/users', data);
  }

  // Update user
  public async updateUser(id: string, data: UserUpdateData): Promise<{ message: string; user: User }> {
    return await apiClient.put(`/users/${id}`, data);
  }

  // Delete user
  public async deleteUser(id: string): Promise<{ message: string }> {
    return await apiClient.delete(`/users/${id}`);
  }

  // ==== USER ITSELF ====

  // Get current user profile
  public async getCurrentUser(): Promise<{ user: User }> {
    try {
      const res = await apiClient.get('/users/me');
      if (typeof res === 'object' && res !== null) {
        if ('user' in res.data && res.data.user) {
          return { user: res.data.user as User };
        } else {
          return { user: res.data as User };
        }
      }
      throw new Error('Invalid response');
    } catch {
      // fallback ke /auth/me
      const res = await apiClient.get('/auth/me');
      if (typeof res === 'object' && res !== null) {
        if ('user' in res.data && res.data.user) {
          return { user: res.data.user as User };
        } else {
          return { user: res.data as User };
        }
      }
      throw new Error('Invalid response');
    }
  }

  // Update current user profile
  public async updateCurrentUser(data: Partial<User>): Promise<{ user: User }> {
  try {
    const res = await apiClient.patch<User | { user: User }>('/users/me', data);
    console.warn('[DEBUG] PATCH /users/me response:', res);
    if (typeof res === 'object' && res !== null) {
      if ('user' in res && res.user) {
        return { user: res.user as User };
      } else {
        return { user: res.data as User };
      }
    }
    throw new Error('Invalid response');
  } catch (e) {
    // Tampilkan error PATCH /users/me
    console.error('[ERROR] PATCH /users/me gagal:', e);

    // fallback ke /auth/profile
    try {
      const res = await apiClient.put('/auth/profile', data);
      console.warn('[DEBUG] PUT /auth/profile response:', res);
      if (typeof res === 'object' && res !== null) {
        if ('user' in res && res.user) {
          return { user: res.user as User };
        } else {
          return { user: res.data as User };
        }
      }
      throw new Error('Invalid response');
    } catch (err2) {
      console.error('[ERROR] PUT /auth/profile gagal:', err2);
      throw err2; // Biar muncul di UI
    }
  }
}

  // Update avatar
  public async updateAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const response = await apiClient.patch<{ avatar: string }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch {
      throw new Error('Failed to upload avatar');
    }
  }
  // Remove avatar
  public async removeAvatar(): Promise<{ avatar: string }> {
    try {
      const response = await apiClient.patch<{ avatar: string }>('/users/me/avatar', { avatar: '' });
      return response.data;
    } catch {
      throw new Error('Failed to remove avatar');
    }
  }

  // Change password
  public async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.patch<{ message: string }>('/users/me/password', { currentPassword, newPassword });
      return response.data;
    } catch {
      // fallback ke /auth/change-password
      return await apiClient.put('/auth/change-password', { currentPassword, newPassword });
    }
  }

  // Get account statistics
  public async getAccountStats(): Promise<{ qrCodesCreated: number; shortUrlsCreated: number; totalScans: number }> {
    return await apiClient.get(
      '/users/me/stats'
    );
  }
}

const instance = new UserService();

export default instance