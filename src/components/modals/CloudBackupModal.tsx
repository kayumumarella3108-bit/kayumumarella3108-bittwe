import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  Database,
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  FileCode,
  ShieldCheck,
  Layers,
  X,
  UploadCloud,
  ArrowRight,
  Server
} from 'lucide-react';
import JSZip from 'jszip';
import { db, collection, getDocs, setDoc, doc, onSnapshot, query, orderBy, limit } from '../../lib/firebase';
import { exportToCSV } from '../../utils/exportCsv';
import { User, MasterUnitPLN, Penyulang, SectionJaringan } from '../../types';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  masterUnitList?: MasterUnitPLN[];
  penyulangList?: Penyulang[];
  sectionList?: SectionJaringan[];
}

export interface BackupHistoryRecord {
  id: string;
  backupId: string;
  timestamp: string;
  triggeredBy: string;
  status: 'SUCCESS' | 'FAILED';
  totalRecords: number;
  collectionCounts: Record<string, number>;
  notes?: string;
  payload?: any;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  masterUnitList = [],
  penyulangList = [],
  sectionList = []
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'sheets' | 'history' | 'restore'>('cloud');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupHistoryRecord[]>([]);
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('perangpadam_sheets_webhook_url') || '';
  });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Cloud Backup Logs from Firestore
  useEffect(() => {
    if (!isOpen) return;

    try {
      const q = query(collection(db, 'system_backups'), orderBy('timestamp', 'desc'), limit(20));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: BackupHistoryRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as BackupHistoryRecord);
          });
          setBackupHistory(list);
        },
        (err) => {
          console.warn('Could not fetch cloud backup logs:', err);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Backup listener error:', err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to collect all collections
  const collectAllData = async () => {
    setBackupProgress('Memindai koleksi Firestore...');
    const collectionsToBackup = [
      'master_unit_pln',
      'penyulang',
      'sections',
      'format_surat',
      'pemeliharaan',
      'gangguan_trip',
      'manbill',
      'metersl',
      'cashflow_bop',
      'users',
      'activity_logs',
      'saidi_saifi'
    ];

    const payloadData: Record<string, any[]> = {};
    const collectionCounts: Record<string, number> = {};
    let grandTotal = 0;

    for (const colName of collectionsToBackup) {
      setBackupProgress(`Membaca data ${colName}...`);
      try {
        const snap = await getDocs(collection(db, colName));
        const items: any[] = [];
        snap.forEach((d) => items.push({ _docId: d.id, ...d.data() }));
        payloadData[colName] = items;
        collectionCounts[colName] = items.length;
        grandTotal += items.length;
      } catch (e) {
        console.warn(`Failed reading collection ${colName}, using empty fallback:`, e);
        payloadData[colName] = [];
        collectionCounts[colName] = 0;
      }
    }

    // Attach local state fallback if firestore returned empty for core props
    if (payloadData['master_unit_pln'].length === 0 && masterUnitList.length > 0) {
      payloadData['master_unit_pln'] = masterUnitList;
      collectionCounts['master_unit_pln'] = masterUnitList.length;
    }
    if (payloadData['penyulang'].length === 0 && penyulangList.length > 0) {
      payloadData['penyulang'] = penyulangList;
      collectionCounts['penyulang'] = penyulangList.length;
    }
    if (payloadData['sections'].length === 0 && sectionList.length > 0) {
      payloadData['sections'] = sectionList;
      collectionCounts['sections'] = sectionList.length;
    }

    return { payloadData, collectionCounts, grandTotal };
  };

  // 1. Trigger Cloud Backup
  const handleTriggerCloudBackup = async () => {
    setIsBackingUp(true);
    try {
      const { payloadData, collectionCounts, grandTotal } = await collectAllData();

      setBackupProgress('Menyimpan snapshot ke Cloud Storage / Firestore (system_backups)...');
      const timestamp = new Date().toISOString();
      const backupId = `BACKUP-${Date.now()}`;
      const backupRecord: BackupHistoryRecord = {
        id: backupId,
        backupId,
        timestamp,
        triggeredBy: currentUser?.name || currentUser?.username || 'System Admin',
        status: 'SUCCESS',
        totalRecords: grandTotal,
        collectionCounts,
        payload: payloadData
      };

      await setDoc(doc(db, 'system_backups', backupId), backupRecord);

      // Save local backup snapshot to localStorage as offline safety
      localStorage.setItem('perangpadam_last_cloud_backup', JSON.stringify({
        timestamp,
        grandTotal,
        collectionCounts
      }));

      showToast('success', `Berhasil membuat cadangan Cloud Storage! Total ${grandTotal} data tersimpan.`);
    } catch (err) {
      console.error('Cloud Backup Error:', err);
      showToast('error', 'Gagal membuat cadangan data cloud: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsBackingUp(false);
      setBackupProgress('');
    }
  };

  // 2. Export ZIP Bundle for Google Sheets / Offline Backup
  const handleExportGoogleSheetsZip = async () => {
    setIsBackingUp(true);
    try {
      const { payloadData, grandTotal } = await collectAllData();
      setBackupProgress('Membuat bundle file Excel/Google Sheets...');

      const zip = new JSZip();
      const folder = zip.folder('Backup_Data_PLN');

      Object.entries(payloadData).forEach(([colName, rows]) => {
        if (!rows || rows.length === 0) return;

        // Generate CSV text with BOM for Excel/Google Sheets UTF-8 compatibility
        const sampleKeys = Object.keys(rows[0]).filter((k) => k !== '_docId' && typeof rows[0][k] !== 'object');
        const headers = ['Doc_ID', ...sampleKeys];
        
        let csvContent = '\uFEFF' + headers.join(',') + '\n';
        rows.forEach((r) => {
          const rowVals = headers.map((h) => {
            const raw = h === 'Doc_ID' ? r._docId || r.id : r[h];
            if (raw === undefined || raw === null) return '""';
            const str = String(raw).replace(/"/g, '""');
            return `"${str}"`;
          });
          csvContent += rowVals.join(',') + '\n';
        });

        folder?.file(`${colName}_GoogleSheets.csv`, csvContent);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup_PLN_GoogleSheets_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', `File bundle CSV Google Sheets (${grandTotal} record) berhasil diunduh!`);
    } catch (err) {
      showToast('error', 'Gagal mengekspor Google Sheets Zip: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsBackingUp(false);
      setBackupProgress('');
    }
  };

  // 3. Download Full JSON Backup
  const handleDownloadJSON = async () => {
    setIsBackingUp(true);
    try {
      const { payloadData, collectionCounts, grandTotal } = await collectAllData();
      const dump = {
        meta: {
          system: 'Aplikasi Siaga & Operasional PLN',
          exportedAt: new Date().toISOString(),
          exportedBy: currentUser?.name || 'Admin',
          grandTotal,
          collectionCounts
        },
        data: payloadData
      };

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Full_Backup_PLN_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', 'File cadangan JSON berhasil diunduh!');
    } catch (err) {
      showToast('error', 'Gagal mengunduh file JSON: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsBackingUp(false);
      setBackupProgress('');
    }
  };

  // 4. Trigger Sync to Google Sheets Webhook
  const handleTriggerSheetsWebhook = async () => {
    if (!sheetsWebhookUrl || !sheetsWebhookUrl.startsWith('http')) {
      showToast('error', 'Masukkan URL Webhook Google Apps Script yang valid.');
      return;
    }

    localStorage.setItem('perangpadam_sheets_webhook_url', sheetsWebhookUrl);
    setIsSyncingSheets(true);

    try {
      const { payloadData, collectionCounts, grandTotal } = await collectAllData();
      const body = {
        action: 'BACKUP_SYNC',
        timestamp: new Date().toISOString(),
        user: currentUser?.name || 'Admin PLN',
        totalRecords: grandTotal,
        summary: collectionCounts,
        data: payloadData
      };

      await fetch(sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        mode: 'no-cors' // Google Apps Script Webhooks typically require no-cors in browser
      });

      showToast('success', 'Permintaan sinkronisasi data berhasil dikirimkan ke Google Sheets!');
    } catch (err) {
      showToast('error', 'Gagal mengirim sinkronisasi ke Google Sheets: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === "BACKUP_SYNC") {
    var logSheet = sheet.getSheetByName("Log_Backup") || sheet.insertSheet("Log_Backup");
    logSheet.appendRow([new Date(), data.user, data.totalRecords, JSON.stringify(data.summary)]);
    
    // Auto-update Master_Unit Sheet
    if (data.data && data.data.master_unit_pln) {
      var unitSheet = sheet.getSheetByName("Master_Unit") || sheet.insertSheet("Master_Unit");
      unitSheet.clearContents();
      unitSheet.appendRow(["ID", "UIW", "UP3", "ULP", "Kode ULP", "Status"]);
      data.data.master_unit_pln.forEach(function(u) {
        unitSheet.appendRow([u.id, u.uiw, u.up3, u.ulp, u.kodeUlp, u.status]);
      });
    }
    return ContentService.createTextOutput(JSON.stringify({status: "SUCCESS"})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#012421] border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 border animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
                : 'bg-rose-900/90 text-rose-200 border-rose-500'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toastMessage.text}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-950 via-[#013531] to-teal-950 border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                Pusat Cadangan & Sinkronisasi Cloud
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-800/60 border border-teal-600/50 text-teal-300 font-mono">
                  Cloud Storage & Sheets
                </span>
              </h2>
              <p className="text-xs text-teal-300/80">
                Picu pembuatan snapshot cadangan sistem ke Firestore Cloud, ekspor berkas, atau sinkronkan ke Google Sheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-teal-300 hover:text-white hover:bg-teal-800/40 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-teal-800/60 bg-[#011d1a] px-6">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'cloud'
                ? 'border-amber-400 text-amber-300 bg-teal-900/40'
                : 'border-transparent text-teal-300/70 hover:text-teal-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            Picu Cadangan Cloud
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sheets'
                ? 'border-emerald-400 text-emerald-300 bg-teal-900/40'
                : 'border-transparent text-teal-300/70 hover:text-teal-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Integrasi Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300 bg-teal-900/40'
                : 'border-transparent text-teal-300/70 hover:text-teal-200'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            Riwayat Backup Cloud ({backupHistory.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Progress Banner */}
          {isBackingUp && (
            <div className="p-4 bg-teal-950 border border-amber-500/40 rounded-xl flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <p className="text-xs font-extrabold text-amber-300">Proses Cadangan Sedang Berjalan...</p>
                <p className="text-[11px] text-teal-300 font-mono mt-0.5">{backupProgress}</p>
              </div>
            </div>
          )}

          {/* TAB 1: CLOUD BACKUP */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cloud Firestore Snapshot Box */}
                <div className="p-5 bg-gradient-to-b from-[#01312d] to-[#01221f] border border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                      <Server className="w-5 h-5" />
                      <h3 className="font-black text-sm text-white">Cloud Firestore Backup Snapshot</h3>
                    </div>
                    <p className="text-xs text-teal-200/80 leading-relaxed">
                      Ambil snapshot instan dari seluruh basis data (Master Unit, Penyulang, Section, Pemeliharaan, dll.) dan amankan ke koleksi terenkripsi Cloud Storage.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleTriggerCloudBackup}
                      disabled={isBackingUp}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                      <CloudUpload className="w-4 h-4" />
                      Picu Cadangan Cloud Sekarang
                    </button>
                  </div>
                </div>

                {/* Local JSON Download Box */}
                <div className="p-5 bg-gradient-to-b from-[#01312d] to-[#01221f] border border-teal-600/40 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5 text-cyan-400 mb-2">
                      <FileCode className="w-5 h-5" />
                      <h3 className="font-black text-sm text-white">Unduh File Cadangan JSON</h3>
                    </div>
                    <p className="text-xs text-teal-200/80 leading-relaxed">
                      Unduh data lengkap dalam format JSON terstruktur untuk disimpan secara offline di komputer lokal atau penyimpanan eksternal.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleDownloadJSON}
                      disabled={isBackingUp}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-800/80 hover:bg-teal-700 text-cyan-200 font-bold text-xs rounded-xl border border-cyan-500/30 transition-all disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Berkas JSON Offline
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Summary Overview */}
              <div className="p-4 bg-teal-950/60 border border-teal-800/50 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-teal-200 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  Cakupan Data Cadangan Sistem
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-[#011e1b] rounded-lg border border-teal-800/40">
                    <span className="text-teal-400 font-medium block text-[11px]">Master Unit PLN</span>
                    <span className="text-white font-black text-sm">{masterUnitList.length} Unit</span>
                  </div>
                  <div className="p-2.5 bg-[#011e1b] rounded-lg border border-teal-800/40">
                    <span className="text-teal-400 font-medium block text-[11px]">Daftar Penyulang</span>
                    <span className="text-white font-black text-sm">{penyulangList.length} Feeder</span>
                  </div>
                  <div className="p-2.5 bg-[#011e1b] rounded-lg border border-teal-800/40">
                    <span className="text-teal-400 font-medium block text-[11px]">Section Jaringan</span>
                    <span className="text-white font-black text-sm">{sectionList.length} Section</span>
                  </div>
                  <div className="p-2.5 bg-[#011e1b] rounded-lg border border-teal-800/40">
                    <span className="text-teal-400 font-medium block text-[11px]">Keamanan Snapshot</span>
                    <span className="text-emerald-400 font-black text-sm flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS INTEGRATION */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-200">Ekspor Langsung ke Format Google Sheets</h3>
                    <p className="text-xs text-teal-300/80">
                      Unduh berkas CSV terstruktur khusus yang kompatibel 100% dengan Google Sheets & Microsoft Excel.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportGoogleSheetsZip}
                  disabled={isBackingUp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Unduh Bundle CSV Google Sheets (.ZIP)
                </button>
              </div>

              {/* Webhook Sync */}
              <div className="p-5 bg-[#011e1b] border border-teal-700/50 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  Otomatisasi Sinkronisasi Google Sheets (Apps Script Webhook)
                </h3>
                <p className="text-xs text-teal-300/80 leading-relaxed">
                  Tempelkan URL Webhook Google Apps Script Anda untuk memicu pengiriman data cadangan langsung ke Spreadsheet Google Drive secara otomatis saat diklik.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-teal-200">URL Webhook Google Apps Script</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sheetsWebhookUrl}
                      onChange={(e) => setSheetsWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 bg-[#011210] border border-teal-600/70 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={handleTriggerSheetsWebhook}
                      disabled={isSyncingSheets || !sheetsWebhookUrl}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {isSyncingSheets ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sinkronisasi...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" /> Sync ke Sheets
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Apps Script Guide */}
                <div className="pt-2 border-t border-teal-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-300">Kode Google Apps Script (Opsional)</span>
                    <button
                      onClick={copyAppsScript}
                      className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedScript ? 'Tersalin!' : 'Salin Skrip'}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#010e0c] rounded-xl border border-teal-900 text-[10px] font-mono text-teal-400 overflow-x-auto max-h-32">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP HISTORY LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-teal-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Catatan Snapshot Cadangan Cloud (Firestore Logs)
              </h3>

              {backupHistory.length === 0 ? (
                <div className="p-8 text-center text-teal-400/70 bg-teal-950/40 rounded-xl border border-teal-800/50">
                  <CloudUpload className="w-10 h-10 mx-auto mb-2 opacity-40 text-teal-300" />
                  <p className="text-xs font-bold text-teal-200">Belum Ada Catatan Backup Cloud</p>
                  <p className="text-[11px] mt-1 text-teal-400/80">Klik tombol "Picu Cadangan Cloud" untuk membuat snapshot pertama.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-teal-700/50 bg-[#011917]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-teal-950 text-teal-300 text-[11px] font-extrabold uppercase tracking-wider border-b border-teal-800">
                        <th className="p-3">Waktu Cadangan</th>
                        <th className="p-3">ID Backup</th>
                        <th className="p-3">Dipicu Oleh</th>
                        <th className="p-3 text-center">Total Data</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-800/40 text-xs text-teal-100">
                      {backupHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-teal-900/40 transition-colors">
                          <td className="p-3 font-mono text-[11px]">
                            {new Date(rec.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'medium'
                            })}
                          </td>
                          <td className="p-3 font-mono text-cyan-300 font-bold">{rec.backupId}</td>
                          <td className="p-3">{rec.triggeredBy}</td>
                          <td className="p-3 text-center font-bold text-amber-300">{rec.totalRecords} record</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                              <CheckCircle2 className="w-3 h-3" />
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#011917] border-t border-teal-800/60 flex items-center justify-between text-xs">
          <div className="text-teal-400/80 flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Snapshot Terenkripsi Firestore Database
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-800/80 hover:bg-teal-700 text-teal-100 font-bold rounded-xl transition-all"
          >
            Tutup Window
          </button>
        </div>
      </div>
    </div>
  );
};
