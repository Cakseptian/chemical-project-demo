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

          {/* Welcome + Profile Inputs */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-normal">
                Hello, {profile.namaPeminjam.trim() ? profile.namaPeminjam.split(" ")[0] : "Mechanic"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Ada yang bisa kami bantu untuk inventory hari ini?
              </p>
            </div>
            <div className="flex gap-2 sm:max-w-sm">
              <input
                type="text"
                placeholder="Employee ID"
                value={profile.nomorPegawai}
                onChange={(e) => profile.setNomorPegawai(e.target.value)}
                className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00ed64] focus:ring-2 focus:ring-[#00ed64]/10 transition-all shadow-sm"
              />
              <input
                type="text"
                placeholder="Nama Anda"
                value={profile.namaPeminjam}
                onChange={(e) => profile.setNamaPeminjam(e.target.value)}
                className="w-36 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00ed64] focus:ring-2 focus:ring-[#00ed64]/10 transition-all shadow-sm"
              />
            </div>
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