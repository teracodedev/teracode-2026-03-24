-- 世帯員に個人連絡先フィールドを追加
ALTER TABLE "HouseholderMember" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "address1"   TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "address2"   TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "address3"   TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "phone1"     TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "phone2"     TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "fax"        TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN "domicile"   TEXT;
