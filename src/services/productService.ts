import api from './api';
import { Product, Review, Category } from '../types';

class ProductService {
  async getAllProducts(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data.products || response.data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get('/products/featured');
    return response.data.products || response.data;
  }

  async getNewArrivals(): Promise<Product[]> {
    const response = await api.get('/products/new-arrivals');
    return response.data.products || response.data;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await api.get(`/products/category/${category}`);
    return response.data.products || response.data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await api.get(`/products/search?q=${query}`);
    return response.data.products || response.data;
  }

  async addReview(productId: string, reviewData: Omit<Review, '_id' | 'date' | 'helpful'>): Promise<Product> {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/products/categories');
    return response.data;
  }
}

export default new ProductService();