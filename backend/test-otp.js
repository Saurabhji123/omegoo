// Test OTP Registration Flow
const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testRegistration() {
  console.log('🧪 Testing OTP Registration Flow...\n');

  const testUser = {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'Test@123'
  };

  console.log('📝 Registering user:', testUser.email);

  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, testUser);
    
    console.log('\n✅ Registration Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('RequiresOTP:', response.data.requiresOTP);
    console.log('Token:', response.data.token ? response.data.token.substring(0, 20) + '...' : 'N/A');
    console.log('User:', response.data.user);
    
    if (response.data.requiresOTP) {
      console.log('\n✅ OTP flow working correctly!');
      console.log('📧 Check the email for OTP (if email service is configured)');
      console.log('🔑 Frontend should redirect to /verify-otp with token');
    } else {
      console.log('\n❌ ERROR: requiresOTP should be true for email registration!');
    }

  } catch (error) {
    if (error.response) {
      console.log('\n❌ Registration Error:');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('\n❌ Network Error:', error.message);
      console.log('Make sure backend is running on', API_URL);
    }
  }
}

testRegistration();
