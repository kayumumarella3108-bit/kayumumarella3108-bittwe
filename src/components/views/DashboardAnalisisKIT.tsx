import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, BarChart3, Wrench, Database, AlertCircle, CheckCircle2, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';
import { MasterUnitPLN, KitMasterMesinItem, KitBbmItem } from '../../types';
import { db, collection, onSnapshot, query, orderBy } from '../../lib/firebase';

interface DashboardAnalisisKITProps {
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  masterUnitList: MasterUnitPLN[];
  hideHeader?: boolean;
}

const dataBebanDefault = [
  { name: 'Jan', beban: 4000 },
  { name: 'Feb', beban: 3000 },
  { name: 'Mar', beban: 5000 },
  { name: 'Apr', beban: 4500 },
  { name: 'Mei', beban: 6000 },
  { name: 'Jun', beban: 5500 },
];

const dataStatusPemeliharaan = [
  { name: 'Selesai', value: 75, color: '#10b981' },
  { name: 'Proses', value: 20, color: '#f59e0b' },
  { name: 'Pending', value: 5, color: '#ef4444' },
];

export const DashboardAnalisisKIT: React.FC<DashboardAnalisisKITProps> = ({
  selectedUnit,
  onSelectUnit,
  masterUnitList,
  hideHeader
}) => {
  const [mesinList, setMesinList] = useState<KitMasterMesinItem[]>([]);
  const [bbmList, setBbmList] = useState<KitBbmItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch machines for real alerts
  useEffect(() => {
    const q = query(collection(db, 'master_mesin_kit'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KitMasterMesinItem[];
      setMesinList(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch BBM data
  useEffect(() => {
    const q = query(collection(db, 'data_bbm_kit'), orderBy('tanggal', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KitBbmItem[];
      setBbmList(list);
    });
    return () => unsubscribe();
  }, []);

  const filteredMesin = useMemo(() => {
    return filterByUnitOrKode(mesinList, selectedUnit);
  }, [mesinList, selectedUnit]);

  const filteredBbm = useMemo(() => {
    return filterByUnitOrKode(bbmList, selectedUnit);
  }, [bbmList, selectedUnit]);

  // Maintenance Alerts Logic
  const maintenanceAlerts = useMemo(() => {
    return filteredMesin.map(m => {
      const rh = m.totalRunningHours || 0;
      const interval = m.maintenanceInterval || 500;
      const remaining = interval - (rh % interval);
      return { ...m, hoursToMaint: remaining };
    }).filter(m => m.hoursToMaint <= 100)
      .sort((a, b) => a.hoursToMaint - b.hoursToMaint);
  }, [filteredMesin]);

  // BBM Trend Logic
  const bbmTrendData = useMemo(() => {
    const grouped: Record<string, any> = {};
    
    // Sort and limit to last 14 entries for readable daily trend
    const recentBbm = [...filteredBbm].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    
    recentBbm.forEach(item => {
      const date = item.tanggal;
      if (!grouped[date]) {
        grouped[date] = { date: date.split('-').slice(1).join('/') }; // MM/DD
      }
      const machineKey = item.namaMesin || item.mesinId;
      grouped[date][machineKey] = (grouped[date][machineKey] || 0) + item.liter;
    });

    return Object.values(grouped).slice(-15);
  }, [filteredBbm]);

  const machineNames = useMemo(() => {
    const names = new Set<string>();
    filteredBbm.forEach(item => names.add(item.namaMesin || item.mesinId));
    return Array.from(names);
  }, [filteredBbm]);

  // Simulate data variation based on unit
  const unitSeed = selectedUnit === 'SEMUA' ? 1 : selectedUnit.length / 10;
  const currentBebanData = dataBebanDefault.map(d => ({
    ...d,
    beban: Math.round(d.beban * (0.8 + unitSeed * 0.4))
  }));

  const totalMesin = filteredMesin.length || (selectedUnit === 'SEMUA' ? 48 : Math.max(4, Math.round(12 * unitSeed)));
  const avgBeban = Math.round(4500 * (0.9 + unitSeed * 0.2));

  const chartColors = ['#2dd4bf', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 bg-slate-950 text-slate-100 ${hideHeader ? '' : 'p-6 min-h-screen'}`}
    >
      {!hideHeader && (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-400">Dashboard Analisis KIT</h1>
            <p className="text-slate-400">Ringkasan performa untuk <span className="text-teal-300 font-bold">{selectedUnit === 'SEMUA' ? 'Seluruh Unit' : selectedUnit}</span></p>
          </div>

          <UnitFilterBar
            selectedUnit={selectedUnit}
            onSelectUnit={onSelectUnit}
            masterUnitList={masterUnitList}
            className="bg-slate-900/50 p-2 rounded-2xl border border-teal-500/20"
          />
        </header>
      )}

      {/* Maintenance Alerts System */}
      <AnimatePresence>
        {maintenanceAlerts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-2">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-3">
                <AlertTriangle className="w-5 h-5" /> Notifikasi Pemeliharaan Mesin ({maintenanceAlerts.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {maintenanceAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-red-500/50 transition-all cursor-default group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${alert.hoursToMaint <= 20 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{alert.namaMesin}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{alert.mesinId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${alert.hoursToMaint <= 20 ? 'text-red-400' : 'text-amber-400'}`}>
                        {alert.hoursToMaint.toLocaleString()} Jam Lagi
                      </div>
                      <div className="text-[9px] text-slate-500">Maint. Interval: {alert.maintenanceInterval}h</div>
                    </div>
                  </div>
                ))}
              </div>
              {maintenanceAlerts.length > 6 && (
                <div className="mt-3 text-center">
                  <button className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 mx-auto">
                    Lihat Semua Alert <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Mesin', value: totalMesin.toString(), icon: Database, color: 'text-blue-400' },
          { label: 'Beban Rata-rata', value: `${avgBeban} kW`, icon: Activity, color: 'text-teal-400' },
          { label: 'Pemeliharaan Selesai', value: '75%', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Status Kritis', value: maintenanceAlerts.length.toString(), icon: AlertCircle, color: 'text-red-400' },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg flex items-center gap-4">
            <div className={`p-3 rounded-full bg-slate-800 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="text-xl font-bold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BBM Consumption Trend */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> Tren Konsumsi BBM per Mesin (Liter)
            </h2>
            <div className="text-xs text-slate-500">Menampilkan 15 data pencatatan terakhir</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={bbmTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend />
              {machineNames.map((name, idx) => (
                <Bar 
                  key={name} 
                  dataKey={name} 
                  stackId="a" 
                  fill={chartColors[idx % chartColors.length]} 
                  radius={[idx === machineNames.length - 1 ? 4 : 0, idx === machineNames.length - 1 ? 4 : 0, 0, 0]}
                />
              ))}
              {machineNames.length === 0 && (
                <text x="50%" y="50%" textAnchor="middle" fill="#475569" fontSize="14">
                  Belum ada data konsumsi BBM
                </text>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-400" /> Tren Beban Bulanan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentBebanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              <Legend />
              <Line type="monotone" dataKey="beban" stroke="#2dd4bf" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-teal-400" /> Status Pemeliharaan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dataStatusPemeliharaan} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {dataStatusPemeliharaan.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>

  );
};
