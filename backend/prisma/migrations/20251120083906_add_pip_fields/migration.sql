/*
  Warnings:

  - You are about to drop the `Leader` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Leader";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "leaders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "birthDate" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "coffeeShop" TEXT NOT NULL,
    "pip_name" TEXT,
    "pip_end_date" DATETIME,
    "pip_success_chance" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
