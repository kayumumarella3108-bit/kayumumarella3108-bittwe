import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  Building2,
  Info,
  MapPin,
  RefreshCw,
  Zap,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterGardu, Penyulang } from '../../types';

interface ImportGarduModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: MasterGardu[]) => void;
  penyulangList?: Penyulang[];
}

export const ImportGarduModal: React.FC<ImportGarduModalProps> = ({
  isOpen,
  onClose,
  onImport,
  penyulangList = []
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<MasterGardu[]>([]);
  const [validationReport, setValidationReport] = useState<{
    total: number;
    validCoordsCount: number;
    missingCoordsCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate and download sample Excel template strictly matching the 11 columns
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'NO baru',
      'NO GARDU lama',
      'ALAMAT',
      'PENYULANG',
      'DAYA',
      'PHASE',
      'STATUS',
      'AKTIF',
      'LATITUDE',
      'LONGITUDE',
      'THNOPERASI'
    ];

    const sampleRows = [
      {
        'NO baru': 'GD-PSO-004',
        'NO GARDU lama': 'PSO-004',
        'ALAMAT': 'Jl. Syaranamual Passo No. 12, Baguala',
        'PENYULANG': 'PASSO',
        'DAYA': 160,
        'PHASE': '3 Fasa',
        'STATUS': 'Operasi',
        'AKTIF': 'Aktif',
        'LATITUDE': -3.649200,
        'LONGITUDE': 128.231200,
        'THNOPERASI': 2018
      },
      {
        'NO baru': 'GD-LTR2-015',
        'NO GARDU lama': 'LTR2-015',
        'ALAMAT': 'Jl. Laksdya Leo Wattimena Lateri',
        'PENYULANG': 'LATERI 2',
        'DAYA': 250,
        'PHASE': '3 Fasa',
        'STATUS': 'Operasi',
        'AKTIF': 'Aktif',
        'LATITUDE': -3.652100,
        'LONGITUDE': 128.214500,
        'THNOPERASI': 2019
      },
      {
        'NO baru': 'GD-WH2-008',
        'NO GARDU lama': 'WH2-008',
        'ALAMAT': 'Jl. Laksda Yos Sudarso Waiheru',
        'PENYULANG': 'WAIHERU 2',
        'DAYA': 100,
        'PHASE': '3 Fasa',
        'STATUS': 'Operasi',
        'AKTIF': 'Aktif',
        'LATITUDE': -3.639500,
        'LONGITUDE': 128.201100,
        'THNOPERASI': 2015
      },
      {
        'NO baru': 'GD-TLH-021',
        'NO GARDU lama': 'TLH-021',
        'ALAMAT': 'Jl. Raya Tulehu Pertigaan Pasar',
        'PENYULANG': 'TULEHU',
        'DAYA': 400,
        'PHASE': '3 Fasa',
        'STATUS': 'Operasi',
        'AKTIF': 'Aktif',
        'LATITUDE': -3.587100,
        'LONGITUDE': 128.328900,
        'THNOPERASI': 2021
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: templateHeaders });
    
    // Set explicit column widths for pleasant viewing in Excel
    worksheet['!cols'] = [
      { wch: 16 }, // NO baru
      { wch: 16 }, // NO GARDU lama
      { wch: 38 }, // ALAMAT
      { wch: 16 }, // PENYULANG
      { wch: 10 }, // DAYA
      { wch: 12 }, // PHASE
      { wch: 14 }, // STATUS
      { wch: 12 }, // AKTIF
      { wch: 16 }, // LATITUDE
      { wch: 16 }, // LONGITUDE
      { wch: 14 }  // THNOPERASI
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Gardu');

    XLSX.writeFile(workbook, 'Template_Master_Gardu_PLN.xlsx');
  };

  // Helper to match column headers intelligently without cross-matching
  const findHeaderValue = (
    row: Record<string, any>,
    possibleKeys: string[],
    excludeSubstrings: string[] = []
  ): any => {
    const keys = Object.keys(row);

    // Phase 1: Exact normalized match (alphanumeric only)
    for (const targetKey of possibleKeys) {
      const targetNorm = targetKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const key of keys) {
        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normKey === targetNorm) {
          return row[key];
        }
      }
    }

    // Phase 2: Substring match with exclusion check
    for (const targetKey of possibleKeys) {
      const targetNorm = targetKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const key of keys) {
        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

        const isExcluded = excludeSubstrings.some((ex) =>
          normKey.includes(ex.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );
        if (isExcluded) continue;

        if (normKey.includes(targetNorm)) {
          return row[key];
        }
      }
    }

    return undefined;
  };

  // Parse Excel or CSV file
  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setValidationReport(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        throw new Error('File Excel tidak berisi baris data.');
      }

      const items: MasterGardu[] = [];
      let validCoordsCount = 0;
      let missingCoordsCount = 0;
      const errors: string[] = [];

      rawJson.forEach((row, idx) => {
        // 1. NO baru
        let rawNoBaru = String(
          findHeaderValue(
            row,
            ['no baru', 'nobaru', 'no_baru', 'no gardu baru', 'nogardubaru', 'gardu baru', 'kode gardu baru', 'id gardu baru', 'no gardu', 'nogardu'],
            ['lama']
          ) || ''
        ).trim();

        // 2. NO GARDU lama
        let rawNoLama = String(
          findHeaderValue(
            row,
            ['no gardu lama', 'nogardulama', 'no_gardu_lama', 'gardu lama', 'kode gardu lama', 'id gardu lama', 'no lama', 'nolama', 'lama'],
            ['baru']
          ) || ''
        ).trim();

        // Handle compound names like "GD-PSO-004 (Lama: PSO-004)"
        if (!rawNoLama && rawNoBaru) {
          if (rawNoBaru.toLowerCase().includes('lama:')) {
            const parts = rawNoBaru.split(/lama:/i);
            rawNoBaru = parts[0].replace(/[\(\)\[\]]/g, '').trim();
            rawNoLama = parts[1].replace(/[\(\)\[\]]/g, '').trim();
          } else if (rawNoBaru.includes('/')) {
            const parts = rawNoBaru.split('/');
            if (parts.length >= 2) {
              rawNoBaru = parts[0].trim();
              rawNoLama = parts[1].trim();
            }
          }
        }

        const displayNoBaru = rawNoBaru || rawNoLama || `GD-${idx + 1}`;
        const displayNoLama = rawNoLama || rawNoBaru || '-';

        // 3. ALAMAT
        const alamat = String(
          findHeaderValue(row, ['alamat', 'alamat gardu', 'alamatgardu', 'lokasi', 'lokasi gardu']) || ''
        ).trim();

        // 4. PENYULANG
        const defaultPenyulang = penyulangList[0]?.namaPenyulang || 'PASSO';
        const rawPenyulang = findHeaderValue(row, ['penyulang', 'feeder', 'penyulang id', 'nama penyulang']);
        const penyulang = String(rawPenyulang !== undefined && rawPenyulang !== '' ? rawPenyulang : defaultPenyulang).trim().toUpperCase();

        // 5. DAYA
        const rawDaya = findHeaderValue(row, ['daya', 'daya (kva)', 'daya kva', 'kapasitas', 'daya trafo']);
        const daya = rawDaya !== undefined && rawDaya !== '' ? (parseFloat(String(rawDaya).replace(',', '.')) || 160) : 160;

        // 6. PHASE
        const rawPhase = findHeaderValue(row, ['phase', 'fasa', 'jumlah fasa', 'fasa trafo', 'phasa']);
        const phase = String(rawPhase || '3 Fasa').trim();

        // 7. STATUS
        const rawStatus = findHeaderValue(row, ['status', 'status operasi', 'status gardu', 'kondisi']);
        const status = String(rawStatus || 'Operasi').trim();

        // 8. AKTIF
        const rawAktif = findHeaderValue(row, ['aktif', 'is aktif', 'is_aktif', 'keaktifan']);
        const aktif = rawAktif !== undefined && String(rawAktif).trim() !== '' ? String(rawAktif).trim() : 'Aktif';

        // 9. LATITUDE & 10. LONGITUDE
        const latVal = findHeaderValue(row, ['latitude', 'latt', 'lat', 'y', 'koordinat y', 'latitude y']);
        const longVal = findHeaderValue(row, ['longitude', 'long', 'lng', 'x', 'koordinat x', 'longitude x']);

        const latNum = latVal !== undefined && latVal !== '' ? parseFloat(String(latVal).replace(',', '.')) : NaN;
        const longNum = longVal !== undefined && longVal !== '' ? parseFloat(String(longVal).replace(',', '.')) : NaN;

        const hasValidCoords = !isNaN(latNum) && !isNaN(longNum) && latNum !== 0 && longNum !== 0;
        if (hasValidCoords) {
          validCoordsCount++;
        } else {
          missingCoordsCount++;
        }

        // 11. THNOPERASI
        const rawThn = findHeaderValue(row, ['thnoperasi', 'thn operasi', 'thn_operasi', 'tahun operasi', 'tahunoperasi', 'tahun', 'cod']);
        const thnOperasi = rawThn !== undefined && String(rawThn).trim() !== '' ? String(rawThn).trim() : String(new Date().getFullYear());

        const newGardu: MasterGardu = {
          id: `gardu_import_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          noBaru: displayNoBaru,
          noGarduBaru: displayNoBaru,
          noGarduLama: displayNoLama,
          alamat: alamat || 'Jl. Raya Baguala, Ambon',
          alamatGardu: alamat || 'Jl. Raya Baguala, Ambon',
          penyulang: penyulang,
          daya: daya,
          phase: phase,
          jumlahFasa: phase,
          status: status,
          aktif: aktif,
          latitude: hasValidCoords ? latNum : -3.659,
          latt: hasValidCoords ? latNum : -3.659,
          longitude: hasValidCoords ? longNum : 128.192,
          long: hasValidCoords ? longNum : 128.192,
          thnOperasi: thnOperasi,
          tahunOperasi: thnOperasi,
          unit: 'ULP Baguala',
          ssotNumber: `SSOT-${displayNoBaru}`,
          tipeGardu: 'GTT Trafo'
        };

        items.push(newGardu);
      });

      setParsedRows(items);
      setValidationReport({
        total: items.length,
        validCoordsCount,
        missingCoordsCount,
        errors
      });
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      setValidationReport({
        total: 0,
        validCoordsCount: 0,
        missingCoordsCount: 0,
        errors: [err.message || 'Gagal membaca file Excel. Pastikan format file sesuai.']
      });
    } finally {
      setIsProcessing(false);
    }
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Import Data Master Gardu (Excel / CSV)</h3>
              <p className="text-xs text-slate-400">
                Mendukung 11 kolom standar: NO baru, NO GARDU lama, ALAMAT, PENYULANG, DAYA, PHASE, STATUS, AKTIF, LATITUDE, LONGITUDE, THNOPERASI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Template Download Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Unduh Format Template Excel</h4>
                <p className="text-[11px] text-emerald-800">
                  Header: <span className="font-mono font-bold">NO baru, NO GARDU lama, ALAMAT, PENYULANG, DAYA, PHASE, STATUS, AKTIF, LATITUDE, LONGITUDE, THNOPERASI</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200 text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {fileName ? fileName : 'Pilih file Excel (.xlsx / .xls) atau CSV'}
              </p>
              <p className="text-[11px] text-slate-500">
                Tarik &amp; lepas file ke sini atau klik untuk mencari dokumen
              </p>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                Non-Mandatori: Baris tetap akan diimpor walau ada kolom kosong
              </span>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menganalisis &amp; membaca baris data...</span>
            </div>
          )}

          {/* Validation & Preview Report */}
          {validationReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-blue-700 uppercase">Total Gardu</span>
                  <div className="text-lg font-black text-blue-900">{validationReport.total}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">Koordinat Valid</span>
                  <div className="text-lg font-black text-emerald-900">{validationReport.validCoordsCount}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-amber-700 uppercase">Koordinat Default</span>
                  <div className="text-lg font-black text-amber-900">{validationReport.missingCoordsCount}</div>
                </div>
              </div>

              {/* Preview Table of First 5 Items */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                    Preview Data Hasil Import (5 dari {parsedRows.length} baris):
                  </div>
                  <div className="overflow-x-auto max-h-44">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">NO baru</th>
                          <th className="py-2 px-2.5">NO GARDU lama</th>
                          <th className="py-2 px-2.5">ALAMAT</th>
                          <th className="py-2 px-2.5">PENYULANG</th>
                          <th className="py-2 px-2.5">DAYA</th>
                          <th className="py-2 px-2.5">PHASE</th>
                          <th className="py-2 px-2.5">STATUS</th>
                          <th className="py-2 px-2.5">AKTIF</th>
                          <th className="py-2 px-2.5">LATITUDE</th>
                          <th className="py-2 px-2.5">LONGITUDE</th>
                          <th className="py-2 px-2.5">THNOPERASI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="py-1.5 px-2.5 font-bold text-blue-900">{row.noBaru}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{row.noGarduLama}</td>
                            <td className="py-1.5 px-2.5 max-w-[140px] truncate text-slate-700">{row.alamat}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.penyulang}</td>
                            <td className="py-1.5 px-2.5 font-bold text-blue-700">{row.daya} kVA</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{row.phase}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700">
                                {row.status}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-emerald-700 font-bold">{String(row.aktif)}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">{row.latitude}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">{row.longitude}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-700">{row.thnOperasi}</td>
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

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
              parsedRows.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Simpan {parsedRows.length} Data Master Gardu</span>
          </button>
        </div>

      </div>
    </div>
  );
};
