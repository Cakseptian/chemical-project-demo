// app/types.ts
export interface CartItem {
    id: number;
    part_name: string;
    part_number: string;
    location: string;
    max_quantity: number;
    quantity_to_take: number | string;
    barcode_id: string;
    is_bulk: boolean;
    uom: string;
}

export interface RequestFormData {
    nama: string;
    barang: string;
    jumlah: string;
    keterangan: string;
}

export interface RequestErrors {
    nama: string | null;
    barang: string | null;
    jumlah: string | null;
}

export interface ActiveLoan {
    id: number;
    inventory_id: number;
    part_name: string;
    part_number?: string | null;
    jumlah: number;
    created_at: string;
}

export interface TeamActivity {
    id: number;
    nama_peminjam: string;
    part_name: string;
    jumlah: number;
    transaction_type: string;
    created_at: string;
}

export interface InventoryItemPublic {
    id: number;
    part_name: string;
    part_number?: string | null;
    location?: string | null;
    quantity: number | string;
}