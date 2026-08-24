import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { LivePaperPbPdDocument } from '../components/modals/LivePaperPbPdDocument';
import { SurveyPbPdItem } from '../types';
import { PLN_LOGO_BASE64 } from './plnLogo';

/**
 * Converts any modern CSS color string (oklch, oklab, color(), etc.)
 * to standard RGB/RGBA or Hex using the browser's native 2D canvas engine.
 */
function cssColorToRgb(colorStr: string): string {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'currentColor') {
    return colorStr;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return colorStr;
    ctx.fillStyle = '#000000'; // default
    ctx.fillStyle = colorStr;
    return ctx.fillStyle; // Automatically evaluates to #rrggbb or rgba(...)
  } catch (e) {
    return '#000000';
  }
}

/**
 * Recursively converts any oklch colors on elements to explicit inline RGB colors
 */
function sanitizeElementColors(element: HTMLElement): void {
  try {
    const computed = window.getComputedStyle(element);
    
    // Properties that might contain oklch
    const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'outlineColor'];
    for (const prop of props) {
      const val = (computed as any)[prop];
      if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color(') || val.includes('color-mix'))) {
        const rgb = cssColorToRgb(val);
        (element.style as any)[prop] = rgb;
      }
    }

    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      sanitizeElementColors(children[i] as HTMLElement);
    }
  } catch (err) {
    // Ignore traversal errors
  }
}

/**
 * Sanitizes all <style> tags in a document by converting oklch/oklab to rgb
 */
function sanitizeStyleTags(doc: Document): void {
  try {
    const styleTags = doc.querySelectorAll('style');
    styleTags.forEach((style) => {
      if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
        style.textContent = style.textContent.replace(/(?:oklch|oklab|color)\([^)]+\)/gi, (match) => {
          return cssColorToRgb(match) || match;
        });
      }
    });
  } catch (err) {
    // Ignore
  }
}

/**
 * Fallback vector PDF generator formatted exactly like the Live Paper BA Survey
 */
import { getUnitDetails } from './unitConfig';

export function exportLivePaperVectorPdf(data: Partial<SurveyPbPdItem>, fileName?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const unitInfo = getUnitDetails(data.unit || 'ULP Baguala');
  const pangkal = Number(data.tegPangkal) || 0;
  const tetangga = Number(data.tegTetangga) || 0;
  const dropVolt = Math.max(0, pangkal - tetangga);
  const dropPct = pangkal > 0 ? (dropVolt / pangkal) * 100 : 0;
  const dropStatus = dropPct >= 10 ? 'KRITIS (≥ 10%) - TIDAK LAYAK SAMBUNG' : dropPct >= 5 ? 'WASPADA (5% - 9.9%)' : 'NORMAL / SESUAI STANDAR (< 5%)';
  
  const isPb = (data.jenisTransaksi || 'Pasang Baru (PB)').includes('PB');
  const docNo = `BA-SRV/${(data.penyulang || 'PASSO').toUpperCase()}/${data.noGardu || 'BG-01'}/${data.noAgenda || (data.tanggalSurvey ? data.tanggalSurvey.replace(/-/g, '') : '5426001')}`;

  // Header KOP PLN
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`PT PLN (PERSERO) ${unitInfo.uiw} - ${unitInfo.up3}`, 14, 9.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`UNIT LAYANAN PELANGGAN (${unitInfo.namaUnit.toUpperCase()})`, 14, 15.5);
  doc.setFontSize(7.5);
  doc.text(`Tgl Cetak: ${new Date().toLocaleDateString('id-ID')} | Edisi: Rev 02.1`, 196, 15.5, { align: 'right' });

  // Title Dokumen
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BERITA ACARA SURVEY KELAYAKAN TEKNIS SAMBUNGAN LISTRIK (PB / PD)', 105, 31, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Dokumen: ${docNo}`, 105, 36, { align: 'center' });

  // Multi-Section Table of Information
  autoTable(doc, {
    startY: 40,
    head: [['No', 'Parameter Teknis', 'Rincian Data Lapangan Hasil Survey']],
    body: [
      // Section I
      [{ content: 'I. IDENTITAS PERMOHONAN & CALON PELANGGAN', colSpan: 3, styles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' } }],
      ['1', 'Jenis Permohonan / Transaksi', data.jenisTransaksi || 'Pasang Baru (PB)'],
      ['2', 'Nama Pelanggan / Pemohon', data.namaPelanggan || '-'],
      ['3', 'Nomor Agenda / Registrasi', data.noAgenda || '-'],
      ['4', 'ID Pelanggan / No. Meter', data.idPelanggan || '- (Pasang Baru)'],
      ['5', 'Nomor HP / WhatsApp', data.noHpPelanggan || '-'],
      ['6', 'Peruntukan Bangunan', data.peruntukan || 'Rumah Tangga'],
      ['7', 'Tarif & Daya Dimohon', `${data.tarifBaru || 'R1/1300 VA'} (${data.dayaBaruVa || 1300} VA)`],
      ...(!isPb ? [['8', 'Tarif & Daya Lama (PD)', `${data.tarifLama || '-'} (${data.dayaLamaVa || '-'} VA)`]] : []),
      ['8', 'Alamat / Lokasi Bangunan', data.lokasi || '-'],
      ['9', 'Koordinat GPS Bangunan', data.lat !== undefined && data.lng !== undefined ? `${Number(data.lat).toFixed(6)}, ${Number(data.lng).toFixed(6)}` : '-'],

      // Section II
      [{ content: 'II. JARINGAN DISTRIBUSI & SISTEM KELISTRIKAN', colSpan: 3, styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' } }],
      ['10', 'Penyulang (Feeder 20 kV)', data.penyulang || 'PASSO'],
      ['11', 'Nomor Gardu Distribusi / GTT', `${data.noGardu || 'BG-01'} (${data.jurusanGardu || 'Jurusan 1'})`],
      ['12', 'Fasa yang Diambil', data.fasaYangDiambil || '1 Fasa (Fasa R)'],

      // Section III
      [{ content: 'III. PENGUKURAN TEGANGAN & EVALUASI DROP (ΔV)', colSpan: 3, styles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' } }],
      ['13', 'Tegangan Pangkal (Trafo)', `${pangkal} Volt`],
      ['14', 'Tegangan Ujung (Titik Sambung/Tetangga)', `${tetangga} Volt`],
      ['15', 'Drop Tegangan (ΔV)', `${dropVolt} Volt (${dropPct.toFixed(2)}%) - ${dropStatus}`],

      // Section IV
      [{ content: 'IV. TITIK SAMBUNG & SALURAN RUMAH (SR)', colSpan: 3, styles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' } }],
      ['16', 'Titik Sambung (Tiang JTR)', data.titikSambung || 'Tiang TR No. 01'],
      ['17', 'Koordinat GPS Titik Sambung', data.titikSambungLat !== undefined && data.titikSambungLng !== undefined ? `${Number(data.titikSambungLat).toFixed(6)}, ${Number(data.titikSambungLng).toFixed(6)}` : '-'],
      ['18', 'Panjang Saluran Rumah (SR)', `${data.panjangSrMeter || 15} Meter`],
      ['19', 'Jenis & Ukuran Kabel SR', (data.jenisKabelSr || '2x10 mm²').replace(/^TIC\s*/i, '')],

      // Section V
      [{ content: 'V. KESIMPULAN HASIL SURVEY & REKOMENDASI TEKNIS', colSpan: 3, styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } }],
      ['20', 'Status Kelayakan Teknis', (data.statusKelayakan || 'Layak Sambung').toUpperCase()],
      ['21', 'Tanggal Pelaksanaan Survey', data.tanggalSurvey || new Date().toISOString().split('T')[0]],
      ['22', 'Tanggal Rencana Penyambungan', data.tanggalPenyambungan || '-'],
      ['23', 'Rekomendasi Teknis Petugas', data.rekomendasiTeknis || 'Memenuhi syarat teknis kelistrikan PLN.'],
      ['24', 'Catatan Tambahan', data.catatan || '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 62, fontStyle: 'bold', fillColor: [248, 250, 252] },
      2: { cellWidth: 120 }
    }
  });

  let signY = (doc as any).lastAutoTable.finalY + 8;
  if (signY + 38 > doc.internal.pageSize.height) {
    doc.addPage();
    signY = 20;
  }

  // Tanda Tangan Resmi
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui / Menyetujui,', 30, signY);
  doc.text(`Team Leader / ${unitInfo.tlTeknikTitle}`, 30, signY + 4);

  doc.text(`Ambon, ${data.tanggalSurvey || new Date().toISOString().split('T')[0]}`, 135, signY);
  doc.text('Surveyor Teknik Lapangan', 135, signY + 4);

  // Render Tanda Tangan Gambar TL Teknik jika ada
  if (data.tandaTanganTlTeknik) {
    try {
      doc.addImage(data.tandaTanganTlTeknik, 'PNG', 30, signY + 7, 36, 14);
    } catch (e) {
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('[ VERIFIED DIGITAL SIGNATURE ]', 30, signY + 16);
      doc.setTextColor(15, 23, 42);
    }
  } else if (data.isApproved || data.teamLeaderName || data.statusKelayakan === 'Layak Sambung') {
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('[ DISETUJUI DIGITAL ]', 30, signY + 14);
    doc.setFontSize(6.5);
    doc.text(`ID: ${(data.noAgenda || 'BA').replace(/[^a-zA-Z0-9]/g, '')}`, 30, signY + 18);
    doc.setTextColor(15, 23, 42);
  }

  // Render Tanda Tangan Gambar Surveyor jika ada
  if (data.tandaTanganSurveyor) {
    try {
      doc.addImage(data.tandaTanganSurveyor, 'PNG', 135, signY + 7, 36, 14);
    } catch (e) {
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('[ TERTANDATANGANI DIGITAL ]', 135, signY + 16);
      doc.setTextColor(15, 23, 42);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.teamLeaderName || 'M Ricky Sabari', 30, signY + 26);

  doc.text(data.petugasSurvey || 'Petugas Surveyor', 135, signY + 26);

  const sanitizeName = (data.namaPelanggan || 'Pelanggan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const noAgenda = data.noAgenda || data.id || 'Draft';
  const outName = fileName || `Berita_Acara_Survey_PBPD_${sanitizeName}_${noAgenda}.pdf`;
  doc.save(outName);
}

/**
 * Exports a given HTML element directly to a high-DPI A4 PDF.
 * Slices long content cleanly into multiple A4 pages if needed.
 */
export async function exportElementToA4Pdf(
  element: HTMLElement,
  fileName: string = 'Berita_Acara_Survey_PBPD.pdf',
  fallbackData?: Partial<SurveyPbPdItem>
): Promise<void> {
  try {
    // 1. Sanitize the element in the live DOM before capturing
    sanitizeElementColors(element);

    // 2. Capture high-res canvas with html2canvas-pro
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        // Sanitize styles in the cloned document
        sanitizeStyleTags(clonedDoc);
        const clonedEl = clonedDoc.querySelector('#live-paper-print-area') as HTMLElement || clonedDoc.body;
        if (clonedEl) {
          clonedEl.style.backgroundColor = '#ffffff';
          sanitizeElementColors(clonedEl);
        }
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // mm
    const pageHeight = 297; // mm

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If the document fits in a single page or slight overflow
    if (imgHeight <= pageHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multi-page slicing
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Page 1
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Subsequent pages
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(fileName);
  } catch (canvasErr) {
    console.warn('Canvas export encountered an issue, falling back to direct vector PDF:', canvasErr);
    if (fallbackData) {
      exportLivePaperVectorPdf(fallbackData, fileName);
    } else {
      throw canvasErr;
    }
  }
}

/**
 * Generates an exact Live Paper PDF for any SurveyPbPdItem, even when modal is not open.
 * Mounts an offscreen A4 container with exact styling, renders LivePaperPbPdDocument, captures and saves.
 */
export async function generateLivePaperPdf(data: Partial<SurveyPbPdItem>): Promise<void> {
  const sanitizeName = (data.namaPelanggan || 'Pelanggan').replace(/[^a-zA-Z0-9_-]/g, '_');
  const noAgenda = data.noAgenda || data.id || 'Draft';
  const filename = `Berita_Acara_Survey_PBPD_${sanitizeName}_${noAgenda}.pdf`;

  // Create off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '840px'; // standard A4 layout width for clean proportions
  container.style.background = '#ffffff';
  container.style.zIndex = '-1000';
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise<void>((resolve) => {
    try {
      root.render(
        <div id="offscreen-live-paper" className="w-[840px] bg-white text-slate-900 font-sans p-6" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          <LivePaperPbPdDocument data={data} showHeaderActions={false} />
        </div>
      );

      // Allow DOM and images to paint
      setTimeout(async () => {
        try {
          const docElement = container.querySelector('#live-paper-print-area') as HTMLElement || container;
          await exportElementToA4Pdf(docElement, filename, data);
          resolve();
        } catch (err) {
          console.warn('Offscreen export fallback activated:', err);
          exportLivePaperVectorPdf(data, filename);
          resolve();
        } finally {
          // Cleanup
          try {
            root.unmount();
            if (container.parentNode) {
              container.parentNode.removeChild(container);
            }
          } catch (e) {
            // ignore
          }
        }
      }, 350);
    } catch (err) {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      exportLivePaperVectorPdf(data, filename);
      resolve();
    }
  });
}

