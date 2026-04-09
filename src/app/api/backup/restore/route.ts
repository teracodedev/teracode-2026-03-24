import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import * as yaml from "js-yaml";
import JSZip from "jszip";

export const runtime = "nodejs";

/** YAML ファイル名 → モデルキーのマッピング */
const FILE_MAP: Record<string, string> = {
  "家族親族台帳.yaml": "familyRegister",
  "戸主.yaml": "householder",
  "世帯員.yaml": "member",
  "法要行事.yaml": "ceremony",
  "法要参加者.yaml": "ceremonyParticipant",
};

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function toBool(v: unknown, def = false): boolean {
  if (typeof v === "boolean") return v;
  return def;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : Math.round(n);
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuf);

    // --- YAML ファイルをパース ---
    const data: Record<string, unknown[]> = {};
    for (const [fileName, modelKey] of Object.entries(FILE_MAP)) {
      const entry = zip.file(fileName);
      if (!entry) continue;
      const text = await entry.async("string");
      const doc = yaml.load(text) as Record<string, unknown[]> | null;
      if (!doc) continue;
      const rootKey = Object.keys(doc)[0];
      const arr = doc[rootKey];
      if (Array.isArray(arr)) {
        data[modelKey] = arr;
      }
    }

    // --- トランザクションで全データ入れ替え ---
    await prisma.$transaction(async (tx) => {
      // 削除順（外部キー制約を考慮: 子テーブルから削除）
      await tx.ceremonyParticipant.deleteMany();
      await tx.ceremony.deleteMany();
      await tx.householderMember.deleteMany();
      await tx.householder.deleteMany();
      await tx.familyRegister.deleteMany();

      // 挿入順（親テーブルから）

      // 1. 家族親族台帳
      if (data.familyRegister) {
        for (const r of data.familyRegister as Record<string, unknown>[]) {
          await tx.familyRegister.create({
            data: {
              id: r.id as string,
              registerCode: r.registerCode as string,
              name: r.name as string,
              note: (r.note as string) || null,
              createdAt: parseDate(r.createdAt) ?? new Date(),
              updatedAt: parseDate(r.updatedAt) ?? new Date(),
            },
          });
        }
      }

      // 2. 戸主
      if (data.householder) {
        for (const r of data.householder as Record<string, unknown>[]) {
          await tx.householder.create({
            data: {
              id: r.id as string,
              householderCode: r.householderCode as string,
              familyName: r.familyName as string,
              givenName: (r.givenName as string) || "",
              familyNameKana: (r.familyNameKana as string) || null,
              givenNameKana: (r.givenNameKana as string) || null,
              postalCode: (r.postalCode as string) || null,
              address1: (r.address1 as string) || null,
              address2: (r.address2 as string) || null,
              address3: (r.address3 as string) || null,
              phone1: (r.phone1 as string) || null,
              phone2: (r.phone2 as string) || null,
              fax: (r.fax as string) || null,
              email: (r.email as string) || null,
              gender: (r.gender as string) || null,
              birthDate: parseDate(r.birthDate),
              deathDate: parseDate(r.deathDate),
              dharmaName: (r.dharmaName as string) || null,
              dharmaNameKana: (r.dharmaNameKana as string) || null,
              domicile: (r.domicile as string) || null,
              note: (r.note as string) || null,
              isActive: toBool(r.isActive, true),
              joinedAt: parseDate(r.joinedAt),
              leftAt: parseDate(r.leftAt),
              familyRegisterId: (r.familyRegisterId as string) || null,
              createdAt: parseDate(r.createdAt) ?? new Date(),
              updatedAt: parseDate(r.updatedAt) ?? new Date(),
            },
          });
        }
      }

      // 3. 世帯員
      if (data.member) {
        for (const r of data.member as Record<string, unknown>[]) {
          await tx.householderMember.create({
            data: {
              id: r.id as string,
              householderId: r.householderId as string,
              familyName: r.familyName as string,
              givenName: (r.givenName as string) || null,
              familyNameKana: (r.familyNameKana as string) || null,
              givenNameKana: (r.givenNameKana as string) || null,
              postalCode: (r.postalCode as string) || null,
              address1: (r.address1 as string) || null,
              address2: (r.address2 as string) || null,
              address3: (r.address3 as string) || null,
              phone1: (r.phone1 as string) || null,
              phone2: (r.phone2 as string) || null,
              fax: (r.fax as string) || null,
              email: (r.email as string) || null,
              gender: (r.gender as string) || null,
              birthDate: parseDate(r.birthDate),
              deathDate: parseDate(r.deathDate),
              dharmaName: (r.dharmaName as string) || null,
              dharmaNameKana: (r.dharmaNameKana as string) || null,
              domicile: (r.domicile as string) || null,
              relation: (r.relation as string) || null,
              note: (r.note as string) || null,
              isAnnaiFuyo: toBool(r.isAnnaiFuyo),
              isKeijiFuyo: toBool(r.isKeijiFuyo),
              isNotePrintDisabled: toBool(r.isNotePrintDisabled),
              isMeinichiFusho: toBool(r.isMeinichiFusho),
              createdAt: parseDate(r.createdAt) ?? new Date(),
              updatedAt: parseDate(r.updatedAt) ?? new Date(),
            },
          });
        }
      }

      // 4. 法要行事
      if (data.ceremony) {
        for (const r of data.ceremony as Record<string, unknown>[]) {
          await tx.ceremony.create({
            data: {
              id: r.id as string,
              title: r.title as string,
              ceremonyType: r.ceremonyType as "MEMORIAL" | "REGULAR" | "FUNERAL" | "SPECIAL" | "OTHER",
              scheduledAt: parseDate(r.scheduledAt) ?? new Date(),
              endAt: parseDate(r.endAt),
              location: (r.location as string) || null,
              description: (r.description as string) || null,
              maxAttendees: toInt(r.maxAttendees),
              fee: toInt(r.fee),
              status: (r.status as "SCHEDULED" | "COMPLETED" | "CANCELLED") || "SCHEDULED",
              note: (r.note as string) || null,
              createdAt: parseDate(r.createdAt) ?? new Date(),
              updatedAt: parseDate(r.updatedAt) ?? new Date(),
            },
          });
        }
      }

      // 5. 法要参加者
      if (data.ceremonyParticipant) {
        for (const r of data.ceremonyParticipant as Record<string, unknown>[]) {
          await tx.ceremonyParticipant.create({
            data: {
              id: r.id as string,
              ceremonyId: r.ceremonyId as string,
              householderId: r.householderId as string,
              attendees: toInt(r.attendees) ?? 1,
              offering: toInt(r.offering),
              note: (r.note as string) || null,
              createdAt: parseDate(r.createdAt) ?? new Date(),
              updatedAt: parseDate(r.updatedAt) ?? new Date(),
            },
          });
        }
      }
    });

    // 件数サマリー
    const summary = {
      家族親族台帳: data.familyRegister?.length ?? 0,
      戸主: data.householder?.length ?? 0,
      世帯員: data.member?.length ?? 0,
      法要行事: data.ceremony?.length ?? 0,
      法要参加者: data.ceremonyParticipant?.length ?? 0,
    };

    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    console.error("リカバリーエラー:", e);
    return NextResponse.json(
      { error: `リカバリーに失敗しました: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
