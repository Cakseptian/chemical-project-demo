// types/index.ts
// ==========================================
// GMF Inventory Control System - Type Definitions
// ==========================================

/**
 * Inventory Item - Data master barang
 * Align dengan schema Supabase `inventory` table
 */
export interface InventoryItem {
  id: number;
  part_name: string;
  part_number?: string | null;
  location?: string | null;
  quantity: number | string; // Bisa number atau string dari DB
  barcode_id: string;
  expired_date?: string | null;
  batch_number?: string | null;
  is_bulk: boolean;
  uom: string;
  rack_type: string;
  alpha: number;        // 🆕 SBA smoothing parameter
  lead_time: number;    // 🆕 Lead time dalam minggu
  created_at: string;
}

/**
 * Transaction Log - Riwayat transaksi
 * Align dengan schema Supabase `transactions` table
 */
export interface TransactionLog {
  id: number;
  inventory_id: number;
  part_name: string;
  part_number?: string | null;
  nama_peminjam: string;
  nomor_pegawai?: string | null;
  jumlah: number;
  transaction_type: 
    | "LOAN" 
    | "RETURN" 
    | "CONSUMED_BULK" 
    | "RETURN_HABIS" 
    | "LOST"
    | "ADMIN_SO";
  created_at: string;
}

/**
 * Item Request - Permintaan barang dari karyawan
 * Align dengan schema Supabase `item_requests` table
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
  expired_date: string;
  batch_number: string;
  isBulk: boolean;
  uom: string;
  rack_type: string;
}

/**
 * Dashboard Statistics - Computed values untuk overview
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
 * SBA Result - Output dari calculateSBA function
 * (sudah di-define juga di sbaCalculator.ts, re-export untuk convenience)
 */
export interface SBAResult {
  forecast: number;
  croston: number;
  z: number;
  p: number;
  alpha: number;
  dataPoints: number;
  positivePeriods: number;
}