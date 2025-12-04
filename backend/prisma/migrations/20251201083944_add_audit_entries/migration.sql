-- CreateTable
CREATE TABLE "audit_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requiredLeaders" INTEGER NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
