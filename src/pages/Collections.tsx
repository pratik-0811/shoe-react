import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Star, TrendingUp, Award, Zap, Play, Volume2 } from 'lucide-react';
import { Category, Product } from '../types';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductListSkeleton } from '../components/Loading';
import SEO from '../components/SEO';
import OptimizedImage from '../components/OptimizedImage';
import { useToast } from '../components/Toast';

interface Collection {
  id: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  badgeColor?: string;
  products: Product[];
  category?: Category;
}

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and featured products
      const [categoriesResponse, featuredResponse, newArrivalsResponse] = await Promise.all([
        api.get('/categories/hierarchical?active=true'),
        api.get('/products/featured?limit=8'),
        api.get('/products/new-arrivals?limit=6')
      ]);

      const categories = categoriesResponse.data.categories || [];
      const featured = featuredResponse.data.products || [];
      const newArrivals = newArrivalsResponse.data.products || [];

      // Create collections from categories and special collections
      const categoryCollections: Collection[] = categories.slice(0, 6).map((category: Category, index: number) => ({
        id: `category-${category._id}`,
        title: category.name,
        description: category.description || `Discover our ${category.name.toLowerCase()} collection`,
        image: category.image || '/assets/product-placeholder.svg',
        badge: category.subcategories && category.subcategories.length > 0 ? `${category.subcategories.length} Styles` : undefined,
        badgeColor: 'bg-blue-100 text-blue-800',
        products: [],
        category
      }));

      // Special collections
      const specialCollections: Collection[] = [
        {
          id: 'featured',
          title: 'Featured Products',
          description: 'Our handpicked selection of premium footwear',
          image: '/assets/hero-shoes.jpg',
          badge: 'Editor\'s Choice',
          badgeColor: 'bg-amber-100 text-amber-800',
          products: featured
        },
        {
          id: 'new-arrivals',
          title: 'New Arrivals',
          description: 'Latest additions to our collection',
          image: '/assets/banner-hero.jpg',
          badge: 'New',
          badgeColor: 'bg-green-100 text-green-800',
          products: newArrivals
        }
      ];

      setCollections([...specialCollections, ...categoryCollections]);
      setFeaturedProducts(featured);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load collections';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO 
          title="Collections - Premium Shoe Store"
          description="Explore our curated collections of premium footwear"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Collections</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCollections}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Collections - Premium Shoe Store"
        description="Explore our curated collections of premium footwear including featured products, new arrivals, and category-specific collections."
        keywords="shoe collections, footwear, premium shoes, new arrivals, featured products"
      />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-primary-200 to-primary-300 bg-clip-text text-transparent">
              Our Collections
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated collections of premium footwear, 
            from trending styles to timeless classics that define your journey.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="#collections"
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-full hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Explore Collections
            </Link>
            <button
              onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white/30 text-white px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Our Story
            </button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video-section" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              The Art of <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Global Curation</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the passion and precision in selecting the finest imported shoes from top global brands.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl group">
              <div className="aspect-video relative">
                {/* Video Placeholder with Play Button */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-primary-800/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <Play className="w-12 h-12 text-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Behind the Scenes</h3>
                    <p className="text-gray-200">Discover how we source exceptional footwear</p>
                  </div>
                </div>
                
                {/* Background Image */}
                <img 
                  src="/assets/hero-shoes.jpg" 
                  alt="Premium imported shoes" 
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center space-x-4">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                    <Play className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <span className="text-sm">2:45</span>
                </div>
                <div className="text-sm bg-black/50 px-3 py-1 rounded-full">
                  HD Quality
                </div>
              </div>
            </div>
            
            {/* Video Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Premium Quality</h4>
                <p className="text-gray-600">Every shoe is selected for its finest materials and attention to detail</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Expert Curation</h4>
                <p className="text-gray-600">Our team brings decades of experience in selecting premium imported footwear</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Innovation</h4>
                <p className="text-gray-600">Combining traditional techniques with modern technology</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section id="collections" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Our <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Collections</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From athletic performance to elegant style, find the perfect footwear for every occasion.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <div key={collection.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 hover:border-purple-200">
                {/* Collection Image */}
                <div className="relative h-64 overflow-hidden">
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {collection.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${collection.badgeColor}`}>
                      {collection.badge}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                </div>

                {/* Collection Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                  
                  {/* Product Count or Category Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      {collection.category?.subcategories && collection.category.subcategories.length > 0 ? (
                        <>
                          <Award className="w-4 h-4 mr-1" />
                          {collection.category.subcategories.length} Subcategories
                        </>
                      ) : collection.products.length > 0 ? (
                        <>
                          <Star className="w-4 h-4 mr-1" />
                          {collection.products.length} Products
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Trending
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={collection.category ? `/products?category=${collection.category.slug}` : `/products?collection=${collection.id}`}
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-6 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                  >
                    Explore Collection
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Featured <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">Products</span>
                </h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Handpicked products from our premium collections, chosen for their exceptional quality and style.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product._id} className="transform hover:scale-105 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                to="/products?featured=true"
                className="inline-flex items-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                View All Featured Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-10 rounded-full animate-pulse delay-500"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Find Your <span className="bg-gradient-to-r from-primary-200 to-primary-300 bg-clip-text text-transparent">Perfect Pair?</span>
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Browse our complete collection of premium footwear and discover the perfect shoes for your lifestyle. From athletic performance to elegant style, we have something for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/products"
              className="inline-flex items-center bg-white text-primary-800 px-10 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Shop All Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="#collections"
              className="inline-flex items-center border-2 border-white text-white px-10 py-4 rounded-xl hover:bg-white hover:text-primary-800 transition-all duration-300 font-bold text-lg"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Collections;