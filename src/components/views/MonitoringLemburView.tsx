import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Check,
  X,
  Trash2,
  Pencil,
  FileText,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';
import { MonitoringLemburItem, User as UserType } from '../../types';
import { canEditData } from '../../utils/permissions';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MonitoringLemburViewProps {
  currentUser?: UserType;
  lemburList: MonitoringLemburItem[];
  onAddLembur: (item: Omit<MonitoringLemburItem, 'id'>) => void;
  onUpdateLembur: (id: string, item: Partial<MonitoringLemburItem>) => void;
  onDeleteLembur: (id: string) => void;
  isLoading?: boolean;
}

export const MonitoringLemburView: React.FC<MonitoringLemburViewProps> = ({
  currentUser,
  lemburList = [],
  onAddLembur,
  onUpdateLembur,
  onDeleteLembur,
  isLoading = false
}) => {
  const canEdit = currentUser ? canEditData(currentUser) : true;
  // Checking supervisor or manager privileges to approve/reject
  const canApprove = currentUser && ['Owner', 'Manager ULP', 'Team Leader', 'Koordinator'].includes(currentUser.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MonitoringLemburItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    namaPetugas: '',
    nipOrNik: '',
    regu: '',
    unit: 'ULP Baguala',
    noSpkOrSuratTugas: '',
    tanggalLembur: new Date().toISOString().split('T')[0],
    jamMulai: '17:00',
    jamSelesai: '21:00',
    alasanLembur: '',
    jenisPekerjaan: 'Penanganan Gangguan' as 'Penanganan Gangguan' | 'Pemeliharaan Darurat' | 'Piket Siaga Extra' | 'Pekerjaan ROW Malam' | 'Lainnya',
    catatanSupervisor: ''
  });

  const resetForm = () => {
    setFormData({
      namaPetugas: '',
      nipOrNik: '',
      regu: '',
      unit: currentUser?.unit || 'ULP Baguala',
      noSpkOrSuratTugas: '',
      tanggalLembur: new Date().toISOString().split('T')[0],
      jamMulai: '17:00',
      jamSelesai: '21:00',
      alasanLembur: '',
      jenisPekerjaan: 'Penanganan Gangguan',
      catatanSupervisor: ''
    });
    setEditingItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPetugas || !formData.regu || !formData.alasanLembur) {
      alert('Mohon lengkapi semua field wajib!');
      return;
    }

    // Calculate total hours
    const start = new Date(`${formData.tanggalLembur}T${formData.jamMulai}`);
    let end = new Date(`${formData.tanggalLembur}T${formData.jamSelesai}`);
    if (end < start) {
      // Overtime crosses midnight
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end.getTime() - start.getTime();
    const totalJam = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // decimal hourly rounded

    // Base estimated overtime fee calculation (standard PLN local estimate - standard rate e.g., Rp 25.000 / hour)
    const nominalEstimasi = totalJam * 25000;

    if (editingItem) {
      onUpdateLembur(editingItem.id, {
        ...formData,
        totalJam,
        nominalEstimasi,
        // Preserve status or reset if officer edited? Let's preserve unless changed
      });
    } else {
      onAddLembur({
        ...formData,
        totalJam,
        nominalEstimasi,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (item: MonitoringLemburItem) => {
    setEditingItem(item);
    setFormData({
      namaPetugas: item.namaPetugas,
      nipOrNik: item.nipOrNik || '',
      regu: item.regu,
      unit: item.unit,
      noSpkOrSuratTugas: item.noSpkOrSuratTugas || '',
      tanggalLembur: item.tanggalLembur,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      alasanLembur: item.alasanLembur,
      jenisPekerjaan: item.jenisPekerjaan,
      catatanSupervisor: item.catatanSupervisor || ''
    });
    setShowModal(true);
  };

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED', notes: string = '') => {
    onUpdateLembur(id, {
      status: newStatus,
      approvedBy: currentUser?.name || 'Supervisor',
      catatanSupervisor: notes || undefined
    });
  };

  // Filter list
  const filteredList = lemburList.filter(item => {
    const matchesSearch = item.namaPetugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.regu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.alasanLembur || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = selectedUnit === 'Semua' || item.unit === selectedUnit;
    const matchesStatus = selectedStatus === 'Semua' || item.status === selectedStatus;
    const matchesJenis = selectedJenis === 'Semua' || item.jenisPekerjaan === selectedJenis;

    return matchesSearch && matchesUnit && matchesStatus && matchesJenis;
  });

  // Analytics Calculations
  const stats = {
    totalJam: filteredList.reduce((sum, item) => sum + (item.status === 'APPROVED' ? item.totalJam : 0), 0),
    totalJamAll: filteredList.reduce((sum, item) => sum + item.totalJam, 0),
    totalEstimasi: filteredList.reduce((sum, item) => sum + (item.status === 'APPROVED' ? (item.nominalEstimasi || 0) : 0), 0),
    pendingCount: filteredList.filter(item => item.status === 'PENDING').length,
    approvedCount: filteredList.filter(item => item.status === 'APPROVED').length,
    rejectedCount: filteredList.filter(item => item.status === 'REJECTED').length,
    totalPengajuan: filteredList.length
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Header PLN Blue Accent
    doc.setFillColor(13, 148, 136); // Teal 600
    doc.rect(0, 0, 297, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PT PLN (PERSERO) UIW MMU - UP3 AMBON - ULP BAGUALA', 12, 11);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REKAPITULASI & MONITORING LEMBUR PETUGAS OPERASIONAL', 12, 28);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Dicetak pada: ${dateStr} | Total Pengajuan: ${stats.totalPengajuan} Record | Total Jam Disetujui: ${stats.totalJam} Jam`, 12, 34);

    // Build Table Rows
    const tableData = filteredList.map((item, idx) => [
      idx + 1,
      item.namaPetugas,
      item.regu,
      item.unit,
      `${item.tanggalLembur} (${item.jamMulai} - ${item.jamSelesai})`,
      `${item.totalJam} Jam`,
      item.jenisPekerjaan,
      item.alasanLembur,
      item.status,
      item.nominalEstimasi ? `Rp ${item.nominalEstimasi.toLocaleString('id-ID')}` : '-'
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['No', 'Nama Petugas', 'Regu', 'Unit', 'Waktu / Tanggal', 'Durasi', 'Jenis Pekerjaan', 'Alasan / Deskripsi Pekerjaan', 'Status', 'Estimasi Biaya']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 30 },
        2: { cellWidth: 15 },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 15 },
        6: { cellWidth: 32 },
        7: { cellWidth: 70 },
        8: { cellWidth: 20 },
        9: { cellWidth: 25 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const statusVal = data.cell.raw as string;
          if (statusVal === 'APPROVED') {
            data.cell.styles.textColor = [16, 185, 129]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (statusVal === 'REJECTED') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [245, 158, 11]; // Yellow
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save(`Monitoring_Lembur_Yantek_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Monitoring Lembur</h1>
              <p className="text-xs text-slate-500 font-medium">Lacak, ajukan, dan setujui lembur piket petugas operasional Yanggu secara real-time</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          {canEdit && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Lembur</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Widgets (Mathematical Scale, Sophisticated design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Jam Lembur Disetujui</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalJam} <span className="text-xs font-bold text-slate-500">Jam</span></p>
            </div>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Dari total {stats.totalJamAll} jam yang diajukan</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimasi Nominal Lembur</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">Rp {stats.totalEstimasi.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600/80 font-bold mt-2">Dihitung dari lembur berstatus APPROVED</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Pengajuan</p>
              <div className="flex gap-2 items-center mt-2.5">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-yellow-50 text-yellow-700 border border-yellow-200">{stats.pendingCount} PND</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">{stats.approvedCount} APR</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200">{stats.rejectedCount} REJ</span>
              </div>
            </div>
            <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1.5">Total pengajuan: {stats.totalPengajuan} berkas</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Konfirmasi Supervisor</p>
              <p className="text-xs font-bold text-slate-600 mt-2">
                {currentUser?.role ? `${currentUser.role} (${currentUser.name})` : 'Tamu'}
              </p>
            </div>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2">
            {canApprove ? '✓ Hak Akses Verifikasi Aktif' : 'ℹ︎ Hak Akses Lihat/Ajukan'}
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari petugas, regu, alasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700"
          />
        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-2 md:flex items-center gap-2">
          {/* Unit selection */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Unit</option>
              <option value="ULP Baguala">ULP Baguala</option>
              <option value="ULC Baguala">ULC Baguala</option>
              <option value="ULP Ambon Kota">ULP Ambon Kota</option>
              <option value="UP3 Ambon">UP3 Ambon</option>
            </select>
          </div>

          {/* Status Selection */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Type of Job Selection */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5 col-span-2 md:col-span-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Pekerjaan</option>
              <option value="Penanganan Gangguan">Penanganan Gangguan</option>
              <option value="Pemeliharaan Darurat">Pemeliharaan Darurat</option>
              <option value="Piket Siaga Extra">Piket Siaga Extra</option>
              <option value="Pekerjaan ROW Malam">Pekerjaan ROW Malam</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <TableSkeletonLoader rows={5} columns={8} />
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold">Tidak ada data lembur yang cocok</p>
            <p className="text-[10px] mt-1 text-slate-400">Silakan ubah filter atau tambahkan pengajuan lembur baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="px-4 py-3">Nama Petugas / NIP</th>
                  <th className="px-4 py-3">Regu / Unit</th>
                  <th className="px-4 py-3">Waktu Lembur</th>
                  <th className="px-4 py-3">Durasi</th>
                  <th className="px-4 py-3">Jenis Pekerjaan</th>
                  <th className="px-4 py-3">Alasan / No SPK</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-700">{item.namaPetugas}</div>
                        <div className="text-[10px] text-slate-400">{item.nipOrNik || 'NIP/NIK tidak ada'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-600">{item.regu}</div>
                        <div className="text-[10px] text-slate-400">{item.unit}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.tanggalLembur}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.jamMulai} s.d. {item.jamSelesai}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-700">{item.totalJam} Jam</div>
                        {item.nominalEstimasi && (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Est: Rp {item.nominalEstimasi.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100">
                          {item.jenisPekerjaan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-slate-600 truncate" title={item.alasanLembur}>
                          {item.alasanLembur}
                        </p>
                        {item.noSpkOrSuratTugas && (
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            SPK: {item.noSpkOrSuratTugas}
                          </div>
                        )}
                        {item.catatanSupervisor && (
                          <div className="text-[10px] text-amber-600 italic font-medium mt-1">
                            Catatan Spv: "{item.catatanSupervisor}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Supervisor Quick Approvals */}
                          {canApprove && isPending && (
                            <>
                              <button
                                onClick={() => {
                                  const reason = prompt('Masukkan catatan persetujuan (opsional):') || '';
                                  handleUpdateStatus(item.id, 'APPROVED', reason);
                                }}
                                title="Setujui Lembur"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md border border-emerald-200 hover:border-emerald-300 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Masukkan alasan penolakan (opsional):') || '';
                                  handleUpdateStatus(item.id, 'REJECTED', reason);
                                }}
                                title="Tolak Lembur"
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Standard Edit & Delete */}
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer"
                              title="Edit Pengajuan"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus data lembur ini?')) {
                                  onDeleteLembur(item.id);
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-100 hover:border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Pengajuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Input / Edit Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-teal-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <h2 className="font-extrabold text-sm">{editingItem ? 'Edit Pengajuan Lembur' : 'Form Pengajuan Lembur'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Officer Name */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Petugas <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="namaPetugas"
                    required
                    placeholder="Contoh: Aris Wattimena"
                    value={formData.namaPetugas}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* NIP/NIK (Optional) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">NIP / NIK</label>
                  <input
                    type="text"
                    name="nipOrNik"
                    placeholder="Contoh: 9518023Z"
                    value={formData.nipOrNik}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Regu (Required) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Regu <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="regu"
                    required
                    placeholder="Contoh: Regu Alfa / Delta"
                    value={formData.regu}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Unit Organisasi</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="ULP Baguala">ULP Baguala</option>
                    <option value="ULC Baguala">ULC Baguala</option>
                    <option value="ULP Ambon Kota">ULP Ambon Kota</option>
                    <option value="UP3 Ambon">UP3 Ambon</option>
                  </select>
                </div>

                {/* No SPK / Surat Tugas */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nomor SPK / Surat Tugas</label>
                  <input
                    type="text"
                    name="noSpkOrSuratTugas"
                    placeholder="Contoh: 023.SPK/TEK/BAG/2026"
                    value={formData.noSpkOrSuratTugas}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Tanggal Lembur <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    name="tanggalLembur"
                    required
                    value={formData.tanggalLembur}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Job type category */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Kategori Pekerjaan</label>
                  <select
                    name="jenisPekerjaan"
                    value={formData.jenisPekerjaan}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="Penanganan Gangguan">Penanganan Gangguan</option>
                    <option value="Pemeliharaan Darurat">Pemeliharaan Darurat</option>
                    <option value="Piket Siaga Extra">Piket Siaga Extra</option>
                    <option value="Pekerjaan ROW Malam">Pekerjaan ROW Malam</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Time start */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Jam Mulai <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    name="jamMulai"
                    required
                    value={formData.jamMulai}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Time end */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Jam Selesai <span className="text-rose-500">*</span></label>
                  <input
                    type="time"
                    name="jamSelesai"
                    required
                    value={formData.jamSelesai}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Overtime details description */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Alasan / Detail Deskripsi Pekerjaan <span className="text-rose-500">*</span></label>
                <textarea
                  name="alasanLembur"
                  required
                  rows={3}
                  placeholder="Deskripsikan pekerjaan penanganan / siaga yang dilakukan secara rinci..."
                  value={formData.alasanLembur}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Notes from supervisor */}
              {editingItem && canApprove && (
                <div>
                  <label className="block text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">Catatan Supervisor / Validator</label>
                  <input
                    type="text"
                    name="catatanSupervisor"
                    placeholder="Masukkan instruksi khusus atau koreksi administrasi..."
                    value={formData.catatanSupervisor}
                    onChange={handleInputChange}
                    className="w-full border border-amber-200 bg-amber-50/20 text-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              )}

              {/* Actions submit */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 rounded-lg font-bold transition-all shadow-sm cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
