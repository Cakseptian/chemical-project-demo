"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "../types";

export const useCart = (
    namaPeminjam: string,
    nomorPegawai: string,
    onSuccess?: () => void
) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCartDrawer, setShowCartDrawer] = useState(false);

    const addToCart = (item: Omit<CartItem, "quantity_to_take"> & { quantity_to_take?: number | string }) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((i) => i.id === item.id);

            if (existingItem) {
                if (!existingItem.is_bulk && Number(existingItem.quantity_to_take) < existingItem.max_quantity) {
                    return prevCart.map((i) =>
                        i.id === item.id ? { ...i, quantity_to_take: Number(i.quantity_to_take) + 1 } : i
                    );
                } else {
                    if (!existingItem.is_bulk) {
                        alert(`⚠️ Stok maksimal ${item.part_name} di sistem hanya ${existingItem.max_quantity} unit!`);
                    }
                    return prevCart;
                }
            } else {
                return [
                    ...prevCart,
                    {
                        ...item,
                        quantity_to_take: item.quantity_to_take ?? (item.is_bulk ? "" : 1),
                    } as CartItem,
                ];
            }
        });
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
            alert("⚠️ Nama dan Nomor Pegawai wajib diisi!");
            return;
        }
        if (cart.length === 0) {
            alert("⚠️ Keranjang masih kosong!");
            return;
        }

        setIsSubmitting(true);

        try {
            for (const item of cart) {
                const qtyToTake = Number(item.quantity_to_take);
                if (isNaN(qtyToTake) || qtyToTake <= 0) {
                    alert(`⚠️ Jumlah barang "${item.part_name}" tidak valid!`);
                    setIsSubmitting(false);
                    return;
                }
                const sisaStokBaru = (item.max_quantity - qtyToTake).toString();

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
                    },
                ]);
                if (errorInsert) throw errorInsert;
            }

            alert(`✅ BERHASIL!\n\n${cart.length} jenis barang telah diproses.`);
            localStorage.setItem("gmf_nama", namaPeminjam);
            localStorage.setItem("gmf_id", nomorPegawai);
            resetCart();
            onSuccess?.();
        } catch (err) {
            console.error("Gagal update database:", err);
            alert("❌ Terjadi kesalahan saat memotong stok di database.");
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
    };
};