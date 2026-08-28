import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fuel, 
  Plus, 
  History, 
  Trash2, 
  Calendar, 
  Clock, 
  Database, 
  Search,
  Filter,
  User,
  Info,
  Save,
  Loader2
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
import { KitBbmItem, User as AppUser, MasterUnitPLN } from '../../types';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';

interface KitBbmViewProps {
  currentUser: AppUser | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
}

export const KitBbmView: React.FC<KitBbmViewProps> = ({ 
  currentUser,
  selectedUnit,
  onSelectUnit,
  masterUnitList
}) => {
  const [items, setItems] = useState<KitBbmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    mesinId: '',
    namaMesin: '',
    liter: '',
    keterangan: '',
    unit: ''
  });

  // Sync unit with filter if filter is not "SEMUA"
  useEffect(() => {
    if (selectedUnit !== 'SEMUA') {
      setFormData(prev => ({ ...prev, unit: selectedUnit }));
    }
  }, [selectedUnit]);

  useEffect(() => {
    const q = query(collection(db, 'data_bbm_kit'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bbmList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KitBbmItem[];
      
      setItems(filterDeleted(bbmList));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'data_bbm_kit');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mesinId || !formData.liter) return;

    setSubmitting(true);
    try {
      const finalUnit = formData.unit || selectedUnit !== 'SEMUA' ? selectedUnit : (currentUser?.unit || 'ULP Baguala');
      const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

      const newItem = {
        tanggal: formData.tanggal,
        jam: formData.jam,
        mesinId: formData.mesinId,
        namaMesin: formData.namaMesin || formData.mesinId,
        liter: parseFloat(formData.liter),
        petugas: currentUser?.name || 'Petugas KIT',
        keterangan: formData.keterangan,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'data_bbm_kit'), newItem);
      
      setFormData({
        ...formData,
        mesinId: '',
        namaMesin: '',
        liter: '',
        keterangan: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'data_bbm_kit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data penggunaan BBM ini?')) return;
    
    try {
      registerDeletedId(id);
      await deleteDoc(doc(db, 'data_bbm_kit', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `data_bbm_kit/${id}`);
    }
  };

  // 1. Filter by global ULP
  const unitFilteredItems = useMemo(() => {
    return filterByUnitOrKode(items, selectedUnit);
  }, [items, selectedUnit]);

  // 2. Search filter
  const filteredItems = unitFilteredItems.filter(item => 
    item.namaMesin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mesinId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.petugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.unit && item.unit.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <Fuel className="w-7 h-7" /> Pencatatan Penggunaan BBM KIT
          </h1>
          <p className="text-slate-400">Log harian konsumsi bahan bakar mesin pembangkit.</p>
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
              <Plus className="w-5 h-5" /> Tambah Catatan Baru
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Jam
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jam}
                    onChange={(e) => setFormData({...formData, jam: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

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
                  <Fuel className="w-3 h-3" /> Liter BBM
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    required
                    value={formData.liter}
                    onChange={(e) => setFormData({...formData, liter: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-12 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LITER</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Keterangan (Opsional)
                </label>
                <textarea
                  placeholder="Catatan tambahan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20 active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Simpan Catatan
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-teal-400">
              <History className="w-5 h-5" /> Riwayat Penggunaan
            </h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari mesin / petugas..."
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
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">TANGGAL/JAM</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">MESIN</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">VOLUME</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">PETUGAS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">KETERANGAN</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                        <p className="text-slate-500 text-sm mt-2">Memuat data...</p>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Belum ada data penggunaan BBM.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredItems.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold">{item.tanggal}</div>
                            <div className="text-[10px] text-slate-500">{item.jam}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Database className="w-3 h-3 text-blue-400" />
                              <span className="text-sm font-semibold">{item.namaMesin}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-black">
                              {item.liter.toLocaleString('id-ID')} L
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-300">{item.petugas}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-slate-500 truncate max-w-[150px]" title={item.keterangan}>
                              {item.keterangan || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
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
