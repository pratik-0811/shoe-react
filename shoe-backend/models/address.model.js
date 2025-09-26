const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['home', 'office', 'other'],
    lowercase: true,
    default: 'home'
  },
  label: {
    type: String,
    trim: true,
    maxlength: [50, "Address label cannot exceed 50 characters"],
    default: function() {
      return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, "Full name must be at least 2 characters long"],
    maxlength: [100, "Full name cannot exceed 100 characters"]
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number"]
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, "Address line 1 cannot exceed 200 characters"]
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, "Address line 2 cannot exceed 200 characters"]
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, "Landmark cannot exceed 100 characters"]
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, "City cannot exceed 50 characters"]
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, "State cannot exceed 50 characters"]
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    match: [/^[0-9]{6}$/, "Please enter a valid 6-digit postal code"]
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, "Country cannot exceed 50 characters"],
    default: 'India'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
addressSchema.index({ user: 1 }); // User addresses lookup
addressSchema.index({ user: 1, isDefault: 1 }); // Default address lookup
addressSchema.index({ user: 1, isActive: 1 }); // Active addresses lookup
addressSchema.index({ user: 1, type: 1 }); // Address type filtering

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default flag from other addresses of the same user
    await mongoose.model('Address').updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

// Ensure at least one address is default if it's the first address
addressSchema.pre('save', async function(next) {
  if (this.isNew) {
    const addressCount = await mongoose.model('Address').countDocuments({ 
      user: this.user,
      isActive: true 
    });
    
    // If this is the first address, make it default
    if (addressCount === 0) {
      this.isDefault = true;
    }
  }
  next();
});

// Virtual for formatted address
addressSchema.virtual('formattedAddress').get(function() {
  let address = this.addressLine1;
  
  if (this.addressLine2) {
    address += ', ' + this.addressLine2;
  }
  
  if (this.landmark) {
    address += ', Near ' + this.landmark;
  }
  
  address += ', ' + this.city + ', ' + this.state + ' - ' + this.postalCode;
  
  if (this.country && this.country !== 'India') {
    address += ', ' + this.country;
  }
  
  return address;
});

// Virtual for short address (for display in lists)
addressSchema.virtual('shortAddress').get(function() {
  return `${this.addressLine1}, ${this.city}, ${this.state} - ${this.postalCode}`;
});

// Method to get address for shipping
addressSchema.methods.getShippingAddress = function() {
  return {
    fullName: this.fullName,
    phone: this.phone,
    address: this.formattedAddress,
    city: this.city,
    state: this.state,
    postalCode: this.postalCode,
    country: this.country
  };
};

// Static method to get user's default address
addressSchema.statics.getDefaultAddress = function(userId) {
  return this.findOne({ 
    user: userId, 
    isDefault: true, 
    isActive: true 
  });
};

// Static method to get all user addresses
addressSchema.statics.getUserAddresses = function(userId, activeOnly = true) {
  const query = { user: userId };
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ isDefault: -1, createdAt: -1 });
};

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;