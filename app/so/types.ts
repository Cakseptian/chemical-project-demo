// app/so/types.ts
// ==========================================
// GMF Inventory Control System - Type Definitions
// Align dengan Supabase schema
// ==========================================

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
  document_url?: string | null;
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