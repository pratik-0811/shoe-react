import { Product, Review } from '../types';

export const reviews: { [productId: number]: Review[] } = {
  1: [
    {
      id: 1,
      userId: 1,
      userName: "Emma Wilson",
      userAvatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      comment: "Absolutely love this handbag! The quality is exceptional and it goes with everything. The leather is so soft and the craftsmanship is top-notch.",
      date: "2024-01-15",
      helpful: 12,
      verified: true
    },
    {
      id: 2,
      userId: 2,
      userName: "Sarah Chen",
      userAvatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 4,
      comment: "Great bag, very stylish and practical. Only wish it had one more interior pocket, but overall very satisfied with the purchase.",
      date: "2024-01-10",
      helpful: 8,
      verified: true
    },
    {
      id: 3,
      userId: 3,
      userName: "Michael Rodriguez",
      userAvatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      comment: "Bought this as a gift for my wife and she absolutely loves it! Fast shipping and excellent packaging too.",
      date: "2024-01-05",
      helpful: 15,
      verified: true
    }
  ],
  2: [
    {
      id: 4,
      userId: 4,
      userName: "David Kim",
      userAvatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      comment: "This watch is incredible! The Swiss movement is so precise and the design is timeless. Worth every penny.",
      date: "2024-01-12",
      helpful: 20,
      verified: true
    },
    {
      id: 5,
      userId: 5,
      userName: "Lisa Thompson",
      userAvatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 4,
      comment: "Beautiful watch with excellent build quality. The only minor issue is that it's a bit heavy, but that also speaks to its solid construction.",
      date: "2024-01-08",
      helpful: 6,
      verified: true
    }
  ]
};

export const products: Product[] = [
  {
    id: 1,
    name: "Premium Leather Handbag",
    price: 299,
    originalPrice: 399,
    image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "bags",
    rating: 4.8,
    reviews: 124,
    description: "Crafted from premium Italian leather, this handbag combines elegance with functionality.",
    features: ["Genuine Italian leather", "Multiple compartments", "Adjustable strap", "Premium hardware"],
    images: [
      "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1038000/pexels-photo-1038000.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true,
    badge: "Sale"
  },
  {
    id: 2,
    name: "Designer Watch Collection",
    price: 459,
    image: "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "watches",
    rating: 4.9,
    reviews: 89,
    description: "Swiss precision meets modern design in this stunning timepiece.",
    features: ["Swiss movement", "Sapphire crystal", "Water resistant", "Premium steel"],
    images: [
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true,
    badge: "New"
  },
  {
    id: 3,
    name: "Artisan Coffee Mug Set",
    price: 89,
    originalPrice: 120,
    image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "home",
    rating: 4.6,
    reviews: 267,
    description: "Handcrafted ceramic mugs perfect for your morning coffee ritual.",
    features: ["Handcrafted ceramic", "Set of 4", "Dishwasher safe", "Unique glazing"],
    images: [
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true
  },
  {
    id: 4,
    name: "Minimalist Desk Lamp",
    price: 159,
    image: "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "home",
    rating: 4.7,
    reviews: 156,
    description: "Clean lines and warm lighting for the perfect workspace ambiance.",
    features: ["LED technology", "Adjustable brightness", "USB charging", "Modern design"],
    images: [
      "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true,
    badge: "Popular"
  },
  {
    id: 5,
    name: "Vintage Camera Collection",
    price: 799,
    originalPrice: 999,
    image: "https://images.pexels.com/photos/225157/pexels-photo-225157.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "electronics",
    rating: 4.9,
    reviews: 43,
    description: "Capture memories with this beautifully restored vintage camera.",
    features: ["Fully restored", "Original lens", "Leather case included", "Collector's item"],
    images: [
      "https://images.pexels.com/photos/225157/pexels-photo-225157.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/191160/pexels-photo-191160.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: false,
    badge: "Limited"
  },
  {
    id: 6,
    name: "Organic Cotton T-Shirt",
    price: 45,
    image: "https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "clothing",
    rating: 4.5,
    reviews: 312,
    description: "Sustainable fashion meets comfort in this organic cotton essential.",
    features: ["100% organic cotton", "Fair trade", "Pre-shrunk", "Multiple colors"],
    images: [
      "https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1054777/pexels-photo-1054777.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true
  }
];

export const categories = [
  { id: 'all', name: 'All Products', count: products.length },
  { id: 'bags', name: 'Bags', count: products.filter(p => p.category === 'bags').length },
  { id: 'watches', name: 'Watches', count: products.filter(p => p.category === 'watches').length },
  { id: 'home', name: 'Home & Living', count: products.filter(p => p.category === 'home').length },
  { id: 'electronics', name: 'Electronics', count: products.filter(p => p.category === 'electronics').length },
  { id: 'clothing', name: 'Clothing', count: products.filter(p => p.category === 'clothing').length },
];