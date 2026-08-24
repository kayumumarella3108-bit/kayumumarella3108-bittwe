import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  Activity,
  Info,
  RefreshCw,
  Zap,
  Check,
  Calendar,
  Building2,
  Filter,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PengukuranGardu, MasterGardu, Penyulang } from '../../types';
import { parseFlexibleDate, formatDateToDMY } from '../../utils/dateParser';

interface ImportPengukuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: PengukuranGardu[]) => void;
  masterGarduList?: MasterGardu[];
  penyulangList?: Penyulang[];
}

export const parseExcelDate = (val: any): string | null => {
  const res = parseFlexibleDate(val);
  return res ? res.formattedDMY : null;
};

export const ImportPengukuranModal: React.FC<ImportPengukuranModalProps> = ({
  isOpen,
  onClose,
  onImport,
  masterGarduList = [],
  penyulangList = []
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<PengukuranGardu[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [validationReport, setValidationReport] = useState<{
    total: number;
    validCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate and download sample Excel template for Pengukuran Gardu according to Photo 2 column structure
  const handleDownloadTemplate = () => {
    const sampleGarduList = masterGarduList.length > 0
      ? masterGarduList.slice(0, 5)
      : [
          { noGarduLama: 'NAMAHATU DEPAN SMA (AL 01)', noGarduBaru: 'ALGALG001', penyulang: 'ALANG', daya: 50 },
          { noGarduLama: 'PASSO PASAR (PS 02)', noGarduBaru: 'PSSPS002', penyulang: 'PASSO', daya: 160 },
          { noGarduLama: 'LATERI INDAH (LT 03)', noGarduBaru: 'LTRLT003', penyulang: 'PASSO', daya: 250 }
        ];

    const templateData = sampleGarduList.map((g, i) => ({
      // Main 6 Identifiers
      'TGL Ukur': '6/8/2026',
      'PETUGAS': 'Bpk. Ahmad & Tim Yantek',
      'Jam Ukur': '09:30',
      'No Gardu Lama': g.noGarduLama || `GD-LAMA-00${i + 1}`,
      'No Gardu Baru': (g as any).noBaru || g.noGarduBaru || `GD-BARU-00${i + 1}`,
      'Penyulang': g.penyulang || 'ALANG',

      // Total (ampere)
      'I (R TOTAL)': 120 + i * 5,
      'I (S TOTAL)': 125 + i * 5,
      'I (T TOTAL)': 118 + i * 5,
      'I (N TOTAL)': 14 + i * 2,

      // Fasa - netral
      'V (R - N)': 220,
      'V (S - N)': 221,
      'V (T - N)': 219,

      // fasa -fasa
      'V (R - S)': 380,
      'V (S - T)': 382,
      'V (R - T)': 381,

      // THD
      'THD-R': 2.2,
      'THD-S': 2.1,
      'THD-T': 2.3,

      // IPEAK
      'IPEAK-R': 135 + i * 5,
      'IPEAK-S': 140 + i * 5,
      'IPEAK-T': 132 + i * 5,

      // TPF
      'TPF-R': 0.92,
      'TPF-S': 0.92,
      'TPF-T': 0.92,

      // JURUSAN 1
      'Jurusan 1 - I (R TOTAL)': 60 + i * 2,
      'Jurusan 1 - I (S TOTAL)': 62 + i * 2,
      'Jurusan 1 - I (T TOTAL)': 58 + i * 2,
      'Jurusan 1 - I (N TOTAL)': 7,
      'Jurusan 1 - V (R - N)': 220,
      'Jurusan 1 - V (S - N)': 221,
      'Jurusan 1 - V (T - N)': 219,
      'Jurusan 1 - V (R - S)': 380,
      'Jurusan 1 - V (S - T)': 382,
      'Jurusan 1 - V (R - T)': 381,
      'Jurusan 1 - IPEAK-R': 68,
      'Jurusan 1 - IPEAK-S': 70,
      'Jurusan 1 - IPEAK-T': 66,
      'Jurusan 1 - TPF-R': 0.92,
      'Jurusan 1 - TPF-S': 0.92,
      'Jurusan 1 - TPF-T': 0.92,

      // JURUSAN 2
      'Jurusan 2 - I (R TOTAL)': 60 + i * 3,
      'Jurusan 2 - I (S TOTAL)': 63 + i * 3,
      'Jurusan 2 - I (T TOTAL)': 60 + i * 3,
      'Jurusan 2 - I (N TOTAL)': 7,
      'Jurusan 2 - V (R - N)': 220,
      'Jurusan 2 - V (S - N)': 221,
      'Jurusan 2 - V (T - N)': 219,
      'Jurusan 2 - V (R - S)': 380,
      'Jurusan 2 - V (S - T)': 382,
      'Jurusan 2 - V (R - T)': 381,
      'Jurusan 2 - IPEAK-R': 67,
      'Jurusan 2 - IPEAK-S': 70,
      'Jurusan 2 - IPEAK-T': 66,
      'Jurusan 2 - TPF-R': 0.92,
      'Jurusan 2 - TPF-S': 0.92,
      'Jurusan 2 - TPF-T': 0.92,

      // JURUSAN 3
      'Jurusan 3 - I (R TOTAL)': 0,
      'Jurusan 3 - I (S TOTAL)': 0,
      'Jurusan 3 - I (T TOTAL)': 0,
      'Jurusan 3 - I (N TOTAL)': 0,
      'Jurusan 3 - V (R - N)': 220,
      'Jurusan 3 - V (S - N)': 220,
      'Jurusan 3 - V (T - N)': 220,
      'Jurusan 3 - V (R - S)': 380,
      'Jurusan 3 - V (S - T)': 380,
      'Jurusan 3 - V (R - T)': 380,
      'Jurusan 3 - IPEAK-R': 0,
      'Jurusan 3 - IPEAK-S': 0,
      'Jurusan 3 - IPEAK-T': 0,
      'Jurusan 3 - TPF-R': 0.92,
      'Jurusan 3 - TPF-S': 0.92,
      'Jurusan 3 - TPF-T': 0.92,

      // JURUSAN 4
      'Jurusan 4 - I (R TOTAL)': 0,
      'Jurusan 4 - I (S TOTAL)': 0,
      'Jurusan 4 - I (T TOTAL)': 0,
      'Jurusan 4 - I (N TOTAL)': 0,
      'Jurusan 4 - V (R - N)': 220,
      'Jurusan 4 - V (S - N)': 220,
      'Jurusan 4 - V (T - N)': 220,
      'Jurusan 4 - V (R - S)': 380,
      'Jurusan 4 - V (S - T)': 380,
      'Jurusan 4 - V (R - T)': 380,
      'Jurusan 4 - IPEAK-R': 0,
      'Jurusan 4 - IPEAK-S': 0,
      'Jurusan 4 - IPEAK-T': 0,
      'Jurusan 4 - TPF-R': 0.92,
      'Jurusan 4 - TPF-S': 0.92,
      'Jurusan 4 - TPF-T': 0.92
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Pengukuran_Gardu');
    XLSX.writeFile(wb, 'Template_Import_Pengukuran_Gardu.xlsx');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setParsedRows([]);
    setSkippedCount(0);
    setValidationReport(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setValidationReport({
            total: 0,
            validCount: 0,
            skippedCount: 0,
            errors: ['File Excel kosong atau tidak memiliki data baris yang valid.']
          });
          setIsProcessing(false);
          return;
        }

        const items: PengukuranGardu[] = [];
        const errors: string[] = [];
        let skipped = 0;

        let lastValidDate = '6/8/2026';

        rawJson.forEach((row, idx) => {
          const findVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                (rk) => rk.trim().toLowerCase() === k.trim().toLowerCase() || rk.trim().toLowerCase().includes(k.trim().toLowerCase())
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return '';
          };

          const parseNum = (val: any, fallback = 0): number => {
            if (typeof val === 'number') return isNaN(val) ? fallback : val;
            if (!val) return fallback;
            const cleaned = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? fallback : parsed;
          };

          // 1. TGL UKUR: Mendukung "6 Agustus 2026", "6/8/2026", "2026-08-06", Excel serials, dengan fallback ke tanggal sebelumnya jika kosong/merged
          const tglVal = findVal(
            'TGL Ukur', 'TGL_UKUR', 'Tgl Ukur', 'TGL UKUR', 'Tanggal Ukur', 'Tanggal', 'Tgl', 'DATE',
            'TANGGAL PENGUKURAN', 'WAKTU UKUR', 'TGL_PENGUKURAN', 'TANGGAL', 'Tanggal Ukur (YYYY-MM-DD)'
          );

          let parsedDateResult = parseFlexibleDate(tglVal);
          if (!parsedDateResult) {
            // Fallback ke last valid date agar baris tidak ditolak percuma
            parsedDateResult = parseFlexibleDate(lastValidDate);
          } else {
            lastValidDate = parsedDateResult.formattedDMY;
          }

          const tglUkur = parsedDateResult ? parsedDateResult.formattedDMY : '6/8/2026';

          // 2. PETUGAS
          const petugas = String(
            findVal('PETUGAS', 'Petugas', 'Petugas Ukur', 'PETUGAS UKUR', 'Tim Ukur', 'NAMA PETUGAS', 'Tim') ||
            'Tim Har-Dist ULP'
          );

          // 3. Jam Ukur
          const jamRaw = findVal('Jam Ukur', 'JAM_UKUR', 'Jam', 'JAM UKUR', 'Waktu Ukur', 'WAKTU');
          let jamUkur = '09:30';
          if (jamRaw instanceof Date) {
            const h = String(jamRaw.getHours()).padStart(2, '0');
            const m = String(jamRaw.getMinutes()).padStart(2, '0');
            jamUkur = `${h}:${m}`;
          } else if (jamRaw) {
            jamUkur = String(jamRaw);
          }

          // 4. No Gardu Lama & No Gardu Baru
          const noGarduLamaRaw = String(findVal(
            'No Gardu Lama', 'No. Gardu Lama', 'NO_GARDU_LAMA', 'Gardu Lama', 'KODE GARDU LAMA',
            'No. Gardu', 'No Gardu', 'KODE GARDU', 'NO_GARDU', 'Gardu', 'GARDU', 'Nama Gardu', 'GARDU_LAMA'
          ) || '').trim();

          const noGarduBaruRaw = String(findVal(
            'No Gardu Baru', 'No. Gardu Baru', 'NO_GARDU_BARU', 'Gardu Baru', 'No Baru', 'NO_BARU', 'NO BARU'
          ) || '').trim();

          const finalNoGardu = noGarduLamaRaw || noGarduBaruRaw;

          if (!finalNoGardu) {
            skipped++;
            errors.push(`Baris ${idx + 1}: Ditolak karena No Gardu Lama dan No Gardu Baru kosong.`);
            return;
          }

          // Matching with Master Gardu
          const matchedMaster = masterGarduList.find(
            (mg) =>
              (mg.noGarduLama && mg.noGarduLama.trim().toLowerCase() === finalNoGardu.toLowerCase()) ||
              (mg.noBaru && mg.noBaru.trim().toLowerCase() === finalNoGardu.toLowerCase()) ||
              (mg.noGarduBaru && mg.noGarduBaru.trim().toLowerCase() === finalNoGardu.toLowerCase())
          );

          // 5. Penyulang
          const penyulang = String(
            findVal('Penyulang', 'PENYULANG', 'Nama Penyulang', 'FEEDER', 'Penyulang Trafo') ||
            matchedMaster?.penyulang || 'ALANG'
          );

          const unit = String(findVal('Unit PLN', 'Unit', 'ULP', 'Unit ULP') || matchedMaster?.unit || 'ULP Baguala');
          const dayaKva = parseNum(findVal('Daya (kVA)', 'Daya', 'KVA', 'Daya Trafo', 'Kapasitas Trafo'), Number(matchedMaster?.daya) || 160);
          const alamat = String(findVal('Alamat Gardu', 'Alamat', 'Lokasi', 'LOKASI GARDU', 'ALAMAT') || matchedMaster?.alamat || matchedMaster?.alamatGardu || '');

          // Total (ampere): I (R TOTAL), I (S TOTAL), I (T TOTAL), I (N TOTAL)
          const iRTotal = parseNum(findVal('I (R TOTAL)', 'I_R_TOTAL', 'Arus Total R (A)', 'Arus Total R', 'IR (A)', 'IR', 'I R'), 0);
          const iSTotal = parseNum(findVal('I (S TOTAL)', 'I_S_TOTAL', 'Arus Total S (A)', 'Arus Total S', 'IS (A)', 'IS', 'I S'), 0);
          const iTTotal = parseNum(findVal('I (T TOTAL)', 'I_T_TOTAL', 'Arus Total T (A)', 'Arus Total T', 'IT (A)', 'IT', 'I T'), 0);
          const iNTotal = parseNum(findVal('I (N TOTAL)', 'I_N_TOTAL', 'Arus Total N (A)', 'Arus Total N', 'IN (A)', 'IN', 'I N'), 0);

          // Fasa - netral: V (R - N), V (S - N), V (T - N)
          const vRN = parseNum(findVal('V (R - N)', 'V(R-N)', 'VR-N', 'VRN', 'Tegangan VR-N (V)', 'V R-N'), 220);
          const vSN = parseNum(findVal('V (S - N)', 'V(S-N)', 'VS-N', 'VSN', 'Tegangan VS-N (V)', 'V S-N'), 220);
          const vTN = parseNum(findVal('V (T - N)', 'V(T-N)', 'VT-N', 'VTN', 'Tegangan VT-N (V)', 'V T-N'), 220);

          // fasa -fasa: V (R - S), V (S - T), V (R - T)
          const vRS = parseNum(findVal('V (R - S)', 'V(R-S)', 'VR-S', 'VRS', 'Tegangan VR-S (V)', 'V R-S'), 380);
          const vST = parseNum(findVal('V (S - T)', 'V(S-T)', 'VS-T', 'VST', 'Tegangan VS-T (V)', 'V S-T'), 380);
          const vRT = parseNum(findVal('V (R - T)', 'V(R-T)', 'VR-T', 'VRT', 'Tegangan VR-T (V)', 'V R-T', 'V(T-R)'), 380);

          // THD-R, THD-S, THD-T
          const thdR = parseNum(findVal('THD-R', 'THD R', 'THD_R', 'THD R (%)', 'THD'), 2.2);
          const thdS = parseNum(findVal('THD-S', 'THD S', 'THD_S', 'THD S (%)'), 2.2);
          const thdT = parseNum(findVal('THD-T', 'THD T', 'THD_T', 'THD T (%)'), 2.2);

          // IPEAK-R, IPEAK-S, IPEAK-T
          const iPeakR = parseNum(findVal('IPEAK-R', 'IPEAK R', 'IPEAK_R', 'I PEAK R', 'IPeak-R'), Math.round(iRTotal * 1.15));
          const iPeakS = parseNum(findVal('IPEAK-S', 'IPEAK S', 'IPEAK_S', 'I PEAK S', 'IPeak-S'), Math.round(iSTotal * 1.15));
          const iPeakT = parseNum(findVal('IPEAK-T', 'IPEAK T', 'IPEAK_T', 'I PEAK T', 'IPeak-T'), Math.round(iTTotal * 1.15));

          // TPF-R, TPF-S, TPF-T (Cos phi)
          const tpfR = parseNum(findVal('TPF-R', 'TPF R', 'TPF_R', 'TPF', 'Cos Phi R', 'Cosphi R', 'PF R'), 0.92);
          const tpfS = parseNum(findVal('TPF-S', 'TPF S', 'TPF_S', 'Cos Phi S', 'Cosphi S', 'PF S'), 0.92);
          const tpfT = parseNum(findVal('TPF-T', 'TPF T', 'TPF_T', 'Cos Phi T', 'Cosphi T', 'PF T'), 0.92);

          // Jurusan Helper
          const parseJurusan = (jNum: number) => {
            const prefix = `Jurusan ${jNum} - `;
            const prefixShort = `J${jNum}_`;
            const j_iR = parseNum(findVal(`${prefix}I (R TOTAL)`, `${prefix}Arus R (A)`, `${prefix}Arus R`, `${prefixShort}IR`, `${prefixShort}R`), jNum === 1 ? iRTotal : 0);
            const j_iS = parseNum(findVal(`${prefix}I (S TOTAL)`, `${prefix}Arus S (A)`, `${prefix}Arus S`, `${prefixShort}IS`, `${prefixShort}S`), jNum === 1 ? iSTotal : 0);
            const j_iT = parseNum(findVal(`${prefix}I (T TOTAL)`, `${prefix}Arus T (A)`, `${prefix}Arus T`, `${prefixShort}IT`, `${prefixShort}T`), jNum === 1 ? iTTotal : 0);
            const j_iN = parseNum(findVal(`${prefix}I (N TOTAL)`, `${prefix}Arus N (A)`, `${prefix}Arus N`, `${prefixShort}IN`, `${prefixShort}N`), jNum === 1 ? iNTotal : 0);

            const j_vRN = parseNum(findVal(`${prefix}V (R - N)`, `${prefix}VR-N`), vRN);
            const j_vSN = parseNum(findVal(`${prefix}V (S - N)`, `${prefix}VS-N`), vSN);
            const j_vTN = parseNum(findVal(`${prefix}V (T - N)`, `${prefix}VT-N`), vTN);

            const j_vRS = parseNum(findVal(`${prefix}V (R - S)`, `${prefix}VR-S`), vRS);
            const j_vST = parseNum(findVal(`${prefix}V (S - T)`, `${prefix}VS-T`), vST);
            const j_vRT = parseNum(findVal(`${prefix}V (R - T)`, `${prefix}VR-T`), vRT);

            const j_iPeakR = parseNum(findVal(`${prefix}IPEAK-R`, `${prefix}IPEAK R`), Math.round(j_iR * 1.15));
            const j_iPeakS = parseNum(findVal(`${prefix}IPEAK-S`, `${prefix}IPEAK S`), Math.round(j_iS * 1.15));
            const j_iPeakT = parseNum(findVal(`${prefix}IPEAK-T`, `${prefix}IPEAK T`), Math.round(j_iT * 1.15));

            const j_tpfR = parseNum(findVal(`${prefix}TPF-R`, `${prefix}TPF R`, `${prefix}Cos Phi R`), tpfR);
            const j_tpfS = parseNum(findVal(`${prefix}TPF-S`, `${prefix}TPF S`, `${prefix}Cos Phi S`), tpfS);
            const j_tpfT = parseNum(findVal(`${prefix}TPF-T`, `${prefix}TPF T`, `${prefix}Cos Phi T`), tpfT);

            return {
              nama: `JURUSAN ${jNum}`,
              iRTotal: j_iR,
              iSTotal: j_iS,
              iTTotal: j_iT,
              iNTotal: j_iN,
              vRN: j_vRN,
              vSN: j_vSN,
              vTN: j_vTN,
              vRS: j_vRS,
              vST: j_vST,
              vRT: j_vRT,
              iPeakR: j_iPeakR,
              iPeakS: j_iPeakS,
              iPeakT: j_iPeakT,
              tpfR: j_tpfR,
              tpfS: j_tpfS,
              tpfT: j_tpfT,
              titikUkur: `PHB-TR Jurusan ${jNum}`
            };
          };

          const newPengukuran: PengukuranGardu = {
            id: `UKUR_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
            garduId: matchedMaster?.id || '',
            noGardu: finalNoGardu,
            noGarduLama: noGarduLamaRaw || finalNoGardu,
            noGarduBaru: noGarduBaruRaw || '',
            jamUkur,
            unit,
            penyulang,
            dayaKva,
            alamat,
            tanggalUkur: tglUkur, // Tersimpan rapi sebagai "6/8/2026"
            petugas,
            iRTotal,
            iSTotal,
            iTTotal,
            iNTotal,
            vRN,
            vSN,
            vTN,
            vRS,
            vST,
            vRT,
            thdR,
            thdS,
            thdT,
            iPeakR,
            iPeakS,
            iPeakT,
            tpfR,
            tpfS,
            tpfT,
            jurusan1: parseJurusan(1),
            jurusan2: parseJurusan(2),
            jurusan3: parseJurusan(3),
            jurusan4: parseJurusan(4),
            createdAt: new Date().toISOString()
          };

          items.push(newPengukuran);
        });

        setParsedRows(items);
        setSkippedCount(skipped);
        setValidationReport({
          total: rawJson.length,
          validCount: items.length,
          skippedCount: skipped,
          errors
        });
      } catch (err: any) {
        setValidationReport({
          total: 0,
          validCount: 0,
          skippedCount: 0,
          errors: [`Gagal memproses file Excel: ${err.message || 'Format file tidak didukung.'}`]
        });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Import Data Pengukuran Beban Gardu</h2>
              <p className="text-xs text-slate-400">
                Mendukung kolom Foto 2 (TGL Ukur, PETUGAS, Jam Ukur, No Gardu Lama/Baru, Penyulang, Ampere, Volt, THD, IPEAK, TPF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Download Template Action Bar */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Ketentuan Format:</span> Kolom TGL Ukur otomatis membaca format seperti <b>"6 Agustus 2026"</b> menjadi <b>"6/8/2026"</b>.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template Excel Sesuai Foto 2</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : fileName
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-700">Membaca &amp; Memvalidasi Baris Excel...</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  ✓ File berhasil dibaca. Klik di sini untuk mengganti file.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Tarik &amp; Lepaskan File Excel Pengukuran Gardu di Sini
                </p>
                <p className="text-[11px] text-slate-500 mt-1">atau klik untuk memilih file dari komputer (.xlsx, .xls, .csv)</p>
              </div>
            )}
          </div>

          {/* Validation & Preview Summary */}
          {validationReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Total Baris:</span>
                  <span className="text-sm font-black text-slate-900">{validationReport.total} Baris</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800">Valid &amp; Siap Upload:</span>
                  <span className="text-sm font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {validationReport.validCount} Pengukuran
                  </span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  validationReport.skippedCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span className="text-xs font-medium">Ditolak / Dilewati:</span>
                  <span className="text-sm font-black flex items-center gap-1">
                    {validationReport.skippedCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {validationReport.skippedCount} Baris
                  </span>
                </div>
              </div>

              {/* Error / Warning list if any */}
              {validationReport.errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1 max-h-36 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900 sticky top-0 bg-rose-50 pb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Catatan Validasi ({validationReport.errors.length} Baris Ditolak):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 font-medium">
                    {validationReport.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pratinjau Data Pengukuran Gardu ({parsedRows.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">Menampilkan maks 10 data pertama</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[9px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">TGL Ukur &amp; Petugas</th>
                          <th className="py-2.5 px-3">Jam</th>
                          <th className="py-2.5 px-3">No Gardu Lama / Baru</th>
                          <th className="py-2.5 px-3">Penyulang</th>
                          <th className="py-2.5 px-3 text-center">I (R/S/T/N) Total</th>
                          <th className="py-2.5 px-3 text-center">V (R-N, S-N, T-N)</th>
                          <th className="py-2.5 px-3 text-center">TPF (Cos φ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {parsedRows.slice(0, 10).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-emerald-800 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-600" />
                                <span>{p.tanggalUkur}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{p.petugas}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-semibold">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{p.jamUkur || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-blue-900">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>{p.noGarduLama || p.noGardu}</span>
                              </div>
                              {p.noGarduBaru && (
                                <div className="text-[10px] text-blue-600 font-medium">Baru: {p.noGarduBaru}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800">{p.penyulang}</span>
                              <div className="text-[10px] font-bold text-blue-700">{p.dayaKva} kVA</div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              <span className="text-blue-700">{p.iRTotal}</span> / {' '}
                              <span className="text-amber-700">{p.iSTotal}</span> / {' '}
                              <span className="text-rose-700">{p.iTTotal}</span> <br/>
                              <span className="text-[10px] text-slate-500 font-normal">N: {p.iNTotal} A</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-600 text-[11px]">
                              {p.vRN}V / {p.vSN}V / {p.vTN}V
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {p.tpfR || 0.92}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleApplyImport}
            disabled={parsedRows.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              parsedRows.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Upload &amp; Simpan ({parsedRows.length} Data Pengukuran)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
