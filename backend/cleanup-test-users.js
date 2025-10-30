/**
 * Clean Test Users from MongoDB
 * Run: node cleanup-test-users.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

async function cleanupTestUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find test users
    console.log('🔍 Finding test users...');
    const testPatterns = [
      { email: /^test.*@.*/ },           // test...@...
      { username: /^test/ },              // test...
      { username: /^user\d+/ },           // user123
      { email: /^dummy.*@.*/ },           // dummy...@...
      { username: /^dummy/ }              // dummy...
    ];

    let totalDeleted = 0;

    for (const pattern of testPatterns) {
      const testUsers = await usersCollection.find(pattern).toArray();
      
      if (testUsers.length > 0) {
        console.log(`\n📋 Found ${testUsers.length} users matching pattern:`, pattern);
        testUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.username})`);
        });

        const result = await usersCollection.deleteMany(pattern);
        console.log(`  ✅ Deleted: ${result.deletedCount}`);
        totalDeleted += result.deletedCount;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Total test users deleted: ${totalDeleted}`);
    console.log(`${'='.repeat(50)}\n`);

    // Show remaining user count
    const remainingCount = await usersCollection.countDocuments();
    console.log(`📊 Remaining users in database: ${remainingCount}`);

    // Show sample of remaining users (first 5)
    if (remainingCount > 0) {
      console.log('\n📋 Sample of remaining users:');
      const sample = await usersCollection.find()
        .limit(5)
        .project({ email: 1, username: 1, isVerified: 1, tier: 1 })
        .toArray();
      
      sample.forEach((user, index) => {
        const verified = user.isVerified ? '✅' : '❌';
        console.log(`  ${index + 1}. ${user.email} (${user.username}) - ${user.tier} ${verified}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run cleanup
console.log('🧹 Starting test users cleanup...\n');
cleanupTestUsers();
