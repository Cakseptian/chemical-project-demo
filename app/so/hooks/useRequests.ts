"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ItemRequest } from "../types";

export const useRequests = () => {
  const [requestList, setRequestList] = useState<ItemRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchRequests = async () => {
    setIsLoadingData(true);
    const { data } = await supabase
      .from("item_requests")
      .select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });
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

  return {
    requestList,
    setRequestList,
    isLoadingData,
    fetchRequests,
    handleSelesaikanRequest,
    handleHapusRequest,
  };
};