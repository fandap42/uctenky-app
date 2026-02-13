# 4FIS Receipts - Expense Management System

A full-stack web application for managing expense requests and receipts within a student organization. Members submit spending requests, upload receipt photos, and administrators approve, verify, and process reimbursements.

## Features

- **Expense Request Workflow** - Multi-step approval process (request, approve, verify, complete)
- **Receipt Management** - Upload, validate, and track receipt photos with automatic HEIC-to-JPEG conversion
- **Role-Based Access Control** - 11 distinct roles (Member, Admin, 9 department heads)
- **Cash Register** - Track deposits, expenses, and balances by semester
- **QR Code Payments** - Generate QR codes with Czech IBAN for reimbursements
- **Slack OAuth** - Authenticate via organizational Slack workspace
- **Dark Mode** - Full light/dark theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Radix UI, Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (Slack OAuth + Credentials) |
| Storage | MinIO (S3-compatible object storage) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions, Watchtower |
| Testing | Vitest, Playwright |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) and Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/your-org/uctenky-app.git
cd uctenky-app
npm install
```

### 2. Configure environment

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=uctenky_db
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uctenky_db"

# Auth
AUTH_SECRET="your-secret-key"    # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# S3 / MinIO
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=receipts
S3_PUBLIC_ENDPOINT="http://localhost:9000"
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Encryption (for bank account data)
ENCRYPTION_KEY="your-64-char-hex-string"    # Generate with: openssl rand -hex 32
```

### 3. Start infrastructure

```bash
docker compose up -d postgres minio
```

### 4. Initialize database and storage

```bash
npx prisma migrate dev
npx prisma db seed
node scripts/setup-minio.mjs
```

### 5. Run development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Default development accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | adminpass |
| Finance Head | head.finance@test.com | headpass |
| Member | member@test.com | memberpass |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Create and apply migrations |

## Project Structure

```
uctenky-app/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # REST API endpoints (auth, upload, receipts)
│   ├── dashboard/        # Protected dashboard routes
│   └── login/            # Authentication page
├── components/           # React components (UI + feature)
├── lib/
│   ├── actions/          # Server actions (tickets, receipts, cash register)
│   ├── constants/        # Messages, bank codes
│   └── utils/            # Encryption, validation, IBAN, rate limiting
├── prisma/               # Database schema and migrations
├── scripts/              # Setup scripts (MinIO, seeding)
├── docs/                 # Documentation
│   ├── USER_MANUAL_CZ.md # User manual (Czech)
│   └── TECHNICAL_GUIDE.md # Technical/deployment guide (English)
└── docker-compose.yml    # Development Docker Compose
```

## Documentation

- **[User Manual (CZ)](docs/USER_MANUAL_CZ.md)** - End-user guide in Czech
- **[Technical Documentation (EN)](docs\TECHNICAL_DOCUMENTATION.md)** - Architecture, deployment, and infrastructure
- **[Deploy Guide (EN)](docs/DEPLOY_GUIDE.md)** - Architecture, deployment, and infrastructure

## License

This project is private and proprietary.
