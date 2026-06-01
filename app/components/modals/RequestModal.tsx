"use client";
import type { RequestFormData, RequestErrors } from "@/app/types";

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 bg-[#001e2b] text-white relative flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 pr-8">
                        <div className="w-10 h-10 bg-[#00ed64] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00ed64]/10">
                            <svg className="w-5 h-5 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-extrabold text-lg tracking-tight">Request Item</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ajukan Barang yang Kosong</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors text-xl font-light focus:outline-none">✕</button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                                Nama Pemohon <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={namaInputRef}
                                type="text"
                                required
                                value={reqData.nama}
                                onChange={(e) => { setReqData({ ...reqData, nama: e.target.value }); if (errors.nama) setErrors({ ...errors, nama: null }); }}
                                onBlur={(e) => { if (!e.target.value.trim()) setErrors({ ...errors, nama: "Nama wajib diisi" }); }}
                                className={`w-full bg-white border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all outline-none shadow-sm ${errors.nama ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30" : "border-slate-200 focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                                    }`}
                                placeholder="Masukkan nama lengkap pemohon"
                                autoComplete="name"
                            />
                            {errors.nama && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">⚠️ {errors.nama}</p>}
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={reqData.barang}
                                onChange={(e) => { setReqData({ ...reqData, barang: e.target.value }); if (errors.barang) setErrors({ ...errors, barang: null }); }}
                                onBlur={(e) => { if (!e.target.value.trim()) setErrors({ ...errors, barang: "Nama barang wajib diisi" }); }}
                                className={`w-full bg-white border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all outline-none shadow-sm ${errors.barang ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30" : "border-slate-200 focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                                    }`}
                                placeholder="Contoh: Araldite 2011, Santovac 5"
                            />
                            {errors.barang && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">⚠️ {errors.barang}</p>}
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                                Jumlah <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="999"
                                value={reqData.jumlah}
                                onChange={(e) => { setReqData({ ...reqData, jumlah: e.target.value }); if (errors.jumlah) setErrors({ ...errors, jumlah: null }); }}
                                onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) setErrors({ ...errors, jumlah: "Jumlah minimal 1" }); }}
                                className={`w-full bg-white border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all outline-none shadow-sm ${errors.jumlah ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30" : "border-slate-200 focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                                    }`}
                                placeholder="1"
                                inputMode="numeric"
                            />
                            {errors.jumlah && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">⚠️ {errors.jumlah}</p>}
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                                Keterangan <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={300}
                                value={reqData.keterangan}
                                onChange={(e) => setReqData({ ...reqData, keterangan: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all outline-none resize-none shadow-sm"
                                placeholder="Tulis detail tambahan, merk, uom, dll jika diperlukan..."
                            />
                            <div className="flex justify-end mt-1">
                                <span className={`text-[10px] font-bold ${reqData.keterangan.length >= 270 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {reqData.keterangan.length}/300
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 py-3.5 rounded-xl font-bold text-xs transition-all focus:outline-none">Batal</button>
                        <button type="submit" disabled={isSubmittingReq} className="flex-[2] bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-3.5 rounded-xl shadow-lg shadow-[#00ed64]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs transition-all focus:outline-none">
                            {isSubmittingReq ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#001e2b] border-t-transparent"></div> : "KIRIM REQUEST"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};