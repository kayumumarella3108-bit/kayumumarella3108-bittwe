import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Building,
  Zap,
  CheckCircle2,
  X,
  Link,
  Download,
  Gauge
} from 'lucide-react';

interface SurveyPhotoUploadSectionProps {
  fotoBangunan?: string;
  fotoTitikSambung?: string;
  fotoPengukuranTegangan?: string;
  onChangeFotoBangunan: (urlOrBase64: string | undefined) => void;
  onChangeFotoTitikSambung: (urlOrBase64: string | undefined) => void;
  onChangeFotoPengukuranTegangan?: (urlOrBase64: string | undefined) => void;
  namaPelanggan?: string;
  titikSambungNama?: string;
  teganganUkur?: number;
}

// Client-side image compression helper to ensure lightweight storage
export async function compressImageFile(file: File, maxWidth = 500, quality = 0.4): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = elem.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export const SurveyPhotoUploadSection: React.FC<SurveyPhotoUploadSectionProps> = ({
  fotoBangunan,
  fotoTitikSambung,
  fotoPengukuranTegangan,
  onChangeFotoBangunan,
  onChangeFotoTitikSambung,
  onChangeFotoPengukuranTegangan,
  namaPelanggan = 'Pelanggan',
  titikSambungNama = 'Tiang JTR',
  teganganUkur
}) => {
  // Modal state for full image preview
  const [previewModalImg, setPreviewModalImg] = useState<{ src: string; title: string } | null>(null);

  // URL input modal / toggle
  const [activeUrlInput, setActiveUrlInput] = useState<'bangunan' | 'titik_sambung' | 'tegangan' | null>(null);
  const [tempUrlValue, setTempUrlValue] = useState('');

  // Hidden File Inputs
  const fileInputBangunanRef = useRef<HTMLInputElement>(null);
  const cameraInputBangunanRef = useRef<HTMLInputElement>(null);
  const fileInputSambungRef = useRef<HTMLInputElement>(null);
  const cameraInputSambungRef = useRef<HTMLInputElement>(null);
  const fileInputTeganganRef = useRef<HTMLInputElement>(null);
  const cameraInputTeganganRef = useRef<HTMLInputElement>(null);

  const [loadingBangunan, setLoadingBangunan] = useState(false);
  const [loadingSambung, setLoadingSambung] = useState(false);
  const [loadingTegangan, setLoadingTegangan] = useState(false);

  const handleFileUpload = async (
    file: File | null,
    target: 'bangunan' | 'titik_sambung' | 'tegangan'
  ) => {
    if (!file) return;
    try {
      if (target === 'bangunan') setLoadingBangunan(true);
      else if (target === 'titik_sambung') setLoadingSambung(true);
      else setLoadingTegangan(true);

      const compressedBase64 = await compressImageFile(file);
      if (target === 'bangunan') {
        onChangeFotoBangunan(compressedBase64);
      } else if (target === 'titik_sambung') {
        onChangeFotoTitikSambung(compressedBase64);
      } else if (onChangeFotoPengukuranTegangan) {
        onChangeFotoPengukuranTegangan(compressedBase64);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Gagal memproses foto. Silakan coba file gambar lain.');
    } finally {
      if (target === 'bangunan') setLoadingBangunan(false);
      else if (target === 'titik_sambung') setLoadingSambung(false);
      else setLoadingTegangan(false);
    }
  };

  const handleSaveUrl = (target: 'bangunan' | 'titik_sambung' | 'tegangan') => {
    if (!tempUrlValue.trim()) return;
    if (target === 'bangunan') {
      onChangeFotoBangunan(tempUrlValue.trim());
    } else if (target === 'titik_sambung') {
      onChangeFotoTitikSambung(tempUrlValue.trim());
    } else if (onChangeFotoPengukuranTegangan) {
      onChangeFotoPengukuranTegangan(tempUrlValue.trim());
    }
    setActiveUrlInput(null);
    setTempUrlValue('');
  };

  return (
    <div className="space-y-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            Dokumentasi Foto Lapangan (Bangunan, Tiang & Foto Tegangan)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Unggah atau ambil foto bangunan calon pelanggan, tiang sambung, dan bukti foto pengukuran voltmeter/multimeter.
          </p>
        </div>
      </div>

      {/* Grid: 3 Kolom Foto Lapangan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* 1. KARTU FOTO BANGUNAN */}
        <div className="flex flex-col bg-slate-900/90 border border-sky-900/60 rounded-xl overflow-hidden shadow-lg">
          {/* Header Card */}
          <div className="px-3 py-2 bg-sky-950/60 border-b border-sky-800/50 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5 truncate">
              <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              1. Foto Bangunan
            </span>
            {fotoBangunan ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                Belum ada
              </span>
            )}
          </div>

          {/* Body Preview / Upload State */}
          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2.5">
            {fotoBangunan ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                <img
                  src={fotoBangunan}
                  alt={`Foto Bangunan ${namaPelanggan}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModalImg({
                        src: fotoBangunan,
                        title: `Foto Bangunan: ${namaPelanggan}`
                      })
                    }
                    className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-lg cursor-pointer"
                    title="Perbesar Foto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputBangunanRef.current?.click()}
                    className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg cursor-pointer"
                    title="Ganti Foto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFotoBangunan(undefined)}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-sky-800/40 bg-sky-950/10 p-3 text-center flex flex-col items-center justify-center min-h-[110px]">
                {loadingBangunan ? (
                  <div className="text-xs text-sky-400 animate-pulse flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <>
                    <Building className="w-6 h-6 text-sky-500/50 mb-1" />
                    <p className="text-[11px] text-slate-300 font-semibold">Tampak Depan Rumah</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Foto fisik lokasi / kWh meter
                    </p>
                  </>
                )}
              </div>
            )}

            {/* URL Input Bar if opened */}
            {activeUrlInput === 'bangunan' && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-sky-800/60 rounded-lg">
                <input
                  type="url"
                  placeholder="Paste URL foto..."
                  value={tempUrlValue}
                  onChange={(e) => setTempUrlValue(e.target.value)}
                  className="flex-1 px-2 py-1 bg-transparent text-[11px] text-white outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveUrl('bangunan')}
                  className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUrlInput(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => cameraInputBangunanRef.current?.click()}
                className="py-1 px-1 bg-sky-950 hover:bg-sky-900 border border-sky-800/70 text-sky-300 hover:text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3 text-sky-400" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputBangunanRef.current?.click()}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>Galeri</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveUrlInput(activeUrlInput === 'bangunan' ? null : 'bangunan');
                  setTempUrlValue(fotoBangunan || '');
                }}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Link className="w-3 h-3 text-emerald-400" />
                <span>URL</span>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputBangunanRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'bangunan');
              }}
            />
            <input
              type="file"
              ref={cameraInputBangunanRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'bangunan');
              }}
            />
          </div>
        </div>

        {/* 2. KARTU FOTO TITIK SAMBUNG / TIANG TR */}
        <div className="flex flex-col bg-slate-900/90 border border-amber-900/60 rounded-xl overflow-hidden shadow-lg">
          {/* Header Card */}
          <div className="px-3 py-2 bg-amber-950/60 border-b border-amber-800/50 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              2. Foto Titik Sambung
            </span>
            {fotoTitikSambung ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                Belum ada
              </span>
            )}
          </div>

          {/* Body Preview / Upload State */}
          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2.5">
            {fotoTitikSambung ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                <img
                  src={fotoTitikSambung}
                  alt={`Foto Titik Sambung ${titikSambungNama}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModalImg({
                        src: fotoTitikSambung,
                        title: `Foto Titik Sambung: ${titikSambungNama}`
                      })
                    }
                    className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-lg cursor-pointer"
                    title="Perbesar Foto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputSambungRef.current?.click()}
                    className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg cursor-pointer"
                    title="Ganti Foto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFotoTitikSambung(undefined)}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-amber-800/40 bg-amber-950/10 p-3 text-center flex flex-col items-center justify-center min-h-[110px]">
                {loadingSambung ? (
                  <div className="text-xs text-amber-400 animate-pulse flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <>
                    <Zap className="w-6 h-6 text-amber-500/50 mb-1" />
                    <p className="text-[11px] text-slate-300 font-semibold">Tiang JTR / Sambungan SR</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Foto tiang sambungan TR
                    </p>
                  </>
                )}
              </div>
            )}

            {/* URL Input Bar if opened */}
            {activeUrlInput === 'titik_sambung' && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-amber-800/60 rounded-lg">
                <input
                  type="url"
                  placeholder="Paste URL foto..."
                  value={tempUrlValue}
                  onChange={(e) => setTempUrlValue(e.target.value)}
                  className="flex-1 px-2 py-1 bg-transparent text-[11px] text-white outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveUrl('titik_sambung')}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold rounded"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUrlInput(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => cameraInputSambungRef.current?.click()}
                className="py-1 px-1 bg-amber-950 hover:bg-amber-900 border border-amber-800/70 text-amber-300 hover:text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3 text-amber-400" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputSambungRef.current?.click()}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>Galeri</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveUrlInput(activeUrlInput === 'titik_sambung' ? null : 'titik_sambung');
                  setTempUrlValue(fotoTitikSambung || '');
                }}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Link className="w-3 h-3 text-emerald-400" />
                <span>URL</span>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputSambungRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'titik_sambung');
              }}
            />
            <input
              type="file"
              ref={cameraInputSambungRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'titik_sambung');
              }}
            />
          </div>
        </div>

        {/* 3. KARTU FOTO PENGUKURAN TEGANGAN / MULTIMETER */}
        <div className="flex flex-col bg-slate-900/90 border border-emerald-900/60 rounded-xl overflow-hidden shadow-lg">
          {/* Header Card */}
          <div className="px-3 py-2 bg-emerald-950/60 border-b border-emerald-800/50 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 truncate">
              <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              3. Foto Tegangan
            </span>
            {fotoPengukuranTegangan ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                Belum ada
              </span>
            )}
          </div>

          {/* Body Preview / Upload State */}
          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2.5">
            {fotoPengukuranTegangan ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                <img
                  src={fotoPengukuranTegangan}
                  alt="Foto Pengukuran Voltase Multimeter"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModalImg({
                        src: fotoPengukuranTegangan,
                        title: `Foto Pengukuran Multimeter ${teganganUkur ? `(${teganganUkur} Volt)` : ''}`
                      })
                    }
                    className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-lg cursor-pointer"
                    title="Perbesar Foto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputTeganganRef.current?.click()}
                    className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg cursor-pointer"
                    title="Ganti Foto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFotoPengukuranTegangan && onChangeFotoPengukuranTegangan(undefined)}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-emerald-800/40 bg-emerald-950/10 p-3 text-center flex flex-col items-center justify-center min-h-[110px]">
                {loadingTegangan ? (
                  <div className="text-xs text-emerald-400 animate-pulse flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <>
                    <Gauge className="w-6 h-6 text-emerald-500/50 mb-1" />
                    <p className="text-[11px] text-slate-300 font-semibold">Foto Multimeter / Voltase</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {teganganUkur ? `Terukur: ${teganganUkur} Volt` : 'Foto display alat ukur'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* URL Input Bar if opened */}
            {activeUrlInput === 'tegangan' && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-emerald-800/60 rounded-lg">
                <input
                  type="url"
                  placeholder="Paste URL foto..."
                  value={tempUrlValue}
                  onChange={(e) => setTempUrlValue(e.target.value)}
                  className="flex-1 px-2 py-1 bg-transparent text-[11px] text-white outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveUrl('tegangan')}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUrlInput(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => cameraInputTeganganRef.current?.click()}
                className="py-1 px-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/70 text-emerald-300 hover:text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3 text-emerald-400" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputTeganganRef.current?.click()}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>Galeri</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveUrlInput(activeUrlInput === 'tegangan' ? null : 'tegangan');
                  setTempUrlValue(fotoPengukuranTegangan || '');
                }}
                className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Link className="w-3 h-3 text-emerald-400" />
                <span>URL</span>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputTeganganRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'tegangan');
              }}
            />
            <input
              type="file"
              ref={cameraInputTeganganRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileUpload(file, 'tegangan');
              }}
            />
          </div>
        </div>
      </div>

      {/* Full-Screen / Lightbox Modal for Photo Preview */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {previewModalImg.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/60 max-h-[75vh] overflow-auto">
              <img
                src={previewModalImg.src}
                alt={previewModalImg.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Dokumentasi Visual Survey Lapangan ULP Baguala</span>
              <a
                href={previewModalImg.src}
                download="foto_survey_baguala.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Foto
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
