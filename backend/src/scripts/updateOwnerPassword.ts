/**
 * Update Owner Admin Password
 * Updates the owner admin password using environment configuration
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
  permissions: [{ type: String }],
  isActive: { type: Boolean },
  isOwner: { type: Boolean },
  lastLoginAt: { type: Date },
  createdAt: { type: Date },
  updatedAt: { type: Date }
});

const AdminModel = mongoose.model('Admin', AdminSchema);

async function updateOwnerPassword() {
  try {
    const mongoUri = process.env.MONGODB_URI || '';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    const ownerEmailRaw = process.env.OWNER_ADMIN_EMAIL?.trim();
    if (!ownerEmailRaw) {
      console.error('❌ OWNER_ADMIN_EMAIL must be set before running this script.');
      await mongoose.disconnect();
      return;
    }

    const ownerEmail = ownerEmailRaw.toLowerCase();
    const newPasswordHashFromEnv = process.env.OWNER_ADMIN_PASSWORD_HASH?.trim();
    const newPasswordFromEnv = process.env.OWNER_ADMIN_PASSWORD?.trim();

    if (!newPasswordHashFromEnv && !newPasswordFromEnv) {
      console.error('❌ OWNER_ADMIN_PASSWORD or OWNER_ADMIN_PASSWORD_HASH must be set before running this script.');
      await mongoose.disconnect();
      return;
    }

    // Find owner admin
    const admin = await AdminModel.findOne({ email: ownerEmail });

    if (!admin) {
      console.log('❌ Owner admin not found!');
      console.log('💡 Run: npm run admin:create');
      await mongoose.disconnect();
      return;
    }

  console.log('✅ Owner admin found');
  console.log('📧 Email: [HIDDEN - matches OWNER_ADMIN_EMAIL env value]');
  console.log('👤 Username: [HIDDEN - stored in database]\n');

    // Hash new password
    console.log('🔒 Preparing new password hash...');
    const passwordHash = newPasswordHashFromEnv
      ? newPasswordHashFromEnv
      : await bcrypt.hash(newPasswordFromEnv!, 12);

    // Update password
    await AdminModel.updateOne(
      { email: ownerEmail },
      { 
        passwordHash,
        isOwner: true,
        role: 'super_admin',
        isActive: true,
        updatedAt: new Date()
      }
    );

    console.log('✅ Password updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email: [HIDDEN - matches OWNER_ADMIN_EMAIL env value]');
    console.log('🔑 New password applied from environment (value hidden)');
    console.log('👑 Role: super_admin (Owner)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 You can now login at: https://omegoo.chat/omegoo-admin\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

updateOwnerPassword();
