# Production Audit — Todo List

## Status: IN PROGRESS

---

## 🔴 CRITICAL

### C1: RLS Supabase — Security Audit
> Dikerjakan manual di Supabase Dashboard

- [ ] Audit RLS policy per tabel: `inventory`, `inventory_units`, `transactions`, `item_requests`
- [ ] Pastikan DELETE tidak bisa dilakukan anon di semua tabel
- [ ] Pastikan UPDATE `transactions` tidak bisa dilakukan anon (audit trail protection)

**Checklist per tabel:**
| Tabel | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `inventory` | anon ok | admin only | anon ok (checkout) | ❌ tidak boleh anon |
| `inventory_units` | anon ok | admin only | anon ok (loan/return) | ❌ tidak boleh anon |
| `transactions` | anon ok | anon ok | ❌ tidak boleh siapapun | ❌ tidak boleh siapapun |
| `item_requests` | anon ok | anon ok | admin only | admin only |

### C3: Data Integrity — Rollback/Transaction
> Dikerjakan via code (Supabase RPC / Edge Function)

- [ ] Implementasi Supabase RPC function untuk atomic checkout
- [ ] Implementasi Supabase RPC function untuk atomic return
- [ ] Update `useCart.ts` untuk pakai RPC
- [ ] Update `useActiveLoans.ts` untuk pakai RPC

---

## 🟠 HIGH

### H4: Fix prosesReturn — string ke integer column
- [ ] `useActiveLoans.ts` prosesReturn — hilangkan `.toString()` yang kirim string ke integer column

### H5: Fix tombol Cancel di konfirmasi hapus barang
- [ ] `useInventory.ts` handleHapusBarang — fix `window.confirm()` Cancel tidak berfungsi

---

## 🟡 MEDIUM (Suspended — kerjakan setelah Critical & High selesai)

- [ ] Tambah Error Boundary di `app/page.tsx` dan `app/so/page.tsx`
- [ ] Tambah env validation di `lib/supabase.ts`
- [ ] Ganti `alert()`/`confirm()` native dengan UI modal yang konsisten

---

## ✅ COMPLETED

- [x] Refactor: split large tab files (`refactor/split-large-tabs`)
- [x] Refactor: deduplicate loan query, extract parseScannedId, memoize grouping (`refactor/cleanup-hooks`)
- [x] Refactor: TransactionType union type ke lib/types (`refactor/type-safety`)
- [x] Feature: return location selection
- [x] Fix: checkout qty tidak berkurang
- [x] Fix: RLS blocking inventory update (anon checkout)
- [x] UI: redesign ReturnModal
- [x] UI: column info tooltips SBA table
- [x] UI: Excel-style column filter inventory
