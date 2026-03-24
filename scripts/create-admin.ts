/**
 * 初期管理者アカウント作成スクリプト
 * 使用方法: npm run create-admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: hidden ? undefined : process.stdout,
  });
  if (hidden) {
    process.stdout.write(question);
  }
  return new Promise((resolve) => {
    if (hidden) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let value = "";
      process.stdin.on("data", (char) => {
        const c = char.toString();
        if (c === "\r" || c === "\n") {
          process.stdout.write("\n");
          process.stdin.setRawMode(false);
          rl.close();
          resolve(value);
        } else if (c === "\u0003") {
          process.exit();
        } else {
          value += c;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  console.log("=== 初期管理者アカウント作成 ===\n");

  const name = await prompt("名前: ");
  const email = await prompt("メールアドレス: ");
  const password = await prompt("パスワード（8文字以上）: ", true);

  if (password.length < 8) {
    console.error("パスワードは8文字以上にしてください");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error("このメールアドレスは既に登録されています");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, isAdmin: true },
  });

  console.log(`\n管理者アカウントを作成しました:`);
  console.log(`  名前: ${user.name}`);
  console.log(`  メール: ${user.email}`);
  console.log(`  権限: 管理者`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
