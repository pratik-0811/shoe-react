import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories?active=true');
        // Handle different response structures
        const categoriesData = response.categories || response.data?.categories || response.data?.data || response.data || [];
        // Only show active categories, limit to 4 for footer
        const activeCategories = Array.isArray(categoriesData) ? categoriesData.filter(cat => cat.isActive) : [];
        setCategories(activeCategories.slice(0, 4));
      } catch (error) {
        setCategories([]); // Set empty array on error
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-primary-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/logo-dark.png" 
                  alt="Solewaale Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold">Solewaale</span>
            </div>
            <p className="text-primary-100 mb-4">
              Step into style with our premium collection of imported shoes curated for comfort and performance.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center hover:bg-primary-700 cursor-pointer transition-colors">
                <span className="text-xs font-bold">f</span>
              </div>
              <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center hover:bg-primary-700 cursor-pointer transition-colors">
                <span className="text-xs font-bold">t</span>
              </div>
              <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center hover:bg-primary-700 cursor-pointer transition-colors">
                <span className="text-xs font-bold">in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-primary-100 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-primary-100 hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/about" className="text-primary-100 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-primary-100 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category._id}>
                  <Link 
                    to={`/products?category=${category.slug}`} 
                    className="text-primary-100 hover:text-white transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-primary-200 text-sm">Loading categories...</li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">Solewaale, Satpur Colony, Satpur Nashik-07</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">+91 7709897723</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">hello@solewaale.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-200 text-sm">© 2024 Solewaale. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-primary-200 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link to="/terms-and-conditions" className="text-primary-200 hover:text-white text-sm transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;