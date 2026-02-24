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
  public async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ category: Category }> {
    return apiClient.post('/categories', category);
  }

  // Update an existing category
  public async updateCategory(id: string, category: Partial<Category>): Promise<{ category: Category }> {
    return apiClient.put(`/categories/${id}`, category);
  }

  // Delete a category
  public async deleteCategory(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/categories/${id}`);
  }
}

const instance = new CategoryService();

export default instance