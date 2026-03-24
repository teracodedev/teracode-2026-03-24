import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { parseYaml, yamlDateToDate } from "@/lib/yaml-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const results: { file: string; status: string; name?: string; error?: string }[] = [];

  for (const file of files) {
    const fileName = file.name;
    try {
      const text = await file.text();
      const p = parseYaml(text);

      const birthDate = yamlDateToDate(p.生年月日);
      const deathDate = yamlDateToDate(p.命日);
      const isHouseholder = p.分類 === "戸主";

      if (isHouseholder) {
        // 戸主として upsert
        const upsertedHouseholder = await prisma.householder.upsert({
          where: { id: p.個人UUID },
          update: {
            familyName: p.姓,
            givenName: p.名 || "",
            familyNameKana: p.姓フリガナ || null,
            givenNameKana: p.名フリガナ || null,
            gender: p.性別 !== "U" ? p.性別 : null,
            birthDate,
            deathDate,
            dharmaName: p["戒名・法名・法号"] || null,
            dharmaNameKana: p["戒名・法名・法号フリガナ"] || null,
            note: p.備考 || null,
            domicile: p.本籍 || null,
            email: p.メールアドレス || null,
            postalCode: p.郵便番号 || null,
            address1: p.住所 || null,
            phone1: p.電話番号1 || null,
            phone2: p.電話番号2 || null,
            fax: p.FAX || null,
          },
          create: {
            id: p.個人UUID,
            familyName: p.姓,
            givenName: p.名 || "",
            familyNameKana: p.姓フリガナ || null,
            givenNameKana: p.名フリガナ || null,
            gender: p.性別 !== "U" ? p.性別 : null,
            birthDate,
            deathDate,
            dharmaName: p["戒名・法名・法号"] || null,
            dharmaNameKana: p["戒名・法名・法号フリガナ"] || null,
            note: p.備考 || null,
            domicile: p.本籍 || null,
            email: p.メールアドレス || null,
            postalCode: p.郵便番号 || null,
            address1: p.住所 || null,
            phone1: p.電話番号1 || null,
            phone2: p.電話番号2 || null,
            fax: p.FAX || null,
          },
        });
        // 家族・親族台帳が存在しない場合は自動作成して紐付け
        if (!upsertedHouseholder.familyRegisterId) {
          const familyRegister = await prisma.familyRegister.create({
            data: { name: `${p.姓}${p.名 || ''}の家族・親族台帳` },
          });
          await prisma.householder.update({
            where: { id: upsertedHouseholder.id },
            data: { familyRegisterId: familyRegister.id },
          });
        }

        results.push({ file: fileName, status: "ok", name: `${p.姓}${p.名 || ""}（戸主）` });
      } else {
        // 世帯員として upsert（戸主が存在しないと追加できない）
        const householderExists = await prisma.householder.findUnique({
          where: { id: p.戸主UUID },
          select: { id: true },
        });
        if (!householderExists) {
          results.push({ file: fileName, status: "skip", name: `${p.姓}${p.名 || ""}`, error: `戸主UUID ${p.戸主UUID} が存在しません。先に戸主をインポートしてください。` });
          continue;
        }

        await prisma.householderMember.upsert({
          where: { id: p.個人UUID },
          update: {
            familyName: p.姓,
            givenName: p.名 || null,
            familyNameKana: p.姓フリガナ || null,
            givenNameKana: p.名フリガナ || null,
            gender: p.性別 !== "U" ? p.性別 : null,
            birthDate,
            deathDate,
            dharmaName: p["戒名・法名・法号"] || null,
            dharmaNameKana: p["戒名・法名・法号フリガナ"] || null,
            relation: p.続柄 || null,
            note: p.備考 || null,
            domicile: p.本籍 || null,
            email: p.メールアドレス || null,
            postalCode: p.郵便番号 || null,
            address1: p.住所 || null,
            phone1: p.電話番号1 || null,
            phone2: p.電話番号2 || null,
            fax: p.FAX || null,
          },
          create: {
            id: p.個人UUID,
            householderId: p.戸主UUID,
            familyName: p.姓,
            givenName: p.名 || null,
            familyNameKana: p.姓フリガナ || null,
            givenNameKana: p.名フリガナ || null,
            gender: p.性別 !== "U" ? p.性別 : null,
            birthDate,
            deathDate,
            dharmaName: p["戒名・法名・法号"] || null,
            dharmaNameKana: p["戒名・法名・法号フリガナ"] || null,
            relation: p.続柄 || null,
            note: p.備考 || null,
            domicile: p.本籍 || null,
            email: p.メールアドレス || null,
            postalCode: p.郵便番号 || null,
            address1: p.住所 || null,
            phone1: p.電話番号1 || null,
            phone2: p.電話番号2 || null,
            fax: p.FAX || null,
          },
        });
        results.push({ file: fileName, status: "ok", name: `${p.姓}${p.名 || ""}（${p.分類}）` });
      }
    } catch (e) {
      results.push({ file: fileName, status: "error", error: (e as Error).message });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status !== "ok").length;
  return NextResponse.json({ ok, errors, results }, { status: 200 });
}
