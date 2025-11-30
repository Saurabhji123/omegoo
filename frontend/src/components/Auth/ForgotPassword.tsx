import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(trimmedEmail);
      setMessage(response.message || 'If your email is registered, you\'ll get a reset link shortly.');
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      if (err?.code === 'RESET_RATE_LIMIT') {
        setError('You have requested too many reset links. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Unable to send reset email. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo512.png" alt="Omegoo" className="auth-logo-breathe h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              <div className="text-xl sm:text-2xl font-bold text-white">Omegoo</div>
            </Link>
            <Link
              to="/login"
              className="text-white hover:text-gray-300 transition-colors font-medium text-sm sm:text-base flex items-center space-x-1"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Back to login</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10 min-h-[calc(100vh-64px)]">
        <div className="auth-glass-container max-w-md w-full bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="auth-heading-gradient text-3xl sm:text-4xl font-semibold text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-200">
              Enter the email you use for Omegoo and we&apos;ll send a secure reset link.
            </p>
          </div>

          {submitted ? (
            <div className="auth-message auth-message-success bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-4 rounded-xl text-sm sm:text-base flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Check your inbox</p>
                <p className="mt-1 leading-relaxed">{message}</p>
                <p className="mt-2 text-xs text-gray-200">Didn&apos;t get it? Remember to check your spam folder.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="auth-message auth-message-error bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="neon-button btn-primary w-full py-2.5 sm:py-3 px-4 font-medium text-sm sm:text-base rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="auth-spinner animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Send reset link</span>
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs sm:text-sm text-gray-200">
            Remember your password?{' '}
            <Link to="/login" className="auth-link text-white font-medium hover:underline">
              Return to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
