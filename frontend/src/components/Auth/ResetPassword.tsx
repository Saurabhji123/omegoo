import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockClosedIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const ResetPassword: React.FC = () => {
  const { validateResetToken, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token');
  const token = tokenParam ? tokenParam.trim() : '';

  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'complete'>(token ? 'checking' : 'invalid');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runValidation = async () => {
      if (!token) {
        setError('Reset link is missing. Please request a new one.');
        setStatus('invalid');
        return;
      }

      setStatus('checking');
      setError('');

      try {
        await validateResetToken(token);
        if (!cancelled) {
          setStatus('valid');
        }
      } catch (err: any) {
        console.error('Reset token validation failed:', err);
        if (!cancelled) {
          setError(err.message || 'This reset link is invalid or has expired.');
          setStatus('invalid');
        }
      }
    };

    runValidation();

    return () => {
      cancelled = true;
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [token, validateResetToken]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, password);
      setSuccessMessage(response.message || 'Password updated successfully.');
      setStatus('complete');
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate('/login');
        redirectTimeoutRef.current = null;
      }, 2500);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      if (err?.code === 'RESET_EXPIRED') {
        setError('This reset link has expired. Please request a new one.');
      } else if (err?.code === 'INVALID_TOKEN') {
        setError('This reset link is no longer valid. Please request a fresh one.');
      } else {
        setError(err?.message || 'Unable to reset password. Please request a new link.');
      }
      if (err?.code === 'RESET_EXPIRED' || err?.code === 'INVALID_TOKEN') {
        setStatus('invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo512.png" alt="Omegoo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              <div className="text-xl sm:text-2xl font-bold text-white">Omegoo</div>
            </Link>
            <Link
              to="/login"
              className="text-white hover:text-purple-300 transition-colors font-medium text-sm sm:text-base flex items-center space-x-1"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Back to login</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10 min-h-[calc(100vh-64px)]">
        <div className="max-w-md w-full bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">Set a new password</h1>
            <p className="mt-2 text-sm sm:text-base text-purple-200">
              Choose a strong password to keep your Omegoo account secure.
            </p>
          </div>

          {status === 'checking' && (
            <div className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-6 text-center text-purple-100">
              <div className="mx-auto mb-3 h-10 w-10 border-4 border-purple-200 border-t-transparent rounded-full animate-spin" />
              <p className="font-medium">Validating link...</p>
              <p className="text-sm mt-2 text-purple-200">Hang tight while we confirm your reset request.</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-4 rounded-xl text-sm sm:text-base flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Reset link unavailable</p>
                <p className="mt-1 leading-relaxed">{error || 'This link no longer works. Request a fresh password reset to continue.'}</p>
                <p className="mt-2 text-xs text-purple-200">
                  Still stuck? Contact <a className="text-white font-medium" href="mailto:support@omegoo.com">support@omegoo.com</a> and we&apos;ll help you out.
                </p>
                <p className="mt-2 text-xs text-purple-200">
                  Need a new link?{' '}
                  <Link to="/forgot-password" className="text-white font-medium hover:underline">
                    Request password reset
                  </Link>
                </p>
              </div>
            </div>
          )}

          {status === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2" htmlFor="password">
                  New password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    autoFocus
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-2" htmlFor="confirm-password">
                  Confirm password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm sm:text-base placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm sm:text-base rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Save new password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'complete' && (
            <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-4 rounded-xl text-sm sm:text-base flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Password updated</p>
                <p className="mt-1 leading-relaxed">{successMessage}</p>
                <p className="mt-2 text-xs text-purple-200">Redirecting you to login…</p>
                <p className="mt-2 text-xs text-purple-200">
                  Prefer to jump now?{' '}
                  <Link to="/login" className="text-white font-medium hover:underline">
                    Go to login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
