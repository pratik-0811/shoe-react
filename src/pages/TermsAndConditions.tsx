import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Terms and Conditions - Solewaale"
        description="Terms and conditions for shopping at Solewaale. Important information about our imported footwear products."
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice About Our Products</h3>
              <p className="text-yellow-700">
                <strong>All footwear products sold on Solewaale are imported items and are NOT original branded products.</strong> 
                These are high-quality replicas or inspired designs that offer similar aesthetics and comfort at affordable prices. 
                We do not claim any affiliation with original brand manufacturers.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the Solewaale website, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Product Information and Disclaimers</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Product Authenticity Disclaimer</h3>
                <ul className="text-red-700 space-y-2">
                  <li>• All shoes and footwear products are <strong>imported items</strong></li>
                  <li>• Products are <strong>NOT original branded merchandise</strong></li>
                  <li>• Items are high-quality replicas or inspired designs</li>
                  <li>• We make no claims of authenticity to original brand names</li>
                  <li>• Prices reflect the imported, non-original nature of products</li>
                </ul>
              </div>
              <p className="text-gray-700 mb-4">
                We strive to provide accurate product descriptions, images, and specifications. However, we do not warrant that 
                product descriptions or other content is accurate, complete, reliable, current, or error-free.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Orders and Payment</h2>
              <p className="text-gray-700 mb-4">
                By placing an order, you acknowledge that you understand these are imported, non-original products. 
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order.
              </p>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• Payment must be completed before order processing</li>
                <li>• Prices are subject to change without notice</li>
                <li>• All transactions are in Indian Rupees (INR)</li>
                <li>• Order confirmation does not guarantee product availability</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Shipping and Delivery</h2>
              <p className="text-gray-700 mb-4">
                Delivery times are estimates and may vary based on location and product availability. 
                We are not responsible for delays caused by customs, weather, or other factors beyond our control.
              </p>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• Standard delivery: 5-7 business days</li>
                <li>• Express delivery: 2-3 business days (where available)</li>
                <li>• Free shipping on orders above ₹999</li>
                <li>• Delivery charges apply for orders below minimum amount</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Returns and Exchanges</h2>
              <p className="text-gray-700 mb-4">
                Given the imported nature of our products, returns and exchanges are subject to specific conditions:
              </p>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• 7-day return policy from date of delivery</li>
                <li>• Products must be unused and in original packaging</li>
                <li>• Size exchanges subject to availability</li>
                <li>• Return shipping costs may apply</li>
                <li>• Refunds processed within 5-7 business days after return verification</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                We respect intellectual property rights. Our products are inspired designs and replicas. 
                We do not claim ownership of any original brand trademarks or designs.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                Solewaale shall not be liable for any direct, indirect, incidental, special, or consequential damages 
                resulting from the use or inability to use our products or services. Our liability is limited to the 
                purchase price of the product.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. User Conduct</h2>
              <p className="text-gray-700 mb-4">Users agree not to:</p>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• Use the website for any unlawful purpose</li>
                <li>• Attempt to gain unauthorized access to our systems</li>
                <li>• Post false or misleading reviews</li>
                <li>• Violate any applicable laws or regulations</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the website, 
                to understand our practices.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifications</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
                Your continued use of the website constitutes acceptance of modified terms.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> support@solewaale.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 7709897723</p>
                <p className="text-gray-700"><strong>Address:</strong> Solewaale, Satpur Colony, Satpur Nashik-07, India</p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/contact" className="text-blue-600 hover:text-blue-800">
              Contact Us
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;