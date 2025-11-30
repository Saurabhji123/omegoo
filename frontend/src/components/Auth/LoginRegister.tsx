import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';
import { LockClosedIcon, EnvelopeIcon, UserIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import './Auth.css';

interface LoginRegisterProps {
  onSuccess?: () => void;
}

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.in',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'zohomail.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru'
]);

const LoginRegister: React.FC<LoginRegisterProps> = ({ onSuccess }) => {
  const { loginWithEmail, register, loginWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // CRITICAL: Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔄 User already logged in, redirecting to home...');
      window.location.href = '/';
    }
  }, [user, authLoading]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'others' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMailGuard, setShowMailGuard] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔐 Logging in...');
        await loginWithEmail(email, password);
        console.log('✅ Login successful - state updated');
        
        // CRITICAL: Wait a tiny bit for React state to update
        // This prevents race condition where navigation happens before user state is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Navigating to home page...');
        
        // Call onSuccess callback if provided (for inline usage)
        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate to home page only if no callback provided
          navigate('/', { replace: true });
          
          // Fallback: Force reload to home if navigation doesn't work
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              console.log('🔄 Navigation stuck, forcing redirect...');
              window.location.href = '/';
            }
          }, 200);
        }
      } else {
        if (!gender) {
          setError('Please select your gender');
          setLoading(false);
          return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailDomain = normalizedEmail.split('@')[1] || '';

        if (!ALLOWED_EMAIL_DOMAINS.has(emailDomain)) {
          setLoading(false);
          setShowMailGuard(true);
          return;
        }

        console.log('📝 ===== REGISTRATION START =====');
        console.log('📝 Registration data:', { email: normalizedEmail, username, gender });
        
        const response = await register(normalizedEmail, username, password, gender);
        
        console.log('✅ ===== REGISTRATION RESPONSE =====');
        console.log('Full response object:', response);
        console.log('Response type:', typeof response);
        console.log('Response is null?', response === null);
        console.log('Response is undefined?', response === undefined);
        
        // ALWAYS redirect to OTP page for email registration
        console.log('📧 ===== EMAIL REGISTRATION - REDIRECTING TO OTP =====');
        console.log('📧 Will redirect to /verify-otp');
        console.log('📧 Email to pass:', email);
        console.log('📧 Username to pass:', username);
        
        // Navigate to OTP verification page with email and username
        console.log('📧 Calling navigate...');
        navigate('/verify-otp', {
          state: {
            email: email,
            username: username,
            gender: gender
          }
        });
        console.log('✅ ===== NAVIGATION TO /verify-otp COMPLETE =====');
        return; // Don't continue execution
      }
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Check if error indicates user should login instead
      if (err.message?.includes('already registered')) {
        setError('Email already registered. Please login instead.');
        setIsLogin(true); // Switch to login mode
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Google Sign-In successful, processing...');
      
      // Decode JWT token from Google
      const decoded: any = jwtDecode(credentialResponse.credential!);
      console.log('📧 Google user:', decoded.email, decoded.name);
      
      // Send to backend
      await loginWithGoogle(credentialResponse.credential!);
      
      console.log('✅ Google authentication successful - state updated');
      
      // CRITICAL: Wait for React state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Navigating to home page...');
      
      // Call onSuccess callback if provided (for inline usage)
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to home page only if no callback provided
        navigate('/', { replace: true });
        
        // Fallback: Force reload to home if navigation doesn't work
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.log('🔄 Navigation stuck, forcing redirect...');
            window.location.href = '/';
          }
        }, 200);
      }
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In Error
  const handleGoogleError = () => {
    console.error('❌ Google Sign-In failed');
    setError('Google sign-in failed. Please try email/password instead.');
  };

  return (
    <div className="auth-page-container min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
      {showMailGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setShowMailGuard(false)}
          ></div>
          <div className="relative max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-red-200">
            <div className="rounded-t-2xl px-6 py-4" style={{ backgroundColor: 'var(--primary-brand)' }}>
              <h3 className="text-white text-lg font-semibold">Use a trusted email</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-700">
                We noticed this address looks temporary. Please sign up with a genuine email from providers like Gmail, Outlook, Zoho, Proton, or Yahoo so we can keep your account secure.
              </p>
              <p className="text-xs text-gray-500">
                Disposable inboxes are blocked to prevent abuse. Switch to your real mailbox and try again.
              </p>
            </div>
            <div className="px-6 pb-5">
              <button
                type="button"
                onClick={() => setShowMailGuard(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg py-2.5 transition"
              >
                Got it, I&apos;ll use a real email
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Navbar */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Image */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="auth-logo-breathe h-8 w-8 sm:h-10 sm:w-10 rounded-lg"
              />
              <div className="text-xl sm:text-2xl font-bold text-white">
                Omegoo
              </div>
            </Link>

            {/* Right side - Home link */}
            <Link 
              to="/"
              className="text-white hover:text-red-300 transition-colors font-medium text-sm sm:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-3 sm:p-4 min-h-[calc(100vh-64px)]">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="auth-heading-gradient text-4xl sm:text-5xl font-bold text-white mb-2">
            Omegoo
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            Connect with strangers worldwide
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="auth-glass-container bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white border-opacity-20">
          {/* Toggle Tabs */}
          <div className="flex mb-6 sm:mb-8 bg-white bg-opacity-10 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                isLogin 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                !isLogin 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="auth-message auth-message-error bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Username (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Choose a username"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Gender (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'others' | '')}
                    className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
                    required={!isLogin}
                  >
                    <option value="" disabled className="bg-gray-900 text-red-300">
                      Select your gender
                    </option>
                    <option value="male" className="bg-gray-900 text-white">Male</option>
                    <option value="female" className="bg-gray-900 text-white">Female</option>
                    <option value="others" className="bg-gray-900 text-white">Others</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-300">
                    <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-red-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-red-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 sm:top-3 text-red-300 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-red-300 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="auth-link text-xs sm:text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="neon-button btn-primary w-full py-2.5 sm:py-3 px-4 font-medium text-sm sm:text-base rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="auth-spinner animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white border-opacity-20"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 text-gray-300" style={{ backgroundColor: 'var(--bg-body)' }}>Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button - Centered and Styled */}
          <div className="flex justify-center items-center">
            <div className="flex justify-center" style={{ width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="continue_with"
                shape="pill"
                logo_alignment="center"
              />
            </div>
          </div>

          {/* Terms */}
          <p className="mt-5 sm:mt-6 text-center text-xs text-red-300">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-white hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-white hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-red-300">
          <p>Omegoo - Connect Safely</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginRegister;

