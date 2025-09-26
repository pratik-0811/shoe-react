import api from './api';
import { Order } from '../types';

class OrderService {
  private orders: Order[] = [];

  // Get all orders for the current user
  async getOrders(): Promise<Order[]> {
    try {
      const response = await api.get('/orders');
      this.orders = response.data;
      return this.orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return mock data as fallback
      return this.getMockOrders();
    }
  }

  // Get recent orders (last 5)
  async getRecentOrders(): Promise<Order[]> {
    try {
      const orders = await this.getOrders();
      return orders.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return this.getMockOrders().slice(0, 5);
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      // Fallback to local search
      const orders = await this.getOrders();
      return orders.find(order => order._id === orderId) || null;
    }
  }

  // Create a new order
  async createOrder(orderData: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      // Create mock order for fallback
      const mockOrder: Order = {
        _id: Date.now().toString(),
        userId: orderData.userId,
        items: orderData.items,
        total: orderData.total,
        status: orderData.status,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.orders.push(mockOrder);
      return mockOrder;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
    try {
      const response = await api.patch(`/orders/${orderId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      // Fallback to local update
      const orderIndex = this.orders.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        this.orders[orderIndex].status = status;
        this.orders[orderIndex].updatedAt = new Date().toISOString();
        return this.orders[orderIndex];
      }
      return null;
    }
  }

  // Get order count for user
  async getOrderCount(): Promise<number> {
    try {
      const orders = await this.getOrders();
      return orders.length;
    } catch (error) {
      console.error('Error getting order count:', error);
      return 0;
    }
  }

  // Mock data for fallback
  private getMockOrders(): Order[] {
    return [
      {
        _id: '1',
        userId: 'user1',
        items: [
          {
            productId: '1',
            name: 'Nike Air Max 270',
            price: 150,
            quantity: 1,
            image: '/images/nike-air-max-270.jpg'
          }
        ],
        total: 150,
        status: 'delivered',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'credit_card',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        userId: 'user1',
        items: [
          {
            productId: '2',
            name: 'Adidas Ultraboost 22',
            price: 180,
            quantity: 1,
            image: '/images/adidas-ultraboost-22.jpg'
          }
        ],
        total: 180,
        status: 'shipped',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'paypal',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

export default new OrderService();