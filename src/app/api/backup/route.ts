import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import * as yaml from "js-yaml";
import JSZip from "jszip";

export const runtime = "nodejs";

const dumpOpts: yaml.DumpOptions & { allowUnicode?: boolean } = {
  allowUnicode: true,
  lineWidth: -1,
  noRefs: true,
};

function toISODateOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Date オブジェクトを ISO 文字列に正規化（YAML シリアライズ安定化） */
function normalizeDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return toISODateOrNull(obj);
  if (Array.isArray(obj)) return obj.map(normalizeDates);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = normalizeDates(v);
    }
    return result;
  }
  return obj;
}

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  // --- 全データ取得 ---
  const [
    familyRegisters,
    householders,
    members,
    ceremonies,
    ceremonyParticipants,
  ] = await Promise.all([
    prisma.familyRegister.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.householder.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.householderMember.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.ceremony.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.ceremonyParticipant.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  // --- YAML変換 ---
  const serialize = (label: string, data: unknown[]) =>
    yaml.dump({ [label]: data.map(normalizeDates) }, dumpOpts);

  const zip = new JSZip();

  zip.file("家族親族台帳.yaml", serialize("家族親族台帳", familyRegisters));
  zip.file("戸主.yaml", serialize("戸主", householders));
  zip.file("世帯員.yaml", serialize("世帯員", members));
  zip.file("法要行事.yaml", serialize("法要行事", ceremonies));
  zip.file("法要参加者.yaml", serialize("法要参加者", ceremonyParticipants));

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const filename = `テラコード_バックアップ_${stamp}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
