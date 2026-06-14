-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "coldkeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "tao_balance" DECIMAL NOT NULL DEFAULT 0,
    "alpha_balance" DECIMAL NOT NULL DEFAULT 0,
    "alpha_stake" DECIMAL NOT NULL DEFAULT 0,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "coldkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hotkeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coldkey_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "uid" INTEGER,
    "rank" INTEGER,
    "incentive" DECIMAL,
    "emission" DECIMAL,
    "trust" DECIMAL,
    "consensus" DECIMAL,
    "f1" DECIMAL,
    "precision" DECIMAL,
    "recall" DECIMAL,
    "fp" INTEGER,
    "fn" INTEGER,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hotkeys_coldkey_id_fkey" FOREIGN KEY ("coldkey_id") REFERENCES "coldkeys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotkey_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rank" INTEGER,
    "emission" DECIMAL,
    "incentive" DECIMAL,
    "f1" DECIMAL,
    "precision" DECIMAL,
    "recall" DECIMAL,
    "fp" INTEGER,
    "fn" INTEGER,
    CONSTRAINT "metric_snapshots_hotkey_id_fkey" FOREIGN KEY ("hotkey_id") REFERENCES "hotkeys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coldkey_id" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tao_balance" DECIMAL NOT NULL,
    "alpha_balance" DECIMAL NOT NULL,
    "alpha_stake" DECIMAL NOT NULL,
    CONSTRAINT "balance_snapshots_coldkey_id_fkey" FOREIGN KEY ("coldkey_id") REFERENCES "coldkeys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "hotkey_id" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "threshold" DECIMAL NOT NULL,
    "destination" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "interval_minutes" INTEGER NOT NULL DEFAULT 10,
    "updated_at" DATETIME NOT NULL
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
