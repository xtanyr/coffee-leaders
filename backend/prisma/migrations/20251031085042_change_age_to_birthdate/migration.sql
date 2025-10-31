/*
  Warnings:

  - You are about to drop the column `age` on the `Leader` table. All the data in the column will be lost.
  - Added the required column `birthDate` to the `Leader` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Leader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "birthDate" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "coffeeShop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Leader" ("city", "coffeeShop", "createdAt", "endDate", "id", "name", "startDate", "updatedAt") SELECT "city", "coffeeShop", "createdAt", "endDate", "id", "name", "startDate", "updatedAt" FROM "Leader";
DROP TABLE "Leader";
ALTER TABLE "new_Leader" RENAME TO "Leader";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
