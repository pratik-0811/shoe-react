import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCartWishlistMerge } from '../hooks/useCartWishlistMerge';
import userService from '../services/userService';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
  }>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  
  const [rememberMe, setRememberMe] = useState(false);
  
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  const { login, register } = useAuth();
  const { mergeGuestDataOnLogin } = useCartWishlistMerge();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Reset form and states when switching between login/signup or login methods
  useEffect(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setRememberMe(false);
    setError(null);
    setLoading(false);
    setOtpSent(false);
    setOtpTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isLogin, loginMethod]);

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await userService.sendOTP(formData.phone);
      setOtpSent(true);
      setOtpTimer(60);
      
      // Start countdown timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    
    if (!isLogin) {
      Object.assign(errors, validateField('name', formData.name));
    }
    
    if (loginMethod === 'otp') {
      Object.assign(errors, validateField('phone', formData.phone));
      if (otpSent) {
        Object.assign(errors, validateField('otp', formData.otp));
      }
    } else {
      Object.assign(errors, validateField('email', formData.email));
      Object.assign(errors, validateField('password', formData.password));
    }
    
    if (!isLogin) {
      Object.assign(errors, validateField('confirmPassword', formData.confirmPassword));
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        if (loginMethod === 'otp') {
          if (!otpSent) {
            // First click on OTP login button should send OTP
            await handleSendOTP();
            return;
          } else {
            // Subsequent click should verify OTP and login
            await userService.verifyOTPLogin(formData.phone, formData.otp, rememberMe);
            await mergeGuestDataOnLogin();
          }
        } else {
          // Regular email/password login
          await login(formData.email, formData.password, rememberMe, mergeGuestDataOnLogin);
        }
      } else {
        // Signup logic
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        const validation = validatePassword(formData.password);
        const allRequirementsMet = Object.values(validation).every(req => req);
        
        if (!allRequirementsMet) {
          setError('Please ensure your password meets all requirements');
          setLoading(false);
          return;
        }
        
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }, mergeGuestDataOnLogin);
      }
      
      const userData = userService.getStoredUser();
      if (userData?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      
      // Handle specific field errors
      if (message.includes('Invalid email format')) {
        setFieldErrors({ email: 'Please enter a valid email address' });
      } else if (message.includes('Phone number')) {
        setFieldErrors({ phone: 'Invalid phone number format' });
      } else if (message.includes('Invalid OTP') || message.includes('OTP expired')) {
        setFieldErrors({ otp: message.includes('expired') ? 'OTP has expired. Please request a new one.' : 'Invalid OTP code. Please check and try again.' });
      } else if (message.includes('Password')) {
        setFieldErrors({ password: 'Invalid password. Please check and try again.' });
      } else {
        // Handle general error messages
        if (message.includes('Too many authentication attempts')) {
          setError('Too many attempts. Please try again in 15 minutes.');
        } else if (message.includes('Password does not meet security requirements')) {
          setError('Password does not meet security requirements. Please check the requirements below.');
        } else if (message.includes('User with this email already exists')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else {
          setError(message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => ({
    length: password.length >= 8, // Corrected length to 8 for better security
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  });

  const validateField = (name: string, value: string) => {
    const errors: typeof fieldErrors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters long';
        }
        break;
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^[+]?[1-9]?[0-9]{7,15}$/.test(value.replace(/\s/g, ''))) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (!isLogin) {
          const validation = validatePassword(value);
          const allRequirementsMet = Object.values(validation).every(req => req);
          if (!allRequirementsMet) {
            errors.password = 'Password does not meet all requirements';
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 'otp':
        if (!value.trim()) {
          errors.otp = 'OTP code is required';
        } else if (!/^\d{6}$/.test(value)) {
          errors.otp = 'OTP must be 6 digits';
        }
        break;
    }
    
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Real-time validation for password
    if (name === 'password' && !isLogin) {
      setPasswordValidation(validatePassword(value));
    }
    
    // Real-time validation for confirm password
    if (name === 'confirmPassword' && !isLogin) {
      const errors = validateField(name, value);
      if (errors.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: errors.confirmPassword
        }));
      }
    }
  };

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (isLogin) {
      if (loginMethod === 'otp' && !otpSent) {
        return !formData.phone;
      }
      if (loginMethod === 'otp' && otpSent) {
        return !formData.otp;
      }
      return !formData.email || !formData.password;
    }
    return !formData.name || !formData.email || !formData.password || !formData.confirmPassword;
  };

  const renderPasswordInputs = () => {
    if (isLogin && loginMethod === 'otp') return null;
    
    return (
      <>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-base font-semibold text-gray-700">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={loginMethod === 'email'}
              className={`w-full pl-12 pr-14 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm ${
                fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span>
              {fieldErrors.password}
            </p>
          )}
          {!isLogin && renderPasswordRequirements()}
        </div>
        {!isLogin && (
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-base font-semibold text-gray-700">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm ${
                  fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                }`}
                placeholder="Confirm your password"
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        )}
      </>
    );
  };

  const renderPasswordRequirements = () => (
    <div className="mt-2 text-xs">
      <p className="mb-1 text-gray-600">Password must meet the following requirements:</p>
      <ul className="space-y-1">
        <li className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{passwordValidation.length ? '✓' : '○'}</span>
          At least 8 characters
        </li>
        <li className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{passwordValidation.uppercase ? '✓' : '○'}</span>
          One uppercase letter (A-Z)
        </li>
        <li className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{passwordValidation.lowercase ? '✓' : '○'}</span>
          One lowercase letter (a-z)
        </li>
        <li className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{passwordValidation.number ? '✓' : '○'}</span>
          One number (0-9)
        </li>
        <li className={`flex items-center ${passwordValidation.special ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{passwordValidation.special ? '✓' : '○'}</span>
          One special character (!@#$%^&*)
        </li>
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-primary-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-scale-in">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              {isLogin 
                ? 'Sign in to your account to continue your shopping journey' 
                : 'Create your account and discover premium products'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 shadow-sm animate-shake">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-base font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm ${
                      fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {isLogin && loginMethod === 'otp' ? (
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-base font-semibold text-gray-700">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm ${
                      fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="email" className="block text-base font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm ${
                      fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            )}

            {isLogin && loginMethod === 'otp' && otpSent ? (
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-base font-semibold text-gray-700">
                  OTP Code
                </label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm text-center text-lg tracking-widest ${
                      fieldErrors.otp ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                    }`}
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
                {fieldErrors.otp && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {fieldErrors.otp}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Didn\'t receive OTP?'}
                  </span>
                  {otpTimer === 0 && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            ) : renderPasswordInputs()}

            {isLogin && loginMethod === 'email' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-base text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-800">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className="w-full bg-gradient-to-r from-primary-900 to-primary-700 text-white px-6 py-4 rounded-xl hover:from-primary-800 hover:to-primary-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5 mr-3" />
                  <span>
                    {isLogin && loginMethod === 'otp' && !otpSent
                      ? 'Sending OTP...'
                      : isLogin
                      ? 'Signing you in...'
                      : 'Creating your account...'
                    }
                  </span>
                </>
              ) : (
                <span className="flex items-center">
                  {isLogin && loginMethod === 'otp' && !otpSent
                    ? 'Send OTP'
                    : isLogin && loginMethod === 'otp' && otpSent
                    ? 'Verify OTP & Sign In'
                    : isLogin
                    ? 'Sign In to Your Account'
                    : 'Create Your Account'
                  }
                </span>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2 px-4 rounded-lg text-base font-medium transition-all duration-200 ${
                    loginMethod === 'email'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-2 px-4 rounded-lg text-base font-medium transition-all duration-200 ${
                    loginMethod === 'otp'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  OTP Login
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={handleToggleForm}
                className="font-semibold text-primary-600 hover:text-primary-800 transition-colors underline decoration-2 underline-offset-2 hover:decoration-primary-800"
              >
                {isLogin ? 'Create one now' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;