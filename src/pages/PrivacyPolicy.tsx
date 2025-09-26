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
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center mb-2">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
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
              <p className="text-gray-700 mb-4">
                At Solewaale, we are committed to protecting your privacy and personal information. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website and 
                purchase our imported footwear products.
              </p>
              <p className="text-gray-700 mb-4">
                By using our website, you consent to the data practices described in this policy.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• Create an account on our website</li>
                <li>• Make a purchase of our imported footwear products</li>
                <li>• Subscribe to our newsletter</li>
                <li>• Contact us for customer support</li>
                <li>• Leave reviews or feedback</li>
                <li>• Participate in surveys or promotions</li>
              </ul>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Types of Personal Information:</h4>
                <ul className="text-blue-700 space-y-1">
                  <li>• Name and contact information (email, phone number)</li>
                  <li>• Billing and shipping addresses</li>
                  <li>• Payment information (processed securely through payment gateways)</li>
                  <li>• Order history and preferences</li>
                  <li>• Account credentials (username, password)</li>
                  <li>• Communication preferences</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Automatically Collected Information</h3>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• IP address and browser information</li>
                <li>• Device information and operating system</li>
                <li>• Website usage data and navigation patterns</li>
                <li>• Cookies and similar tracking technologies</li>
                <li>• Referral sources and search terms</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
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
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. However, we may share your 
                information in the following circumstances:
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-semibold text-gray-800">Service Providers</h4>
                  <p className="text-gray-700 text-sm">
                    We work with trusted third-party service providers for payment processing, shipping, email marketing, 
                    and website analytics. These providers have access to personal information only as needed to perform 
                    their functions and are contractually obligated to maintain confidentiality.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-semibold text-gray-800">Legal Requirements</h4>
                  <p className="text-gray-700 text-sm">
                    We may disclose your information if required by law, court order, or government regulation, or to 
                    protect our rights, property, or safety, or that of our users or the public.
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-400 pl-4">
                  <h4 className="font-semibold text-gray-800">Business Transfers</h4>
                  <p className="text-gray-700 text-sm">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred as part 
                    of the business transaction, subject to the same privacy protections.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
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
              
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we 
                strive to protect your personal information, we cannot guarantee absolute security.
              </p>
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
              <p className="text-gray-700 mb-4">
                You have certain rights regarding your personal information:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Access and Update</h5>
                    <p className="text-gray-700 text-sm">View and update your account information and preferences</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Email Preferences</h5>
                    <p className="text-gray-700 text-sm">Unsubscribe from marketing emails at any time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Data Deletion</h5>
                    <p className="text-gray-700 text-sm">Request deletion of your account and associated data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Data Portability</h5>
                    <p className="text-gray-700 text-sm">Request a copy of your personal data in a portable format</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our website is not intended for children under the age of 13. We do not knowingly collect personal 
                information from children under 13. If you are a parent or guardian and believe your child has provided 
                us with personal information, please contact us to have the information removed.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure that 
                such transfers comply with applicable data protection laws and that appropriate safeguards are in place 
                to protect your information.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                privacy policy, unless a longer retention period is required or permitted by law. When we no longer 
                need your information, we will securely delete or anonymize it.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable 
                laws. We will notify you of any material changes by posting the updated policy on our website and 
                updating the "Last updated" date.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacy@solewaale.com</p>
                <p className="text-gray-700"><strong>Support:</strong> support@solewaale.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 7709897723</p>
                <p className="text-gray-700"><strong>Address:</strong> Solewaale, Satpur Colony, Satpur Nashik-07, India</p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-800">
              Terms and Conditions
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

export default PrivacyPolicy;