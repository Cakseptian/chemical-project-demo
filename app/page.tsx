"use client";

import { useState, useEffect, useRef } from "react";
import QRScanner from "@/components/QRScanner";
import { supabase } from "@/lib/supabase";

// Tipe data untuk item di dalam keranjang
type CartItem = {
  id: number;
  part_name: string;
  part_number: string;
  location: string;
  max_quantity: number;
  quantity_to_take: number | string;
  barcode_id: string;
  is_bulk: boolean;
  uom: string;
};

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // === STATE BARU: SISTEM KERANJANG (CART) ===
  const [cart, setCart] = useState<CartItem[]>([]);
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [nomorPegawai, setNomorPegawai] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved nama and nomor from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("gmf_nama");
    const savedId = localStorage.getItem("gmf_id");
    if (savedName) setNamaPeminjam(savedName);
    if (savedId) setNomorPegawai(savedId);
  }, []);

  // === STATE FITUR REQUEST BARANG ===
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqData, setReqData] = useState({ nama: "", barang: "", jumlah: "", keterangan: "" });
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [errors, setErrors] = useState<{ nama: string | null; barang: string | null; jumlah: string | null }>({
    nama: null,
    barang: null,
    jumlah: null
  });
  const namaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!showReqModal) return;
    const timer = setTimeout(() => {
      namaInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [showReqModal]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showReqModal) {
        setShowReqModal(false);
        setErrors({ nama: null, barang: null, jumlah: null });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showReqModal]);

  const handleCloseReqModal = () => {
    setShowReqModal(false);
    setErrors({ nama: null, barang: null, jumlah: null });
  };

  // === STATE BARU: FITUR PENGEMBALIAN BARANG ===
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [isFetchingLoans, setIsFetchingLoans] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  // === STATE BARU: FITUR PENCARIAN LOKASI ===
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryDb, setInventoryDb] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Fungsi membuka modal pencarian dan menarik data terbaru
  const openSearchModal = async () => {
    setShowSearchModal(true);
    setIsSearchingDb(true);
    setSearchQuery(""); // Reset pencarian
    try {
      const { data, error } = await supabase.from("inventory").select("*").order("part_name", { ascending: true });
      if (error) throw error;
      if (data) setInventoryDb(data);
    } catch (err) {
      console.error("Gagal menarik data untuk pencarian", err);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Filter data berdasarkan inputan pencarian
  const filteredItems = inventoryDb.filter(item =>
    item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.part_number && item.part_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // === 2. TIMPA FUNGSI INI (FITUR SCANNER WEB) ===
  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setIsLoading(true);
    setErrorMsg(null);

    // LOGIKA PENGUPAS URL SUPER CERDAS
    let finalBarcodeId = decodedText;
    
    try {
      // Coba kupas pakai standar URL browser
      if (decodedText.startsWith("http")) {
        const urlObj = new URL(decodedText);
        finalBarcodeId = urlObj.searchParams.get("scan") || decodedText;
      } else if (decodedText.includes("?scan=")) {
        finalBarcodeId = decodedText.split("?scan=")[1];
      }
    } catch (e) {
      // Kalau error pas ngupas, potong paksa
      if (decodedText.includes("?scan=")) {
        finalBarcodeId = decodedText.split("?scan=")[1];
      }
    }

    // === GANTI BAGIAN PEMBERSIHAN AKHIR JADI SEPERTI INI: ===
    
    // 1. Decode dulu jaga-jaga kalau ada karakter URL aneh kayak %20
    finalBarcodeId = decodeURIComponent(finalBarcodeId);
    
    // 2. PEMBERSIH BRUTAL: Buang SEMUA karakter kecuali Huruf, Angka, dan Strip (-)
    // Karena UUID buatan crypto.randomUUID() cuma berisi karakter itu aja.
    finalBarcodeId = finalBarcodeId.replace(/[^a-zA-Z0-9-]/g, "");

    console.log("ID Bersih yang dikirim ke Supabase:", finalBarcodeId); // Buat ngecek di Inspect Element

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("barcode_id", finalBarcodeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // TRIK DEWA: Kita munculin ID yang dibaca kamera ke layar biar ketahuan salahnya di mana!
        setErrorMsg(`Item tidak ditemukan. (ID Terbaca: "${finalBarcodeId}")`);
        return;
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === data.id);

        if (existingItem) {
          // Only increment for non-bulk items
          if (!existingItem.is_bulk && Number(existingItem.quantity_to_take) < existingItem.max_quantity) {
            return prevCart.map((item) =>
              item.id === data.id ? { ...item, quantity_to_take: Number(item.quantity_to_take) + 1 } : item
            );
          } else {
            if (!existingItem.is_bulk) {
              alert(`⚠️ Stok maksimal ${data.part_name} di sistem hanya ${existingItem.max_quantity} unit!`);
            }
            return prevCart;
          }
        } else {
          return [...prevCart, {
            id: data.id,
            part_name: data.part_name,
            part_number: data.part_number,
            location: data.location,
            max_quantity: Number(data.quantity),
            quantity_to_take: data.is_bulk ? "" : 1,
            barcode_id: data.barcode_id,
            is_bulk: data.is_bulk || false,
            uom: data.uom || "Pieces"
          }];
        }
      });

    } catch (err) {
      console.error("System error:", err);
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi database.");
    } finally {
      setIsLoading(false);
    }
  };

  // === 1. TIMPA USEFFECT INI (FITUR KAMERA HP BAWAAN) ===
  useEffect(() => {
    // Kita kasih jeda 300ms biar Next.js dan Supabase siap napas dulu
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const scannedBarcodeId = params.get("scan");

      if (scannedBarcodeId) {
        // Bersihkan ID pakai logika yang sama dengan scanner web
        let cleanId = scannedBarcodeId;
        
        // 1. Decode dulu jaga-jaga kalau ada karakter URL aneh kayak %20
        cleanId = decodeURIComponent(cleanId);
        
        // 2. PEMBERSIH BRUTAL: Buang SEMUA karakter kecuali Huruf, Angka, dan Strip (-)
        cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, "");

        console.log("ID Bersih dari URL Param:", cleanId);
        
        handleScanSuccess(cleanId);
        
        // Hapus tulisan ?scan= dari URL bar biar gak dobel pas di-refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const updateQuantity = (id: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = Number(item.quantity_to_take) + delta;
        if (newQty > 0 && newQty <= item.max_quantity) {
          return { ...item, quantity_to_take: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateBulkQty = (id: number, val: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.id === id ? { ...item, quantity_to_take: val } : item
    ));
  };

  const handleProsesAmbil = async () => {
    if (!namaPeminjam.trim() || !nomorPegawai.trim()) return alert("⚠️ Nama dan Nomor Pegawai wajib diisi!");
    if (cart.length === 0) return alert("⚠️ Keranjang masih kosong!");

    setIsSubmitting(true);

    try {
      for (const item of cart) {
        const qtyToTake = Number(item.quantity_to_take);
        const sisaStokBaru = (item.max_quantity - qtyToTake).toString();
        const { error: errorUpdate } = await supabase
          .from("inventory")
          .update({ quantity: sisaStokBaru })
          .eq("id", item.id);

        if (errorUpdate) throw errorUpdate;

        const statusTransaksi = item.is_bulk ? "CONSUMED_BULK" : "LOAN";
        const { error: errorInsert } = await supabase
          .from("transactions")
          .insert([{
            inventory_id: item.id,
            part_name: item.part_name,
            part_number: item.part_number,
            nama_peminjam: namaPeminjam,
            nomor_pegawai: nomorPegawai,
            jumlah: -qtyToTake,
            transaction_type: statusTransaksi
          }]);

        if (errorInsert) throw errorInsert;
      }

      alert(`✅ BERHASIL!\n\n${cart.length} jenis barang telah diproses.`);
      // Save to localStorage for next time
      localStorage.setItem("gmf_nama", namaPeminjam);
      localStorage.setItem("gmf_id", nomorPegawai);
      setCart([]);

    } catch (err) {
      console.error("Gagal update database:", err);
      alert("❌ Terjadi kesalahan saat memotong stok di database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const newErrors: { nama: string | null; barang: string | null; jumlah: string | null } = {
      nama: null,
      barang: null,
      jumlah: null
    };

    if (!reqData.nama.trim()) {
      newErrors.nama = "Nama wajib diisi";
      hasError = true;
    }
    if (!reqData.barang.trim()) {
      newErrors.barang = "Nama barang wajib diisi";
      hasError = true;
    }
    if (!reqData.jumlah || Number(reqData.jumlah) < 1) {
      newErrors.jumlah = "Jumlah minimal 1";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmittingReq(true);
    try {
      const { error } = await supabase.from("item_requests").insert([{
        nama_peminjam: reqData.nama,
        nama_barang: reqData.barang,
        jumlah: Number(reqData.jumlah),
        keterangan: reqData.keterangan || "-"
      }]);
      if (error) throw error;

      alert("✅ Request berhasil dicatat sistem!");
      handleCloseReqModal();
      setReqData({ nama: "", barang: "", jumlah: "", keterangan: "" });
    } catch (err) {
      console.error("Gagal mengirim request:", err);
      alert("❌ Gagal mengirim request. Coba lagi.");
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // === FUNGSI FETCH PINJAMAN AKTIF ===
  const fetchActiveLoans = async () => {
    if (!nomorPegawai.trim()) return alert("⚠️ Silakan masukkan Employee ID terlebih dahulu!");

    setIsFetchingLoans(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("nomor_pegawai", nomorPegawai)
        .eq("transaction_type", "LOAN")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActiveLoans(data || []);
      setShowReturnModal(true);
    } catch (err) {
      console.error("Gagal mengambil data pinjaman:", err);
      alert("❌ Gagal mengambil data pinjaman.");
    } finally {
      setIsFetchingLoans(false);
    }
  };

  // === FUNGSI PROSES PENGEMBALIAN ===
  const handleProsesReturn = async (transactionId: number, inventoryId: number, statusAkhir: "HABIS" | "SISA") => {
    if (isReturning) return;
    setIsReturning(true);

    try {
      // Update transaction type
      const newTransactionType = statusAkhir === "HABIS" ? "RETURN_HABIS" : "RETURN_SISA";
      const { error: txError } = await supabase
        .from("transactions")
        .update({ transaction_type: newTransactionType })
        .eq("id", transactionId);

      if (txError) throw txError;

      // If status is SISA, update inventory rack_type to USED
      if (statusAkhir === "SISA") {
        const { error: invError } = await supabase
          .from("inventory")
          .update({ rack_type: "USED" })
          .eq("id", inventoryId);

        if (invError) throw invError;
      }

      // Remove item from local state
      setActiveLoans(prevLoans => prevLoans.filter(loan => loan.id !== transactionId));
      alert("✅ Pengembalian berhasil dicatat!");
    } catch (err) {
      console.error("Gagal memproses pengembalian:", err);
      alert("❌ Gagal memproses pengembalian.");
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fbfa] font-sans text-slate-900 pb-20">
      {/* HEADER (STAYS NOTION STYLE) */}
      <header className="bg-[#001e2b] text-white shadow-lg shadow-black/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3">
            
            {/* ===== BRANDING ===== */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#00ed64]/10 border border-[#00ed64]/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00ed64]/5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ed64]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-white truncate">
                  GMF Inventory
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-white/50 mt-1 truncate">
                  Self-Service Item Request
                </p>
              </div>
            </div>

            {/* ===== ADMIN BUTTON ===== */}
            <a 
              href="/so" 
              className="group flex items-center gap-2 bg-[#00ed64] hover:bg-[#00b545] active:bg-[#009d3c] px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#00ed64]/20 text-[#001e2b] focus:outline-none focus:ring-2 focus:ring-[#00ed64] focus:ring-offset-2 focus:ring-offset-[#001e2b]"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Admin</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-12">
        <div className="w-full max-w-md mx-auto">

          {/* TAMPILAN AWAL (STANDBY & KERANJANG KOSONG) */}
          {!isScanning && !isLoading && cart.length === 0 && !errorMsg && (
            <div className="bg-white p-12 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 text-center group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-24 h-24 bg-[#e3fcef] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 border border-[#c3f0d2]">
                <img src="/icons/icons8-cameraColored-100.png" alt="Camera" className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Scan Item</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-10">Scan QR code item to add it to your cart.</p>

              <button
                onClick={() => setIsScanning(true)}
                className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-5 px-6 rounded-full shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95 flex justify-center items-center gap-3 text-lg"
              >
                START SCANNING
              </button>

              <div className="space-y-3 pt-8 mt-8 border-t border-slate-100">
                <button
                  onClick={fetchActiveLoans}
                  disabled={!nomorPegawai.trim()}
                  title={!nomorPegawai.trim() ? "Isi Employee ID dulu" : "Proses pengembalian barang"}
                  className={`group w-full flex items-center gap-4 p-4 rounded-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ed64] ${
                    !nomorPegawai.trim()
                      ? "bg-slate-50 border border-slate-200 cursor-not-allowed"
                      : "bg-white border border-slate-200 hover:border-[#00ed64] hover:shadow-md active:scale-[0.99]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !nomorPegawai.trim() ? "bg-slate-200 text-slate-400" : "bg-[#e3fcef] text-[#00684a]"
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${!nomorPegawai.trim() ? "text-slate-400" : "text-[#001e2b]"}`}>
                      Return Item
                    </p>
                    <p className={`text-xs mt-0.5 ${!nomorPegawai.trim() ? "text-slate-400" : "text-slate-500"}`}>
                      Tandai SISA atau HABIS
                    </p>
                  </div>
                  <svg className={`w-5 h-5 ${!nomorPegawai.trim() ? "text-slate-300" : "text-slate-400 group-hover:text-[#00ed64] group-hover:translate-x-0.5 transition-all"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <button
                  onClick={openSearchModal}
                  className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#00ed64] hover:shadow-md active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ed64]"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#e3fcef] text-[#00684a]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-[#001e2b]">Check Location</p>
                    <p className="text-xs text-slate-500 mt-0.5">Lihat lokasi rak & stok</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#00ed64] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowReqModal(true)}
                  className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#00ed64] hover:shadow-md active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ed64]"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#e3fcef] text-[#00684a]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-[#001e2b]">Request</p>
                    <p className="text-xs text-slate-500 mt-0.5">Barang kosong? ajukan</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#00ed64] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* TAMPILAN SCANNING */}
          {isScanning && (
            <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-300">
              <div className="mb-6">
                <h3 className="font-black text-slate-900 text-lg">Scanning Active</h3>
                <p className="text-sm text-slate-500">Point camera at QR Code item</p>
              </div>
              <div className="rounded-xl overflow-hidden shadow-inner border border-slate-100">
                <QRScanner onScanSuccess={handleScanSuccess} />
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-4 rounded-full border border-slate-200 transition-all"
                >
                  {cart.length > 0 ? "Finish Scanning" : "Cancel Scanning"}
                </button>
              </div>
            </div>
          )}

          {/* TAMPILAN LOADING */}
          {isLoading && (
            <div className="bg-white p-24 rounded-xl shadow-xl border border-slate-200 text-center animate-in fade-in duration-300">
              <div className="animate-spin w-12 h-12 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Mencari data...</p>
            </div>
          )}

          {/* TAMPILAN ERROR */}
          {errorMsg && !isLoading && (
            <div className="bg-white p-12 rounded-xl shadow-xl border border-red-100 text-center animate-in shake duration-500">
              <div className="text-6xl mb-6">⚠️</div>
              <h3 className="text-xl font-black text-red-600 mb-3">Failed to Read QR Code</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">{errorMsg}</p>
              <div className="space-y-3">
                <button onClick={() => { setErrorMsg(null); setIsScanning(true); }} className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-4 rounded-full shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all">
                  Retry Scanning
                </button>
                <button onClick={() => setErrorMsg(null)} className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 text-sm transition-all">
                  Cancel Scanning
                </button>
              </div>
            </div>
          )}

          {/* TAMPILAN KERANJANG (CART) */}
          {cart.length > 0 && !isScanning && !isLoading && !errorMsg && (
            <div className="bg-white rounded-xl shadow-2xl shadow-slate-200 border border-slate-300 overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="bg-[#001e2b] p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ed64]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#00ed64]/15 text-[#00ed64] rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  🛒 Item Request Cart
                </span>
                <h2 className="text-3xl font-black tracking-tight">{cart.length} Item</h2>
                <p className="text-slate-400 text-sm mt-2">Ready to process.</p>
              </div>

              <div className="p-6 md:p-8 bg-slate-50/50">
                <div className="space-y-4 mb-8">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{item.part_name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Available Stock: <span className="font-bold text-slate-700">{item.max_quantity}</span></p>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.is_bulk ? (
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden px-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.quantity_to_take}
                              onChange={(e) => updateBulkQty(item.id, e.target.value)}
                              className="w-16 h-8 text-center font-bold text-slate-800 bg-transparent outline-none text-sm"
                              placeholder="0.0"
                            />
                            <span className="text-xs font-black text-slate-400 mr-2">{item.uom}</span>
                          </div>
                        ) : (
                          <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors">-</button>
                            <span className="w-6 text-center font-black text-slate-800 text-sm">{item.quantity_to_take}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors">+</button>
                          </div>
                        )}
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full bg-white border-2 border-dashed border-[#00ed64]/40 hover:border-[#00ed64] text-[#00684a] font-bold py-4 rounded-full mb-8 flex items-center justify-center gap-2 transition-all hover:bg-[#e3fcef]"
                >
                  <span className="text-xl">📷</span> Add More Items
                </button>

                <div className="pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Employee ID *</label>
                      <input
                        type="text"
                        value={nomorPegawai}
                        onChange={(e) => setNomorPegawai(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 focus:border-[#00ed64] rounded-lg p-4 text-sm font-bold text-slate-900 outline-none transition-all shadow-sm"
                        placeholder="Employee ID"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Name *</label>
                      <input
                        type="text"
                        value={namaPeminjam}
                        onChange={(e) => setNamaPeminjam(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 focus:border-[#00ed64] rounded-lg p-4 text-sm font-bold text-slate-900 outline-none transition-all shadow-sm"
                        placeholder="Nama..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setCart([])} disabled={isSubmitting} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 py-5 rounded-full font-bold transition-all">
                      Reset Cart
                    </button>
                    <button onClick={handleProsesAmbil} disabled={isSubmitting} className="flex-[2] bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-5 rounded-full shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center text-sm">
                      {isSubmitting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : "SUBMIT ALL"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PENCARIAN LOKASI BARANG */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300 border border-white/20">

            {/* Header Modal Search */}
            <div className="p-6 border-b border-slate-100 bg-[#001e2b] text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-black text-xl tracking-tight">Katalog Barang</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Cari Posisi Rak & Stok</p>
              </div>
              <button onClick={() => setShowSearchModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-xl font-light">
                ✕
              </button>
            </div>

            {/* Input Pencarian */}
            <div className="p-6 bg-slate-50 shrink-0 shadow-sm z-10">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 focus:border-[#00ed64] rounded-lg py-4 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none shadow-sm"
                  placeholder="Ketik nama part atau part number..."
                  autoFocus
                />
              </div>
            </div>

            {/* Hasil Pencarian (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              {isSearchingDb ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#00ed64] rounded-full mb-4"></div>
                  <p className="text-xs font-bold uppercase tracking-widest">Memuat Katalog...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="pr-4">
                            <h3 className="font-black text-slate-800 leading-tight">{item.part_name}</h3>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">{item.part_number || "No PN"}</p>
                          </div>
                          <div className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.quantity > 0 ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                            }`}>
                            {item.quantity > 0 ? `${item.quantity} Tersedia` : "Kosong"}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 border border-slate-100">
                          <div className="w-8 h-8 bg-[#e3fcef] text-[#00684a] rounded-lg flex items-center justify-center shrink-0 border border-[#c3f0d2]">📍</div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lokasi Laci / Rak</p>
                            <p className="text-sm font-bold text-slate-800">{item.location || "Belum Ditentukan"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-4 opacity-50">🤷‍♂️</div>
                      <p className="text-slate-500 font-bold text-sm">Barang tidak ditemukan.</p>
                      <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau ajukan request.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PENGEMBALIAN BARANG */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#001e2b] text-white">
              <div>
                <h2 className="font-black text-xl tracking-tight">Return Item</h2>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Return borrowed items</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white/80 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              {isFetchingLoans ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#00ed64] rounded-full mb-4"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat pinjaman...</p>
                </div>
              ) : activeLoans.length > 0 ? (
                <div className="space-y-4">
                  {activeLoans.map((loan) => (
                    <div key={loan.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-4">
                          <h3 className="font-black text-slate-800 leading-tight">{loan.part_name}</h3>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">{loan.part_number || "No PN"}</p>
                        </div>
                        <div className="shrink-0 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                          Dipinjam: {Math.abs(loan.jumlah)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleProsesReturn(loan.id, loan.inventory_id, "SISA")} 
                          disabled={isReturning}
                          className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-3 rounded-full transition-all text-sm disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,237,100,0.25)]"
                        >
                          KEMBALIKAN (SISA)
                        </button>
                        <button 
                          onClick={() => handleProsesReturn(loan.id, loan.inventory_id, "HABIS")} 
                          disabled={isReturning}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-full transition-all text-sm disabled:opacity-50"
                        >
                          DIBUANG (HABIS)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4 opacity-50">🎉</div>
                  <p className="text-slate-500 font-bold text-sm">Tidak ada barang yang sedang Anda pinjam.</p>
                  <p className="text-xs text-slate-400 mt-1">Semua barang sudah dikembalikan!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST BARANG */}
      {showReqModal && (
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300"
        onClick={handleCloseReqModal}
      >
        <div 
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* ===== HEADER ===== */}
          <div className="px-5 pt-5 pb-5 bg-[#001e2b] text-white relative flex-shrink-0">
            <button 
              onClick={handleCloseReqModal} 
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3 pr-10">
              <div className="w-11 h-11 bg-[#00ed64] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00ed64]/20">
                <svg className="w-6 h-6 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight">Request Item</h2>
                <p className="text-xs text-white/60 font-medium mt-0.5">Ajukan barang yang sedang kosong</p>
              </div>
            </div>
          </div>

          {/* ===== FORM ===== */}
          <form onSubmit={handleSubmitRequest} className="flex flex-col flex-1 overflow-hidden">
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                
                {/* Requester Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
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
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none ${
                      errors.nama
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30"
                        : "border-slate-200 focus:bg-white focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                    }`} 
                    placeholder="Masukkan nama lengkap" 
                    autoComplete="name"
                  />
                  {errors.nama && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.nama}
                    </p>
                  )}
                </div>

                {/* Item Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
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
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none ${
                      errors.barang
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30"
                        : "border-slate-200 focus:bg-white focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                    }`} 
                    placeholder="Contoh: Santovac 5, Masker Medis" 
                  />
                  {errors.barang && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.barang}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM6 7.5h12M6 7.5l-1.5-3H4.5m1.5 3L4.5 4.5m1.5 3L7.5 4.5M18 7.5l1.5-3h.008" />
                    </svg>
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
                      if (!e.target.value || parseInt(e.target.value) < 1) {
                        setErrors({ ...errors, jumlah: "Jumlah minimal 1" });
                      }
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none ${
                      errors.jumlah
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30"
                        : "border-slate-200 focus:bg-white focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10"
                    }`} 
                    placeholder="1" 
                    inputMode="numeric"
                  />
                  {errors.jumlah && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.jumlah}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    Keterangan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea 
                    rows={3} 
                    maxLength={300}
                    value={reqData.keterangan} 
                    onChange={(e) => setReqData({ ...reqData, keterangan: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#00ed64] focus:ring-4 focus:ring-[#00ed64]/10 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none resize-none" 
                    placeholder="Tulis detail tambahan jika diperlukan..." 
                  />
                  <div className="flex justify-end mt-1.5">
                    <span className={`text-[10px] font-bold ${reqData.keterangan.length >= 270 ? 'text-red-500' : 'text-slate-400'}`}>
                      {reqData.keterangan.length}/300
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== ACTION BUTTONS - Sticky Bottom ===== */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 space-y-2.5 sm:space-y-0 sm:flex sm:gap-3 flex-shrink-0">
              <button 
                type="button" 
                onClick={handleCloseReqModal} 
                className="w-full sm:flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingReq} 
                className="w-full sm:flex-1 bg-[#00ed64] hover:bg-[#00b545] active:bg-[#009d3c] text-[#001e2b] font-black py-3.5 rounded-xl shadow-lg shadow-[#00ed64]/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm transition-all"
              >
                {isSubmittingReq ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    <span>Kirim Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}
