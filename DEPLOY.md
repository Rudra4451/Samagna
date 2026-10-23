# DEPLOY.md — BanaSetu Deployment & Managed Pilot Setup Guide

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Runtime Environment:** Node.js 20+ / Next.js 14 / PostgreSQL 15+ / Supabase Storage  

---

## 1. Clean-Clone Quickstart

### Prerequisites
- Node.js 20.x or higher (`node -v`)
- npm 10.x or higher (`npm -v`)
- (Optional for live persistence) Managed Supabase account (Free tier) or local PostgreSQL 15+

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/Rudra4451/bana-setu.git
cd bana-setu

# 2. Install dependencies cleanly
npm ci

# 3. Configure environment variables
cp .env.example .env.local

# 4. Generate Prisma ORM client
npx prisma generate

# 5. Run automated verification suite (12 test suites)
npm run test:all

# 6. Build production bundle
npm run build

# 7. Start production server
npm run start
```
The application will bind to `http://localhost:3000`.

---

## 2. Managed Pilot Stack: Supabase Configuration

For the working pilot, Supabase provides the most affordable and practical managed PostgreSQL and object storage setup.

### A. Supabase PostgreSQL Setup
1. Log into [supabase.com](https://supabase.com) and create a new project:
   - **Organization:** Your organization or personal account.
   - **Project Name:** `banasetu-pilot`
   - **Database Password:** Generate a high-entropy password (store securely; do not commit).
   - **Region:** `ap-south-1` (Mumbai, India) for lowest latency to Odisha.
2. In the Supabase Dashboard, navigate to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection Pooling**:
   - Copy the **Connection string (Transaction Mode)**:
     ```
     postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - In Next.js serverless and API routes, transaction mode pooling on port `6543` prevents PostgreSQL connection exhaustion.

### B. Supabase Private Evidence Storage Setup
1. In the Supabase Dashboard, navigate to **Storage** $\rightarrow$ **New Bucket**:
   - **Bucket Name:** `banasetu-evidence`
   - **Public bucket:** **OFF / PRIVATE** (Crucial: evidence must not be publicly indexable).
   - **File size limit:** `5MB`
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `audio/webm`, `audio/mp3`, `audio/wav`
2. Obtain Service Role Key:
   - Navigate to **Project Settings** $\rightarrow$ **API** $\rightarrow$ **Project API keys**.
   - Copy `service_role` (secret) key.
   - **Security Warning:** The `service_role` key must remain strictly server-side in `.env.local` and never be prefixed with `NEXT_PUBLIC_` or committed to source control.

---

## 3. Environment Variables Configuration (`.env.local`)

| Variable | Required | Example / Description |
|:---|:---:|:---|
| `DATABASE_URL` | Optional | `postgresql://postgres.[ref]:[pass]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `SUPABASE_URL` | Optional | `https://[ref].supabase.co` (Enables durable evidence uploads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `eyJh...` (Server-side key for private bucket uploads and signed URLs) |
| `SUPABASE_STORAGE_BUCKET` | Optional | `banasetu-evidence` (Defaults to `banasetu-evidence`) |
| `AUTH_SECRET` | Yes | 32-character random string for HMAC-SHA256 JWT cookie signing |
| `NODE_ENV` | Yes | `production` |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` |

*Offline Standby Mode:* If `DATABASE_URL` is unconfigured, the application runs in client-side Dexie mode. If `SUPABASE_URL` is unconfigured, uploads fall back to the local `public/uploads` directory.

---

## 4. Applying Database Migrations & Seeding

Once `DATABASE_URL` is configured in `.env.local`:

```bash
# Apply version-controlled baseline migration (0_init) to PostgreSQL
npx prisma migrate deploy

# Run non-destructive demo seed (17 MFP items, locations, demo accounts, batch #BS-402)
npx prisma db seed
```

*Safety Rule:* Never execute `prisma migrate reset` in production or pilot environments. The `prisma/seed.ts` script uses idempotent `upsert` operations and will never overwrite real user records.

---

## 5. Budget, Costs & Constraints (Supabase Managed Pilot)

| Metric / Service | Free Tier Allowance | Pilot Impact & Limits | Pro Tier ($25/mo) Upgrade Trigger |
|:---|:---:|:---|:---|
| **PostgreSQL DB** | 500 MB storage | Sufficient for ~150,000 procurement batches. | Database exceeds 500 MB. |
| **Connection Limit** | Max 60 pooled connections | Handled via transaction pooling (`pgbouncer=true`). | Simultaneous field connections > 60. |
| **Object Storage** | 1 GB storage | Sufficient for ~500–1,000 high-res bag photos. | Evidence archive exceeds 1 GB. |
| **Storage Egress** | 2 GB / month | Short-lived signed URLs cache-controlled. | High public verification traffic. |
| **Inactivity Pause** | **Pauses after 7 days** | Free tier projects pause if no queries occur for 7 days. Can be unpaused in 1-click or kept active via cron ping. | Zero-pause guarantee required. |
| **Backups** | Daily backups (7-day retention) | Accessible in dashboard. Point-in-time recovery requires Pro. | 30-day point-in-time recovery required. |

---

## 6. Health & Observability

- **Endpoint:** `GET /api/health`
- **Response Format (Connected):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-23T01:50:00.000Z",
    "version": "0.1.0",
    "jurisdiction": "Mayurbhanj, Odisha (TDCCOL)",
    "database": "connected",
    "latencyMs": 42
  }
  ```
- **Response Format (Offline Standby):**
  ```json
  {
    "status": "degraded_offline_mode",
    "database": "unconfigured_or_offline",
    "message": "DATABASE_URL is unconfigured. Operating in client-side Dexie mode only."
  }
  ```

---

## 7. Rollback & Disaster Recovery Procedures

1. **Storage Rollback:** If an upload fails mid-flight, `storage.upload()` rejects and the database transaction aborts. No orphaned records are created.
2. **Schema Rollback:** All migrations are version-controlled in `prisma/migrations/`. In the event of schema rollback, revert to the previous migration script via `prisma migrate resolve`.
3. **Local Work Protection:** Client devices running Dexie preserve unsynced weighments in the IndexedDB outbox. A server database restart or network outage does not discard field work.
