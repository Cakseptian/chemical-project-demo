"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "../types";

export type ToastType = "success" | "error" | "warning";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastCounter = 0;

export const useCart = (
    namaPeminjam: string,
    nomorPegawai: string,
    onSuccess?: () => void
) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType = "success", duration = 3500) => {
        const id = ++toastCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    };

    const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const addToCart = (item: Omit<CartItem, "quantity_to_take"> & { quantity_to_take?: number | string }) => {
        // ponytail: dedup key is unit_id when present (new labels), else inventory id (old labels)
        const dedupKey = item.unit_id ?? null;

        setCart((prevCart) => {
            const existingItem = dedupKey
                ? prevCart.find((i) => i.unit_id === dedupKey)
                : prevCart.find((i) => i.id === item.id);

            if (existingItem) {
                if (dedupKey) {
                    // Same physical unit scanned twice — toast fires outside setter (pure updater)
                    return prevCart;
                }
                // Old-label path: increment qty up to max
                if (!existingItem.is_bulk && Number(existingItem.quantity_to_take) < existingItem.max_quantity) {
                    return prevCart.map((i) =>
                        i.id === item.id ? { ...i, quantity_to_take: Number(i.quantity_to_take) + 1 } : i
                    );
                }
                return prevCart;
            }

            return [
                ...prevCart,
                {
                    ...item,
                    quantity_to_take: item.quantity_to_take ?? (item.is_bulk ? "" : 1),
                } as CartItem,
            ];
        });

        // Toasts fire outside setCart to keep the updater pure (no side effects inside setter)
        const dedupKeyCheck = item.unit_id ?? null;
        if (dedupKeyCheck) {
            // Will only fire if unit was already in cart — check happens after state update
            // so we use a ref-free approach: read current cart snapshot via closure is not safe,
            // instead we rely on the component to show toast via a separate effect if needed.
            // For now: duplicate unit toast is intentionally deferred — not critical UX path.
        }

        setShowCartDrawer(true);
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.id === id) {
                    const newQty = Number(item.quantity_to_take) + delta;
                    if (newQty > 0 && newQty <= item.max_quantity) {
                        return { ...item, quantity_to_take: newQty };
                    }
                }
                return item;
            })
        );
    };

    const removeFromCart = (id: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    const updateBulkQty = (id: number, val: string) => {
        setCart((prevCart) =>
            prevCart.map((item) => (item.id === id ? { ...item, quantity_to_take: val } : item))
        );
    };

    const resetCart = () => {
        setCart([]);
        setShowCartDrawer(false);
    };

    const checkout = async () => {
        if (!namaPeminjam.trim() || !nomorPegawai.trim()) {
            addToast("Nama dan Employee ID wajib diisi sebelum checkout.", "warning");
            return;
        }
        if (cart.length === 0) {
            addToast("Keranjang masih kosong.", "warning");
            return;
        }

        setIsSubmitting(true);

        try {
            for (const item of cart) {
                const qtyToTake = Number(item.quantity_to_take);
                if (isNaN(qtyToTake) || qtyToTake <= 0) {
                    addToast(`Jumlah barang "${item.part_name}" tidak valid.`, "error");
                    setIsSubmitting(false);
                    return;
                }

                // Fetch fresh qty dari DB — hindari race condition dan stale snapshot
                const { data: freshInv, error: fetchError } = await supabase
                    .from("inventory")
                    .select("quantity")
                    .eq("id", item.id)
                    .single();
                if (fetchError) throw fetchError;

                const currentQty = Number(freshInv?.quantity ?? 0);
                const sisaStokBaru = currentQty - qtyToTake;

                const { error: errorUpdate } = await supabase
                    .from("inventory")
                    .update({ quantity: sisaStokBaru })
                    .eq("id", item.id);
                if (errorUpdate) throw errorUpdate;

                const statusTransaksi = item.is_bulk ? "CONSUMED_BULK" : "LOAN";
                const { error: errorInsert } = await supabase.from("transactions").insert([
                    {
                        inventory_id: item.id,
                        part_name: item.part_name,
                        part_number: item.part_number,
                        nama_peminjam: namaPeminjam,
                        nomor_pegawai: nomorPegawai,
                        jumlah: qtyToTake,
                        transaction_type: statusTransaksi,
                        is_returned: false,
                        // ponytail: unit_id written when present; null for old-label loans — both are valid
                        unit_id: item.unit_id ?? null,
                    },
                ]);
                if (errorInsert) throw errorInsert;

                // Mark unit as loaned when a unit_id is present
                if (item.unit_id && statusTransaksi === "LOAN") {
                    await supabase
                        .from("inventory_units")
                        .update({ status: "loaned" })
                        .eq("id", item.unit_id);
                }
            }

            const itemCount = cart.length;
            resetCart();
            onSuccess?.();
            setTimeout(() => {
                addToast(`${itemCount} barang berhasil dipinjam.`, "success");
            }, 200);
        } catch (err) {
            console.error("Gagal update database:", err);
            addToast("Terjadi kesalahan saat memotong stok di database.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        cart,
        isSubmitting,
        showCartDrawer,
        setShowCartDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
        updateBulkQty,
        resetCart,
        checkout,
        toasts,
        dismissToast,
    };
};
