/**
 * Check if admin exists in database
 */
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

async function checkAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || '';
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Count total admins
    const totalAdmins = await AdminModel.countDocuments();
    console.log(`📊 Total Admins in Database: ${totalAdmins}\n`);

    if (totalAdmins === 0) {
      console.log('⚠️  NO ADMINS FOUND! Database is empty.');
      console.log('💡 Run: npm run admin:create\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // List all admins
    const allAdmins = await AdminModel.find({});
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ALL ADMINS IN DATABASE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. Admin Details:`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Username: ${admin.username}`);
      console.log(`   🔑 Role: ${admin.role}`);
      console.log(`   🛡️  Owner: ${admin.isOwner ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   ✅ Active: ${admin.isActive ? 'YES' : 'NO'}`);
      console.log(`   🔒 Password Hash: ${admin.passwordHash ? admin.passwordHash.substring(0, 20) + '...' : 'N/A'}`);
      console.log(`   📅 Created: ${admin.createdAt}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check specific email
    const targetEmail = 'saurabhshukla1966@gmail.com';
    const specificAdmin = await AdminModel.findOne({ email: targetEmail });

    if (specificAdmin) {
      console.log(`✅ Admin with email '${targetEmail}' EXISTS!`);
      console.log('   Can login with EMAIL or USERNAME\n');
    } else {
      console.log(`❌ Admin with email '${targetEmail}' NOT FOUND!`);
      console.log('💡 Create using: npm run admin:create\n');
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAdmin();
