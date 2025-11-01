import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface LocationState {
  email: string;
  username: string;
}

const VerifyOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  
  const state = location.state as LocationState;
  const email = state?.email;
  const username = state?.username;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email || !username) {
      navigate('/');
    }
  }, [email, username, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Please paste a valid 6-digit code');
      return;
    }

    const newOtp = pastedData.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
    
    // Auto-submit
    handleVerify(pastedData);
  };

  // Verify OTP
  const handleVerify = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');

    if (otpToVerify.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp: otpToVerify,
      });

      if (response.data.success) {
        // Login user with token
        await loginWithToken(response.data.token);
        
        // Show success and redirect to Home (root)
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (err: any) {
      console.error('❌ OTP verification failed:', err);
      setError(
        err.response?.data?.message || 
        'OTP verification failed. कृपया फिर से try करें।'
      );
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/auth/resend-otp`, { email });
      
      setResendCooldown(60); // 60 seconds cooldown
      setTimer(600); // Reset timer to 10 minutes
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('❌ Resend OTP failed:', err);
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            📧
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We sent a verification code to <span className="font-semibold text-purple-600">{email}</span>
          </p>
          <p className="text-sm text-orange-600 mt-2 font-medium">
            💡 Check your spam folder if you don't see the email
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-4" onPaste={handlePaste}>
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
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                  digit
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            <p className={`text-sm font-semibold ${timer <= 60 ? 'text-red-500' : 'text-gray-600'}`}>
              ⏰ Code expires in: {formatTime(timer)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.some((digit) => !digit)}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 ${
            loading || otp.some((digit) => !digit)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Resend Section */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className={`font-semibold transition-all duration-200 ${
              resendLoading || resendCooldown > 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-purple-600 hover:text-purple-700 hover:underline'
            }`}
          >
            {resendLoading ? (
              'Sending...'
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center border-t pt-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
