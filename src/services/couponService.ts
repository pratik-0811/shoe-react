import api from './api';
import { Coupon, AppliedCoupon } from '../types';

interface CouponResponse {
  success: boolean;
  data: Coupon[];
  message?: string;
}

interface SingleCouponResponse {
  success: boolean;
  data: Coupon;
  message?: string;
}

interface CouponValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    message?: string;
  };
  message?: string;
}

interface CouponStatsResponse {
  success: boolean;
  data: {
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscount: number;
    topCoupons: Array<{
      coupon: Coupon;
      usageCount: number;
      totalDiscount: number;
    }>;
  };
}

class CouponService {
  // Get all coupons (admin only)
  async getAllCoupons(page = 1, limit = 10, filters?: { status?: string; type?: string }): Promise<{
    coupons: Coupon[];
    pagination: { page: number; totalPages: number; total: number };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type })
      });

      const response = await api.get<CouponResponse & { pagination: any }>(`/coupons/admin?${params}`);
      // Ensure we always return an array for coupons
      const coupons = response.data.data?.coupons || response.data.data || [];
      return {
        coupons: Array.isArray(coupons) ? coupons : [],
        pagination: response.data.pagination || { page: 1, totalPages: 1, total: 0 }
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }

  // Get active coupons for users
  async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const response = await api.get<CouponResponse>('/coupons/active');
      const coupons = response.data.data || [];
      return Array.isArray(coupons) ? coupons : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active coupons');
    }
  }

  // Get coupon by ID
  async getCouponById(couponId: string): Promise<Coupon> {
    try {
      const response = await api.get<SingleCouponResponse>(`/coupons/${couponId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch coupon');
    }
  }

  // Create a new coupon (admin only)
  async createCoupon(couponData: Omit<Coupon, '_id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    try {
      const response = await api.post<SingleCouponResponse>('/coupons/admin', couponData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create coupon');
    }
  }

  // Update a coupon (admin only)
  async updateCoupon(couponId: string, couponData: Partial<Coupon>): Promise<Coupon> {
    try {
      const response = await api.put<SingleCouponResponse>(`/coupons/admin/${couponId}`, couponData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update coupon');
    }
  }

  // Delete a coupon (admin only)
  async deleteCoupon(couponId: string): Promise<void> {
    try {
      await api.delete(`/coupons/admin/${couponId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete coupon');
    }
  }

  // Validate and apply coupon
  async validateCoupon(couponCode: string, orderTotal: number, items?: any[]): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    message?: string;
  }> {
    try {
      const response = await api.post<CouponValidationResponse>('/coupons/validate', {
        code: couponCode,
        orderTotal,
        items
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate coupon');
    }
  }

  // Apply coupon to order
  async applyCouponToOrder(orderId: string, couponCode: string): Promise<AppliedCoupon> {
    try {
      const response = await api.post<{ success: boolean; data: AppliedCoupon }>(
        `/orders/${orderId}/apply-coupon`,
        { couponCode }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to apply coupon');
    }
  }

  // Remove coupon from order
  async removeCouponFromOrder(orderId: string, couponId: string): Promise<void> {
    try {
      await api.delete(`/orders/${orderId}/remove-coupon/${couponId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove coupon');
    }
  }

  // Get coupon usage history (admin only)
  async getCouponUsage(couponId: string): Promise<{
    data: Array<{
      _id: string;
      user: {
        name: string;
        email: string;
      };
      order: {
        orderNumber: string;
        totalAmount: number;
      };
      discountAmount: number;
      usedAt: string;
    }>;
  }> {
    try {
      const response = await api.get(`/coupons/admin/${couponId}/stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch coupon usage');
    }
  }

  // Get coupon statistics (admin only)
  async getCouponStats(): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscount: number;
    topCoupons: Array<{
      coupon: Coupon;
      usageCount: number;
      totalDiscount: number;
    }>;
  }> {
    try {
      const response = await api.get<CouponStatsResponse>('/coupons/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch coupon statistics');
    }
  }

  // Calculate discount amount
  calculateDiscount(coupon: Coupon, orderTotal: number): number {
    if (!coupon.isActive || new Date(coupon.expiryDate) < new Date()) {
      return 0;
    }

    if (coupon.minPurchaseAmount && orderTotal < coupon.minPurchaseAmount) {
      return 0;
    }

    let discount = 0;
    if (coupon.type === 'flat') {
      discount = coupon.value;
    } else if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
    }

    // Apply maximum discount limit if specified
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }

    return Math.min(discount, orderTotal);
  }

  // Validate coupon data
  validateCouponData(coupon: Partial<Coupon>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!coupon.code?.trim()) {
      errors.push('Coupon code is required');
    } else if (coupon.code.length < 3) {
      errors.push('Coupon code must be at least 3 characters');
    }

    if (!coupon.type) {
      errors.push('Coupon type is required');
    }

    if (coupon.value === undefined || coupon.value <= 0) {
      errors.push('Coupon value must be greater than 0');
    }

    if (coupon.type === 'percentage' && coupon.value && coupon.value > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }

    if (!coupon.expiryDate) {
      errors.push('Expiry date is required');
    } else if (new Date(coupon.expiryDate) <= new Date()) {
      errors.push('Expiry date must be in the future');
    }

    if (coupon.usageLimit !== undefined && coupon.usageLimit < 1) {
      errors.push('Usage limit must be at least 1');
    }

    if (coupon.minPurchaseAmount !== undefined && coupon.minPurchaseAmount < 0) {
      errors.push('Minimum purchase amount cannot be negative');
    }

    if (coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount <= 0) {
      errors.push('Maximum discount amount must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format coupon for display
  formatCouponForDisplay(coupon: Coupon): string {
    if (coupon.type === 'flat') {
      return `₹${coupon.value} off`;
    } else {
      return `${coupon.value}% off`;
    }
  }

  // Check if coupon is expired
  isCouponExpired(coupon: Coupon): boolean {
    return new Date(coupon.expiryDate) < new Date();
  }

  // Check if coupon usage limit is reached
  isUsageLimitReached(coupon: Coupon): boolean {
    return coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit;
  }
}

const couponService = new CouponService();
export default couponService;