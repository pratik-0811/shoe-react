export interface Size {
  _id?: string;
  size: string;
  stock: number;
}

export interface Color {
  _id?: string;
  name: string;
  hexCode: string;
  stock: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder?: number;
  parentCategory?: string | Category;
  seoTitle?: string;
  seoDescription?: string;
  subcategories?: Category[];
  productCount?: number;
  featured?: boolean;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  discounted_price?: number;
  originalPrice?: number;
  image: string;
  category: Category | string;
  brand?: string;
  rating: number;
  numReviews: number;
  reviews: Review[];
  description: string;
  features: string[];
  images: string[];
  sizes?: Size[];
  colors?: Color[];
  material?: string;
  gender?: string;
  style?: string;
  season?: string;
  inStock: boolean;
  countInStock?: number;
  isFeatured?: boolean;
  badge?: string;
  labels?: string[]; // Support for multiple dynamic labels
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id?: string;
  type: 'home' | 'office' | 'other';
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  description?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  orders?: number;
  joinDate?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  price?: number;
}

export interface Cart {
  _id?: string;
  user?: string;
  items: CartItem[];
  total?: number;
  totalPrice?: number;
  totalItems?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  userJoinDate?: string;
  userOrderCount?: number;
  userIsVerified?: boolean;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  timeAgo?: string;
  helpful: number;
  verified: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  quantity: number;
  price: number;
  name: string;
  image: string;
  size?: string;
  color?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AppliedCoupon {
  coupon: string | Coupon;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  discountAmount: number;
  appliedAt: string;
}

export interface Order {
  _id: string;
  user: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentDetails?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    amount?: number;
    currency?: string;
    method?: string;
    paidAt?: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingCost: number;
  tax: number;
  appliedCoupons?: AppliedCoupon[];
  totalDiscount: number;
  total: number;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}