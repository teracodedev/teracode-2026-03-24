-- AlterTable
ALTER TABLE "Ceremony" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CeremonyParticipant" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FamilyRegister" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Householder" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "householderCode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "HouseholderMember" ALTER COLUMN "id" DROP DEFAULT;
