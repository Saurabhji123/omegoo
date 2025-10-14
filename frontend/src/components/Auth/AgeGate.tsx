import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AgeGate: React.FC = () => {
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { acceptTerms } = useAuth();

  const handleAccept = () => {
    if (accepted) {
      acceptTerms();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img 
              src="/logo512.png" 
              alt="Omegoo Logo" 
              className="w-16 h-16 rounded-2xl shadow-lg object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Omegoo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect anonymously, chat safely
          </p>
        </div>

        {/* Age Verification */}
        <div className="space-y-6">
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800 dark:text-danger-200">
                  18+ Only Platform
                </h3>
                <div className="mt-2 text-sm text-danger-700 dark:text-danger-300">
                  <p>
                    This application is strictly for users 18 years and older.
                    By continuing, you confirm that you are at least 18 years old.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Safety First
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg className="h-4 w-4 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Zero tolerance for explicit content or harassment
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                AI-powered moderation for your safety
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Easy reporting and blocking features
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-success-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Your privacy is our priority
              </li>
            </ul>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="age-consent"
                name="age-consent"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="age-consent" className="text-gray-700 dark:text-gray-300">
                I confirm that I am at least 18 years old and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAccept}
            disabled={!accepted}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              accepted
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Omegoo
          </button>

          {/* Warning Text */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Misuse of this platform will result in permanent ban and may be reported to law enforcement.
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Terms of Service & Privacy Policy
                </h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <p>By using Omegoo, you agree to our terms and policies which include:</p>
                <ul>
                  <li>You must be 18 years or older to use this service</li>
                  <li>Zero tolerance for explicit content, harassment, or illegal activities</li>
                  <li>Conversations are monitored for safety using AI technology</li>
                  <li>Evidence of violations may be preserved and reported to authorities</li>
                  <li>You can be banned for violations with no prior warning</li>
                  <li>We collect minimal data necessary for service operation</li>
                  <li>Your privacy is protected - no real names or personal info required</li>
                </ul>
                <p className="text-danger-600 dark:text-danger-400 font-medium mt-4">
                  This is a safe space for anonymous conversations. Help us keep it that way.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="btn-primary"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgeGate;