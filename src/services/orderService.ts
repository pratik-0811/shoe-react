import api from './api';
import { Order } from '../types';

class OrderService {
  private orders: Order[] = [];

  // Get all orders for the current user
  async getOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string; 
  }): Promise<{ orders: Order[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const response = await api.get(`/orders/my-orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    
    // Handle paginated response from backend
    if (response.data && response.data.orders && Array.isArray(response.data.orders)) {
      this.orders = response.data.orders;
      return {
        orders: response.data.orders,
        total: response.data.total || response.data.orders.length
      };
    } else {
      // Fallback for unexpected response format
      return {
        orders: [],
        total: 0
      };
    }
  }

  // Get recent orders (last 5)
  async getRecentOrders(): Promise<Order[]> {
    const result = await this.getOrders({ limit: 5 });
    return result.orders;
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  }

  // Create a new order
  async createOrder(orderData: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const response = await api.post('/orders', orderData);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
    const response = await api.patch(`/orders/${orderId}`, { status });
    return response.data;
  }

  // Get order count for user
  async getOrderCount(): Promise<number> {
    const result = await this.getOrders();
    return result.total;
  }

  async downloadInvoice(orderId: string): Promise<any> {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response.data.invoice;
  }


}

export default new OrderService();