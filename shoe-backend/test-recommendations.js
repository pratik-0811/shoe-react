const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Order = require('./models/order.model');
const Product = require('./models/product.model');
require('dotenv').config();

// Test the recommendations fix
async function testRecommendations() {
  try {
    console.log('Testing recommendation system fix...');
    
    // Connect to MongoDB to check user orders
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create a test JWT token with actual user ID from database
    const testUserId = '68c2d1e3275219fad5ca631e';
    const testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Test token created for user:', testUserId);
    
    // Check if user has any orders
    console.log('\n--- Checking user orders in database ---');
    const userOrders = await Order.find({ user: testUserId }).populate('items.product');
    console.log('User orders found:', userOrders.length);
    
    if (userOrders.length > 0) {
      console.log('Sample order items:');
      userOrders[0].items.forEach((item, index) => {
        console.log(`  Item ${index + 1}: size=${item.size}, color=${item.color}, name=${item.name}`);
      });
    }
    
    // Test 1: User recommendations
    console.log('\n1. Testing user recommendations...');
    try {
      const userResponse = await axios.get('http://localhost:5000/api/recommendations/user', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log('User recommendations response:', JSON.stringify(userResponse.data, null, 2));
    } catch (error) {
      console.log('User recommendations error:', error.response?.data || error.message);
    }
    
    // Test 2: Enhanced recommendations with existing category
    console.log('\n2. Testing enhanced recommendations with category "casual"...');
    try {
      const enhancedResponse = await axios.get('http://localhost:5000/api/recommendations/enhanced?category=casual', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log('Enhanced recommendations response:', JSON.stringify(enhancedResponse.data, null, 2));
    } catch (error) {
      console.log('Enhanced recommendations error:', error.response?.data || error.message);
    }
    
    // Test 3: Enhanced recommendations without category
    console.log('\n3. Testing enhanced recommendations without category...');
    try {
      const enhancedNoCategory = await axios.get('http://localhost:5000/api/recommendations/enhanced', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log('Enhanced (no category) recommendations response:', JSON.stringify(enhancedNoCategory.data, null, 2));
    } catch (error) {
      console.log('Enhanced (no category) recommendations error:', error.response?.data || error.message);
    }
    
    // Test 4: Default recommendations (no auth)
    console.log('\n4. Testing default recommendations...');
    try {
      const defaultResponse = await axios.get('http://localhost:5000/api/recommendations/default');
      console.log('Default recommendations response:', JSON.stringify(defaultResponse.data, null, 2));
    } catch (error) {
      console.log('Default recommendations error:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Recommendation tests completed!');
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testRecommendations();