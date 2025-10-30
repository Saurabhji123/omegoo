import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const OTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  
  console.log('🔍 ===== OTP VERIFICATION PAGE LOADED =====');
  console.log('🔍 Location state:', location.state);
  console.log('🔍 Has state?', location.state ? 'YES' : 'NO');
  
  // Get token from location state (passed from registration)
  const token = location.state?.token;
  const email = location.state?.email;
  
  console.log('🔍 Token:', token ? token.substring(0, 30) + '...' : 'MISSING');
  console.log('🔍 Email:', email || 'MISSING');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      console.log('❌ No token found, redirecting to login...');
      navigate('/login-register', { replace: true });
    } else {
      console.log('✅ Token found, staying on OTP page');
    }
  }, [token, navigate]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]; // Only take first character
    }

    if (!/^\d*$/.test(value)) {
      return; // Only allow digits
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6) {
        handleVerify(completeOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 6) - 1;
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  // Verify OTP
  const handleVerify = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('कृपया 6-digit OTP enter करें');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`,
        { otp: otpToVerify },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        
        // Refresh user data to get updated isVerified status
        await refreshUser();
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      
      if (err.response?.data?.expired) {
        setError('OTP expired हो गया है। कृपया नया OTP भेजें।');
        setCanResend(true);
      } else {
        setError(err.response?.data?.error || 'Invalid OTP. कृपया फिर से try करें।');
      }
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError('');
    setCanResend(false);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-otp`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setTimer(600); // Reset timer to 10 minutes
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        alert('✅ नया OTP आपके email पर भेज दिया गया है!');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.error || 'Failed to resend OTP');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-6 mb-6 inline-block">
            <svg className="w-16 h-16 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Email Verification 📧
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            हमने आपके email <span className="font-semibold text-white">{email}</span> पर 6-digit OTP भेजा है
          </p>
        </div>

        {/* OTP Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-white border-opacity-20">
          
          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ✅ Verified Successfully!
                </h2>
                <p className="text-gray-300">
                  आपका email verify हो गया है। Home page पर redirect हो रहे हैं...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  timer < 60 ? 'bg-red-500 bg-opacity-20 text-red-300' : 'bg-blue-500 bg-opacity-20 text-blue-300'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono font-semibold">{formatTime(timer)}</span>
                </div>
              </div>

              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-3 text-center">
                  6-Digit OTP दर्ज करें
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-white bg-opacity-20 border-2 border-white border-opacity-30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-opacity-30 transition-all disabled:opacity-50"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={() => handleVerify()}
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg mb-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  '✅ Verify Email'
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-purple-300 hover:text-white font-semibold underline transition-colors disabled:opacity-50"
                  >
                    🔄 नया OTP भेजें
                  </button>
                ) : (
                  <p className="text-gray-400 text-sm">
                    OTP नहीं मिला? {formatTime(timer)} में resend करें
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                <p className="text-gray-300 text-xs text-center mb-3">
                  💡 <span className="font-semibold">Tip:</span> अपना inbox check करें या spam folder देखें
                </p>
                <div className="flex justify-center gap-4 text-xs text-gray-400">
                  <button
                    onClick={() => navigate('/login-register')}
                    className="hover:text-white transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-gray-400">
          🔒 यह OTP केवल आपके email verification के लिए है। किसी से share न करें।
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
