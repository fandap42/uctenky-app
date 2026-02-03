# 4FIS Design System

This document serves as the source of truth for the **4FIS Design System**. It outlines available components (atoms), styling tokens, and best practices for maintaining a consistent and resilient UI.

---

## 1. Core Atoms

### StatusBadge
A semantic badge for displaying ticket and item statuses.
- **File:** `components/ui/status-badge.tsx`
- **Statuses:** `pending`, `approved`, `verification`, `success`, `rejected`
- **Usage:**
```tsx
import { StatusBadge, mapTicketStatusToBadge } from "@/components/ui/status-badge"

// Manual usage
<StatusBadge status="pending">Čeká na schválení</StatusBadge>

// Mapping from Prisma TicketStatus enum
<StatusBadge status={mapTicketStatusToBadge(ticket.status)} />
```

### ExpenseTypeBadge
Displays the type of expense (Material vs. Service).
- **File:** `components/ui/expense-type-badge.tsx`
- **Usage:**
```tsx
import { ExpenseTypeBadge, mapExpenseTypeToVariant } from "@/components/ui/expense-type-badge"

<ExpenseTypeBadge type={mapExpenseTypeToVariant(item.expenseType)} />
```

### FunctionalCheckbox
Semantic checkboxes for "Paid" and "Filed" states.
- **File:** `components/ui/functional-checkbox.tsx`
- **Variants:** `paid`, `filed` (default uses primary theme)
- **Usage:**
```tsx
import { FunctionalCheckbox } from "@/components/ui/functional-checkbox"

<FunctionalCheckbox variant="paid" checked={isPaid} onCheckedChange={handleToggle} />
```

---

## 2. Tokens & Utilities

### Semantic Color Variables
Defined in `app/globals.css`, these variables automatically adjust for Light and Dark modes.

| Variable | Description |
| :--- | :--- |
| `--status-pending` | Warning/Amber state (e.g., Pending Approval) |
| `--status-approved` | Info/Blue state (e.g., Approved) |
| `--status-verification` | Action/Purple state (e.g., Verification) |
| `--status-success` | Success/Green state (e.g., Done / Paid) |
| `--paid` / `--unpaid` | Financial status colors |
| `--filed` | Document filing status color |

### Typography Classes
- `.text-label`: Small, uppercase, bold labels (800 weight).
- `.text-badge`: Font style specific to badges.
- `.financial-data`: Tabular numbers with semi-bold styling.

---

## 3. Best Practices: Defensive CSS

To prevent layout shifts and maintain a premium feel under variable data:

### Always Truncate Badges
Badges in tables or tight containers must be constrained to prevent breaking the layout.
- **Rule:** Use `max-w-[140px] truncate` and provide a `title` attribute for hover accessibility.

### Flexbox Collision Prevention
In headers or rows where text sits next to actions:
- **Rule:** Apply `min-w-0` and `truncate` to the text container. Apply `flex-shrink-0` to the actions/buttons.

### Crushed Table Prevention
Columns with variable text lengths (like "Purpose" or "Store") can collapse during zoom or on small screens.
- **Rule:** Enforce `min-w-[...px]` (e.g., `min-w-[200px]` for purpose) on critical columns.

### Accessible Truncation
- **Rule:** Whenever using `truncate` on a text element, always add a `title` attribute containing the full text so users can read it on hover.
