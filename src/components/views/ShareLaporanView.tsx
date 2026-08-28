import React, { useState, useMemo } from 'react';
import {
  Share2,
  MessageCircle,
  Send,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Shield,
  FileText,
  Smartphone,
  Globe,
  Info,
  Presentation,
  FileSpreadsheet
} from 'lucide-react';
import { User, GangguanLog, Penyulang, SaidiSaifiData, JadwalPiket, PerintahKerja, MaterialStokItem, InspeksiItem } from '../../types';
import { PptExportModal } from '../ppt/PptExportModal';
import { PptExportData } from '../ppt/pptTemplate';

interface ShareLaporanViewProps {
  user: User;
  gangguanList: GangguanLog[];
  penyulangList: Penyulang[];
  saidiData: SaidiSaifiData[];
  jadwalPiket: JadwalPiket[];
  perintahKerja: PerintahKerja[];
  stokList: MaterialStokItem[];
  inspeksiList: InspeksiItem[];
}

export const ShareLaporanView: React.FC<ShareLaporanViewProps> = ({
  user,
  gangguanList,
  penyulangList,
  saidiData,
  jadwalPiket,
  perintahKerja,
  stokList,
  inspeksiList
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'gangguan' | 'saidi' | 'piket' | 'spk' | 'sistem' | 'material' | 'inspeksi'
  >('gangguan');

  const [copied, setCopied] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);

  // Calculate Gangguan statistics at top of component body
  const todayStr = new Date().toISOString().split('T')[0];
  const gangguanHariIni = useMemo(() => {
    return gangguanList.filter(g => g.tanggalPadam === todayStr);
  }, [gangguanList, todayStr]);

  const totalKaliTripHariIni = gangguanHariIni.length;

  // Prepare PPT Export Data
  const pptExportData: PptExportData = useMemo(() => {
    const latestSaidi = saidiData[saidiData.length - 1];
    
    // Format Table Data based on selected report
    let tableHeaders = ['No', 'Nama Penyulang / Feeder', 'Jam Padam', 'Jam Nyala', 'Arus Trip (A)', 'Penyebab / Indikasi'];
    let tableData: string[][] = [];

    if (selectedReportType === 'gangguan') {
      tableHeaders = ['No', 'Penyulang', 'Jam Padam', 'Jam Nyala', 'Arus Trip (A)', 'Penyebab Utama'];
      tableData = gangguanList.slice(0, 8).map((g, idx) => [
        (idx + 1).toString(),
        g.namaPenyulang || '-',
        g.jamPadam || '-',
        g.jamNyala || 'Padam',
        g.arusTrip ? `${g.arusTrip} A` : '-',
        g.penyebab || g.indikasiRelay || 'Investigasi'
      ]);
    } else if (selectedReportType === 'spk') {
      tableHeaders = ['No', 'No SPK', 'Jenis Pekerjaan', 'Lokasi Pekerjaan', 'Pelaksana', 'Status'];
      tableData = perintahKerja.slice(0, 8).map((s, idx) => [
        (idx + 1).toString(),
        s.nomorSpk || '-',
        s.jenisPekerjaan || '-',
        s.lokasiPekerjaan || '-',
        s.pelaksana || '-',
        s.status || 'Berjalan'
      ]);
    } else if (selectedReportType === 'piket') {
      tableHeaders = ['No', 'Nama Petugas Yantek', 'Unit / Posko', 'Shift Hari Ini', 'Nomor Kontak HP'];
      const currentDay = new Date().getDate().toString();
      tableData = jadwalPiket.slice(0, 8).map((p, idx) => {
        const shiftCode = p.jadwal[currentDay] || 'L';
        const shiftLabel = 
          shiftCode === 'P' ? 'Pagi (08:00 - 16:00)' :
          shiftCode === 'S' ? 'Sore (16:00 - 24:00)' :
          shiftCode === 'M' ? 'Malam (00:00 - 08:00)' : 'Libur (Off)';
        return [
          (idx + 1).toString(),
          p.namaPetugas || '-',
          p.unit || 'Yantek',
          shiftLabel,
          p.noHp || '-'
        ];
      });
    } else if (selectedReportType === 'material') {
      tableHeaders = ['No', 'Nama Material', 'Satuan', 'Stok Total', 'Unit'];
      tableData = stokList.slice(0, 8).map((s, idx) => [
        (idx + 1).toString(),
        s.namaMaterial || '-',
        s.satuan || '-',
        s.stokTotal?.toString() || '0',
        s.unit || '-'
      ]);
    } else if (selectedReportType === 'inspeksi') {
      tableHeaders = ['No', 'Tiang/Gardu', 'Tipe', 'Penyulang', 'Temuan', 'Kondisi'];
      tableData = inspeksiList.slice(0, 8).map((i, idx) => [
        (idx + 1).toString(),
        i.tiangOrGarduId || '-',
        i.tipe || '-',
        i.namaPenyulang || '-',
        i.temuan || '-',
        i.kondisi || '-'
      ]);
    } else {
      tableHeaders = ['No', 'Bulan/Tahun', 'Target SAIDI', 'Realisasi SAIDI', 'Target SAIFI', 'Realisasi SAIFI'];
      tableData = saidiData.slice(-6).map((s, idx) => [
        (idx + 1).toString(),
        `${s.bulan} ${s.tahun}`,
        `${s.targetSaidi} m/plg`,
        `${s.realisasiSaidi} m/plg`,
        `${s.targetSaifi} k/plg`,
        `${s.realisasiSaifi} k/plg`
      ]);
    }

    if (tableData.length === 0) {
      tableData = [['1', 'PLN ULP Baguala System 20kV', 'Aman', 'Aman', '0 A', 'NIHIL GANGGUAN TRIP']];
    }

    return {
      reportTitle: `LAPORAN KEANDALAN SISTEM KELISTRIKAN 20KV (${selectedReportType.toUpperCase()})`,
      unitName: 'ULP BAGUALA - AMBON',
      dateStr: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      petugasName: user?.name || 'Petugas Operator',
      petugasRole: user?.role || 'Admin Teknik',
      kpiList: [
        { title: 'Total Trip Hari Ini', value: `${totalKaliTripHariIni}`, unit: 'Kejadian', color: totalKaliTripHariIni > 0 ? '#EF4444' : '#10B981', note: totalKaliTripHariIni === 0 ? 'Sistem Aman' : 'Butuh Penanganan' },
        { title: 'Realisasi SAIDI', value: `${latestSaidi?.realisasiSaidi || '1.25'}`, unit: 'm/plg', color: '#0284C7' },
        { title: 'Realisasi SAIFI', value: `${latestSaidi?.realisasiSaifi || '0.04'}`, unit: 'k/plg', color: '#8B5CF6' },
        { title: 'Penyulang Aktif', value: `${penyulangList.length}`, unit: 'Feeder', color: '#F59E0B', note: '100% Terbaca System' }
      ],
      tableHeaders,
      tableData,
      notesText: customNotes.trim() || '1. Pemantauan berkala penyulang 20kV Baguala & Passo.\n2. Laporan siap diserahkan kepada Manajemen PLN UP3 Ambon.'
    };
  }, [selectedReportType, gangguanList, perintahKerja, jadwalPiket, saidiData, totalKaliTripHariIni, penyulangList, user, customNotes, stokList, inspeksiList]);

  // Telegram WebApp detection
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
  const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://perang-padam-baguala.web.app';

  // Generate Report Text dynamically based on selection
  const formattedReportText = useMemo(() => {
    const tanggalFormat = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const jamNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let header = `⚡ *PLN ULP BAGUALA - SISTEM KEANDALAN 20KV*\n`;
    header += `📍 *Unit:* ULP Baguala • Ambon\n`;
    header += `📅 *Tanggal:* ${tanggalFormat} (${jamNow} WIT)\n`;
    header += `👤 *Petugas Pelapor:* ${user?.name || 'Petugas'} (${user?.role || 'Operator'})\n`;
    header += `----------------------------------------\n\n`;

    let body = '';

    if (selectedReportType === 'gangguan') {
      body += `🔥 *LAPORAN RINGKASAN GANGGUAN TRIP FEEDER*\n\n`;
      body += `• Total Kejadian Trip Hari Ini: *${totalKaliTripHariIni} Kejadian*\n`;
      body += `• Total Feeder Terdaftar: *${penyulangList.length} Penyulang*\n\n`;

      if (gangguanHariIni.length > 0) {
        body += `📋 *Daftar Kejadian Trip Hari Ini:*\n`;
        gangguanHariIni.forEach((g, idx) => {
          body += `${idx + 1}. *${g.namaPenyulang}* (${g.jamPadam} - ${g.jamNyala || 'Padam'})\n`;
          body += `   • Arus Trip: ${g.arusTrip || '-'} A | Indikasi: ${g.indikasiRelay || '-'}\n`;
          body += `   • Penyebab: ${g.penyebab || 'Dalam Investigasi'}\n`;
        });
      } else {
        body += `✅ *Status Jaringan:* NIHIL GANGGUAN TRIP / Sistem 20kV Aman Terkendali.\n`;
      }
    } else if (selectedReportType === 'saidi') {
      body += `📊 *LAPORAN KINERJA SAIDI & SAIFI*\n\n`;
      const latestSaidi = saidiData[saidiData.length - 1];
      if (latestSaidi) {
        body += `• Bulan: *${latestSaidi.bulan} ${latestSaidi.tahun}*\n`;
        body += `• Realisasi SAIDI: *${latestSaidi.realisasiSaidi} menit/pelanggan*\n`;
        body += `• Target SAIDI: *${latestSaidi.targetSaidi} menit/pelanggan*\n`;
        body += `• Realisasi SAIFI: *${latestSaidi.realisasiSaifi} kali/pelanggan*\n`;
        body += `• Status Capaian: *${(latestSaidi.status || 'NORMAL').toUpperCase()}*\n`;
      } else {
        body += `Data kinerja SAIDI & SAIFI dalam batas normal.\n`;
      }
    } else if (selectedReportType === 'piket') {
      body += `🛡️ *LAPORAN JADWAL PIKET PETUGAS YANTEK*\n\n`;
      const piketHariIni = jadwalPiket.slice(0, 4);
      if (piketHariIni.length > 0) {
        piketHariIni.forEach((p, idx) => {
          body += `${idx + 1}. *${p.namaPetugas}* (${p.regu || 'Regu Yantek'})\n`;
          body += `   • Shift: ${p.shift || 'Piket Utama'} | HP: ${p.noHp || '-'}\n`;
        });
      } else {
        body += `Petugas Yantek bersiap siaga 24 jam.\n`;
      }
    } else if (selectedReportType === 'spk') {
      body += `📋 *LAPORAN PERINTAH KERJA HARIAN (SPK)*\n\n`;
      const activeSpk = perintahKerja.slice(0, 3);
      if (activeSpk.length > 0) {
        activeSpk.forEach((s, idx) => {
          body += `${idx + 1}. *No SPK:* ${s.nomorSpk}\n`;
          body += `   • Pekerjaan: ${s.jenisPekerjaan}\n`;
          body += `   • Lokasi: ${s.lokasiPekerjaan}\n`;
          body += `   • Pelaksana: ${s.pelaksana}\n`;
        });
      } else {
        body += `Tidak ada pekerjaan SPK aktif saat ini.\n`;
      }
    } else if (selectedReportType === 'material') {
      body += `📦 *LAPORAN STOK MATERIAL GUDANG*\n\n`;
      const stokData = stokList.slice(0, 5);
      if (stokData.length > 0) {
        stokData.forEach((s, idx) => {
          body += `${idx + 1}. *${s.namaMaterial}*\n`;
          body += `   • Stok: ${s.stokTotal} ${s.satuan} | Unit: ${s.unit}\n`;
        });
      } else {
        body += `Tidak ada data stok material.\n`;
      }
    } else if (selectedReportType === 'inspeksi') {
      body += `🔍 *LAPORAN TEMUAN INSPEKSI JARINGAN*\n\n`;
      const inspeksiData = inspeksiList.slice(0, 5);
      if (inspeksiData.length > 0) {
        inspeksiData.forEach((i, idx) => {
          body += `${idx + 1}. *${i.tiangOrGarduId}* (${i.tipe})\n`;
          body += `   • Penyulang: ${i.namaPenyulang}\n`;
          body += `   • Temuan: ${i.temuan}\n`;
        });
      } else {
        body += `Tidak ada temuan inspeksi.\n`;
      }
    } else {
      body += `🌐 *AKSES APLIKASI KEANDALAN 20KV*\n\n`;
      body += `Silakan buka aplikasi Perang Padam Baguala untuk pemantauan realtime, peta GIS, dan input data keandalan jaringan.\n`;
    }

    if (customNotes.trim()) {
      body += `\n📝 *Catatan Tambahan:*\n${customNotes.trim()}\n`;
    }

    let footer = `\n----------------------------------------\n`;
    footer += `🔗 *Buka Aplikasi:* ${appUrl}`;

    return header + body + footer;
  }, [selectedReportType, user, totalKaliTripHariIni, gangguanHariIni, penyulangList, saidiData, jadwalPiket, perintahKerja, customNotes, appUrl]);

  // Open WhatsApp Web
  const handleOpenWhatsAppWeb = () => {
    // web.whatsapp.com/send directly opens WhatsApp Web on Desktop
    // If mobile, it seamlessly routes to WhatsApp App / WA Web
    const encodedText = encodeURIComponent(formattedReportText);
    const waWebUrl = `https://web.whatsapp.com/send?text=${encodedText}`;
    
    // Fallback URL for mobile or backup
    const waMobileUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

    // Try web.whatsapp.com first
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const targetUrl = isMobile ? waMobileUrl : waWebUrl;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Open Telegram Share
  const handleOpenTelegramShare = () => {
    const encodedText = encodeURIComponent(formattedReportText);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodedText}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-800 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] border-2 border-teal-500/60 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 text-xs font-extrabold backdrop-blur-xs">
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span>PUSAT SHARE LAPORAN LINTAS PLATFORM</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-xs">
            Share Laporan (WhatsApp Web & Telegram App)
          </h1>
          <p className="text-xs md:text-sm text-teal-100 max-w-2xl leading-relaxed">
            Kirim ringkasan laporan keandalan 20kV secara instant ke Grup WhatsApp Web maupun Chat / Channel Telegram dengan format otomatis yang rapi dan profesional.
          </p>
        </div>

        {/* Telegram WebApp Badge */}
        <div className="z-10 bg-[#011e1a]/80 backdrop-blur-md border border-teal-500/40 p-3.5 rounded-2xl flex items-center gap-3 shrink-0 shadow-lg">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-md">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-teal-300 block">Status Akses Aplikasi</span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTelegramWebApp ? 'bg-emerald-400 animate-pulse' : 'bg-teal-300'}`} />
              {isTelegramWebApp ? `Telegram WebApp (${telegramUser?.first_name || 'Active'})` : 'Web Browser Active'}
            </span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Selection & Controls + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report Type Selector & Action Buttons */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 1: Select Report Type */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-blue-600" />
              1. Pilih Kategori Laporan
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedReportType('gangguan')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'gangguan'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'gangguan' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Ringkasan Gangguan Trip Feeder</div>
                    <div className="text-[10px] text-slate-500">Data rekap trip harian, arus, & indikasi</div>
                  </div>
                </div>
                {selectedReportType === 'gangguan' && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('saidi')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'saidi'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'saidi' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Kinerja SAIDI & SAIFI</div>
                    <div className="text-[10px] text-slate-500">Target & realisasi menit padam bulanan</div>
                  </div>
                </div>
                {selectedReportType === 'saidi' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('piket')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'piket'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'piket' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Jadwal Piket Petugas Yantek</div>
                    <div className="text-[10px] text-slate-500">Daftar regu piket siaga 24 jam</div>
                  </div>
                </div>
                {selectedReportType === 'piket' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('spk')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'spk'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'spk' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Perintah Kerja Harian (SPK)</div>
                    <div className="text-[10px] text-slate-500">Pekerjaan pemeliharaan aktif</div>
                  </div>
                </div>
                {selectedReportType === 'spk' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('sistem')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'sistem'
                    ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'sistem' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Tautan Akses Aplikasi Web</div>
                    <div className="text-[10px] text-slate-500">Undangan buka aplikasi keandalan</div>
                  </div>
                </div>
                {selectedReportType === 'sistem' && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('material')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'material'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'material' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Stok Material Gudang</div>
                    <div className="text-[10px] text-slate-500">Rekap stok material unit</div>
                  </div>
                </div>
                {selectedReportType === 'material' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>

              <button
                onClick={() => setSelectedReportType('inspeksi')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedReportType === 'inspeksi'
                    ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedReportType === 'inspeksi' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Temuan Inspeksi Jaringan</div>
                    <div className="text-[10px] text-slate-500">Data inspeksi GTT, JTM, dll</div>
                  </div>
                </div>
                {selectedReportType === 'inspeksi' && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Custom Note input */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-extrabold text-slate-800 block">
              Catatan Tambahan (Opsional):
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Tambahkan pesan instruksi atau catatan lapangan khusus di sini..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Section 2: PowerPoint Export Button with Live Preview & Drag Editor */}
          <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950 rounded-2xl p-5 border border-sky-500/30 shadow-lg text-white space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Presentation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    2. Eksport Laporan ke PPT Presentation
                  </h3>
                  <span className="text-[10px] text-sky-200">
                    Template Danantara & PLN dengan Editor Posisi
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                Fitur Baru
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ekspor grafik, data kpi, dan rekap laporan ke file Microsoft PowerPoint (<strong className="text-sky-300">.pptx</strong>) menggunakan latar belakang resmi Danantara & PLN. Anda dapat <strong className="text-amber-300">melihat pratinjau dan menggeser posisi elemen</strong> sebelum diunduh.
            </p>

            <button
              onClick={() => setIsPptModalOpen(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:from-sky-600 active:to-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-sky-300/40"
            >
              <Presentation className="w-4 h-4 text-white shrink-0" />
              <span>Buka Pratinjau & Editor Posisi PPT (.pptx)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 ml-auto" />
            </button>
          </div>

          {/* Action Buttons for WhatsApp Web and Telegram */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Share2 className="w-4 h-4 text-emerald-600" />
              3. Eksekusi Pengiriman Chat Laporan
            </h3>

            {/* WhatsApp Web Button */}
            <button
              onClick={handleOpenWhatsAppWeb}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-400/40"
            >
              <MessageCircle className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
              <span>Buka & Kirim via WhatsApp Web</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-200 ml-auto" />
            </button>
            <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
              *Akan membuka WhatsApp Web secara langsung. Anda dapat memilih grup (misal: Group Keandalan / Yantek Baguala) atau kontak tujuan dengan 1x klik.
            </p>

            {/* Telegram Share Button */}
            <button
              onClick={handleOpenTelegramShare}
              className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-sky-300/40"
            >
              <Send className="w-5 h-5 text-white shrink-0" />
              <span>Bagikan ke Chat / Grup Telegram</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-100 ml-auto" />
            </button>

            {/* Copy Text Button */}
            <button
              onClick={handleCopyText}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Teks Laporan Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Salin Teks Laporan ke Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Message Preview */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-800 shadow-xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Pratinjau Format Pesan Laporan
                  </h3>
                  <span className="text-[10px] text-slate-400">Siap kirim ke WhatsApp Web / Telegram</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                Auto Format Active
              </span>
            </div>

            {/* Message Box Styled like WhatsApp / Chat */}
            <div className="bg-slate-950 p-4 md:p-5 rounded-2xl border border-slate-800/80 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto select-text selection:bg-blue-600 selection:text-white">
              {formattedReportText}
            </div>

            {/* Instructions Footer */}
            <div className="p-3.5 bg-blue-950/40 rounded-2xl border border-blue-800/40 text-[11px] text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-blue-300">Tips Integrasi WhatsApp Web:</strong> Tombol WhatsApp di atas akan mengarahkan pesan langsung ke aplikasi WhatsApp Web Anda. Semua format cetak tebal (<strong>*teks*</strong>) dan baris baru akan dipertahankan dengan sempurna.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PPT EXPORT PREVIEW & EDITOR MODAL */}
      <PptExportModal
        isOpen={isPptModalOpen}
        onClose={() => setIsPptModalOpen(false)}
        exportData={pptExportData}
      />
    </div>
  );
};
