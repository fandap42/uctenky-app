# 4FISuctenky

> Web application for managing receipts and financial reimbursements for the 4FIS student organization

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)](https://www.postgresql.org/)

## ✨ Features

- **Purchase request management** - complete workflow from submission to reimbursement
- **Slack SSO authentication** - secure login via organization's Slack workspace
- **Role-based access control** - Member, Section Head, Administrator
- **Receipt upload** - HEIC (iPhone) support with automatic conversion
- **Cash register (Pokladna)** - tracking deposits, error debts, and cash on hand
- **Section budgets** - budget tracking by semester
- **CSV export** - Czech Excel compatible (semicolon separator)
- **Design system** - consistent UI with modern 4FIS branding

## 🚀 Quick Start

### 🐳 Docker (recommended)

The easiest way to run the entire application including database and storage:

```bash
# Clone repository
git clone https://github.com/your-org/uctenky-app.git
cd uctenky-app

# Setup environment
cp .env.docker.example .env.docker
# Edit .env.docker - especially AUTH_SECRET, Slack credentials and passwords

# Start all services
docker compose --env-file .env.docker up -d

# Run database migration (first time only)
docker compose --env-file .env.docker exec app npx prisma db push
```

Application runs at:
- **App**: [http://localhost:3000](http://localhost:3000)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)

> [!IMPORTANT]
> Never commit `.env.docker` to Git! It contains sensitive data.

### 💻 Local Development

For development without Docker container for the app:

#### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and MinIO)

```bash
# Clone repository
git clone https://github.com/your-org/uctenky-app.git
cd uctenky-app

# Start database and storage only
docker compose up -d postgres minio

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local as needed

# Run database migration
npx prisma db push

# Start development server
npm run dev
```

Application runs at [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://uctenky:uctenky123@localhost:5432/uctenky_app"

# NextAuth
AUTH_SECRET="your-secret-key-min-32-chars"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Slack OAuth (primary authentication)
AUTH_SLACK_ID="your-slack-client-id"
AUTH_SLACK_SECRET="your-slack-client-secret"
SLACK_ALLOWED_TEAM_ID="your-slack-workspace-id"

# MinIO / S3 Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="receipts"
S3_PUBLIC_ENDPOINT="http://localhost:9000"
```

### MinIO Bucket Setup

After starting, create a bucket named "receipts" in the MinIO console at [http://localhost:9001](http://localhost:9001)

### Slack OAuth Setup

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add OAuth scopes: `openid`, `email`, `profile`
3. Set Redirect URL: `https://your-domain.com/api/auth/callback/slack`
4. Copy Client ID and Client Secret to `.env`
5. Set `SLACK_ALLOWED_TEAM_ID` to your workspace ID (restricts login to members only)

## 📁 Project Structure

```
uctenky-app/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, upload)
│   ├── dashboard/          # Protected pages
│   └── login/              # Login page
├── components/             # React components
│   ├── dashboard/          # Dashboard components
│   ├── pokladna/           # Cash register components
│   ├── receipts/           # Receipt upload
│   └── ui/                 # Design system + Shadcn/UI
├── lib/                    # Utilities and configuration
│   ├── actions/            # Server actions
│   ├── s3.ts               # MinIO/S3 client
│   └── prisma.ts           # Prisma client
├── prisma/                 # Database schema
└── docs/                   # Documentation
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **MEMBER** | Submit purchase requests |
| **HEAD_*** | View section requests (Kanban board) |
| **ADMIN** | Full system management, approvals, all sections |

## 📖 Documentation

- [User Manual (CZ)](docs/USER_MANUAL_CZ.md)
- [Technical Documentation (EN)](docs/TECHNICAL_DOCUMENTATION.md)
- [Design System](docs/DESIGN_SYSTEM.md)

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI | Shadcn/UI + 4FIS Design System |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Authentication | NextAuth.js v5 (Slack OAuth + Credentials) |
| Storage | MinIO (S3-compatible) |

## 📝 Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## 🧪 Testing (Local)

The application uses Vitest for unit/integration tests and Playwright for E2E tests. It's recommended to run these tests **manually before each deployment** to production.

```bash
npm run test           # Unit and integration tests
npm run test:e2e       # E2E tests (Playwright)
npm run test:coverage  # Coverage report
npm run test:watch     # Watch mode
```

### What to Test

| Priority | Area | Examples |
|----------|------|----------|
| 🔴 High | Utility functions | `lib/utils/semesters.ts`, `lib/utils/roles.ts` |
| 🔴 High | Server actions | `lib/actions/tickets.ts`, permissions |
| 🟡 Medium | E2E workflow | Login, request approval, receipt upload |
| 🟢 Low | Components | Interactive UI components |

See [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md#testing) for details.

## 🔐 Security

### Authentication & Authorization
- **Primary login**: Slack OAuth with workspace restriction (Team ID)
- **Fallback login**: Credentials for administrators (passwords hashed with bcryptjs)
- **HTTP-only session cookies** - protection against XSS
- **Role-based access control** on all protected actions
- All API endpoints require authentication

### API Endpoint Protection

| Endpoint | Protection |
|----------|------------|
| `/api/upload` | Authentication + ticket ownership verification |
| `/api/auth/*` | Rate limiting + input validation |

### File Upload Security
- **Extension whitelist**: jpg, jpeg, png, gif, webp, heic, heif
- **Magic byte validation** using `file-type` library
- **Max size**: 5 MB
- **Presigned URLs** for file access (7-day expiration)
- Files stored in private MinIO bucket

### Rate Limiting
- Upload endpoint: max 10 requests/minute per IP
- Protection against brute-force attacks

### CSP & Security Headers
- Content Security Policy defined in `next.config.ts`
- Avoid `'unsafe-inline'` in production

### Production Recommendations
1. **Never commit** `.env` files to Git
2. Use **Docker secrets** or vault for sensitive data
3. Set **MinIO bucket policy** to private
4. Consider **Redis** for rate limiting with horizontal scaling
5. Regularly run `npm audit` to check dependencies

## 📄 License

Proprietary software for 4FIS.

---

*4FISuctenky © 2026*
