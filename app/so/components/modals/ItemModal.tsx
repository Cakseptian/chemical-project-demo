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

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-8 border-b border-slate-100 bg-[#001e2b] text-white flex justify-between items-center">
                    <div>
                        <h2 className="font-black text-xl tracking-tight">{editId ? "Update Barang" : "Add New Item"}</h2>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {editId ? "Lakukan perubahan pada data master." : "Complete the form to add a new item."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.part_name}
                                onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                placeholder="Example: Krytox Grease"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    Part Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.part_number}
                                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    {editId ? "Current Stock *" : "Initial Stock *"}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    Batch Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.batch_number}
                                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                    placeholder="Example: BN-2024"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    Expired Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expired_date}
                                    onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Location / Drawer
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                placeholder="Example: DRAWER A"
                            />
                        </div>

                        <div className="p-5 bg-[#e3fcef] rounded-xl border border-[#c3f0d2]">
                            <label className="block text-[10px] font-black text-[#00684a] uppercase tracking-[0.2em] mb-2">
                                Barcode ID / UUID *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={formData.barcode_id}
                                    onChange={(e) => setFormData({ ...formData, barcode_id: e.target.value })}
                                    className="flex-1 bg-white border border-[#00ed64]/40 rounded-lg p-3 text-xs font-mono font-bold text-[#001e2b] focus:ring-2 focus:ring-[#00ed64] outline-none"
                                    placeholder="Unique ID..."
                                />
                                <button
                                    type="button"
                                    onClick={onGenerateUUID}
                                    className="bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_0_1px_rgba(0,237,100,0.25)] shrink-0 active:scale-95"
                                >
                                    Gen
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Kategori Barang
                            </label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "BULK") {
                                        setIsBulk(true);
                                        setUom("Liters");
                                    } else {
                                        setIsBulk(false);
                                        setUom("Pieces");
                                    }
                                }}
                            >
                                <option value="UNIT">Barang Satuan (Botol/Pieces)</option>
                                <option value="BULK">Cairan Curah (Jirigen/Liters)</option>
                            </select>
                        </div>

                        <div className="mb-4 text-sm text-slate-500">
                            Satuan yang digunakan sistem: <span className="font-bold">{uom}</span>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold py-4 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-4 rounded-xl shadow-[0_0_0_1px_rgba(0,237,100,0.25)] disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isSaving ? "Saving..." : (editId ? "UPDATE" : "SAVE")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};