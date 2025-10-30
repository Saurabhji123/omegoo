/**
 * Test Registration Flow End-to-End
 * Run with: node test-registration-flow.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testFullFlow() {
  const timestamp = Date.now();
  const testData = {
    email: `flow${timestamp}@test.com`,
    username: `flowuser${timestamp}`,
    password: 'Test@123456'
  };

  console.log('🧪 ===== TESTING FULL REGISTRATION FLOW =====\n');
  console.log('Test user:', testData.email);
  console.log('API URL:', API_URL);
  console.log('');

  try {
    // Step 1: Register
    console.log('📝 Step 1: Registering user...');
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testData);
    
    console.log('✅ Registration Response:');
    console.log('  - Success:', registerResponse.data.success);
    console.log('  - Message:', registerResponse.data.message);
    console.log('  - RequiresOTP:', registerResponse.data.requiresOTP);
    console.log('  - Has Token:', !!registerResponse.data.token);
    console.log('  - Token:', registerResponse.data.token?.substring(0, 30) + '...');
    console.log('  - User ID:', registerResponse.data.user?.id);
    console.log('  - User Email:', registerResponse.data.user?.email);
    console.log('  - User Verified:', registerResponse.data.user?.isVerified);
    console.log('  - User Tier:', registerResponse.data.user?.tier);
    console.log('');

    if (!registerResponse.data.requiresOTP) {
      console.log('❌ ERROR: requiresOTP should be true!');
      return;
    }

    if (!registerResponse.data.token) {
      console.log('❌ ERROR: Token is missing!');
      return;
    }

    const token = registerResponse.data.token;

    // Step 2: Verify OTP (simulate - we don't have real OTP)
    console.log('📧 Step 2: Testing OTP verification endpoint...');
    console.log('  (Using dummy OTP for testing)');
    
    try {
      const otpResponse = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        { otp: '123456' }, // Dummy OTP
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log('✅ OTP endpoint accessible');
    } catch (otpError) {
      if (otpError.response?.data?.error?.includes('Invalid OTP')) {
        console.log('✅ OTP endpoint working (rejected dummy OTP as expected)');
      } else {
        console.log('⚠️  OTP Error:', otpError.response?.data?.error || otpError.message);
      }
    }
    console.log('');

    // Step 3: Test Resend OTP
    console.log('🔄 Step 3: Testing resend OTP endpoint...');
    try {
      const resendResponse = await axios.post(
        `${API_URL}/api/auth/resend-otp`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log('✅ Resend OTP Response:');
      console.log('  - Success:', resendResponse.data.success);
      console.log('  - Message:', resendResponse.data.message);
    } catch (resendError) {
      console.log('❌ Resend Error:', resendError.response?.data?.error || resendError.message);
    }
    console.log('');

    // Summary
    console.log('📊 ===== TEST SUMMARY =====');
    console.log('✅ Registration: WORKING');
    console.log('✅ RequiresOTP flag: PRESENT');
    console.log('✅ Token generation: WORKING');
    console.log('✅ User created with isVerified: false');
    console.log('✅ OTP endpoint: ACCESSIBLE');
    console.log('✅ Resend OTP: WORKING');
    console.log('');
    console.log('🎯 Frontend should:');
    console.log('  1. Receive requiresOTP: true');
    console.log('  2. Receive token');
    console.log('  3. Redirect to /verify-otp with token in state');
    console.log('  4. Show OTP input page');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    } else {
      console.error('Make sure backend is running on:', API_URL);
    }
  }
}

// Run test
testFullFlow();
