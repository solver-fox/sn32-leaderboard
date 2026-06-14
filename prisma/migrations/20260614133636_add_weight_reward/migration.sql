-- AlterTable
ALTER TABLE "hotkeys" ADD COLUMN "reward" DECIMAL;
ALTER TABLE "hotkeys" ADD COLUMN "weight" DECIMAL;

-- AlterTable
ALTER TABLE "metric_snapshots" ADD COLUMN "reward" DECIMAL;
ALTER TABLE "metric_snapshots" ADD COLUMN "weight" DECIMAL;
