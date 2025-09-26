import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
  };

  return (
    <Link to={`/product/${product._id}`} className="group">
      <div 
        className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 animate-fade-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {product.badge && (
            <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
              product.badge === 'Sale' ? 'bg-red-100 text-red-800' :
              product.badge === 'New' ? 'bg-green-100 text-green-800' :
              product.badge === 'Popular' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {product.badge}
            </span>
          )}

          <button 
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
              isInWishlist(product._id) ? 'bg-red-50' : 'hover:bg-primary-50'
            }`}
          >
            <Heart className={`w-4 h-4 transition-colors ${
              isInWishlist(product._id) ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'
            }`} />
          </button>

          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
          
          <div className="flex items-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">({product.reviews?.length || 0})</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary-950">${product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              product.inStock
                ? 'bg-primary-950 text-white hover:bg-primary-800 hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;