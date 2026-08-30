import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  Trees,
  RefreshCw,
  Sparkles,
  MapPin,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  Calendar,
  Building2
} from 'lucide-react';
import { PohonGisItem, Penyulang } from '../../types';
import { INITIAL_PENYULANG } from '../../data/mockData';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import {
  readGisFileWithValidation,
  convertToPohonItems,
  RawGisFeature,
  GisValidationReport
} from '../../utils/gisFileParser';

interface ImportPohonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: PohonGisItem[]) => void;
  penyulangList?: Penyulang[];
}

export const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

export const YEAR_OPTIONS = [2023, 2024, 2025, 2026, 2027, 2028];

export const ICON_OPTIONS: { id: NonNullable<PohonGisItem['iconType']>; label: string; emoji: string; desc: string; category: string }[] = [
  { id: 'pohon', label: 'Pohon Rimbun', emoji: '🌳', desc: 'Trembesi, Mahoni, Sengon', category: 'Pohon & ROW' },
  { id: 'kelapa', label: 'Kelapa / Palem', emoji: '🌴', desc: 'Kelapa, Pinang, Palem', category: 'Pohon & ROW' },
  { id: 'bambu', label: 'Bambu & Ranting', emoji: '🎋', desc: 'Rumpun Bambu, Semak', category: 'Pohon & ROW' },
  { id: 'leaf', label: 'Daun / Sulur', emoji: '🍃', desc: 'Ranting & Rambatan Tanaman', category: 'Pohon & ROW' },
  { id: 'saw', label: 'Gergaji ROW', emoji: '🪚', desc: 'Target Eksekusi Pangkas', category: 'Pohon & ROW' },
  { id: 'tiang', label: 'Tiang JTM / Distribusi', emoji: '🗼', desc: 'Tiang SUTM / Distribusi', category: 'Tiang Listrik' },
  { id: 'tiang_besi', label: 'Tiang Percabangan', emoji: '💈', desc: 'Tiang Ujung & Percabangan', category: 'Tiang Listrik' },
  { id: 'pin', label: 'Pin Tagging GPS', emoji: '📍', desc: 'Penanda Titik Acuan', category: 'Tiang Listrik' },
  { id: 'konstruksi', label: 'Konstruksi & Travers', emoji: '🏗️', desc: 'Crossarm, Isolator, Rekonstruksi', category: 'Konstruksi & Gardu' },
  { id: 'gardu', label: 'Gardu Trafo / GTT', emoji: '⚡', desc: 'Trafo Distribusi 20kV / Gardu', category: 'Konstruksi & Gardu' },
  { id: 'crane', label: 'Alat Berat / Har', emoji: '🚜', desc: 'Mobil Crane / Tim Har', category: 'Konstruksi & Gardu' },
  { id: 'warning', label: 'Bahaya Kritis / Anomali', emoji: '⚠️', desc: 'Rawan Gangguan / Darurat', category: 'Konstruksi & Gardu' }
];

export const ImportPohonModal: React.FC<ImportPohonModalProps> = ({
  isOpen,
  onClose,
  onImport,
  penyulangList = []
}) => {
  const now = new Date();
  const activeFeeders = penyulangList && penyulangList.length > 0 ? penyulangList : INITIAL_PENYULANG;

  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [validationReport, setValidationReport] = useState<GisValidationReport | null>(null);
  const [rawFeatures, setRawFeatures] = useState<RawGisFeature[]>([]);
  const [parsedItems, setParsedItems] = useState<PohonGisItem[]>([]);
  const [defaultPenyulang, setDefaultPenyulang] = useState<string>(
    activeFeeders[0]?.namaPenyulang || (activeFeeders[0] as any)?.nama || 'PASSO'
  );
  const [selectedUlp, setSelectedUlp] = useState<string>('ULP Baguala');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedIcon, setSelectedIcon] = useState<NonNullable<PohonGisItem['iconType']>>('pohon');
  const [showErrorRows, setShowErrorRows] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validPenyulangNames = activeFeeders
    .map((p) => p?.namaPenyulang || (p as any)?.nama)
    .filter((n): n is string => Boolean(n));

  const processFeatures = (
    features: RawGisFeature[],
    feeder: string,
    icon: NonNullable<PohonGisItem['iconType']>,
    month: number,
    year: number,
    ulpName: string
  ) => {
    const converted = convertToPohonItems(features, feeder, icon, validPenyulangNames);
    const monthPad = String(month).padStart(2, '0');
    const targetDateStr = `${year}-${monthPad}-01`;
    const targetUnitObj = DAFTAR_UNIT_PLN.find(u => u.namaUnit === ulpName);

    const updated = converted.map((item) => {
      const finalPenyulang = feeder || item.penyulang;
      const matchedP = activeFeeders.find(
        (p) =>
          ((p.namaPenyulang || (p as any).nama) || '').toUpperCase() === (finalPenyulang || '').toUpperCase()
      );

      return {
        ...item,
        penyulang: finalPenyulang,
        unit: ulpName || matchedP?.unit || item.unit || 'ULP Baguala',
        kodeUnit: targetUnitObj?.kodeUnit || matchedP?.kodeUnit || item.kodeUnit || '41130',
        tglTemuan: targetDateStr
      };
    });

    setParsedItems(updated);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setIsProcessing(true);
    setValidationReport(null);
    setShowErrorRows(false);

    try {
      const report = await readGisFileWithValidation(file);
      setValidationReport(report);

      if (!report.isValid || report.features.length === 0) {
        setRawFeatures([]);
        setParsedItems([]);
      } else {
        setRawFeatures(report.features);
        processFeatures(report.features, defaultPenyulang, selectedIcon, selectedMonth, selectedYear, selectedUlp);
      }
    } catch (err: any) {
      console.error('Import validation error:', err);
      setValidationReport({
        isValid: false,
        fileType: 'unknown',
        fileName: file.name,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors: [`Gagal memproses file: ${err.message || 'Format tidak didukung'}`],
        warnings: []
      });
      setRawFeatures([]);
      setParsedItems([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUlpChange = (ulp: string) => {
    setSelectedUlp(ulp);
    if (rawFeatures.length > 0) {
      processFeatures(rawFeatures, defaultPenyulang, selectedIcon, selectedMonth, selectedYear, ulp);
    }
  };

  const handlePenyulangChange = (feeder: string) => {
    setDefaultPenyulang(feeder);
    if (rawFeatures.length > 0) {
      processFeatures(rawFeatures, feeder, selectedIcon, selectedMonth, selectedYear, selectedUlp);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    if (rawFeatures.length > 0) {
      processFeatures(rawFeatures, defaultPenyulang, selectedIcon, month, selectedYear, selectedUlp);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (rawFeatures.length > 0) {
      processFeatures(rawFeatures, defaultPenyulang, selectedIcon, selectedMonth, year, selectedUlp);
    }
  };

  const handleIconChange = (icon: NonNullable<PohonGisItem['iconType']>) => {
    setSelectedIcon(icon);
    if (rawFeatures.length > 0) {
      processFeatures(rawFeatures, defaultPenyulang, icon, selectedMonth, selectedYear, selectedUlp);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `penyulang,notiang,jenispohon,jumlahpohon,lokasi,lat,lng,statuseksekusi,keterangan
PASSO,TG-14,Pohon Trembesi,2,Jl. Wolter Monginsidi Paso,-3.628100,128.242300,Perlu Tebas,Dahan mendekati konduktor 20kV
WAIHERU,TG-32,Pohon Kelapa,1,Desa Waiheru Dalam,-3.619500,128.228900,Perlu Tebang,Pohon condong ke arah jaringan
HUTUMURI,TG-08,Bambu Liar,4,Jalur Hative Besar,-3.641200,128.256700,Perlu Izin Warga,Perlu koordinasi kepala dusun
LATERI,TG-19,Pohon Mangga,1,Jl. Raya Lateri,-3.635400,128.237800,Perlu Tebas,Dekat travers JTM`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_Import_Titik_Pohon_ROW.csv';
    link.click();
  };

  const handleDownloadGeoJsonTemplate = () => {
    const sampleGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [128.2423, -3.6281]
          },
          properties: {
            penyulang: "PASSO",
            notiang: "TG-14",
            jenispohon: "Pohon Trembesi",
            jumlahpohon: 2,
            lokasi: "Jl. Wolter Monginsidi Paso",
            statuseksekusi: "Perlu Tebas"
          }
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [128.2289, -3.6195]
          },
          properties: {
            penyulang: "WAIHERU",
            notiang: "TG-32",
            jenispohon: "Pohon Kelapa",
            jumlahpohon: 1,
            lokasi: "Desa Waiheru Dalam",
            statuseksekusi: "Perlu Tebang"
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleGeoJson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_Import_Titik_Pohon.geojson';
    link.click();
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImport(parsedItems);
    onClose();
  };

  const resetForm = () => {
    setFileName('');
    setValidationReport(null);
    setRawFeatures([]);
    setParsedItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Import Titik Pohon GIS & Validasi Format
              </h2>
              <p className="text-xs text-slate-400">
                Pemeriksaan otomatis struktur kolom, koordinat (Lat, Lng), dan penyulang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Format Requirements & Download Templates Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-semibold">Format didukung:</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded border border-emerald-500/30">.CSV / Excel</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold rounded border border-blue-500/30">.GeoJSON</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded border border-amber-500/30">.KML / .KMZ</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Download Template CSV
              </button>
              <button
                type="button"
                onClick={handleDownloadGeoJsonTemplate}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Template GeoJSON
              </button>
            </div>
          </div>

          {/* Setup ULP Target, Penyulang, Periode Bulan/Tahun, & Pilihan Icon */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            {/* Pilihan ULP Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>🏢 Pilihan ULP Target:</span>
              </label>
              <select
                value={selectedUlp}
                onChange={(e) => handleUlpChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {DAFTAR_UNIT_PLN.map((u) => (
                  <option key={u.kodeUnit || u.namaUnit} value={u.namaUnit}>
                    {u.namaUnit} ({u.kodeUnit})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Disinkronkan dengan Master Data Unit
              </p>
            </div>

            {/* Penyulang Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>⚡ Default Penyulang Target:</span>
              </label>
              <select
                value={defaultPenyulang}
                onChange={(e) => handlePenyulangChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {activeFeeders.map((p, idx) => {
                  const name = p.namaPenyulang || (p as any).nama || `Penyulang ${idx + 1}`;
                  const lengthStr = (p.panjangJaringanKms || (p as any).panjangJtm) ? `(${p.panjangJaringanKms || (p as any).panjangJtm} kms)` : '';
                  const giStr = p.namaGi ? `[${p.namaGi}]` : '';
                  return (
                    <option key={p.id || `${name}-${idx}`} value={name}>
                      {name} {giStr} {lengthStr}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400">
                Disinkronkan dengan Master Data Penyulang
              </p>
            </div>

            {/* Periode Inspeksi (Bulan & Tahun) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>📅 Periode Bulan & Tahun:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400">
                Tanggal temuan: <span className="text-emerald-300 font-mono font-bold">{selectedYear}-{String(selectedMonth).padStart(2, '0')}-01</span>
              </p>
            </div>

            {/* Pilihan Icon */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>🎨 Icon Titik Pohon:</span>
                <span className="text-emerald-400 text-[11px] font-bold">
                  {ICON_OPTIONS.find(i => i.id === selectedIcon)?.emoji} {ICON_OPTIONS.find(i => i.id === selectedIcon)?.label}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleIconChange(opt.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      selectedIcon === opt.id
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={opt.desc}
                  >
                    <span>{opt.emoji}</span>
                    <span className="text-[11px]">{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                : validationReport && !validationReport.isValid
                ? 'border-red-600/70 bg-red-950/20 hover:bg-red-950/30'
                : validationReport && validationReport.isValid
                ? 'border-emerald-500/60 bg-emerald-950/20 hover:bg-emerald-950/30'
                : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".kml,.kmz,.geojson,.json,.csv,.txt,.xml"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className={`p-3 rounded-full mb-2 ring-6 ${
              validationReport && !validationReport.isValid
                ? 'bg-red-500/20 text-red-400 ring-red-500/10'
                : validationReport && validationReport.isValid
                ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/10'
                : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/5'
            }`}>
              {validationReport && !validationReport.isValid ? (
                <AlertOctagon className="w-6 h-6 text-red-400" />
              ) : validationReport && validationReport.isValid ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-bold text-white mb-0.5">
              {fileName ? fileName : 'Pilih atau Tarik File Peta Titik Pohon (CSV / KML / GeoJSON)'}
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Sistem akan memvalidasi kolom wajib (<strong className="text-slate-300">lat, lng</strong>) serta informasi pendukung (<strong className="text-slate-300">penyulang, notiang, jenispohon, lokasi</strong>).
            </p>
            {isProcessing && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memvalidasi format kolom dan membaca koordinat...
              </div>
            )}
          </div>

          {/* Validation Error Alert Box */}
          {validationReport && !validationReport.isValid && (
            <div className="p-4 bg-red-950/60 border border-red-800/90 rounded-2xl space-y-3 animate-fadeIn text-xs text-red-200 shadow-xl shadow-red-950/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-red-300">
                      Validasi Format File Gagal
                    </h4>
                    <p className="text-xs text-red-300/90 mt-0.5">
                      File <span className="font-mono font-bold text-white">{validationReport.fileName}</span> tidak sesuai dengan spesifikasi format yang dibutuhkan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2.5 py-1 bg-red-900/50 hover:bg-red-800/60 text-red-200 border border-red-700/60 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Pilih File Ulang
                </button>
              </div>

              {/* Error list */}
              <div className="p-3 bg-red-950/80 rounded-xl border border-red-900/80 space-y-1.5">
                {validationReport.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>

              {/* Column status diagnostics if CSV */}
              {validationReport.detectedHeaders && validationReport.detectedHeaders.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-red-900/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">Diagnostik Kolom Header:</span>
                  </div>
                  
                  {/* Missing required */}
                  {validationReport.missingRequiredColumns && validationReport.missingRequiredColumns.length > 0 && (
                    <div>
                      <span className="text-[11px] text-red-400 font-semibold block mb-1">
                        ❌ Kolom Wajib yang Belum Ada:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {validationReport.missingRequiredColumns.map((col, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[11px] font-mono font-bold"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detected headers */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                      📋 Kolom Terdeteksi dalam File Anda:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {validationReport.detectedHeaders.map((h, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] font-mono"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Row Errors list */}
              {validationReport.rowErrors && validationReport.rowErrors.length > 0 && (
                <div className="pt-2 border-t border-red-900/60">
                  <button
                    type="button"
                    onClick={() => setShowErrorRows(!showErrorRows)}
                    className="text-[11px] font-bold text-red-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showErrorRows ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showErrorRows ? 'Sembunyikan' : 'Lihat'} detail {validationReport.rowErrors.length} baris bermasalah</span>
                  </button>

                  {showErrorRows && (
                    <div className="mt-2 p-2 bg-slate-950/80 rounded-lg border border-red-900/60 max-h-32 overflow-y-auto space-y-1 text-[11px]">
                      {validationReport.rowErrors.map((re, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 py-0.5 text-slate-300 border-b border-slate-850 last:border-0">
                          <span className="font-mono text-red-400 font-bold shrink-0">Baris {re.row}</span>
                          <span className="text-right text-slate-400">{re.reason} {re.sample ? `(${re.sample})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendation & Template action */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-red-900/60 bg-red-950/40 p-2.5 rounded-xl">
                <div className="text-[11px] text-red-300">
                  <p className="font-bold">Solusi Cepat:</p>
                  <p>Unduh template standar kami dan salin data pohon Anda ke dalam kolom yang sesuai.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shrink-0 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template CSV
                </button>
              </div>
            </div>
          )}

          {/* Validation Warnings (Non-fatal) */}
          {validationReport && validationReport.isValid && validationReport.warnings.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/70 rounded-xl text-xs text-amber-300 flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-amber-200">Catatan Validasi File:</p>
                {validationReport.warnings.map((w, idx) => (
                  <p key={idx} className="text-amber-300/90 text-[11px]">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Validation Success & Parsed Summary */}
          {validationReport && validationReport.isValid && parsedItems.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between bg-emerald-950/40 border border-emerald-700/60 p-3.5 rounded-xl gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-200 flex items-center gap-2">
                      <span>Format Valid: {parsedItems.length} Titik Siap Diimpor</span>
                      <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] font-mono rounded">
                        .{validationReport.fileType.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      ULP: <strong className="text-emerald-300">{selectedUlp}</strong> • Penyulang: <strong className="text-white">{defaultPenyulang}</strong> • Periode: <strong className="text-emerald-300">{MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong> • Icon: <strong className="text-white">{ICON_OPTIONS.find(i => i.id === selectedIcon)?.emoji} {ICON_OPTIONS.find(i => i.id === selectedIcon)?.label}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono">
                    Total: {validationReport.totalItems} baris
                  </span>
                  <span className="px-3 py-1 bg-emerald-600/30 text-emerald-300 font-black rounded-lg text-xs border border-emerald-500/40">
                    ✓ {parsedItems.length} Titik Valid
                  </span>
                </div>
              </div>

              {/* Detected Headers pills */}
              {validationReport.detectedHeaders && (
                <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto py-1 text-slate-400">
                  <span className="font-semibold shrink-0">Kolom aktif:</span>
                  {validationReport.detectedHeaders.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 text-emerald-300 rounded border border-slate-700 font-mono text-[10px]">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Icon</th>
                      <th className="py-2 px-3">Jenis Pohon</th>
                      <th className="py-2 px-3">Lokasi</th>
                      <th className="py-2 px-3">Koordinat (Lat, Lng)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/60 text-slate-300">
                    {parsedItems.slice(0, 10).map((item, idx) => {
                      const iconOpt = ICON_OPTIONS.find(o => o.id === item.iconType) || ICON_OPTIONS[0];
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-1.5 px-3 font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                          <td className="py-1.5 px-3 text-base">{iconOpt.emoji}</td>
                          <td className="py-1.5 px-3 font-medium">{item.jenisPohon}</td>
                          <td className="py-1.5 px-3 text-slate-400 max-w-[150px] truncate" title={item.lokasi}>
                            {item.lokasi || '-'}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                            {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {parsedItems.length > 10 && (
                  <div className="py-1.5 px-3 bg-slate-950/90 text-center text-[11px] text-slate-400 font-semibold border-t border-slate-800">
                    ... dan {parsedItems.length - 10} titik lainnya
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              parsedItems.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            Simpan {parsedItems.length > 0 ? `${parsedItems.length} Titik Pohon` : 'Data'} ke Peta
          </button>
        </div>

      </div>
    </div>
  );
};

