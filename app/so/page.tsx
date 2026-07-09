"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useHistory } from "./hooks/useHistory";
import { useRequests } from "./hooks/useRequests";
import { useScanner } from "./hooks/useScanner";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { useSBAAlerts } from "./hooks/useSBAAlerts";
import { useActiveLoansAdmin } from "./hooks/useActiveLoansAdmin";
import { printSingleQR, printAllQR, printLocationList } from "./utils/printUtils";
import type { InventoryItem } from "./types";
import { NavItem } from "./components/layout/NavItem";
import { ItemModal } from "./components/modals/ItemModal";
import { LoginPage } from "./components/LoginPage";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { ScannerTab } from "./components/tabs/ScannerTab";
import { InventoryTab } from "./components/tabs/InventoryTab";
import { HistoryTab } from "./components/tabs/HistoryTab";
import { RequestsTab } from "./components/tabs/RequestsTab";

export default function AdminDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bulkPrintTarget, setBulkPrintTarget] = useState<{ item: InventoryItem; count: number } | null>(null);

  const {
    inventoryList,
    isLoadingData: isLoadingInventory,
    searchQuery,
    setSearchQuery,
    fetchInventory,
    handleHapusBarang,
    filteredInventory,
    showAddModal,
    setShowAddModal,
    isSavingItem,
    editId,
    isBulk,
    setIsBulk,
    uom,
    setUom,
    formData,
    setFormData,
    handleGenerateUUID,
    openAddModal,
    openEditModal,
    handleSimpanBarang,
  } = useInventory();

  const { historyList, isLoadingData: isLoadingHistory, fetchHistory } = useHistory();
  const { requestList, isLoadingData: isLoadingRequests, fetchRequests, handleSelesaikanRequest, handleHapusRequest } = useRequests();

  const {
    isScanning,
    setIsScanning,
    isLoadingScan,
    itemData,
    errorMsg,
    stokFisik,
    setStokFisik,
    isSubmitting,
    handleScanSuccess,
    handleUpdateStok,
    resetScanTampilan,
  } = useScanner(fetchInventory);

  const sbaAlerts = useSBAAlerts(inventoryList, historyList);
  const dashboardStats = useDashboardStats(inventoryList, historyList, requestList, sbaAlerts);
  const activeLoansAdmin = useActiveLoansAdmin();

  useEffect(() => {
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

  const handlePrintQR = (item: InventoryItem) => {
    if (item.is_bulk) {
      setBulkPrintTarget({ item, count: 1 });
    } else {
      printSingleQR(item);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#001e2b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onSignIn={signInWithGoogle}
        error={authError}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-[#00ed64]/30">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-navy-800 border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col h-full flex-shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
        <div className="px-5 py-5 border-b border-white/5 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold tracking-tight leading-tight">GMF Inventory</p>
            <p className="text-white/40 text-[10px] font-medium tracking-wide">Control System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-4" data-lenis-prevent>
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Workspace</p>
            <div className="space-y-0.5">
              <NavItem id="dashboard" label="Overview" isActive={activeTab === "dashboard"}
                onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
              />
              <NavItem id="scanner" label="Audit (SO)" isActive={activeTab === "scanner"}
                onClick={() => { setActiveTab("scanner"); setIsSidebarOpen(false); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>}
              />
              <NavItem id="inventory" label="Inventory" isActive={activeTab === "inventory"}
                onClick={() => { setActiveTab("inventory"); setIsSidebarOpen(false); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>}
              />
              <NavItem id="history" label="History" isActive={activeTab === "history"}
                onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <NavItem id="requests" label="Requests Queue" isActive={activeTab === "requests"}
                onClick={() => { setActiveTab("requests"); setIsSidebarOpen(false); }}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
              />
            </div>
          </div>
        </nav>

        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div onClick={signOut} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer group" title="Keluar Sistem">
            <div className="w-7 h-7 bg-accent/30 border border-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-xs font-semibold">
                {user?.user_metadata?.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "AD"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium leading-tight truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-white/40 text-[10px] leading-tight truncate">Admin</p>
            </div>
            <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-red-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">

        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors mr-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span>Workspace</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="capitalize">{activeTab === "scanner" ? "Audit" : activeTab.replace("-", " ")}</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight capitalize">
              {activeTab === "scanner" ? "Audit Stock Opname" : activeTab.replace("-", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="Notifications">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
            </div>
            {activeTab === "inventory" ? (
              <button onClick={openAddModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-dark text-navy-800 text-sm font-semibold rounded-md transition-colors shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Barang Baru</span>
              </button>
            ) : activeTab === "requests" ? (
              <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-md shadow-sm">
                {requestList.length} Antrean
              </span>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" data-lenis-prevent>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            {activeTab === "dashboard" && (
              <DashboardTab inventoryList={inventoryList} dashboardStats={dashboardStats} sbaAlerts={sbaAlerts} historyList={historyList} activeLoansAdmin={activeLoansAdmin} />
            )}
            {activeTab === "scanner" && (
              <ScannerTab
                isScanning={isScanning} setIsScanning={setIsScanning} isLoadingScan={isLoadingScan}
                itemData={itemData} errorMsg={errorMsg} stokFisik={stokFisik} setStokFisik={setStokFisik}
                isSubmitting={isSubmitting} handleScanSuccess={handleScanSuccess}
                handleUpdateStok={handleUpdateStok} resetScanTampilan={resetScanTampilan}
              />
            )}
            {activeTab === "inventory" && (
              <InventoryTab
                filteredInventory={filteredInventory} isLoading={isLoadingInventory}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                onAdd={openAddModal} onEdit={openEditModal} onDelete={handleHapusBarang}
                onPrintQR={handlePrintQR}
                onPrintAllQR={() => printAllQR(inventoryList)}
                onPrintLocationList={() => printLocationList(inventoryList)}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab historyList={historyList} isLoading={isLoadingHistory} />
            )}
            {activeTab === "requests" && (
              <RequestsTab requestList={requestList} isLoading={isLoadingRequests} onSelesaikan={handleSelesaikanRequest} onHapus={handleHapusRequest} />
            )}
          </div>
        </main>
      </div>

      <ItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSimpanBarang}
        editId={editId}
        formData={formData}
        setFormData={setFormData}
        isBulk={isBulk}
        setIsBulk={setIsBulk}
        uom={uom}
        setUom={setUom}
        isSaving={isSavingItem}
        onGenerateUUID={handleGenerateUUID}
      />

      {/* Bulk print QR modal */}
      {bulkPrintTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setBulkPrintTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h2v2h-2zM18 14h3M14 18h1M17 18h4M17 21h3M14 21h1" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-900 font-bold text-base leading-tight">Cetak QR — Bulk Item</h3>
                <p className="text-slate-500 text-sm mt-0.5 line-clamp-1" title={bulkPrintTarget.item.part_name}>
                  {bulkPrintTarget.item.part_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5 p-3 bg-violet-50 border border-violet-100 rounded-xl">
              <span className="text-violet-600 text-xs font-semibold">Total stok:</span>
              <span className="text-violet-900 text-xs font-bold tabular-nums">{bulkPrintTarget.item.quantity} {bulkPrintTarget.item.uom}</span>
              <span className="ml-auto text-violet-400 text-[10px]">(ditampung dalam beberapa wadah)</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah QR yang akan dicetak</label>
              <input
                type="number" min={1} max={999} value={bulkPrintTarget.count} autoFocus
                onChange={(e) => {
                  const val = Math.max(1, Math.min(999, Number(e.target.value) || 1));
                  setBulkPrintTarget(prev => prev ? { ...prev, count: val } : null);
                }}
                className="w-full px-4 py-2.5 text-slate-900 font-semibold text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all tabular-nums"
                placeholder="Contoh: 3"
              />
              <p className="mt-1.5 text-xs text-slate-400">Misal: 75 liter di 3 jirigen → masukkan 3</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setBulkPrintTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Batal
              </button>
              <button
                onClick={() => { void printSingleQR(bulkPrintTarget.item, bulkPrintTarget.count); setBulkPrintTarget(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v8H6z" />
                </svg>
                Cetak {bulkPrintTarget.count} QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
