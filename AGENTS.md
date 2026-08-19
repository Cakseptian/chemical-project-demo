# AGENTS.md — GMF Inventory Control System

# Agent Instructions
You are a coding assistant. Focus on the codebase and coding tasks only.
Do not mention your name or identity unless asked directly.

## Commands

```bash
npm run dev          # dev server
npm run build        # production build (Turbopack) — always run before committing
npx tsc --noEmit     # typecheck only, faster than full build
npm run lint         # eslint
npm run doctor       # react-doctor scan
```

Verification order: `tsc --noEmit` → `npm run build`. No test suite exists.

## Push to GitHub

Git credential not configured for `origin`. Always push with token:

```powershell
$token = (gh auth token); git push "https://septianshft:$token@github.com/septianshft/Stock-Opname-Project.git" main
```

## Architecture

Two separate user interfaces, one Next.js app:
- `/` — Employee side: scan QR, borrow (cart checkout), return items
- `/so` — Admin side: stock opname, inventory CRUD, history, SBA forecasting, requests

No shared state between the two routes — each has its own hooks.

**Key directories:**
- `app/hooks/` — employee hooks (`useCart`, `useScanner`, `useActiveLoans`, etc.)
- `app/so/hooks/` — admin hooks (`useInventory`, `useHistory`, `useScanner`, etc.)
- `app/components/` — employee components
- `app/so/components/` — admin components
- `lib/supabase.ts` — single Supabase client (god node, 17 edges)
- `lib/sbaCalculator.ts` — SBA/Croston forecasting, runs entirely client-side via `useMemo`

## Database (Supabase)

4 tables: `inventory`, `inventory_units`, `transactions`, `item_requests`

- `inventory.quantity` — type **INTEGER** (was TEXT, now converted). Always send numbers, not strings, on update.
- `inventory_units` — one row per physical unit UUID. Status: `available | loaned | consumed`
- `transactions` — append-only audit log. Has `return_location TEXT NULL` column (added for return flow).
- RLS policies exist on all tables. UPDATE policy on `inventory` requires `auth.role() = 'authenticated'` — employee side runs as `anon`, so the policy must include anon or be set to `USING (true)` for checkout to work.

## Critical Bugs Fixed (don't reintroduce)

1. **Checkout qty not decreasing** — was using `item.max_quantity` snapshot from cart. Fixed: fetch fresh qty from DB at checkout time in `useCart.ts`.
2. **RLS blocking inventory update** — UPDATE policy was `authenticated` only, blocking anon employee checkout. Fix: policy must allow anon.
3. **String sent to integer column** — always pass `number` (not `.toString()`) when updating `inventory.quantity`.

## Conventions

- Icons: `@phosphor-icons/react` — use `weight="bold"` / `weight="fill"` / `weight="thin"` consistently
- Colors: `#001e2b` (dark navy header), `#00ed64` (emerald CTA), Tailwind slate for everything else
- Primary CTA buttons: `rounded-full bg-[#00ed64] text-[#001e2b]`
- Secondary buttons: `rounded-lg` or `rounded-full` depending on context
- Font scale for labels: `text-[10px] font-bold uppercase tracking-widest text-slate-400`
- No global state library — all state lives in custom hooks per page

## QR System

Two label generations coexist:
- **New (current):** per-unit UUID stored in `inventory_units`. Scan → lookup `inventory_units` → get `inventory_id`
- **Old (legacy, no longer supported):** `barcode_id` string. Old label scans now return an error message.

`unit_id` on a transaction row = null means pre-migration loan. Modal handles this as "old loan" fallback path.

## Graphify

Knowledge graph is pre-built at `graphify-out/`. Query before exploring unknown parts:

```powershell
$env:PYTHONUTF8="1"; python -m graphify query "your question here"
python -m graphify update .   # rebuild after code changes
```

## Future Refactor (deferred)

**4B: Consolidate `InventoryItemPublic` into shared type**
- `app/types.ts` defines `InventoryItemPublic` manually as a subset of `InventoryItem` (`app/so/types.ts`)
- Long-term fix: move `InventoryItem` to `lib/types/inventory.ts`, then `InventoryItemPublic = Pick<InventoryItem, "id" | "part_name" | "part_number" | "location" | "quantity">`
- Risk: touches many imports across both employee and admin sides — do as a dedicated branch
- Consumers: `app/hooks/useSearch.ts`, `app/components/modals/SearchModal.tsx`
