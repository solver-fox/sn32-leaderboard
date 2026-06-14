# Product Requirements Document (PRD)

## Product Name

SN32 Tracker

## Overview

A web application for Bittensor SN32 miners and stakeholders to monitor:

* Coldkey balances
* Registered hotkeys
* Miner performance metrics (F1, FP, FN, Precision, Recall, etc.)
* Emissions history
* Alpha stake
* Historical leaderboard ranking
* Portfolio performance

The system automatically syncs subnet data at configurable intervals (default: 10 minutes).

---

# Goals

### User Goals

* Track all mining hotkeys in one dashboard
* Monitor performance trends over time
* Track emission growth
* Monitor alpha stake and balances
* Compare hotkeys against subnet averages
* Identify performance regressions quickly

### Business Goals

* Become the default analytics platform for SN32 miners
* Support multiple coldkeys per user
* Expand later to other subnets

---

# User Types

## Miner

Owns one or more hotkeys.

Needs:

* Performance monitoring
* Emission tracking
* Balance tracking

## Stakeholder

Owns alpha but may not mine.

Needs:

* Stake monitoring
* Alpha balance tracking
* Portfolio value tracking

## Power User

Manages many miners.

Needs:

* Multi-hotkey dashboard
* Portfolio aggregation
* Alerts

---

# Core Features

## 1. Authentication

### Requirements

* Email/password
* Google OAuth
* Wallet sign-in (future)

### User Story

As a miner, I want to log in and manage my registered keys.

---

## 2. Coldkey Management

### Requirements

User can:

* Add coldkey address
* Edit coldkey label
* Remove coldkey

### Data Collected

* Coldkey SS58
* TAO balance
* Alpha balance
* Alpha stake
* Last sync time

### User Story

As a user, I want to monitor all my coldkeys in one dashboard.

---

## 3. Hotkey Management

### Requirements

User can:

* Add hotkey address
* Assign hotkey to coldkey
* Add custom label

### Data Collected

* Hotkey SS58
* UID
* Rank
* Incentive
* Emission
* Trust
* Consensus

### User Story

As a miner, I want to monitor multiple miners simultaneously.

---

## 4. Leaderboard

### Features

Display all tracked hotkeys.

Columns:

* Rank
* Hotkey
* UID
* F1
* Precision
* Recall
* FP
* FN
* Emission
* Incentive
* Last Update

### Capabilities

* Search
* Filter
* Sort
* Pagination

---

## 5. Hotkey Detail Page

Route:

/hotkeys/:id

### Current Metrics

* Rank
* Emission
* Incentive
* F1
* Precision
* Recall
* FP
* FN

### Historical Charts

* F1 over time
* Emission over time
* Rank over time
* Precision over time
* Recall over time

### Time Ranges

* 24h
* 7d
* 30d
* 90d
* All

---

## 6. Portfolio Dashboard

### Coldkey Summary

Show:

* Total TAO
* Total Alpha
* Total Stake
* Daily Emission
* Weekly Emission
* Monthly Emission

### Hotkey Summary

Show:

* Number of miners
* Best performing miner
* Worst performing miner
* Average F1
* Average rank

---

## 7. Historical Metrics Engine

### Scheduler

Default:

Every 10 minutes

Configurable:

* 5 min
* 10 min
* 30 min
* 1 hour

### Data Stored

Per hotkey:

* Timestamp
* Rank
* Incentive
* Emission
* F1
* Precision
* Recall
* FP
* FN

Retention:

Unlimited

---

## 8. Alerts

### Alert Types

Emission Drop

* > 10%
* > 25%
* > 50%

Rank Drop

* > 5 ranks
* > 10 ranks

F1 Drop

* configurable threshold

### Channels

* Email
* Discord webhook
* Telegram (future)

---

## 9. API Layer

### Sources

Bittensor Subtensor

SN32 API

Internal aggregation service

### Sync Jobs

1. Fetch subnet state
2. Fetch hotkey metrics
3. Fetch coldkey balances
4. Store snapshots

---

# Technical Requirements

## Stack

* Next.js 15 (App Router)
* React + TypeScript
* Tailwind CSS
* React Query
* Recharts
* Zustand
* Prisma ORM + SQLite
* node-cron (background sync)

### Pages

* Dashboard (`/`)
* Leaderboard (`/leaderboard`)
* Coldkeys (`/coldkeys`)
* Hotkeys (`/hotkeys`)
* Hotkey detail (`/hotkeys/[id]`)
* Settings (`/settings`)
* Login (`/login`)

### API Routes

All API endpoints live under `/api/*`:

* Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
* Coldkeys, hotkeys, leaderboard, metrics, portfolio, alerts, sync

### Responsibilities

* Data sync (scheduled via node-cron)
* Aggregation
* Authentication (JWT)
* Alerting

---

## Getting Started

Requires **Node.js 18+**.

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations (SQLite — no Docker required)
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `JWT_SECRET` | Secret for signing auth tokens |
| `SYNC_INTERVAL_MINUTES` | Sync interval (5, 10, 30, or 60) |
| `SN32_API_URL` | SN32 metrics API base URL |

---

## Database

### User

* id
* email
* password_hash

### Coldkey

* id
* user_id
* address
* label

### Hotkey

* id
* coldkey_id
* address
* label
* uid

### MetricSnapshot

* id
* hotkey_id
* timestamp
* rank
* emission
* incentive
* f1
* precision
* recall
* fp
* fn

### BalanceSnapshot

* id
* coldkey_id
* timestamp
* tao_balance
* alpha_balance
* alpha_stake

---

# Future Features

## v2

* Multiple subnet support
* Validator analytics
* Alpha ROI tracking
* Portfolio performance charts
* Public miner profiles

## v3

* Wallet login
* Mobile app
* Discord bot integration
* Prediction analytics
* Miner score forecasting

---

# Success Metrics

* Daily active users
* Number of tracked hotkeys
* Number of tracked coldkeys
* Dashboard load time < 2 seconds
* Sync success rate > 99%

### Architecture

```text
Next.js App (UI + API Routes)
        |
    SQLite (Prisma)
        |
  node-cron Sync Job
        |
 SN32 API + Bittensor RPC
```