import { PrismaClient } from "@prisma/client";

// Next.js App Router / Turbopack でビルドが安定するよう、
// '@/generated/prisma' を「PrismaClient の受け口」として用意します。
// （各 route 側で new PrismaClient() しても動きますが、ここでは型/参照を揃えます）
export { PrismaClient };

