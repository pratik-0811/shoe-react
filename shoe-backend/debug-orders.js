const mongoose = require('mongoose');
const Order = require('./models/order.model');
const Product = require('./models/product.model');
require('dotenv').config();

async function debugOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testUserId = '68c2d1e3275219fad5ca631e';
    
    // Get the user's orders with full details
    const orders = await Order.find({ user: testUserId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(); // Use lean() to get raw data
    
    console.log('=== DEBUG: User Orders ===');
    console.log('Total orders found:', orders.length);
    
    orders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1} ---`);
      console.log('Order ID:', order._id);
      console.log('Created:', order.createdAt);
      console.log('Items count:', order.items.length);
      
      order.items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`);
        console.log('    Product ID:', item.product);
        console.log('    Name:', item.name);
        console.log('    Size:', item.size, '(type:', typeof item.size, ')');
        console.log('    Color:', item.color, '(type:', typeof item.color, ')');
        console.log('    Quantity:', item.quantity);
        console.log('    Price:', item.price);
      });
    });
    
    // Also check what the recommendation service would extract
    if (orders.length > 0) {
      const lastOrder = orders[0];
      console.log('\n=== RECOMMENDATION EXTRACTION TEST ===');
      
      const sizes = [];
      const colors = [];
      
      lastOrder.items.forEach(item => {
        if (item.size && item.size.trim()) {
          sizes.push(item.size.trim());
        }
        if (item.color && item.color.trim()) {
          colors.push(item.color.trim());
        }
      });
      
      console.log('Extracted sizes:', sizes);
      console.log('Extracted colors:', colors);
      console.log('Would return empty?', sizes.length === 0 && colors.length === 0);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugOrders();