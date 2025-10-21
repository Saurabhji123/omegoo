import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'super_admin' },
  permissions: [String],
  isOwner: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdminModel = mongoose.model('Admin', AdminSchema);

async function createFirstAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omegoo_db';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if any admin exists
    const existingAdmins = await AdminModel.find();
    if (existingAdmins.length > 0) {
      console.log('⚠️ Admin users already exist:');
      existingAdmins.forEach((admin: any) => {
        console.log(`  - ${admin.username} (${admin.email}) - Role: ${admin.role}`);
      });
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\nDo you want to create another admin? (yes/no): ', async (answer: string) => {
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
          console.log('❌ Cancelled');
          rl.close();
          await mongoose.disconnect();
          process.exit(0);
        }
        rl.close();
        await createAdmin();
      });
      return;
    }

    await createAdmin();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function createAdmin() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter admin username: ', (username: string) => {
    rl.question('Enter admin email: ', (email: string) => {
      rl.question('Enter admin password: ', async (password: string) => {
        rl.close();

        try {
          // Hash password
          const passwordHash = await bcrypt.hash(password, 12);

          // Create admin
          const adminData = {
            id: `admin-${Date.now()}`,
            username: username.trim(),
            email: email.trim(),
            passwordHash,
            role: 'super_admin',
            permissions: [
              'view_dashboard',
              'manage_users',
              'manage_content',
              'view_reports',
              'manage_reports',
              'ban_users',
              'manage_admins'
            ],
            isOwner: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const admin = new AdminModel(adminData);
          await admin.save();

          console.log('\n✅ Admin created successfully!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`👤 Username: ${username}`);
          console.log(`📧 Email: ${email}`);
          console.log(`🔑 Password: ${password}`);
          console.log(`👑 Role: super_admin (Owner)`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\n🎉 You can now login to the admin panel!');
          console.log(`🔗 Admin Panel: https://omegoo.vercel.app/admin`);

          await mongoose.disconnect();
          process.exit(0);
        } catch (error: any) {
          console.error('❌ Failed to create admin:', error.message);
          await mongoose.disconnect();
          process.exit(1);
        }
      });
    });
  });
}

// Run the script
createFirstAdmin();
