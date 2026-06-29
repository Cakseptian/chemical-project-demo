"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryItem, InventoryFormData } from "../types";

export const useInventory = () => {
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isBulk, setIsBulk] = useState<boolean>(false);
  const [uom, setUom] = useState<string>("Pieces");
  const [formData, setFormData] = useState<InventoryFormData>({
    part_name: "",
    part_number: "",
    location: "",
    quantity: "",
    barcode_id: "",
    expired_date_fixed: "",
    batch_number: "",
    isBulk: false,
    uom: "Pieces",
    rack_type: "NEW",
    document_url: "",
  });

  const fetchInventory = async () => {
    setIsLoadingData(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("part_name", { ascending: true });
    if (!error && data) setInventoryList(data);
    setIsLoadingData(false);
  };

  const handleHapusBarang = async (id: number, namaBarang: string) => {
    const isConfirm = window.confirm(`⚠️ YAKIN INGIN MENGHAPUS "${namaBarang}"?\n\nSemua data barang ini akan hilang dari sistem.`);
    if (!isConfirm) return;
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      alert(`🗑️ Barang "${namaBarang}" berhasil dihapus.`);
      fetchInventory();
    } catch (err: any) {
      if (err.code === '23503') {
        alert(`❌ GAGAL MENGHAPUS!\n\nBarang "${namaBarang}" memiliki riwayat transaksi/peminjaman.\n\nSistem mengunci penghapusan agar riwayat tidak rusak.`);
      } else {
        alert("❌ Terjadi kesalahan saat menghapus barang.");
      }
    }
  };

  const handleGenerateUUID = () => {
    setFormData({ ...formData, barcode_id: crypto.randomUUID() });
  };

  const openAddModal = () => {
    setEditId(null);
    setIsBulk(false);
    setUom("Pieces");
    setFormData({
      part_name: "",
      part_number: "",
      location: "",
      quantity: "",
      barcode_id: "",
      expired_date_fixed: "",
      batch_number: "",
      isBulk: false,
      uom: "Pieces",
      rack_type: "NEW",
      document_url: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditId(item.id);
    setIsBulk(item.is_bulk || false);
    setUom(item.uom || "Pieces");
    setFormData({
      part_name: item.part_name,
      part_number: item.part_number || "",
      location: item.location || "",
      quantity: item.quantity ? item.quantity.toString() : "",
      barcode_id: item.barcode_id,
      expired_date_fixed: item.expired_date_fixed || "",
      batch_number: item.batch_number || "",
      isBulk: item.is_bulk || false,
      uom: item.uom || "Pieces",
      rack_type: item.rack_type || "NEW",
      document_url: item.document_url || "",
    });
    setShowAddModal(true);
  };

  const handleSimpanBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.part_name || !formData.barcode_id || !formData.quantity) {
      return alert("⚠️ Nama Barang, Barcode ID, dan Stok wajib diisi!");
    }
    setIsSavingItem(true);
    try {
      if (editId) {
        const { error } = await supabase.from("inventory").update({
          part_name: formData.part_name,
          part_number: formData.part_number,
          location: formData.location,
          quantity: formData.quantity.toString(),
          barcode_id: formData.barcode_id,
          expired_date_fixed: formData.expired_date_fixed || null,
          batch_number: formData.batch_number || null,
          is_bulk: isBulk,
          uom: uom,
          rack_type: formData.rack_type,
          document_url: formData.document_url || null,
        }).eq("id", editId);
        if (error) throw error;
        alert("✅ Data barang berhasil diubah!");
      } else {
        const { error } = await supabase.from("inventory").insert([{
          part_name: formData.part_name,
          part_number: formData.part_number,
          location: formData.location,
          quantity: formData.quantity.toString(),
          barcode_id: formData.barcode_id,
          expired_date_fixed: formData.expired_date_fixed || null,
          batch_number: formData.batch_number || null,
          is_bulk: isBulk,
          uom: uom,
          rack_type: formData.rack_type,
          document_url: formData.document_url || null,
        }]);
        if (error) throw error;
        alert("✅ Barang baru berhasil ditambahkan!");
      }
      setShowAddModal(false);
      fetchInventory();
    } catch (err: any) {
      if (err.code === '23505') alert("❌ Barcode ID sudah terdaftar di barang lain!");
      else alert("❌ Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSavingItem(false);
    }
  };

  const filteredInventory = inventoryList.filter(item =>
    item.part_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.part_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    inventoryList,
    setInventoryList,
    isLoadingData,
    searchQuery,
    setSearchQuery,
    fetchInventory,
    handleHapusBarang,
    filteredInventory,
    // Modal
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
  };
};