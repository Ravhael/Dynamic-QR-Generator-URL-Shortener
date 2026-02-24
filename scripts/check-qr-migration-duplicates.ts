import { prisma } from '../lib/prisma';

async function main() {
  const duplicates = await prisma.$queryRaw<any[]>`
    SELECT user_id, key, COUNT(*) as cnt
    FROM qr_migration
    GROUP BY user_id, key
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC;`;

  if (duplicates.length === 0) {
    console.log('No (user_id, key) duplicates found in qr_migration. Safe to proceed with db push.');
  } else {
    console.log('FOUND DUPLICATES:');
    for (const row of duplicates) {
      console.log(`${row.user_id} | ${row.key} | count=${row.cnt}`);
    }
    process.exitCode = 1;
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
