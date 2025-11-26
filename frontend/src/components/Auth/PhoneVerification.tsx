import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const PhoneVerification: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { verifyPhone } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid Indian mobile number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await authAPI.requestOTP(phone);
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await verifyPhone(phone, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.requestOTP(phone);
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 backdrop-blur-sm border border-green-400 border-opacity-30 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
          </h2>
          <p className="text-gray-300 mt-2">
            {step === 'phone' 
              ? 'Get verified to unlock video chat and premium features'
              : `We've sent a 6-digit code to +91 ${phone}`
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-10 backdrop-blur-sm border border-red-400 border-opacity-30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Phone Input Form */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="input-field pl-12"
                  maxLength={10}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                We'll only use this for verification. Your number won't be shared.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="btn-primary disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none w-full flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Send OTP'
              )}
            </button>

            {/* Benefits */}
            <div className="pt-4 border-t border-gray-600 border-opacity-30">
              <h3 className="text-sm font-medium text-white mb-3">
                Verification Benefits:
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center">
                  <svg className="h-3 w-3 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlock video chat feature
                </li>
                <li className="flex items-center">
                  <svg className="h-3 w-3 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Get verified badge
                </li>
                <li className="flex items-center">
                  <svg className="h-3 w-3 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Earn 10 free coins
                </li>
                <li className="flex items-center">
                  <svg className="h-3 w-3 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority matching
                </li>
              </ul>
            </div>
          </form>
        )}

        {/* OTP Input Form */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                6-Digit OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-600 bg-opacity-50 hover:bg-opacity-70 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex-1 flex items-center justify-center"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className={`text-sm ${
                  resendCooldown > 0 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-blue-400 hover:text-blue-300'
                }`}
              >
                {resendCooldown > 0 
                  ? `Resend OTP in ${resendCooldown}s`
                  : 'Resend OTP'
                }
              </button>
            </div>
          </form>
        )}

        {/* Skip Option */}
        <div className="mt-6 pt-6 border-t border-gray-600 border-opacity-30 text-center">
          <p className="text-xs text-gray-400 mb-2">
            Want to try text chat first?
          </p>
          <button className="text-sm text-blue-400 hover:text-blue-300">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;