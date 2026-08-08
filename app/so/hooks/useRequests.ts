"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ItemRequest } from "../types";

export const useRequests = () => {
  const [requestList, setRequestList] = useState<ItemRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchRequests = async () => {
    setIsLoadingData(true);
    try {
      const { data } = await supabase
        .from("item_requests")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });
      if (data) setRequestList(data);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelesaikanRequest = async (id: number, namaBarang: string) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      alert("⚠️ Demo Mode — Aksi ini tidak tersedia di demo.");
      return;
    }
    const isConfirm = window.confirm(`Tandai request "${namaBarang}" sebagai SELESAI?`);
    try {
      const { error } = await supabase.from("item_requests").update({ status: 'SELESAI' }).eq("id", id);
      if (error) throw error;
      fetchRequests();
    } catch (err) {
      alert("Gagal mengupdate status request.");
    }
  };

  const handleHapusRequest = async (id: number) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      alert("⚠️ Demo Mode — Aksi ini tidak tersedia di demo.");
      return;
    }
    try {
      await supabase.from("item_requests").delete().eq("id", id);
      fetchRequests();
    } catch (err) {
      alert("Gagal menghapus request.");
    }
  };

  return {
    requestList,
    setRequestList,
    isLoadingData,
    fetchRequests,
    handleSelesaikanRequest,
    handleHapusRequest,
  };
};