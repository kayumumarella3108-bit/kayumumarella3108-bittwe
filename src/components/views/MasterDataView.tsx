import React, { useState, useRef } from 'react';
import {
  Database,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  FileText,
  Trash2,
  Edit2,
  History,
  Layers,
  Zap,
  Map,
  Upload,
  MapPin,
  Eye,
  FileCode,
  X,
  CloudUpload
} from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV } from '../../utils/exportCsv';
import { Penyulang, SectionJaringan, ActivityLog, MasterTab, MasterUnitPLN, MapLayerItem } from '../../types';
import { TambahPenyulangModal } from '../modals/TambahPenyulangModal';
import { TambahSectionModal } from '../modals/TambahSectionModal';
import { ElectricIconsShowcase } from '../common/ElectricIconsShowcase';
import { GarduHubungMasterSection } from '../master/GarduHubungMasterSection';
import { DistributionEquipmentMasterSection } from '../master/DistributionEquipmentMasterSection';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';

interface MasterDataViewProps {
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  activities: ActivityLog[];
  onAddPenyulang: (p: Penyulang) => void;
  onDeletePenyulang: (id: string) => void;
  onAddSection: (s: SectionJaringan) => void;
  onDeleteSection: (id: string) => void;
  masterUnitList?: MasterUnitPLN[];
  mapLayers?: MapLayerItem[];
  onAddMapLayer?: (layer: MapLayerItem) => void;
  onDeleteMapLayer?: (id: string) => void;
  onSelectView?: (view: string) => void;
  isLoading?: boolean;
  onOpenBackupModal?: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  penyulangList,
  sectionList,
  activities,
  onAddPenyulang,
  onDeletePenyulang,
  onAddSection,
  onDeleteSection,
  masterUnitList = [],
  mapLayers = [],
  onAddMapLayer,
  onDeleteMapLayer,
  onSelectView,
  isLoading = false,
  onOpenBackupModal
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('penyulang');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUlp, setSelectedUlp] = useState<string>('SEMUA');
  const [isPenyulangModalOpen, setIsPenyulangModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingPenyulang, setEditingPenyulang] = useState<Penyulang | null>(null);
  const [editingSection, setEditingSection] = useState<SectionJaringan | null>(null);
  const [components, setComponents] = useState([{ id: Date.now(), type: 'incoming', name: '' }]);

  // Peta Penyulang Import State
  const [showPetaImportModal, setShowPetaImportModal] = useState(false);
  const [importUlp, setImportUlp] = useState('');
  const [importKodeUnit, setImportKodeUnit] = useState('');
  const [importPenyulang, setImportPenyulang] = useState('');
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [fileImporting, setFileImporting] = useState(false);
  const petaFileInputRef = useRef<HTMLInputElement>(null);

  const addComponent = () => {
    setComponents([...components, { id: Date.now(), type: 'incoming', name: '' }]);
  };

  const removeComponent = (id: number) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const updateComponent = (id: number, field: string, value: string) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: value } : c));
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

  const handlePetaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImportFiles(files);
    setShowPetaImportModal(true);
  };

  const processPetaImport = async () => {
    if (!importFiles || importFiles.length === 0 || !onAddMapLayer) return;
    setFileImporting(true);
    try {
      for (let i = 0; i < importFiles.length; i++) {
        const file = importFiles[i];
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

        layer.ulp = importUlp;
        layer.kodeUnit = importKodeUnit;
        layer.namaPenyulang = importPenyulang || layer.nama;
        if (importPenyulang) {
          layer.nama = importPenyulang;
        }

        onAddMapLayer(layer);
      }
    } catch (err) {
      console.error('Error importing KML/KMZ:', err);
    } finally {
      setFileImporting(false);
      setShowPetaImportModal(false);
      setImportFiles(null);
      setImportUlp('');
      setImportKodeUnit('');
      setImportPenyulang('');
      if (petaFileInputRef.current) {
        petaFileInputRef.current.value = '';
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Data based on ULP & Kode Unit
  const filteredPenyulang = filterByUnitOrKode<Penyulang>(penyulangList, selectedUlp, searchQuery);

  const totalKmsJtm = filteredPenyulang.reduce((acc, p) => acc + (p.panjangJaringanKms || 0), 0);

  const filteredSections = filterByUnitOrKode<SectionJaringan>(sectionList, selectedUlp, searchQuery);

  const filteredActivities = activities.filter((act) =>
    (act.user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (act.aktivitas || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (act.modul || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Export Excel / CSV
  const handleExportExcel = () => {
    if (activeTab === 'penyulang') {
      const headers = ['Nama GI', 'Penyulang Utama', 'Nama Penyulang', 'Status', 'Kode ID', 'Topologi', 'Jml Pelanggan', 'Panjang Jaringan (KMS)'];
      const rows = filteredPenyulang.map(p => [
        p.namaGi || '',
        p.penyulangUtama || '',
        p.namaPenyulang || '',
        p.status || '',
        p.kodeId || '',
        p.sistemOperasi || 'Radial',
        p.jumlahPelanggan || 0,
        p.panjangJaringanKms || 0
      ]);
      exportToCSV('Master_Data_Penyulang_ULP_Baguala', headers, rows);
    } else if (activeTab === 'section') {
      const headers = ['Nama Section', 'Nama Penyulang', 'Jml Pelanggan', 'Sistem Operasi', 'Penyulang Di-Supply'];
      const rows = filteredSections.map(s => [
        s.namaSection || '',
        s.namaPenyulang || '',
        s.jumlahPelanggan || 0,
        s.sistemOperasi || '',
        s.penyulangDiSupply || ''
      ]);
      exportToCSV('Master_Data_Section_ULP_Baguala', headers, rows);
    } else if (activeTab === 'log_aktivitas') {
      const headers = ['Waktu', 'User', 'Detail Aktivitas', 'Modul'];
      const rows = filteredActivities.map(a => [
        a.waktu || '',
        a.user || '',
        a.aktivitas || '',
        a.modul || ''
      ]);
      exportToCSV('Log_Aktivitas_Sistem_ULP_Baguala', headers, rows);
    }
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = activeTab === 'penyulang' 
      ? 'MASTER DATA PENYULANG - PLN ULP BAGUALA' 
      : activeTab === 'section' 
      ? 'MASTER DATA SECTION JARINGAN - PLN ULP BAGUALA' 
      : 'LOG AKTIVITAS SISTEM OPERASIONAL';

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    if (activeTab === 'penyulang') {
      autoTable(doc, {
        startY: 28,
        head: [['Nama GI', 'Penyulang Utama', 'Nama Penyulang', 'Status', 'Kode ID', 'Topologi', 'Jml Pelanggan', 'Panjang (KMS)']],
        body: filteredPenyulang.map(p => [
          p.namaGi || '-',
          p.penyulangUtama || '-',
          p.namaPenyulang || '-',
          p.status || '-',
          p.kodeId || '-',
          p.sistemOperasi || 'Radial',
          (p.jumlahPelanggan || 0).toLocaleString('id-ID'),
          `${p.panjangJaringanKms || 0} KMS`
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 138] }
      });
      doc.save(`Master_Penyulang_${new Date().toISOString().slice(0, 10)}.pdf`);
    } else if (activeTab === 'section') {
      autoTable(doc, {
        startY: 28,
        head: [['Nama Section', 'Nama Penyulang', 'Jml Pelanggan', 'Sistem Operasi', 'Penyulang Di-Supply']],
        body: filteredSections.map(s => [
          s.namaSection || '-',
          s.namaPenyulang || '-',
          (s.jumlahPelanggan || 0).toLocaleString('id-ID'),
          s.sistemOperasi || '-',
          s.penyulangDiSupply || '-'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`Master_Section_${new Date().toISOString().slice(0, 10)}.pdf`);
    } else {
      autoTable(doc, {
        startY: 28,
        head: [['Waktu', 'User', 'Detail Aktivitas', 'Modul']],
        body: filteredActivities.map(a => [
          a.waktu || '-',
          a.user || '-',
          a.aktivitas || '-',
          a.modul || '-'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [217, 119, 6] }
      });
      doc.save(`Log_Aktivitas_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  };

  // Handle Import CSV/Excel file
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          alert('File kosong atau hanya berisi header.');
          return;
        }

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 2) {
            if (activeTab === 'penyulang') {
              const newPenyulang: Penyulang = {
                id: `p_imp_${Date.now()}_${i}`,
                namaGi: cols[0] || 'GI PASSO',
                namaPenyulang: cols[2] || cols[0] || `Penyulang Import ${i}`,
                penyulangUtama: cols[1] || '',
                status: (cols[3] as any) || 'Utama',
                kodeId: cols[4] || `IMP-${i}`,
                jumlahPelanggan: parseInt(cols[5]) || 1000,
                panjangJaringanKms: parseFloat(cols[6]) || 10.0,
                healthIndexStatus: 'Sempurna',
                frekuensiGangguan: 0
              };
              onAddPenyulang(newPenyulang);
              importedCount++;
            } else if (activeTab === 'section') {
              const newSec: SectionJaringan = {
                id: `s_imp_${Date.now()}_${i}`,
                namaSection: cols[0] || `Section Import ${i}`,
                namaPenyulang: cols[1] || penyulangList[0]?.namaPenyulang || 'PASSO',
                jumlahPelanggan: parseInt(cols[2]) || 500,
                penyulangId: penyulangList[0]?.id || '1',
                sistemOperasi: (cols[3] as any) || 'Radial',
                penyulangDiSupply: cols[4] || cols[1] || 'PASSO'
              };
              onAddSection(newSec);
              importedCount++;
            }
          }
        }
        alert(`Berhasil mengimpor ${importedCount} data ${activeTab === 'penyulang' ? 'Penyulang' : 'Section'}.`);
      } catch (err) {
        alert('Gagal membaca file CSV. Pastikan format file sesuai.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const uniqueUlps = Array.from(new Set(masterUnitList.map(u => u.ulp)));
  const ulpOptions = ['SEMUA', ...uniqueUlps];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      
      {/* ULP Filter & Tabs Header Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">Filter ULP:</span>
          <select
            value={selectedUlp}
            onChange={(e) => setSelectedUlp(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {ulpOptions.map(ulp => <option key={ulp} value={ulp}>{ulp}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('penyulang')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'penyulang'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Penyulang ({filteredPenyulang.length}) - {totalKmsJtm.toFixed(1)} KMS</span>
          </button>

          <button
            onClick={() => setActiveTab('section')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'section'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Section ({filteredSections.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gardu_hubung')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gardu_hubung'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Gardu Hubung</span>
          </button>

          <button
            onClick={() => setActiveTab('lbs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'lbs'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>LBS</span>
          </button>

          <button
            onClick={() => setActiveTab('pmcb')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pmcb'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>PMCB</span>
          </button>

          <button
            onClick={() => setActiveTab('recloser')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'recloser'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Recloser</span>
          </button>

          <button
            onClick={() => setActiveTab('fco')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fco'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>FCO</span>
          </button>

          <button
            onClick={() => setActiveTab('log_aktivitas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'log_aktivitas'
                ? 'bg-gradient-to-r from-[#022623] to-[#044c45] text-white shadow-lg'
                : 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Log ({filteredActivities.length})</span>
          </button>
        </div>
      </div>

      {/* TAB: INPUT PETA PENYULANG */}
      {activeTab === 'peta_penyulang_input' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5 space-y-4">
          <input
            type="file"
            ref={petaFileInputRef}
            accept=".kml,.kmz,.xml,.zip"
            onChange={handlePetaFileUpload}
            multiple
            className="hidden"
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Input & Manajemen Peta Penyulang (KMZ/KML)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinkronisasi ULP & Kode Unit dari Master Unit serta Nama Penyulang dari Master Data Penyulang
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => petaFileInputRef.current?.click()}
                disabled={fileImporting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-teal-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>{fileImporting ? 'Memproses...' : '+ Impor Peta KMZ/KML'}</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={8} rows={5} headerTitle="Peta Penyulang (GIS Layer)" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Nama Penyulang / Layer</th>
                    <th className="px-4 py-3.5">ULP (Master Unit)</th>
                    <th className="px-4 py-3.5">Kode Unit</th>
                    <th className="px-4 py-3.5">Penyulang (Master)</th>
                    <th className="px-4 py-3.5">Jumlah Tiang</th>
                    <th className="px-4 py-3.5">Panjang Rute</th>
                    <th className="px-4 py-3.5">Tanggal Impor</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mapLayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Belum ada data peta penyulang yang di-impor. Klik tombol "+ Impor Peta KMZ/KML" di atas.
                      </td>
                    </tr>
                  ) : (
                    mapLayers.map((layer) => (
                      <tr key={layer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: layer.color || '#3b82f6' }}></span>
                          {layer.nama}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                            {layer.ulp || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{layer.kodeUnit || '-'}</td>
                        <td className="px-4 py-3.5 font-bold text-teal-800">{layer.namaPenyulang || layer.nama}</td>
                        <td className="px-4 py-3.5 font-semibold">{layer.tiangCount} tiang</td>
                        <td className="px-4 py-3.5 text-slate-600">{layer.ruteLength}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">{layer.tanggalImport}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          {onSelectView && (
                            <button
                              onClick={() => onSelectView('peta_penyulang')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Lihat di Peta GIS"
                            >
                              <Map className="w-3.5 h-3.5" /> Peta
                            </button>
                          )}
                          {onDeleteMapLayer && (
                            <button
                              onClick={() => onDeleteMapLayer(layer.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Hapus Layer Peta"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: ICON GARDU & TIANG LISTRIK */}
      {activeTab === 'icon_gardu_tiang' && (
        <ElectricIconsShowcase />
      )}

      {/* TAB 1: MASTER PENYULANG */}
      {activeTab === 'penyulang' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Master Data Penyulang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar penyulang dan informasi panjang jaringan (KMS)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.xlsx,.xls"
                onChange={handleImportCSV}
                className="hidden"
              />
              
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {onOpenBackupModal && (
                  <button
                    onClick={onOpenBackupModal}
                    title="Picu Cadangan Data (Cloud & Google Sheets)"
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-amber-600" /> Backup Cloud
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Impor data"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Import
                </button>
                <button
                  onClick={handleExportExcel}
                  title="Ekspor Excel"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" /> Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  title="Ekspor PDF"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF
                </button>
              </div>

              <button
                onClick={() => setIsPenyulangModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#022623] to-[#044c45] hover:opacity-90 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Penyulang Baru</span>
              </button>
            </div>
          </div>

          <UnitFilterBar
            selectedUnit={selectedUlp}
            onSelectUnit={setSelectedUlp}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            masterUnitList={masterUnitList}
            placeholder="Filter Kode Unit (54110), ULP, atau nama penyulang..."
            className="w-full sm:max-w-2xl"
          />

          {isLoading ? (
            <TableSkeletonLoader columns={10} rows={6} headerTitle="Master Penyulang" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3.5 whitespace-nowrap">ULP</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Kode Unit</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Nama GI/PLTD</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Penyulang Utama</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Penyulang Percabangan</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Kode / ID</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Topologi Jaringan</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Jml Pelanggan</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Panjang Jaringan</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Jml Tiang</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">LBS</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">PMCB</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Recloser</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">FCO</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Gardu</th>
                    <th className="px-3 py-3.5 text-center sticky right-0 bg-slate-50 z-10 shadow-sm">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                  {filteredPenyulang.map((p) => {
                    const feederSections = sectionList.filter(
                      (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
                    );
                    const totalSectionPlg = feederSections.reduce(
                      (acc, curr) => acc + (curr.jumlahPelanggan || 0),
                      0
                    );
                    const totalPlg = p.jumlahPelanggan && p.jumlahPelanggan > 0 ? p.jumlahPelanggan : totalSectionPlg;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-bold">{p.unit || 'ULP Baguala'}</td>
                        <td className="px-3 py-3 font-mono text-slate-500">{p.kodeUnit || '54110'}</td>
                        <td className="px-3 py-3 font-bold text-amber-700 whitespace-nowrap">
                          {p.namaGi}
                        </td>
                        <td className="px-3 py-3 font-bold text-blue-700 whitespace-nowrap">
                          {p.status === 'Utama' ? p.namaPenyulang : (p.penyulangUtama || '-')}
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-900 whitespace-nowrap">
                          {p.status === 'Utama' ? '-' : p.namaPenyulang}
                          {feederSections.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                              {feederSections.length} Section
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-600 whitespace-nowrap">{p.kodeId}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            p.sistemOperasi === 'Looping' 
                              ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {p.sistemOperasi === 'Looping' ? '⚡ LOOPING / RING' : '🔌 RADIAL'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                          {totalPlg.toLocaleString('id-ID')} <span className="text-[9px] text-slate-400 font-normal">Plg</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {p.panjangJaringanKms} <span className="text-[9px] text-slate-400 font-normal">KMS</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahTiang || 0}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahLbs || 0}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahPmcb || 0}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahRecloser || 0}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahFco || 0}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-600">{p.jumlahGardu || 0}</td>
                        <td className="px-3 py-3 text-center sticky right-0 bg-white shadow-sm">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingPenyulang(p);
                                setIsPenyulangModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Penyulang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePenyulang(p.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Penyulang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER SECTION */}
      {activeTab === 'section' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Master Data Section
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar section dan jumlah pelanggan per section
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Impor file Excel/CSV data section"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Import Excel/CSV
              </button>
              <button
                onClick={handleExportExcel}
                title="Ekspor data section ke Excel"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                title="Ekspor data section ke PDF"
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => setIsSectionModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ Section Baru</span>
              </button>
            </div>
          </div>

          <UnitFilterBar
            selectedUnit={selectedUlp}
            onSelectUnit={setSelectedUlp}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            masterUnitList={masterUnitList}
            placeholder="Filter Kode Unit (54110), ULP, atau section..."
            className="w-full sm:max-w-2xl"
          />

          {isLoading ? (
            <TableSkeletonLoader columns={5} rows={6} headerTitle="Master Section" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Nama Section</th>
                    <th className="px-4 py-3.5">Penyulang</th>
                    <th className="px-4 py-3.5 text-center">Jumlah Pelanggan</th>
                    <th className="px-4 py-3.5 text-center">Penyulang Di-Supply</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSections.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.namaSection}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {s.namaPenyulang}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-700">
                        👨‍👩‍👧 {s.jumlahPelanggan.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">
                          {s.sistemOperasi}-{s.penyulangDiSupply}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSection(s);
                              setIsSectionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Section"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSection(s.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* TAB: GARDU HUBUNG */}
      {activeTab === 'gardu_hubung' && (
        <GarduHubungMasterSection penyulangList={penyulangList} />
      )}

      {/* TAB: PERALATAN DISTRIBUSI LAINNYA (LBS, PMCB, RECLOSER, FCO) */}
      {(['lbs', 'pmcb', 'recloser', 'fco'] as MasterTab[]).includes(activeTab) && (
        <DistributionEquipmentMasterSection
          type={activeTab as 'lbs' | 'pmcb' | 'recloser' | 'fco'}
          penyulangList={penyulangList}
        />
      )}

      {/* TAB 3: LOG AKTIVITAS */}
      {activeTab === 'log_aktivitas' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Log Aktivitas System Operational
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail histori perubahan data pengguna dan sistem
                </p>
              </div>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan user, aktivitas, modul..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={4} rows={6} headerTitle="Log Aktivitas" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Waktu</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Detail Aktivitas</th>
                    <th className="px-4 py-3.5">Modul</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Belum ada data aktivitas yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">{act.waktu}</td>
                        <td className="px-4 py-3.5 font-bold text-amber-700">{act.user}</td>
                        <td className="px-4 py-3.5 text-slate-900">{act.aktivitas}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            {act.modul}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import Modal Peta Penyulang */}
      {showPetaImportModal && importFiles && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPetaImportModal(false)}></div>
          <div className="bg-white w-[500px] max-w-[95vw] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-teal-600 px-5 py-4 flex items-center justify-between">
              <h3 className="font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Input & Sinkronisasi Peta Penyulang
              </h3>
              <button 
                onClick={() => setShowPetaImportModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase">File Terpilih:</span>
                <span className="text-sm font-semibold text-slate-800 break-all">{importFiles[0]?.name} {importFiles.length > 1 ? `(+${importFiles.length - 1} lainnya)` : ''}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ULP (Sinkron Master Data Unit) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importUlp}
                  onChange={(e) => setImportUlp(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                >
                  <option value="">-- Pilih ULP --</option>
                  {Array.from(new Set(masterUnitList.map(u => u.ulp))).map(ulp => (
                    <option key={ulp} value={ulp}>{ulp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Unit (Sinkron Master Data Unit) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importKodeUnit}
                  onChange={(e) => setImportKodeUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Kode Unit --</option>
                  {Array.from(new Set(masterUnitList.map(u => u.kodeUlp))).map(kode => (
                    <option key={kode} value={kode}>{kode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Penyulang (Sinkron Master Data Penyulang) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importPenyulang}
                  onChange={(e) => setImportPenyulang(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Nama Penyulang --</option>
                  {penyulangList.map(p => (
                    <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPetaImportModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={processPetaImport}
                disabled={fileImporting || !importUlp || !importKodeUnit || !importPenyulang}
                className="px-5 py-2 text-sm font-black text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {fileImporting ? (
                  <span className="animate-pulse">Memproses...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Simpan & Impor Peta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TambahPenyulangModal
        isOpen={isPenyulangModalOpen}
        onClose={() => {
          setIsPenyulangModalOpen(false);
          setEditingPenyulang(null);
        }}
        onSave={onAddPenyulang}
        initialData={editingPenyulang}
        penyulangList={penyulangList}
        masterUnitList={masterUnitList}
      />

      <TambahSectionModal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSave={onAddSection}
        penyulangList={penyulangList}
        initialData={editingSection}
      />
    </div>
  );
};
