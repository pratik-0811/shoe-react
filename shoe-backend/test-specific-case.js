const mongoose = require('mongoose');
const RecommendationService = require('./services/recommendationService');
require('dotenv').config();

async function testSpecificCase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const testUserId = '68c2d1e3275219fad5ca631e';
    
    console.log('=== Testing getRecommendationsForUser directly ===');
    
    // Call the service method directly
    const result = await RecommendationService.getRecommendationsForUser(testUserId);
    
    console.log('Direct service call result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Let's also test the enhanced recommendations
    console.log('\n=== Testing getEnhancedRecommendations directly ===');
    
    const enhancedResult = await RecommendationService.getEnhancedRecommendations(testUserId, null, null);
    
    console.log('Enhanced recommendations result:');
    console.log(JSON.stringify(enhancedResult, null, 2));
    
    // Test with existing category
    console.log('\n=== Testing getEnhancedRecommendations with category "casual" ===');
    
    const enhancedWithCategory = await RecommendationService.getEnhancedRecommendations(testUserId, null, 'casual');
    
    console.log('Enhanced with category result:');
    console.log(JSON.stringify(enhancedWithCategory, null, 2));
    
    // Test with another existing category
    console.log('\n=== Testing getEnhancedRecommendations with category "running" ===');
    
    const enhancedWithRunning = await RecommendationService.getEnhancedRecommendations(testUserId, null, 'running');
    
    console.log('Enhanced with running category result:');
    console.log(JSON.stringify(enhancedWithRunning, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSpecificCase();