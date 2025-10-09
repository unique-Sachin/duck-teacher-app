/**
 * Script to delete all interviews and related data
 * Run with: npx tsx scripts/delete-all-interviews.ts
 * 
 * Or use Prisma Studio: npx prisma studio
 * Then manually delete from the UI
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllInterviews() {
  console.log('🗑️  Starting deletion of all interviews...\n');

  try {
    // Delete in correct order due to foreign key constraints
    
    // 1. Delete attention snapshots (if table exists)
    try {
      const snapshotsDeleted = await prisma.$executeRaw`DELETE FROM attention_snapshots`;
      console.log(`✅ Deleted ${snapshotsDeleted} attention snapshots`);
    } catch (e) {
      console.log('⚠️  No attention_snapshots table found (skipping)');
    }

    // 2. Delete proctoring events (if table exists)
    try {
      const eventsDeleted = await prisma.$executeRaw`DELETE FROM proctoring_events`;
      console.log(`✅ Deleted ${eventsDeleted} proctoring events`);
    } catch (e) {
      console.log('⚠️  No proctoring_events table found (skipping)');
    }

    // 3. Delete proctoring sessions (if table exists)
    try {
      const sessionsDeleted = await prisma.$executeRaw`DELETE FROM proctoring_sessions`;
      console.log(`✅ Deleted ${sessionsDeleted} proctoring sessions`);
    } catch (e) {
      console.log('⚠️  No proctoring_sessions table found (skipping)');
    }

    // 4. Delete messages
    const messagesDeleted = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${messagesDeleted.count} messages`);

    // 5. Delete interviews
    const interviewsDeleted = await prisma.interview.deleteMany({});
    console.log(`✅ Deleted ${interviewsDeleted.count} interviews`);

    console.log('\n✨ All interviews and related data deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting interviews:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllInterviews()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
