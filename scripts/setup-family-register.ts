/**
 * 家族・親族台帳のセットアップスクリプト
 * 使い方: npx tsx scripts/setup-family-register.ts
 *
 * - 「山下和彰の家族・親族台帳」を作成し、戸主「山下 和彰」を紐付けます。
 * - 台帳またはリンクがすでに存在する場合はスキップします。
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 戸主を名前で検索（UUIDが一致する場合はそちら優先）
  const HOUSEHOLDER_UUID = "ceda572c-4ac0-44f2-89ba-e2562ca07b20";
  const REGISTER_NAME = "山下和彰の家族・親族台帳";

  // 戸主を確認
  let householder = await prisma.householder.findUnique({
    where: { id: HOUSEHOLDER_UUID },
  });

  if (!householder) {
    // UUID で見つからなければ氏名で検索
    householder = await prisma.householder.findFirst({
      where: { familyName: "山下", givenName: "和彰" },
    });
  }

  if (!householder) {
    console.error("❌ 戸主「山下 和彰」が見つかりません。先にインポートまたは登録してください。");
    process.exit(1);
  }

  console.log(`✓ 戸主を確認: ${householder.familyName} ${householder.givenName} (${householder.id})`);

  // すでに家族・親族台帳が紐付いているか確認
  if (householder.familyRegisterId) {
    const existing = await prisma.familyRegister.findUnique({
      where: { id: householder.familyRegisterId },
    });
    console.log(`ℹ 既に台帳「${existing?.name}」に所属しています。`);

    if (existing?.name === REGISTER_NAME) {
      console.log("✓ セットアップ済みです。変更はありません。");
      return;
    }
    console.log("⚠ 別の台帳に所属しています。新しい台帳に移動します。");
  }

  // 同名の台帳を検索（なければ作成）
  let register = await prisma.familyRegister.findFirst({
    where: { name: REGISTER_NAME },
  });

  if (!register) {
    register = await prisma.familyRegister.create({
      data: { name: REGISTER_NAME },
    });
    console.log(`✓ 台帳「${REGISTER_NAME}」を作成しました (${register.id})`);
  } else {
    console.log(`✓ 台帳「${REGISTER_NAME}」が既に存在します (${register.id})`);
  }

  // 戸主を台帳に紐付け
  await prisma.householder.update({
    where: { id: householder.id },
    data: { familyRegisterId: register.id },
  });

  console.log(`✅ 「${householder.familyName} ${householder.givenName}」を「${REGISTER_NAME}」に紐付けました。`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
