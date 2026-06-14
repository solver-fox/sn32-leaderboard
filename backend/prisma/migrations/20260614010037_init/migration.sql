-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('EMISSION_DROP', 'RANK_DROP', 'F1_DROP');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('EMAIL', 'DISCORD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coldkeys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "tao_balance" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "alpha_balance" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "alpha_stake" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coldkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotkeys" (
    "id" TEXT NOT NULL,
    "coldkey_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "uid" INTEGER,
    "rank" INTEGER,
    "incentive" DECIMAL(20,9),
    "emission" DECIMAL(20,9),
    "trust" DECIMAL(20,9),
    "consensus" DECIMAL(20,9),
    "f1" DECIMAL(10,6),
    "precision" DECIMAL(10,6),
    "recall" DECIMAL(10,6),
    "fp" INTEGER,
    "fn" INTEGER,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "hotkey_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rank" INTEGER,
    "emission" DECIMAL(20,9),
    "incentive" DECIMAL(20,9),
    "f1" DECIMAL(10,6),
    "precision" DECIMAL(10,6),
    "recall" DECIMAL(10,6),
    "fp" INTEGER,
    "fn" INTEGER,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL,
    "coldkey_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tao_balance" DECIMAL(20,9) NOT NULL,
    "alpha_balance" DECIMAL(20,9) NOT NULL,
    "alpha_stake" DECIMAL(20,9) NOT NULL,

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hotkey_id" TEXT,
    "type" "AlertType" NOT NULL,
    "channel" "AlertChannel" NOT NULL,
    "threshold" DECIMAL(10,4) NOT NULL,
    "destination" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "interval_minutes" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "coldkeys_user_id_address_key" ON "coldkeys"("user_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "hotkeys_coldkey_id_address_key" ON "hotkeys"("coldkey_id", "address");

-- CreateIndex
CREATE INDEX "metric_snapshots_hotkey_id_timestamp_idx" ON "metric_snapshots"("hotkey_id", "timestamp");

-- CreateIndex
CREATE INDEX "balance_snapshots_coldkey_id_timestamp_idx" ON "balance_snapshots"("coldkey_id", "timestamp");

-- AddForeignKey
ALTER TABLE "coldkeys" ADD CONSTRAINT "coldkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotkeys" ADD CONSTRAINT "hotkeys_coldkey_id_fkey" FOREIGN KEY ("coldkey_id") REFERENCES "coldkeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_hotkey_id_fkey" FOREIGN KEY ("hotkey_id") REFERENCES "hotkeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_coldkey_id_fkey" FOREIGN KEY ("coldkey_id") REFERENCES "coldkeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
