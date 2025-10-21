import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';
import { LockClosedIcon, EnvelopeIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginRegisterProps {
  onSuccess?: () => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onSuccess }) => {
  const { loginWithEmail, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔐 Logging in...');
        await loginWithEmail(email, password);
        console.log('✅ Login successful, redirecting to home...');
      } else {
        console.log('📝 Registering...');
        await register(email, username, password);
        console.log('✅ Registration successful, redirecting to home...');
      }
      
      // Navigate to home page after successful auth
      navigate('/');
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
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
      
      console.log('✅ Google authentication successful, redirecting...');
      navigate('/');
      
      if (onSuccess) onSuccess();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navbar */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                Omegoo
              </div>
            </Link>

            {/* Right side - Home link */}
            <Link 
              to="/"
              className="text-white hover:text-purple-300 transition-colors font-medium text-sm sm:text-base"
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Omegoo
          </h1>
          <p className="text-purple-200 text-base sm:text-lg">
            Connect with strangers worldwide
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white border-opacity-20">
          {/* Toggle Tabs */}
          <div className="flex mb-6 sm:mb-8 bg-white bg-opacity-10 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                isLogin 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition ${
                !isLogin 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Username (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Choose a username"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 sm:top-3 text-purple-300 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-purple-300 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm sm:text-base rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
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
              <span className="px-3 sm:px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-purple-200">Or continue with</span>
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
          <p className="mt-5 sm:mt-6 text-center text-xs text-purple-300">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-purple-100 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-purple-100 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-purple-300">
          <p>Omegoo - Connect Safely</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginRegister;
