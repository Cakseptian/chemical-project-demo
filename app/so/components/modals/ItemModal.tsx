// app/so/components/modals/ItemModal.tsx
"use client";

import type { InventoryFormData } from "../../types";

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editId: number | null;
    formData: InventoryFormData;
    setFormData: (data: InventoryFormData) => void;
    isBulk: boolean;
    setIsBulk: (val: boolean) => void;
    uom: string;
    setUom: (val: string) => void;
    isSaving: boolean;
    onGenerateUUID: () => void;
}

const IconClose = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconDice = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

// Kelas input yang konsisten dengan design tokens
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all";
const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5";

export const ItemModal = ({
    isOpen,
    onClose,
    onSubmit,
    editId,
    formData,
    setFormData,
    isBulk,
    setIsBulk,
    uom,
    setUom,
    isSaving,
    onGenerateUUID,
}: ItemModalProps) => {
    if (!isOpen) return null;

    const handleKategoriChange = (val: string) => {
        if (val === "BULK") {
            setIsBulk(true);
            setUom("Liters");
        } else {
            setIsBulk(false);
            setUom("Pieces");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-navy-800 text-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-base tracking-tight">
                            {editId ? "Edit Item" : "Add New Item"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {editId ? "Ubah data master barang." : "Isi form untuk menambah item baru."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        aria-label="Tutup modal"
                    >
                        <IconClose />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto">
                    <form onSubmit={onSubmit} className="space-y-4">

                        {/* Item Name */}
                        <div>
                            <label className={labelClass}>Item Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.part_name}
                                onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                                className={inputClass}
                                placeholder="Contoh: Krytox Grease"
                            />
                        </div>

                        {/* Part Number + Stock */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Part Number</label>
                                <input
                                    type="text"
                                    value={formData.part_number}
                                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                                    className={inputClass}
                                    placeholder="Opsional"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{editId ? "Stok Saat Ini *" : "Stok Awal *"}</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className={inputClass}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Batch + Expired */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Batch Number</label>
                                <input
                                    type="text"
                                    value={formData.batch_number}
                                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                                    className={inputClass}
                                    placeholder="Contoh: BN-2024"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Expired Date</label>
                                <input
                                    type="date"
                                    value={formData.expired_date_fixed}
                                    onChange={(e) => setFormData({ ...formData, expired_date_fixed: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className={labelClass}>Lokasi / Laci</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className={inputClass}
                                placeholder="Contoh: DRAWER A"
                            />
                        </div>

                        {/* Document URL */}
                        <div>
                            <label className={labelClass}>Dokumen / Referensi Link</label>
                            <input
                                type="url"
                                value={formData.document_url}
                                onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                                className={inputClass}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Barcode ID */}
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-[0.15em] mb-1.5">
                                Barcode ID / UUID *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={formData.barcode_id}
                                    onChange={(e) => setFormData({ ...formData, barcode_id: e.target.value })}
                                    className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-navy-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Unique ID..."
                                />
                                <button
                                    type="button"
                                    onClick={onGenerateUUID}
                                    className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-navy-800 px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0"
                                >
                                    <IconDice />
                                    Gen
                                </button>
                            </div>
                        </div>

                        {/* Kategori */}
                        <div>
                            <label className={labelClass}>Kategori Barang</label>
                            <select
                                value={isBulk ? "BULK" : "UNIT"}
                                onChange={(e) => handleKategoriChange(e.target.value)}
                                className={inputClass}
                            >
                                <option value="UNIT">Barang Satuan (Botol / Pieces)</option>
                                <option value="BULK">Cairan Curah (Jirigen / Liters)</option>
                            </select>
                            <p className="mt-1.5 text-xs text-slate-400">
                                Satuan: <span className="font-semibold text-slate-600">{uom}</span>
                            </p>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-all text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-accent hover:bg-accent-dark text-navy-800 font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isSaving ? "Menyimpan..." : (editId ? "Update" : "Simpan")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
