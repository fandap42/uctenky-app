# 4FISuctenky

> Webová aplikace pro správu účtenek a finančních náhrad studentské organizace 4FIS

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)](https://www.postgresql.org/)

## ✨ Funkce

- **Správa žádostí o nákup** - kompletní workflow od podání po proplacení
- **Role-based access control** - Člen, Vedoucí sekce, Administrátor
- **Nahrávání účtenek** - podpora HEIC (iPhone), automatická konverze
- **Pokladna** - evidence vkladů, dluhu z chyb, hotovosti
- **Rozpočty sekcí** - sledování čerpání rozpočtů po semestrech
- **CSV export** - kompatibilita s českým Excelem (středník jako oddělovač)

## 🚀 Rychlý start

### Předpoklady

- Node.js 20+
- PostgreSQL 14+
- MinIO nebo S3-kompatibilní storage

### Instalace

```bash
# Klonování repozitáře
git clone https://github.com/your-org/uctenky-app.git
cd uctenky-app

# Instalace závislostí
npm install

# Nastavení prostředí
cp .env.example .env
# Upravte .env dle vašeho prostředí

# Migrace databáze
npx prisma db push

# Spuštění vývojového serveru
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000)

## ⚙️ Konfigurace

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uctenky_app"

# NextAuth
AUTH_SECRET="your-secret-key-min-32-chars"
AUTH_URL="http://localhost:3000"

# MinIO / S3 Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="receipts"
S3_PUBLIC_ENDPOINT="http://localhost:9000"
```

### MinIO setup

```bash
# Docker
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"

# Vytvořte bucket "receipts" v MinIO konzoli na http://localhost:9001
```

## 📁 Struktura projektu

```
uctenky-app/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, upload)
│   ├── dashboard/          # Chráněné stránky
│   └── login/              # Přihlašovací stránka
├── components/             # React komponenty
│   ├── dashboard/          # Dashboard komponenty
│   ├── pokladna/           # Pokladna komponenty
│   ├── receipts/           # Nahrávání účtenek
│   └── ui/                 # Shadcn/UI
├── lib/                    # Utility a konfigurace
│   ├── actions/            # Server actions
│   ├── s3.ts               # MinIO/S3 klient
│   └── prisma.ts           # Prisma klient
├── prisma/                 # Databázové schéma
└── docs/                   # Dokumentace
```

## 👥 Role uživatelů

| Role | Oprávnění |
|------|-----------|
| **MEMBER** | Podávání žádostí o nákup |
| **HEAD_*** | Přehled žádostí své sekce (pouze čtení) |
| **ADMIN** | Kompletní správa systému včetně schvalování |

## 📖 Dokumentace

- [Uživatelská příručka (CZ)](docs/USER_MANUAL_CZ.md)
- [Technická dokumentace (EN)](docs/TECHNICAL_DOCUMENTATION.md)

## 🛠️ Technologie

| Kategorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Jazyk | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI | Shadcn/UI |
| ORM | Prisma 7 |
| Databáze | PostgreSQL |
| Autentizace | NextAuth.js v5 |
| Storage | MinIO (S3-compatible) |

## 📝 Skripty

```bash
npm run dev      # Vývojový server
npm run build    # Produkční build
npm run start    # Produkční server
npm run lint     # ESLint kontrola
```

## 🧪 Testování (lokální)

Aplikace používá Vitest pro unit/integration testy a Playwright pro E2E testy. Doporučuje se spouštět tyto testy **ručně před každým nasazením (deployem)** do produkce.

```bash
npm run test           # Unit a integration testy
npm run test:e2e       # E2E testy (Playwright)
npm run test:coverage  # Report pokrytí
npm run test:watch     # Watch mode
```

### Co testovat

| Priorita | Oblast | Příklady |
|----------|--------|----------|
| 🔴 Vysoká | Utility funkce | `lib/utils/semesters.ts`, `lib/utils/roles.ts` |
| 🔴 Vysoká | Server actions | `lib/actions/transactions.ts`, oprávnění |
| 🟡 Střední | E2E workflow | Přihlášení, schválení žádosti, nahrání účtenky |
| 🟢 Nižší | Komponenty | Interaktivní UI komponenty |

Podrobnosti viz [Technická dokumentace](docs/TECHNICAL_DOCUMENTATION.md#testing).

## 🔐 Bezpečnost

- Hesla hashována pomocí bcryptjs (10 rounds)
- HTTP-only session cookies
- Role-based access control na všech chráněných akcích
- Validace typů a velikosti nahrávaných souborů

## 📄 Licence

Proprietární software pro 4FIS.

---

*4FISuctenky © 2026*
