// Test script to verify frontend-backend integration
import axios from 'axios';

async function testIntegration() {
  console.log('Testing frontend-backend integration...');
  
  try {
    // Test 1: Check if backend is responding
    console.log('\n1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/api/products');
    console.log('✅ Backend is responding');
    
    // Test 2: Test trending recommendations (should return empty)
    console.log('\n2. Testing trending recommendations...');
    const trendingResponse = await axios.get('http://localhost:5000/api/recommendations/trending');
    const trendingData = trendingResponse.data;
    
    if (trendingData.success && 
        trendingData.data.recommendedProducts.length === 0 && 
        trendingData.data.recommendationType === 'no-trending') {
      console.log('✅ Trending recommendations working correctly (empty as expected)');
    } else {
      console.log('❌ Trending recommendations not working as expected');
      console.log('Response:', JSON.stringify(trendingData, null, 2));
    }
    
    // Test 3: Test categories endpoint
    console.log('\n3. Testing categories endpoint...');
    const categoriesResponse = await axios.get('http://localhost:5000/api/categories');
    if (categoriesResponse.data.success && categoriesResponse.data.categories.length > 0) {
      console.log('✅ Categories endpoint working correctly');
    } else {
      console.log('❌ Categories endpoint not working');
    }
    
    // Test 4: Test products endpoint
    console.log('\n4. Testing products endpoint...');
    const productsResponse = await axios.get('http://localhost:5000/api/products');
    if (productsResponse.data.products && productsResponse.data.products.length > 0) {
      console.log('✅ Products endpoint working correctly');
      
      // Check if products have rating 0 (no dummy data)
      const firstProduct = productsResponse.data.products[0];
      if (firstProduct.rating === 0) {
        console.log('✅ Dummy data successfully removed (rating = 0)');
      } else {
        console.log('⚠️  Product rating:', firstProduct.rating);
      }
    } else {
      console.log('❌ Products endpoint not working');
    }
    
    console.log('\n🎉 Integration test completed!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testIntegration();