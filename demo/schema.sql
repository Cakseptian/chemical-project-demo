-- ============================================================
-- GMF Inventory System — Database Schema
-- Run this FIRST in Supabase SQL Editor before seed_demo.sql
-- ============================================================

-- 1. INVENTORY — master item list
CREATE TABLE IF NOT EXISTS inventory (
  id                  SERIAL PRIMARY KEY,
  part_name           TEXT NOT NULL,
  part_number         TEXT,
  location            TEXT,
  quantity            TEXT DEFAULT '0',
  barcode_id          UUID DEFAULT gen_random_uuid() UNIQUE,
  uom                 TEXT DEFAULT 'Pieces',
  is_bulk             BOOLEAN DEFAULT false,
  rack_type           TEXT DEFAULT 'NEW',
  expired_date_fixed  DATE,
  batch_number        TEXT,
  lead_time           INTEGER DEFAULT 2,
  document_url        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. INVENTORY UNITS — per-unit tracking (new QR label system)
CREATE TABLE IF NOT EXISTS inventory_units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id  INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'loaned', 'consumed')),
  printed_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_units_inventory_id ON inventory_units(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_units_status ON inventory_units(status);

-- 3. TRANSACTIONS — borrow / return / consume / audit history
CREATE TABLE IF NOT EXISTS transactions (
  id                SERIAL PRIMARY KEY,
  inventory_id      INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
  part_name         TEXT,
  part_number       TEXT,
  nama_peminjam     TEXT,
  nomor_pegawai     TEXT,
  jumlah            NUMERIC DEFAULT 0,
  transaction_type  TEXT DEFAULT 'LOAN',
                    -- LOAN | RETURN | CONSUMED_BULK | RETURN_HABIS | LOST | ADMIN_SO
  unit_id           UUID REFERENCES inventory_units(id) ON DELETE SET NULL,
  is_returned       BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_inventory_id ON transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_transactions_nama_peminjam ON transactions(nama_peminjam);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 4. ITEM REQUESTS — public-facing item request form
CREATE TABLE IF NOT EXISTS item_requests (
  id             SERIAL PRIMARY KEY,
  nama_peminjam  TEXT NOT NULL,
  nama_barang    TEXT NOT NULL,
  jumlah         INTEGER NOT NULL DEFAULT 1,
  keterangan     TEXT DEFAULT '-',
  status         TEXT DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'SELESAI')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS POLICIES (enable if Supabase RLS is turned on)
-- ============================================================

-- inventory: public read, authenticated write
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read inventory"
  ON inventory FOR SELECT USING (true);
CREATE POLICY "anon can update inventory"
  ON inventory FOR UPDATE USING (true);

-- inventory_units: public read/insert/update
ALTER TABLE inventory_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read units"
  ON inventory_units FOR SELECT USING (true);
CREATE POLICY "public can insert units"
  ON inventory_units FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update units"
  ON inventory_units FOR UPDATE USING (true);

-- transactions: public read/insert
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read transactions"
  ON transactions FOR SELECT USING (true);
CREATE POLICY "public can insert transactions"
  ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update transactions"
  ON transactions FOR UPDATE USING (true);

-- item_requests: public read/insert, anon update
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read requests"
  ON item_requests FOR SELECT USING (true);
CREATE POLICY "public can insert requests"
  ON item_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "public can update requests"
  ON item_requests FOR UPDATE USING (true);
CREATE POLICY "public can delete requests"
  ON item_requests FOR DELETE USING (true);
