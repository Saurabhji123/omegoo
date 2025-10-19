import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Omegoo
          </h1>
          <p className="text-purple-200 text-lg">
            Connect with strangers worldwide
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          {/* Toggle Tabs */}
          <div className="flex mb-8 bg-white bg-opacity-10 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isLogin 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                !isLogin 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Username (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-purple-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Choose a username"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-purple-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-purple-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-purple-300 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
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
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5" />
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white border-opacity-20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-purple-200">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              width="384"
              text="continue_with"
            />
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-purple-300">
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
        <div className="mt-6 text-center text-sm text-purple-300">
          <p>Omegoo v1.0 - Connect Safely</p>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
