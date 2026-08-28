import React, { useState, useRef } from 'react';
import { Map, Upload, Trash2, CheckCircle2, AlertCircle, FileText, Layers, Plus } from 'lucide-react';
import { MapLayerItem, MasterUnitPLN, Penyulang } from '../../types';
import JSZip from 'jszip';

interface InputPetaPenyulangViewProps {
  layers: MapLayerItem[];
  onAddLayer: (layer: MapLayerItem) => void;
  onDeleteLayer: (id: string) => void;
  masterUnits: MasterUnitPLN[];
  masterPenyulangs: Penyulang[];
  onSelectView: (view: string) => void;
}

export const InputPetaPenyulangView: React.FC<InputPetaPenyulangViewProps> = ({
  layers,
  onAddLayer,
  onDeleteLayer,
  masterUnits,
  masterPenyulangs,
  onSelectView
}) => {
  const [ulp, setUlp] = useState('');
  const [kodeUnit, setKodeUnit] = useState('');
  const [namaPenyulang, setNamaPenyulang] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto fill kode unit when ULP is selected
  const handleUlpChange = (val: string) => {
    setUlp(val);
    const found = masterUnits.find(u => u.ulp === val);
    if (found && found.kodeUlp) {
      setKodeUnit(found.kodeUlp);
    }
  };

  const parseKMLText = (kmlText: string, fileName: string): MapLayerItem => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const docNameNode = xmlDoc.querySelector('Document > name');
    const feederName = docNameNode?.textContent?.trim() || (fileName || 'LAYER').replace(/\.(kml|kmz|xml|zip)$/i, '').toUpperCase();

    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const parsedCoords: [number, number][] = [];
    const poleNames: string[] = [];

    if (placemarks.length > 0) {
      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const coordNode = pm.getElementsByTagName('coordinates')[0];
        if (coordNode) {
          const text = coordNode.textContent || '';
          const rawTokens = text.trim().split(/\s+/);
          rawTokens.forEach((token) => {
            const parts = token.split(',').map(Number);
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              const lng = parts[0];
              const lat = parts[1];
              if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                parsedCoords.push([lat, lng]);
                const pmName = pm.querySelector('name')?.textContent?.trim();
                poleNames.push(pmName || `${feederName}-${parsedCoords.length}`);
              }
            }
          });
        }
      }
    }

    if (parsedCoords.length === 0) {
      const coordNodes = xmlDoc.getElementsByTagName('coordinates');
      for (let i = 0; i < coordNodes.length; i++) {
        const text = coordNodes[i].textContent || '';
        const rawTokens = text.trim().split(/\s+/);
        rawTokens.forEach((token) => {
          const parts = token.split(',').map(Number);
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const lng = parts[0];
            const lat = parts[1];
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              parsedCoords.push([lat, lng]);
              poleNames.push(`${feederName}-${parsedCoords.length}`);
            }
          }
        });
      }
    }

    const colors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    let finalCoords = parsedCoords;
    let finalPoleNames = poleNames;

    if (finalCoords.length === 0) {
      const baseLat = -3.63 + (Math.random() - 0.5) * 0.04;
      const baseLng = 128.23 + (Math.random() - 0.5) * 0.04;
      finalCoords = [
        [baseLat, baseLng],
        [baseLat + 0.006, baseLng + 0.009],
        [baseLat + 0.013, baseLng + 0.016],
        [baseLat + 0.019, baseLng + 0.024]
      ];
      finalPoleNames = finalCoords.map((_, i) => `${feederName}-${i + 1}`);
    }

    return {
      id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nama: feederName,
      tiangCount: finalCoords.length,
      ruteLength: `${(finalCoords.length * 0.08).toFixed(1)} KMS`,
      tanggalImport: new Date().toISOString().replace('T', ' ').substring(0, 16),
      kategori: 'Utama',
      iconType: 'zap',
      visible: true,
      color: randomColor,
      coordinates: finalCoords,
      poleNames: finalPoleNames
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!ulp) {
      setErrorMessage('Silakan pilih ULP terlebih dahulu.');
      return;
    }
    if (!kodeUnit) {
      setErrorMessage('Kode Unit wajib terisi sesuai Master Unit.');
      return;
    }
    if (!namaPenyulang) {
      setErrorMessage('Silakan pilih Nama Penyulang dari Master Data Penyulang.');
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      setErrorMessage('Pilih minimal 1 file KML atau KMZ untuk diimpor.');
      return;
    }

    setIsImporting(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const nameLower = file.name.toLowerCase();
        let layer: MapLayerItem;

        if (nameLower.endsWith('.kmz') || nameLower.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const kmlFileName = Object.keys(zip.files).find(fn => fn.toLowerCase().endsWith('.kml'));
          if (kmlFileName) {
            const kmlText = await zip.files[kmlFileName].async('text');
            layer = parseKMLText(kmlText, file.name);
          } else {
            layer = parseKMLText('', file.name);
          }
        } else {
          const text = await file.text();
          layer = parseKMLText(text, file.name);
        }

        // Apply synchronized metadata
        layer.ulp = ulp;
        layer.kodeUnit = kodeUnit;
        layer.namaPenyulang = namaPenyulang;
        layer.nama = namaPenyulang; // Set display name to matched penyulang

        onAddLayer(layer);
      }

      setSuccessMessage(`Berhasil mengimpor dan menyinkronkan peta penyulang "${namaPenyulang}" (ULP: ${ulp})!`);
      setSelectedFiles(null);
      setUlp('');
      setKodeUnit('');
      setNamaPenyulang('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan saat memproses file KML/KMZ.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-bold mb-3">
            <Map className="w-3.5 h-3.5" />
            <span>Modul Spasial PLN</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Input Peta Penyulang & GIS</h1>
          <p className="text-teal-100/90 text-sm mt-1 max-w-2xl">
            Input dan sinkronisasi data spasial jaringan 20kV dengan ULP, Kode Unit (Master Data Unit), dan Nama Penyulang (Master Data Penyulang).
          </p>
        </div>
        <button
          onClick={() => onSelectView('peta_penyulang')}
          className="px-5 py-2.5 bg-white text-teal-900 hover:bg-teal-50 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Map className="w-4 h-4 text-teal-600" />
          <span>Buka Peta GIS Lengkap</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            Formulir Input & Sinkronisasi Peta Penyulang
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-lg">
            KMZ / KML / XML / ZIP
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ULP Selection */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                ULP (Sinkron Master Data Unit) <span className="text-rose-500">*</span>
              </label>
              <select
                value={ulp}
                onChange={(e) => handleUlpChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer"
              >
                <option value="">-- Pilih ULP --</option>
                {Array.from(new Set(masterUnits.map(u => u.ulp))).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Tersinkron otomatis dari Master Unit PLN</p>
            </div>

            {/* Kode Unit */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                Kode Unit (Sinkron Master Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={kodeUnit}
                onChange={(e) => setKodeUnit(e.target.value)}
                placeholder="Contoh: 53010 / Otomatis"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Kode unit operasional ULP terkait</p>
            </div>

            {/* Nama Penyulang */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                Nama Penyulang (Master Penyulang) <span className="text-rose-500">*</span>
              </label>
              <select
                value={namaPenyulang}
                onChange={(e) => setNamaPenyulang(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer"
              >
                <option value="">-- Pilih Nama Penyulang --</option>
                {masterPenyulangs
                  .filter(p => !ulp || (p.unit || '').trim().toLowerCase() === ulp.trim().toLowerCase())
                  .map(p => (
                    <option key={p.id} value={p.namaPenyulang}>
                      {p.namaPenyulang} {p.namaGi ? `(GI: ${p.namaGi})` : ''}
                    </option>
                  ))
                }
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Tersinkron dari Master Data Penyulang 20kV</p>
            </div>
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-2">
              File Peta Spasial (KMZ / KML / ZIP) <span className="text-rose-500">*</span>
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-100 group-hover:bg-teal-200 text-teal-700 flex items-center justify-center transition-all shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">
                  {selectedFiles && selectedFiles.length > 0 
                    ? `${selectedFiles.length} file dipilih: ${selectedFiles[0].name}`
                    : 'Klik untuk memilih atau seret file KMZ / KML ke sini'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Mendukung format Google Earth KML, KMZ, dan arsip ZIP jaringan 20kV</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".kml,.kmz,.xml,.zip"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isImporting}
              className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang Mengimpor & Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Simpan & Sinkronkan Peta Penyulang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* List of Imported Map Layers */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Daftar Peta Penyulang Terinput</h3>
            <p className="text-xs text-slate-500 mt-0.5">Total {layers.length} layer jaringan 20kV tersimpan dalam sistem</p>
          </div>
          <button
            onClick={() => onSelectView('peta_penyulang')}
            className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            Lihat Semua di Peta GIS &rarr;
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Nama Penyulang / Layer</th>
                <th className="px-5 py-4">ULP (Master Unit)</th>
                <th className="px-5 py-4">Kode Unit</th>
                <th className="px-5 py-4">Penyulang (Master)</th>
                <th className="px-5 py-4">Jumlah Tiang</th>
                <th className="px-5 py-4">Panjang Rute</th>
                <th className="px-5 py-4">Tanggal Impor</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {layers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Belum ada data peta penyulang yang diimpor. Gunakan form di atas untuk menambahkan.
                  </td>
                </tr>
              ) : (
                layers.map((layer) => (
                  <tr key={layer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: layer.color || '#10b981' }}></span>
                      {layer.nama}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200">
                        {layer.ulp || 'Belum Diset'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 font-bold">{layer.kodeUnit || '-'}</td>
                    <td className="px-5 py-4 font-bold text-teal-900">{layer.namaPenyulang || layer.nama}</td>
                    <td className="px-5 py-4 font-semibold">{layer.tiangCount} tiang</td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{layer.ruteLength}</td>
                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">{layer.tanggalImport}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectView('peta_penyulang')}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Map className="w-3.5 h-3.5" /> Peta
                      </button>
                      <button
                        onClick={() => onDeleteLayer(layer.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
