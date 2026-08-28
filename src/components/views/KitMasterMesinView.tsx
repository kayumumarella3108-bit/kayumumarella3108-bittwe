import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Search,
  Save,
  Loader2,
  Calendar,
  Zap,
  Tag,
  Activity,
  Box,
  Settings,
  Clock,
  AlertTriangle,
  Bell
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
import { KitMasterMesinItem, User as AppUser, MasterUnitPLN } from '../../types';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';

interface KitMasterMesinViewProps {
  currentUser: AppUser | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
}

export const KitMasterMesinView: React.FC<KitMasterMesinViewProps> = ({ 
  currentUser,
  selectedUnit,
  onSelectUnit,
  masterUnitList
}) => {
  const [items, setItems] = useState<KitMasterMesinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    mesinId: '',
    namaMesin: '',
    merk: '',
    tipe: '',
    kapasitasKw: '',
    tahunOperasi: new Date().getFullYear().toString(),
    status: 'AKTIF' as 'AKTIF' | 'STANDBY' | 'RUSAK',
    totalRunningHours: '0',
    maintenanceInterval: '500',
    unit: ''
  });

  // Sync unit
  useEffect(() => {
    if (selectedUnit !== 'SEMUA') {
      setFormData(prev => ({ ...prev, unit: selectedUnit }));
    }
  }, [selectedUnit]);

  useEffect(() => {
    const q = query(collection(db, 'master_mesin_kit'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KitMasterMesinItem[];
      
      setItems(filterDeleted(list));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'master_mesin_kit');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mesinId || !formData.namaMesin) return;

    setSubmitting(true);
    try {
      const finalUnit = formData.unit || (selectedUnit !== 'SEMUA' ? selectedUnit : (currentUser?.unit || 'ULP Baguala'));
      const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

      const newItem = {
        mesinId: formData.mesinId,
        namaMesin: formData.namaMesin,
        merk: formData.merk,
        tipe: formData.tipe,
        kapasitasKw: parseFloat(formData.kapasitasKw) || 0,
        tahunOperasi: formData.tahunOperasi,
        status: formData.status,
        totalRunningHours: parseFloat(formData.totalRunningHours) || 0,
        maintenanceInterval: parseFloat(formData.maintenanceInterval) || 500,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'master_mesin_kit'), newItem);
      
      setFormData({
        ...formData,
        mesinId: '',
        namaMesin: '',
        merk: '',
        tipe: '',
        kapasitasKw: '',
        status: 'AKTIF',
        totalRunningHours: '0',
        maintenanceInterval: '500'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'master_mesin_kit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data mesin ini dari master data?')) return;
    try {
      registerDeletedId(id);
      await deleteDoc(doc(db, 'master_mesin_kit', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `master_mesin_kit/${id}`);
    }
  };

  const unitFilteredItems = useMemo(() => {
    return filterByUnitOrKode(items, selectedUnit);
  }, [items, selectedUnit]);

  const filteredItems = unitFilteredItems.filter(item => 
    item.namaMesin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mesinId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.merk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Database className="w-7 h-7" /> Master Data Mesin KIT
          </h1>
          <p className="text-slate-400">Pengelolaan aset dan spesifikasi unit pembangkit.</p>
        </div>

        <UnitFilterBar
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          masterUnitList={masterUnitList}
          className="bg-slate-900/50 p-2 rounded-2xl border border-amber-500/20"
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
            <div className="flex items-center gap-2 mb-6 text-amber-400 font-bold">
              <Plus className="w-5 h-5" /> Registrasi Mesin Baru
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> ID Mesin
                  </label>
                  <input
                    type="text"
                    placeholder="MSN-01"
                    required
                    value={formData.mesinId}
                    onChange={(e) => setFormData({...formData, mesinId: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Box className="w-3 h-3" /> Nama Mesin
                  </label>
                  <input
                    type="text"
                    placeholder="Unit 1"
                    required
                    value={formData.namaMesin}
                    onChange={(e) => setFormData({...formData, namaMesin: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Merk
                  </label>
                  <input
                    type="text"
                    placeholder="Caterpillar"
                    value={formData.merk}
                    onChange={(e) => setFormData({...formData, merk: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Kapasitas (kW)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.kapasitasKw}
                    onChange={(e) => setFormData({...formData, kapasitasKw: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tahun Operasi
                </label>
                <input
                  type="number"
                  value={formData.tahunOperasi}
                  onChange={(e) => setFormData({...formData, tahunOperasi: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Status Aset
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                >
                  <option value="AKTIF">OPERASI (AKTIF)</option>
                  <option value="STANDBY">STANDBY (CADANGAN)</option>
                  <option value="RUSAK">RUSAK / PEMELIHARAAN</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Total Jam Kerja (RH)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.totalRunningHours}
                    onChange={(e) => setFormData({...formData, totalRunningHours: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Interval Maint. (Jam)
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={formData.maintenanceInterval}
                    onChange={(e) => setFormData({...formData, maintenanceInterval: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Daftarkan Mesin
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <Database className="w-5 h-5" /> Daftar Unit Mesin
            </h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari ID / Nama / Merk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800">
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">IDENTITAS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">MERK / TIPE</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 text-center">RUNNING HOURS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">NEXT MAINT.</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">STATUS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Belum ada data mesin terdaftar.
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
                            <div className="text-sm font-bold text-white">{item.namaMesin}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.mesinId}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-bold text-amber-400">{item.merk || '-'}</div>
                            <div className="text-[10px] text-slate-400">{item.tipe || '-'}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {item.totalRunningHours?.toLocaleString() || 0}
                              </div>
                              <div className="text-[10px] text-slate-500">Hours</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {(() => {
                              const rh = item.totalRunningHours || 0;
                              const interval = item.maintenanceInterval || 500;
                              const remaining = interval - (rh % interval);
                              const isNear = remaining < 50;
                              const isOver = rh >= interval && (rh % interval) < 10; // Simple logic for "just passed" or use more complex tracking

                              // More robust: remaining hours until next multiple of interval
                              const hoursToMaint = remaining;
                              
                              return (
                                <div className="space-y-1">
                                  <div className={`text-xs font-bold flex items-center gap-1 ${
                                    hoursToMaint <= 20 ? 'text-red-400' : hoursToMaint <= 100 ? 'text-amber-400' : 'text-emerald-400'
                                  }`}>
                                    {hoursToMaint <= 100 && <AlertTriangle className="w-3 h-3" />}
                                    {hoursToMaint.toLocaleString()} h
                                  </div>
                                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        hoursToMaint <= 20 ? 'bg-red-500' : hoursToMaint <= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.max(0, Math.min(100, (remaining / interval) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'AKTIF' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : item.status === 'STANDBY'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {item.status}
                            </span>
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
