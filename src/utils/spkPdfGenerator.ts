import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PerintahKerja, User, MasterUnitPLN } from '../types';
import { getPlnLogoPng } from './plnLogo';
import { getUnitDetails } from './unitConfig';

export const generateSpkPDF = async (spk: PerintahKerja, currentUser?: User | null, masterUnitList?: MasterUnitPLN[]) => {
  const unitInfo = getUnitDetails(spk.unit || currentUser?.unit || 'ULP Baguala', masterUnitList);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Add subtle background watermark logo across the A4 page (centered faint PLN logo representation)
  doc.setTextColor(240, 244, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(55);
  doc.text('PT PLN (PERSERO)', 105, 140, { align: 'center', angle: 35 });
  doc.setFontSize(20);
  doc.text(unitInfo.namaUnit.toUpperCase(), 105, 155, { align: 'center', angle: 35 });

  // KOP Header Box matching official reference image
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(14, 10, 182, 22);

  // Left logo box: x:16, y:12, w:16, h:18
  doc.setLineWidth(0.2);
  doc.setDrawColor(15, 23, 42);
  doc.rect(16, 12, 16, 18);

  try {
    const logoPng = await getPlnLogoPng();
    doc.addImage(logoPng, 'PNG', 16, 12, 16, 18);
  } catch (e) {
    console.warn('Failed to embed PLN logo image in PDF, fallback drawing used', e);
  }

  // Vertical separator line after logo box
  doc.setDrawColor(15, 23, 42);
  doc.line(34, 10, 34, 32);

  // KOP Text lines on the right
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PT PLN (Persero)', 38, 15);

  doc.setFontSize(7.5);
  doc.text(unitInfo.uiw, 38, 19.5);
  doc.text(unitInfo.up3, 38, 24);
  doc.text(unitInfo.namaUnit.toUpperCase(), 38, 28.5);

  // NoSpk on top right inside KOP
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`No: ${spk.noSpk || spk.id}`, 192, 15, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SURAT PERINTAH KERJA (SPK)', 105, 39, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor Dokumen: ${spk.noSpk || spk.id}`, 105, 45, { align: 'center' });

  // Details Table
  autoTable(doc, {
    startY: 48,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      ['Tanggal Terbit', ':', spk.tanggal || '-', 'Jumlah Personil', ':', `${spk.jumlahPersonil || 1} Orang`],
      ['Penyulang', ':', spk.namaPenyulang || '-', 'Section / Lokasi', ':', spk.section || '-'],
      ['Jenis Pekerjaan', ':', spk.jenisPekerjaan || '-', 'Target Kerja', ':', spk.target || '-'],
      ['Tim Pelaksana', ':', spk.timAtauPetugas || unitInfo.timYantek, 'Status SPK', ':', spk.status || '-'],
      [unitInfo.managerTitle.split(' ')[0] + ' ' + (unitInfo.managerTitle.split(' ')[1] || ''), ':', spk.namaManager || 'DWI SURYA PERMANA', 'Status Approval', ':', spk.isApproved ? 'APPROVED (TTD DIGITAL)' : 'PENDING APPROVAL']
    ],
    margin: { left: 14, right: 14 }
  });

  // Uraian Pekerjaan & List Petugas
  // @ts-expect-error - lastAutoTable exists on jsPDF instance
  let nextY = (doc.lastAutoTable?.finalY || 70) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('A. Rincian Tim & Petugas Pelaksana:', 14, nextY);

  // Format petugas table rows
  let petugasRows: (string | number)[][] = [];
  if (spk.petugasList && spk.petugasList.length > 0) {
    petugasRows = spk.petugasList.map((p, idx) => [idx + 1, p.nama, p.jabatan]);
  } else if (spk.daftarPetugas) {
    const lines = spk.daftarPetugas.split('\n').filter(l => l.trim());
    petugasRows = lines.map((l, idx) => {
      const cleanName = l.replace(/^[0-9.]+\s*/, '');
      return [idx + 1, cleanName, 'Petugas Pelaksana'];
    });
  } else {
    petugasRows = [[1, spk.timAtauPetugas || unitInfo.timYantek, 'Petugas Lapangan']];
  }

  autoTable(doc, {
    startY: nextY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    head: [['No', 'Nama Petugas', 'Jabatan / Peran']],
    body: petugasRows,
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error - lastAutoTable exists on jsPDF instance
  nextY = (doc.lastAutoTable?.finalY || 100) + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('B. Instruksi K3:', 14, nextY);

  autoTable(doc, {
    startY: nextY + 3,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    head: [['Parameter', 'Keterangan Rinci']],
    body: [
      ['Jenis Pekerjaan', spk.jenisPekerjaan || '-'],
      ['Target Volume / Lokasi', spk.target || '-'],
      ['Instruksi K3', spk.catatan || 'Wajib APD Lengkap, Bebas Tegangan, Grounding Lokal']
    ],
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    margin: { left: 14, right: 14 }
  });

  // Tanda tangan Manager ULP Sah (Tanpa NIP, Menggunakan Barcode Digital Signature)
  // @ts-expect-error - lastAutoTable exists on jsPDF instance
  nextY = (doc.lastAutoTable?.finalY || 140) + 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`${unitInfo.managerTitle},`, 135, nextY);

  if (spk.tandaTanganManager) {
    try {
      // Draw signature stroke image
      doc.addImage(spk.tandaTanganManager, 'PNG', 135, nextY + 2, 55, 18);
      
      // Verified badge in PDF
      doc.setDrawColor(16, 185, 129);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(172, nextY + 2, 22, 5, 1, 1, 'FD');
      doc.setFontSize(5.5);
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED TTD', 183, nextY + 5.5, { align: 'center' });
    } catch (e) {
      console.warn('Failed to embed manager signature in PDF:', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`( ${spk.namaManager || 'DWI SURYA PERMANA'} )`, 162.5, nextY + 25, { align: 'center' });
  } else if (spk.isApproved) {
    // Draw Barcode Box for Digital Signature Manager
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(130, nextY + 4, 65, 20, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.setFont('courier', 'bold');
    doc.text('|||| || ||| |||| || | |||', 162.5, nextY + 11, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('OFFICIAL VERIFIED DIGITAL SIGNATURE', 162.5, nextY + 15, { align: 'center' });
    doc.text(`ID SPK: ${(spk.noSpk || 'SPK-BGL').replace(/[^a-zA-Z0-9]/g, '')}`, 162.5, nextY + 19, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`( ${spk.namaManager || 'DWI SURYA PERMANA'} )`, 162.5, nextY + 30, { align: 'center' });
  } else {
    // Pending approval box
    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(130, nextY + 4, 65, 18, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('MENUNGGU APPROVAL MANAGER', 162.5, nextY + 14, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`( ${spk.namaManager || 'DWI SURYA PERMANA'} )`, 162.5, nextY + 30, { align: 'center' });
  }

  doc.save(`SPK_${(spk.noSpk || spk.id).replace(/\//g, '_')}.pdf`);
};
