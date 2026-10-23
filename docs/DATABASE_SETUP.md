# BanaSetu — PostgreSQL Database Setup & Operations Guide

> [!CAUTION]
> ### CRITICAL MIGRATION SAFETY WARNING
> - **NEVER run `prisma migrate dev` against a production database or any existing database containing real or important data.**
> - When migration history in `_prisma_migrations` differs from `prisma/schema.prisma` or the physical database state, Prisma will detect schema drift and **prompt for an interactive database reset (`DROP SCHEMA public CASCADE;`)**, which permanently destroys all existing tables, rows, and audit logs.
> - **NEVER accept a database reset prompt** unless the database is an explicitly designated, disposable development instance, the project owner has explicitly approved the reset, and a verified binary backup exists.
> - **`prisma migrate deploy` does NOT repair schema drift.** It is strictly designed to apply reviewed, committed migration SQL files in deterministic sequence. It cannot detect or fix divergence between physical tables and the schema.

---

## 1. Required Software & Supported Versions

Based on the repository's configuration in `package.json` and `prisma/schema.prisma`:

| Component | Required Version | Purpose |
|:---|:---|:---|
| **Node.js** | `18.x` or `20.x` LTS | JavaScript runtime |
| **npm** | `9.x` or `10.x` | Package manager |
| **PostgreSQL** | `15.x` or `16.x` | Relational database (Local or Supabase) |
| **Prisma ORM** | `^5.21.1` | Type-safe database client and migrations |
| **Next.js** | `14.2.15` | App Router web application |

---

## 2. Local Database & Least-Privilege User Provisioning

To set up a local PostgreSQL instance with dedicated application credentials:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create the dedicated database
CREATE DATABASE banasetu;

# Create the application user with a strong password
CREATE USER banasetu_app WITH ENCRYPTED PASSWORD 'replace_with_secure_password';

# Grant database-level privileges
GRANT ALL PRIVILEGES ON DATABASE banasetu TO banasetu_app;

# Connect to the database and grant public schema permissions
\c banasetu
GRANT ALL ON SCHEMA public TO banasetu_app;

# Exit psql
\q
```

---

## 3. Environment Variables Reference

Environment variables are categorized as **Required** or **Optional**. Variable values must never be checked into version control.

### Required Variables
- `DATABASE_URL`: Connection string for PostgreSQL queries.
- `AUTH_SECRET`: Cryptographic 256-bit secret used to sign HS256 JWT session tokens (minimum 32 characters; generated via `openssl rand -base64 32`).

### Optional Variables
- `DIRECT_URL`: Direct TCP connection string bypassing connection poolers (required for migrations on Supabase PgBouncer).
- `ALLOW_DEMO_ACCOUNTS`: Boolean (`true`/`false`). When set to `true` in non-production environments, permits pre-seeded evaluator personas.
- `NODE_ENV`: Runtime environment (`development`, `test`, or `production`).
- `NEXT_PUBLIC_APP_URL`: Base application URL (default: `http://localhost:3000`).
- `SUPABASE_URL`: Managed Supabase project URL (Phase C object storage).
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side service key for Supabase private storage.
- `SUPABASE_STORAGE_BUCKET`: Bucket name for digital evidence (default: `banasetu-evidence`).
- `DEFAULT_SHRINKAGE_TOLERANCE_PERCENT`: Allowable transit moisture shrinkage percentage (default: `1.5`).
- `SHRINKAGE_DEFICIT_THRESHOLD_KG`: Tolerance variance threshold before quarantine (default: `0.05`).
- `STANDARD_SACK_TARE_KG`: Default tare weight for gunny sacks (default: `1.5`).

---

## 4. `DATABASE_URL` vs. `DIRECT_URL` Architecture

When deploying on cloud platforms using PgBouncer or connection poolers (such as Supabase):

- **`DATABASE_URL` (Port 6543 / Transaction Pooling):**
  Used by the Next.js runtime application for standard queries. Pools connections efficiently for high-concurrency serverless executions (`?pgbouncer=true&connection_limit=1`).
- **`DIRECT_URL` (Port 5432 / Session Connection):**
  Required for schema migrations (`prisma migrate dev`, `prisma migrate deploy`) because PgBouncer does not support transactional advisory locks or prepared statements used during DDL operations.

For a standard local PostgreSQL instance, both URLs can point to the same port `5432`.

---

## 5. Local `.env` Configuration Safety

1. Verify that `.env` and `.env*.local` are explicitly listed in `.gitignore`:
   ```bash
   git status --ignored
   ```
2. Copy the template without exposing secrets:
   ```bash
   cp .env.example .env
   ```
3. Populate `.env` with your local credentials:
   ```env
   DATABASE_URL="postgresql://banasetu_app:replace_with_secure_password@localhost:5432/banasetu"
   AUTH_SECRET="your-generated-random-32-char-secret-key-here"
   NODE_ENV="development"
   ALLOW_DEMO_ACCOUNTS="true"
   ```

---

## 6. Known Schema Drift (Prisma Schema vs. Initial Migration)

> [!WARNING]
> An independent audit has identified four specific structural discrepancies between the active Prisma schema (`prisma/schema.prisma`) and the baseline migration file (`prisma/migrations/0_init/migration.sql`). These differences exist because features were added under a strict read-only / no-migrations policy.

| Model / Table | Discrepancy Description | Drift Details |
|:---|:---|:---|
| **`Batch`** | Missing column, foreign-key relation, and index | `destinationDepotId` (Text, nullable), relation to `AggregationLocation(code)`, and `@@index([destinationDepotId])` exist in `schema.prisma` but are **missing from `0_init/migration.sql`**. |
| **`Step1FieldVerification`** | Missing column, foreign-key relation, and index | `initialDestinationDepotId` (Text, nullable), relation to `AggregationLocation(code)`, and `@@index([initialDestinationDepotId])` exist in `schema.prisma` but are **missing from `0_init/migration.sql`**. |
| **`Step2WarehouseVerification`** | Missing column, foreign-key relation, and index | `receivingDepotId` (Text, nullable), relation to `AggregationLocation(code)`, and `@@index([receivingDepotId])` exist in `schema.prisma` but are **missing from `0_init/migration.sql`**. |
| **`InventorySale`** | Model and physical table completely absent | `model InventorySale` exists in `schema.prisma` (added in Batch 2) but the table `CREATE TABLE "InventorySale"` is **absent from `0_init/migration.sql`**. |

### Note on `SyncConflictRecord` District Scoping
`SyncConflictRecord` currently **has no native `district` column** in either `schema.prisma` or `0_init/migration.sql`. In the application layer, conflict district scoping is inferred through relational joins across `Batch` and `User`.
- **Do not invent or apply a speculative default (e.g. `@default("Mayurbhanj")`).**
- Any future introduction of a `district` column to `SyncConflictRecord` must be formally reviewed, designed with proper data migration for existing rows, and deployed through an explicit migration.

---

## 7. Safe Future Reconciliation & Migration Process

Before connecting or migrating any existing or production database, operators must execute the following sequential reconciliation procedure:

1. **Inspect Prisma State:**
   Inspect the complete `prisma/schema.prisma`, all migration files in `prisma/migrations/`, and the `_prisma_migrations` table history.
2. **Compare Physical Schema:**
   Compare the actual database schema against both `prisma/schema.prisma` and the migration history to detect any unrecorded manual DDL changes.
3. **Take a Verified Backup:**
   Back up any database containing real or staged data using `pg_dump` and verify the backup archive integrity before proceeding.
4. **Prepare on a Disposable Database:**
   Generate the additive reconciliation migration locally on a clean, disposable development database using:
   ```bash
   npx prisma migrate dev --create-only --name reconcile_depot_and_inventory_sales
   ```
5. **Conduct Rigorous SQL Review:**
   Review the generated `.sql` migration file manually:
   - Verify column types, nullability, defaults, foreign keys, indexes, and constraints.
   - Confirm that columns are nullable or have safe defaults so existing rows are preserved.
   - Do NOT assume `IF NOT EXISTS` guarantees migration safety; verify data preservation explicitly.
6. **Test Staging Deployment:**
   Test migration application and application behavior on a disposable database and staging environment prior to production.
7. **Apply via Deployment Procedure:**
   Apply only reviewed, version-controlled, and committed migrations through the deterministic deployment command:
   ```bash
   npx prisma migrate deploy
   ```

---

## 8. Prisma Client Generation

Generate the latest TypeScript definitions and Prisma client:

```bash
npx prisma generate
```

This updates `@prisma/client` in `node_modules` with all models defined in `prisma/schema.prisma`.

---

## 9. Migration Status & Schema Validation

To inspect migration alignment without altering the database:

```bash
# Validate schema syntax
npx prisma validate

# Check migration status against the configured database
npx prisma migrate status
```

---

## 10. Migration Workflows: Development vs. Production

### Development Workflow (Disposable Databases ONLY)
When developing locally against a disposable PostgreSQL instance:
```bash
npx prisma migrate dev --name <descriptive_migration_name>
```
> [!CAUTION]
> If Prisma prompts: *"We need to reset the PostgreSQL database... All data will be lost. Do you want to continue?"*, enter **`n` (No)** unless the database is strictly disposable and verified empty.

### Production / CI/CD Deployment Workflow
In staging or production environments:
```bash
npx prisma migrate deploy
```
*Note: This applies pending migration files deterministically without resetting tables or prompting for interactive input. It will not reconcile unrecorded drift.*

---

## 11. Idempotent Database Seeding

The seed script is located at `prisma/seed.ts`. It initializes:
1. Five authorized multi-role staff accounts (`COLLECTOR`, `SHG_FACILITATOR`, `COLLECTION_MANAGER`, `WAREHOUSE_MANAGER`, `SUPERVISOR_ADMIN`).
2. The 17 Minor Forest Produce species catalogue with botanical metadata.
3. Official baseline produce rate configurations with cited source authorities.
4. Mayurbhanj geographical locations (Baripada central depot and block collection centers).

### Seed Idempotency
`prisma/seed.ts` uses `prisma.<model>.upsert` across all entities. Existing records are updated or preserved rather than duplicated. It can be safely re-run at any time:

```bash
# Execute seeding
npx prisma db seed
# or
npm run seed
```

---

## 12. Post-Configuration Verification Suite

After connecting a real database and applying migrations, verify system integrity with the existing automated test suites:

```bash
# 1. Run all 16 test suites
npm run test:all

# 2. Verify strict TypeScript compilation
npx tsc --noEmit

# 3. Compile Next.js production build
npm run build
```

---

## 13. Verifying Live Persistence & Transactions (Future Live Check)

> [!NOTE]
> In the current repository state, live database integration is **UNVERIFIED** because `DATABASE_URL` is not yet configured. The following steps should be executed once PostgreSQL is provisioned:

1. **Health Endpoint Check:**
   Query `GET /api/health` and verify:
   ```json
   {
     "status": "healthy",
     "database": "CONNECTED",
     "dbMode": "POSTGRESQL"
   }
   ```
2. **Batch Retrieval Check:**
   Query `GET /api/batches` with an authenticated supervisor session:
   - Should return HTTP `200 OK` (instead of HTTP `503 DATABASE_UNCONFIGURED`).
   - Response payload will include `"serverAvailable": true`.
3. **Transaction Validation:**
   Submit a verification via `POST /api/collection/verify`. Inspect PostgreSQL to confirm atomic insertion across `Step1FieldVerification`, `Batch`, and `AuditEvent`.

---

## 14. Understanding `DATABASE_UNCONFIGURED` Standby Mode

When `DATABASE_URL` is unset or unreachable:
- `isDatabaseConfigured()` in `src/lib/server/db.ts` returns `false`.
- The server fails closed:
  - Mutation endpoints return HTTP `503 Service Unavailable` with error code `DATABASE_UNCONFIGURED`.
  - Admin conflict ledger returns `source: "LOCAL_STANDBY"` with an empty array.
- The client application operates via IndexedDB (Dexie v5) offline outbox, queuing actions in `syncQueue` until server connectivity is restored.

---

## 15. Database Backup Procedure

Before applying any future migrations or schema upgrades, take a binary dump:

```bash
# Create timestamped custom-format archive
pg_dump -U banasetu_app -h localhost -p 5432 -d banasetu -F c -b -v -f "backup_banasetu_$(date +%Y%m%d_%H%M%S).dump"

# Restore command (if recovery is ever needed)
# pg_restore -U banasetu_app -h localhost -p 5432 -d banasetu -v "backup_banasetu_YYYYMMDD_HHMMSS.dump"
```
