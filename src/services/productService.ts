import api from './api';
import { Product, Review } from '../types';

class ProductService {
  async getAllProducts(): Promise<Product[]> {
    try {
      return await api.get('/products');
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      return products;
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      return await api.get(`/products/${id}`);
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      const product = products.find(p => p._id === id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      return await api.get('/products?featured=true');
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      return products.filter(p => p.badge === 'Popular' || p.badge === 'Sale').slice(0, 4);
    }
  }

  async getNewArrivals(): Promise<Product[]> {
    try {
      return await api.get('/products?sort=createdAt&limit=8');
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      return products.filter(p => p.badge === 'New').slice(0, 4);
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      return await api.get(`/products?category=${category}`);
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      return products.filter(p => p.category === category);
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      return await api.get(`/products?search=${query}`);
    } catch (error) {
      // Fallback to local data
      const { products } = await import('../data/products');
      const lowercaseQuery = query.toLowerCase();
      return products.filter(p => 
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery) ||
        p.category.toLowerCase().includes(lowercaseQuery)
      );
    }
  }

  async addReview(productId: string, reviewData: Omit<Review, '_id' | 'date' | 'helpful'>): Promise<Product> {
    return api.post(`/products/${productId}/reviews`, reviewData);
  }

  // For demo purposes - fallback to local data if API is not available
  async getFallbackProducts(): Promise<Product[]> {
    try {
      const response = await import('../data/products');
      return response.default;
    } catch (error) {
      console.error('Error loading fallback products:', error);
      return [];
    }
  }
}

export default new ProductService();