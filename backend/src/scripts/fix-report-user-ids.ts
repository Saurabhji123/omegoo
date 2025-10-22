/**
 * Migration Script: Fix Report User IDs
 * 
 * Problem: Old reports have wrong user IDs (session IDs instead of database user IDs)
 * Solution: Query chat sessions and update report user IDs with correct database user IDs
 * 
 * Usage: npx ts-node backend/src/scripts/fix-report-user-ids.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omegoo_db';

interface IReport {
  _id: any;
  id: string;
  sessionId: string;
  reportedUserId: string;
  reporterUserId: string;
  violationType: string;
  description: string;
  status: string;
  createdAt: Date;
}

interface IChatSession {
  _id: any;
  id: string;
  user1Id: string;
  user2Id: string;
  mode: string;
  status: string;
}

async function fixReportUserIds() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    const reportsCollection = db.collection('moderationreports');
    const sessionsCollection = db.collection('chatsessions');

    // Get all reports
    const reports = await reportsCollection.find({}).toArray() as unknown as IReport[];
    console.log(`📊 Found ${reports.length} reports to check`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const report of reports) {
      try {
        // Check if user IDs look suspicious (contain timestamp or are not valid user IDs)
        const reportedUserIdInvalid = report.reportedUserId.includes('-') && report.reportedUserId.match(/\d{13}/); // Contains timestamp
        const reporterUserIdInvalid = report.reporterUserId.includes('-') && report.reporterUserId.match(/\d{13}/);

        if (!reportedUserIdInvalid && !reporterUserIdInvalid) {
          // console.log(`✅ Report ${report.id} already has valid user IDs`);
          continue;
        }

        // Get the chat session to find correct user IDs
        const session = await sessionsCollection.findOne({ id: report.sessionId }) as unknown as IChatSession | null;

        if (!session) {
          console.warn(`⚠️ Session ${report.sessionId} not found for report ${report.id}`);
          errorCount++;
          continue;
        }

        console.log(`🔧 Fixing report ${report.id}:`, {
          oldReportedUserId: report.reportedUserId,
          oldReporterUserId: report.reporterUserId,
          sessionUser1: session.user1Id,
          sessionUser2: session.user2Id
        });

        // We can't determine which user reported which without additional data
        // But we can at least ensure both user IDs are valid database user IDs
        const updateFields: any = {};

        // If reported user ID is invalid and session has valid user IDs, update
        if (reportedUserIdInvalid) {
          // Assume user1 is reporter, user2 is reported (most common case)
          updateFields.reportedUserId = session.user2Id;
        }

        if (reporterUserIdInvalid) {
          updateFields.reporterUserId = session.user1Id;
        }

        if (Object.keys(updateFields).length > 0) {
          await reportsCollection.updateOne(
            { _id: report._id },
            { $set: updateFields }
          );

          console.log(`✅ Fixed report ${report.id}:`, updateFields);
          fixedCount++;
        }

      } catch (err) {
        console.error(`❌ Error fixing report ${report.id}:`, err);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Fixed: ${fixedCount} reports`);
    console.log(`❌ Errors: ${errorCount} reports`);
    console.log(`✔️ Valid: ${reports.length - fixedCount - errorCount} reports`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixReportUserIds();
