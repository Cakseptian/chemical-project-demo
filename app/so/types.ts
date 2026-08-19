// app/so/types.ts
// ==========================================
// GMF Inventory Control System - Type Definitions
// Align dengan Supabase schema
// ==========================================

import type { TransactionType } from "@/lib/types/transactionTypes";

/**
 * Inventory Item - Data master barang
 * Table: inventory
 */
export interface InventoryItem {
  id: number;
  part_name: string;
  part_number?: string | null;
  location?: string | null;
  quantity: number | string; // Bisa number atau string dari DB
  barcode_id: string;
  expired_date_fixed?: string | null;
  batch_number?: string | null;
  is_bulk: boolean;
  uom: string;
  rack_type: string;
  alpha: number;        // SBA smoothing parameter (0.05-0.50)
  lead_time: number;    // Lead time dalam minggu
  created_at: string;
  last_so_at?: string | null;  // Timestamp terakhir stock opname / edit via inventory tab
  document_url?: string | null;
}

/**
 * Inventory Unit - One physical unit, identified by its own UUID
 * Table: inventory_units
 */
export interface InventoryUnit {
  id: string;           // UUID — encoded in each QR label
  inventory_id: number;
  printed_at: string;
  status: "available" | "loaned" | "consumed";
}

/**
 * Transaction Log - Riwayat transaksi
 * Table: transactions
 */
export interface TransactionLog {
  id: number;
  inventory_id: number;
  part_name: string;
  part_number?: string | null;
  nama_peminjam: string;
  nomor_pegawai?: string | null;
  jumlah: number;
  unit_id?: string | null; // UUID of physical unit (null for pre-migration loans)
  transaction_type: TransactionType;
  created_at: string;
}

/**
 * Item Request - Permintaan barang dari karyawan
 * Table: item_requests
 */
export interface ItemRequest {
  id: number;
  nama_peminjam: string;
  nama_barang: string;
  jumlah: number;
  keterangan?: string | null;
  status: "PENDING" | "SELESAI";
  created_at: string;
}

/**
 * Form Data untuk Add/Edit Inventory Modal
 */
export interface InventoryFormData {
  part_name: string;
  part_number: string;
  location: string;
  quantity: string;
  barcode_id: string;
  expired_date_fixed: string;
  batch_number: string;
  isBulk: boolean;
  uom: string;
  rack_type: string;
  document_url: string;
}

/**
 * Dashboard Statistics - Computed values untuk overview tab
 */
export interface DashboardStats {
  lowStockCount: number;
  pendingReqCount: number;
  totalBorrowings: number;
  topItems: [string, number][];
  topUsers: [string, number][];
  maxItemCount: number;
  maxUserCount: number;
}

/**
 * SBA Alert - Extended inventory item dengan forecast data
 * Returned oleh useSBAAlerts hook
 */
export interface SBAAlert extends InventoryItem {
  sbaLoan: number;
  sbaCons: number;
  crostonLoan: number;
  safetyStock: number;
  rop: number;
  status: string;
  color: string;
  action: string;
  alpha: number;
  leadTime: number;
  dataPoints: number;
  positivePeriods: number;
}

/**
 * Active loan for admin dashboard — one row per outstanding LOAN transaction
 * Joined with inventory_units and inventory
 */
export interface ActiveLoanAdmin {
  transaction_id: number;
  inventory_id: number;
  unit_id: string | null;
  part_name: string;
  part_number: string | null;
  nama_peminjam: string;
  nomor_pegawai: string | null;
  jumlah: number;
  created_at: string;
  days_out: number;
}
