# 4FISuctenky - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Project Structure](#project-structure)
7. [Design System](#design-system)
8. [Core Features](#core-features)
9. [API Routes](#api-routes)
10. [Deployment](#deployment)

---

## Overview

**4FISuctenky** is a full-stack web application for managing financial reimbursements and receipts for the 4FIS student organization. It provides a complete workflow from purchase request submission to receipt verification and payment tracking.

### Key Features

- Slack OAuth authentication with workspace restriction
- User authentication with role-based access control
- Purchase request (Ticket) submission and approval workflow
- Receipt upload with HEIC/HEIF conversion support
- Cash register (Pokladna) management
- Budget tracking by section and semester
- CSV export functionality (Czech Excel compatible)
- Comprehensive design system for consistent UI

---

## Technology Stack

```mermaid
graph TD
    subgraph Frontend
        A[Next.js 16 App Router]
        B[React 19]
        C[Tailwind CSS 4]
        D[Shadcn/UI + 4FIS Design System]
    end
    
    subgraph Backend
        E[Next.js Server Actions]
        F[Prisma ORM]
    end
    
    subgraph Database
        G[PostgreSQL]
    end
    
    subgraph Storage
        H[MinIO / S3-Compatible Storage]
    end
    
    subgraph Auth
        I[NextAuth.js v5]
        J[Slack OAuth]
        K[bcryptjs]
    end
    
    A --> E
    B --> A
    C --> A
    D --> A
    E --> F
    F --> G
    E --> H
    I --> E
    J --> I
    K --> I
```

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.1.3 |
| Runtime | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | Shadcn/UI + 4FIS Design System | Latest |
| ORM | Prisma | 7.2.0 |
| Database | PostgreSQL | 14+ |
| Authentication | NextAuth.js | 5.x (Slack OAuth + Credentials) |
| Storage | MinIO (S3-compatible) | - |
| Image Conversion | heic2any | 0.0.4 |

---

## Architecture

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Browser"]
        UI[React Components]
        SA[Server Actions Calls]
    end
    
    subgraph Server["Next.js Server"]
        APP[App Router]
        ACTIONS[Server Actions]
        AUTH[Auth Middleware]
        STREAM[Streaming Proxy /api/receipts/view]
    end
    
    subgraph External["External Services"]
        DB[(PostgreSQL)]
        STORAGE[MinIO S3 Storage]
        SLACK[Slack OAuth]
    end
    
    UI --> SA
    SA --> APP
    APP --> AUTH
    AUTH --> ACTIONS
    ACTIONS --> DB
    ACTIONS --> STORAGE
    UI --> STREAM
    STREAM --> AUTH
    STREAM --> STORAGE
    AUTH --> SLACK
```

### Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server Action
    participant A as Auth
    participant P as Prisma
    participant DB as PostgreSQL
    
    U->>C: Submit Form
    C->>S: Call Server Action
    S->>A: Verify Session
    A-->>S: Session Data
    S->>P: Database Query
    P->>DB: SQL Query
    DB-->>P: Result
    P-->>S: Data
    S->>S: Revalidate Path
    S-->>C: Response
    C-->>U: Updated UI
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Ticket : creates
    User ||--o{ Account : has
    User ||--o{ Session : has
    Section ||--o{ Ticket : has
    Ticket ||--o{ Receipt : contains
    
    User {
        string id PK
        string email UK
        string passwordHash "nullable for OAuth users"
        string fullName
        string name
        string image
        enum role
        datetime createdAt
        datetime updatedAt
    }
    
    Account {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string refresh_token
        string access_token
        int expires_at
    }
    
    Session {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }
    
    Section {
        string id PK
        string name
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Ticket {
        string id PK
        string requesterId FK
        string sectionId FK
        enum status
        string purpose
        datetime targetDate
        decimal budgetAmount
        boolean isFiled
        string note
        datetime createdAt
        datetime updatedAt
    }
    
    Receipt {
        string id PK
        string store
        datetime date
        decimal amount
        string fileUrl
        boolean isPaid
        boolean isFiled
        enum expenseType
        enum status
        string ticketId FK
        string note
        datetime createdAt
        datetime updatedAt
    }
    
    Deposit {
        string id PK
        decimal amount
        string description
        datetime date
        datetime createdAt
    }
    
    DebtError {
        string id PK
        decimal amount
        string reason
        datetime createdAt
    }
    
    CashOnHand {
        string id PK
        decimal amount
        string reason
        datetime createdAt
    }
```

### Enums

```typescript
enum AppRole {
  MEMBER           // Regular member
  HEAD_VEDENI      // Leadership head
  HEAD_FINANCE     // Finance section head
  HEAD_HR          // HR section head
  HEAD_PR          // PR section head
  HEAD_NEVZDELAVACI // Non-educational events head
  HEAD_VZDELAVACI   // Educational events head
  HEAD_SPORTOVNI    // Sports events head
  HEAD_GAMING       // Gaming section head
  HEAD_KRUHOVE      // Circle events head
  ADMIN             // Administrator (full access)
}

enum TicketStatus {
  PENDING_APPROVAL  // Awaiting approval
  APPROVED          // Approved, can proceed with purchase
  VERIFICATION      // Receipt uploaded, awaiting verification
  DONE              // Fully verified and complete
  REJECTED          // Rejected
}

enum ReceiptStatus {
  PENDING   // Awaiting review
  APPROVED  // Receipt approved
  REJECTED  // Receipt rejected
}

enum ExpenseType {
  MATERIAL  // Physical goods
  SERVICE   // Services
}
```

---

## Authentication & Authorization

### Authentication Flow

```mermaid
flowchart TD
    A[User visits /login] --> B{Has valid session?}
    B -->|Yes| C[Redirect to /dashboard]
    B -->|No| D[Show login page]
    D --> E{Choose auth method}
    E -->|Slack| F[Redirect to Slack OAuth]
    F --> G{Slack workspace?}
    G -->|Wrong workspace| H[Access Denied]
    G -->|Correct workspace| I[Create/Update user]
    I --> J[Create session]
    E -->|Credentials| K[Submit email/password]
    K --> L{Valid credentials?}
    L -->|No| M[Show error]
    M --> D
    L -->|Yes| J
    J --> N[Set session cookie]
    N --> C
```

### Slack OAuth Configuration

The application uses Slack as the primary authentication method with workspace restriction:

```typescript
// auth.ts
Slack({
  clientId: process.env.AUTH_SLACK_ID,
  clientSecret: process.env.AUTH_SLACK_SECRET,
  allowDangerousEmailAccountLinking: true,
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    }
  },
}),
```

**Workspace Restriction**: Only members of the configured Slack workspace can log in:

```typescript
// signIn callback
if (account?.provider === "slack") {
  const allowedTeamId = process.env.SLACK_ALLOWED_TEAM_ID
  const userTeamId = profile?.team_id
  
  if (userTeamId !== allowedTeamId) {
    return false // Access denied
  }
}
```

### Role-Based Access Control

| Route | MEMBER | HEAD_* | ADMIN |
|-------|--------|--------|-------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/dashboard/head` | ❌ | ✅ | ✅ |
| `/dashboard/admin` | ❌ | ❌ | ✅ |
| `/dashboard/pokladna` | ❌ | ❌ | ✅ |
| `/dashboard/budget` | ❌ | ❌ | ✅ |
| `/dashboard/users` | ❌ | ❌ | ✅ |

> **Note:** Section heads (HEAD_*) can only **view** tickets for their section. Approval is done exclusively by ADMIN.

---

## Project Structure

```
uctenky-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   └── upload/               # File upload endpoint
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── admin/                # Admin panel
│   │   ├── budget/               # Budget management
│   │   ├── head/                 # Section head panel
│   │   ├── pokladna/             # Cash register
│   │   └── users/                # User management
│   ├── login/                    # Login page (Slack + Credentials)
│   ├── globals.css               # Design system tokens
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── dashboard/                # Dashboard components
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── ticket-kanban.tsx     # Kanban board for section heads
│   │   └── ...
│   ├── pokladna/                 # Cash register components
│   │   ├── deposit-dialog.tsx
│   │   ├── debt-error-dialog.tsx
│   │   ├── cash-on-hand-dialog.tsx
│   │   ├── overview-table.tsx
│   │   └── cash-register-export.tsx
│   ├── receipts/                 # Receipt components
│   │   └── receipt-upload.tsx
│   ├── requests/                 # Request components
│   │   ├── request-form.tsx
│   │   └── approval-actions.tsx
│   └── ui/                       # Design System + Shadcn/UI
│       ├── status-badge.tsx      # Semantic status badges
│       ├── expense-type-badge.tsx # Material/Service badges
│       ├── functional-checkbox.tsx # Paid/Filed checkboxes
│       └── ...                   # Other Shadcn components
│
├── hooks/                        # React hooks
│   └── useReceiptUpload.ts
│
├── lib/                          # Utilities and configurations
│   ├── actions/                  # Server actions
│   │   ├── tickets.ts            # Ticket CRUD
│   │   ├── cash-register.ts      # Cash register operations
│   │   └── semesters.ts          # Semester utilities
│   ├── constants/                # App constants
│   │   └── messages.ts           # Centralized Czech messages
│   ├── prisma.ts                 # Prisma client
│   ├── s3.ts                     # MinIO/S3 storage client
│   └── utils/                    # Utility functions
│       ├── semesters.ts
│       ├── roles.ts
│       ├── rate-limit.ts
│       └── file-validator.ts
│
├── prisma/                       # Prisma configuration
│   └── schema.prisma             # Database schema
│
├── auth.ts                       # NextAuth configuration
├── auth.config.ts                # Auth configuration options
├── middleware.ts                 # Next.js middleware
└── docs/                         # Documentation
    ├── USER_MANUAL_CZ.md
    ├── TECHNICAL_DOCUMENTATION.md
    └── DESIGN_SYSTEM.md
```

---

## Design System

The application uses a comprehensive design system defined in `globals.css` and component atoms.

### Semantic Color Tokens

Defined as CSS custom properties that adapt to light/dark mode:

| Token | Purpose |
|-------|---------|
| `--status-pending` | Warning/Amber (Pending Approval) |
| `--status-approved` | Info/Blue (Approved) |
| `--status-verification` | Purple (Verification) |
| `--status-success` | Green (Done/Paid) |
| `--paid` / `--unpaid` | Financial status |
| `--filed` | Document filing status |
| `--expense-material` | Material expense type |
| `--expense-service` | Service expense type |

### Atom Components

| Component | File | Purpose |
|-----------|------|---------|
| `StatusBadge` | `components/ui/status-badge.tsx` | Display ticket/receipt status |
| `ExpenseTypeBadge` | `components/ui/expense-type-badge.tsx` | Material vs Service indicator |
| `FunctionalCheckbox` | `components/ui/functional-checkbox.tsx` | Paid/Filed semantic checkboxes |

For detailed documentation, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

---

## Core Features

### 1. Ticket Workflow

```mermaid
stateDiagram-v2
    [*] --> PENDING_APPROVAL: Create ticket
    PENDING_APPROVAL --> APPROVED: Admin approves
    PENDING_APPROVAL --> REJECTED: Admin rejects
    APPROVED --> VERIFICATION: Upload receipt
    VERIFICATION --> DONE: Admin verifies
    DONE --> [*]
    REJECTED --> [*]
```

### 2. Receipt Upload with HEIC Conversion

The application supports iPhone photos (HEIC/HEIF format) with automatic client-side conversion to JPEG:

```typescript
async function handleFileChange(file: File) {
  if (file.name.endsWith('.heic') || file.name.endsWith('.heif')) {
    const heic2any = (await import('heic2any')).default
    const blob = await heic2any({ 
      blob: file, 
      toType: 'image/jpeg',
      quality: 0.95 
    })
    // Use converted JPEG
  }
  // Upload to MinIO via API
}
```

### 3. Cash Register (Pokladna)

The cash register module tracks:
- **Deposits** - Money added to the register
- **Debt from Errors** - Tracking discrepancies
- **Cash on Hand** - Physical cash adjustments
- **Real Cash** = Balance - Debt - Cash on Hand

```mermaid
flowchart LR
    D[Deposits] --> B[Balance]
    T[Paid Receipts] --> B
    B --> RC[Real Cash]
    DE[Debt Errors] --> RC
    COH[Cash on Hand] --> RC
```

### 4. CSV Export

Exports use semicolon separator for Czech Excel compatibility:

```csv
Sekce;Účel;Částka
"Vzdělávací akce";"Nákup materiálu";-520,00
```

---

## API Routes

### `/api/auth/[...nextauth]`
NextAuth.js authentication endpoints (Slack OAuth + Credentials).

### `/api/upload` (POST)
Handles receipt file uploads to MinIO S3-compatible storage.

**Security Features:**
- **Authentication**: Requires a valid user session.
- **Ownership Verification**: Verifies that the `ticketId` belongs to the authenticated user (or user is ADMIN).
- **Rate Limiting**: Limited to 10 requests per minute per IP.
- **Deep Validation**: Inspects file magic bytes (not just MIME type) and whitelists extensions.

**Request:**
- `FormData` with `file` and `ticketId`

**Response:**
```json
{
  "url": "receipts/2026/01/key.png"
}
```

### `/api/receipts/view` (GET)
Authenticated streaming proxy for viewing receipt images.

**Security Logic:**
1.  **Authentication**: Verifies valid user session.
2.  **Authorization**: Verifies user is the owner of the ticket or has ADMIN role.
3.  **On-the-fly Streaming**: Fetches the image from MinIO and streams it directly to the client.
4.  **No URL Exposure**: The actual MinIO/S3 URL is never exposed to the client.
5.  **Caching**: Returns `private, max-age=3600` headers.

---

## Deployment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="https://your-domain.com"
AUTH_TRUST_HOST=true

# Slack OAuth
AUTH_SLACK_ID="your-slack-client-id"
AUTH_SLACK_SECRET="your-slack-client-secret"
SLACK_ALLOWED_TEAM_ID="your-slack-workspace-team-id"

# MinIO S3 Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="receipts"
S3_PUBLIC_ENDPOINT="http://localhost:9000"
```

### Build & Deploy

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Build for production
npm run build

# Start production server
npm start
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```


---

## Security Considerations

1. **Authentication**: Slack OAuth with workspace restriction + optional credentials fallback
2. **Password Hashing**: bcryptjs with salt rounds of 10 (for credential users)
3. **Session Security**: HTTP-only cookies, secure in production
4. **CSRF Protection**: Built-in Next.js protection
5. **Role Checks**: Every protected action verifies user role
6. **File Upload**: 
   - Strict extension whitelist (`jpg, jpeg, png, gif, webp, heic, heif`)
   - Magic byte inspection using `file-type`
   - Size limit (5MB)
7. **Ticket Ownership**: API endpoints verify user owns the data they are modifying
8. **Rate Limiting**: Centralized `RateLimiter` class for sensitive endpoints

---

*4FISuctenky Technical Documentation - Version 2.0*
*Last Updated: February 2026*
