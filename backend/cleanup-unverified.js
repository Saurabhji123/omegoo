/**
 * Clean Unverified Email Users (Keep Google OAuth users)
 * Run: node cleanup-unverified.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupUnverified() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('🔍 Finding unverified email users (excluding Google OAuth)...\n');

    // Find users who:
    // 1. Are not verified (isVerified: false)
    // 2. Have passwordHash (meaning email registration, not Google OAuth)
    // 3. OR have tier 'guest' and not verified
    
    const unverifiedUsers = await usersCollection.find({
      isVerified: false,
      passwordHash: { $exists: true }  // Email users have password, Google users don't
    }).toArray();

    if (unverifiedUsers.length === 0) {
      console.log('✅ No unverified email users found!');
      await client.close();
      return;
    }

    console.log(`📋 Found ${unverifiedUsers.length} unverified email registration users:\n`);
    
    unverifiedUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.username}) - ${user.tier}`);
    });

    console.log('\n⚠️  These users will be deleted:');
    console.log('    - Registered with email but never verified');
    console.log('    - Google OAuth users will be kept (they have isVerified: true)');
    
    const result = await usersCollection.deleteMany({
      isVerified: false,
      passwordHash: { $exists: true }
    });

    console.log(`\n✅ Deleted ${result.deletedCount} unverified email users`);

    // Show stats
    const totalUsers = await usersCollection.countDocuments();
    const verifiedUsers = await usersCollection.countDocuments({ isVerified: true });
    const unverifiedRemaining = await usersCollection.countDocuments({ isVerified: false });

    console.log('\n📊 Database Stats:');
    console.log(`  Total users: ${totalUsers}`);
    console.log(`  ✅ Verified: ${verifiedUsers}`);
    console.log(`  ❌ Unverified: ${unverifiedRemaining} (Google OAuth users waiting to login)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

console.log('🧹 Cleaning unverified email users...\n');
cleanupUnverified();
