-- Add email preference columns to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailDigest" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailReminders" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailAlerts" BOOLEAN NOT NULL DEFAULT true;

-- Update foreign keys to add ON DELETE CASCADE
-- Professor -> University
ALTER TABLE "Professor" DROP CONSTRAINT IF EXISTS "Professor_universityId_fkey";
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Publication -> Professor
ALTER TABLE "Publication" DROP CONSTRAINT IF EXISTS "Publication_professorId_fkey";
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FundingGrant -> Professor
ALTER TABLE "FundingGrant" DROP CONSTRAINT IF EXISTS "FundingGrant_professorId_fkey";
ALTER TABLE "FundingGrant" ADD CONSTRAINT "FundingGrant_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Search -> User
ALTER TABLE "Search" DROP CONSTRAINT IF EXISTS "Search_userId_fkey";
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedProfessor -> User
ALTER TABLE "SavedProfessor" DROP CONSTRAINT IF EXISTS "SavedProfessor_userId_fkey";
ALTER TABLE "SavedProfessor" ADD CONSTRAINT "SavedProfessor_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedProfessor -> Professor
ALTER TABLE "SavedProfessor" DROP CONSTRAINT IF EXISTS "SavedProfessor_professorId_fkey";
ALTER TABLE "SavedProfessor" ADD CONSTRAINT "SavedProfessor_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OutreachEmail -> User
ALTER TABLE "OutreachEmail" DROP CONSTRAINT IF EXISTS "OutreachEmail_userId_fkey";
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OutreachEmail -> Professor
ALTER TABLE "OutreachEmail" DROP CONSTRAINT IF EXISTS "OutreachEmail_professorId_fkey";
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Application -> User
ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_userId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuditLog -> User
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification -> User
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
