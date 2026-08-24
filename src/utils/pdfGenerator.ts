import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GangguanLog } from '../types';

export interface SaidiSaifiReportData {
  filteredLogs: GangguanLog[];
  totalPelangganUlp: number;
  totalSaidiMenit: number;
  totalSaidiJam: number;
  totalSaifi: number;
  totalPelangganPadamAccum: number;
  totalDurasiPadamMenit: number;
  topSections: Array<{
    section: string;
    namaPenyulang: string;
    count: number;
    saidiMenit: number;
    sectionCustomerCount: number;
  }>;
  selectedMonthLabel?: string;
}

export const generateSaidiSaifiPDF = (data: SaidiSaifiReportData) => {
  // A4 Landscape mode
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // --- HEADER PLN ULP PASSO ---
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, 297, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PT PLN (PERSERO) ULP PASSO - UP3 AMBON', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`TANGGAL CETAK: ${currentDate}`, 283, 11, { align: 'right' });

  // --- REPORT TITLE ---
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN MONITORING ESTIMASI SAIDI & SAIFI PER EVENT GANGGUAN', 14, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  const monthText = data.selectedMonthLabel ? `Periode: ${data.selectedMonthLabel}` : 'Periode: Semua Bulan';
  doc.text(`${monthText} | Reference Total Pelanggan ULP: ${data.totalPelangganUlp.toLocaleString('id-ID')} Plg`, 14, 33);

  // --- KPI SUMMARY BOXES ---
  // Box 1: SAIDI
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 37, 63, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMASI SAIDI', 18, 42);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(`${data.totalSaidiMenit.toFixed(3)} Menit/Plg`, 18, 48);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`(${data.totalSaidiJam.toFixed(4)} Jam/Plg)`, 18, 52);

  // Box 2: SAIFI
  doc.roundedRect(82, 37, 63, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMASI SAIFI', 86, 42);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(`${data.totalSaifi.toFixed(4)} Kali/Plg`, 86, 48);

  // Box 3: Total Event
  doc.roundedRect(150, 37, 63, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EVENT GANGGUAN', 154, 42);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.filteredLogs.length} Event Trip`, 154, 48);

  // Box 4: Total Pelanggan Padam
  doc.roundedRect(218, 37, 65, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AKUMULASI PLG PADAM', 222, 42);
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text(`${data.totalPelangganPadamAccum.toLocaleString('id-ID')} Plg`, 222, 48);

  // --- SECTION TOP RANKINGS TABLE (First 5) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Top 5 Section Padam dengan Dampak SAIDI Terbesar:', 14, 61);

  const topSectionRows = data.topSections.slice(0, 5).map((sec, idx) => [
    `#${idx + 1}`,
    sec.section,
    sec.namaPenyulang,
    `${sec.count}x Event`,
    `${sec.sectionCustomerCount.toLocaleString('id-ID')} Plg`,
    `${sec.saidiMenit.toFixed(3)} Menit/Plg`
  ]);

  autoTable(doc, {
    startY: 64,
    head: [['Rank', 'Nama Section Padam', 'Penyulang', 'Jumlah Event', 'Pelanggan Section', 'Estimasi SAIDI (Menit/Plg)']],
    body: topSectionRows,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error - lastAutoTable exists on jsPDF instance
  const nextY = (doc.lastAutoTable?.finalY || 100) + 8;

  // --- MAIN DETAILED LOG TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Detail Event Gangguan & Kalkulasi SAIDI/SAIFI:', 14, nextY);

  const tableBody = data.filteredLogs.map((log, index) => {
    const durasiMenit = log.jamKeluar && log.jamMasuk ? (() => {
      const [hOut, mOut] = log.jamKeluar.split(':').map(Number);
      const [hIn, mIn] = log.jamMasuk.split(':').map(Number);
      let diff = (hIn * 60 + mIn) - (hOut * 60 + mOut);
      if (diff < 0) diff += 24 * 60;
      return diff || 60;
    })() : 60;

    const safeUlp = data.totalPelangganUlp > 0 ? data.totalPelangganUlp : 88281;
    const jmlPlg = log.jumlahPelangganPadam || 0;
    const eSaifi = jmlPlg / safeUlp;
    const eSaidiM = (jmlPlg * durasiMenit) / safeUlp;

    return [
      (index + 1).toString(),
      log.tanggal || '-',
      log.namaPenyulang || '-',
      log.section || '-',
      `${log.jamKeluar || ''} - ${log.jamMasuk || ''}`,
      `${durasiMenit} mnt`,
      jmlPlg.toLocaleString('id-ID'),
      eSaidiM.toFixed(4),
      eSaifi.toFixed(5),
      log.penyebab || log.catatan || '-'
    ];
  });

  autoTable(doc, {
    startY: nextY + 3,
    head: [[
      'No',
      'Tanggal',
      'Penyulang',
      'Section Padam',
      'Jam Out - In',
      'Durasi',
      'Plg Padam',
      'SAIDI (Mnt)',
      'SAIFI (Kali)',
      'Keterangan / Penyebab'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // --- SIGNATURE FOOTER ---
  // @ts-expect-error - lastAutoTable exists on jsPDF instance
  let finalY = (doc.lastAutoTable?.finalY || 160) + 12;
  if (finalY > 175) {
    doc.addPage();
    finalY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text('Mengetahui,', 220, finalY);
  doc.text('Manager ULP Passo', 220, finalY + 5);

  doc.text('Disiapkan Oleh,', 30, finalY);
  doc.text('Supervisor Teknik ULP Passo', 30, finalY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('( ______________________ )', 220, finalY + 22);
  doc.text('( ______________________ )', 30, finalY + 22);

  // Save the PDF file directly
  const fileName = `Laporan_Estimasi_SAIDI_SAIFI_ULP_PASSO_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
