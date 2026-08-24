import React, { useState } from 'react';
import {
  Zap,
  Printer,
  Download,
  Share2,
  MapPin,
  CheckCircle2,
  Building,
  UserCheck,
  Activity,
  Calendar,
  Phone,
  FileText,
  Compass,
  Check,
  Loader2,
  Gauge,
  Navigation
} from 'lucide-react';
import { SurveyPbPdItem } from '../../types';
import { exportElementToA4Pdf, generateLivePaperPdf } from '../../utils/exportLivePaperPdf';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';
import { PLN_LOGO_BASE64 } from '../../utils/plnLogo';
import { getUnitDetails } from '../../utils/unitConfig';

interface LivePaperPbPdDocumentProps {
  data: Partial<SurveyPbPdItem>;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onShareWhatsapp?: () => void;
  onClose?: () => void;
  showHeaderActions?: boolean;
  isInteractiveApproval?: boolean;
  currentUserRole?: string;
  currentUserName?: string;
  onApprove?: (teamLeaderName: string, signatureUrl?: string) => void;
}

/**
 * Compact high-fidelity vector schematic map component for Live Paper BA Survey
 * Renders cleanly in HTML, Print, and PDF export without external tile failures.
 */
const DocumentLocationMap: React.FC<{
  lat?: number;
  lng?: number;
  titikLat?: number;
  titikLng?: number;
  namaPelanggan?: string;
  titikNama?: string;
  panjangSr?: number;
}> = ({
  lat = -3.6375,
  lng = 128.2435,
  titikLat = -3.6376,
  titikLng = 128.2433,
  namaPelanggan = 'Bangunan Pelanggan',
  titikNama = 'Tiang TR',
  panjangSr = 15
}) => {
  const hasCoords = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const hasTitikCoords = titikLat !== undefined && titikLng !== undefined && !isNaN(Number(titikLat)) && !isNaN(Number(titikLng));

  return (
    <div className="w-full h-full bg-slate-900 rounded border border-slate-300 relative overflow-hidden flex flex-col justify-between p-1.5 select-none">
      {/* SVG Map Grid & Route Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="surveyGridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#334155" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#0f172a" />
        <rect width="100%" height="100%" fill="url(#surveyGridPattern)" />
        
        {/* Road vector paths */}
        <path d="M 0 35 Q 60 45, 120 25 T 240 40" fill="none" stroke="#1e293b" strokeWidth="12" />
        <path d="M 0 35 Q 60 45, 120 25 T 240 40" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
        <path d="M 80 0 L 75 100" fill="none" stroke="#1e293b" strokeWidth="8" />

        {/* SR Connection Line */}
        <line x1="28%" y1="65%" x2="72%" y2="35%" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
      </svg>

      {/* Top Map Header */}
      <div className="relative z-10 flex items-center justify-between text-[8px] text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/60 font-sans">
        <span className="font-bold flex items-center gap-1 text-amber-400">
          <Navigation className="w-2.5 h-2.5 text-amber-400 rotate-45" />
          <span>PETA LOKASI & SR</span>
        </span>
        <span className="font-mono text-[7px] text-slate-400">
          {hasCoords ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'GPS Baguala'}
        </span>
      </div>

      {/* Markers Container */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-2 py-1">
        {/* Titik Sambung / Tiang Marker */}
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-[9px] shadow-md border border-cyan-300">
            ⚡
          </div>
          <span className="text-[7.5px] font-bold text-cyan-300 bg-slate-950/90 px-1 py-0.2 rounded mt-0.5 max-w-[70px] truncate text-center">
            {titikNama.slice(0, 12)}
          </span>
        </div>

        {/* Distance Badge */}
        <div className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[7.5px] font-black font-mono shadow border border-amber-300">
          {panjangSr}m SR
        </div>

        {/* Bangunan Marker */}
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-[9px] shadow-md border border-rose-300">
            🏠
          </div>
          <span className="text-[7.5px] font-bold text-rose-300 bg-slate-950/90 px-1 py-0.2 rounded mt-0.5 max-w-[70px] truncate text-center">
            Pelanggan
          </span>
        </div>
      </div>

      {/* Bottom Coordinates Footer */}
      <div className="relative z-10 text-[7px] font-mono text-slate-300 bg-slate-950/80 px-1 py-0.5 rounded border border-slate-700/60 flex justify-between">
        <span>Tiang: {hasTitikCoords ? `${Number(titikLat).toFixed(4)},${Number(titikLng).toFixed(4)}` : '-'}</span>
        <span className="text-amber-400 font-bold">Ambon Baguala</span>
      </div>
    </div>
  );
};

export const LivePaperPbPdDocument: React.FC<LivePaperPbPdDocumentProps> = ({
  data,
  onPrint,
  onDownloadPdf,
  onShareWhatsapp,
  onClose,
  showHeaderActions = true,
  isInteractiveApproval = false,
  currentUserRole,
  currentUserName,
  onApprove
}) => {
  const unitInfo = getUnitDetails(data.unit || 'ULP Baguala');
  const [isExporting, setIsExporting] = useState(false);
  const [interactiveTlSignature, setInteractiveTlSignature] = useState<string | null>(null);

  const handleInternalDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      if (onDownloadPdf) {
        await onDownloadPdf();
      } else {
        const el = document.getElementById('live-paper-print-area');
        if (el) {
          const sanitizeName = (data.namaPelanggan || 'Pelanggan').replace(/[^a-zA-Z0-9_-]/g, '_');
          const noAgenda = data.noAgenda || data.id || 'Draft';
          await exportElementToA4Pdf(el, `Berita_Acara_Survey_PBPD_${sanitizeName}_${noAgenda}.pdf`, data);
        } else {
          await generateLivePaperPdf(data);
        }
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const tegPangkal = Number(data.tegPangkal) || 0;
  const tegTetangga = Number(data.tegTetangga) || 0;
  const dropVolt = Math.max(0, tegPangkal - tegTetangga);
  const dropPct = tegPangkal > 0 ? (dropVolt / tegPangkal) * 100 : 0;

  let dropStatusText = 'Normal (< 5%)';
  let dropStatusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  if (dropPct >= 10) {
    dropStatusText = 'Kritis (≥ 10%) - Tidak Layak';
    dropStatusColor = 'text-rose-700 bg-rose-50 border-rose-300';
  } else if (dropPct >= 5) {
    dropStatusText = 'Waspada (5% - 9.9%)';
    dropStatusColor = 'text-amber-700 bg-amber-50 border-amber-300';
  }

  const isPb = (data.jenisTransaksi || 'Pasang Baru (PB)').includes('PB');
  const fotoBangunanUrl = data.fotoBangunan || data.fotoLokasi || '';
  const fotoSambungUrl = data.fotoTitikSambung || '';
  const fotoUkurUrl = data.fotoPengukuranTegangan || '';

  // Clean jenis kabel from any 'TIC' prefix
  const rawKabel = data.jenisKabelSr || '2x10 mm²';
  const cleanKabel = rawKabel.replace(/^TIC\s*/i, '').trim() || '2x10 mm²';

  const docNo = `BA-SRV/${(data.penyulang || 'PASSO').toUpperCase()}/${data.noGardu || 'BG-01'}/${(data.noAgenda || (data.tanggalSurvey ? data.tanggalSurvey.replace(/-/g, '') : '5426001'))}`;

  return (
    <div className="printable-document bg-white text-slate-900 w-full flex flex-col font-sans shadow-sm">
      {/* Top Action Bar (Hidden during Print) */}
      {showHeaderActions && (
        <div className="sticky top-0 bg-slate-900 text-white p-3 sm:px-6 flex items-center justify-between z-20 border-b border-slate-800 print:hidden font-sans shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Berita Acara Survey Kelayakan PB/PD (1 Halaman)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {data.noAgenda || 'DRAFT'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Format resmi PLN 1 Halaman A4 presisi siap cetak & ekspor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold transition-all border border-slate-700 shadow-sm cursor-pointer"
                title="Cetak Langsung (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print BA</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleInternalDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Unduh PDF 1 Halaman"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {onShareWhatsapp && (
              <button
                type="button"
                onClick={onShareWhatsapp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Bagikan via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share WA</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                title="Tutup"
              >
                <span className="text-sm font-bold">&times;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXACT 1-PAGE A4 PAPER BODY */}
      <div
        id="live-paper-print-area"
        className="p-4 sm:p-6 space-y-2.5 max-w-[210mm] mx-auto w-full bg-white text-slate-900 text-[10px] leading-tight select-text"
        style={{
          minHeight: '290mm',
          maxHeight: '297mm',
          boxSizing: 'border-box'
        }}
      >
        
        {/* KOP SURAT RESMI PT PLN (PERSERO) DENGAN LOGO RESMI PERSIS SPK */}
        <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={PLN_LOGO_BASE64}
              alt="Logo PLN"
              className="w-12 h-14 object-contain shrink-0"
            />
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 leading-tight">
                PT PLN (PERSERO)
              </h1>
              <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
                {unitInfo.uiw} — {unitInfo.up3}
              </p>
              <p className="text-[9.5px] text-slate-600 leading-tight">
                UNIT LAYANAN PELANGGAN ({unitInfo.namaUnit.toUpperCase()})
              </p>
            </div>
          </div>
          <div className="text-right text-[8.5px] text-slate-500 space-y-0.5 shrink-0 border-l border-slate-300 pl-3">
            <div className="font-mono font-bold text-slate-900">FORM-SURVEY-PBPD/2026</div>
            <div>Edisi: Rev 02.1 / {unitInfo.singkatan}</div>
            <div className="text-emerald-700 font-bold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Tervalidasi Sistem
            </div>
          </div>
        </div>

        {/* TITLE DOKUMEN & NOMOR */}
        <div className="text-center py-1 bg-slate-50 border-y border-slate-200">
          <h2 className="text-xs sm:text-[13px] font-black text-slate-900 uppercase tracking-wide">
            BERITA ACARA SURVEY KELAYAKAN TEKNIS SAMBUNGAN LISTRIK (PB / PD)
          </h2>
          <div className="text-[9.5px] font-mono font-bold text-slate-700 mt-0.5">
            Nomor Dokumen: <span className="text-slate-950 font-extrabold">{docNo}</span>
          </div>
        </div>

        {/* BAGIAN I & II: 2-KOLOM DATA TEKNIS LENGKAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          
          {/* KOLOM KIRI: I. IDENTITAS PERMOHONAN & CALON PELANGGAN */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-100 px-2.5 py-1 font-bold text-slate-900 border-b border-slate-300 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 uppercase tracking-wide text-amber-900">
                <UserCheck className="w-3 h-3 text-amber-700" />
                I. IDENTITAS PERMOHONAN & PELANGGAN
              </span>
              <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-amber-500/20 text-amber-900 border border-amber-500/30">
                {data.jenisTransaksi || 'Pasang Baru (PB)'}
              </span>
            </div>

            <div className="p-2 space-y-1 bg-white text-[9.5px]">
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Nama Pelanggan:</span>
                <span className="font-bold text-slate-950">{data.namaPelanggan || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">No. Agenda / Registrasi:</span>
                <span className="font-mono font-bold text-slate-900">{data.noAgenda || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">ID Pelanggan / No. Meter:</span>
                <span className="font-mono font-bold text-slate-800">{data.idPelanggan || '- (PB)'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">No. HP / WhatsApp:</span>
                <span className="font-mono font-semibold text-slate-800">{data.noHpPelanggan || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Peruntukan:</span>
                <span className="font-bold text-slate-800">{data.peruntukan || 'Rumah Tangga'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Tarif & Daya Baru:</span>
                <span className="font-black text-emerald-800">
                  {data.tarifBaru || 'R1/1300 VA'} ({data.dayaBaruVa || 1300} VA)
                </span>
              </div>
              {!isPb && (
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-medium">Tarif & Daya Lama:</span>
                  <span className="font-bold text-slate-700">
                    {data.tarifLama || '-'} ({data.dayaLamaVa || '-'} VA)
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Lokasi / Alamat:</span>
                <span className="font-medium text-slate-900 text-right truncate max-w-[170px]" title={data.lokasi}>
                  {data.lokasi || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Koordinat GPS:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {data.lat !== undefined && data.lng !== undefined
                    ? `${Number(data.lat).toFixed(5)}, ${Number(data.lng).toFixed(5)}`
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: II. JARINGAN & PENGUKURAN TEGANGAN */}
          <div className="border border-slate-300 rounded overflow-hidden flex flex-col justify-between">
            <div className="bg-slate-100 px-2.5 py-1 font-bold text-slate-900 border-b border-slate-300 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 uppercase tracking-wide text-cyan-900">
                <Activity className="w-3 h-3 text-cyan-700" />
                II. JARINGAN & PENGUKURAN TEGANGAN
              </span>
              <span className="text-[8.5px] text-slate-600 font-semibold">20kV / 380V / 220V</span>
            </div>

            <div className="p-2 space-y-1 bg-white text-[9.5px]">
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Penyulang (Feeder):</span>
                <span className="font-bold text-slate-900">{data.penyulang || 'PASSO'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Gardu & Jurusan:</span>
                <span className="font-bold text-slate-900">{data.noGardu || 'BG-01'} ({data.jurusanGardu || 'Jurusan 1'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Fasa Tersambung:</span>
                <span className="font-bold text-indigo-900">{data.fasaYangDiambil || '1 Fasa (Fasa R)'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Titik Sambung:</span>
                <span className="font-bold text-slate-900">{data.titikSambung || 'Tiang TR No. 01'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Panjang & Kabel SR:</span>
                <span className="font-bold text-slate-900">
                  {data.panjangSrMeter || 15} Meter — <span className="font-mono text-emerald-800">{cleanKabel}</span>
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600 font-medium">Koordinat Tiang TR:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {data.titikSambungLat !== undefined && data.titikSambungLng !== undefined
                    ? `${Number(data.titikSambungLat).toFixed(5)}, ${Number(data.titikSambungLng).toFixed(5)}`
                    : '-'}
                </span>
              </div>

              {/* Box Pengukuran Tegangan & Drop Ringkas */}
              <div className="pt-1 grid grid-cols-3 gap-1 text-center">
                <div className="p-1 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Teg. Pangkal</span>
                  <span className="font-black text-emerald-700 font-mono text-[10.5px]">{tegPangkal} V</span>
                </div>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Teg. Ujung</span>
                  <span className="font-black text-sky-700 font-mono text-[10.5px]">{tegTetangga} V</span>
                </div>
                <div className={`p-1 border rounded ${dropStatusColor}`}>
                  <span className="text-[8px] block uppercase font-bold">Drop (ΔV)</span>
                  <span className="font-black font-mono text-[10.5px]">
                    {dropVolt}V ({dropPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN III: KESIMPULAN HASIL SURVEY & REKOMENDASI TEKNIS */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-slate-100 px-2.5 py-1 font-bold text-slate-900 border-b border-slate-300 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 uppercase tracking-wide text-emerald-900">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              III. KESIMPULAN HASIL SURVEY & REKOMENDASI TEKNIS
            </span>
            <span className="text-[9px] font-bold text-slate-700">
              Tgl Survey: {data.tanggalSurvey || new Date().toISOString().split('T')[0]}
            </span>
          </div>

          <div className="p-2 space-y-1.5 bg-white text-[9.5px]">
            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold uppercase text-[9px]">Status Kelayakan:</span>
                <span className="font-black text-emerald-800 uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded text-[9.5px]">
                  {data.statusKelayakan || 'Layak Sambung'}
                </span>
              </div>
              {data.tanggalPenyambungan && (
                <div className="text-right">
                  <span className="text-slate-500 text-[8.5px] mr-1">Target Penyambungan:</span>
                  <span className="font-bold text-slate-800">{data.tanggalPenyambungan}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-600 font-bold shrink-0 text-[9px] mt-0.5">Rekomendasi:</span>
              <p className="text-slate-800 italic leading-snug">
                {data.rekomendasiTeknis || 'Memenuhi syarat teknis kelistrikan PLN. Sambungan dapat dieksekusi sesuai standard SPLN tanpa mengganggu mutu tegangan pelanggan sekitar.'}
              </p>
            </div>

            {data.catatan && (
              <div className="flex items-start gap-2 pt-0.5 border-t border-slate-100">
                <span className="text-slate-600 font-bold shrink-0 text-[9px]">Catatan:</span>
                <p className="text-slate-700 leading-snug">{data.catatan}</p>
              </div>
            )}
          </div>
        </div>

        {/* BAGIAN IV: DOKUMENTASI VISUAL LAPANGAN & PETA LOKASI (4 KOTAK SEJAJAR) */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-slate-100 px-2.5 py-1 font-bold text-slate-900 border-b border-slate-300 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 uppercase tracking-wide text-slate-900">
              <FileText className="w-3 h-3 text-slate-700" />
              IV. DOKUMENTASI VISUAL LAPANGAN & PETA LOKASI
            </span>
            <span className="text-[8.5px] text-slate-500">Lampiran Visual Lengkap</span>
          </div>

          <div className="p-2 grid grid-cols-4 gap-2 bg-white">
            {/* 1. Peta Lokasi & SR */}
            <div className="border border-slate-200 rounded p-1 bg-slate-50 flex flex-col justify-between h-[92px]">
              <div className="text-[8px] font-bold text-slate-700 text-center uppercase tracking-wide mb-0.5">
                1. Peta Lokasi & SR
              </div>
              <div className="flex-1 w-full rounded overflow-hidden">
                <DocumentLocationMap
                  lat={data.lat}
                  lng={data.lng}
                  titikLat={data.titikSambungLat}
                  titikLng={data.titikSambungLng}
                  namaPelanggan={data.namaPelanggan}
                  titikNama={data.titikSambung}
                  panjangSr={data.panjangSrMeter || 15}
                />
              </div>
            </div>

            {/* 2. Foto Bangunan */}
            <div className="border border-slate-200 rounded p-1 bg-slate-50 flex flex-col justify-between h-[92px]">
              <div className="text-[8px] font-bold text-slate-700 text-center uppercase tracking-wide mb-0.5 truncate">
                2. Bangunan / Rumah
              </div>
              <div className="flex-1 w-full bg-slate-200 rounded border border-slate-300 overflow-hidden flex items-center justify-center">
                {fotoBangunanUrl ? (
                  <img
                    src={fotoBangunanUrl}
                    alt="Foto Bangunan"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-1 text-[8px] italic">
                    Belum ada foto
                  </div>
                )}
              </div>
            </div>

            {/* 3. Foto Titik Sambung */}
            <div className="border border-slate-200 rounded p-1 bg-slate-50 flex flex-col justify-between h-[92px]">
              <div className="text-[8px] font-bold text-slate-700 text-center uppercase tracking-wide mb-0.5 truncate">
                3. Titik Sambung / Tiang
              </div>
              <div className="flex-1 w-full bg-slate-200 rounded border border-slate-300 overflow-hidden flex items-center justify-center">
                {fotoSambungUrl ? (
                  <img
                    src={fotoSambungUrl}
                    alt="Foto Titik Sambung"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-1 text-[8px] italic">
                    Belum ada foto
                  </div>
                )}
              </div>
            </div>

            {/* 4. Foto Pengukuran Tegangan */}
            <div className="border border-slate-200 rounded p-1 bg-slate-50 flex flex-col justify-between h-[92px]">
              <div className="text-[8px] font-bold text-slate-700 text-center uppercase tracking-wide mb-0.5 truncate">
                4. Foto Tegangan
              </div>
              <div className="flex-1 w-full bg-slate-200 rounded border border-slate-300 overflow-hidden flex items-center justify-center">
                {fotoUkurUrl ? (
                  <img
                    src={fotoUkurUrl}
                    alt="Foto Pengukuran Tegangan"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="text-center text-slate-500 p-1 text-[8px] font-mono font-bold">
                    {tegTetangga > 0 ? `${tegTetangga} Volt` : 'Belum dilampirkan'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN V: PENGESAHAN & TANDA TANGAN RESMI (2 KOLOM RAPI TANPA NIP & TANPA TIM TEKNIK) */}
        <div className="pt-1 font-sans">
          <p className="text-[9px] text-slate-600 italic mb-2 text-center">
            Demikian Berita Acara Survey Kelayakan Teknis ini dibuat dengan sebenar-benarnya sebagai dasar penerbitan Surat Perintah Kerja (SPK) Penyambungan.
          </p>

          <div className="grid grid-cols-2 gap-6 text-center text-[10px]">
            {/* Kolom Kiri: TL Teknik ULP Baguala (NIP Dihapus Sesuai Request User) */}
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200 pr-3">
              <div>
                <p className="text-slate-600 text-[9px]">Mengetahui / Menyetujui,</p>
                <strong className="text-slate-900 block font-bold text-[10px]">{unitInfo.tlTeknikTitle}</strong>
              </div>

              {/* Tanda Tangan Digital TL Teknik */}
              <div className="my-1 flex items-center justify-center min-h-[38px]">
                {data.tandaTanganTlTeknik ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={data.tandaTanganTlTeknik}
                      alt="Tanda Tangan TL Teknik"
                      className="h-9 max-w-[130px] object-contain"
                    />
                    <div className="text-[7px] font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>DISETUJUI DIGITAL</span>
                    </div>
                  </div>
                ) : data.isApproved || data.teamLeaderName || data.statusKelayakan === 'Layak Sambung' ? (
                  <div className="border border-emerald-600/70 bg-emerald-50 rounded p-1 px-2 flex items-center gap-1.5 text-left shadow-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <div className="text-[7.5px] font-black text-emerald-900 uppercase">
                        Disetujui Digital
                      </div>
                      <div className="text-[6.5px] text-emerald-700 font-mono">
                        {data.tanggalSurvey || new Date().toISOString().split('T')[0]}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-8 flex items-center justify-center text-[9px] text-slate-400 italic">
                    (Menunggu Persetujuan Digital)
                  </div>
                )}
              </div>

              <div>
                <strong className="block text-slate-900 underline font-bold text-[10px]">
                  {data.teamLeaderName || 'M Ricky Sabari'}
                </strong>
              </div>
            </div>

            {/* Kolom Kanan: Surveyor Teknik Lapangan (Hapus Tim Teknik & Hapus Row di Bawah Nama) */}
            <div className="flex flex-col justify-between min-h-[90px] pl-3">
              <div>
                <p className="text-slate-600 text-[9px]">Ambon, {data.tanggalSurvey || new Date().toISOString().split('T')[0]}</p>
                <strong className="text-slate-900 block font-bold text-[10px]">Surveyor Teknik Lapangan</strong>
              </div>

              {/* Tanda Tangan Digital Surveyor */}
              <div className="my-1 flex items-center justify-center min-h-[38px]">
                {data.tandaTanganSurveyor ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={data.tandaTanganSurveyor}
                      alt="Tanda Tangan Surveyor"
                      className="h-9 max-w-[130px] object-contain"
                    />
                    <div className="text-[7px] font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>TERTANDATANGANI DIGITAL</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[8.5px] font-medium text-slate-400 italic">
                    (Tanda Tangan Digital Surveyor)
                  </div>
                )}
              </div>

              <div>
                <strong className="block text-slate-900 underline font-bold text-[10px]">
                  {data.petugasSurvey || 'Petugas Surveyor'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* APPROVAL DIGITAL BLOCK (Khusus Mode Interaktif Team Leader di UI) */}
        {isInteractiveApproval && currentUserRole === 'Team Leader' && (
          <div className="mt-2 pt-2 border-t border-slate-200 bg-amber-50/60 p-3 rounded-lg font-sans print:hidden space-y-2">
            <h4 className="font-bold text-amber-900 text-[10px] uppercase text-center">
              Pengesahan & Approval Digital (Team Leader)
            </h4>
            
            <div className="max-w-md mx-auto space-y-2">
              <input
                type="text"
                defaultValue={data.teamLeaderName || currentUserName || 'M Ricky Sabari'}
                id="tlNameApprovalInput"
                className="w-full px-2.5 py-1.5 border border-amber-300 rounded text-[10px] bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Nama Lengkap Team Leader"
              />

              {/* Digital Signature Pad for Team Leader */}
              <DigitalSignaturePad
                value={interactiveTlSignature || data.tandaTanganTlTeknik}
                onChange={(sig) => setInteractiveTlSignature(sig)}
                signerName={data.teamLeaderName || currentUserName || unitInfo.tlTeknikTitle}
                signerTitle={unitInfo.tlTeknikTitle}
                penColor="#0f2b5c"
                height={80}
                placeholderText={`Goreskan tanda tangan ${unitInfo.tlTeknikTitle} di sini sebelum menyetujui`}
              />

              <button
                type="button"
                onClick={() => {
                  const inputEl = document.getElementById('tlNameApprovalInput') as HTMLInputElement;
                  const nameVal = inputEl?.value || data.teamLeaderName || 'M Ricky Sabari';
                  if (onApprove) onApprove(nameVal, interactiveTlSignature || data.tandaTanganTlTeknik || undefined);
                }}
                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Validasi & Setujui Berita Acara</span>
              </button>
            </div>
          </div>
        )}

        {/* FOOTER VERIFIKASI RESMI */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-sans">
          <span>PT PLN (Persero) {unitInfo.namaUnit} — Sistem Informasi Perang Padam (SIPP)</span>
          <span>Dokumen Sah & Tervalidasi Sistem Elektronik</span>
        </div>

      </div>
    </div>
  );
};
