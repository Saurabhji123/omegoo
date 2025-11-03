/**
 * Update Owner Admin Password
 * Updates the password for saurabhshukla1966@gmail.com to @SAurabh$133
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

    const ownerEmail = 'saurabhshukla1966@gmail.com';
  const newPassword = '@SAurabh$133';

    // Find owner admin
    const admin = await AdminModel.findOne({ email: ownerEmail });

    if (!admin) {
      console.log('❌ Owner admin not found!');
      console.log('💡 Run: npm run admin:create');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Owner admin found');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Username: ${admin.username}\n`);

    // Hash new password
    console.log('🔒 Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 12);

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
    console.log('📧 Email: saurabhshukla1966@gmail.com');
  console.log('🔑 New Password: @SAurabh$133');
    console.log('👑 Role: super_admin (Owner)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now login at: https://omegoo.vercel.app/omegoo-admin\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

updateOwnerPassword();
