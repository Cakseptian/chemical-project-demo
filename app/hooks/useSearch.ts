"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { InventoryItemPublic } from "../types";

export const useSearch = () => {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [inventoryDb, setInventoryDb] = useState<InventoryItemPublic[]>([]);
    const [isSearchingDb, setIsSearchingDb] = useState(false);

    const openSearchModal = async () => {
        setShowSearchModal(true);
        setIsSearchingDb(true);
        setSearchQuery("");
        try {
            const { data, error } = await supabase
                .from("inventory")
                .select("*")
                .order("part_name", { ascending: true });
            if (error) throw error;
            if (data) setInventoryDb(data as InventoryItemPublic[]);
        } catch (err) {
            console.error("Gagal menarik data untuk pencarian", err);
        } finally {
            setIsSearchingDb(false);
        }
    };

    const filteredItems = useMemo(
        () =>
            inventoryDb.filter(
                (item) =>
                    item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.part_number && item.part_number.toLowerCase().includes(searchQuery.toLowerCase()))
            ),
        [inventoryDb, searchQuery]
    );

    return {
        showSearchModal,
        setShowSearchModal,
        searchQuery,
        setSearchQuery,
        inventoryDb,
        isSearchingDb,
        filteredItems,
        openSearchModal,
    };
};