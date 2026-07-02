"use client";
import { useEffect } from "react";
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

export default function Home() {
  // ========== HOOKS ==========
  const profile = useUserProfile();
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

  // ========== SIDE EFFECTS ==========
  useEffect(() => {
    teamFeed.fetchTeamActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global escape key handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (request.showReqModal) request.handleCloseReqModal();
        if (search.showSearchModal) search.setShowSearchModal(false);
        if (loans.showReturnModal) loans.setShowReturnModal(false);
        if (cart.showCartDrawer) cart.setShowCartDrawer(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request.showReqModal, search.showSearchModal, loans.showReturnModal, cart.showCartDrawer]);

  // ========== RENDER ==========
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <HomeHeader namaPeminjam={profile.namaPeminjam} />

      <main className="flex-1 pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-normal">
              Hello, {profile.namaPeminjam.trim() ? profile.namaPeminjam.split(" ")[0] : "Mechanic"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Ada yang bisa kami bantu untuk inventory hari ini?
            </p>
          </div>

          {/* Identification Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Employee ID *</label>
                <input
                  type="text"
                  placeholder="Contoh: 512345"
                  value={profile.nomorPegawai}
                  onChange={(e) => profile.setNomorPegawai(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Peminjam *</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Anda"
                  value={profile.namaPeminjam}
                  onChange={(e) => profile.setNamaPeminjam(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all"
                />
              </div>
            </div>
            {(!profile.nomorPegawai.trim() || !profile.namaPeminjam.trim()) && (
              <p className="text-[10px] text-amber-600 font-semibold mt-3 flex items-center gap-1 animate-pulse">
                <span>⚠️</span> Lengkapi Employee ID & Nama Anda untuk meminjam barang dan melihat daftar pinjaman aktif.
              </p>
            )}
          </div>

          <HeroScanner
            isScanning={scanner.isScanning}
            setIsScanning={scanner.setIsScanning}
            isLoading={scanner.isLoading}
            errorMsg={scanner.errorMsg}
            setErrorMsg={scanner.setErrorMsg}
            onScanSuccess={scanner.handleScanSuccess}
          />

          <QuickActions
            onReturn={loans.openReturnModal}
            onFindLocation={search.openSearchModal}
            onRequest={() => request.setShowReqModal(true)}
          />

          <ActiveBorrows
            activeLoans={loans.activeLoans}
            nomorPegawai={profile.nomorPegawai}
            onManageAll={loans.openReturnModal}
            onQuickReturn={loans.quickReturn}
          />

          <TeamFeed
            teamActivities={teamFeed.teamActivities}
            isLoadingTeam={teamFeed.isLoadingTeam}
            onRefresh={teamFeed.fetchTeamActivities}
          />

          <div className="h-8"></div>
        </div>
      </main>

      <FloatingCartBar cartLength={cart.cart.length} onOpen={() => cart.setShowCartDrawer(true)} />

      {/* ========== MODALS ========== */}
      <CartDrawer
        isOpen={cart.showCartDrawer}
        onClose={() => cart.setShowCartDrawer(false)}
        cart={cart.cart}
        isSubmitting={cart.isSubmitting}
        nomorPegawai={profile.nomorPegawai}
        setNomorPegawai={profile.setNomorPegawai}
        namaPeminjam={profile.namaPeminjam}
        setNamaPeminjam={profile.setNamaPeminjam}
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
    </div>
  );
}