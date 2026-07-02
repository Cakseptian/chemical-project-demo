"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Warning } from "@phosphor-icons/react";
import { useUserProfile } from "./hooks/useUserProfile";
import { useCart } from "./hooks/useCart";
import { useScanner } from "./hooks/useScanner";
import { useActiveLoans } from "./hooks/useActiveLoans";
import { useTeamActivities } from "./hooks/useTeamActivities";
import { useRequest } from "./hooks/useRequest";
import { useSearch } from "./hooks/useSearch";

import { HomeHeader } from "./components/home/HomeHeader";
import { HeroScanner } from "./components/home/HeroScanner";
import { QuickActions } from "./components/home/QuickActions";
import { ActiveBorrows } from "./components/home/ActiveBorrows";
import { TeamFeed } from "./components/home/TeamFeed";
import { FloatingCartBar } from "./components/home/FloatingCartBar";

import { CartDrawer } from "./components/modals/CartDrawer";
import { SearchModal } from "./components/modals/SearchModal";
import { ReturnModal } from "./components/modals/ReturnModal";
import { RequestModal } from "./components/modals/RequestModal";

import type { ToastType } from "./hooks/useCart";

// ── Toast icon helpers ──────────────────────────────────────────────────────
const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "success") return <CheckCircle weight="fill" className="w-4 h-4 shrink-0" />;
  if (type === "error") return <XCircle weight="fill" className="w-4 h-4 shrink-0" />;
  return <Warning weight="fill" className="w-4 h-4 shrink-0" />;
};

const toastColors: Record<ToastType, string> = {
  success: "bg-[#001e2b] text-white border-[#00ed64]/40",
  error: "bg-red-600 text-white border-red-400/40",
  warning: "bg-amber-500 text-white border-amber-300/40",
};

export default function Home() {
  // ── Profile state ─────────────────────────────────────────────────────
  const profile = useUserProfile();
  const [editingProfile, setEditingProfile] = useState(false);

  // Show edit form on first load if profile is incomplete
  useEffect(() => {
    if (!profile.isProfileComplete) setEditingProfile(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data hooks ────────────────────────────────────────────────────────
  const teamFeed = useTeamActivities();
  const search = useSearch();
  const request = useRequest();

  const loans = useActiveLoans(
    profile.nomorPegawai,
    profile.namaPeminjam,
    teamFeed.fetchTeamActivities
  );

  const cart = useCart(profile.namaPeminjam, profile.nomorPegawai, () => {
    teamFeed.fetchTeamActivities();
    loans.fetchLoans();
  });

  const scanner = useScanner(cart.addToCart);

  // ── Side effects ──────────────────────────────────────────────────────
  useEffect(() => {
    teamFeed.fetchTeamActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (request.showReqModal) request.handleCloseReqModal();
        if (search.showSearchModal) search.setShowSearchModal(false);
        if (loans.showReturnModal) loans.setShowReturnModal(false);
        if (cart.showCartDrawer) cart.setShowCartDrawer(false);
        if (editingProfile) setEditingProfile(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request.showReqModal, search.showSearchModal, loans.showReturnModal, cart.showCartDrawer, editingProfile]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <HomeHeader namaPeminjam={profile.namaPeminjam} />

      <main className="flex-1 pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* Welcome line */}
          <div className="mb-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-normal">
              Hello, {profile.namaPeminjam.trim() ? profile.namaPeminjam.split(" ")[0] : "Mechanic"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Selamat datang di sistem inventori GMF.
            </p>
          </div>

          {/* ── Identity Panel ───────────────────────────────────────── */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 [animation-delay:70ms] fill-mode-both">
            {profile.isProfileComplete && !editingProfile ? (
              /* Compact identity strip */
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#001e2b] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#00ed64] uppercase">
                    {profile.namaPeminjam.trim().charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate leading-none">{profile.namaPeminjam}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.nomorPegawai}</p>
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-slate-50"
                >
                  Edit
                </button>
              </div>
            ) : (
              /* Full identity form */
              <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Employee ID *</label>
                    <input
                      type="text"
                      placeholder="Contoh: 512345"
                      value={profile.nomorPegawai}
                      onChange={(e) => profile.setNomorPegawai(e.target.value)}
                      className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Peminjam *</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap Anda"
                      value={profile.namaPeminjam}
                      onChange={(e) => profile.setNamaPeminjam(e.target.value)}
                      className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {!profile.isProfileComplete ? (
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <Warning weight="fill" className="w-3 h-3 shrink-0" />
                      Wajib diisi untuk meminjam dan melihat pinjaman aktif.
                    </p>
                  ) : (
                    <span />
                  )}
                  {profile.isProfileComplete && editingProfile && (
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 [animation-delay:140ms] fill-mode-both">
            <HeroScanner
              isScanning={scanner.isScanning}
              setIsScanning={scanner.setIsScanning}
              isLoading={scanner.isLoading}
              errorMsg={scanner.errorMsg}
              setErrorMsg={scanner.setErrorMsg}
              onScanSuccess={scanner.handleScanSuccess}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 [animation-delay:210ms] fill-mode-both">
            <QuickActions
              onReturn={loans.openReturnModal}
              onFindLocation={search.openSearchModal}
              onRequest={() => request.setShowReqModal(true)}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 [animation-delay:280ms] fill-mode-both">
            <ActiveBorrows
              activeLoans={loans.activeLoans}
              nomorPegawai={profile.nomorPegawai}
              onManageAll={loans.openReturnModal}
              onQuickReturn={loans.quickReturn}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 [animation-delay:350ms] fill-mode-both">
            <TeamFeed
              teamActivities={teamFeed.teamActivities}
              isLoadingTeam={teamFeed.isLoadingTeam}
              onRefresh={teamFeed.fetchTeamActivities}
            />
          </div>

          <div className="h-8" />
        </div>
      </main>

      <FloatingCartBar cartLength={cart.cart.length} onOpen={() => cart.setShowCartDrawer(true)} />

      {/* ── Modals ──────────────────────────────────────────────── */}
      <CartDrawer
        isOpen={cart.showCartDrawer}
        onClose={() => cart.setShowCartDrawer(false)}
        cart={cart.cart}
        isSubmitting={cart.isSubmitting}
        nomorPegawai={profile.nomorPegawai}
        namaPeminjam={profile.namaPeminjam}
        onUpdateQuantity={cart.updateQuantity}
        onUpdateBulkQty={cart.updateBulkQty}
        onRemoveFromCart={cart.removeFromCart}
        onReset={cart.resetCart}
        onCheckout={cart.checkout}
        onAddMore={() => { cart.setShowCartDrawer(false); scanner.setIsScanning(true); }}
      />

      <SearchModal
        isOpen={search.showSearchModal}
        onClose={() => search.setShowSearchModal(false)}
        searchQuery={search.searchQuery}
        setSearchQuery={search.setSearchQuery}
        isSearchingDb={search.isSearchingDb}
        filteredItems={search.filteredItems}
      />

      <ReturnModal
        isOpen={loans.showReturnModal}
        onClose={() => loans.setShowReturnModal(false)}
        activeLoans={loans.activeLoans}
        isFetchingLoans={loans.isFetchingLoans}
        isReturning={loans.isReturning}
        onProsesReturn={loans.prosesReturn}
      />

      <RequestModal
        isOpen={request.showReqModal}
        onClose={request.handleCloseReqModal}
        reqData={request.reqData}
        setReqData={request.setReqData}
        errors={request.errors}
        setErrors={request.setErrors}
        isSubmittingReq={request.isSubmittingReq}
        namaInputRef={request.namaInputRef}
        onSubmit={request.handleSubmitRequest}
      />

      {/* ── Toast notifications ──────────────────────────────── */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
        {cart.toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold animate-in slide-in-from-bottom-2 duration-300 ${toastColors[toast.type]}`}
          >
            <ToastIcon type={toast.type} />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => cart.dismissToast(toast.id)}
              className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
              aria-label="Tutup notifikasi"
            >
              <XCircle weight="fill" className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
