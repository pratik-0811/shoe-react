const mongoose = require("mongoose");
const Product = require("./models/product.model");
require("dotenv").config();

// Sample product data
const products = [
  {
    name: "Premium Leather Handbag",
    price: 299,
    originalPrice: 399,
    image: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "bags",
    rating: 4.8,
    description: "Crafted from premium Italian leather, this handbag combines elegance with functionality.",
    features: ["Genuine Italian leather", "Multiple compartments", "Adjustable strap", "Premium hardware"],
    images: [
      "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1038000/pexels-photo-1038000.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true,
    badge: "Sale",
    reviews: [
      {
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
        userId: 2,
        userName: "Sarah Chen",
        userAvatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
        rating: 4,
        comment: "Great bag, very stylish and practical. Only wish it had one more interior pocket, but overall very satisfied with the purchase.",
        date: "2024-01-10",
        helpful: 8,
        verified: true
      }
    ]
  },
  {
    name: "Designer Watch Collection",
    price: 459,
    image: "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "watches",
    rating: 4.9,
    description: "Swiss precision meets modern design in this stunning timepiece.",
    features: ["Swiss movement", "Sapphire crystal", "Water resistant", "Premium steel"],
    images: [
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    inStock: true,
    badge: "New",
    reviews: [
      {
        userId: 4,
        userName: "David Kim",
        userAvatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100",
        rating: 5,
        comment: "This watch is incredible! The Swiss movement is so precise and the design is timeless. Worth every penny.",
        date: "2024-01-12",
        helpful: 20,
        verified: true
      }
    ]
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shoe-store")
  .then(async () => {
    console.log("MongoDB connection established successfully");
    
    try {
      // Clear existing products
      await Product.deleteMany({});
      console.log("Cleared existing products");
      
      // Insert new products
      const createdProducts = await Product.insertMany(products);
      console.log(`${createdProducts.length} products created successfully`);
      
      mongoose.connection.close();
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
