const mongoose = require("mongoose");
const Product = require("./models/product.model");
const User = require("./models/user.model");
const Category = require("./models/category.model");
require("dotenv").config();

// Sample categories
const categories = [
  {
    name: "Running",
    slug: "running",
    description: "High-performance running shoes designed for comfort and speed",
    image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500",
    isActive: true,
    sortOrder: 1,
    seoTitle: "Running Shoes - Best Athletic Footwear",
    seoDescription: "Discover our collection of premium running shoes from top brands like Nike and Adidas."
  },
  {
    name: "Casual",
    slug: "casual",
    description: "Comfortable everyday shoes perfect for casual wear",
    image: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=500",
    isActive: true,
    sortOrder: 2,
    seoTitle: "Casual Shoes - Everyday Comfort",
    seoDescription: "Shop our casual shoe collection featuring classic styles and modern comfort."
  },
  {
    name: "Skateboarding",
    slug: "skateboarding",
    description: "Durable skate shoes built for performance and style",
    image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500",
    isActive: true,
    sortOrder: 3,
    seoTitle: "Skateboarding Shoes - Street Style",
    seoDescription: "Professional skateboarding shoes with superior grip and durability."
  },
  {
    name: "Boots",
    slug: "boots",
    description: "Sturdy and stylish boots for all occasions",
    image: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=500",
    isActive: true,
    sortOrder: 4,
    seoTitle: "Boots - Durable & Stylish Footwear",
    seoDescription: "Premium boots collection featuring leather construction and timeless designs."
  },
  {
    name: "Formal",
    slug: "formal",
    description: "Elegant formal shoes for business and special occasions",
    image: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=500",
    isActive: true,
    sortOrder: 5,
    seoTitle: "Formal Shoes - Professional Footwear",
    seoDescription: "Sophisticated formal shoes perfect for business meetings and special events."
  }
];

// Sample shoe product data
const products = [
  {
    name: "Nike Air Max 270",
    price: 12450,
    originalPrice: 14940,
    image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: null, // Will be set after categories are created
    brand: "Nike",
    rating: 4.5,
    description: "Experience ultimate comfort with Nike Air Max 270. Features the largest heel Air unit yet for incredible cushioning.",
    features: ["Air Max cushioning", "Breathable mesh upper", "Durable rubber outsole", "Lightweight design"],
    images: [
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [
      { size: "7", stock: 15 },
      { size: "7.5", stock: 12 },
      { size: "8", stock: 20 },
      { size: "8.5", stock: 18 },
      { size: "9", stock: 25 },
      { size: "9.5", stock: 22 },
      { size: "10", stock: 30 },
      { size: "10.5", stock: 15 },
      { size: "11", stock: 10 },
      { size: "12", stock: 8 }
    ],
    colors: [
      { name: "Black/White", hexCode: "#000000", stock: 50 },
      { name: "Navy/Blue", hexCode: "#1e3a8a", stock: 35 },
      { name: "Red/White", hexCode: "#dc2626", stock: 40 }
    ],
    material: "Synthetic/Mesh",
    gender: "Men",
    style: "Running",
    season: "All Season",
    inStock: true,
    countInStock: 125,
    isFeatured: true,
    badge: "Best Seller",

  },
  {
    name: "Adidas Ultraboost 22",
    price: 15770,
    originalPrice: 18260,
    image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: "Running",
    brand: "Adidas",
    rating: 4.7,
    description: "Revolutionary running shoe with responsive Boost midsole and Primeknit upper for ultimate performance.",
    features: ["Boost midsole", "Primeknit upper", "Continental rubber outsole", "Energy return"],
    images: [
      "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [
      { size: "6", stock: 8 },
      { size: "6.5", stock: 10 },
      { size: "7", stock: 15 },
      { size: "7.5", stock: 18 },
      { size: "8", stock: 22 },
      { size: "8.5", stock: 25 },
      { size: "9", stock: 30 },
      { size: "9.5", stock: 20 },
      { size: "10", stock: 15 },
      { size: "11", stock: 12 }
    ],
    colors: [
      { name: "Core Black", hexCode: "#000000", stock: 60 },
      { name: "Cloud White", hexCode: "#ffffff", stock: 45 },
      { name: "Solar Red", hexCode: "#ff4444", stock: 30 }
    ],
    material: "Primeknit/Boost",
    gender: "Unisex",
    style: "Running",
    season: "All Season",
    inStock: true,
    countInStock: 135,
    isFeatured: true,
    badge: "New",

  },
  {
    name: "Converse Chuck Taylor All Star",
    price: 5395,
    image: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: null, // Will be set after categories are created
    brand: "Converse",
    rating: 0,
    description: "Classic canvas sneaker that's been an icon for generations. Perfect for casual everyday wear.",
    features: ["Canvas upper", "Rubber toe cap", "Classic design", "Versatile style"],
    images: [
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [
      { size: "5", stock: 12 },
      { size: "6", stock: 15 },
      { size: "7", stock: 20 },
      { size: "8", stock: 25 },
      { size: "9", stock: 30 },
      { size: "10", stock: 22 },
      { size: "11", stock: 18 },
      { size: "12", stock: 10 }
    ],
    colors: [
      { name: "Classic Black", hexCode: "#000000", stock: 70 },
      { name: "Optical White", hexCode: "#ffffff", stock: 65 },
      { name: "Red", hexCode: "#dc2626", stock: 40 },
      { name: "Navy", hexCode: "#1e3a8a", stock: 35 }
    ],
    material: "Canvas",
    gender: "Unisex",
    style: "Casual",
    season: "All Season",
    inStock: true,
    countInStock: 210,
    isFeatured: false,
    badge: "Classic",

  },
  {
    name: "Vans Old Skool",
    price: 6225,
    image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: null, // Will be set after categories are created
    brand: "Vans",
    rating: 0,
    description: "The iconic Vans sidestripe skate shoe with durable canvas and suede uppers.",
    features: ["Signature waffle outsole", "Canvas and suede upper", "Padded collar", "Classic sidestripe"],
    images: [
      "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [
      { size: "6", stock: 10 },
      { size: "7", stock: 18 },
      { size: "8", stock: 25 },
      { size: "9", stock: 30 },
      { size: "10", stock: 28 },
      { size: "11", stock: 20 },
      { size: "12", stock: 12 }
    ],
    colors: [
      { name: "Black/White", hexCode: "#000000", stock: 55 },
      { name: "True White", hexCode: "#ffffff", stock: 45 },
      { name: "Checkerboard", hexCode: "#808080", stock: 35 }
    ],
    material: "Canvas/Suede",
    gender: "Unisex",
    style: "Skateboarding",
    season: "All Season",
    inStock: true,
    countInStock: 135,
    isFeatured: false,

  },
  {
    name: "Dr. Martens 1460 Boots",
    price: 14110,
    originalPrice: 16600,
    image: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=500",
    category: null, // Will be set after categories are created
    brand: "Dr. Martens",
    rating: 4.3,
    description: "The original Dr. Martens boot with iconic yellow stitching and air-cushioned sole.",
    features: ["Genuine leather", "Air-cushioned sole", "Yellow stitching", "Durable construction"],
    images: [
      "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    sizes: [
      { size: "6", stock: 8 },
      { size: "7", stock: 12 },
      { size: "8", stock: 15 },
      { size: "9", stock: 18 },
      { size: "10", stock: 20 },
      { size: "11", stock: 15 },
      { size: "12", stock: 10 }
    ],
    colors: [
      { name: "Black Smooth", hexCode: "#000000", stock: 45 },
      { name: "Cherry Red", hexCode: "#8b0000", stock: 35 },
      { name: "Brown", hexCode: "#8b4513", stock: 18 }
    ],
    material: "Leather",
    gender: "Unisex",
    style: "Boots",
    season: "Fall",
    inStock: true,
    countInStock: 98,
    isFeatured: true,
    badge: "Sale",

  }
];

// Default admin user
const defaultAdmin = {
  name: "Admin User",
  email: "admin@solewaale.com",
  password: "admin123",
  isAdmin: true,
  avatar: "https://ui-avatars.com/api/?name=Admin+User&background=1f2937&color=ffffff"
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shoe-store")
  .then(async () => {
    console.log("MongoDB connection established successfully");
    
    try {
      // Clear existing data
      await Product.deleteMany({});
      await User.deleteMany({});
      await Category.deleteMany({});
      console.log("Cleared existing data");
      
      // Create categories first
      const createdCategories = await Category.insertMany(categories);
      console.log(`${createdCategories.length} categories created successfully`);
      
      // Create a map of category names to IDs
      const categoryMap = {};
      createdCategories.forEach(cat => {
        categoryMap[cat.name] = cat._id;
      });
      
      // Update products with category IDs
      const updatedProducts = products.map(product => {
        let categoryName;
        if (product.name.includes('Nike Air Max') || product.name.includes('Adidas Ultraboost')) {
          categoryName = 'Running';
        } else if (product.name.includes('Converse Chuck Taylor')) {
          categoryName = 'Casual';
        } else if (product.name.includes('Vans Old Skool')) {
          categoryName = 'Skateboarding';
        } else if (product.name.includes('Dr. Martens')) {
          categoryName = 'Boots';
        } else {
          categoryName = 'Casual'; // Default fallback
        }
        
        return {
          ...product,
          category: categoryMap[categoryName]
        };
      });
      
      // Create default admin user
      const adminUser = new User(defaultAdmin);
      await adminUser.save();
      console.log("Default admin user created:");
      console.log("Email: admin@solewaale.com");
      console.log("Password: admin123");
      
      // Insert new products with category references
      const createdProducts = await Product.insertMany(updatedProducts);
      console.log(`${createdProducts.length} products created successfully`);
      
      console.log("\nCategories created:");
      createdCategories.forEach(cat => {
        console.log(`- ${cat.name} (${cat.slug})`);
      });
      
      mongoose.connection.close();
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
