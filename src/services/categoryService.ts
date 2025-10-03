import { api } from './api';
import { Category } from '../types';

export interface HierarchicalCategory extends Category {
  subcategories: HierarchicalCategory[];
  productCount?: number;
}

class CategoryService {
  // Get all categories (flat structure)
  async getAllCategories(active: boolean = true, includeProducts: boolean = false): Promise<Category[]> {
    try {
      const params: any = {};
      if (active) params.active = 'true';
      if (includeProducts) params.includeProducts = 'true';
      
      const response = await api.get('/categories', { params });
      return response.data.categories || response.data || [];
    } catch (error) {
  
      return [];
    }
  }

  // Get hierarchical categories with subcategories
  async getHierarchicalCategories(active: boolean = true, includeProducts: boolean = false): Promise<HierarchicalCategory[]> {
    try {
      const params: any = {};
      if (active) params.active = 'true';
      if (includeProducts) params.includeProducts = 'true';
      
      const response = await api.get('/categories/hierarchical', { params });
      return response.data.categories || response.data || [];
    } catch (error) {
  
      return [];
    }
  }

  // Get category by ID or slug
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.category || null;
    } catch (error) {
  
      return null;
    }
  }

  // Get featured categories (for header display)
  async getFeaturedCategories(limit: number = 6): Promise<HierarchicalCategory[]> {
    try {
      const categories = await this.getHierarchicalCategories(true, true);
      return categories.slice(0, limit);
    } catch (error) {
  
      return [];
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;