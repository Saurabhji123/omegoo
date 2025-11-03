/**
 * Create Owner Admin - One-time setup script
 * This creates a permanent admin that cannot be deleted
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Admin Schema (same as in database-mongodb.ts)
const AdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'moderator' },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isOwner: { type: Boolean, default: false }, // NEW: Mark as owner
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdminModel = mongoose.model('Admin', AdminSchema);

async function createOwnerAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || '';
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Owner admin details - ACTUAL OWNER CREDENTIALS
    const ownerEmail = 'saurabhshukla1966@gmail.com';
    const ownerUsername = ownerEmail;
  const ownerPassword = '@SAurabh$133';

    // Check if owner already exists
    const existingOwner = await AdminModel.findOne({ email: ownerEmail });
    
    if (existingOwner) {
      console.log('⚠️  Owner admin already exists!');
      console.log('📧 Email:', existingOwner.email);
      console.log('👤 Username:', existingOwner.username);
      console.log('🔑 Role:', existingOwner.role);
      console.log('🛡️  Owner:', existingOwner.isOwner);
      
      // Update to ensure isOwner is true
      await AdminModel.updateOne(
        { email: ownerEmail },
        { 
          isOwner: true, 
          role: 'super_admin',
          isActive: true,
          updatedAt: new Date()
        }
      );
      console.log('✅ Updated existing admin to Owner status');
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    console.log('🔒 Password hashed');

    // Generate unique ID
    const adminId = `admin-${Date.now()}-owner`;

    // Create owner admin
    const ownerAdmin = new AdminModel({
      id: adminId,
      username: ownerUsername,
      email: ownerEmail,
      passwordHash: passwordHash,
      role: 'super_admin',
      isOwner: true, // PERMANENT - Cannot be deleted
      permissions: [
        'view_users',
        'ban_users',
        'unban_users',
        'view_reports',
        'manage_reports',
        'view_analytics',
        'manage_admins',
        'manage_settings'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await ownerAdmin.save();

    console.log('✅ Owner Admin Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: [HIDDEN]');
    console.log('👤 Username: [HIDDEN]');
    console.log('🔑 Password: [HIDDEN]');
    console.log('🛡️  Role: OWNER (Super Admin)');
    console.log('⚠️  THIS ADMIN CANNOT BE DELETED BY ANYONE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating owner admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createOwnerAdmin();
