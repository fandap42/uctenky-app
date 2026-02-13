# Technical Guide - 4FIS Receipts

Deployment, architecture, and infrastructure documentation for the 4FIS Receipts application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Docker Configuration](#docker-configuration)
4. [Database](#database)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [SSL Certificates](#ssl-certificates)
7. [S3 Object Storage (MinIO)](#s3-object-storage-minio)
8. [Backup Strategy](#backup-strategy)
9. [Environment Variables](#environment-variables)
10. [Security](#security)

---

## Architecture Overview

```
┌─────────────┐     push to      ┌──────────────────┐     build &     ┌──────────────┐
│  Developer   │ ──────────────>  │  GitHub Actions   │ ────────────>  │  Docker Hub  │
│  (Git Push)  │   deploy_test    │  CI/CD Pipeline   │     push       │  Image Repo  │
└─────────────┘                   └──────────────────┘                 └──────┬───────┘
                                                                              │
                                                          pull new image      │
                                                          every 5 min         │
                                                                              v
┌──────────────────────────────────────────────────────────────────────────────┐
│  Production Server                                                          │
│                                                                             │
│  ┌───────────┐    :443    ┌─────────┐    :3001    ┌──────────────────────┐  │
│  │  Client   │ ────────>  │  Nginx  │ ────────>   │  Next.js App         │  │
│  │ (Browser) │            │ + SSL   │             │  (Docker Container)  │  │
│  └───────────┘            └────┬────┘             └──────────┬───────────┘  │
│                                │                             │              │
│                           s3.4fis.cz                         │              │
│                            :9000                             │              │
│                                v                             v              │
│                          ┌──────────┐              ┌──────────────┐         │
│                          │  MinIO   │              │  PostgreSQL  │         │
│                          │  (S3)    │              │  16-Alpine   │         │
│                          └──────────┘              └──────────────┘         │
│                                                                             │
│  ┌──────────────┐                           ┌─────────────────────┐         │
│  │  Watchtower  │  (auto-update app)        │  DB Backup          │         │
│  │  (every 5m)  │                           │  (daily -> ./backups│)        │
│  └──────────────┘                           └─────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────────┘
```

The deployment follows a **push-to-deploy** model:

1. Developer pushes code to the `deploy_test` branch.
2. GitHub Actions builds a Docker image and pushes it to Docker Hub.
3. Watchtower (running on the production server) detects the new image and restarts the app container.
4. On startup, the app container automatically runs Prisma migrations before serving traffic.

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

**Trigger:** Push to `deploy_test` branch.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: ["deploy_test"]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Docker Meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/uctenky-app
          tags: |
            type=raw,value=latest
            type=sha

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

### Image Tags

Each build produces two tags:

- `latest` - always points to the most recent build
- `sha-<commit>` - immutable tag tied to the Git commit SHA

---

## Docker Configuration

### Dockerfile (Multi-Stage Build)

The Dockerfile uses a two-stage build for minimal production image size:

**Stage 1 - Builder** (`node:20-bookworm-slim`):
- Installs system dependencies (`openssl`, `ca-certificates`, `libssl-dev`)
- Installs npm packages with `PRISMA_SKIP_POSTINSTALL_GENERATE=1`
- Generates Prisma client (`npx prisma generate`)
- Builds Next.js application (`npm run build`)

**Stage 2 - Runner** (`node:20-bookworm-slim`):
- Installs only `openssl` for runtime
- Creates non-root user (`nextjs:nodejs`, UID/GID 1001)
- Copies built artifacts: `public/`, `.next/`, `node_modules/`, `prisma/`, config files
- Runs as non-root user

**Critical:** The `prisma/` directory must be copied to the runner stage. It contains migration files needed by `prisma migrate deploy` at container startup.

### Entrypoint Script

**File:** `docker-entrypoint.sh`

```bash
#!/bin/sh
set -e
cd /app
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Starting Next.js server..."
exec ./node_modules/.bin/next start
```

The entrypoint automatically applies pending database migrations before starting the application. Using `exec` ensures proper signal propagation for graceful shutdown.

### Production Docker Compose

**File:** `docker-compose.prod.yml`

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# First run: initialize MinIO bucket
docker compose -f docker-compose.prod.yml exec app node scripts/setup-minio.js
```

#### Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `app` | `fandap42/uctenky-app:latest` | 3001:3000 | Next.js application |
| `postgres` | `postgres:16-alpine` | Internal only | PostgreSQL database |
| `minio` | `minio/minio` | 9001 (console) | S3-compatible object storage |
| `watchtower` | `containrrr/watchtower` | None | Auto-updates app container |
| `db-backup` | `prodrigestivill/postgres-backup-local` | 8080 (health) | Automated database backups |

#### Service Dependencies

```
app ──depends on──> postgres (healthy)
app ──depends on──> minio (healthy)
db-backup ──depends on──> postgres (healthy)
```

---

## Database

### Technology

- **PostgreSQL 16** (Alpine variant)
- **Prisma 7** as ORM with native PostgreSQL driver adapter

### Migrations

Migrations are applied automatically on container startup via the entrypoint script:

```bash
npx prisma migrate deploy
```

This command applies all pending migrations from `prisma/migrations/` without generating new ones. It is safe to run repeatedly (idempotent).

#### Manual Migration Commands

```bash
# Create a new migration during development
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (DESTRUCTIVE - development only)
npx prisma migrate reset

# Open database GUI
npx prisma studio
```

### Schema Overview

Core models: `User`, `Ticket`, `Receipt`, `Section`, `Deposit`, `DebtError`, `CashOnHand`

Key enums:
- `AppRole`: MEMBER, ADMIN, HEAD_VEDENI, HEAD_FINANCE, HEAD_HR, HEAD_PR, HEAD_NEVZDELAVACI, HEAD_VZDELAVACI, HEAD_SPORTOVNI, HEAD_GAMING, HEAD_KRUHOVE
- `TicketStatus`: PENDING_APPROVAL, APPROVED, VERIFICATION, DONE, REJECTED
- `ReceiptStatus`: PENDING, APPROVED, REJECTED
- `ExpenseType`: MATERIAL, SERVICE

### Indexing

Performance indexes are defined on frequently queried columns:
- `Ticket`: `requesterId`, `sectionId`, `status`
- `Receipt`: `ticketId`, `status`

---

## Nginx Reverse Proxy

Nginx serves as a reverse proxy in front of the application, handling SSL termination and routing.

### Main Application

**Domain:** `uctenky.4fis.cz`

```nginx
server {
    server_name uctenky.4fis.cz;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Key configuration:
- `client_max_body_size 50m` - Allows large receipt file uploads.
- WebSocket headers (`Upgrade`, `Connection`) - Required for Next.js hot module replacement and real-time features.
- Proxies to port `3001` (mapped from container port `3000`).

### S3 API (MinIO)

**Domain:** `s3.4fis.cz`

```nginx
server {
    server_name s3.4fis.cz;

    location / {
        proxy_pass http://127.0.0.1:9000;
        client_max_body_size 50m;
    }
}
```

This exposes the MinIO S3 API for presigned URL access to receipt files.

### Recommended Proxy Headers

Add these headers to both server blocks for proper request forwarding:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

---

## SSL Certificates

SSL is managed via [Certbot](https://certbot.eff.org/) (Let's Encrypt).

### Initial Setup

```bash
# Install Certbot with Nginx plugin
sudo apt install certbot python3-certbot-nginx

# Obtain certificates for both domains
sudo certbot --nginx -d uctenky.4fis.cz -d s3.4fis.cz
```

Certbot will automatically:
- Obtain SSL certificates from Let's Encrypt.
- Modify the Nginx configuration to add SSL directives.
- Set up HTTP-to-HTTPS redirection.

### Automatic Renewal

Certbot installs a systemd timer that checks for renewal twice daily:

```bash
# Verify the timer is active
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

---

## S3 Object Storage (MinIO)

### Overview

MinIO provides S3-compatible object storage for receipt file uploads. Files are stored with date-based key paths:

```
receipts/{year}/{month}/{ticketId}-{timestamp}.{extension}
```

### Production Setup

In production, MinIO exposes only the web console (port `9001`). The S3 API (port `9000`) is accessed internally by the app container via Docker networking, and externally through the Nginx reverse proxy at `s3.4fis.cz`.

### First-Run Initialization

After deploying for the first time, create the storage bucket:

```bash
docker compose -f docker-compose.prod.yml exec app node scripts/setup-minio.js
```

This script creates the `receipts` bucket and configures its access policy.

### File Upload Pipeline

1. Client uploads file to `/api/upload` endpoint.
2. Server validates: file extension, size (max 20 MB), magic bytes.
3. HEIC images are converted to JPEG automatically.
4. File is stored in MinIO via S3 `PutObject`.
5. Storage key is saved in the database (`Receipt.fileUrl`).
6. For viewing, the server generates a presigned URL (60-second expiry).

---

## Backup Strategy

### Automated Database Backups

The `db-backup` service (`prodrigestivill/postgres-backup-local`) runs automated PostgreSQL backups.

#### Retention Policy

| Period | Retention |
|--------|-----------|
| Daily | 7 days |
| Weekly | 4 weeks |
| Monthly | 3 months |

Backups are stored in the `./backups` directory on the host.

#### Schedule

Backups run daily (`@daily` cron schedule).

### Offsite Backup with Rclone (Google Drive)

For additional safety, copy backups to Google Drive using [Rclone](https://rclone.org/).

#### 1. Install Rclone

```bash
curl https://rclone.org/install.sh | sudo bash
```

#### 2. Configure Google Drive Remote

```bash
rclone config
# Follow the interactive setup:
# - Name: gdrive
# - Storage type: Google Drive
# - Authenticate via browser
```

#### 3. Set Up Cron Job

```bash
crontab -e
```

Add the following line to sync backups daily at 3:00 AM:

```cron
0 3 * * * rclone sync /path/to/uctenky-app/backups gdrive:uctenky-backups --log-file=/var/log/rclone-backup.log
```

#### 4. Manual Sync

```bash
rclone sync ./backups gdrive:uctenky-backups -v
```

### MinIO Data

MinIO data is persisted in the `minio_data` Docker volume. For backup, either:

- Include the volume in your host-level backup strategy.
- Use `rclone` with the S3 provider to mirror MinIO to Google Drive.

---

## Environment Variables

### Application

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth.js secret (base64, 32+ bytes) |
| `AUTH_URL` | Yes | Public application URL (e.g., `https://uctenky.4fis.cz`) |
| `AUTH_TRUST_HOST` | Yes | Set to `true` behind reverse proxy |
| `AUTH_SLACK_ID` | No | Slack OAuth app client ID |
| `AUTH_SLACK_SECRET` | No | Slack OAuth app client secret |
| `SLACK_ALLOWED_TEAM_ID` | No | Restrict Slack login to specific workspace |
| `S3_ENDPOINT` | Yes | MinIO endpoint (internal: `http://minio:9000`) |
| `S3_ACCESS_KEY` | Yes | MinIO access key |
| `S3_SECRET_KEY` | Yes | MinIO secret key |
| `S3_BUCKET` | Yes | Storage bucket name (default: `receipts`) |
| `S3_PUBLIC_ENDPOINT` | Yes | Public S3 URL (e.g., `https://s3.4fis.cz`) |
| `ENCRYPTION_KEY` | Yes | 64-char hex string for AES-256-GCM bank account encryption |

### Database (PostgreSQL)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | Database username |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name |

### Object Storage (MinIO)

| Variable | Required | Description |
|----------|----------|-------------|
| `MINIO_ROOT_USER` | Yes | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | Yes | MinIO admin password |

---

## Security

### Application Security

- **Authentication**: NextAuth.js v5 with JWT session strategy. Supports Slack OAuth (workspace-restricted) and email/password credentials.
- **Password Hashing**: bcryptjs with 10 salt rounds.
- **Bank Account Encryption**: AES-256-GCM with random IV and auth tag per record. Key stored in `ENCRYPTION_KEY` environment variable.
- **File Upload Validation**: Extension whitelist, 20 MB size limit, magic byte verification (prevents MIME spoofing).
- **Rate Limiting**: Upload endpoint limited to 10 requests per minute per IP.
- **CSRF Protection**: Built-in Next.js server action CSRF tokens.

### HTTP Security Headers

The application sets the following headers via `next.config.ts`:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content Security Policy (CSP)

### Infrastructure Security

- PostgreSQL is not exposed to the host network in production (internal Docker network only).
- MinIO S3 API is accessed only internally; external access goes through Nginx with SSL.
- The application runs as a non-root user (`nextjs`, UID 1001) inside the container.
- Docker container logs are size-limited (10 MB, 3 files) to prevent disk exhaustion.
