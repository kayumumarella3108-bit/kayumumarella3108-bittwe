import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Plus, 
  History, 
  Trash2, 
  Calendar, 
  Clock, 
  Database, 
  Search,
  User,
  Save,
  Loader2,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle
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
  updateDoc,
  OperationType, 
  handleFirestoreError,
  filterDeleted,
  registerDeletedId
} from '../../lib/firebase';
import { KitLaporanBebanItem, KitMasterMesinItem, User as AppUser, MasterUnitPLN } from '../../types';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';

import { DashboardAnalisisKIT } from './DashboardAnalisisKIT';

interface KitLaporanBebanViewProps {
  currentUser: AppUser | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
}

export const KitLaporanBebanView: React.FC<KitLaporanBebanViewProps> = ({ 
  currentUser,
  selectedUnit,
  onSelectUnit,
  masterUnitList
}) => {
  const [items, setItems] = useState<KitLaporanBebanItem[]>([]);
  const [machines, setMachines] = useState<KitMasterMesinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    mesinId: '',
    namaMesin: '',
    bebanKw: '',
    teganganV: '20000',
    frekuensiHz: '50',
    totalRunningHours: '',
    unit: ''
  });

  // Sync unit
  useEffect(() => {
    if (selectedUnit !== 'SEMUA') {
      setFormData(prev => ({ ...prev, unit: selectedUnit }));
    }
  }, [selectedUnit]);

  useEffect(() => {
    const q = query(collection(db, 'data_beban_kit'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KitLaporanBebanItem[];
      
      setItems(filterDeleted(list));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'data_beban_kit');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch machines
  useEffect(() => {
    const q = query(collection(db, 'master_mesin_kit'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KitMasterMesinItem[];
      setMachines(list);
    });
    return () => unsubscribe();
  }, []);

  const filteredMachines = useMemo(() => {
    return filterByUnitOrKode(machines, selectedUnit);
  }, [machines, selectedUnit]);

  const selectedMachine = useMemo(() => {
    return machines.find(m => m.mesinId === formData.mesinId);
  }, [machines, formData.mesinId]);

  useEffect(() => {
    if (selectedMachine) {
      setFormData(prev => ({ 
        ...prev, 
        namaMesin: selectedMachine.namaMesin,
        totalRunningHours: selectedMachine.totalRunningHours?.toString() || prev.totalRunningHours 
      }));
    }
  }, [selectedMachine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mesinId || !formData.bebanKw) return;

    setSubmitting(true);
    try {
      const finalUnit = formData.unit || (selectedUnit !== 'SEMUA' ? selectedUnit : (currentUser?.unit || 'ULP Baguala'));
      const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

      const newItem = {
        tanggal: formData.tanggal,
        jam: formData.jam,
        mesinId: formData.mesinId,
        namaMesin: formData.namaMesin || formData.mesinId,
        bebanKw: parseFloat(formData.bebanKw),
        teganganV: parseFloat(formData.teganganV),
        frekuensiHz: parseFloat(formData.frekuensiHz),
        petugas: currentUser?.name || 'Petugas KIT',
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'data_beban_kit'), newItem);
      
      // Update machine hours if provided
      if (selectedMachine && formData.totalRunningHours) {
        await updateDoc(doc(db, 'master_mesin_kit', selectedMachine.id), {
          totalRunningHours: parseFloat(formData.totalRunningHours)
        });
      }

      setFormData({
        ...formData,
        mesinId: '',
        namaMesin: '',
        bebanKw: '',
        totalRunningHours: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'data_beban_kit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data laporan beban ini?')) return;
    try {
      registerDeletedId(id);
      await deleteDoc(doc(db, 'data_beban_kit', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `data_beban_kit/${id}`);
    }
  };

  const unitFilteredItems = useMemo(() => {
    return filterByUnitOrKode(items, selectedUnit);
  }, [items, selectedUnit]);

  const filteredItems = unitFilteredItems.filter(item => 
    item.namaMesin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mesinId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.petugas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-sky-400 flex items-center gap-2">
              <BarChart3 className="w-7 h-7" /> {showDashboard ? 'Analisis Performa KIT' : 'Pencatatan Beban KIT'}
            </h1>
            <p className="text-slate-400">
              {showDashboard ? 'Visualisasi tren dan statistik beban.' : 'Log harian parameter elektrikal mesin pembangkit.'}
            </p>
          </div>
          
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              showDashboard 
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-sky-500/50'
            }`}
          >
            {showDashboard ? (
              <>
                <Plus className="w-3.5 h-3.5" /> Mode Input
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" /> Lihat Analisis
              </>
            )}
          </button>
        </div>

        <UnitFilterBar
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          masterUnitList={masterUnitList}
          className="bg-slate-900/50 p-2 rounded-2xl border border-sky-500/20"
        />
      </header>

      {showDashboard ? (
        <DashboardAnalisisKIT 
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          masterUnitList={masterUnitList}
          hideHeader // Optional prop to hide header if needed
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl sticky top-6"
          >
            <div className="flex items-center gap-2 mb-6 text-sky-400 font-bold">
              <Plus className="w-5 h-5" /> Tambah Catatan Beban
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Pilih Mesin
                </label>
                <select
                  required
                  value={formData.mesinId}
                  onChange={(e) => setFormData({...formData, mesinId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                >
                  <option value="">-- Pilih Mesin --</option>
                  {filteredMachines.map(m => (
                    <option key={m.id} value={m.mesinId}>{m.namaMesin} ({m.mesinId})</option>
                  ))}
                </select>
              </div>

              {selectedMachine && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2"
                >
                  {(() => {
                    const rh = selectedMachine.totalRunningHours || 0;
                    const interval = selectedMachine.maintenanceInterval || 500;
                    const remaining = interval - (rh % interval);
                    if (remaining <= 100) {
                      return (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg flex items-center gap-2 text-[10px] text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Peringatan: Mesin mendekati jadwal pemeliharaan ({remaining} jam lagi)</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Jam Kerja Saat Ini (Running Hours)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Contoh: 1250.5"
                      value={formData.totalRunningHours}
                      onChange={(e) => setFormData({...formData, totalRunningHours: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all font-mono"
                    />
                    <p className="text-[10px] text-slate-500">Update nilai RH terbaru untuk melacak jadwal pemeliharaan.</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Beban (kW)
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  required
                  value={formData.bebanKw}
                  onChange={(e) => setFormData({...formData, bebanKw: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Tegangan (V)
                  </label>
                  <input
                    type="number"
                    value={formData.teganganV}
                    onChange={(e) => setFormData({...formData, teganganV: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Freq (Hz)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.frekuensiHz}
                    onChange={(e) => setFormData({...formData, frekuensiHz: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
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

        {/* History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-sky-400">
              <History className="w-5 h-5" /> Riwayat Beban
            </h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari mesin / petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-sky-500 outline-none"
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
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">BEBAN (kW)</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">V / Hz</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400">PETUGAS</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                        Belum ada data beban tercatat.
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
                            <div className="text-sm font-bold">{item.tanggal}</div>
                            <div className="text-[10px] text-slate-500">{item.jam}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold">{item.namaMesin}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="inline-flex px-2 py-1 rounded bg-sky-500/10 text-sky-400 text-sm font-black">
                              {item.bebanKw.toLocaleString('id-ID')} kW
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-slate-300">{item.teganganV}V / {item.frekuensiHz}Hz</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-300">{item.petugas}</span>
                            </div>
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
    )}
    </motion.div>
  );
};
