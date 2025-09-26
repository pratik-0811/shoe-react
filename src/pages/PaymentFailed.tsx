import React, { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || 'Payment was unsuccessful';

  useEffect(() => {
    // Auto-redirect to cart page after 15 seconds
    const timer = setTimeout(() => {
      navigate('/cart');
    }, 15000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Payment Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We're sorry, but your payment could not be processed.
            </p>
            
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error:</span> {errorMessage}
              </p>
            </div>
            
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Please check your payment details and try again, or contact our support team if the problem persists.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cart"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Cart
                </Link>
                
                <Link
                  to="/contact"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contact Support
                </Link>
              </div>
              
              <div className="mt-4">
                <Link
                  to="/products"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Continue Shopping
                </Link>
              </div>
              
              <p className="text-xs text-gray-500">
                You will be automatically redirected to your cart in 15 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;