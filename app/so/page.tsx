"use client";

import { useState, useEffect, useMemo } from "react";
import QRScanner from "@/components/QRScanner";
import { supabase } from "@/lib/supabase";
import { 
  calculateSBA, 
  calculateSafetyStock, 
  calculateROP 
} from "@/lib/sbaCalculator";

import type {
  InventoryItem,
  TransactionLog,
  ItemRequest,
  InventoryFormData,
  DashboardStats,
  SBAAlert
} from "@/types";

export default function AdminDashboard() {
  // State Keamanan (PIN)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const PIN_RAHASIA = "123456";
  const [showPin, setShowPin] = useState(false);
  const [isWrongPin, setIsWrongPin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // State Navigasi Layout & Sidebar
  const [activeTab, setActiveTab] = useState("dashboard"); // Default ke Dashboard kosong
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Tab 1: Scanner (SO)
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [itemData, setItemData] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stokFisik, setStokFisik] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Tab 2, 3, 4: Data Master, History, Requests
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // State baru untuk pencarian
  const [historyList, setHistoryList] = useState<TransactionLog[]>([]);
  const [requestList, setRequestList] = useState<ItemRequest[]>([]); // State baru untuk request
  const [isLoadingData, setIsLoadingData] = useState(false);

  // === LOGIKA STATISTIK DASHBOARD ===
  const dashboardStats: DashboardStats = useMemo(() => {
    const lowStockCount = inventoryList.filter(item => Number(item.quantity) <= 5).length;
    const pendingReqCount = requestList.filter(req => req.status === "PENDING").length;
    const actualBorrowings = historyList.filter(log => log.nama_peminjam !== "ADMIN (SO)" && log.jumlah > 0);

    const itemFreq: Record<string, number> = {};
    actualBorrowings.forEach(log => { itemFreq[log.part_name] = (itemFreq[log.part_name] || 0) + log.jumlah; });
    const topItems = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxItemCount = topItems.length > 0 ? topItems[0][1] : 1;

    // LOGIKA BARU: Grouping pakai NIK
    const userFreq: Record<string, number> = {};
    actualBorrowings.forEach(log => {
      // Gabungkan Nama dan NIK sebagai kunci biar terbaca jelas di grafik
      // Jika NIK kosong (data lama), pakai namanya saja
      const userKey = log.nomor_pegawai ? `${log.nama_peminjam} (${log.nomor_pegawai})` : log.nama_peminjam;
      userFreq[userKey] = (userFreq[userKey] || 0) + 1;
    });
    const topUsers = Object.entries(userFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxUserCount = topUsers.length > 0 ? topUsers[0][1] : 1;

    return { lowStockCount, pendingReqCount, topItems, maxItemCount, topUsers, maxUserCount, totalBorrowings: actualBorrowings.length };
  }, [inventoryList, historyList, requestList]);

  const sbaAlerts: SBAAlert[] = useMemo(() => {
  const now = new Date();
  
  const alerts = inventoryList.map(item => {
    const itemLogs = historyList.filter(log => log.inventory_id === item.id);
    
    // Ambil parameter SBA dari database (fallback ke default jika null)
    const alpha = item.alpha ?? 0.30;
    const leadTime = item.lead_time ?? 2;
    
    // === AGREGASI MINGGUAN (21 minggu ke belakang = ~5 bulan) ===
    const weeksToAnalyze = 21;
    const weeklyLoan: number[] = Array(weeksToAnalyze).fill(0);
    const weeklyCons: number[] = Array(weeksToAnalyze).fill(0);
    
    itemLogs.forEach(log => {
      const logDate = new Date(log.created_at);
      const diffTime = Math.abs(now.getTime() - logDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekIndex = weeksToAnalyze - 1 - Math.floor(diffDays / 7);
      
      
      if (weekIndex >= 0 && weekIndex < weeksToAnalyze) {
        const qty = Math.abs(log.jumlah);
        
        // Klasifikasi transaction type (tanpa trailing space!)
        if (
          log.transaction_type === "CONSUMED_BULK" || 
          log.transaction_type === "RETURN_HABIS" || 
          log.transaction_type === "LOST"
        ) {
          weeklyCons[weekIndex] += qty;
        } else if (log.transaction_type === "LOAN") {
          weeklyLoan[weekIndex] += qty;
        }
      }
    });
    
    // === SBA CALCULATION (Syntetos-Boylan Approximation) ===
    const sbaLoan = calculateSBA(weeklyLoan, alpha);
    const sbaCons = calculateSBA(weeklyCons, alpha);
    
    // Safety Stock = ROUNDUP(Forecast_Loan × 1.5, 0) - align dengan Excel
    const safetyStock = calculateSafetyStock(sbaLoan.forecast, 1.5);
    
    // Reorder Point = (Forecast_Cons × LeadTime) + SafetyStock
    const rop = calculateROP(sbaCons.forecast, leadTime, safetyStock);
    
    const currentStock = Number(item.quantity);
    
    // === STATUS LOGIC ===
    let status = "🟢 AMAN";
    let color = "text-green-400 bg-green-500/10 border-green-500/20";
    let action = "Stok mencukupi";
    
    if (currentStock <= rop) {
      status = "🔴 REORDER";
      color = "text-red-400 bg-red-500/10 border-red-500/20";
      action = `Beli ke supplier! (ROP: ${rop})`;
    } else if (currentStock <= safetyStock) {
      status = "🟡 REFILL LOKET";
      color = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      action = "Pindah barang ke Rak 1";
    }
    
    return {
      ...item,
      sbaLoan: sbaLoan.forecast,
      sbaCons: sbaCons.forecast,
      crostonLoan: sbaLoan.croston,
      safetyStock,
      rop,
      status,
      color,
      action,
      alpha,
      leadTime,
      dataPoints: sbaLoan.dataPoints,
      positivePeriods: sbaLoan.positivePeriods
    } as SBAAlert;
  });

  // Sort: REORDER → REFILL → AMAN
  return alerts.sort((a, b) => {
    const priority = (status: string) => {
      if (status.includes("REORDER")) return 0;
      if (status.includes("REFILL")) return 1;
      return 2;
    };
    return priority(a.status) - priority(b.status);
  });
}, [inventoryList, historyList]);

  // State Modal (Tambah & Edit)
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isBulk, setIsBulk] = useState<boolean>(false);
  const [uom, setUom] = useState<string>("Pieces");
  const [formData, setFormData] = useState<InventoryFormData>({
    part_name: "",
    part_number: "",
    location: "",
    quantity: "",
    barcode_id: "",
    expired_date: "",
    batch_number: "",
    isBulk: false,
    uom: "Pieces",
    rack_type: "NEW",
  });

  // --- FUNGSI LOGIN ---
  useEffect(() => {
    const isLogin = sessionStorage.getItem("gmf_admin_auth");
    if (isLogin === "true") setIsAuthenticated(true);
  }, []);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 6) {
      setIsWrongPin(true);
      setTimeout(() => setIsWrongPin(false), 500);
      return;
    }

    setIsLoginLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (pinInput === PIN_RAHASIA) {
      setIsAuthenticated(true);
      sessionStorage.setItem("gmf_admin_auth", "true");
      setIsWrongPin(false);
    } else {
      setIsWrongPin(true);
      setTimeout(() => setIsWrongPin(false), 800);
      setPinInput("");
    }
    setIsLoginLoading(false);
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("gmf_admin_auth"); // Hapus kunci dari brankas
    setPinInput("");
    setIsWrongPin(false);
    setShowPin(false);
    setIsLoginLoading(false);
  };

  // --- FUNGSI AMBIL DATA TABEL ---
  useEffect(() => {
    // Watermark Console (Hanya terlihat oleh Developer yang Inspect Element)
    console.info(
      "%c🚀 GMF Inventory Control System\n%cArchitected & Engineered by Septian Rizqi Arifandi (Industrial Engineering)\n%cOriginal Source: https://github.com/septianshft/StockOpnameProject_GMF.git",
      "color: #2563eb; font-size: 20px; font-weight: 900;",
      "color: #475569; font-size: 14px; font-weight: bold; margin-top: 5px;",
      "color: #64748b; font-size: 12px; margin-top: 10px;"
    );
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInventory();
      fetchHistory();
      fetchRequests();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "inventory") fetchInventory();
      if (activeTab === "history") fetchHistory();
      if (activeTab === "requests") fetchRequests();
    }
  }, [activeTab, isAuthenticated]);

  const fetchInventory = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase.from("inventory").select("*").order("part_name", { ascending: true });
    if (!error && data) setInventoryList(data);
    setIsLoadingData(false);
  };

  const fetchHistory = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (!error && data) setHistoryList(data);
    setIsLoadingData(false);
  };

  // === FUNGSI BARU: FETCH REQUEST ===
  const fetchRequests = async () => {
    setIsLoadingData(true);
    const { data } = await supabase.from("item_requests").select("*").order("status", { ascending: true }).order("created_at", { ascending: false });
    if (data) setRequestList(data);
    setIsLoadingData(false);
  };

  const handleSelesaikanRequest = async (id: number, namaBarang: string) => {
    const isConfirm = window.confirm(`Tandai request "${namaBarang}" sebagai SELESAI?`);
    if (!isConfirm) return;
    try {
      const { error } = await supabase.from("item_requests").update({ status: 'SELESAI' }).eq("id", id);
      if (error) throw error;
      fetchRequests();
    } catch (err) {
      alert("Gagal mengupdate status request.");
    }
  };

  const handleHapusRequest = async (id: number) => {
    if (!window.confirm("Hapus log request ini dari database?")) return;
    try {
      await supabase.from("item_requests").delete().eq("id", id);
      fetchRequests();
    } catch (err) {
      alert("Gagal menghapus request.");
    }
  };

  // --- FUNGSI SCANNER (SO) ---
  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setIsLoadingScan(true);
    setErrorMsg(null);
    setItemData(null);
    setStokFisik("");

    // === PERBAIKAN: KUPAS URL JIKA HASIL SCAN BERUPA LINK ===
    let finalBarcodeId = decodedText;
    if (decodedText.includes("?scan=")) {
      finalBarcodeId = decodedText.split("?scan=")[1];
    }

    try {
      const { data, error } = await supabase.from("inventory").select("*").eq("barcode_id", finalBarcodeId).maybeSingle();
      if (error) setErrorMsg("Terjadi kesalahan saat membaca database.");
      else if (!data) setErrorMsg("Barang tidak ditemukan di database.");
      else setItemData(data);
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem.");
    } finally {
      setIsLoadingScan(false);
    }
  };

  const handleUpdateStok = async () => {
  // 🛡️ Guard clause: pastikan itemData tidak null
  if (!itemData) return;
  
  if (stokFisik === "" || stokFisik < 0) {
    alert("⚠️ Masukkan jumlah stok valid!");
    return;
  }
  
  setIsSubmitting(true);
  const qtySistem = Number(itemData.quantity);
  const qtyFisikReal = Number(stokFisik);
  const selisih = qtyFisikReal - qtySistem;

  try {
    const { error: errorUpdate } = await supabase
      .from("inventory")
      .update({ quantity: qtyFisikReal.toString() })
      .eq("id", itemData.id);
    
    if (errorUpdate) throw errorUpdate;

    if (selisih !== 0) {
      await supabase.from("transactions").insert([{
        inventory_id: itemData.id,
        part_name: itemData.part_name,
        part_number: itemData.part_number,
        nama_peminjam: "ADMIN (SO)",
        jumlah: selisih,
        transaction_type: "ADMIN_SO"  // 🆕 PENTING untuk SBA!
      }]);
    }
    
    alert(`✅ STOCK OPNAME BERHASIL!\nStok ${itemData.part_name} diperbarui menjadi ${qtyFisikReal}.`);
    resetScanTampilan();
  } catch (err) {
    console.error("Error update stok:", err);
    alert("❌ Terjadi kesalahan saat menyimpan data.");
  } finally {
    setIsSubmitting(false);
  }
};

  const resetScanTampilan = () => {
    setItemData(null);
    setErrorMsg(null);
    setIsScanning(false);
    setStokFisik("");
  };

  // --- FUNGSI MASTER STOK (TAMBAH, EDIT, HAPUS, CETAK) ---
  const handleGenerateUUID = () => {
    setFormData({ ...formData, barcode_id: crypto.randomUUID() });
  };

  const openAddModal = () => {
    setEditId(null);
    setIsBulk(false);
    setUom("Pieces");
    setFormData({
      part_name: "",
      part_number: "",
      location: "",
      quantity: "",
      barcode_id: "",
      expired_date: "",
      batch_number: "",
      isBulk: false,
      uom: "Pieces",
      rack_type: "NEW",
    });
    setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditId(item.id);
    setIsBulk(item.is_bulk || false);
    setUom(item.uom || "Pieces");
    setFormData({
      part_name: item.part_name,
      part_number: item.part_number || "",
      location: item.location || "",
      quantity: item.quantity ? item.quantity.toString() : "",
      barcode_id: item.barcode_id,
      expired_date: item.expired_date || "",
      batch_number: item.batch_number || "",
      isBulk: item.is_bulk || false,
      uom: item.uom || "Pieces",
      rack_type: item.rack_type || "NEW",
    });
    setShowAddModal(true);
  };

  const handleSimpanBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.part_name || !formData.barcode_id || !formData.quantity) {
      return alert("⚠️ Nama Barang, Barcode ID, dan Stok wajib diisi!");
    }

    setIsSavingItem(true);
    try {
      if (editId) {
        const { error } = await supabase.from("inventory").update({
          part_name: formData.part_name,
          part_number: formData.part_number,
          location: formData.location,
          quantity: formData.quantity.toString(),
          barcode_id: formData.barcode_id,
          expired_date: formData.expired_date || null,
          batch_number: formData.batch_number || null,
          is_bulk: isBulk,
          uom: uom,
          rack_type: formData.rack_type,
        }).eq("id", editId);
        if (error) {
          console.log("Error Supabase:", error);
          throw error;
        }
        alert("✅ Data barang berhasil diubah!");
      } else {
        const { error } = await supabase.from("inventory").insert([{
          part_name: formData.part_name,
          part_number: formData.part_number,
          location: formData.location,
          quantity: formData.quantity.toString(),
          barcode_id: formData.barcode_id,
          expired_date: formData.expired_date || null,
          batch_number: formData.batch_number || null,
          is_bulk: isBulk,
          uom: uom,
          rack_type: formData.rack_type,
        }]);
        if (error) {
          console.log("Error Supabase:", error);
          throw error;
        }
        alert("✅ Barang baru berhasil ditambahkan!");
      }
      setShowAddModal(false);
      fetchInventory();
    } catch (err: any) {
      if (err.code === '23505') alert("❌ Barcode ID sudah terdaftar di barang lain!");
      else alert("❌ Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleHapusBarang = async (id: number, namaBarang: string) => {
    const isConfirm = window.confirm(`⚠️ YAKIN INGIN MENGHAPUS "${namaBarang}"?\n\nSemua data barang ini akan hilang dari sistem.`);
    if (!isConfirm) return;

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      alert(`🗑️ Barang "${namaBarang}" berhasil dihapus.`);
      fetchInventory();
    } catch (err: any) {
      if (err.code === '23503') {
        alert(`❌ GAGAL MENGHAPUS!\n\nBarang "${namaBarang}" memiliki riwayat transaksi/peminjaman.\n\nSistem mengunci penghapusan agar riwayat tidak rusak.`);
      } else {
        alert("❌ Terjadi kesalahan saat menghapus barang.");
      }
    }
  };

  // --- FUNGSI CETAK ---
  const handleCetakQR = (item: InventoryItem) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {

      let itemsHtml = "";
      // PERBAIKAN: Ubah isi QR jadi URL lengkap
      const baseUrl = "https://stock-opname-project-gmf.vercel.app/"; 
      const qrData = `${baseUrl}/?scan=${item.barcode_id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      // Ambil quantity, minimal 1 (jaga-jaga kalau stok 0 tapi admin butuh cetak 1 stiker buat nempel di rak kosong)
      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

      // Looping pembuatan kotak stiker sebanyak jumlah stok
      for (let i = 0; i < qty; i++) {
        itemsHtml += `
          <div class="label-box">
            <h2>${item.part_name}</h2>
            <p>PN: ${item.part_number || "-"}</p>
            <img src="${qrUrl}" alt="QR Code" />

            <p>Batch: ${item.batch_number || "-"}</p>
            <p>Exp: ${item.expired_date || "-"}</p>
            <div class="uuid">${item.barcode_id}</div>
          </div>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak QR - ${item.part_name}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; background-color: #f1f5f9; }
              /* Gunakan layout GRID/FLEX persis seperti fitur cetak semua */
              .grid-container { 
                display: flex; 
                flex-wrap: wrap; /* Otomatis turun ke bawah kalau 1 baris penuh */
                gap: 10px; 
                justify-content: flex-start;
              }
              .label-box { 
                background: white; border: 2px solid #000; padding: 10px; 
                text-align: center; border-radius: 8px; page-break-inside: avoid;
                width: 160px; /* Ukuran kotak dikunci */
              }
              h2 { margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              p { margin: 0 0 10px 0; font-size: 10px; color: #333; font-weight: bold; }
              img { width: 100px; height: 100px; margin: 0 auto; display: block; }
              .uuid { margin-top: 10px; font-family: monospace; font-size: 8px; color: #555; word-break: break-all; }
              .header { text-align: center; margin-bottom: 20px; }
              .print-btn { padding: 12px 24px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3); }
              
              /* CSS Khusus Print agar hemat kertas */
              @media print {
                @page { margin: 5mm; }
                body { background: white; padding: 0; margin: 0; }
                .header, .no-print { display: none !important; }
                .label-box { border: 1px dashed #999; border-radius: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header no-print">
              <h1>Cetak ${qty} Stiker untuk ${item.part_name}</h1>
              <p>Pastikan gambar QR Code sudah termuat sebelum klik tombol cetak di bawah.</p>
              <button class="print-btn" onclick="window.print()">🖨️ Cetak Stiker Sekarang</button>
            </div>
            <div class="grid-container">
              ${itemsHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCetakSemuaQR = () => {
    if (inventoryList.length === 0) return alert("Belum ada barang di database!");

    const printWindow = window.open('', '_blank');
    if (printWindow) {

      // PERBAIKAN LOGIKA LOOPING BERDASARKAN QTY BARANG
      let itemsHtml = "";
      let totalStikerDicetak = 0;
      const baseUrl = "https://stock-opname-project-gmf.vercel.app/"; 

      inventoryList.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const qrData = `${baseUrl}/?scan=${item.barcode_id}`; // Gabungkan URL
        // Ulangi pembuatan HTML box sebanyak jumlah stok barang tersebut
        for (let i = 0; i < qty; i++) {
          totalStikerDicetak++;
          itemsHtml += `
            <div class="label-box">
              <h2>${item.part_name}</h2>
              <p>PN: ${item.part_number || "-"}</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}" alt="QR Code" />

              <p>Batch: ${item.batch_number || "-"}</p>
              <p>Exp: ${item.expired_date || "-"}</p>
              <div class="uuid">${item.barcode_id}</div>
            </div>
          `;
        }
      });

      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Semua QR Code</title>
            <style>
              body { font-family: sans-serif; padding: 20px; background-color: #f1f5f9; }
              .grid-container { 
                display: flex; 
                flex-wrap: wrap; /* Supaya turun ke bawah kalau penuh */
                gap: 10px; 
              }
              .label-box { 
                background: white; border: 2px solid #000; padding: 10px; 
                text-align: center; border-radius: 8px; page-break-inside: avoid;
                width: 160px; /* Ukuran statis biar seragam */
              }
              h2 { margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              p { margin: 0 0 10px 0; font-size: 10px; color: #333; font-weight: bold; }
              img { width: 100px; height: 100px; margin: 0 auto; display: block; }
              .uuid { margin-top: 10px; font-family: monospace; font-size: 8px; color: #555; word-break: break-all; }
              .header { text-align: center; margin-bottom: 20px; }
              .print-btn { padding: 12px 24px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3); }
              
              /* PERBAIKAN CSS PRINT MASAL */
              @media print {
                @page { margin: 5mm; }
                body { background: white; padding: 0; margin: 0; }
                .header, .no-print { display: none !important; }
                .label-box { border: 1px dashed #999; border-radius: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header no-print">
              <h1>Total ${totalStikerDicetak} Stiker QR Siap Cetak</h1>
              <p>Pastikan gambar QR Code sudah termuat semua sebelum klik tombol cetak di bawah.</p>
              <button class="print-btn" onclick="window.print()">🖨️ Cetak Semua Sekarang</button>
            </div>
            <div class="grid-container">
              ${itemsHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // === FITUR BARU: CETAK LISTING KERTAS PER LOKASI ===
  const handleCetakListLokasi = () => {
    if (inventoryList.length === 0) return alert("Belum ada data barang!");

    const groupedData: Record<string, any[]> = {};
    inventoryList.forEach(item => {
      const loc = item.location ? item.location.trim().toUpperCase() : "TANPA LOKASI";
      if (!groupedData[loc]) groupedData[loc] = [];
      groupedData[loc].push(item);
    });

    const sortedLocations = Object.keys(groupedData).sort();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const today = new Date();
      let htmlContent = `
        <html>
        <head>
          <title>List Barang & Expired per Lokasi</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
            .location-section { margin-bottom: 30px; page-break-inside: avoid; }
            .location-title { background-color: #f1f5f9; padding: 12px; font-size: 16px; font-weight: 900; border: 1px solid #000; border-bottom: none; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #000; padding: 10px 15px; text-align: left; }
            th { background-color: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
            td { font-size: 13px; }
            .expired-danger { color: #dc2626; font-weight: 900; text-decoration: underline; }
            .no-print { margin-bottom: 20px; display: flex; justify-content: flex-end; }
            button { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="no-print"><button onclick="window.print()">🖨️ Cetak Dokumen</button></div>
          <div class="header">
            <h1>LABEL CHEMICAL & EXPIRED DATE</h1>
            <p>GMF INVENTORY SYSTEM - ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
      `;

      sortedLocations.forEach(loc => {
        htmlContent += `
          <div class="location-section">
            <h2 class="location-title">📍 LOKASI: ${loc}</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 35%">NAMA BARANG</th>
                  <th style="width: 25%">PART NUMBER</th>
                  <th style="width: 25%">EXPIRED DATE</th>
                  <th style="width: 15%; text-align: center;">QTY</th>
                </tr>
              </thead>
              <tbody>
        `;

        const sortedItems = groupedData[loc].sort((a, b) => a.part_name.localeCompare(b.part_name));

        sortedItems.forEach(item => {
          const expDate = item.expired_date ? new Date(item.expired_date) : null;
          const isExpired = expDate && expDate < today;
          const formattedDate = expDate 
            ? expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : "-";

          htmlContent += `
            <tr>
              <td><strong>${item.part_name}</strong></td>
              <td>${item.part_number || "-"}</td>
              <td class="${isExpired ? 'expired-danger' : ''}">${formattedDate} ${isExpired ? '(EXPIRED!)' : ''}</td>
              <td style="text-align: center; font-size: 16px; font-weight: 900;">${item.quantity || 0}</td>
            </tr>
          `;
        });

        htmlContent += `</tbody></table></div>`;
      });

      htmlContent += `</body></html>`;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Filter list inventory berdasarkan pencarian (Nama atau PN)
  const filteredInventory = inventoryList.filter(item =>
    item.part_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // TAMPILAN 1: GERBANG PIN - NOTION MINIMALIST
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#001e2b] flex items-center justify-center p-4 selection:bg-[#00ed64]/30">
        <div className="w-full max-w-sm">
          <div className={`bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-white/10 overflow-hidden transition-all ${isWrongPin ? "animate-shake" : ""}`}>
            <div className="px-8 pt-10 pb-8 text-center relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ed64] to-transparent"></div>

              <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all ${isWrongPin ? "bg-red-500/10 border-2 border-red-500/30" : "bg-[#00ed64]/10 border-2 border-[#00ed64]/20"}`}>
                <svg className={`w-8 h-8 transition-colors ${isWrongPin ? "text-red-500" : "text-[#00ed64]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  {isWrongPin ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  )}
                </svg>
              </div>

              <h1 className="text-xl font-black text-white tracking-tight mb-1">Admin Dashboard</h1>
              <p className="text-sm text-white/50 font-medium">{isWrongPin ? "PIN salah, coba lagi" : "Masukkan PIN 6 digit untuk akses"}</p>
            </div>

            <form onSubmit={handleLoginAdmin} className="px-8 pb-8 space-y-6">
              <div className="flex justify-center gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pinInput.length ? (isWrongPin ? "bg-red-500 scale-110" : "bg-[#00ed64] scale-110") : "bg-white/10"}`}
                  />
                ))}
              </div>

              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPinInput(val);
                    if (isWrongPin) setIsWrongPin(false);
                  }}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold bg-white/5 border-2 border-white/10 focus:border-[#00ed64] text-white rounded-2xl p-4 pr-12 focus:ring-4 focus:ring-[#00ed64]/20 outline-none transition-all placeholder:text-white/20"
                  maxLength={6}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="PIN 6 digit"
                />

                {pinInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
                    aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  >
                    {showPin ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {isWrongPin && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold animate-fade-in">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>PIN yang Anda masukkan salah</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoginLoading || pinInput.length !== 6}
                className="w-full bg-[#00ed64] hover:bg-[#00b545] active:bg-[#009d3c] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-[#001e2b] font-black py-4 rounded-2xl shadow-lg shadow-[#00ed64]/20 disabled:shadow-none transition-all active:scale-[0.98] text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isLoginLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>Masuk</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-white/30 font-medium">
                {/* PIN default: <span className="font-mono text-white/50">123456</span> */}
              </p>
            </form>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-[#00ed64] transition-colors py-2 px-4 rounded-lg hover:bg-white/5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Kembali ke Peminjaman Karyawan</span>
            </a>
          </div>
        </div>

        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Navigasi Item Helper - Redesigned Notion Minimalist
  const NavItem = ({ id, icon, label }: { id: string, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-200 rounded-full group ${activeTab === id
        ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        : "text-white/40 hover:bg-white/5 hover:text-white/80"
        }`}
    >
      <span className={`text-xl transition-transform group-hover:scale-110 flex items-center justify-center w-6 h-6 ${activeTab === id ? "opacity-100" : "opacity-40 group-hover:opacity-80"}`}>{icon}</span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#001e2b] font-sans text-white overflow-hidden selection:bg-[#00ed64]/30">

      {/* SIDEBAR (DESKTOP & MOBILE) */}
      {/* Overlay untuk Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Panel Sidebar - Notion Aesthetic */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#001e2b] shadow-[1px_0_0_0_rgba(255,255,255,0.06)] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        <div className="p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] rounded-xl flex items-center justify-center text-white text-xl">
            🛠️
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-tight">GMF Admin</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mt-0.5">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          <NavItem id="dashboard" icon={<img src="/icons/icons8-chart-100.png" className="w-6 h-6" alt="dashboard" />} label="Overview" />
          <NavItem id="scanner" icon={<img src="/icons/icons8-camera-100.png" className="w-6 h-6" alt="audit" />} label="Audit (SO)" />
          <NavItem id="inventory" icon={<img src="/icons/icons8-box-128.png" className="w-6 h-6" alt="inventory" />} label="Master Stock" />
          <NavItem id="history" icon={<img src="/icons/icons8-activity-history-100.png" className="w-6 h-6" alt="history" />} label="Log History" />
          <NavItem id="requests" icon={<img src="/icons/icons8-inbox-100.png" className="w-6 h-6" alt="requests" />} label="Request Queue" />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleLogoutAdmin}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white/70 hover:text-red-300 font-bold py-3 rounded-full border border-white/10 transition-colors text-sm"
          >
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* HEADER BARS (Mobile Hamburger + Page Title) */}
        <header className="bg-[#001e2b] shadow-[0_1px_0_0_rgba(255,255,255,0.06)] px-8 py-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-white/40 hover:bg-white/5 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-base font-black text-white/90 tracking-tight uppercase leading-none">
              {activeTab === "scanner" ? "Audit Stock Opname" : activeTab.replace("-", " ")}
            </h2>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 pb-20 scrollbar-hide">
          <div className="max-w-7xl mx-auto">

            {/* TAB 0: DASHBOARD OVERVIEW - REDESIGNED NOTION MINIMALIST */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-700">
                {/* 1. STATS ROW - 12 Column Grid with 64px Gutters */}
                <div className="grid grid-cols-12 gap-x-16 gap-y-6">
                  {[
                    { label: "Total Barang", value: inventoryList.length, icon: "📦", color: "text-[#00ed64]", bg: "bg-[#00ed64]/10" },
                    { label: "Stok Menipis", value: dashboardStats.lowStockCount, icon: "⚠️", color: "text-red-400", bg: "bg-red-500/10" },
                    { label: "Pending Req", value: dashboardStats.pendingReqCount, icon: "⏳", color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Total Transaksi", value: dashboardStats.totalBorrowings, icon: "📜", color: "text-green-400", bg: "bg-green-500/10" }
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="col-span-12 sm:col-span-6 lg:col-span-3 bg-[#001e2b] p-6 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all flex items-center gap-4 group"
                    >
                      <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-tight mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-12 gap-x-16 gap-y-6">
                  {/* 2. TOP ITEMS CHART */}
                  <div className="col-span-12 lg:col-span-6 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-white/5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-xl flex items-center justify-center">🔥</div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">Barang Paling Sering Diambil</h3>
                    </div>
                    <div className="space-y-6">
                      {dashboardStats.topItems.map(([name, count]) => (
                        <div key={name} className="space-y-3 group">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                            <span className="truncate max-w-[70%]">{name}</span>
                            <span>{count} Unit</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                            <div
                              className="h-full bg-[#00ed64] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,237,100,0.25)]"
                              style={{ width: `${(count / dashboardStats.maxItemCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {dashboardStats.topItems.length === 0 && (
                        <p className="text-center py-10 text-white/20 font-bold text-sm">Belum ada data pengambilan.</p>
                      )}
                    </div>
                  </div>

                  {/* 3. TOP USERS CHART */}
                  <div className="col-span-12 lg:col-span-6 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-[#00ed64]/15 text-[#00ed64] shadow-[0_0_0_1px_rgba(0,237,100,0.25)] rounded-xl flex items-center justify-center">👤</div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">Peminjam Teraktif</h3>
                    </div>
                    <div className="space-y-6">
                      {dashboardStats.topUsers.map(([user, count]) => (
                        <div key={user} className="space-y-3 group">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                            <span className="truncate max-w-[70%]">{user}</span>
                            <span>{count} Kali</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                            <div
                              className="h-full bg-white/80 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              style={{ width: `${(count / dashboardStats.maxUserCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {dashboardStats.topUsers.length === 0 && (
                        <p className="text-center py-10 text-white/20 font-bold text-sm">Belum ada data peminjam.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 text-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.2)] rounded-xl flex items-center justify-center">🧠</div>
                      <div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">SBA Smart Forecast</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Syntetos-Boylan Approximation • Decision Support</p>
                      </div>
                    </div>
                    <div className="md:ml-auto flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-white/5 text-white/50 rounded-full text-[10px] font-bold border border-white/10">
                        α = 0.30 default
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 text-white/50 rounded-full text-[10px] font-bold border border-white/10">
                        Bias Correction: 0.85
                      </span>
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-bold border border-purple-500/20">
                        21 weeks analyzed
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 pr-4">
                            <div>Nama Item</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Activity info</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>Stok</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Current</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>Forecast Loan</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">unit/minggu</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>Forecast Cons</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">unit/minggu</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>Safety Stock</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Loan × 1.5</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>ROP</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Cons×LT+SS</div>
                          </th>
                          <th className="py-4 px-4 text-center">
                            <div>Params</div>
                            <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">α / LT</div>
                          </th>
                          <th className="py-4 pl-4 text-right">Rekomendasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sbaAlerts.slice(0, 10).map((alert) => (
                          <tr key={alert.id} className="group hover:bg-white/[0.02] transition-colors">
                            {/* Nama Item + Activity Info */}
                            <td className="py-4 pr-4">
                              <div className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">
                                {alert.part_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-white/30 font-mono">
                                  {alert.positivePeriods}/{alert.dataPoints}w active
                                </span>
                                {alert.part_number && (
                                  <span className="text-[10px] text-white/20 font-mono truncate max-w-[80px]">
                                    {alert.part_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Stok Fisik */}
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-block min-w-[3rem] py-1 px-3 rounded-lg font-black text-sm ${
                                Number(alert.quantity) <= 5 
                                  ? "bg-red-500/10 text-red-400" 
                                  : "bg-[#00ed64]/10 text-[#00ed64]"
                              }`}>
                                {alert.quantity}
                              </span>
                            </td>
                            
                            {/* Forecast Loan */}
                            <td className="py-4 px-4 text-center text-sm font-bold text-blue-400">
                              {alert.sbaLoan}
                            </td>
                            
                            {/* Forecast Cons */}
                            <td className="py-4 px-4 text-center text-sm font-bold text-purple-400">
                              {alert.sbaCons}
                            </td>
                            
                            {/* Safety Stock */}
                            <td className="py-4 px-4 text-center text-sm font-bold text-amber-400">
                              {alert.safetyStock}
                            </td>
                            
                            {/* ROP */}
                            <td className="py-4 px-4 text-center text-sm font-bold text-slate-300">
                              {alert.rop}
                            </td>
                            
                            {/* Parameters */}
                            <td className="py-4 px-4 text-center">
                              <div className="text-xs font-mono text-white/50">
                                <span className="text-white/70">{alert.alpha}</span>
                                <span className="text-white/20">/</span>
                                <span className="text-white/70">{alert.leadTime}w</span>
                              </div>
                            </td>
                            
                            {/* Rekomendasi */}
                            <td className="py-4 pl-4 text-right">
                              <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${alert.color}`}>
                                {alert.status}: {alert.action}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Empty State */}
                        {sbaAlerts.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-20 text-center">
                              <div className="text-4xl mb-4 opacity-20">📊</div>
                              <p className="text-white/30 font-bold">Belum ada data untuk forecast</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend / Info Box */}
                  <div className="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span className="text-white/50">Loan = Barang dipinjam & dikembalikan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span className="text-white/50">Cons = Barang habis dipakai (perlu reorder)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-white/50">SS = Buffer stok untuk demand variability</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        <span className="text-white/50">ROP = Titik trigger pembelian ke supplier</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: SCANNER SO */}
            {activeTab === "scanner" && (
              <div className="w-full max-w-md mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!isScanning && !isLoadingScan && !itemData && !errorMsg && (
                  <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 text-center group">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-4xl">📷</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Start Stock Opname</h3>
                    <p className="text-slate-500 text-sm mb-8">Point camera at QR Code to perform physical inventory audit.</p>
                    <button
                      onClick={() => setIsScanning(true)}
                      className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-4 px-6 rounded-full shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95"
                    >
                      Start Scanning
                    </button>
                  </div>
                )}
                {isScanning && (
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-300">
                    <div className="mb-4 flex items-center justify-center gap-2 text-slate-500 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-slate-500 font-medium">Scanning in progress...</span>
                    </div>
                    <QRScanner onScanSuccess={handleScanSuccess} />
                    <button
                      onClick={() => setIsScanning(false)}
                      className="mt-6 w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-3 rounded-xl transition-colors"
                    >
                      Cancel Scanning
                    </button>
                  </div>
                )}
                {isLoadingScan && (
                  <div className="bg-white p-20 rounded-3xl shadow-xl border border-slate-200 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Searching for item data...</p>
                  </div>
                )}
                {errorMsg && !isLoadingScan && (
                  <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 text-center animate-in shake duration-500">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-red-600 mb-2">Error Encountered</h3>
                    <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                    <button
                      onClick={resetScanTampilan}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                {itemData && !isLoadingScan && (
                  <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-[#001e2b] p-8 text-white relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ed64]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                      <span className="inline-block px-3 py-1 bg-[#00ed64]/15 text-[#00ed64] rounded-full text-[10px] font-black uppercase tracking-widest mb-3">Audit Item</span>
                      <h2 className="text-2xl font-black">{itemData.part_name}</h2>
                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Stok Sistem</p>
                          <p className="text-3xl font-black text-amber-400">{itemData.quantity} <span className="text-sm font-medium text-slate-400 uppercase tracking-normal">unit</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Lokasi</p>
                          <p className="text-lg font-bold text-slate-200">{itemData.location || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 bg-slate-50/50">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Input Stok Fisik Aktual</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={stokFisik}
                          onChange={(e) => setStokFisik(e.target.value ? Number(e.target.value) : "")}
                          className="w-full bg-white border-2 border-slate-200 focus:border-[#00ed64] rounded-2xl p-6 text-3xl font-black text-center text-slate-900 transition-all outline-none shadow-sm"
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-4 mt-8">
                        <button
                          onClick={resetScanTampilan}
                          className="flex-1 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 py-4 rounded-2xl font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateStok}
                          disabled={isSubmitting}
                          className="flex-1 bg-[#00ed64] hover:bg-[#00b545] disabled:bg-slate-300 text-[#001e2b] py-4 rounded-full font-black shadow-lg shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95"
                        >
                          {isSubmitting ? "Updating..." : "Adjust"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MASTER STOK - REDESIGNED NOTION MINIMALIST */}
            {activeTab === "inventory" && (
              <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
                {/* HEADER SECTION FROM REFERENCE2.TSX */}
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Database Barang</h2>
                    <p className="text-sm text-white/50 font-medium">Manajemen data master dan pencetakan QR.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button 
                      onClick={handleCetakListLokasi} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white/80 border border-white/10 text-sm font-bold py-3 px-5 rounded-xl transition-all shadow-sm"
                    >
                      Cetak Label Lokasi
                    </button>

                    <button 
                      onClick={handleCetakSemuaQR} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white/80 border border-white/10 text-sm font-bold py-3 px-5 rounded-xl transition-all shadow-sm"
                    >
                      Cetak Semua QR
                    </button>
                    
                    <button 
                      onClick={openAddModal} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] text-sm font-black py-3 px-5 rounded-xl transition-all shadow-lg shadow-[0_0_0_1px_rgba(0,237,100,0.25)]"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* SEARCH BAR SECTION */}
                <div className="p-6 border-b border-white/5">
                  <div className="relative group max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00ed64] transition-colors">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Cari Nama atau PN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-lg text-base font-medium text-white placeholder:text-white/20 focus:shadow-[0_0_0_2px_rgba(0,237,100,0.25)] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingData ? (
                    <div className="py-20 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                      <p className="text-white/40 font-medium">Memuat database...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-4">Item Info</th>
                          <th className="px-8 py-4">Part Number</th>
                          <th className="px-8 py-4 text-center">Batch Number</th>
                          <th className="px-8 py-4 text-center">Expired Date</th>
                          <th className="px-8 py-4 text-center">Location</th>
                          <th className="px-8 py-4 text-center">Stock</th>
                          <th className="px-8 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredInventory.map((item: InventoryItem) => (
                          <tr key={item.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                            <td className="px-8 py-6">
                              <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{item.part_name}</p>
                              <p className="text-[10px] font-mono text-white/30 mt-1 truncate max-w-[150px]">{item.barcode_id}</p>
                            </td>
                            <td className="px-8 py-6 text-base font-bold text-white/50 leading-normal">
                              {item.part_number || "—"}
                            </td>
                            <td className="px-8 py-6 text-center text-sm font-medium text-white/50">
                              {item.batch_number || "—"}
                            </td>
                            <td className="px-8 py-6 text-center text-sm font-medium text-white/50">
                              {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="inline-block px-3 py-1 bg-white/5 text-white/60 rounded-lg text-xs font-bold shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                                {item.location || "N/A"}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`inline-block min-w-[3rem] py-1 px-3 rounded-lg font-black text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${Number(item.quantity) <= 5 ? "bg-red-500/10 text-red-400" : "bg-[#00ed64]/10 text-[#00ed64]"
                                }`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end items-center gap-4">
                                <button onClick={() => handleCetakQR(item)} className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Print QR">
                                  🖨️
                                </button>
                                <button onClick={() => openEditModal(item)} className="p-2 text-white/20 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-all" title="Edit">
                                  ✏️
                                </button>
                                <button onClick={() => handleHapusBarang(item.id, item.part_name)} className="p-2 text-white/20 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all" title="Hapus">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredInventory.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-8 py-20 text-center">
                              <div className="text-4xl mb-4 opacity-20">📦</div>
                              <p className="text-white/30 font-bold">No item found.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: RIWAYAT TRANSAKSI - REDESIGNED NOTION MINIMALIST */}
            {activeTab === "history" && (
              <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
                {/* Header with Grid */}
                <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center">
                  <div className="col-span-12">
                    <h2 className="text-base font-black tracking-tight leading-normal">Log Aktivitas</h2>
                    <p className="text-sm text-white/50 font-medium leading-normal">Pantau pergerakan stok dan penyesuaian audit.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingData ? (
                    <div className="py-20 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                      <p className="text-white/40 font-medium">Memuat histori...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-4">Waktu & Tanggal</th>
                          <th className="px-8 py-4">User / Peminjam</th>
                          <th className="px-8 py-4">Detail Item</th>
                          <th className="px-8 py-4 text-right">Perubahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {historyList.map((log: TransactionLog) => (
                          <tr key={log.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                            <td className="px-8 py-6">
                              <p className="text-base font-bold text-white/90 group-hover:text-white transition-colors leading-normal">
                                {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] text-white/30 font-medium uppercase mt-0.5">
                                {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-8 py-6">
                              {log.nama_peminjam === "ADMIN (SO)" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_0_1px_rgba(251,191,36,0.2)]">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                  Audit Admin
                                </span>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-lg flex items-center justify-center text-xs font-black text-white/40 uppercase group-hover:text-white/60 transition-colors">
                                    {log.nama_peminjam?.charAt(0) || "?"}
                                  </div>
                                  <div>
                                    <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{log.nama_peminjam}</p>
                                    <p className="text-[10px] font-mono text-white/30 mt-0.5">Employee ID: {log.nomor_pegawai || "—"}</p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-base font-bold text-white/70 group-hover:text-white transition-colors leading-normal break-words">{log.part_name}</p>
                              <p className="text-[10px] text-white/30 mt-0.5 font-mono">{log.part_number || "No Part Number"}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className={`inline-flex items-center justify-end font-black text-sm ${log.jumlah < 0 ? "text-red-400" : "text-green-400"
                                }`}>
                                {log.jumlah > 0 ? (
                                  <span className="mr-1 opacity-50">▲</span>
                                ) : (
                                  <span className="mr-1 opacity-50">▼</span>
                                )}
                                {Math.abs(log.jumlah)}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {historyList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                              <div className="text-4xl mb-4 opacity-20">📜</div>
                              <p className="text-white/30 font-bold">Belum ada riwayat aktivitas.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: REQUEST BARANG - REDESIGNED NOTION MINIMALIST */}
            {activeTab === "requests" && (
              <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
                {/* Header with Grid */}
                <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center">
                  <div className="col-span-12">
                    <h2 className="text-base font-black tracking-tight leading-normal">Antrean Request</h2>
                    <p className="text-sm text-white/50 font-medium leading-normal">Kelola pengajuan stok barang dari karyawan.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingData ? (
                    <div className="py-20 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                      <p className="text-white/40 font-medium">Memuat data request...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-4">Tanggal</th>
                          <th className="px-8 py-4">Info Request</th>
                          <th className="px-8 py-4">Keterangan</th>
                          <th className="px-8 py-4 text-center">Status</th>
                          <th className="px-8 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {requestList.map((req: ItemRequest) => (
                          <tr key={req.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                            <td className="px-8 py-6">
                              <p className="text-base font-bold text-white/90 group-hover:text-white transition-colors leading-normal">
                                {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] text-white/30 font-medium uppercase mt-0.5">
                                {new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{req.nama_barang}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/5 text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] py-0.5 px-2 rounded-full text-[10px] font-black">{req.jumlah} unit</span>
                                <span className="text-xs text-white/30 font-medium italic">oleh {req.nama_peminjam}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm text-white/50 italic max-w-xs leading-normal whitespace-pre-wrap break-words">{req.keterangan || "-"}</p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              {req.status === "PENDING" ? (
                                <span className="inline-block px-3 py-1 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.2)] text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                  ⏳ PENDING
                                </span>
                              ) : (
                                <span className="inline-block px-3 py-1 bg-[#00ed64]/10 shadow-[0_0_0_1px_rgba(0,237,100,0.25)] text-[#00ed64] rounded-full text-[10px] font-black uppercase tracking-wider">
                                  ✅ SELESAI
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end items-center gap-3">
                                {req.status === "PENDING" && (
                                  <button
                                    onClick={() => handleSelesaikanRequest(req.id, req.nama_barang)}
                                    className="px-3 py-1.5 bg-transparent hover:bg-[#00ed64]/10 text-white/40 hover:text-[#00ed64] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-full transition-all text-xs font-bold border border-white/10"
                                    title="Tandai Selesai"
                                  >
                                    ✓ Selesaikan
                                  </button>
                                )}
                                <button
                                  onClick={() => handleHapusRequest(req.id)}
                                  className="p-2 text-white/20 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                                  title="Hapus Log"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {requestList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                              <div className="text-4xl mb-4 opacity-20">📥</div>
                              <p className="text-white/30 font-bold">Yeay! Tidak ada antrean request.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL: TAMBAH / EDIT BARANG (POPUP) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 bg-[#001e2b] text-white flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl tracking-tight">{editId ? "Update Barang" : "Add New Item"}</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{editId ? "Lakukan perubahan pada data master." : "Complete the form to add a new item."}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <form onSubmit={handleSimpanBarang} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Item Name *</label>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Part Number</label>
                    <input
                      type="text"
                      value={formData.part_number}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{editId ? "Current Stock *" : "Initial Stock *"}</label>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                      placeholder="Example: BN-2024"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Expired Date</label>
                    <input
                      type="date"
                      value={formData.expired_date}
                      onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Location / Drawer</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#00ed64] focus:border-transparent outline-none transition-all"
                    placeholder="Example: DRAWER A"
                  />
                </div>

                <div className="p-5 bg-[#e3fcef] rounded-xl border border-[#c3f0d2]">
                  <label className="block text-[10px] font-black text-[#00684a] uppercase tracking-[0.2em] mb-2">Barcode ID / UUID *</label>
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
                      onClick={handleGenerateUUID}
                      className="bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_0_1px_rgba(0,237,100,0.25)] shrink-0 active:scale-95"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Kategori Barang</label>
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

                {/* Tampilkan UOM */}
                <div className="mb-4 text-sm text-slate-500">
                  Satuan yang digunakan sistem: <span className="font-bold">{uom}</span>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold py-4 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="flex-1 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-4 rounded-xl shadow-[0_0_0_1px_rgba(0,237,100,0.25)] disabled:opacity-50 transition-all active:scale-95"
                  >   
                    {isSavingItem ? "Saving..." : (editId ? "UPDATE" : "SAVE")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
