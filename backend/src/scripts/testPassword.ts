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

    const emailRaw = process.env.OWNER_ADMIN_EMAIL?.trim();
    if (!emailRaw) {
      console.error('❌ OWNER_ADMIN_EMAIL must be set to run this test.');
      await mongoose.disconnect();
      return;
    }

    const email = emailRaw.toLowerCase();
    const testPassword = process.env.OWNER_ADMIN_PASSWORD?.trim();

    if (!testPassword) {
      console.error('❌ OWNER_ADMIN_PASSWORD must be set to run this test.');
      await mongoose.disconnect();
      return;
    }

    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      console.log('❌ Admin not found!');
      await mongoose.disconnect();
      return;
    }

  console.log('✅ Admin found in database');
  console.log('📧 Email: [HIDDEN - matches OWNER_ADMIN_EMAIL env value]');
  console.log('👤 Username: [HIDDEN - stored in database]');
  console.log('🔒 Password hash: [HIDDEN]\n');

    // Test password
  console.log('🧪 Testing password using environment value (hidden)');
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash || '');

    if (isValid) {
      console.log('✅ PASSWORD MATCHES! Login should work! 🎉\n');
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH! ⚠️');
      console.log('💡 Need to reset password\n');

      // Show what the correct hash should be using provided env password
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('🔧 Creating new hash from provided environment password...');
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
