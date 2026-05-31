"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TransactionLog } from "../types";

export const useHistory = () => {
  const [historyList, setHistoryList] = useState<TransactionLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setHistoryList(data);
    setIsLoadingData(false);
  };

  return {
    historyList,
    setHistoryList,
    isLoadingData,
    fetchHistory,
  };
};