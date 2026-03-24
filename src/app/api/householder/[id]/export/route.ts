import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { householderToYaml, memberToYaml, serializeYaml } from "@/lib/yaml-utils";
import JSZip from "jszip";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;

  const h = await prisma.householder.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!h) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  const zip = new JSZip();

  // 戸主自身
  const hPerson = householderToYaml(h);
  const hFileName = `${h.familyName}${h.givenName || ""}_${h.id}.yaml`;
  zip.file(hFileName, serializeYaml(hPerson));

  // 世帯員
  for (const m of h.members) {
    const mPerson = memberToYaml(m, h);
    const mFileName = `${m.familyName}${m.givenName || ""}_${m.id}.yaml`;
    zip.file(mFileName, serializeYaml(mPerson));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${h.familyName}${h.givenName || ""}_${h.id}.zip`)}`,
    },
  });
}
