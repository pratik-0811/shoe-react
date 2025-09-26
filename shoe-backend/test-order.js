const mongoose = require('mongoose');
const Order = require('./models/order.model');
const User = require('./models/user.model');
const Product = require('./models/product.model');

async function createTestOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoe-store');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({email: 'test@example.com'});
    if (!user) {
      console.log('Test user not found');
      process.exit(1);
    }
    console.log('Found user:', user.email, user._id);
    
    const products = await Product.find().limit(2);
    if (products.length === 0) {
      console.log('No products found');
      process.exit(1);
    }
    console.log('Found products:', products.length);
    
    // Check if user already has orders
    const existingOrders = await Order.find({user: user._id});
    console.log('Existing orders for user:', existingOrders.length);
    
    const testOrder = new Order({
      user: user._id,
      items: [{
        product: products[0]._id,
        quantity: 1,
        size: 'M',
        color: 'Black',
        price: products[0].price
      }],
      totalAmount: products[0].price,
      status: 'delivered',
      shippingAddress: {
        street: 'Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'card',
      paymentStatus: 'completed'
    });
    
    await testOrder.save();
    console.log('Test order created successfully:', testOrder._id);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createTestOrder();