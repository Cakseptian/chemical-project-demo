"use client";
import { useEffect } from "react";
import type { RequestFormData, RequestErrors } from "@/app/types";

// SVG Icons — consistent with InventoryTab style
const IconClose = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const IconWarning = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
);

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    reqData: RequestFormData;
    setReqData: (data: RequestFormData) => void;
    errors: RequestErrors;
    setErrors: (errors: RequestErrors) => void;
    isSubmittingReq: boolean;
    namaInputRef: React.RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
}

export const RequestModal = ({
    isOpen, onClose, reqData, setReqData, errors, setErrors,
    isSubmittingReq, namaInputRef, onSubmit,
}: RequestModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    const inputBase = "w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors outline-none focus:ring-2 focus:border-slate-400";
    const inputNormal = `${inputBase} border-slate-200 focus:ring-slate-900/10`;
    const inputError = `${inputBase} border-red-300 focus:ring-red-500/10 focus:border-red-400 bg-red-50/30`;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Request Item</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Ajukan barang yang kosong atau tidak tersedia</p>
                    </div>
                    <button type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                        aria-label="Tutup"
                    >
                        <IconClose />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* ── FORM BODY ────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" data-lenis-prevent>

                        {/* Nama Pemohon */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                                Nama Pemohon <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={namaInputRef}
                                type="text"
                                required
                                value={reqData.nama}
                                onChange={(e) => {
                                    setReqData({ ...reqData, nama: e.target.value });
                                    if (errors.nama) setErrors({ ...errors, nama: null });
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value.trim()) setErrors({ ...errors, nama: "Nama wajib diisi" });
                                }}
                                className={errors.nama ? inputError : inputNormal}
                                placeholder="Masukkan nama lengkap pemohon"
                                autoComplete="name"
                            />
                            {errors.nama && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <IconWarning /> {errors.nama}
                                </p>
                            )}
                        </div>

                        {/* Nama Barang */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={reqData.barang}
                                onChange={(e) => {
                                    setReqData({ ...reqData, barang: e.target.value });
                                    if (errors.barang) setErrors({ ...errors, barang: null });
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value.trim()) setErrors({ ...errors, barang: "Nama barang wajib diisi" });
                                }}
                                className={errors.barang ? inputError : inputNormal}
                                placeholder="Contoh: Araldite 2011, Santovac 5"
                            />
                            {errors.barang && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <IconWarning /> {errors.barang}
                                </p>
                            )}
                        </div>

                        {/* Jumlah */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                                Jumlah <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="999"
                                value={reqData.jumlah}
                                onChange={(e) => {
                                    setReqData({ ...reqData, jumlah: e.target.value });
                                    if (errors.jumlah) setErrors({ ...errors, jumlah: null });
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value || parseInt(e.target.value) < 1) setErrors({ ...errors, jumlah: "Jumlah minimal 1" });
                                }}
                                className={errors.jumlah ? inputError : inputNormal}
                                placeholder="1"
                                inputMode="numeric"
                            />
                            {errors.jumlah && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <IconWarning /> {errors.jumlah}
                                </p>
                            )}
                        </div>

                        {/* Keterangan */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                                Keterangan
                                <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={300}
                                value={reqData.keterangan}
                                onChange={(e) => setReqData({ ...reqData, keterangan: e.target.value })}
                                className={`${inputNormal} resize-none`}
                                placeholder="Detail tambahan: merk, UOM, kode part, dll."
                            />
                            <div className="flex justify-end mt-1">
                                <span className={`text-[10px] ${reqData.keterangan.length >= 270 ? "text-red-500" : "text-slate-400"}`}>
                                    {reqData.keterangan.length}/300
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── FOOTER ACTIONS ───────────────────────────────── */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmittingReq}
                            className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                        >
                            {isSubmittingReq ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Kirim Request"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
