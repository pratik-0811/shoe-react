export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  images: string[];
  inStock: boolean;
  badge?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  orders: number;
  joinDate: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}