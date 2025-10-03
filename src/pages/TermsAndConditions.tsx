import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Users, Lock, Eye, UserCheck, AlertTriangle, Globe, Clock, Scale } from 'lucide-react';
import SEO from '../components/SEO';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      <SEO 
        title="Terms and Conditions - Solewaale"
        description="Terms and conditions for shopping at Solewaale. Important information about our imported footwear products."
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Scale className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-amber-600 bg-clip-text text-transparent mb-6">
            Terms and Conditions
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4">
            Please read these terms and conditions carefully before using our service.
          </p>
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-md border border-primary-200">
            <Clock className="w-5 h-5 text-primary-600 mr-2" />
            <span className="text-primary-700 font-medium">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-2xl p-8 mb-12 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 mb-3">Important Notice About Our Products</h3>
              <div className="text-amber-800 leading-relaxed">
                <p className="text-lg">
                  <strong>All footwear products sold on Solewaale are imported items and are NOT original branded products.</strong> 
                  These are high-quality replicas or inspired designs that offer similar aesthetics and comfort at affordable prices. 
                  We do not claim any affiliation with original brand manufacturers.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terms Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Terms</h3>
            <p className="text-gray-600">Transparent and easy-to-understand terms for all users</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">User Rights</h3>
            <p className="text-gray-600">Protecting your rights and ensuring fair usage</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Legal Protection</h3>
            <p className="text-gray-600">Comprehensive legal framework for secure transactions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="prose prose-lg max-w-none">
            
            {/* Section 1 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-lg text-blue-800 mb-6 leading-relaxed">
                  By accessing and using the Solewaale website, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. Product Information and Disclaimers</h2>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
                <div className="bg-white rounded-lg p-4 border border-amber-300 mb-6">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Product Authenticity Disclaimer</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-amber-700">All shoes and footwear products are <strong>imported items</strong></p>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-amber-700">Products are <strong>NOT original branded merchandise</strong></p>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-amber-700">Items are high-quality replicas or inspired designs</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-amber-700">We make no claims of authenticity to original brand names</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-lg text-amber-800 leading-relaxed">
                  We strive to provide accurate product descriptions, images, and specifications. However, we do not warrant that 
                  product descriptions or other content is accurate, complete, reliable, current, or error-free.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Orders and Payment</h2>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <p className="text-lg text-green-800 mb-6 leading-relaxed">
                  By placing an order, you acknowledge that you understand these are imported, non-original products. 
                  All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-green-700">Payment must be completed before order processing</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-green-700">Prices are subject to change without notice</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-green-700">All transactions are in Indian Rupees (INR)</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-green-700">Order confirmation does not guarantee product availability</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. Shipping and Delivery</h2>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6">
                <p className="text-lg text-purple-800 mb-6 leading-relaxed">
                  Delivery times are estimates and may vary based on location and product availability. 
                  We are not responsible for delays caused by customs, weather, or other factors beyond our control.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-purple-700">Standard delivery: 5-7 business days</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-purple-700">Express delivery: 2-3 business days (where available)</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-purple-700">Free shipping on orders above ₹999</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-purple-700">Delivery charges apply for orders below minimum amount</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">5</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Returns and Exchanges</h2>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                <div className="bg-white rounded-lg p-4 border border-blue-300 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Return Policy for Imported Products</h3>
                  <p className="text-blue-700 leading-relaxed">
                    Given the imported nature of our products, returns and exchanges are subject to specific conditions.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-blue-700">7-day return policy from date of delivery</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-blue-700">Products must be unused and in original packaging</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-blue-700">Size exchanges subject to availability</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-blue-700">Return shipping costs may apply</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">6</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">6. Intellectual Property</h2>
              </div>
              
              <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-6">
                <p className="text-lg text-teal-800 leading-relaxed">
                  We respect intellectual property rights. Our products are inspired designs and replicas. 
                  We do not claim ownership of any original brand trademarks or designs.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">7</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">7. Limitation of Liability</h2>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
                <p className="text-lg text-red-800 leading-relaxed">
                  Solewaale shall not be liable for any direct, indirect, incidental, special, or consequential damages 
                  resulting from the use or inability to use our products or services. Our liability is limited to the 
                  purchase price of the product.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">8</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">8. User Conduct</h2>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                <p className="text-lg text-orange-800 mb-6 leading-relaxed">Users agree not to:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-orange-700">Use the website for any unlawful purpose</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-orange-700">Attempt to gain unauthorized access to our systems</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-orange-700">Post false or misleading reviews</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-orange-700">Violate any applicable laws or regulations</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">9</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">9. Privacy</h2>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                <p className="text-lg text-indigo-800 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the website, 
                  to understand our practices.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">10</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">10. Modifications</h2>
              </div>
              
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
                <p className="text-lg text-pink-800 leading-relaxed">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
                  Your continued use of the website constitutes acceptance of modified terms.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">11</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">11. Contact Information</h2>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
                <p className="text-lg text-gray-800 mb-6 leading-relaxed">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">@</span>
                      </div>
                      <p className="text-gray-700 font-medium">Email</p>
                      <p className="text-gray-600">support@solewaale.com</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">📞</span>
                      </div>
                      <p className="text-gray-700 font-medium">Phone</p>
                      <p className="text-gray-600">+91 7709897723</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 font-bold">📍</span>
                      </div>
                      <p className="text-gray-700 font-medium">Address</p>
                      <p className="text-gray-600">Solewaale, Satpur Colony, Satpur Nashik-07, India</p>
                    </div>
                  </div>
                </div>
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
         
         {/* Footer */}
         <div className="mt-16 pt-8 border-t border-gray-200">
           <div className="bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl p-6">
             <div className="text-center">
               <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
               <p className="text-gray-600 mb-4">Our customer support team is here to assist you with any questions.</p>
               <div className="flex flex-wrap justify-center gap-4">
                 <a href="/privacy-policy" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                   Privacy Policy
                 </a>
                 <span className="text-gray-400">•</span>
                 <a href="/contact" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                   Contact Support
                 </a>
                 <span className="text-gray-400">•</span>
                 <a href="/" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                   Back to Home
                 </a>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 };

export default TermsAndConditions;