const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true,
    maxlength: [100, "Category name cannot exceed 100 characters"] 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: [500, "Description cannot exceed 500 characters"] 
  },
  image: { 
    type: String, 
    default: null 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  sortOrder: { 
    type: Number, 
    default: 0 
  },
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    default: null 
  },
  seoTitle: { 
    type: String, 
    trim: true, 
    maxlength: [60, "SEO title cannot exceed 60 characters"] 
  },
  seoDescription: { 
    type: String, 
    trim: true, 
    maxlength: [160, "SEO description cannot exceed 160 characters"] 
  }
}, {
  timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes for better performance
// Note: slug already has unique index from schema definition
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;