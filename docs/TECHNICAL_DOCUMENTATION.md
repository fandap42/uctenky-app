# 4FISuctenky - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Project Structure](#project-structure)
7. [Core Features](#core-features)
8. [API Routes](#api-routes)
9. [Deployment](#deployment)

---

## Overview

**4FISuctenky** is a full-stack web application for managing financial reimbursements and receipts for the 4FIS student organization. It provides a complete workflow from purchase request submission to receipt verification and payment tracking.

### Key Features

- User authentication with role-based access control
- Purchase request submission and approval workflow
- Receipt upload with HEIC/HEIF conversion support
- Cash register (Pokladna) management
- Budget tracking by section and semester
- CSV export functionality (Czech Excel compatible)

---

## Technology Stack

```mermaid
graph TD
    subgraph Frontend
        A[Next.js 16 App Router]
        B[React 19]
        C[Tailwind CSS]
        D[Shadcn/UI Components]
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
        J[bcryptjs]
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
```

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.1.3 |
| Runtime | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | Shadcn/UI | Latest |
| ORM | Prisma | 7.2.0 |
| Database | PostgreSQL | 14+ |
| Authentication | NextAuth.js | 5.x (Beta) |
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
        PROXY[Proxy/Middleware]
    end
    
    subgraph External["External Services"]
        DB[(PostgreSQL)]
        STORAGE[MinIO S3 Storage]
    end
    
    UI --> SA
    SA --> APP
    APP --> AUTH
    AUTH --> ACTIONS
    ACTIONS --> DB
    ACTIONS --> STORAGE
    PROXY --> APP
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
    User ||--o{ Transaction : creates
    Section ||--o{ Transaction : has
    
    User {
        string id PK
        string email UK
        string passwordHash
        string fullName
        enum role
        datetime createdAt
        datetime updatedAt
    }
    
    Section {
        string id PK
        string name
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Transaction {
        string id PK
        string requesterId FK
        string sectionId FK
        enum status
        string purpose
        string store
        datetime dueDate
        decimal estimatedAmount
        decimal finalAmount
        string receiptUrl
        boolean isPaid
        boolean isFiled
        enum expenseType
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

enum TransStatus {
  DRAFT      // Initial state
  PENDING    // Awaiting approval
  APPROVED   // Approved by head
  REJECTED   // Rejected
  PURCHASED  // Purchase completed, receipt uploaded
  VERIFIED   // Receipt verified by admin
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
    B -->|No| D[Show login form]
    D --> E[Submit credentials]
    E --> F{Valid credentials?}
    F -->|No| G[Show error]
    G --> D
    F -->|Yes| H[Create session]
    H --> I[Set session cookie]
    I --> C
```

### Role-Based Access Control

| Route | MEMBER | HEAD_* | ADMIN |
|-------|--------|--------|-------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/dashboard/head` | ❌ | ✅ (read-only) | ❌ |
| `/dashboard/admin` | ❌ | ❌ | ✅ |
| `/dashboard/pokladna` | ❌ | ❌ | ✅ |
| `/dashboard/budget` | ❌ | ❌ | ✅ |
| `/dashboard/users` | ❌ | ❌ | ✅ |

> **Note:** Section heads (HEAD_*) can only **view** transactions for their section. Approval is done exclusively by ADMIN.

### Implementation

Authentication is handled by NextAuth.js v5 with credentials provider:

```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate credentials against database
        // Return user object or null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})
```

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
│   ├── login/                    # Login page
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── dashboard/                # Dashboard components
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── semester-structured-list.tsx
│   │   ├── paid-status-select.tsx
│   │   ├── filed-status-select.tsx
│   │   └── ...
│   ├── pokladna/                 # Cash register components
│   │   ├── deposit-dialog.tsx
│   │   ├── debt-error-dialog.tsx
│   │   ├── cash-on-hand-dialog.tsx
│   │   ├── overview-table.tsx
│   │   └── cash-register-export.tsx
│   ├── receipts/                 # Receipt components
│   │   └── receipt-upload.tsx    # UI component for upload
│   ├── requests/                 # Request components
│   │   ├── new-request-dialog.tsx
│   │   └── approval-actions.tsx
│   └── ui/                       # Shadcn/UI components
│
├── hooks/                        # React hooks
│   └── useReceiptUpload.ts       # Upload logic and state
│
├── lib/                          # Utilities and configurations
│   ├── actions/                  # Server actions
│   │   ├── transactions.ts       # Transaction CRUD
│   │   ├── cash-register.ts      # Cash register operations
│   │   └── semesters.ts          # Semester utilities
│   ├── constants/                # App constants
│   │   └── messages.ts           # Centralized Czech messages
│   ├── prisma.ts                 # Prisma client
│   ├── s3.ts                     # MinIO/S3 storage client
│   └── utils/                    # Utility functions
│       ├── semesters.ts          # Semester calculations
│       ├── roles.ts              # Role utilities
│       ├── rate-limit.ts         # Rate limiting class
│       └── file-validator.ts     # File validation logic
│
├── prisma/                       # Prisma configuration
│   ├── schema.prisma             # Database schema
│   └── prisma.config.ts          # Prisma configuration
│
├── actions/                      # Additional server actions
│   └── users.ts                  # User management
│
├── auth.ts                       # NextAuth configuration
├── proxy.ts                      # Next.js middleware
└── docs/                         # Documentation
```

---

## Core Features

### 1. Transaction Workflow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create request
    DRAFT --> PENDING: Submit
    PENDING --> APPROVED: Admin approves
    PENDING --> REJECTED: Admin rejects
    APPROVED --> PURCHASED: Upload receipt
    PURCHASED --> VERIFIED: Admin verifies
    VERIFIED --> [*]
    REJECTED --> [*]
```

### 2. Receipt Upload with HEIC Conversion

The application supports iPhone photos (HEIC/HEIF format) with automatic client-side conversion to JPEG:

```typescript
// Simplified flow
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
    T[Paid Transactions] --> B
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
NextAuth.js authentication endpoints.

### `/api/upload` (POST)
Handles receipt file uploads to MinIO S3-compatible storage.

**Security Features:**
- **Authentication**: Requires a valid user session.
- **Ownership Verification**: Verifies that the `transactionId` belongs to the authenticated user (or user is ADMIN).
- **Rate Limiting**: Limited to 10 requests per minute per IP.
- **Deep Validation**: Inspects file magic bytes (not just MIME type) and whitelists extensions.

**Request:**
- `FormData` with `file` and `transactionId`

**Response:**
```json
{
  "url": "http://localhost:9000/receipts/..."
}
```

---

## Deployment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="https://your-domain.com"

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

## Testing

### Testing Strategy Overview

The application should be tested at multiple levels to ensure reliability and maintainability:

```mermaid
graph TD
    subgraph Tests["Testing Pyramid"]
        E2E["E2E Tests<br/>(Playwright)"]
        INT["Integration Tests<br/>(Vitest + Test DB)"]
        UNIT["Unit Tests<br/>(Vitest)"]
    end
    
    E2E --> INT
    INT --> UNIT
    
    style UNIT fill:#4ade80
    style INT fill:#60a5fa
    style E2E fill:#f472b6
```

### Recommended Testing Stack

| Test Type | Tool | Purpose |
|-----------|------|---------|
| Unit Tests | Vitest | Fast, ESM-native, TypeScript support |
| Integration Tests | Vitest + Prisma | Server actions with database |
| E2E Tests | Playwright | Full user flow testing |
| Component Tests | React Testing Library | UI component behavior |

### What to Test

#### 1. Unit Tests (High Priority)

Pure utility functions that can be tested in isolation:

**`lib/utils/semesters.ts`**
```typescript
// Test cases for getSemester():
// - September 2025 → "ZS25"
// - January 2026 → "ZS25" (belongs to previous semester)
// - February 2026 → "LS26"
// - December 2025 → "ZS25"
// - Year boundary edge cases
```

**`lib/utils/roles.ts`**
```typescript
// Test cases:
// - isHeadRole("HEAD_FINANCE") → true
// - isHeadRole("MEMBER") → false
// - isAdmin("ADMIN") → true
// - getSectionForRole("HEAD_HR") → "HR"
// - canViewSection("ADMIN", "Finance") → true
// - canViewSection("HEAD_HR", "Finance") → false
```

#### 2. Integration Tests (High Priority)

Server actions with mocked/test database:

**`lib/actions/transactions.ts`**
| Function | Key Test Scenarios |
|----------|-------------------|
| `createTransaction` | Valid creation, missing fields, unauthorized user |
| `updateTransactionStatus` | ADMIN-only enforcement, valid state transitions |
| `updateTransactionReceipt` | Owner vs non-owner access, status change to PURCHASED |
| `deleteTransaction` | Owner can delete DRAFT/PENDING, ADMIN can delete any |

**`lib/actions/cash-register.ts`**
| Function | Key Test Scenarios |
|----------|-------------------|
| `getAllCashRegisterData` | Balance calculations, real cash formula |
| `createDeposit` | ADMIN-only, positive amounts |
| `getBalanceAtDate` | Historical balance accuracy |

**Authorization Matrix Tests:**
```typescript
// Verify that non-ADMIN users cannot:
// - Approve/reject transactions
// - Update paid/filed status
// - Modify expense types
// - Access cash register operations
```

#### 3. Authentication Tests (High Priority)

**`auth.ts`**
- Valid credentials return user object
- Invalid password returns null
- Non-existent user returns null
- Password hash comparison

**`middleware.ts`**
- Unauthenticated user redirected from `/dashboard/*`
- Authenticated user redirected from `/login`
- Root path redirects appropriately

#### 4. E2E Tests (Medium Priority)

Complete user workflows using Playwright:

| Flow | Steps |
|------|-------|
| Member Request | Login → Create request → Submit → View in list |
| Admin Approval | Login as ADMIN → View requests → Approve → Verify status |
| Receipt Upload | Login → Select approved request → Upload image → Confirm |
| Cash Register | Login as ADMIN → Add deposit → View balance update |

### Test File Structure

```
uctenky-app/
├── __tests__/                    # Test directory
│   ├── unit/                     # Unit tests
│   │   ├── semesters.test.ts
│   │   ├── roles.test.ts
│   │   ├── file-validator.test.ts
│   │   └── rate-limit.test.ts
│   ├── integration/              # Integration tests
│   │   ├── transactions.test.ts
│   │   └── cash-register.test.ts
│   └── e2e/                      # E2E tests (Playwright)
│       ├── auth.spec.ts
│       └── workflows.spec.ts
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

### Database Testing Strategy

For integration tests involving Prisma:

1. **Option A: Separate Test Database**
   - Use `DATABASE_URL` pointing to dedicated test PostgreSQL instance
   - Reset database between test runs with `prisma migrate reset`

2. **Option B: In-Memory Database (SQLite)**
   - Faster but may have compatibility differences
   - Use Prisma's `--preview-feature` for SQLite

3. **Option C: Transaction Rollback**
   - Wrap each test in a transaction
   - Rollback after test completion

### Running Tests

```bash
# Unit and Integration tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch
```

---

## Security Considerations

1. **Password Hashing**: bcryptjs with salt rounds of 10
2. **Session Security**: HTTP-only cookies, secure in production
3. **CSRF Protection**: Built-in Next.js protection
4. **Input Validation**: Server-side validation in all actions using Zod or custom logic
5. **Role Checks**: Every protected action verifies user role
6. **File Upload**: 
   - Strict extension whitelist (`jpg, jpeg, png, gif, webp, heic, heif`)
   - Magic byte inspection using `file-type`
   - Size limit (5MB)
7. **Transaction Ownership**: API endpoints verify user owns the data they are modifying
8. **Rate Limiting**: Centralized `RateLimiter` class for sensitive endpoints
9. **Centralized Messaging**: Consistent error messages through `lib/constants/messages.ts`

---

## Performance Optimizations

1. **Server Components**: Majority of UI uses React Server Components
2. **Streaming**: Progressive page rendering
3. **Image Optimization**: Client-side HEIC conversion reduces server load
4. **Caching**: Next.js path revalidation on data changes
5. **Database**: Prisma query optimization with selective includes

---

*4FISuctenky Technical Documentation - Version 1.1*
*Last Updated: January 21, 2026*
