import { prisma } from "@/lib/prisma";

type Delegate = {
  findMany?: (...args: unknown[]) => Promise<unknown>;
  findUnique?: (...args: unknown[]) => Promise<unknown>;
  create?: (...args: unknown[]) => Promise<unknown>;
  update?: (...args: unknown[]) => Promise<unknown>;
  delete?: (...args: unknown[]) => Promise<unknown>;
};

type PrismaLike = {
  householder?: Delegate;
  danka?: Delegate;
  householderMember?: Delegate;
  dankaMember?: Delegate;
};

export type HouseholderModelKind = "householder" | "danka";

export function getHouseholderModelKind(): HouseholderModelKind {
  const prismaLike = prisma as unknown as PrismaLike;
  if (prismaLike.householder) return "householder";
  if (prismaLike.danka) return "danka";
  throw new Error("Prisma model not found: householder/danka");
}

export function getHouseholderDelegate(): Delegate {
  const prismaLike = prisma as unknown as PrismaLike;
  const delegate = prismaLike.householder ?? prismaLike.danka;
  if (!delegate) {
    throw new Error("Prisma delegate not found: householder/danka");
  }
  return delegate;
}

export function getMemberDelegate(): Delegate {
  const prismaLike = prisma as unknown as PrismaLike;
  const delegate = prismaLike.householderMember ?? prismaLike.dankaMember;
  if (!delegate) {
    throw new Error("Prisma delegate not found: householderMember/dankaMember");
  }
  return delegate;
}

export function getHouseholderFieldMap(kind: HouseholderModelKind) {
  if (kind === "householder") {
    return {
      code: "householderCode",
      relation: "householder",
      relationId: "householderId",
      phoneMain: "phone1",
      phoneSub: "phone2",
      domicile: "domicile",
    } as const;
  }

  return {
    code: "dankaCode",
    relation: "danka",
    relationId: "dankaId",
    phoneMain: "phone",
    phoneSub: null,
    domicile: null,
  } as const;
}
