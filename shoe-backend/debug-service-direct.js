const mongoose = require('mongoose');
const recommendationService = require('./services/recommendationService');
require('dotenv').config();

// Test the service methods directly
async function testServiceDirect() {
  try {
    console.log('Testing recommendation service methods directly...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testUserId = '68c2d1e3275219fad5ca631e';
    
    console.log('\n--- Testing getRecommendationsForUser directly ---');
    const userRecs = await recommendationService.getRecommendationsForUser(testUserId);
    console.log('Direct service result:', JSON.stringify(userRecs, null, 2));
    
    console.log('\n--- Testing getEnhancedRecommendations directly ---');
    const enhancedRecs = await recommendationService.getEnhancedRecommendations(testUserId, null, 'casual');
    console.log('Direct enhanced result:', JSON.stringify(enhancedRecs, null, 2));
    
    console.log('\n--- Testing getDefaultRecommendations directly ---');
    const defaultRecs = recommendationService.getDefaultRecommendations();
    console.log('Direct default result:', JSON.stringify(defaultRecs, null, 2));
    
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testServiceDirect();