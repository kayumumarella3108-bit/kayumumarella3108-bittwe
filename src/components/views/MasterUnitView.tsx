import React, { useState } from 'react';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  AlertCircle,
  CloudUpload
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV } from '../../utils/exportCsv';
import { MasterUnitPLN, User } from '../../types';
import { isOwnerUser, canEditData } from '../../utils/permissions';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';

interface MasterUnitViewProps {
  currentUser?: User | null;
  unitList: MasterUnitPLN[];
  onAddUnit: (unit: MasterUnitPLN) => void;
  onUpdateUnit: (unit: MasterUnitPLN) => void;
  onDeleteUnit: (id: string, unitObj?: MasterUnitPLN) => void;
  onOpenBackupModal?: () => void;
}

export const MasterUnitView: React.FC<MasterUnitViewProps> = ({
  currentUser,
  unitList,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onOpenBackupModal
}) => {
  const isOwner = isOwnerUser(currentUser);
  const canEdit = canEditData(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('SEMUA');
  const [filterUiw, setFilterUiw] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MasterUnitPLN | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    uiw: 'UIW MMU (Maluku & Maluku Utara)',
    up3: 'UP3 Ambon',
    ulp: '',
    kodeUlp: '',
    alamat: '',
    telepon: '',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF'
  });

  // Filtered list using UnitFilterBar helper + UIW filter
  const filteredUnits = filterByUnitOrKode<MasterUnitPLN>(unitList, selectedUnitFilter, searchQuery).filter((item) => {
    return filterUiw === 'ALL' || item.uiw === filterUiw;
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteWithFeedback = async (unit: MasterUnitPLN) => {
    const targetId = unit.id || unit.kodeUlp || unit.ulp;
    if (confirm(`Apakah Anda yakin ingin menghapus Master Unit ${unit.ulp} (Kode ULP: ${unit.kodeUlp})?\nData akan dihapus secara permanen dari sistem.`)) {
      try {
        await onDeleteUnit(targetId, unit);
        showToast('success', `Master Unit "${unit.ulp}" (Kode ULP: ${unit.kodeUlp}) berhasil dihapus.`);
      } catch (err) {
        showToast('error', 'Gagal menghapus Master Unit: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingUnit(null);
    setFormData({
      uiw: 'UIW MMU (Maluku & Maluku Utara)',
      up3: 'UP3 Ambon',
      ulp: '',
      kodeUlp: '',
      alamat: '',
      telepon: '',
      status: 'AKTIF'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (unit: MasterUnitPLN) => {
    setEditingUnit(unit);
    setFormData({
      uiw: unit.uiw || 'UIW MMU (Maluku & Maluku Utara)',
      up3: unit.up3 || 'UP3 Ambon',
      ulp: unit.ulp || '',
      kodeUlp: unit.kodeUlp || '',
      alamat: unit.alamat || '',
      telepon: unit.telepon || '',
      status: unit.status || 'AKTIF'
    });
    setIsModalOpen(true);
  };

  // Save Unit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ulp.trim() || !formData.kodeUlp.trim()) {
      alert('Nama ULP dan Kode ULP wajib diisi!');
      return;
    }

    if (editingUnit) {
      onUpdateUnit({
        ...editingUnit,
        ...formData,
        updatedAt: new Date().toISOString()
      });
      showToast('success', `Master Unit "${formData.ulp}" (Kode ULP: ${formData.kodeUlp}) berhasil diperbarui.`);
    } else {
      const newUnit: MasterUnitPLN = {
        id: `unit-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onAddUnit(newUnit);
      showToast('success', `Master Unit Baru "${formData.ulp}" (Kode ULP: ${formData.kodeUlp}) berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = ['UIW', 'UP3', 'ULP', 'KODE ULP', 'Status'];
    const rows = filteredUnits.map((u) => [
      u.uiw || '',
      u.up3 || '',
      u.ulp || '',
      u.kodeUlp || '',
      u.status || 'AKTIF'
    ]);
    exportToCSV('Master_Unit_PLN_Data', headers, rows);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('MASTER DATA UNIT PLN (UIW, UP3, ULP & KODE ULP)', 14, 15);
    doc.setFontSize(9);
    doc.text(`Diunduh pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableHeaders = [['No', 'UIW', 'UP3', 'Nama ULP', 'Kode ULP', 'Status']];
    const tableData = filteredUnits.map((u, idx) => [
      idx + 1,
      u.uiw || '-',
      u.up3 || '-',
      u.ulp || '-',
      u.kodeUlp || '-',
      u.status || 'AKTIF'
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [2, 48, 43], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save('Master_Data_Unit_PLN.pdf');
  };

  // Access Denial Guard for Users without Edit or Owner privileges
  if (!isOwner && !canEdit) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-950/80 border-2 border-red-500/80 rounded-3xl p-8 text-center text-white shadow-2xl backdrop-blur-md">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black mb-2 text-red-200">Akses Terbatas</h2>
          <p className="text-sm text-red-300 max-w-lg mx-auto leading-relaxed">
            Menu Master Data Unit (UIW, UP3, ULP & Kode ULP) memerlukan kewenangan akun <strong>Owner / Admin Teknik / Koordinator</strong>.
          </p>
        </div>
      </div>
    );
  }

  // List of unique UIW for filter
  const uiwOptions = Array.from(new Set(unitList.map((u) => u.uiw).filter(Boolean)));

  return (
    <div className="p-4 md:p-7 space-y-6 max-w-7xl mx-auto font-sans text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-sm font-extrabold flex items-center justify-between shadow-xl transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200'
            : 'bg-rose-950/90 border-rose-500/70 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline opacity-80 hover:opacity-100">
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#022824] via-[#044a43] to-[#022e2a] border-2 border-teal-500/60 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase mb-3 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Master Data Unit PLN • Sinkronisasi ULP</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Building2 className="w-8 h-8 text-teal-400" />
              Master Data Unit PLN
            </h1>
            <p className="text-xs md:text-sm font-semibold text-teal-200/90 mt-1 max-w-2xl">
              Kelola dan hapus struktur hirarki unit PLN meliputi Unit Induk Wilayah (UIW), Unit Pelaksana (UP3), Unit Layanan Pelanggan (ULP), dan Kode ULP secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <CloudUpload className="w-4 h-4 text-amber-400" />
                <span>Picu Backup Cloud & Sheets</span>
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-sm hover:from-teal-300 hover:to-emerald-300 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 shrink-0 border border-teal-200"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Tambah Master Unit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Unit Filter & Export */}
      <div className="p-4 rounded-2xl bg-[#022320]/90 border border-teal-600/50 shadow-xl backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Reusable Unit & Kode Unit Filter Bar */}
          <UnitFilterBar
            selectedUnit={selectedUnitFilter}
            onSelectUnit={setSelectedUnitFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            masterUnitList={unitList}
            placeholder="Cari Kode ULP (54110) atau Nama Unit..."
            className="flex-1"
          />

          {/* UIW Filter */}
          {uiwOptions.length > 0 && (
            <select
              value={filterUiw}
              onChange={(e) => setFilterUiw(e.target.value)}
              className="w-full sm:w-auto bg-[#011a18] border border-teal-600/60 rounded-xl px-3 py-2 text-xs font-extrabold text-teal-200 focus:outline-none focus:border-amber-400 cursor-pointer shadow-md"
            >
              <option value="ALL">Semua UIW</option>
              {uiwOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons: Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-400/50 transition-all cursor-pointer shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-800/80 hover:bg-red-700 text-white font-bold text-xs border border-red-400/50 transition-all cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4 text-red-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Main Table List */}
      <div className="rounded-3xl bg-[#022320]/90 border border-teal-600/50 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-teal-700/50 flex items-center justify-between bg-[#011a18]/60">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Daftar Hirarki Unit ({filteredUnits.length} Unit)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#011513] text-teal-300 text-[11px] font-black uppercase tracking-wider border-b border-teal-700/60">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Unit Induk (UIW)</th>
                <th className="p-4">Unit Pelaksana (UP3)</th>
                <th className="p-4">Unit Layanan (ULP)</th>
                <th className="p-4 text-center">Kode ULP</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-800/40 text-xs font-medium text-slate-200">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-teal-300/70">
                    <Building2 className="w-12 h-12 text-teal-600 mx-auto mb-3 opacity-50" />
                    <p className="font-extrabold text-sm text-teal-200">Tidak ada data Master Unit PLN</p>
                    <p className="text-xs text-teal-400/80 mt-1">Klik tombol 'Tambah Master Unit' di atas untuk memasukkan data baru.</p>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-teal-900/40 transition-colors group"
                  >
                    <td className="p-4 text-center font-bold text-teal-400">{index + 1}</td>
                    <td className="p-4 font-bold text-teal-100">{item.uiw || '-'}</td>
                    <td className="p-4 font-extrabold text-amber-300">{item.up3 || '-'}</td>
                    <td className="p-4 font-black text-white text-sm">{item.ulp}</td>
                    <td className="p-4 text-center font-mono font-black text-emerald-300 bg-teal-950/60 rounded-lg border border-teal-700/50">
                      {item.kodeUlp}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          item.status === 'NONAKTIF'
                            ? 'bg-red-950/80 border-red-500/60 text-red-300'
                            : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                        }`}
                      >
                        {item.status === 'NONAKTIF' ? (
                          <>
                            <XCircle className="w-3 h-3 text-red-400" /> Nonaktif
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aktif
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 text-amber-300 border border-teal-500/50 transition-all cursor-pointer"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithFeedback(item)}
                          className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-500/50 transition-all cursor-pointer"
                          title="Hapus Master Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#02312b] to-[#011d1a] border-2 border-teal-500/80 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-teal-700/60 mb-5">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-black text-white">
                  {editingUnit ? 'Edit Master Unit PLN' : 'Tambah Master Unit PLN Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teal-400 hover:text-white p-1 rounded-lg hover:bg-teal-800/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* UIW Input */}
              <div>
                <label className="block text-xs font-extrabold text-teal-200 mb-1">
                  1. Unit Induk Wilayah (UIW) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.uiw}
                  onChange={(e) => setFormData({ ...formData, uiw: e.target.value })}
                  placeholder="Contoh: UIW MMU (Maluku & Maluku Utara)"
                  className="w-full bg-[#011917] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* UP3 Input */}
              <div>
                <label className="block text-xs font-extrabold text-teal-200 mb-1">
                  2. Unit Pelaksana Pelayanan Pelanggan (UP3) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.up3}
                  onChange={(e) => setFormData({ ...formData, up3: e.target.value })}
                  placeholder="Contoh: UP3 Ambon, UP3 Saumlaki, UP3 Tual"
                  className="w-full bg-[#011917] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* ULP & Kode ULP Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-teal-200 mb-1">
                    3. Unit Layanan (ULP) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ulp}
                    onChange={(e) => setFormData({ ...formData, ulp: e.target.value })}
                    placeholder="Contoh: ULP Baguala"
                    className="w-full bg-[#011917] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-teal-200 mb-1">
                    4. KODE ULP <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kodeUlp}
                    onChange={(e) => setFormData({ ...formData, kodeUlp: e.target.value })}
                    placeholder="Contoh: 54110"
                    className="w-full bg-[#011917] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-bold font-mono text-emerald-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-extrabold text-teal-200 mb-1">
                  Status Operasional Unit
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'AKTIF' | 'NONAKTIF' })}
                  className="w-full bg-[#011917] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="AKTIF">AKTIF (Siap Digunakan)</option>
                  <option value="NONAKTIF">NONAKTIF (Non-aktifkan)</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-teal-700/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 font-bold text-xs border border-teal-600/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
                >
                  {editingUnit ? 'Simpan Perubahan' : 'Tambah Master Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
