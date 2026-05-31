"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "../types";

export const useScanner = (onUpdateSuccess: () => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [itemData, setItemData] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stokFisik, setStokFisik] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setIsLoadingScan(true);
    setErrorMsg(null);
    setItemData(null);
    setStokFisik("");

    let finalBarcodeId = decodedText;
    if (decodedText.includes("?scan=")) {
      finalBarcodeId = decodedText.split("?scan=")[1];
    }

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("barcode_id", finalBarcodeId)
        .maybeSingle();
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
          transaction_type: "ADMIN_SO"
        }]);
      }
      alert(`✅ STOCK OPNAME BERHASIL!\nStok ${itemData.part_name} diperbarui menjadi ${qtyFisikReal}.`);
      resetScanTampilan();
      onUpdateSuccess();
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

  return {
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
  };
};