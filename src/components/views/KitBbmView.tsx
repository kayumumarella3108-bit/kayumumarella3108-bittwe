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
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  LayoutDashboard,
  Container,
  AlertTriangle,
  ArrowRight
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
  setDoc,
  getDoc,
  OperationType, 
  handleFirestoreError,
  filterDeleted,
  registerDeletedId
} from '../../lib/firebase';
import { KitBbmItem, KitBbmStockItem, KitMasterMesinItem, User as AppUser, MasterUnitPLN } from '../../types';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';

interface KitBbmViewProps {
  currentUser: AppUser | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
}

type TabType = 'STOK' | 'TRANSAKSI' | 'RIWAYAT';

export const KitBbmView: React.FC<KitBbmViewProps> = ({ 
  currentUser,
  selectedUnit,
  onSelectUnit,
  masterUnitList
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('TRANSAKSI');
  const [items, setItems] = useState<KitBbmItem[]>([]);
  const [stocks, setStocks] = useState<KitBbmStockItem[]>([]);
  const [machines, setMachines] = useState<KitMasterMesinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    type: 'KELUAR' as 'MASUK' | 'KELUAR',
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    mesinId: '',
    namaMesin: '',
    sumber: '',
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
      const bbmList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KitBbmItem[];
      setItems(filterDeleted(bbmList));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'data_bbm_kit');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'master_stok_bbm_kit'), (snapshot) => {
      const stockList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KitBbmStockItem[];
      setStocks(stockList);
    });
    return () => unsubscribe();
  }, []);

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

  const currentStock = useMemo(() => {
    const unitToFind = selectedUnit === 'SEMUA' ? 'ULP Baguala' : selectedUnit; // Default for display
    return stocks.find(s => s.unit === unitToFind) || null;
  }, [stocks, selectedUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'KELUAR' && !formData.mesinId) return;
    if (!formData.liter) return;

    setSubmitting(true);
    try {
      const finalUnit = formData.unit || (selectedUnit !== 'SEMUA' ? selectedUnit : (currentUser?.unit || 'ULP Baguala'));
      const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

      const newItem = {
        type: formData.type,
        tanggal: formData.tanggal,
        jam: formData.jam,
        mesinId: formData.type === 'KELUAR' ? formData.mesinId : '',
        namaMesin: formData.type === 'KELUAR' ? (machines.find(m => m.mesinId === formData.mesinId)?.namaMesin || formData.mesinId) : '',
        sumber: formData.type === 'MASUK' ? formData.sumber : '',
        liter: parseFloat(formData.liter),
        petugas: currentUser?.name || 'Petugas KIT',
        keterangan: formData.keterangan,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'data_bbm_kit'), newItem);
      
      // Update Stock
      const stockRef = doc(db, 'master_stok_bbm_kit', finalUnit);
      const stockDoc = await getDoc(stockRef);
      const currentLiter = parseFloat(formData.liter);
      
      if (stockDoc.exists()) {
        const data = stockDoc.data() as KitBbmStockItem;
        const newStok = formData.type === 'MASUK' 
          ? (data.stokAkhir || 0) + currentLiter 
          : (data.stokAkhir || 0) - currentLiter;
        
        await setDoc(stockRef, {
          ...data,
          stokAkhir: newStok,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await setDoc(stockRef, {
          id: finalUnit,
          unit: finalUnit,
          kodeUnit: finalKodeUnit,
          stokAkhir: formData.type === 'MASUK' ? currentLiter : -currentLiter,
          lastUpdated: new Date().toISOString()
        });
      }

      setFormData({
        ...formData,
        mesinId: '',
        namaMesin: '',
        sumber: '',
        liter: '',
        keterangan: ''
      });
      
      if (activeTab === 'TRANSAKSI') setActiveTab('RIWAYAT');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'data_bbm_kit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: KitBbmItem) => {
    if (!window.confirm('Hapus data transaksi BBM ini? Stok akan dikembalikan otomatis.')) return;
    
    try {
      // Revert Stock
      const stockRef = doc(db, 'master_stok_bbm_kit', item.unit || '');
      const stockDoc = await getDoc(stockRef);
      
      if (stockDoc.exists()) {
        const data = stockDoc.data() as KitBbmStockItem;
        const revertedStok = item.type === 'MASUK' 
          ? (data.stokAkhir || 0) - item.liter 
          : (data.stokAkhir || 0) + item.liter;
        
        await setDoc(stockRef, {
          ...data,
          stokAkhir: revertedStok,
          lastUpdated: new Date().toISOString()
        });
      }

      registerDeletedId(item.id);
      await deleteDoc(doc(db, 'data_bbm_kit', item.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `data_bbm_kit/${item.id}`);
    }
  };

  const unitFilteredItems = useMemo(() => {
    return filterByUnitOrKode(items, selectedUnit);
  }, [items, selectedUnit]);

  const filteredItems = unitFilteredItems.filter(item => 
    (item.namaMesin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.mesinId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.petugas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-teal-400 flex items-center gap-2">
            <Fuel className="w-7 h-7" /> Manajemen BBM KIT
          </h1>
          <p className="text-slate-400">Monitoring stok, penerimaan, dan pemakaian bahan bakar.</p>
        </div>

        <UnitFilterBar
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          masterUnitList={masterUnitList}
          className="bg-slate-900/50 p-2 rounded-2xl border border-teal-500/20"
        />
      </header>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group hover:border-teal-500/30 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
              <Container className="w-3 h-3" /> Stok BBM Saat Ini
            </div>
            <div className="text-3xl font-black text-white">
              {currentStock ? currentStock.stokAkhir.toLocaleString('id-ID') : '0'} <span className="text-sm text-slate-500 font-bold">LITER</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Unit: {selectedUnit === 'SEMUA' ? 'Pilih Unit' : selectedUnit}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
            <Fuel className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
              <ArrowDownLeft className="w-3 h-3" /> Total Masuk (Bulan Ini)
            </div>
            <div className="text-3xl font-black text-blue-400">
              {unitFilteredItems.filter(i => i.type === 'MASUK').reduce((acc, curr) => acc + curr.liter, 0).toLocaleString('id-ID')} <span className="text-sm text-slate-500 font-bold">L</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> Total Keluar (Bulan Ini)
            </div>
            <div className="text-3xl font-black text-amber-400">
              {unitFilteredItems.filter(i => i.type === 'KELUAR').reduce((acc, curr) => acc + curr.liter, 0).toLocaleString('id-ID')} <span className="text-sm text-slate-500 font-bold">L</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
            <LayoutDashboard className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'TRANSAKSI', label: 'Catat Transaksi', icon: Plus },
          { id: 'RIWAYAT', label: 'Riwayat Log', icon: History },
          { id: 'STOK', label: 'Monitoring Stok', icon: Container }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-teal-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'TRANSAKSI' && (
          <motion.div 
            key="transaksi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-teal-400 font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Form Transaksi
                  </div>
                  <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setFormData({...formData, type: 'MASUK'})}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.type === 'MASUK' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      MASUK
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'KELUAR'})}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.type === 'KELUAR' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                    >
                      KELUAR
                    </button>
                  </div>
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {formData.type === 'KELUAR' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Pilih Mesin (Pemakaian)
                      </label>
                      <select
                        required
                        value={formData.mesinId}
                        onChange={(e) => setFormData({...formData, mesinId: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 outline-none"
                      >
                        <option value="">-- Pilih Mesin --</option>
                        {filteredMachines.map(m => (
                          <option key={m.id} value={m.mesinId}>{m.namaMesin} ({m.mesinId})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" /> Sumber BBM (Masuk)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Vendor X / Mobil Tangki"
                        required
                        value={formData.sumber}
                        onChange={(e) => setFormData({...formData, sumber: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Fuel className="w-3 h-3" /> Volume (Liter)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="0.0"
                      value={formData.liter}
                      onChange={(e) => setFormData({...formData, liter: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none font-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Keterangan
                    </label>
                    <textarea
                      placeholder="Catatan..."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                      formData.type === 'MASUK' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'
                    } text-white`}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Transaksi</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl border-l-4 border-l-teal-500">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-400" /> Informasi Pengelolaan BBM
                </h3>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                  <li>Pilih <strong>MASUK</strong> untuk mencatat penerimaan BBM dari vendor.</li>
                  <li>Pilih <strong>KELUAR</strong> untuk mencatat pemakaian BBM oleh mesin pembangkit.</li>
                  <li>Stok akan dikalkulasi secara otomatis per unit ULP yang dipilih.</li>
                  <li>Pastikan mengisi <strong>Volume</strong> dengan teliti untuk akurasi laporan.</li>
                </ul>
              </div>

              {currentStock && currentStock.stokAkhir <= 200 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-red-400">Peringatan: Stok Menipis!</div>
                    <p className="text-xs text-red-300/70 mt-1">Stok BBM di unit ini tersisa {currentStock.stokAkhir.toLocaleString()} L. Segera lakukan pengadaan atau cek tangki penyimpanan.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'RIWAYAT' && (
          <motion.div 
            key="riwayat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-teal-400">
                <History className="w-5 h-5" /> Log Transaksi BBM
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-800">
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipe</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Keterangan Mesin / Sumber</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Petugas</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></td></tr>
                    ) : filteredItems.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">Belum ada data transaksi.</td></tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black ${
                              item.type === 'MASUK' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-bold text-slate-200">{item.tanggal}</div>
                            <div className="text-[10px] text-slate-500">{item.jam}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {item.type === 'MASUK' ? (
                                <><ArrowDownLeft className="w-3 h-3 text-blue-400" /><span className="text-xs text-slate-300">Dari: {item.sumber}</span></>
                              ) : (
                                <><ArrowUpRight className="w-3 h-3 text-amber-400" /><span className="text-xs text-slate-300">Ke: {item.namaMesin}</span></>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-black text-white text-sm">
                            {item.liter.toLocaleString()} L
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">{item.petugas}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => handleDelete(item)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all text-slate-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'STOK' && (
          <motion.div 
            key="stok"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {stocks.map((stock) => (
              <div key={stock.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 bg-teal-500/5 rounded-full -mr-4 -mt-4 group-hover:bg-teal-500/10 transition-all"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-white uppercase tracking-wider">{stock.unit}</div>
                    <Container className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-4xl font-black text-teal-400 mb-2">
                    {stock.stokAkhir.toLocaleString()} <span className="text-xs text-slate-500 uppercase">Liter</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" /> Terakhir Update: {new Date(stock.lastUpdated).toLocaleString()}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800">
                     <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                       Detail Stok <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
            {stocks.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-900 rounded-2xl border border-dashed border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-800" />
                <p className="text-slate-500 text-sm mt-2">Belum ada data stok unit.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
