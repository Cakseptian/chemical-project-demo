// app/so/utils/printUtils.ts
import type { InventoryItem } from "../types";

const BASE_URL = "https://stock-opname-project-gmf.vercel.app";

// ==========================================
// SHARED STYLES
// ==========================================
const QR_STYLES = `
  body { font-family: sans-serif; padding: 20px; background-color: #f1f5f9; }
  .grid-container { 
    display: flex; 
    flex-wrap: wrap;
    gap: 10px; 
    justify-content: flex-start;
  }
  .label-box { 
    background: white; border: 2px solid #000; padding: 10px; 
    text-align: center; border-radius: 8px; page-break-inside: avoid;
    width: 160px;
  }
  h2 { margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  p { margin: 0 0 10px 0; font-size: 10px; color: #333; font-weight: bold; }
  img { width: 100px; height: 100px; margin: 0 auto; display: block; }
  .uuid { margin-top: 10px; font-family: monospace; font-size: 8px; color: #555; word-break: break-all; }
  .header { text-align: center; margin-bottom: 20px; }
  .print-btn { padding: 12px 24px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3); }
  
  @media print {
    @page { margin: 5mm; }
    body { background: white; padding: 0; margin: 0; }
    .header, .no-print { display: none !important; }
    .label-box { border: 1px dashed #999; border-radius: 0; }
  }
`;

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const generateQRUrl = (barcodeId: string): string => {
    const qrData = `${BASE_URL}/?scan=${barcodeId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
};

const generateQRLabelHtml = (item: InventoryItem): string => {
    const qrUrl = generateQRUrl(item.barcode_id);
    return `
    <div class="label-box">
      <h2>${item.part_name}</h2>
      <p>PN: ${item.part_number || "-"}</p>
      <img src="${qrUrl}" alt="QR Code" />
      <p>Batch: ${item.batch_number || "-"}</p>
      <p>Exp: ${item.expired_date_fixed || "-"}</p>
      <div class="uuid">${item.barcode_id}</div>
    </div>
  `;
};

const openPrintWindow = (title: string): Window | null => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Popup diblokir! Izinkan popup untuk situs ini.');
        return null;
    }
    return printWindow;
};

// ==========================================
// MAIN EXPORT FUNCTIONS
// ==========================================

/**
 * Cetak QR code untuk single item (sebanyak quantity)
 */
export const printSingleQR = (item: InventoryItem): void => {
    const printWindow = openPrintWindow(`Cetak QR - ${item.part_name}`);
    if (!printWindow) return;

    const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    let itemsHtml = "";

    for (let i = 0; i < qty; i++) {
        itemsHtml += generateQRLabelHtml(item);
    }

    printWindow.document.write(`
    <html>
      <head>
        <title>Cetak QR - ${item.part_name}</title>
        <style>${QR_STYLES}</style>
      </head>
      <body>
        <div class="header no-print">
          <h1>Cetak ${qty} Stiker untuk ${item.part_name}</h1>
          <p>Pastikan gambar QR Code sudah termuat sebelum klik tombol cetak di bawah.</p>
          <button class="print-btn" onclick="window.print()">🖨️ Cetak Stiker Sekarang</button>
        </div>
        <div class="grid-container">
          ${itemsHtml}
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
};

/**
 * Cetak QR code untuk semua item di inventory
 */
export const printAllQR = (inventoryList: InventoryItem[]): void => {
    if (inventoryList.length === 0) {
        alert("Belum ada barang di database!");
        return;
    }

    const printWindow = openPrintWindow("Cetak Semua QR Code");
    if (!printWindow) return;

    let itemsHtml = "";
    let totalStikerDicetak = 0;

    inventoryList.forEach(item => {
        const qty = Number(item.quantity) || 0;
        for (let i = 0; i < qty; i++) {
            totalStikerDicetak++;
            itemsHtml += generateQRLabelHtml(item);
        }
    });

    printWindow.document.write(`
    <html>
      <head>
        <title>Cetak Semua QR Code</title>
        <style>${QR_STYLES}</style>
      </head>
      <body>
        <div class="header no-print">
          <h1>Total ${totalStikerDicetak} Stiker QR Siap Cetak</h1>
          <p>Pastikan gambar QR Code sudah termuat semua sebelum klik tombol cetak di bawah.</p>
          <button class="print-btn" onclick="window.print()">🖨️ Cetak Semua Sekarang</button>
        </div>
        <div class="grid-container">
          ${itemsHtml}
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
};

/**
 * Cetak listing barang per lokasi (dengan expired date)
 */
export const printLocationList = (inventoryList: InventoryItem[]): void => {
    if (inventoryList.length === 0) {
        alert("Belum ada data barang!");
        return;
    }

    const groupedData: Record<string, InventoryItem[]> = {};
    inventoryList.forEach(item => {
        const loc = item.location ? item.location.trim().toUpperCase() : "TANPA LOKASI";
        if (!groupedData[loc]) groupedData[loc] = [];
        groupedData[loc].push(item);
    });

    const sortedLocations = Object.keys(groupedData).sort();
    const today = new Date();

    const printWindow = openPrintWindow("List Barang & Expired per Lokasi");
    if (!printWindow) return;

    let htmlContent = `
    <html>
    <head>
      <title>List Barang & Expired per Lokasi</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
        .header p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
        .location-section { margin-bottom: 30px; page-break-inside: avoid; }
        .location-title { background-color: #f1f5f9; padding: 12px; font-size: 16px; font-weight: 900; border: 1px solid #000; border-bottom: none; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 10px 15px; text-align: left; }
        th { background-color: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        td { font-size: 13px; }
        .expired-danger { color: #dc2626; font-weight: 900; text-decoration: underline; }
        .no-print { margin-bottom: 20px; display: flex; justify-content: flex-end; }
        button { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        @media print { .no-print { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="no-print"><button onclick="window.print()">🖨️ Cetak Dokumen</button></div>
      <div class="header">
        <h1>LABEL CHEMICAL & EXPIRED DATE</h1>
        <p>GMF INVENTORY SYSTEM - ${new Date().toLocaleDateString('id-ID')}</p>
      </div>
  `;

    sortedLocations.forEach(loc => {
        htmlContent += `
      <div class="location-section">
        <h2 class="location-title">📍 LOKASI: ${loc}</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 35%">NAMA BARANG</th>
              <th style="width: 25%">PART NUMBER</th>
              <th style="width: 25%">EXPIRED DATE</th>
              <th style="width: 15%; text-align: center;">QTY</th>
            </tr>
          </thead>
          <tbody>
    `;

        const sortedItems = groupedData[loc].sort((a, b) => a.part_name.localeCompare(b.part_name));

        sortedItems.forEach(item => {
            const expDate = item.expired_date_fixed ? new Date(item.expired_date_fixed) : null;
            const isExpired = expDate && expDate < today;
            const formattedDate = expDate
                ? expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                : "-";

            htmlContent += `
        <tr>
          <td><strong>${item.part_name}</strong></td>
          <td>${item.part_number || "-"}</td>
          <td class="${isExpired ? 'expired-danger' : ''}">${formattedDate} ${isExpired ? '(EXPIRED!)' : ''}</td>
          <td style="text-align: center; font-size: 16px; font-weight: 900;">${item.quantity || 0}</td>
        </tr>
      `;
        });

        htmlContent += `</tbody></table></div>`;
    });

    htmlContent += `</body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};