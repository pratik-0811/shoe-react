import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-950" />
              </div>
              <span className="text-xl font-bold">Luxora</span>
            </div>
            <p className="text-primary-100 mb-4">
              Discover premium products crafted with care and attention to detail.
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
              <li><Link to="/products?category=bags" className="text-primary-100 hover:text-white transition-colors">Bags</Link></li>
              <li><Link to="/products?category=watches" className="text-primary-100 hover:text-white transition-colors">Watches</Link></li>
              <li><Link to="/products?category=home" className="text-primary-100 hover:text-white transition-colors">Home & Living</Link></li>
              <li><Link to="/products?category=electronics" className="text-primary-100 hover:text-white transition-colors">Electronics</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">123 Luxury Ave, New York, NY 10001</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100 text-sm">hello@luxora.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-200 text-sm">© 2024 Luxora. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-primary-200 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-primary-200 hover:text-white text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;