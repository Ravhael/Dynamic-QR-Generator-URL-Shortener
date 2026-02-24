// Minimal JS duplicate checker (CommonJS) to avoid TS compile issues in unrelated files.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT user_id, key, COUNT(*) AS cnt
      FROM qr_migration
      GROUP BY user_id, key
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC`);
    if (!rows.length) {
      console.log('[OK] No duplicate (user_id,key) pairs.');
    } else {
      console.log('[DUPLICATES FOUND]');
      for (const r of rows) console.log(`${r.user_id} | ${r.key} | count=${r.cnt}`);
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Error running duplicate check:', e);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
})();
