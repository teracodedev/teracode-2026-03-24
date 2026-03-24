/**
 * 既存の檀家番号（D001など）をUUIDで上書きするスクリプト
 *
 * 実行方法:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/update-uuid.ts
 *
 * または prisma経由:
 *   npx prisma db execute --file scripts/update-uuid.sql
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  // 檀家番号がUUIDでないレコードを取得
  const dankaList = await prisma.householder.findMany({
    select: { id: true, householderCode: true, familyName: true, givenName: true },
  });

  const targets = dankaList.filter((d) => !UUID_REGEX.test(d.householderCode));
  console.log(`檀家 ${dankaList.length}件中、UUID変換対象: ${targets.length}件`);

  for (const danka of targets) {
    const newCode = randomUUID();
    await prisma.householder.update({
      where: { id: danka.id },
      data: { householderCode: newCode },
    });
    console.log(`  ${danka.familyName}${danka.givenName}: ${danka.householderCode} → ${newCode}`);
  }

  console.log("完了");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
