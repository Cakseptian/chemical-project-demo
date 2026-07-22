// app/so/utils/printUtils.ts
import { supabase } from "@/lib/supabase";
import type { InventoryItem } from "../types";

const BASE_URL = "https://stock-opname-project-gmf.vercel.app";

// ==========================================
// SHARED STYLES
// ==========================================
const QR_STYLES = `
  :root { --box-w: 150px; --img-s: 90px; }
  body { font-family: system-ui, sans-serif; padding: 15px; background: #f1f5f9; margin: 0; }
  .grid-container { display: flex; flex-wrap: wrap; gap: 8px; }
  .label-box { 
    background: #fff; border: 1.5px solid #000; padding: 8px; width: var(--box-w);
    text-align: center; border-radius: 6px; page-break-inside: avoid; box-sizing: border-box;
  }
  h2 { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  p { margin: 0 0 4px; font-size: 9px; color: #333; font-weight: 600; line-height: 1.2; }
  img { width: var(--img-s); height: var(--img-s); margin: 4px auto; display: block; }
  .uuid { margin-top: 4px; font-family: monospace; font-size: 7px; color: #555; word-break: break-all; }
  
  .header { text-align: center; margin-bottom: 15px; }
  .print-btn { padding: 10px 20px; cursor: pointer; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
  
  /* Optimalisasi khusus saat dicetak agar lebih compact & hemat kertas */
  @media print {
    @page { margin: 5mm; }
    body { background: #fff; padding: 0; }
    .no-print { display: none !important; }
    .grid-container { gap: 2mm; }
    .label-box { border: 1px dashed #999; border-radius: 0; width: 176px; padding: 5px; }
    h2 { font-size: 13px; }
    p { font-size: 10px; margin: 0 0 3px; }
    img { width: 91px; height: 91px; margin: 3px auto; }
    .uuid { font-size: 7px; margin-top: 3px; }
  }
`;

const LOCATION_STYLES = `
  body { font-family: system-ui, sans-serif; padding: 15px; color: #1e293b; margin: 0; font-size: 12px; }
  .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
  .header p { margin: 4px 0 0; font-size: 10px; color: #64748b; font-weight: bold; }
  .location-section { margin-bottom: 15px; page-break-inside: avoid; }
  .location-title { background: #f1f5f9; padding: 6px 10px; font-size: 13px; font-weight: 800; border: 1px solid #000; border-bottom: none; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
  th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { font-size: 11px; }
  .expired-danger { color: #dc2626; font-weight: 800; }
  
  /* Optimalisasi tabel saat dicetak */
  @media print {
    @page { margin: 1cm; }
    .no-print { display: none !important; }
    body { padding: 0; font-size: 11px; }
    th, td { padding: 3px 6px; }
    .location-title { padding: 4px 8px; font-size: 12px; }
  }
`;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// ponytail: unit QR encodes the unit UUID; barcode_id fallback uses the old path
const generateUnitQRUrl = (unitId: string): string =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${BASE_URL}/?scan=${unitId}`)}`;

// ponytail: kept for printLocationList which doesn't create unit rows
const generateQRUrl = (barcodeId: string): string =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${BASE_URL}/?scan=${barcodeId}`)}`;

const generateUnitLabelHtml = (item: InventoryItem, unitId: string): string => `
  <div class="label-box">
    <h2 title="${item.part_name}">${item.part_name}</h2>
    <p>PN: ${item.part_number || "-"}</p>
    <img src="${generateUnitQRUrl(unitId)}" alt="QR" />
    <p>Batch: ${item.batch_number || "-"}</p>
    <p>Exp: ${item.expired_date_fixed || "-"}</p>
    <div class="uuid">${unitId.slice(0, 18)}…</div>
  </div>
`;

const openPrintWindow = (): Window | null => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup diblokir! Izinkan popup untuk situs ini.");
    return null;
  }
  return printWindow;
};

const writeAndClose = (printWindow: Window, title: string, styles: string, bodyContent: string) => {
  printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>${styles}</style>
        </head>
        <body>${bodyContent}</body>
      </html>
    `);
  printWindow.document.close();
};

// Insert N unit rows into inventory_units, return their UUIDs
const createUnitRows = async (inventoryId: number, qty: number): Promise<string[]> => {
  const rows = Array.from({ length: qty }, () => ({ inventory_id: inventoryId }));
  const { data, error } = await supabase
    .from("inventory_units")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data ?? []).map((r: { id: string }) => r.id);
};

// ==========================================
// MAIN EXPORT FUNCTIONS
// ==========================================

export const printSingleQR = async (item: InventoryItem, overrideQty?: number): Promise<void> => {
  if ((Number(item.quantity) || 0) <= 0) {
    return alert(`Stok "${item.part_name}" adalah 0, tidak ada stiker yang perlu dicetak.`);
  }

  const qty = overrideQty != null ? Math.max(1, overrideQty) : Math.max(1, Number(item.quantity) || 1);

  let unitIds: string[];
  try {
    unitIds = await createUnitRows(item.id, qty);
  } catch (err) {
    console.error("Gagal membuat unit rows:", err);
    alert("Gagal menyimpan unit ke database. Coba lagi.");
    return;
  }

  const printWindow = openPrintWindow();
  if (!printWindow) return;

  const itemsHtml = unitIds.map((uid) => generateUnitLabelHtml(item, uid)).join("");

  const bodyContent = `
      <div class="header no-print">
        <h1>Cetak ${qty} Stiker untuk ${item.part_name}</h1>
        <p>Pastikan gambar QR Code sudah termuat sebelum mencetak.</p>
        <button class="print-btn" onclick="window.print()">🖨️ Cetak Stiker Sekarang</button>
      </div>
      <div class="grid-container">${itemsHtml}</div>
    `;

  writeAndClose(printWindow, `Cetak QR - ${item.part_name}`, QR_STYLES, bodyContent);
};

export const printAllQR = async (inventoryList: InventoryItem[]): Promise<void> => {
  if (!inventoryList.length) return alert("Belum ada barang di database!");

  const activeItems = inventoryList.filter((item) => (Number(item.quantity) || 0) > 0);
  if (!activeItems.length) return alert("Semua barang memiliki stok 0, tidak ada yang perlu dicetak.");

  // Insert unit rows for all items
  let allLabels: { item: InventoryItem; uid: string }[] = [];
  try {
    for (const item of activeItems) {
      // Bulk/liters items = 1 container label regardless of volume.
      // Unit/pieces items = one label per physical unit.
      const qty = item.is_bulk ? 1 : Math.max(0, Number(item.quantity) || 0);
      if (qty === 0) continue;
      const unitIds = await createUnitRows(item.id, qty);
      allLabels = allLabels.concat(unitIds.map((uid) => ({ item, uid })));
    }
  } catch (err) {
    console.error("Gagal membuat unit rows:", err);
    alert("Gagal menyimpan unit ke database. Coba lagi.");
    return;
  }

  const printWindow = openPrintWindow();
  if (!printWindow) return;

  const itemsHtml = allLabels.map(({ item, uid }) => generateUnitLabelHtml(item, uid)).join("");
  const totalStiker = allLabels.length;

  const bodyContent = `
      <div class="header no-print">
        <h1>Total ${totalStiker} Stiker QR Siap Cetak</h1>
        <p>Pastikan semua gambar QR Code sudah termuat.</p>
        <button class="print-btn" onclick="window.print()">🖨️ Cetak Semua Sekarang</button>
      </div>
      <div class="grid-container">${itemsHtml}</div>
    `;

  writeAndClose(printWindow, "Cetak Semua QR Code", QR_STYLES, bodyContent);
};

export const printLocationList = (inventoryList: InventoryItem[]): void => {
  if (!inventoryList.length) return alert("Belum ada data barang!");

  const activeItems = inventoryList.filter((item) => (Number(item.quantity) || 0) > 0);
  if (!activeItems.length) return alert("Semua barang memiliki stok 0, tidak ada yang perlu dicetak.");

  const printWindow = openPrintWindow();
  if (!printWindow) return;

  const groupedData = activeItems.reduce((acc, item) => {
    const loc = item.location?.trim().toUpperCase() || "TANPA LOKASI";
    (acc[loc] = acc[loc] || []).push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const today = new Date();
  const todayStr = today.toLocaleDateString("id-ID");

  const locationHtml = Object.keys(groupedData)
    .sort()
    .map((loc) => {
      const rowsHtml = groupedData[loc]
        .sort((a, b) => a.part_name.localeCompare(b.part_name))
        .map((item) => {
          const expDate = item.expired_date_fixed ? new Date(item.expired_date_fixed) : null;
          const isExpired = expDate ? expDate < today : false;
          const formattedDate = expDate
            ? expDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
            : "-";

          return `
                    <tr>
                        <td><strong>${item.part_name}</strong></td>
                        <td>${item.part_number || "-"}</td>
                        <td class="${isExpired ? "expired-danger" : ""}">${formattedDate}${isExpired ? " (EXPIRED!)" : ""}</td>
                        <td style="text-align: center; font-weight: 800;">${item.quantity || 0}</td>
                    </tr>
                `;
        })
        .join("");

      return `
            <div class="location-section">
                <h2 class="location-title">📍 LOKASI: ${loc}</h2>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%">NAMA BARANG</th>
                            <th style="width: 25%">PART NUMBER</th>
                            <th style="width: 25%">EXPIRED DATE</th>
                            <th style="width: 10%; text-align: center;">QTY</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    })
    .join("");

  const bodyContent = `
      <div class="no-print" style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Cetak Dokumen</button>
      </div>
      <div class="header">
        <h1>LABEL CHEMICAL & EXPIRED DATE</h1>
        <p>GMF INVENTORY SYSTEM - ${todayStr}</p>
      </div>
      ${locationHtml}
    `;

  // ponytail: location list doesn't need unit rows — it's just a paper reference, not a scannable label
  writeAndClose(printWindow, "List Barang & Expired per Lokasi", LOCATION_STYLES, bodyContent);
};
