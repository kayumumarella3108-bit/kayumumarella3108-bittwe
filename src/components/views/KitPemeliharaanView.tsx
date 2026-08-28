import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Plus, 
  History, 
  Trash2, 
  Calendar, 
  Database, 
  Search,
  User,
  Info,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  OperationType, 
  handleFirestoreError,
  filterDeleted,
  registerDeletedId
} from '../../lib/firebase';
import { KitPemeliharaanItem, User as AppUser, MasterUnitPLN } from '../../types';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';

interface KitPemeliharaanViewProps {
  currentUser: AppUser | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
}

export const KitPemeliharaanView: React.FC<KitPemeliharaanViewProps> = ({ 
  currentUser,
  selectedUnit,
  onSelectUnit,
  masterUnitList
}) => {
  const [items, setItems] = useState<KitPemeliharaanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    mesinId: '',
    namaMesin: '',
    jenisPemeliharaan: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: '',
    status: 'PROSES' as 'SELESAI' | 'PROSES' | 'PENDING',
    teknisi: '',
    keterangan: '',
    unit: ''
  });

  // Sync unit with filter
  useEffect(() => {
    if (selectedUnit !== 'SEMUA') {
      setFormData(prev => ({ ...prev, unit: selectedUnit }));
    }
  }, [selectedUnit]);

  useEffect(() => {
    const q = query(collection(db, 'data_pemeliharaan_kit'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KitPemeliharaanItem[];
      
      setItems(filterDeleted(list));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'data_pemeliharaan_kit');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mesinId || !formData.jenisPemeliharaan) return;

    setSubmitting(true);
    try {
      const finalUnit = formData.unit || (selectedUnit !== 'SEMUA' ? selectedUnit : (currentUser?.unit || 'ULP Baguala'));
      const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

      const newItem = {
        mesinId: formData.mesinId,
        namaMesin: formData.namaMesin || formData.mesinId,
        jenisPemeliharaan: formData.jenisPemeliharaan,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai || '',
        status: formData.status,
        teknisi: formData.teknisi || currentUser?.name || 'Teknisi KIT',
        keterangan: formData.keterangan,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'data_pemeliharaan_kit'), newItem);
      
      setFormData({
        ...formData,
        mesinId: '',
        namaMesin: '',
        jenisPemeliharaan: '',
        tanggalSelesai: '',
        status: 'PROSES',
        teknisi: '',
        keterangan: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'data_pemeliharaan_kit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data pemeliharaan ini?')) return;
    try {
      registerDeletedId(id);
      await deleteDoc(doc(db, 'data_pemeliharaan_kit', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `data_pemeliharaan_kit/${id}`);
    }
  };

  const unitFilteredItems = useMemo(() => {
    return filterByUnitOrKode(items, selectedUnit);
  }, [items, selectedUnit]);

  const filteredItems = unitFilteredItems.filter(item => 
    item.namaMesin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mesinId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.jenisPemeliharaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.teknisi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-teal-400 flex items-center gap-2">
            <Wrench className="w-7 h-7" /> Pemeliharaan Mesin KIT
          </h1>
          <p className="text-slate-400">Pencatatan jadwal dan realisasi pemeliharaan mesin pembangkit.</p>
        </div>

        <UnitFilterBar
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          masterUnitList={masterUnitList}
          className="bg-slate-900/50 p-2 rounded-2xl border border-teal-500/20"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl sticky top-6"
          >
            <div className="flex items-center gap-2 mb-6 text-teal-400 font-bold">
              <Plus className="w-5 h-5" /> Tambah Laporan Pemeliharaan
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3" /> ID / Nama Mesin
                </label>
                <input
                  type="text"
                  placeholder="Contoh: MESIN-01"
                  required
                  value={formData.mesinId}
                  onChange={(e) => setFormData({...formData, mesinId: e.target.value, namaMesin: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Jenis Pemeliharaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: P1, P2, Overhaul"
                  required
                  value={formData.jenisPemeliharaan}
                  onChange={(e) => setFormData({...formData, jenisPemeliharaan: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tgl Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tgl Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSelesai}
                    onChange={(e) => setFormData({...formData, tanggalSelesai: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                >
                  <option value="PROSES">DALAM PROSES</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Teknisi
                </label>
                <input
                  type="text"
                  placeholder="Nama Teknisi"
                  value={formData.teknisi}
                  onChange={(e) => setFormData({...formData, teknisi: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Keterangan
                </label>
                <textarea
                  placeholder="Detail perbaikan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Simpan Laporan
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-teal-400">
              <History className="w-5 h-5" /> Riwayat Pemeliharaan
            </h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari mesin / teknisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800">
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">MESIN</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">JENIS / TGL</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">TEKNISI</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">STATUS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">UNIT</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Belum ada riwayat pemeliharaan.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredItems.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold">{item.namaMesin}</div>
                            <div className="text-[10px] text-slate-500">ID: {item.mesinId}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-bold text-teal-400">{item.jenisPemeliharaan}</div>
                            <div className="text-[10px] text-slate-400">{item.tanggalMulai} {item.tanggalSelesai ? `s/d ${item.tanggalSelesai}` : '(Sedang Berjalan)'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-slate-300">{item.teknisi}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'SELESAI' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : item.status === 'PROSES'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-[10px] font-bold text-slate-500">{item.unit}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
