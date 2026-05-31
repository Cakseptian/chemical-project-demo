"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useHistory } from "./hooks/useHistory";
import { useRequests } from "./hooks/useRequests";
import { useScanner } from "./hooks/useScanner";
import { useDashboardStats } from "./hooks/useDashboardStats";
import { useSBAAlerts } from "./hooks/useSBAAlerts";
import { printSingleQR, printAllQR, printLocationList } from "./utils/printUtils";
import { NavItem } from "./components/layout/NavItem";
import { ItemModal } from "./components/modals/ItemModal";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { ScannerTab } from "./components/tabs/ScannerTab";
import { InventoryTab } from "./components/tabs/InventoryTab";
import { HistoryTab } from "./components/tabs/HistoryTab";
import { RequestsTab } from "./components/tabs/RequestsTab";

export default function AdminDashboard() {
  const {
    isAuthenticated,
    pinInput,
    setPinInput,
    showPin,
    setShowPin,
    isWrongPin,
    setIsWrongPin,
    isLoginLoading,
    handleLoginAdmin,
    handleLogoutAdmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const {
    historyList,
    isLoadingData: isLoadingHistory,
    fetchHistory,
  } = useHistory();

  const {
    requestList,
    isLoadingData: isLoadingRequests,
    fetchRequests,
    handleSelesaikanRequest,
    handleHapusRequest,
  } = useRequests();

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

  const dashboardStats = useDashboardStats(inventoryList, historyList, requestList);
  const sbaAlerts = useSBAAlerts(inventoryList, historyList);

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
          <NavItem
            id="dashboard"
            icon={<img src="/icons/icons8-chart-100.png" className="w-6 h-6" alt="dashboard" />}
            label="Overview"
            isActive={activeTab === "dashboard"}
            onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
          />
          <NavItem
            id="scanner"
            icon={<img src="/icons/icons8-camera-100.png" className="w-6 h-6" alt="audit" />}
            label="Audit (SO)"
            isActive={activeTab === "scanner"}
            onClick={() => { setActiveTab("scanner"); setIsSidebarOpen(false); }}
          />
          <NavItem
            id="inventory"
            icon={<img src="/icons/icons8-box-128.png" className="w-6 h-6" alt="inventory" />}
            label="Master Stock"
            isActive={activeTab === "inventory"}
            onClick={() => { setActiveTab("inventory"); setIsSidebarOpen(false); }}
          />
          <NavItem
            id="history"
            icon={<img src="/icons/icons8-activity-history-100.png" className="w-6 h-6" alt="history" />}
            label="Log History"
            isActive={activeTab === "history"}
            onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
          />
          <NavItem
            id="requests"
            icon={<img src="/icons/icons8-inbox-100.png" className="w-6 h-6" alt="requests" />}
            label="Request Queue"
            isActive={activeTab === "requests"}
            onClick={() => { setActiveTab("requests"); setIsSidebarOpen(false); }}
          />
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
            {activeTab === "dashboard" && (
              <DashboardTab
                inventoryList={inventoryList}
                dashboardStats={dashboardStats}
                sbaAlerts={sbaAlerts}
              />
            )}

            {activeTab === "scanner" && (
              <ScannerTab
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                isLoadingScan={isLoadingScan}
                itemData={itemData}
                errorMsg={errorMsg}
                stokFisik={stokFisik}
                setStokFisik={setStokFisik}
                isSubmitting={isSubmitting}
                handleScanSuccess={handleScanSuccess}
                handleUpdateStok={handleUpdateStok}
                resetScanTampilan={resetScanTampilan}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                filteredInventory={filteredInventory}
                isLoading={isLoadingInventory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAdd={openAddModal}
                onEdit={openEditModal}
                onDelete={handleHapusBarang}
                onPrintQR={printSingleQR}
                onPrintAllQR={() => printAllQR(inventoryList)}
                onPrintLocationList={() => printLocationList(inventoryList)}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab
                historyList={historyList}
                isLoading={isLoadingHistory}
              />
            )}

            {activeTab === "requests" && (
              <RequestsTab
                requestList={requestList}
                isLoading={isLoadingRequests}
                onSelesaikan={handleSelesaikanRequest}
                onHapus={handleHapusRequest}
              />
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
    </div>
  );
}
