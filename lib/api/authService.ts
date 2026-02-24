import apiClient from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  // Login user
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials);
  }

  // Logout user
  public async logout(): Promise<{ message: string }> {
    return apiClient.post('/auth/logout');
  }

  // Get current user
  public async getCurrentUser(): Promise<{ user: User }> {
    return apiClient.get('/auth/me');
  }

  // Update user profile
  public async updateProfile(data: ProfileUpdateData): Promise<{ message: string; user: User }> {
    return apiClient.put('/auth/profile', data);
  }

  // Change password
  public async changePassword(data: PasswordChangeData): Promise<{ message: string }> {
    return apiClient.put('/auth/change-password', data);
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Get stored user
  public getUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  // Store authentication data
  public setAuthData(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Clear authentication data
  public clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
}

const instance = new AuthService();

export default instance