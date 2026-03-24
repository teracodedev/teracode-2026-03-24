-- Rename table Danka → Householder
ALTER TABLE "Danka" RENAME TO "Householder";

-- Rename table DankaMember → HouseholderMember
ALTER TABLE "DankaMember" RENAME TO "HouseholderMember";

-- Rename column dankaCode → householderCode
ALTER TABLE "Householder" RENAME COLUMN "dankaCode" TO "householderCode";

-- Rename column dankaId → householderId in HouseholderMember
ALTER TABLE "HouseholderMember" RENAME COLUMN "dankaId" TO "householderId";

-- Rename column dankaId → householderId in CeremonyParticipant
ALTER TABLE "CeremonyParticipant" RENAME COLUMN "dankaId" TO "householderId";

-- Rename primary key constraints
ALTER TABLE "Householder" RENAME CONSTRAINT "Danka_pkey" TO "Householder_pkey";
ALTER TABLE "HouseholderMember" RENAME CONSTRAINT "DankaMember_pkey" TO "HouseholderMember_pkey";

-- Rename unique index
ALTER INDEX "Danka_dankaCode_key" RENAME TO "Householder_householderCode_key";
ALTER INDEX "CeremonyParticipant_ceremonyId_dankaId_key" RENAME TO "CeremonyParticipant_ceremonyId_householderId_key";

-- Rename foreign key constraints
ALTER TABLE "HouseholderMember" RENAME CONSTRAINT "DankaMember_dankaId_fkey" TO "HouseholderMember_householderId_fkey";
ALTER TABLE "CeremonyParticipant" RENAME CONSTRAINT "CeremonyParticipant_dankaId_fkey" TO "CeremonyParticipant_householderId_fkey";
