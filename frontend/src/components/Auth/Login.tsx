import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { storageService } from '../../services/storage';
import LoadingSpinner from '../UI/LoadingSpinner';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const { login } = useAuth();

  const generateFingerprint = (): string => {
    // Simple browser fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Omegoo fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width + 'x' + window.screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 4,
      (navigator as any).deviceMemory || 4
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  };

  const handleAutoLogin = async () => {
    if (hasAttemptedLogin) return; // Prevent multiple attempts
    
    try {
      setHasAttemptedLogin(true);
      setLoading(true);
      setError(null);

      const deviceId = storageService.getOrCreateDeviceId();
      const userAgent = navigator.userAgent;
      const fingerprint = generateFingerprint();

      await login(deviceId, userAgent, fingerprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAttemptedLogin) {
      handleAutoLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    handleAutoLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Omegoo</h1>
          </div>
          
          <LoadingSpinner size="large" message="Setting up your anonymous profile..." />
          
          <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>🔒 No personal information required</p>
            <p>🎭 Complete anonymity guaranteed</p>
            <p>🛡️ AI-powered safety protection</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-100 dark:bg-danger-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h2>
          </div>

          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-danger-800 dark:text-danger-200">
              {error}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="btn-primary w-full"
            >
              Try Again
            </button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Having trouble? Check your internet connection.</p>
              <p>If the problem persists, contact support@omegoo.app</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't render as we auto-login on mount
  return null;
};

export default Login;