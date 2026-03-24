/**
 * 既存ユーザーを管理者に昇格するスクリプト
 * 使用方法: npx tsx scripts/promote-admin.ts <email>
 *
 * 例: npx tsx scripts/promote-admin.ts user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    // 引数なし → 全ユーザーの一覧を表示
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isAdmin: true },
      orderBy: { createdAt: "asc" },
    });
    if (users.length === 0) {
      console.log("ユーザーが存在しません。");
      return;
    }
    console.log("=== ユーザー一覧 ===");
    for (const u of users) {
      console.log(`  ${u.email}  ${u.name}  ${u.isAdmin ? "[管理者]" : ""}`);
    }
    console.log(`\n使用方法: npx tsx scripts/promote-admin.ts <email>`);
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`ユーザー ${email} が見つかりません`);
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`${user.name} (${email}) は既に管理者です`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`${user.name} (${email}) を管理者に昇格しました`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
