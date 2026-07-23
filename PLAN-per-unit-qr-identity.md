---
title: Per-Unit QR Identity & Return Flow Overhaul
date: 2026-07-07
status: planned
tags: [inventory, qr, return-flow, unit-tracking, admin-dashboard]
---

# Per-Unit QR Identity & Return Flow Overhaul

## Background

This document captures the full planning discussion for overhauling the QR identity model and return flow in the GMF Inventory system.

---

## The Core Problem

`barcode_id` today is a **1-to-1 identifier for an inventory row**, not a physical unit. Printing 10 labels for the same item (same batch, same part number) produces 10 identical QR codes. Scanning any of them resolves to the same inventory row. Two physically distinct units — different condition, different history — are indistinguishable to the system.

The relationship today:
```
QR label → inventory row (item type)
```

What it needs to be:
```
QR label → unit row (one specific physical unit) → inventory row (item type)
```

---

## How Return Works Today

Two entry points, both converge at `prosesReturn` in `useActiveLoans.ts`:

**Entry 1 — Quick Return (home page)**
ActiveBorrows "Return" button → `quickReturn(loan)` → `openReturnModal(loan)` → sets `focusedLoanId = loan.id` → opens ReturnModal pre-filtered to that single loan.

**Entry 2 — Manage All**
"Kelola" button → `openReturnModal()` with no argument → `focusedLoanId = null` → shows all active loans.

**Inside `prosesReturn`:**
- `SISA`: partial return. Inserts a RETURN transaction, adds `qtyDikembalikan` back to `inventory.quantity`. Leftover → CONSUMED_BULK transaction.
- `HABIS`: everything consumed. Skips RETURN transaction, inserts CONSUMED_BULK for full qty.
- Either way: marks original LOAN transaction `is_returned = true`.

**Location on return:** Never touched. `inventory.location` stays as-is — item implicitly returns to its original location, but only because the field is never changed.

---

## Identified Gaps

### Gap 1 — No per-unit identity
Same batch, same PN → same QR. Physical condition differences are invisible. Two units of the same chemical cannot be tracked individually.

### Gap 2 — Scan-to-add qty conflict
Current scanner: scanning the same `barcode_id` twice = intentional qty increment (add 2 to cart). After per-unit plan: scanning the same `unit_id` twice = accidental duplicate scan of one physical unit. System cannot tell the difference → silent duplicate loan for the same unit.

### Gap 3 — Cart dedup key is wrong
`addToCart` deduplicates on `inventory.id`. After the change, scanning unit A and unit B of the same item both resolve to the same `inventory_id` → cart merges them into qty 2, losing individual identity at checkout.

### Gap 4 — LOAN record doesn\'t record which unit
Checkout only writes `inventory_id + jumlah`. No `unit_id` per row → per-unit tracking dies at checkout even if the QR scan was correct.

### Gap 5 — Damaged/consumed units inflate available stock
Return adds `qtyDikembalikan` back to `inventory.quantity` unconditionally. A damaged unit that should not go back to available stock still gets counted.

### Gap 6 — Admin has zero visibility into active loans
`useDashboardStats` only processes completed transactions from `historyList`. No query against `transactions WHERE is_returned = false`. Admin cannot see who has what out right now.

### Gap 7 — Return UX is backwards
Worker types a number → system infers the rest as consumed. The user is holding physical units in their hand, not thinking in numbers. The form-driven flow is the wrong abstraction for a physical return.

---

## Business Logic Decisions

| Question | Decision |
|---|---|
| Lost vs Consumed | Same status: `CONSUMED`. Physical unit never coming back either way. No distinction needed. |
| Who resolves unreturned units | The worker. They borrowed it, they know what happened to it. |
| Automatic time-based resolution | No. System cannot know if WD-40 was used up or lost — only the worker can. Auto-rules produce garbage data. |
| Admin role for forgotten loans | View only. Admin sees outstanding loans as a follow-up queue, does not auto-resolve. |
| Damaged unit → available stock | No. Damaged = CONSUMED. Does not go back to available stock. |
| Location tracking on return | Unchanged. Unit returns to original `inventory.location` implicitly. |

---

## The Plan

### 1. Database — one new table

```sql
CREATE TABLE inventory_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
  printed_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR DEFAULT \'available\'  -- available | loaned | consumed
);
```

`inventory` table stays untouched. Purely additive.

---

### 2. Print Flow

- Printing N labels → inserts N rows into `inventory_units` first
- Each label QR encodes its own `unit_id` (UUID), not the shared `barcode_id`
- No two printed labels ever share an identity again
- Affected file: `app/so/utils/printUtils.ts`

---

### 3. Scanner — Home Borrow Flow

- Try `inventory_units` lookup by `unit_id` first
- Fall back to `inventory.barcode_id` for old labels already in the field (backward compatible)
- Guard: if `unit_id` already in cart → reject with warning, prevent double-scan
- Cart dedup key: `unit_id` instead of `inventory_id`
- Checkout (LOAN insert) records `unit_id` per transaction row
- Affected files: `app/hooks/useScanner.ts`, `app/hooks/useCart.ts`

---

### 4. Return Flow — Scan-Driven

**Current UX problem:** Worker types how many to return, system infers the rest as consumed. Backwards for a physical return.

**New flow:**
1. Worker opens return modal → sees active loans
2. For each loan: a scan area instead of a number input
3. Worker scans each physical unit they are returning one by one
4. Each scan resolves `unit_id`, confirms it belongs to this loan, marks it returned → back to available stock
5. Units not scanned: worker taps "Gone" per unit → status `CONSUMED`
6. Damaged unit scanned back: worker marks damaged → status `CONSUMED`, does not return to available stock
7. Modal cannot close until every unit in the loan is accounted for
8. "All consumed" shortcut remains as a one-tap option for when everything was used up

**Lost = Consumed.** No distinction. Same status, same outcome, simpler model.

- Affected files: `app/components/modals/ReturnModal.tsx`, `app/hooks/useActiveLoans.ts`

---

### 5. Admin Dashboard — Active Loans Tracking Board

New section in `DashboardTab`. Two views toggled:

**By worker** — who has items out right now:
```
Ahmad Fauzi (EMP-0042)
  ├── WD-40 400ml  → Unit #A3F2  → borrowed 3 days ago
  ├── WD-40 400ml  → Unit #B91C  → borrowed 3 days ago
  └── Grease Spray → Unit #D004  → borrowed 12 days ago  ⚠️
```

**By item** — which units are in the field:
```
WD-40 400ml  (8 units total, 3 in field, 5 available)
  ├── Unit #A3F2  → Ahmad Fauzi  → 3 days ago
  └── Unit #C110  → Budi Santoso → 8 days ago
```

- Age flag (⚠️) on loans older than configurable threshold (default: 7 days)
- Not automatic resolution — visual prompt to follow up
- Worker identity stays visible until every unit in their loan is resolved
- Data source: `transactions WHERE is_returned = false` joined to `inventory_units` and `inventory`
- New hook: `useActiveLoansAdmin`
- No new tab needed — new section inside existing `DashboardTab`
- Affected files: `app/so/hooks/useDashboardStats.ts`, `app/so/components/tabs/DashboardTab.tsx`

---

## Files That Change

| File | What changes |
|---|---|
| Supabase | Add `inventory_units` table |
| `app/so/utils/printUtils.ts` | Insert unit rows before generating labels |
| `app/hooks/useScanner.ts` | unit_id lookup + fallback + duplicate guard |
| `app/hooks/useCart.ts` | Dedup key → unit_id |
| `app/hooks/useActiveLoans.ts` | `prosesReturn` takes scanned unit IDs, records unit_id per transaction |
| `app/components/modals/ReturnModal.tsx` | Scan-driven UI, replaces qty input + HABIS/SISA binary |
| `app/so/hooks/useDashboardStats.ts` | Add active loans admin query |
| `app/so/components/tabs/DashboardTab.tsx` | New active loans board section |
| `app/so/types.ts` | Add `InventoryUnit` interface |
| `app/types.ts` | Add `unit_id` to `ActiveLoan`, `CartItem` |

---

## What Does NOT Change

- `inventory` table — stays as-is, still tracks aggregate quantity
- Existing printed labels — still work via barcode_id fallback in scanner
- Return logic structure — same `prosesReturn` shape, just accepts unit IDs instead of qty
- Location field — never written on return, implicitly stays original
