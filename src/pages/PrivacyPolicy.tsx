import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Privacy Policy - Solewaale"
        description="Privacy policy for Solewaale. Learn how we protect your personal information when shopping for imported footwear."
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center mb-2">
            <Shield className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Product Disclosure</h3>
              <p className="text-yellow-700">
                <strong>Please note:</strong> All footwear products on Solewaale are imported items and are NOT original branded products. 
                This privacy policy covers how we handle your personal information when purchasing these imported, non-original items.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
                <div className="bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl p-6 mb-6">
                  <p className="text-lg text-gray-800 leading-relaxed mb-4">
                    At <span className="font-bold text-primary-600">Solewaale</span>, we are committed to protecting your privacy and personal information. This Privacy Policy 
                    explains how we collect, use, disclose, and safeguard your information when you visit our website and 
                    purchase our imported footwear products.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    By using our website, you consent to the data practices described in this policy.
                  </p>
                </div>
              </section>

              {/* Section 1 */}
              <section className="mb-12">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                  <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
                </div>
              
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-primary-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-primary-500 rounded-full mr-2"></div>
                    Personal Information
                  </h3>
                  <p className="text-primary-800 mb-4 leading-relaxed">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="space-y-3 text-primary-700">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                      Create an account on our website
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                      Make a purchase of our imported footwear products
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                      Subscribe to our newsletter
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                      Contact us for customer support
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                      Leave reviews or feedback
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                        Participate in surveys or promotions
                      </li>
                    </ul>
                  </div>
              
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full mr-2"></div>
                      Data Types
                    </h3>
                    <p className="text-green-800 mb-4 leading-relaxed">
                      Types of Personal Information:
                    </p>
                    <ul className="space-y-3 text-green-700">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Name and contact information (email, phone number)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Billing and shipping addresses
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Payment information (processed securely)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Order history and preferences
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Account credentials (username, password)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        Communication preferences
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 bg-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-full mr-2"></div>
                    Automatically Collected Information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3 text-purple-700">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        IP address and browser information
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        Device information and operating system
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        Website usage data and navigation patterns
                      </div>
                    </div>
                    <div className="space-y-3 text-purple-700">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        Cookies and similar tracking technologies
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        Referral sources and search terms
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            {/* Section 2 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-green-800 mb-6 leading-relaxed">
                  We use the collected information for various purposes, including:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Order Processing:</h4>
                    <ul className="text-green-700 space-y-1 text-sm">
                      <li>• Process and fulfill your orders</li>
                      <li>• Send order confirmations and updates</li>
                      <li>• Handle returns and exchanges</li>
                      <li>• Provide customer support</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Communication:</h4>
                    <ul className="text-purple-700 space-y-1 text-sm">
                      <li>• Send promotional emails and newsletters</li>
                      <li>• Notify about new imported products</li>
                      <li>• Respond to inquiries and feedback</li>
                      <li>• Send important account updates</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Website Improvement:</h4>
                    <ul className="text-orange-700 space-y-1 text-sm">
                      <li>• Analyze website usage and performance</li>
                      <li>• Personalize your shopping experience</li>
                      <li>• Improve our products and services</li>
                      <li>• Conduct research and analytics</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Legal Compliance:</h4>
                    <ul className="text-red-700 space-y-1 text-sm">
                      <li>• Comply with legal obligations</li>
                      <li>• Prevent fraud and abuse</li>
                      <li>• Protect our rights and property</li>
                      <li>• Resolve disputes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Information Sharing and Disclosure</h2>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-orange-800 mb-6 leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties. However, we may share your 
                  information in the following circumstances:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                      Service Providers
                    </h4>
                    <p className="text-orange-700">
                      We work with trusted third-party service providers for payment processing, shipping, email marketing, 
                      and website analytics. These providers have access to personal information only as needed to perform 
                      their functions and are contractually obligated to maintain confidentiality.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                      Legal Requirements
                    </h4>
                    <p className="text-orange-700">
                      We may disclose your information if required by law, court order, or government regulation, or to 
                      protect our rights, property, or safety, or that of our users or the public.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2 flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                      Business Transfers
                    </h4>
                    <p className="text-orange-700">
                      In the event of a merger, acquisition, or sale of assets, your information may be transferred as part 
                      of the business transaction, subject to the same privacy protections.
                    </p>
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
                <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-purple-800 mb-6 leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Security Measures Include:</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• SSL encryption for data transmission</li>
                    <li>• Secure payment processing through trusted gateways</li>
                    <li>• Regular security audits and updates</li>
                    <li>• Access controls and authentication</li>
                    <li>• Employee training on data protection</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 mb-1">Security Notice</h4>
                      <p className="text-red-700 text-sm leading-relaxed">
                        However, no method of transmission over the internet or electronic storage is 100% secure. While we 
                        strive to protect your personal information, we cannot guarantee absolute security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your browsing experience and collect 
                information about how you use our website.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <h5 className="font-semibold text-blue-800 mb-1">Essential Cookies</h5>
                  <p className="text-blue-700 text-sm">Required for website functionality and security</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <h5 className="font-semibold text-green-800 mb-1">Analytics Cookies</h5>
                  <p className="text-green-700 text-sm">Help us understand website usage and performance</p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <h5 className="font-semibold text-purple-800 mb-1">Marketing Cookies</h5>
                  <p className="text-purple-700 text-sm">Used to personalize ads and track campaign effectiveness</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                You can control cookie preferences through your browser settings. However, disabling certain cookies 
                may affect website functionality.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 mb-6">
                  <p className="text-lg text-teal-800 mb-6 leading-relaxed">
                    You have certain rights regarding your personal information:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                        <div className="w-5 h-5 bg-white rounded-md"></div>
                      </div>
                      <h5 className="font-bold text-teal-900 mb-2">Access and Update</h5>
                      <p className="text-teal-700 text-sm leading-relaxed">View and update your account information and preferences</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                        <div className="w-5 h-5 bg-white rounded-md"></div>
                      </div>
                      <h5 className="font-bold text-teal-900 mb-2">Email Preferences</h5>
                      <p className="text-teal-700 text-sm leading-relaxed">Unsubscribe from marketing emails at any time</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                        <div className="w-5 h-5 bg-white rounded-md"></div>
                      </div>
                      <h5 className="font-bold text-teal-900 mb-2">Data Deletion</h5>
                      <p className="text-teal-700 text-sm leading-relaxed">Request deletion of your account and associated data</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mb-4">
                        <div className="w-5 h-5 bg-white rounded-md"></div>
                      </div>
                      <h5 className="font-bold text-teal-900 mb-2">Data Portability</h5>
                      <p className="text-teal-700 text-sm leading-relaxed">Request a copy of your personal data in a portable format</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <p className="text-teal-700 leading-relaxed">
                      <strong>Exercise Your Rights:</strong> To exercise these rights, please contact us using the information provided in the "Contact Us" section.
                    </p>
                  </div>
                </div>
              </section>

            {/* Section 7 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">7</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">7. Children's Privacy</h2>
              </div>
              
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
                <p className="text-lg text-pink-800 leading-relaxed">
                  Our website is not intended for children under the age of 13. We do not knowingly collect personal 
                  information from children under 13. If you are a parent or guardian and believe your child has provided 
                  us with personal information, please contact us to have the information removed.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">8</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">8. International Data Transfers</h2>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
                <p className="text-lg text-amber-800 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure that 
                  such transfers comply with applicable data protection laws and that appropriate safeguards are in place 
                  to protect your information.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">9</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">9. Data Retention</h2>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                <p className="text-lg text-emerald-800 leading-relaxed">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                  privacy policy, unless a longer retention period is required or permitted by law. When we no longer 
                  need your information, we will securely delete or anonymize it.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">10</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">10. Changes to This Privacy Policy</h2>
              </div>
              
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6">
                <p className="text-lg text-violet-800 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable 
                  laws. We will notify you of any material changes by posting the updated policy on our website and 
                  updating the "Last updated" date.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">11</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">11. Contact Us</h2>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-lg text-primary-800 mb-6 leading-relaxed">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                  please contact us:
                </p>
                
                <div className="bg-white rounded-lg p-6 border border-primary-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-primary-900 mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        <p className="text-primary-700"><strong>Email:</strong> privacy@solewaale.com</p>
                        <p className="text-primary-700"><strong>Support:</strong> support@solewaale.com</p>
                        <p className="text-primary-700"><strong>Phone:</strong> +91 7709897723</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-primary-900 mb-3">Business Address</h4>
                      <div className="text-primary-700 leading-relaxed">
                        <p><strong>Solewaale</strong></p>
                        <p>Satpur Colony</p>
                        <p>Satpur Nashik-07</p>
                        <p>India</p>
                      </div>
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
            <Link to="/terms-and-conditions" className="text-primary-600 hover:text-primary-800">
              Terms and Conditions
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/contact" className="text-primary-600 hover:text-primary-800">
              Contact Us
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/" className="text-primary-600 hover:text-primary-800">
              Back to Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;