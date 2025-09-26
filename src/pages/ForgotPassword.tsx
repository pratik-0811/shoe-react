import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import api from '../services/api';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', {
        email: formData.email.toLowerCase().trim()
      });

      if (response.data.success) {
        setSuccess(true);
        setMessage(response.data.message);
      } else {
        setErrors({ general: response.data.message || 'An error occurred. Please try again.' });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors: FormErrors = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path === 'email') {
            backendErrors.email = err.msg;
          }
        });
        setErrors(backendErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many requests. Please try again later.' });
      } else {
        setErrors({ general: 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setSuccess(false);
    setMessage('');
    setFormData({ email: '' });
    setErrors({});
  };

  if (success) {
    return (
      <>
        <SEO 
          title="Check Your Email - Solewaale"
          description="Password reset instructions have been sent to your email address."
        />
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Check Your Email
              </h2>
            </div>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm">
                    {message}
                  </p>
                </div>
                
                <div className="space-y-4 text-sm text-gray-600">
                  <p>
                    We've sent password reset instructions to <strong>{formData.email}</strong>
                  </p>
                  <p>
                    Please check your email and click the reset link to continue. The link will expire in 1 hour.
                  </p>
                  <p>
                    Don't see the email? Check your spam folder or try again.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleTryAgain}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Try Different Email
                  </button>
                  
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Forgot Password - Solewaale"
        description="Reset your password to regain access to your Solewaale account."
      />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-800 text-sm">{errors.general}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;