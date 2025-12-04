/*
  Warnings:

  - Added the required column `city` to the `audit_entries` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requiredLeaders" INTEGER NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_audit_entries" ("createdAt", "id", "requiredLeaders", "targetDate", "updatedAt") SELECT "createdAt", "id", "requiredLeaders", "targetDate", "updatedAt" FROM "audit_entries";
DROP TABLE "audit_entries";
ALTER TABLE "new_audit_entries" RENAME TO "audit_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
