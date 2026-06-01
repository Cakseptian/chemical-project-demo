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
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    signInWithGoogle,
    signOut,
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
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#001e2b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-[#001e2b] font-inter">
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          
          .font-inter {
            font-family: 'Inter', system-ui, sans-serif;
          }

          /* Solid dark navy untuk left side */
          .dark-navy {
            background: #001e2b;
          }

          /* Subtle grid pattern untuk left side */
          .grid-pattern {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
          }

          /* Clean white dengan subtle texture untuk right side */
          .clean-white {
            background: #f8fafc;
            background-image:
              radial-gradient(at 20% 80%, rgba(0, 237, 100, 0.03) 0px, transparent 50%),
              radial-gradient(at 80% 20%, rgba(59, 130, 246, 0.02) 0px, transparent 50%);
          }

          /* Floating animation */
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          .float-slow, .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
          }
          .float-medium, .animate-float-medium {
            animation: float-medium 5s ease-in-out infinite 1s;
          }

          /* Fade in animation */
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-up, .animate-fade-up {
            animation: fade-up 0.6s ease-out forwards;
          }
          .fade-up-delay-1, .animate-fade-up-delay-1 {
            animation: fade-up 0.6s ease-out 0.1s forwards;
            opacity: 0;
          }
          .fade-up-delay-2, .animate-fade-up-delay-2 {
            animation: fade-up 0.6s ease-out 0.2s forwards;
            opacity: 0;
          }

          /* Mini chart bars */
          @keyframes bar-grow {
            from { height: 20%; }
            to { height: var(--bar-height); }
          }
          .bar-animated {
            animation: bar-grow 1.5s ease-out forwards;
          }
        `}} />

        {/* LEFT SIDE: DARK NAVY + ILLUSTRATION */}
        <div className="hidden lg:flex lg:w-1/2 dark-navy grid-pattern relative overflow-hidden flex-col justify-between p-12 xl:p-16">
          {/* Decorative orbs (subtle) */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#00ed64]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

          {/* Top: Logo */}
          <div className="relative z-10 fade-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#00ed64] rounded-xl flex items-center justify-center shadow-lg shadow-[#00ed64]/30">
                <svg className="w-6 h-6 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-black text-xl tracking-tight">GMF Inventory</h1>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">Control System</p>
              </div>
            </div>
          </div>

          {/* Middle: Main Content */}
          <div className="relative z-10 space-y-8 fade-up-delay-1">
            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-white text-4xl xl:text-5xl font-black tracking-tight leading-[1.1]">
                Smart forecasting<br />
                for <span className="text-[#00ed64]">intermittent</span><br />
                demand patterns.
              </h2>

              <p className="text-white/60 text-base leading-relaxed max-w-md">
                Real-time inventory tracking dengan SBA (Syntetos-Boylan) algorithm untuk chemical dan spare parts aviation.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 fade-up-delay-2">
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs font-bold">🧠 SBA Forecast</span>
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs font-bold">📷 QR Tracking</span>
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs font-bold">⚡ Real-time</span>
            </div>
          </div>

          {/* Floating Dashboard Mockup */}
          <div className="relative z-10 mt-12 fade-up-delay-2">
            {/* Main card: SBA Forecast Table */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl shadow-black/50 float-slow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center">
                    <span className="text-purple-300 text-sm">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-wider">SBA Smart Forecast</h3>
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">α = 0.30 • 21 weeks</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-500/70 rounded-full"></div>
                  <div className="w-2 h-2 bg-amber-500/70 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500/70 rounded-full"></div>
                </div>
              </div>

              {/* Table rows mockup */}
              <div className="space-y-2">
                {/* Row 1: Reorder */}
                <div className="flex items-center justify-between p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-500/20 rounded flex items-center justify-center">
                      <span className="text-[10px] text-blue-300 font-mono font-black">A1</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Araldite 2011</p>
                      <p className="text-white/40 text-[9px] font-mono">17/21w active</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full text-[9px] font-black uppercase tracking-wider">Reorder</span>
                </div>

                {/* Row 2: Refill */}
                <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-purple-500/20 rounded flex items-center justify-center">
                      <span className="text-[10px] text-purple-300 font-mono font-black">S5</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Skydrol 500B</p>
                      <p className="text-white/40 text-[9px] font-mono">12/21w active</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[9px] font-black uppercase tracking-wider">Refill</span>
                </div>

                {/* Row 3: Aman */}
                <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#00ed64]/20 rounded flex items-center justify-center">
                      <span className="text-[10px] text-[#00ed64] font-mono font-black">M7</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Molykote 7</p>
                      <p className="text-white/40 text-[9px] font-mono">9/21w active</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-[9px] font-black uppercase tracking-wider">Aman</span>
                </div>
              </div>
            </div>

            {/* Floating stat card 1: Top right */}
            <div className="absolute -top-6 -right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl shadow-black/40 float-medium w-44">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">Total Items</span>
                <div className="w-6 h-6 bg-[#00ed64]/20 rounded flex items-center justify-center">
                  <span className="text-xs">📦</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white text-2xl font-black">{inventoryList.length || 58}</span>
                <span className="text-[#00ed64] text-xs font-bold flex items-center gap-0.5">
                  <span>▲</span> 12%
                </span>
              </div>
              {/* Mini chart */}
              <div className="flex items-end gap-0.5 h-6 mt-2">
                <div className="flex-1 bg-[#00ed64]/40 rounded-sm bar-animated" style={{ '--bar-height': '40%' } as React.CSSProperties}></div>
                <div className="flex-1 bg-[#00ed64]/50 rounded-sm bar-animated" style={{ '--bar-height': '55%' } as React.CSSProperties}></div>
                <div className="flex-1 bg-[#00ed64]/60 rounded-sm bar-animated" style={{ '--bar-height': '35%' } as React.CSSProperties}></div>
                <div className="flex-1 bg-[#00ed64]/70 rounded-sm bar-animated" style={{ '--bar-height': '70%' } as React.CSSProperties}></div>
                <div className="flex-1 bg-[#00ed64]/80 rounded-sm bar-animated" style={{ '--bar-height': '50%' } as React.CSSProperties}></div>
                <div className="flex-1 bg-[#00ed64] rounded-sm bar-animated" style={{ '--bar-height': '90%' } as React.CSSProperties}></div>
              </div>
            </div>

            {/* Floating stat card 2: Bottom left */}
            <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl shadow-black/40 float-slow w-48">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 bg-purple-500/30 rounded flex items-center justify-center">
                  <span className="text-xs">🧠</span>
                </div>
                <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">Forecast Accuracy</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-2xl font-black">94.2</span>
                <span className="text-white/50 text-xs font-bold">%</span>
              </div>
              <p className="text-[#00ed64] text-[10px] font-bold mt-1">SBA vs Actual Demand</p>
            </div>
          </div>

          {/* Bottom: Footer */}
          <div className="relative z-10 flex items-center justify-between text-white/40 text-xs fade-up-delay-2">
            <p>© 2026 Septian Rizqi Arifandi</p>
          </div>
        </div>

        {/* RIGHT SIDE: CLEAN WHITE LOGIN FORM */}
        <div className="w-full lg:w-1/2 clean-white flex items-center justify-center p-6 sm:p-12 relative">
          {/* Subtle vertical divider line (desktop only) */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>

          <div className="w-full max-w-md relative z-10">
            {/* Mobile Logo (hidden desktop) */}
            <div className="lg:hidden mb-10 fade-up">
              <div className="flex items-center gap-3 justify-center mb-3">
                <div className="w-11 h-11 bg-[#00ed64] rounded-xl flex items-center justify-center shadow-lg shadow-[#00ed64]/20">
                  <svg className="w-5 h-5 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h1 className="text-[#001e2b] font-black text-xl tracking-tight">GMF Inventory</h1>
              </div>
              <p className="text-center text-slate-600 text-sm">Smart Inventory Management for Aviation MRO</p>
            </div>

            {/* Header */}
            <div className="mb-8 fade-up">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#00ed64]/10 border border-[#00ed64]/20 rounded-full mb-5">
                <svg className="w-3 h-3 text-[#00684a]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                <span className="text-[#00684a] text-[10px] font-black uppercase tracking-widest">Admin Portal</span>
              </div>

              <h2 className="text-[#001e2b] text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
                Welcome back.
              </h2>
              <p className="text-slate-600 text-sm">
                Sign in to access your admin dashboard and manage inventory forecasts.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold py-4 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 group fade-up-delay-1"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm">Continue with Google</span>
              <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Info box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl fade-up-delay-2">
              <div className="flex gap-3">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-900 text-xs font-bold mb-0.5">Secured by Google OAuth</p>
                  <p className="text-blue-700/80 text-xs">
                    Only authorized admin emails can access the dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-8 flex items-center justify-between text-xs fade-up-delay-2">
              <a href="/" className="text-slate-600 hover:text-[#00684a] font-semibold transition-colors">← Back to Home</a>
            </div>

            {/* Copyright */}
            <p className="text-center text-[10px] text-slate-500 mt-6 fade-up-delay-2">
              Powered by <span className="font-bold text-slate-700">Supabase</span> • <span className="font-bold text-slate-700">Next.js 15</span> • <span className="font-bold text-slate-700">Tailwind CSS</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-[#00ed64]/30">

      {/* SIDEBAR (Dark Navy - same as login page) */}
      {/* Overlay untuk Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Panel Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-navy-800 border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col h-full flex-shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
        
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-4">
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Workspace</p>
            <div className="space-y-0.5">
              <NavItem
                id="dashboard"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                }
                label="Overview"
                isActive={activeTab === "dashboard"}
                onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
              />
              <NavItem
                id="scanner"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                }
                label="Audit (SO)"
                isActive={activeTab === "scanner"}
                onClick={() => { setActiveTab("scanner"); setIsSidebarOpen(false); }}
              />
              <NavItem
                id="inventory"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                }
                label="Inventory"
                isActive={activeTab === "inventory"}
                onClick={() => { setActiveTab("inventory"); setIsSidebarOpen(false); }}
              />
              <NavItem
                id="history"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="History"
                isActive={activeTab === "history"}
                onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
              />
              <NavItem
                id="requests"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                }
                label="Requests Queue"
                isActive={activeTab === "requests"}
                onClick={() => { setActiveTab("requests"); setIsSidebarOpen(false); }}
              />
            </div>
          </div>
        </nav>

        {/* User Card */}
        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div
            onClick={signOut}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
            title="Keluar Sistem"
          >
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

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors mr-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
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
            {/* Search */}
            <div className="relative hidden md:block">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder={activeTab === "inventory" ? "Cari barang..." : "Search inventory..."}
                value={activeTab === "inventory" ? searchQuery : ""}
                onChange={activeTab === "inventory" ? (e) => setSearchQuery(e.target.value) : undefined}
                className="pl-9 pr-3 py-1.5 w-64 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">⌘K</kbd>
            </div>

            {/* Notification/Info badge */}
            <div className="relative">
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="Notifications">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
            </div>

            {/* Action buttons based on active tab */}
            {activeTab === "inventory" ? (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-dark text-navy-800 text-sm font-semibold rounded-md transition-colors shadow-sm"
              >
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            {activeTab === "dashboard" && (
              <DashboardTab
                inventoryList={inventoryList}
                dashboardStats={dashboardStats}
                sbaAlerts={sbaAlerts}
                historyList={historyList}
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
