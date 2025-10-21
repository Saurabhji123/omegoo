/**
 * Test password verification
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AdminSchema = new mongoose.Schema({
  id: { type: String },
  username: { type: String },
  email: { type: String },
  passwordHash: { type: String },
  role: { type: String },
  isActive: { type: Boolean },
  isOwner: { type: Boolean }
});

const AdminModel = mongoose.model('Admin', AdminSchema);

async function testPassword() {
  try {
    const mongoUri = process.env.MONGODB_URI || '';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    const email = 'saurabhshukla1966@gmail.com';
    const testPassword = '@Omegoo133';

    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      console.log('❌ Admin not found!');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Admin found in database');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🔒 Password Hash: ${admin.passwordHash}\n`);

    // Test password
    console.log(`🧪 Testing password: "${testPassword}"`);
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash || '');

    if (isValid) {
      console.log('✅ PASSWORD MATCHES! Login should work! 🎉\n');
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH! ⚠️');
      console.log('💡 Need to reset password\n');
      
      // Show what the correct hash should be
      const newHash = await bcrypt.hash('@Omegoo133', 12);
      console.log('🔧 Creating new hash for password "@Omegoo133"...');
      console.log(`📝 New Hash: ${newHash}\n`);
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testPassword();
