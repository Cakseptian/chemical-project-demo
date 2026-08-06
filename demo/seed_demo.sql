-- ============================================================
-- GMF Inventory Demo Seed Script
-- Run this in Supabase SQL Editor to populate demo data
-- ============================================================

-- 1. Clear existing demo data (preserves real transactions)
TRUNCATE TABLE inventory RESTART IDENTITY CASCADE;

-- 2. Seed inventory — mix of Unit/Pieces and Bulk/Liters
INSERT INTO inventory (part_name, part_number, location, quantity, barcode_id, uom, is_bulk, rack_type, expired_date_fixed, batch_number, lead_time) VALUES

-- ── UNIT / PIECES ────────────────────────────────────────────
('Safety Gloves Nitrile L',     'PPE-GLV-001',  'Rack A1',  8,   gen_random_uuid(), 'Pieces', false, 'NEW', '2027-06-01', 'BT-2024-001', 2),
('Safety Glasses Clear',        'PPE-SGL-002',  'Rack A1',  12,  gen_random_uuid(), 'Pieces', false, 'NEW', '2028-01-15', 'BT-2024-002', 3),
('Face Shield Full',            'PPE-FSH-003',  'Rack A2',  5,   gen_random_uuid(), 'Pieces', false, 'NEW', '2027-09-30', 'BT-2024-003', 5),
('Respirator N95 Mask',         'PPE-RSP-004',  'Rack A2',  2,   gen_random_uuid(), 'Pieces', false, 'NEW', '2025-12-31', 'BT-2023-004', 7),
('Ear Muff Protection',         'PPE-EAR-005',  'Rack A3',  0,   gen_random_uuid(), 'Pieces', false, 'OLD', '2028-03-20', 'BT-2024-005', 3),
('Chemical Splash Apron',       'PPE-APR-006',  'Rack A3',  6,   gen_random_uuid(), 'Pieces', false, 'NEW', '2029-01-01', 'BT-2025-006', 4),
('Lab Coat Size M',             'PPE-LAB-007',  'Rack B1',  4,   gen_random_uuid(), 'Pieces', false, 'NEW', NULL,          'BT-2024-007', 5),
('Chemical Resistant Boots',    'PPE-BOT-008',  'Rack B1',  3,   gen_random_uuid(), 'Pieces', false, 'NEW', NULL,          'BT-2024-008', 14),
('Absorbent Pad Chemical',      'SAF-ABS-009',  'Rack B2',  20,  gen_random_uuid(), 'Pieces', false, 'NEW', '2026-08-15', 'BT-2024-009', 2),
('Fire Extinguisher ABC 3kg',   'SAF-FEX-010',  'Rack C1',  4,   gen_random_uuid(), 'Pieces', false, 'NEW', '2026-03-01', 'BT-2023-010', 30),
('Spill Kit Emergency',         'SAF-SPK-011',  'Rack C1',  2,   gen_random_uuid(), 'Pieces', false, 'NEW', '2027-12-01', 'BT-2024-011', 7),
('Safety Cone Orange',          'SAF-CON-012',  'Rack C2',  15,  gen_random_uuid(), 'Pieces', false, 'OLD', NULL,          'BT-2023-012', 3),

-- ── BULK / LITERS ────────────────────────────────────────────
('Acetone Technical Grade',     'CHM-ACT-101',  'Cabinet 1', 3.5, gen_random_uuid(), 'Liters', true, 'NEW', '2026-01-15', 'BT-2024-101', 7),
('Isopropyl Alcohol 99%',       'CHM-IPA-102',  'Cabinet 1', 5.0, gen_random_uuid(), 'Liters', true, 'NEW', '2026-09-30', 'BT-2024-102', 5),
('Hydraulic Fluid MIL-H-5606',  'CHM-HYD-103',  'Cabinet 2', 8.0, gen_random_uuid(), 'Liters', true, 'NEW', '2027-06-01', 'BT-2024-103', 14),
('Skydrol LD-4 Hydraulic',      'CHM-SKY-104',  'Cabinet 2', 2.0, gen_random_uuid(), 'Liters', true, 'NEW', '2025-11-30', 'BT-2023-104', 21),
('MEK Methyl Ethyl Ketone',     'CHM-MEK-105',  'Cabinet 3', 4.5, gen_random_uuid(), 'Liters', true, 'NEW', '2026-04-01', 'BT-2024-105', 7),
('Toluene Solvent',             'CHM-TOL-106',  'Cabinet 3', 1.5, gen_random_uuid(), 'Liters', true, 'NEW', '2025-08-01', 'BT-2023-106', 10),
('Turco Cleaner Compound',      'CHM-TRC-107',  'Cabinet 4', 6.0, gen_random_uuid(), 'Liters', true, 'NEW', '2027-03-15', 'BT-2024-107', 14),
('Loctite 243 Threadlocker',    'CHM-LOC-108',  'Cabinet 4', 0.5, gen_random_uuid(), 'Liters', true, 'NEW', '2026-12-01', 'BT-2024-108', 5);


-- 3. Seed transaction history (makes SBA forecasting meaningful)
-- Simulate 21 weeks of borrow activity
INSERT INTO transactions (inventory_id, part_name, part_number, nama_peminjam, nomor_pegawai, jumlah, transaction_type, created_at) VALUES

-- Safety Gloves — high frequency borrowing (will trigger REORDER)
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Ahmad Fauzi',    'GMF-1234', 3, 'LOAN', NOW() - INTERVAL '1 week'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Budi Santoso',   'GMF-2345', 2, 'LOAN', NOW() - INTERVAL '2 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Citra Dewi',     'GMF-3456', 4, 'LOAN', NOW() - INTERVAL '3 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Dian Pratama',   'GMF-4567', 2, 'LOAN', NOW() - INTERVAL '5 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Eko Wahyudi',    'GMF-5678', 3, 'LOAN', NOW() - INTERVAL '7 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Fajar Nugroho',  'GMF-6789', 2, 'LOAN', NOW() - INTERVAL '9 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Ahmad Fauzi',    'GMF-1234', 3, 'LOAN', NOW() - INTERVAL '12 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Budi Santoso',   'GMF-2345', 2, 'LOAN', NOW() - INTERVAL '15 weeks'),
(1, 'Safety Gloves Nitrile L', 'PPE-GLV-001', 'Citra Dewi',     'GMF-3456', 1, 'LOAN', NOW() - INTERVAL '18 weeks'),

-- Acetone — bulk consumption
(13, 'Acetone Technical Grade', 'CHM-ACT-101', 'Ahmad Fauzi',   'GMF-1234', 1, 'CONSUMED_BULK', NOW() - INTERVAL '2 weeks'),
(13, 'Acetone Technical Grade', 'CHM-ACT-101', 'Dian Pratama',  'GMF-4567', 1, 'CONSUMED_BULK', NOW() - INTERVAL '5 weeks'),
(13, 'Acetone Technical Grade', 'CHM-ACT-101', 'Eko Wahyudi',   'GMF-5678', 1, 'CONSUMED_BULK', NOW() - INTERVAL '9 weeks'),
(13, 'Acetone Technical Grade', 'CHM-ACT-101', 'Ahmad Fauzi',   'GMF-1234', 1, 'CONSUMED_BULK', NOW() - INTERVAL '14 weeks'),

-- Safety Glasses — moderate borrowing
(2, 'Safety Glasses Clear', 'PPE-SGL-002', 'Fajar Nugroho',  'GMF-6789', 2, 'LOAN', NOW() - INTERVAL '1 week'),
(2, 'Safety Glasses Clear', 'PPE-SGL-002', 'Galih Permana',  'GMF-7890', 1, 'LOAN', NOW() - INTERVAL '4 weeks'),
(2, 'Safety Glasses Clear', 'PPE-SGL-002', 'Hana Sari',      'GMF-8901', 3, 'LOAN', NOW() - INTERVAL '8 weeks'),
(2, 'Safety Glasses Clear', 'PPE-SGL-002', 'Irwan Setiawan', 'GMF-9012', 2, 'LOAN', NOW() - INTERVAL '13 weeks'),

-- IPA — bulk consumption
(14, 'Isopropyl Alcohol 99%', 'CHM-IPA-102', 'Budi Santoso',  'GMF-2345', 1, 'CONSUMED_BULK', NOW() - INTERVAL '1 week'),
(14, 'Isopropyl Alcohol 99%', 'CHM-IPA-102', 'Citra Dewi',    'GMF-3456', 1, 'CONSUMED_BULK', NOW() - INTERVAL '4 weeks'),
(14, 'Isopropyl Alcohol 99%', 'CHM-IPA-102', 'Eko Wahyudi',   'GMF-5678', 1, 'CONSUMED_BULK', NOW() - INTERVAL '10 weeks'),

-- Respirator — low stock borrowing (will show cold start / low stock)
(4, 'Respirator N95 Mask', 'PPE-RSP-004', 'Ahmad Fauzi',    'GMF-1234', 1, 'LOAN', NOW() - INTERVAL '3 weeks'),
(4, 'Respirator N95 Mask', 'PPE-RSP-004', 'Dian Pratama',   'GMF-4567', 1, 'LOAN', NOW() - INTERVAL '8 weeks');


-- 4. Seed demo item requests
INSERT INTO item_requests (nama_peminjam, nama_barang, jumlah, keterangan, status, created_at) VALUES
('Ahmad Fauzi',   'Safety Gloves Nitrile XL',  5,  'Untuk hangar B maintenance',     'PENDING',  NOW() - INTERVAL '2 days'),
('Budi Santoso',  'Chemical Splash Goggles',    3,  'Pengganti yang rusak',           'PENDING',  NOW() - INTERVAL '1 day'),
('Citra Dewi',    'Acetone 5L container',       1,  'Untuk cleaning komponen',        'SELESAI',  NOW() - INTERVAL '5 days'),
('Dian Pratama',  'Lab Coat Size L',            2,  'Untuk tim baru',                 'PENDING',  NOW() - INTERVAL '3 hours'),
('Eko Wahyudi',   'Fire Extinguisher CO2 2kg',  1,  'Pengganti unit expired',         'SELESAI',  NOW() - INTERVAL '1 week');
