-- Migration script: adapt dev_backup.db schema to current schema
-- Changes:
--   manual_attrition_risk_3m  -> manual_attrition_risk (prefer 3m if exists, else old manual_attrition_risk)
--   manual_attrition_risk      -> keep as manual_attrition_risk (fallback)
--   manual_attrition_risk_6m   -> manual_attrition_risk_6
--   manual_attrition_risk_9m   -> manual_attrition_risk_9
--   manual_attrition_risk_12m  -> manual_attrition_risk_12

BEGIN TRANSACTION;

-- 1. Rename old table
ALTER TABLE "leaders" RENAME TO "leaders_old";

-- 2. Create new table with current schema
CREATE TABLE "leaders" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME,
  "birthDate" DATETIME NOT NULL,
  "city" TEXT NOT NULL,
  "coffeeShop" TEXT NOT NULL,
  "pipName" TEXT,
  "pipEndDate" DATETIME,
  "pipSuccessChance" INTEGER,
  "manualAttritionRisk" REAL,
  "manualAttritionRisk6" REAL,
  "manualAttritionRisk9" REAL,
  "manualAttritionRisk12" REAL,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

-- 3. Map columns from old to new
INSERT INTO "leaders" (
  "id", "name", "startDate", "endDate", "birthDate",
  "city", "coffeeShop", "pipName", "pipEndDate", "pipSuccessChance",
  "manualAttritionRisk",
  "manualAttritionRisk6",
  "manualAttritionRisk9",
  "manualAttritionRisk12",
  "createdAt", "updatedAt"
)
SELECT
  "id",
  "name",
  "startDate",
  "endDate",
  "birthDate",
  "city",
  "coffeeShop",
  "pipName",
  "pipEndDate",
  "pip_success_chance",
  COALESCE("manual_attrition_risk_3m", "manual_attrition_risk"),
  "manual_attrition_risk_6m",
  "manual_attrition_risk_9m",
  "manual_attrition_risk_12m",
  "createdAt",
  "updatedAt"
FROM "leaders_old";

-- 4. Drop old table
DROP TABLE "leaders_old";

COMMIT;
