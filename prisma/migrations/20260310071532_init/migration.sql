-- CreateEnum
CREATE TYPE "CeremonyType" AS ENUM ('MEMORIAL', 'REGULAR', 'FUNERAL', 'SPECIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CeremonyStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Danka" (
    "id" SERIAL NOT NULL,
    "dankaCode" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyNameKana" TEXT,
    "givenNameKana" TEXT,
    "postalCode" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Danka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DankaMember" (
    "id" SERIAL NOT NULL,
    "dankaId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "relation" TEXT,
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3),
    "dharmaName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DankaMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ceremony" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "ceremonyType" "CeremonyType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "maxAttendees" INTEGER,
    "fee" INTEGER,
    "status" "CeremonyStatus" NOT NULL DEFAULT 'SCHEDULED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ceremony_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CeremonyParticipant" (
    "id" SERIAL NOT NULL,
    "ceremonyId" INTEGER NOT NULL,
    "dankaId" INTEGER NOT NULL,
    "attendees" INTEGER NOT NULL DEFAULT 1,
    "offering" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CeremonyParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Danka_dankaCode_key" ON "Danka"("dankaCode");

-- CreateIndex
CREATE UNIQUE INDEX "CeremonyParticipant_ceremonyId_dankaId_key" ON "CeremonyParticipant"("ceremonyId", "dankaId");

-- AddForeignKey
ALTER TABLE "DankaMember" ADD CONSTRAINT "DankaMember_dankaId_fkey" FOREIGN KEY ("dankaId") REFERENCES "Danka"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CeremonyParticipant" ADD CONSTRAINT "CeremonyParticipant_ceremonyId_fkey" FOREIGN KEY ("ceremonyId") REFERENCES "Ceremony"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CeremonyParticipant" ADD CONSTRAINT "CeremonyParticipant_dankaId_fkey" FOREIGN KEY ("dankaId") REFERENCES "Danka"("id") ON DELETE CASCADE ON UPDATE CASCADE;
