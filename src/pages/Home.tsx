import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, HeadphonesIcon, Loader, AlertCircle, Quote, Award, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveGrid from '../components/ResponsiveGrid';
import ReviewSlider from '../components/ReviewSlider';
import SEO from '../components/SEO';
import productService from '../services/productService';
import newsletterService from '../services/newsletterService';
import { Product } from '../types';
import { usePerformanceMonitor, usePageView } from '../hooks/usePerformanceMonitor';

const Home = React.memo(() => {
  const { trackUserInteraction, trackApiCall } = usePerformanceMonitor('Home');
  usePageView('Home');
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  
  const features = useMemo(() => [
    { icon: Shield, title: 'Premium Materials', description: 'Genuine leather, breathable fabrics & eco-friendly materials' },
    { icon: Truck, title: 'Free Shipping', description: 'Free delivery on orders over ₹1000 across India' },
    { icon: HeadphonesIcon, title: 'Perfect Fit Guarantee', description: 'Free size exchange within 30 days if not satisfied' },
    { icon: Award, title: 'Quality Assurance', description: '2-year warranty on all premium footwear' },
    { icon: Users, title: 'Expert Craftsmanship', description: 'Handcrafted by skilled artisans with 20+ years experience' },
  ], []);

  const testimonials = useMemo(() => [
    {
      name: 'Sarah Johnson',
      role: 'Marathon Runner',
      image: '/assets/avatar-1.svg',
      quote: 'These shoes transformed my running experience. The comfort and support are unmatched! I\'ve run 3 marathons in them.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Fashion Blogger',
      image: '/assets/avatar-2.svg',
      quote: 'Perfect blend of style and comfort. I get compliments every time I wear them. The craftsmanship is exceptional.',
      rating: 5
    },
    {
      name: 'Emma Davis',
      role: 'Fitness Instructor',
      image: '/assets/avatar-3.svg',
      quote: 'Outstanding quality and durability. Worth every penny for the premium experience. My students always ask about them.',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'Business Executive',
      image: '/assets/avatar-4.svg',
      quote: 'Professional look with all-day comfort. Perfect for long office hours and client meetings. Highly recommended!',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'College Student',
      image: '/assets/avatar-5.svg',
      quote: 'Trendy designs at affordable prices. The quality is amazing and they last really long. My friends love them too!',
      rating: 5
    },
    {
      name: 'David Wilson',
      role: 'Travel Photographer',
      image: '/assets/avatar-6.svg',
      quote: 'Perfect for long walks and adventures. Comfortable, durable, and stylish. They\'ve been with me across 15 countries.',
      rating: 5
    }
  ], []);

  const stats = useMemo(() => [
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: Award, value: '4.9/5', label: 'Average Rating' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction Rate' },
    { icon: Shield, value: '2 Year', label: 'Warranty' },
    { icon: Star, value: '25K+', label: '5-Star Reviews' },
    { icon: Truck, value: '500+', label: 'Cities Delivered' }
  ], []);

  // Slider navigation functions
  const nextSlide = useCallback(() => {
    const maxSlide = Math.max(0, featuredProducts.length - slidesToShow);
    setCurrentSlide(prev => prev >= maxSlide ? 0 : prev + 1);
  }, [featuredProducts.length, slidesToShow]);

  const prevSlide = useCallback(() => {
    const maxSlide = Math.max(0, featuredProducts.length - slidesToShow);
    setCurrentSlide(prev => prev <= 0 ? maxSlide : prev - 1);
  }, [featuredProducts.length, slidesToShow]);

  // Update slides to show based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth >= 1280) setSlidesToShow(4);
      else if (window.innerWidth >= 1024) setSlidesToShow(3);
      else if (window.innerWidth >= 640) setSlidesToShow(2);
      else setSlidesToShow(1);
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (featuredProducts.length > slidesToShow) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [nextSlide, featuredProducts.length, slidesToShow]);

  const fetchProducts = useCallback(async () => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    
    try {
      const [featured] = await Promise.all([
        productService.getFeaturedProducts()
      ]);
      
      setFeaturedProducts(featured);
      
      trackApiCall('GET', '/products/featured', startTime, 200, {
        featuredCount: featured.length
      });
    } catch (err) {
      // Silent fail - error handled by UI state
      setError('Failed to load products');

      
      trackApiCall('GET', '/products/featured', startTime, 500, {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, [trackApiCall]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    setSubscriptionMessage('');

    try {
       await newsletterService.subscribe({ email, source: 'website' });
       setSubscriptionMessage('Thank you for subscribing! Check your email for confirmation.');
       setEmail('');
       trackUserInteraction('Newsletter Subscribe Success', { email });
     } catch (error) {
       setSubscriptionMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
       trackUserInteraction('Newsletter Subscribe Error', { email, error: error instanceof Error ? error.message : 'Unknown error' });
     } finally {
       setIsSubscribing(false);
     }
  }, [email, trackUserInteraction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-primary-700 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading shoes</h2>
          <p className="text-gray-600 mb-8">Please wait while we fetch our premium shoe collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Premium Footwear Collection - Quality Shoes for Every Occasion"
        description="Discover our curated collection of premium shoes for men and women. From casual sneakers to formal dress shoes, find your perfect pair with free shipping and fit guarantee."
        keywords="shoes, footwear, sneakers, boots, sandals, men shoes, women shoes, premium shoes, quality footwear, online shoe store"
        type="website"
        url={window.location.href}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 overflow-hidden flex items-center">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <ResponsiveContainer className="w-full">
          <div className="relative py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh]">
              <div className="animate-fade-in text-center lg:text-left flex flex-col justify-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-blue-100 rounded-full text-sm font-medium text-primary-800 mb-6 animate-bounce mx-auto lg:mx-0 w-fit">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  #1 Premium Shoe Brand
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-950 leading-tight mb-6 sm:mb-8">
                  Step Into
                  <span className="block bg-gradient-to-r from-primary-700 via-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">Premium Footwear</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Discover our curated collection of premium shoes designed for comfort, style, and performance. From running to casual wear, find your perfect pair with cutting-edge technology.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
                  <Link
                    to="/products"
                    onClick={() => trackUserInteraction('Hero CTA Click', { button: 'Shop Shoes' })}
                    className="inline-flex items-center justify-center px-8 sm:px-10 py-4 bg-gradient-to-r from-primary-950 to-primary-800 text-white rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all duration-300 group touch-manipulation shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-2 text-lg font-semibold"
                  >
                    Shop Shoes
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => trackUserInteraction('Hero CTA Click', { button: 'Learn More' })}
                    className="inline-flex items-center justify-center px-8 sm:px-10 py-4 border-2 border-primary-950 text-primary-950 rounded-xl hover:bg-primary-950 hover:text-white transition-all duration-300 touch-manipulation backdrop-blur-sm bg-white/80 hover:shadow-xl transform hover:-translate-y-2 text-lg font-semibold"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="relative animate-slide-up order-first lg:order-last items-center justify-center">
                <div className="relative max-w-lg mx-auto">
                  <img 
                    src="/assets/hero-shoes.jpg" 
                    alt="Premium Shoe Collection Banner" 
                    className="w-full h-auto object-contain rounded-xl shadow-lg animate-float"
                  />
                </div>
                <div className="absolute -bottom-6 sm:-bottom-8 -left-6 sm:-left-8 bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex -space-x-1">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current animate-pulse" />
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: '0.1s'}} />
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: '0.2s'}} />
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: '0.3s'}} />
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: '0.4s'}} />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">10,000+ Happy Walkers</p>
                      <p className="text-xs sm:text-sm text-gray-600">Trusted by athletes & fashion lovers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Statistics Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950">
        <ResponsiveContainer>
          <ResponsiveGrid 
            cols={{ default: 2, sm: 4 }}
            gap="lg"
            minItemWidth="150px"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-white/20">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <p className="text-sm sm:text-base text-primary-200">{stat.label}</p>
              </div>
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <ResponsiveContainer>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-fade-in">
              Why Choose Our Shoes?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in px-4">
              Experience the perfect combination of comfort, style, and performance with our premium features.
            </p>
          </div>
          <ResponsiveGrid 
            cols={{ default: 1, sm: 2, md: 4 }}
            gap="lg"
            minItemWidth="200px"
          >
            {features.map((feature, index) => (
              <div key={index} className="text-center animate-fade-in group hover:transform hover:scale-105 transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:shadow-lg transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-950 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-primary-700 transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>

      {/* Featured Products Slider */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <ResponsiveContainer>
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-blue-100 rounded-full text-sm font-medium text-primary-800 mb-4 animate-fade-in">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              Handpicked Collection
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-fade-in">
              Featured Shoes
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in px-4">
              Discover our handpicked selection of premium footwear that combines comfort, style, and performance for every occasion.
            </p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Navigation Buttons */}
              {featuredProducts.length > slidesToShow && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:bg-white border border-gray-200/50 -ml-6"
                    aria-label="Previous products"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-primary-700 transition-colors" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:bg-white border border-gray-200/50 -mr-6"
                    aria-label="Next products"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-primary-700 transition-colors" />
                  </button>
                </>
              )}
              
              {/* Slider Container */}
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
                >
                  {featuredProducts.map((product, index) => (
                    <div 
                      key={product._id} 
                      className="flex-shrink-0 px-2 sm:px-3"
                      style={{ width: `${100 / slidesToShow}%` }}
                    >
                      <div className="transform hover:scale-105 transition-transform duration-300">
                        <ProductCard product={product} index={index} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dots Indicator */}
              {featuredProducts.length > slidesToShow && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: Math.ceil(featuredProducts.length / slidesToShow) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        Math.floor(currentSlide / slidesToShow) === index
                          ? 'bg-primary-600 w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm sm:text-base">No featured shoes available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/products"
              onClick={() => trackUserInteraction('Featured Products CTA Click', { button: 'View All Shoes' })}
              className="inline-flex items-center px-8 sm:px-10 py-4 bg-gradient-to-r from-primary-950 to-primary-800 text-white rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all duration-300 group animate-fade-in touch-manipulation shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-2 text-lg font-semibold"
            >
              View All Shoes
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <ResponsiveContainer>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what real customers have to say about their experience.
            </p>
          </div>
          
          <ResponsiveGrid 
            cols={{ default: 1, md: 3 }}
            gap="lg"
            minItemWidth="300px"
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700">"{testimonial.quote}"</p>
              </div>
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>

     

      {/* Customer Reviews with Images */}
      <section className="py-20 bg-gray-50">
        <ResponsiveContainer>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See real reviews from customers who love their purchases
            </p>
          </div>
          <ReviewSlider />
        </ResponsiveContainer>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-gray-900 via-primary-950 to-gray-900 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <ResponsiveContainer className="relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-400/20 to-primary-600/20 backdrop-blur-sm rounded-full text-primary-200 text-sm font-medium mb-6 animate-fade-in border border-primary-400/30">
              <Award className="w-4 h-4 mr-2" />
              Premium Quality Guaranteed
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
              Ready to Step Up Your
              <span className="block bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500 bg-clip-text text-transparent">
                Style Game?
              </span>
            </h2>
            <p className="text-gray-300 mb-8 sm:mb-10 animate-fade-in px-4 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied customers who've transformed their wardrobe with our premium footwear collection. Your perfect pair is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link
                to="/products"
                onClick={() => trackUserInteraction('Final CTA Click', { button: 'Shop Now' })}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-primary-500/25 transform hover:-translate-y-2 group"
              >
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                onClick={() => trackUserInteraction('Final CTA Click', { button: 'Learn More' })}
                className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-lg backdrop-blur-sm group"
              >
                Learn More
                <Users className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

       {/* Enhanced Newsletter Section */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        {/* Subtle Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-tr from-primary-100/20 to-blue-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-yellow-100/20 to-orange-100/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-l from-purple-100/20 to-pink-100/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '6s'}}></div>
        </div>
        
        <ResponsiveContainer className="relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-full text-primary-800 text-sm font-medium mb-6 animate-fade-in border border-primary-200">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
              Join 50,000+ Happy Customers
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in leading-tight">
              Stay Ahead of the
              <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 bg-clip-text text-transparent mt-2">
                Fashion Trends
              </span>
            </h2>
            <p className="text-gray-600 mb-8 sm:mb-10 animate-fade-in px-4 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Be the first to discover new arrivals, exclusive offers, and insider style tips from our fashion experts. Join our community of style enthusiasts.
            </p>
            </div>

            {/* Newsletter Form */}
            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-2xl animate-fade-in">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleNewsletterSubmit} className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        disabled={isSubscribing}
                        className="w-full px-6 py-4 rounded-2xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 touch-manipulation text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary-50/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubscribing || !email.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 font-bold text-lg touch-manipulation shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center group min-w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubscribing ? 'Subscribing...' : 'Subscribe Now'}
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  {subscriptionMessage && (
                    <div className={`text-center p-3 rounded-lg ${subscriptionMessage.includes('Thank you') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {subscriptionMessage}
                    </div>
                  )}
                </form>
                
                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Shield className="w-4 h-4 mr-2 text-primary-600" />
                    <span>No Spam Guarantee</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    <span>Exclusive Offers</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="w-4 h-4 mr-2 text-primary-600" />
                    <span>Style Community</span>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm text-center animate-fade-in">
                  Unsubscribe at any time. We respect your privacy and will never share your information.
                </p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center mt-8 animate-fade-in">
              <p className="text-gray-600 text-sm mb-4">Trusted by fashion enthusiasts worldwide</p>
              <div className="flex justify-center items-center space-x-6 opacity-80">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">4.9/5 Rating</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="text-gray-600 text-sm">50K+ Subscribers</div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="text-gray-600 text-sm">98% Satisfaction</div>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>
    </div>
    </>
  );
});

export default Home;