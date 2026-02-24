import apiClient from './apiClient';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

class CategoryService {
  // Get all categories
  public async getCategories(): Promise<{ categories: Category[] }> {
    return apiClient.get('/categories');
  }

  // Get a single category by ID
  public async getCategory(id: string): Promise<{ category: Category }> {
    return apiClient.get(`/categories/${id}`);
  }

  // Create a new category
  public async createCategory(data: CategoryCreateData): Promise<{ message: string; category: Category }> {
    return apiClient.post('/categories', data);
  }

  // Update an existing category
  public async updateCategory(id: string, data: CategoryUpdateData): Promise<{ message: string; category: Category }> {
    return apiClient.put(`/categories/${id}`, data);
  }

  // Delete a category
  public async deleteCategory(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/categories/${id}`);
  }
}

const instance = new CategoryService();

export default instance