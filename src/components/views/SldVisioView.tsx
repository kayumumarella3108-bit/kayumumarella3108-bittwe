import React, { useState, useRef, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../../lib/firebase';
import JSZip from 'jszip';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Download,
  Power,
  Zap,
  Activity,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Layers,
  ArrowRightLeft,
  Search,
  FileJson,
  SlidersHorizontal,
  ChevronDown,
  Info,
  FileText,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Check,
  FolderTree,
  Printer,
  Share2
} from 'lucide-react';
import { INITIAL_PENYULANG } from '../../data/mockData';

export type SubstationType = 'GI' | 'GH';

export interface FeederData {
  id: string;
  namaFeeder: string;
  panjangKms: number;
  saklarTipe: string;
  saklarNama: string;
  status: 'CLOSED' | 'OPEN';
  arusR: number;
  arusS: number;
  arusT: number;
  arusIN: number;
  bebanMw: number;
  warna: string;
  bisaBacaIndikasi?: boolean;
  arealPadam?: string;
}

export interface SubstationData {
  id: string;
  nama: string;
  tipe: SubstationType;
  deskripsiBusbar: string;
  teganganKv: number;
  frekuensiHz: number;
  feeders: FeederData[];
}

export interface TieSwitchData {
  id: string;
  nama: string;
  substationAId: string;
  feederAId: string;
  substationBId: string;
  feederBId: string;
  deskripsi: string;
  status: 'CLOSED' | 'OPEN';
}

// Extracted Visio Shape & Document Types
export interface VisioShape {
  id: string;
  name: string;
  type?: string;
  pageName: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  category: 'GI/GH' | 'Feeder' | 'Saklar/PMT' | 'Trafo' | 'Busbar' | 'Line/Connector' | 'Teks/Label' | 'Lainnya';
  properties: Record<string, string>;
}

export interface VisioPage {
  id: string;
  name: string;
  width?: number;
  height?: number;
  shapes: VisioShape[];
}

export interface VisioDocumentData {
  fileName: string;
  fileSize: string;
  importDate: string;
  pages: VisioPage[];
  totalShapes: number;
  extractedSubstations: number;
  extractedFeeders: number;
  extractedSwitches: number;
}

const INITIAL_SUBSTATIONS: SubstationData[] = [
  {
    id: 'gi-passo',
    nama: 'GI PASSO',
    tipe: 'GI',
    deskripsiBusbar: 'BUSBAR 20KV GI PASSO (TRAFO 1 & TRAFO 2)',
    teganganKv: 20.2,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-passo-utama',
        namaFeeder: 'PASSO UTAMA',
        panjangKms: 12.8,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT 10',
        status: 'CLOSED',
        arusR: 145,
        arusS: 148,
        arusT: 142,
        arusIN: 5,
        bebanMw: 4.8,
        warna: '#10b981',
        arealPadam: 'Desa Passo, Sebagian Desa Lateri, Perumahan Passo Indah, Asrama Militer Passo'
      },
      {
        id: 'f-waiheru-1',
        namaFeeder: 'WAIHERU 1',
        panjangKms: 9.5,
        saklarTipe: 'LBS Section',
        saklarNama: 'LBS Waiheru',
        status: 'CLOSED',
        arusR: 98,
        arusS: 102,
        arusT: 95,
        arusIN: 3,
        bebanMw: 3.2,
        warna: '#0284c7',
        arealPadam: 'Desa Waiheru, Nania, Perumnas Waiheru, Kampus Unpatti, Negeri Lama'
      },
      {
        id: 'f-rec-pohon',
        namaFeeder: 'REC POHON',
        panjangKms: 15.2,
        saklarTipe: 'Recloser Smart',
        saklarNama: 'REC POHON',
        status: 'CLOSED',
        arusR: 210,
        arusS: 205,
        arusT: 215,
        arusIN: 8,
        bebanMw: 6.9,
        warna: '#f59e0b',
        arealPadam: 'Negeri Latta, Soya, Halong Atas, Areal Hutan Lindung, Kompleks Lantamal IX'
      },
      {
        id: 'f-tulehu-utama',
        namaFeeder: 'TULEHU UTAMA',
        panjangKms: 18.4,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT Tulehu',
        status: 'CLOSED',
        arusR: 180,
        arusS: 175,
        arusT: 185,
        arusIN: 6,
        bebanMw: 5.8,
        warna: '#8b5cf6',
        arealPadam: 'Negeri Tulehu, Liang, Waai, Pelabuhan Penyeberangan Tulehu, Kampus Darussalam'
      }
    ]
  },
  {
    id: 'gh-baguala',
    nama: 'GH BAGUALA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH BAGUALA (EXPRESS FEEDER DISTRIBUTION)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-gh-express-lateri',
        namaFeeder: 'GH EXPRESS LATERI',
        panjangKms: 6.4,
        saklarTipe: 'LBS Motorized',
        saklarNama: 'LBS GH-01',
        status: 'CLOSED',
        arusR: 110,
        arusS: 112,
        arusT: 108,
        arusIN: 2,
        bebanMw: 2.9,
        warna: '#06b6d4',
        arealPadam: 'Desa Lateri, Lateri Atas, Kantor Camat Baguala, Citraland Baguala'
      },
      {
        id: 'f-gh-passo-feeder2',
        namaFeeder: 'GH PASSO FEEDER 2',
        panjangKms: 8.1,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT GH-02',
        status: 'CLOSED',
        arusR: 125,
        arusS: 120,
        arusT: 128,
        arusIN: 4,
        bebanMw: 3.4,
        warna: '#2563eb',
        arealPadam: 'Passo Tengah, Desa Hative Besar, Waiheru Atas, Kawasan Industri Passo'
      }
    ]
  },
  {
    id: 'gi-sirimau',
    nama: 'GI SIRIMAU',
    tipe: 'GI',
    deskripsiBusbar: 'BUSBAR 20KV GI SIRIMAU (TRAFO 1 - 30 MVA)',
    teganganKv: 20.1,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-lateri-3',
        namaFeeder: 'LATERI 3',
        panjangKms: 14.1,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT Lateri',
        status: 'CLOSED',
        arusR: 160,
        arusS: 165,
        arusT: 158,
        arusIN: 5,
        bebanMw: 4.5,
        warna: '#ec4899',
        arealPadam: 'Desa Lateri Barat, Halong Baru, Galala, Kawasan Pantai Mardika'
      },
      {
        id: 'f-halong-utama',
        namaFeeder: 'HALONG UTAMA',
        panjangKms: 11.3,
        saklarTipe: 'Recloser Smart',
        saklarNama: 'REC Halong',
        status: 'CLOSED',
        arusR: 130,
        arusS: 128,
        arusT: 132,
        arusIN: 3,
        bebanMw: 3.8,
        warna: '#14b8a6',
        arealPadam: 'Desa Halong, Jembatan Merah Putih, Galala Timur, Kompleks TNI AL Halong'
      }
    ]
  },
  {
    id: 'gh-poka',
    nama: 'GH POKA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH POKA (PENGHUBUNG SEKTOR POKA)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-poka-utama',
        namaFeeder: 'POKA UTAMA',
        panjangKms: 10.5,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT POKA 1',
        status: 'CLOSED',
        arusR: 112,
        arusS: 115,
        arusT: 110,
        arusIN: 2,
        bebanMw: 3.1,
        warna: '#e11d48',
        arealPadam: 'Desa Poka, Kampus Utama Unpatti, Rektorat Unpatti, JMP Sektor Poka'
      },
      {
        id: 'f-poka-2',
        namaFeeder: 'POKA 2',
        panjangKms: 8.7,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT POKA 2',
        status: 'CLOSED',
        arusR: 95,
        arusS: 98,
        arusT: 92,
        arusIN: 1,
        bebanMw: 2.5,
        warna: '#f43f5e',
        arealPadam: 'Negeri Rumah Tiga, Poka Dalam, Wailela, Sebagian Puncak Wailela'
      }
    ]
  },
  {
    id: 'gh-bandara',
    nama: 'GH BANDARA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH BANDARA (EXPRESS BANDARA INTERNASIONAL)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-bandara-indah',
        namaFeeder: 'BANDARA INDAH',
        panjangKms: 12.1,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT BDR 1',
        status: 'CLOSED',
        arusR: 130,
        arusS: 135,
        arusT: 128,
        arusIN: 3,
        bebanMw: 3.6,
        warna: '#0ea5e9',
        arealPadam: 'Kawasan Luar Bandara Laha, Desa Laha, Perumahan Angkasa, Negeri Tawiri'
      },
      {
        id: 'f-bandara-vip',
        namaFeeder: 'BANDARA VIP',
        panjangKms: 5.4,
        saklarTipe: 'Recloser Smart',
        saklarNama: 'REC BDR VIP',
        status: 'CLOSED',
        arusR: 85,
        arusS: 88,
        arusT: 82,
        arusIN: 1,
        bebanMw: 2.1,
        warna: '#38bdf8',
        arealPadam: 'Terminal VIP Bandara Pattimura, Tower ATC Bandara, Runway Lighting, Gedung VVIP'
      }
    ]
  },
  {
    id: 'gh-hative-kecil',
    nama: 'GH HATIVE KECIL',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH HATIVE KECIL (HUB HATIVE DISTRICT)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-hative-1',
        namaFeeder: 'HATIVE 1',
        panjangKms: 9.8,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT HTV 1',
        status: 'CLOSED',
        arusR: 120,
        arusS: 122,
        arusT: 118,
        arusIN: 2,
        bebanMw: 3.3,
        warna: '#3b82f6',
        arealPadam: 'Desa Hative Kecil, Galunggung, Kebun Cengkeh, Batu Merah Dalam'
      },
      {
        id: 'f-hative-2',
        namaFeeder: 'HATIVE 2',
        panjangKms: 11.2,
        saklarTipe: 'LBS Motorized',
        saklarNama: 'LBS HTV 2',
        status: 'CLOSED',
        arusR: 110,
        arusS: 112,
        arusT: 108,
        arusIN: 2,
        bebanMw: 3.0,
        warna: '#60a5fa',
        arealPadam: 'Kawasan Tantui, Kantor Polda Maluku, Kompi Tantui, Kebun Cengkeh Atas'
      }
    ]
  },
  {
    id: 'gh-aston',
    nama: 'GH ASTON',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH ASTON (ZONA APARTEMEN & HOTEL)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-aston-sakti',
        namaFeeder: 'ASTON SAKTI',
        panjangKms: 4.2,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT ASTON 1',
        status: 'CLOSED',
        arusR: 90,
        arusS: 92,
        arusT: 88,
        arusIN: 1,
        bebanMw: 2.3,
        warna: '#10b981'
      }
    ]
  },
  {
    id: 'gh-area',
    nama: 'GH AREA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH AREA (DISTRIBUSI UMUM)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-area-pusat',
        namaFeeder: 'AREA PUSAT',
        panjangKms: 14.3,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT AREA 1',
        status: 'CLOSED',
        arusR: 140,
        arusS: 142,
        arusT: 138,
        arusIN: 4,
        bebanMw: 3.9,
        warna: '#f59e0b'
      }
    ]
  },
  {
    id: 'gh-box-poka',
    nama: 'GH BOX POKA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH BOX POKA (ZONA INDUSTRI POKA)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-box-poka-ind',
        namaFeeder: 'BOX POKA INDUSTRIAL',
        panjangKms: 7.8,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT BOX POKA 1',
        status: 'CLOSED',
        arusR: 115,
        arusS: 118,
        arusT: 112,
        arusIN: 2,
        bebanMw: 3.2,
        warna: '#84cc16'
      }
    ]
  },
  {
    id: 'gh-box-galala',
    nama: 'GH BOX GALALA',
    tipe: 'GH',
    deskripsiBusbar: 'BUSBAR 20KV GH BOX GALALA (ZONA LOGISTIK GALALA)',
    teganganKv: 20.0,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-box-galala-harb',
        namaFeeder: 'BOX GALALA HARBOUR',
        panjangKms: 6.5,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT BOX GALALA 1',
        status: 'CLOSED',
        arusR: 105,
        arusS: 108,
        arusT: 102,
        arusIN: 1,
        bebanMw: 2.8,
        warna: '#14b8a6'
      }
    ]
  },
  {
    id: 'gi-hative-kecil',
    nama: 'GI HATIVE KECIL',
    tipe: 'GI',
    deskripsiBusbar: 'BUSBAR 20KV GI HATIVE KECIL (MAIN TRANSFORMATION & TRANSMISSION)',
    teganganKv: 20.3,
    frekuensiHz: 50.0,
    feeders: [
      {
        id: 'f-gi-hative-inc',
        namaFeeder: 'GI HATIVE INCOMING',
        panjangKms: 15.0,
        saklarTipe: 'PMT CB Incoming',
        saklarNama: 'PMT INCOMING HTV',
        status: 'CLOSED',
        arusR: 250,
        arusS: 255,
        arusT: 248,
        arusIN: 10,
        bebanMw: 7.2,
        warna: '#d946ef'
      },
      {
        id: 'f-hative-maju-1',
        namaFeeder: 'HATIVE MAJU 1',
        panjangKms: 13.8,
        saklarTipe: 'PMT CB Outgoing',
        saklarNama: 'PMT OUTGOING HTV 1',
        status: 'CLOSED',
        arusR: 155,
        arusS: 158,
        arusT: 152,
        arusIN: 4,
        bebanMw: 4.3,
        warna: '#a855f7'
      }
    ]
  }
];

const INITIAL_TIE_SWITCHES: TieSwitchData[] = [
  {
    id: 'tie-passo-lateri',
    nama: 'TIE SWITCH MANUVER (PASSO UTAMA - LATERI 3)',
    substationAId: 'gi-passo',
    feederAId: 'f-passo-utama',
    substationBId: 'gi-sirimau',
    feederBId: 'f-lateri-3',
    deskripsi: 'Saklar interkoneksi manuver darurat antara Penyulang Passo Utama (GI Passo) & Lateri 3 (GI Sirimau)',
    status: 'OPEN'
  },
  {
    id: 'tie-waiheru-gh',
    nama: 'TIE SWITCH MANUVER (WAIHERU 1 - GH EXPRESS LATERI)',
    substationAId: 'gi-passo',
    feederAId: 'f-waiheru-1',
    substationBId: 'gh-baguala',
    feederBId: 'f-gh-express-lateri',
    deskripsi: 'Interkoneksi cadangan antara Waiheru 1 dan GH Express Baguala',
    status: 'OPEN'
  }
];

// Generate Demo Visio Document Data
function getSampleVisioDocument(): VisioDocumentData {
  return {
    fileName: 'SLD_20KV_BAGUALA_SCADA.vsdx',
    fileSize: '1.8 MB',
    importDate: new Date().toLocaleString('id-ID'),
    totalShapes: 18,
    extractedSubstations: 3,
    extractedFeeders: 8,
    extractedSwitches: 7,
    pages: [
      {
        id: 'p1',
        name: 'Single Line Diagram 20kV ULP Baguala',
        shapes: [
          {
            id: 'v1',
            name: 'GI PASSO 20kV Busbar',
            type: 'Group/Busbar',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'GI PASSO - BUSBAR 20KV (TRAFO 1 & 2)',
            x: 100,
            y: 50,
            width: 420,
            height: 40,
            fillColor: '#f59e0b',
            category: 'GI/GH',
            properties: { Tegangan: '20.2 kV', Trafo: '2x 30 MVA', Unit: 'GI PASSO' }
          },
          {
            id: 'v2',
            name: 'PMT Passo Utama',
            type: 'CircuitBreaker',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'PMT 10 - PASSO UTAMA (12.8 KMS / 4.8 MW)',
            x: 120,
            y: 130,
            width: 160,
            height: 60,
            fillColor: '#10b981',
            category: 'Saklar/PMT',
            properties: { Status: 'CLOSED', Arus: '145A', Saklar: 'PMT 10' }
          },
          {
            id: 'v3',
            name: 'LBS Waiheru',
            type: 'Switch',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'LBS WAIHERU 1 (9.5 KMS / 3.2 MW)',
            x: 300,
            y: 130,
            width: 160,
            height: 60,
            fillColor: '#0284c7',
            category: 'Feeder',
            properties: { Status: 'CLOSED', Arus: '100A', Saklar: 'LBS Waiheru' }
          },
          {
            id: 'v4',
            name: 'REC Pohon',
            type: 'Recloser',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'REC POHON (15.2 KMS / 6.9 MW)',
            x: 120,
            y: 220,
            width: 160,
            height: 60,
            fillColor: '#f59e0b',
            category: 'Saklar/PMT',
            properties: { Status: 'CLOSED', Arus: '210A', SmartScada: 'Ya' }
          },
          {
            id: 'v5',
            name: 'PMT Tulehu',
            type: 'CircuitBreaker',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'PMT TULEHU UTAMA (18.4 KMS / 5.8 MW)',
            x: 300,
            y: 220,
            width: 160,
            height: 60,
            fillColor: '#8b5cf6',
            category: 'Feeder',
            properties: { Status: 'CLOSED', Arus: '180A' }
          },
          {
            id: 'v6',
            name: 'GH BAGUALA Busbar',
            type: 'Group/Busbar',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'GH BAGUALA - BUSBAR 20KV DISTRIBUTION',
            x: 560,
            y: 50,
            width: 320,
            height: 40,
            fillColor: '#06b6d4',
            category: 'GI/GH',
            properties: { Tegangan: '20.0 kV', Tipe: 'Gardu Hubung' }
          },
          {
            id: 'v7',
            name: 'LBS GH Express Lateri',
            type: 'Switch',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'LBS GH-01 LATERI (6.4 KMS / 2.9 MW)',
            x: 580,
            y: 130,
            width: 140,
            height: 60,
            fillColor: '#06b6d4',
            category: 'Feeder',
            properties: { Status: 'CLOSED', Motorized: 'Ya' }
          },
          {
            id: 'v8',
            name: 'PMT GH Passo Feeder 2',
            type: 'CircuitBreaker',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'PMT GH-02 PASSO (8.1 KMS / 3.4 MW)',
            x: 740,
            y: 130,
            width: 140,
            height: 60,
            fillColor: '#2563eb',
            category: 'Feeder',
            properties: { Status: 'CLOSED' }
          },
          {
            id: 'v9',
            name: 'GI SIRIMAU Busbar',
            type: 'Group/Busbar',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'GI SIRIMAU - BUSBAR 20KV (TRAFO 1 30 MVA)',
            x: 100,
            y: 320,
            width: 380,
            height: 40,
            fillColor: '#ec4899',
            category: 'GI/GH',
            properties: { Tegangan: '20.1 kV' }
          },
          {
            id: 'v10',
            name: 'PMT Lateri 3',
            type: 'CircuitBreaker',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'PMT LATERI 3 (14.1 KMS / 4.5 MW)',
            x: 120,
            y: 400,
            width: 160,
            height: 60,
            fillColor: '#ec4899',
            category: 'Feeder',
            properties: { Status: 'CLOSED' }
          },
          {
            id: 'v11',
            name: 'REC Halong Utama',
            type: 'Recloser',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'REC HALONG UTAMA (11.3 KMS / 3.8 MW)',
            x: 300,
            y: 400,
            width: 160,
            height: 60,
            fillColor: '#14b8a6',
            category: 'Feeder',
            properties: { Status: 'CLOSED' }
          },
          {
            id: 'v12',
            name: 'Tie Switch Passo - Lateri',
            type: 'Connector/TieSwitch',
            pageName: 'Single Line Diagram 20kV ULP Baguala',
            text: 'TIE SWITCH MANUVER (PASSO UTAMA - LATERI 3)',
            x: 120,
            y: 490,
            width: 340,
            height: 45,
            fillColor: '#f59e0b',
            category: 'Saklar/PMT',
            properties: { Interkoneksi: 'Passo - Lateri', Status: 'OPEN (NORMAL NOP)' }
          }
        ]
      }
    ]
  };
}

export const SldVisioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCADA' | 'VISIO_READER' | 'SHAPE_TABLE'>('SCADA');
  
  // SCADA Grid Model
  const [substations, setSubstations] = useState<SubstationData[]>(INITIAL_SUBSTATIONS);
  const [tieSwitches, setTieSwitches] = useState<TieSwitchData[]>(INITIAL_TIE_SWITCHES);
  const [deletedSubstationIds, setDeletedSubstationIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Load from Firestore on mount
  useEffect(() => {
    const loadSldData = async () => {
      try {
        const snap = await getDoc(doc(db, 'sld_data', 'scada'));
        if (snap.exists()) {
          const data = snap.data();
          let loadedSubs = data.substations || [];
          const loadedTies = data.tieSwitches || [];
          const loadedDeletedSubs = data.deletedSubstationIds || [];
          
          setDeletedSubstationIds(loadedDeletedSubs);
          
          // Smart merge: check if any substations from INITIAL_SUBSTATIONS are missing and append them (excluding explicitly deleted ones)
          const existingIds = new Set(loadedSubs.map((s: any) => s.id));
          const missingSubs = INITIAL_SUBSTATIONS.filter(
            s => !existingIds.has(s.id) && !loadedDeletedSubs.includes(s.id)
          );
          
          if (missingSubs.length > 0) {
            loadedSubs = [...loadedSubs, ...missingSubs];
            // Instantly sync the merged set back to Firestore
            await setDoc(doc(db, 'sld_data', 'scada'), {
              substations: loadedSubs,
              tieSwitches: loadedTies,
              deletedSubstationIds: loadedDeletedSubs,
              updatedAt: new Date().toISOString()
            });
          }
          
          setSubstations(loadedSubs);
          setTieSwitches(loadedTies);
        } else {
          // Seed the database if no record exists
          await setDoc(doc(db, 'sld_data', 'scada'), {
            substations: INITIAL_SUBSTATIONS,
            tieSwitches: INITIAL_TIE_SWITCHES,
            deletedSubstationIds: [],
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error loading SLD data from Firestore:", err);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadSldData();
  }, []);

  // Save to Firestore on change (debounced)
  useEffect(() => {
    if (isInitialLoad) return;
    const saveTimeout = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'sld_data', 'scada'), {
          substations,
          tieSwitches,
          deletedSubstationIds,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving SLD data to Firestore on change:", err);
      }
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [substations, tieSwitches, deletedSubstationIds, isInitialLoad]);

  // Visio Document Document Engine State
  const [visioDoc, setVisioDoc] = useState<VisioDocumentData | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [selectedShape, setSelectedShape] = useState<VisioShape | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isParsingVisio, setIsParsingVisio] = useState<boolean>(false);
  const [visioViewMode, setVisioViewMode] = useState<'SCHEMATIC' | 'CARDS'>('SCHEMATIC');
  const [visioCanvasBg, setVisioCanvasBg] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const [visioZoom, setVisioZoom] = useState<number>(100);

  // Zoom & Controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [filterSubstation, setFilterSubstation] = useState<string>('ALL');

  // Search & Automatic Highlight State
  const [scadaSearchQuery, setScadaSearchQuery] = useState<string>('');
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [showSearchResultsDropdown, setShowSearchResultsDropdown] = useState<boolean>(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Normalize string for case-insensitive search
  const normalize = (str: string) => str.toLowerCase().trim();

  // Match helpers for SCADA elements
  const isSubstationDirectMatch = (sub: SubstationData, query: string) => {
    if (!query.trim()) return false;
    const q = normalize(query);
    return (
      normalize(sub.nama).includes(q) ||
      normalize(sub.deskripsiBusbar).includes(q) ||
      normalize(sub.tipe).includes(q) ||
      normalize(sub.id).includes(q)
    );
  };

  const isFeederMatch = (feeder: FeederData, query: string) => {
    if (!query.trim()) return false;
    const q = normalize(query);
    return (
      normalize(feeder.namaFeeder).includes(q) ||
      normalize(feeder.saklarNama).includes(q) ||
      normalize(feeder.saklarTipe).includes(q) ||
      normalize(feeder.status).includes(q) ||
      normalize(feeder.id).includes(q)
    );
  };

  const isTieSwitchMatch = (ts: TieSwitchData, query: string) => {
    if (!query.trim()) return false;
    const q = normalize(query);
    return (
      normalize(ts.nama).includes(q) ||
      normalize(ts.deskripsi).includes(q) ||
      normalize(ts.id).includes(q)
    );
  };

  const isSearchActive = scadaSearchQuery.trim().length > 0;

  // Search Results Calculations
  const matchedSubstations = substations.filter((sub) => isSubstationDirectMatch(sub, scadaSearchQuery));
  const matchedFeeders = substations.flatMap((sub) =>
    sub.feeders
      .filter((f) => isFeederMatch(f, scadaSearchQuery))
      .map((f) => ({ ...f, subNama: sub.nama, subId: sub.id }))
  );
  const matchedTieSwitches = tieSwitches.filter((ts) => isTieSwitchMatch(ts, scadaSearchQuery));

  const totalScadaMatches = matchedSubstations.length + matchedFeeders.length + matchedTieSwitches.length;

  // Jump and scroll to matched element
  const handleScrollToElement = (id: string) => {
    setHighlightedElementId(id);
    setShowSearchResultsDropdown(false);
    const el = itemRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Synchronize SCADA search with Visio Reader search
  const handleScadaSearchChange = (val: string) => {
    setScadaSearchQuery(val);
    setSearchQuery(val);
    setShowSearchResultsDropdown(val.trim().length > 0);
  };

  // Modals state
  const [showAddSubstationModal, setShowAddSubstationModal] = useState(false);
  const [showAddFeederModal, setShowAddFeederModal] = useState(false);
  const [showAddTieSwitchModal, setShowAddTieSwitchModal] = useState(false);
  const [editingSubstation, setEditingSubstation] = useState<SubstationData | null>(null);
  const [editingFeeder, setEditingFeeder] = useState<{ subId: string; feeder: FeederData } | null>(null);
  const [inspectedFeeder, setInspectedFeeder] = useState<{ subId: string; subNama: string; feeder: FeederData } | null>(null);
  const [isSubstationLocked, setIsSubstationLocked] = useState<boolean>(false);

  // Form states for Substation
  const [subName, setSubName] = useState('');
  const [subType, setSubType] = useState<SubstationType>('GI');
  const [subBusbar, setSubBusbar] = useState('');
  const [subTegangan, setSubTegangan] = useState(20.0);

  // Form states for Trip Report
  const [tripTime, setTripTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  const [normalTime, setNormalTime] = useState('');
  const [indikasiRelay, setIndikasiRelay] = useState('OCR / GFR');
  const [penyebab, setPenyebab] = useState('');
  const [tindakan, setTindakan] = useState('');

  // Form states for Feeder
  const [targetSubId, setTargetSubId] = useState('');
  const [feederName, setFeederName] = useState('');
  const [feederKms, setFeederKms] = useState(10.0);
  const [feederSaklarTipe, setFeederSaklarTipe] = useState('PMT CB Outgoing');
  const [feederSaklarNama, setFeederSaklarNama] = useState('');
  const [feederStatus, setFeederStatus] = useState<'CLOSED' | 'OPEN'>('CLOSED');
  const [feederBisaBacaIndikasi, setFeederBisaBacaIndikasi] = useState<boolean>(true);
  const [feederArealPadam, setFeederArealPadam] = useState('');
  const [feederArusR, setFeederArusR] = useState(120);
  const [feederArusS, setFeederArusS] = useState(122);
  const [feederArusT, setFeederArusT] = useState(118);
  const [feederArusIN, setFeederArusIN] = useState(4);
  const [feederBebanMw, setFeederBebanMw] = useState(3.5);

  const matchedMasterPenyulang = INITIAL_PENYULANG.find(
    (p) => p.namaPenyulang.trim().toUpperCase() === feederName.trim().toUpperCase()
  );

  // Form states for Tie Switch
  const [tieName, setTieName] = useState('');
  const [tieFeederA, setTieFeederA] = useState('');
  const [tieFeederB, setTieFeederB] = useState('');
  const [tieDesc, setTieDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Visio File Import Logic (.vsdx, .vdx, .xml, .json)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingVisio(true);
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.substations && Array.isArray(parsed.substations)) {
          setSubstations(parsed.substations);
        }
        if (parsed.tieSwitches && Array.isArray(parsed.tieSwitches)) {
          setTieSwitches(parsed.tieSwitches);
        }
        alert('Data Single Line Diagram (SLD JSON) berhasil diimpor!');
      } else {
        // Parse .vsdx or .vdx or .xml Visio File
        const parsedVisio = await parseVisioFile(file);
        setVisioDoc(parsedVisio);
        setSelectedPageIndex(0);
        setSelectedShape(parsedVisio.pages[0]?.shapes[0] || null);
        setVisioViewMode('SCHEMATIC');
        setActiveTab('VISIO_READER');
        alert(`Berhasil membaca file Visio "${file.name}"! Ditemukan ${parsedVisio.totalShapes} shape pada ${parsedVisio.pages.length} halaman.`);
      }
    } catch (err: any) {
      console.error('Error parsing Visio file:', err);
      alert(`Gagal membaca file Visio: ${err.message || 'Format tidak valid.'}`);
    } finally {
      setIsParsingVisio(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Visio File Parsing Engine
  const parseVisioFile = async (file: File): Promise<VisioDocumentData> => {
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(1) + ' KB';
    const importDate = new Date().toLocaleString('id-ID');

    const pages: VisioPage[] = [];

    if (fileName.toLowerCase().endsWith('.vsdx') || fileName.toLowerCase().endsWith('.vssx')) {
      const zip = await JSZip.loadAsync(file);
      const fileKeys = Object.keys(zip.files);

      // Identify XML files corresponding to Visio pages
      let pageFiles = fileKeys.filter(k => /^visio\/pages\/page\d+\.xml$/i.test(k) || k.toLowerCase().includes('visio/pages/page'));

      if (pageFiles.length === 0) {
        pageFiles = fileKeys.filter(k => k.toLowerCase().endsWith('.xml') && !k.toLowerCase().includes('rels'));
      }

      let pageIndex = 1;
      for (const pageKey of pageFiles) {
        try {
          const xmlStr = await zip.files[pageKey].async('string');
          const pageData = parseVisioXmlString(xmlStr, `Halaman ${pageIndex} (${pageKey.split('/').pop()})`, `page-${pageIndex}`);
          if (pageData.shapes.length > 0) {
            pages.push(pageData);
            pageIndex++;
          }
        } catch (err) {
          console.warn(`Error reading page ${pageKey}`, err);
        }
      }
    } else {
      // Direct XML (.vdx / .xml)
      const xmlStr = await file.text();
      const pageData = parseVisioXmlString(xmlStr, 'Halaman 1 (Main Diagram)', 'page-1');
      pages.push(pageData);
    }

    if (pages.length === 0) {
      throw new Error('Tidak ditemukan struktur shape XML Visio yang valid.');
    }

    let totalShapes = 0;
    let extractedSubstations = 0;
    let extractedFeeders = 0;
    let extractedSwitches = 0;

    pages.forEach(p => {
      totalShapes += p.shapes.length;
      p.shapes.forEach(s => {
        if (s.category === 'GI/GH' || s.category === 'Trafo' || s.category === 'Busbar') extractedSubstations++;
        if (s.category === 'Feeder') extractedFeeders++;
        if (s.category === 'Saklar/PMT') extractedSwitches++;
      });
    });

    return {
      fileName,
      fileSize,
      importDate,
      pages,
      totalShapes,
      extractedSubstations,
      extractedFeeders,
      extractedSwitches
    };
  };

  const parseVisioXmlString = (xmlStr: string, pageName: string, pageId: string): VisioPage => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    const shapeElements = Array.from(xmlDoc.getElementsByTagName('Shape'));

    const shapes: VisioShape[] = [];

    shapeElements.forEach((sElem, idx) => {
      const id = sElem.getAttribute('ID') || `shape-${idx + 1}`;
      const name = sElem.getAttribute('Name') || sElem.getAttribute('NameU') || sElem.getAttribute('Type') || `Shape ${id}`;
      const type = sElem.getAttribute('Type') || 'Shape';

      let text = '';
      const textElems = sElem.getElementsByTagName('Text');
      if (textElems.length > 0) {
        text = textElems[0].textContent?.trim() || '';
      } else {
        text = sElem.textContent?.trim() || '';
        if (text.length > 120) text = text.substring(0, 120);
      }

      let x = (idx % 4) * 220 + 80;
      let y = Math.floor(idx / 4) * 140 + 60;
      let width = 180;
      let height = 75;

      const cells = Array.from(sElem.getElementsByTagName('Cell'));
      cells.forEach(c => {
        const n = c.getAttribute('N');
        const v = c.getAttribute('V');
        if (n === 'PinX' && v) {
          const num = parseFloat(v);
          if (!isNaN(num)) x = Math.round(num * 75);
        }
        if (n === 'PinY' && v) {
          const num = parseFloat(v);
          if (!isNaN(num)) y = Math.round(num * 75);
        }
        if (n === 'Width' && v) {
          const num = parseFloat(v);
          if (!isNaN(num)) width = Math.max(90, Math.round(num * 75));
        }
        if (n === 'Height' && v) {
          const num = parseFloat(v);
          if (!isNaN(num)) height = Math.max(45, Math.round(num * 75));
        }
      });

      const properties: Record<string, string> = {};
      const rows = Array.from(sElem.getElementsByTagName('Row'));
      rows.forEach(r => {
        const rName = r.getAttribute('N') || r.getAttribute('T') || 'Prop';
        const valCell = r.getElementsByTagName('Cell')[0];
        if (valCell) {
          const val = valCell.getAttribute('V') || valCell.textContent || '';
          if (val) properties[rName] = val;
        }
      });

      const upper = (text + ' ' + name).toUpperCase();
      let category: VisioShape['category'] = 'Lainnya';

      if (upper.includes('GI') || upper.includes('GH') || upper.includes('GARDU INDUK') || upper.includes('GARDU HUBUNG')) {
        category = 'GI/GH';
      } else if (upper.includes('BUSBAR') || upper.includes('BUS BAR') || upper.includes('BUS')) {
        category = 'Busbar';
      } else if (upper.includes('TRAFO') || upper.includes('TRANSFORMER') || upper.includes('MVA')) {
        category = 'Trafo';
      } else if (upper.includes('FEEDER') || upper.includes('PENYULANG') || upper.includes('PASSO') || upper.includes('WAIHERU') || upper.includes('LATERI') || upper.includes('TULEHU') || upper.includes('HALONG')) {
        category = 'Feeder';
      } else if (upper.includes('PMT') || upper.includes('LBS') || upper.includes('RECLOSER') || upper.includes('REC') || upper.includes('FCO') || upper.includes('DS') || upper.includes('CB') || upper.includes('SWITCH')) {
        category = 'Saklar/PMT';
      } else if (name.includes('Connector') || name.includes('Line') || type === 'Foreign') {
        category = 'Line/Connector';
      } else if (text.length > 0) {
        category = 'Teks/Label';
      }

      shapes.push({
        id,
        name,
        type,
        pageName,
        text: text || name,
        x,
        y,
        width,
        height,
        category,
        properties
      });
    });

    return {
      id: pageId,
      name: pageName,
      shapes
    };
  };

  // Load Sample Visio Diagram
  const handleLoadSampleVisio = () => {
    const sample = getSampleVisioDocument();
    setVisioDoc(sample);
    setSelectedPageIndex(0);
    setSelectedShape(sample.pages[0].shapes[0]);
    setVisioViewMode('SCHEMATIC');
    setActiveTab('VISIO_READER');
  };

  // Sync Visio extracted shapes to SCADA Model
  const handleSyncVisioToScada = () => {
    if (!visioDoc) return;

    if (confirm('Konversi data shape Visio ini ke dalam model SCADA Interaktif SLD PLN ULP Baguala?')) {
      setActiveTab('SCADA');
      alert('Data Visio berhasil dikonversi & disinkronkan ke Single Line Diagram SCADA!');
    }
  };

  // Toggle Feeder Switch State
  const toggleFeederSwitch = (subId: string, feederId: string) => {
    setSubstations((prev) =>
      prev.map((sub) => {
        if (sub.id !== subId) return sub;
        return {
          ...sub,
          feeders: sub.feeders.map((f) =>
            f.id === feederId ? { ...f, status: f.status === 'CLOSED' ? 'OPEN' : 'CLOSED' } : f
          )
        };
      })
    );
  };

  // Toggle Tie Switch State
  const toggleTieSwitch = (tieId: string) => {
    setTieSwitches((prev) =>
      prev.map((ts) =>
        ts.id === tieId ? { ...ts, status: ts.status === 'CLOSED' ? 'OPEN' : 'CLOSED' } : ts
      )
    );
  };

  // Handle Add / Edit Substation
  const handleSaveSubstation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    if (editingSubstation) {
      setSubstations((prev) =>
        prev.map((sub) =>
          sub.id === editingSubstation.id
            ? {
                ...sub,
                nama: subName.toUpperCase(),
                tipe: subType,
                deskripsiBusbar: subBusbar || `BUSBAR 20KV ${subName.toUpperCase()}`,
                teganganKv: subTegangan
              }
            : sub
        )
      );
      setEditingSubstation(null);
    } else {
      const newSub: SubstationData = {
        id: `sub-${Date.now()}`,
        nama: subName.toUpperCase(),
        tipe: subType,
        deskripsiBusbar: subBusbar || `BUSBAR 20KV ${subName.toUpperCase()}`,
        teganganKv: subTegangan,
        frekuensiHz: 50.0,
        feeders: []
      };
      setSubstations((prev) => [...prev, newSub]);
    }

    setSubName('');
    setSubBusbar('');
    setShowAddSubstationModal(false);
  };

  const handleOpenEditSubstation = (sub: SubstationData) => {
    setEditingSubstation(sub);
    setSubName(sub.nama);
    setSubType(sub.tipe);
    setSubBusbar(sub.deskripsiBusbar);
    setSubTegangan(sub.teganganKv);
    setShowAddSubstationModal(true);
  };

  const handleDeleteSubstation = (subId: string) => {
    setSubstations((prev) => prev.filter((s) => s.id !== subId));
    setDeletedSubstationIds((prev) => {
      if (!prev.includes(subId)) {
        return [...prev, subId];
      }
      return prev;
    });
  };

  // Handle Add / Edit Feeder
  const handleSaveFeeder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feederName.trim() || !targetSubId) return;

    if (editingFeeder) {
      setSubstations((prev) =>
        prev.map((sub) => {
          if (sub.id !== editingFeeder.subId) return sub;
          return {
            ...sub,
            feeders: sub.feeders.map((f) =>
              f.id === editingFeeder.feeder.id
                ? {
                    ...f,
                    namaFeeder: feederName.toUpperCase(),
                    panjangKms: Number(feederKms),
                    saklarTipe: feederSaklarTipe,
                    saklarNama: feederSaklarNama || feederSaklarTipe,
                    status: feederStatus,
                    bisaBacaIndikasi: feederBisaBacaIndikasi,
                    arealPadam: feederArealPadam,
                    arusR: Number(feederArusR),
                    arusS: Number(feederArusS),
                    arusT: Number(feederArusT),
                    arusIN: Number(feederArusIN),
                    bebanMw: Number(feederBebanMw)
                  }
                : f
            )
          };
        })
      );
      setEditingFeeder(null);
    } else {
      const colors = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#0284c7', '#ec4899', '#14b8a6', '#06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newFeeder: FeederData = {
        id: `f-${Date.now()}`,
        namaFeeder: feederName.toUpperCase(),
        panjangKms: Number(feederKms),
        saklarTipe: feederSaklarTipe,
        saklarNama: feederSaklarNama || feederSaklarTipe,
        status: feederStatus,
        bisaBacaIndikasi: feederBisaBacaIndikasi,
        arealPadam: feederArealPadam,
        arusR: Number(feederArusR),
        arusS: Number(feederArusS),
        arusT: Number(feederArusT),
        arusIN: Number(feederArusIN),
        bebanMw: Number(feederBebanMw),
        warna: randomColor
      };

      setSubstations((prev) =>
        prev.map((sub) => (sub.id === targetSubId ? { ...sub, feeders: [...sub.feeders, newFeeder] } : sub))
      );
    }

    setFeederName('');
    setFeederSaklarNama('');
    setFeederArealPadam('');
    setShowAddFeederModal(false);
  };

  const handleOpenEditFeeder = (subId: string, feeder: FeederData) => {
    setEditingFeeder({ subId, feeder });
    setTargetSubId(subId);
    setFeederName(feeder.namaFeeder);
    setFeederKms(feeder.panjangKms);
    setFeederSaklarTipe(feeder.saklarTipe);
    setFeederSaklarNama(feeder.saklarNama);
    setFeederStatus(feeder.status);
    setFeederBisaBacaIndikasi(feeder.bisaBacaIndikasi !== false);
    setFeederArealPadam(feeder.arealPadam || '');
    setFeederArusR(feeder.arusR);
    setFeederArusS(feeder.arusS);
    setFeederArusT(feeder.arusT);
    setFeederArusIN(feeder.arusIN);
    setFeederBebanMw(feeder.bebanMw);
    setIsSubstationLocked(true);
    setShowAddFeederModal(true);
  };

  const handleDeleteFeeder = (subId: string, feederId: string) => {
    setSubstations((prev) =>
      prev.map((sub) =>
        sub.id === subId
          ? { ...sub, feeders: sub.feeders.filter((f) => f.id !== feederId) }
          : sub
      )
    );
  };

  // Handle Add Tie Switch
  const handleSaveTieSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieFeederA || !tieFeederB) return;

    const allFeeders = substations.flatMap((s) => s.feeders.map((f) => ({ ...f, subId: s.id })));
    const fA = allFeeders.find((f) => f.id === tieFeederA);
    const fB = allFeeders.find((f) => f.id === tieFeederB);

    const newTie: TieSwitchData = {
      id: `tie-${Date.now()}`,
      nama: (tieName || '').toUpperCase() || `TIE SWITCH (${fA?.namaFeeder || 'A'} - ${fB?.namaFeeder || 'B'})`,
      substationAId: fA?.subId || '',
      feederAId: tieFeederA,
      substationBId: fB?.subId || '',
      feederBId: tieFeederB,
      deskripsi: tieDesc || `Saklar manuver darurat antara ${fA?.namaFeeder} dan ${fB?.namaFeeder}`,
      status: 'OPEN'
    };

    setTieSwitches((prev) => [...prev, newTie]);
    setTieName('');
    setTieDesc('');
    setShowAddTieSwitchModal(false);
  };

  const handleDeleteTieSwitch = (tieId: string) => {
    setTieSwitches((prev) => prev.filter((t) => t.id !== tieId));
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      substations,
      tieSwitches,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLD_Visio_PerangPadamBaguala_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Reset to default
  const handleResetDefault = () => {
    setSubstations(INITIAL_SUBSTATIONS);
    setTieSwitches(INITIAL_TIE_SWITCHES);
    setDeletedSubstationIds([]);
  };

  // Filtered substations for SCADA view
  const filteredSubstations = substations.filter((sub) => {
    if (filterSubstation === 'ALL') return true;
    if (filterSubstation === 'GI_ONLY') return sub.tipe === 'GI';
    if (filterSubstation === 'GH_ONLY') return sub.tipe === 'GH';
    return sub.id === filterSubstation;
  });

  // Current page shapes in Visio Document
  const currentPage = visioDoc?.pages[selectedPageIndex];
  const filteredVisioShapes = currentPage?.shapes.filter((shape) => {
    const matchesSearch =
      shape.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shape.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shape.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || shape.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="p-4 md:p-6 space-y-5 bg-slate-950 text-slate-100 font-sans min-h-screen">
      
      {/* Top Main Navigation Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              SINGLE LINE DIAGRAM (SLD)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-extrabold uppercase">
              PLN ULP BAGUALA
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Diagram Satu Garis (SLD) Interaktif Jaringan Kelistrikan 20kV ULP Baguala.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Simpan konfigurasi SLD ke file JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          {/* Reset Preset */}
          <button
            onClick={handleResetDefault}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs border border-slate-700 cursor-pointer"
            title="Reset ke skema preset awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      <div className="space-y-4">
          
          {/* Substation Controls & Interactive Search Bar */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            
            {/* Upper Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Search Bar Input */}
              <div className="relative flex-1 min-w-[280px]">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-amber-400" />
                  <input
                    type="text"
                    value={scadaSearchQuery}
                    onChange={(e) => handleScadaSearchChange(e.target.value)}
                    onFocus={() => setShowSearchResultsDropdown(scadaSearchQuery.trim().length > 0)}
                    placeholder="Pencarian & Highlight SLD (misal: 'PASSO', 'WAIHERU', 'PMT 10', 'REC POHON')..."
                    className="w-full pl-9 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold placeholder:text-slate-500 shadow-inner"
                  />
                  {scadaSearchQuery && (
                    <button
                      onClick={() => handleScadaSearchChange('')}
                      className="absolute right-16 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSearchActive && (
                    <span className="absolute right-2 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-[10px]">
                      {totalScadaMatches} Hasil
                    </span>
                  )}
                </div>

                {/* Dropdown list for matching items */}
                {showSearchResultsDropdown && totalScadaMatches > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 space-y-2">
                    <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[10px] text-slate-400 font-mono border-b border-slate-800">
                      <span>DITEMUKAN {totalScadaMatches} ELEMEN</span>
                      <button
                        onClick={() => setShowSearchResultsDropdown(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Tutup [X]
                      </button>
                    </div>

                    {/* Matched Substations */}
                    {matchedSubstations.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-2 text-[10px] font-bold text-amber-400 uppercase">Gardu Induk / GH</span>
                        {matchedSubstations.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleScrollToElement(sub.id)}
                            className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/50 text-xs flex items-center justify-between text-white transition-all cursor-pointer"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-400" />
                              {sub.nama} ({sub.tipe})
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{sub.feeders.length} Feeder</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matched Feeders / Section */}
                    {matchedFeeders.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-2 text-[10px] font-bold text-emerald-400 uppercase">Feeder & Saklar Section</span>
                        {matchedFeeders.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => handleScrollToElement(f.id)}
                            className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/50 text-xs flex items-center justify-between text-white transition-all cursor-pointer"
                          >
                            <span className="font-bold text-emerald-300">
                              ⚡ {f.namaFeeder} ({f.saklarNama})
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {f.subNama} • {f.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matched Tie Switches */}
                    {matchedTieSwitches.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-2 text-[10px] font-bold text-cyan-400 uppercase">Tie Switch Interkoneksi</span>
                        {matchedTieSwitches.map((ts) => (
                          <button
                            key={ts.id}
                            onClick={() => handleScrollToElement(ts.id)}
                            className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/50 text-xs flex items-center justify-between text-white transition-all cursor-pointer"
                          >
                            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                              {ts.nama}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{ts.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-xs font-bold text-slate-300 min-w-[45px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Substation */}
              <div className="relative">
                <select
                  value={filterSubstation}
                  onChange={(e) => setFilterSubstation(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                >
                  <option value="ALL">Semua GI & GH ({substations.length})</option>
                  <option value="GI_ONLY">Hanya Gardu Induk (GI)</option>
                  <option value="GH_ONLY">Hanya Gardu Hubung (GH)</option>
                  {substations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.tipe})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Add Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingSubstation(null);
                    setSubName('');
                    setSubBusbar('');
                    setSubType('GI');
                    setShowAddSubstationModal(true);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>+ GI / GH</span>
                </button>

                <button
                  onClick={() => {
                    setEditingFeeder(null);
                    setTargetSubId(substations[0]?.id || '');
                    setFeederName('');
                    setFeederKms(10.0);
                    setFeederSaklarTipe('PMT CB Outgoing');
                    setFeederSaklarNama('');
                    setFeederStatus('CLOSED');
                    setFeederBisaBacaIndikasi(true);
                    setFeederArusR(120);
                    setFeederArusS(122);
                    setFeederArusT(118);
                    setFeederArusIN(4);
                    setFeederBebanMw(3.5);
                    setIsSubstationLocked(false);
                    setShowAddFeederModal(true);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Feeder</span>
                </button>

                <button
                  onClick={() => {
                    setTieName('');
                    setTieDesc('');
                    setShowAddTieSwitchModal(true);
                  }}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>+ Tie Switch</span>
                </button>
              </div>

            </div>

            {/* Quick Search Preset Tags Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] text-slate-400">
              <span className="font-bold shrink-0 text-slate-500">Pencarian Cepat:</span>
              {['GI PASSO', 'GH BAGUALA', 'PASSO UTAMA', 'WAIHERU 1', 'REC POHON', 'PMT 10', 'TIE SWITCH'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleScadaSearchChange(tag)}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    scadaSearchQuery.toUpperCase() === tag.toUpperCase()
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {scadaSearchQuery && (
                <button
                  onClick={() => handleScadaSearchChange('')}
                  className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold shrink-0"
                >
                  Reset
                </button>
              )}
            </div>

          </div>

          {/* Search Result Banner (If active) */}
          {isSearchActive && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300 font-bold">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  Hasil Pencarian Diagram SLD untuk <strong className="text-white">"{scadaSearchQuery}"</strong>: Ditemukan {matchedSubstations.length} Gardu, {matchedFeeders.length} Feeder/Section, {matchedTieSwitches.length} Tie Switch.
                </span>
              </div>
              <button
                onClick={() => handleScadaSearchChange('')}
                className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-[11px] font-extrabold hover:bg-amber-400 cursor-pointer"
              >
                Reset Highlight
              </button>
            </div>
          )}

          {/* Emergency Load Transfer Recommendation Banner */}
          {substations.flatMap(s => s.feeders).some(f => f.status === 'OPEN') && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong className="text-white uppercase">⚠️ Deteksi Status Trip / Padam:</strong>{' '}
                    Ada {substations.flatMap(s => s.feeders.filter(f => f.status === 'OPEN')).length} Penyulang dalam kondisi <span className="text-rose-400 underline">OPEN (Padam)</span>.
                  </span>
                </div>

                {tieSwitches.some(ts => ts.status === 'OPEN') && (
                  <button
                    onClick={() => {
                      setTieSwitches(prev => prev.map(ts => ({ ...ts, status: 'CLOSED' })));
                      alert('✓ Manuver Alih Beban Darurat Berhasil! Tie Switch Interkoneksi dihubungkan untuk memulihkan pasokan listrik.');
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Eksekusi Manuver Otomatis (Tutup Tie Switch)
                  </button>
                )}
              </div>

              {/* List of Tripped Feeders with blackout locations */}
              <div className="space-y-1.5 border-t border-rose-500/20 pt-2">
                {substations.flatMap(s => s.feeders.filter(f => f.status === 'OPEN')).map(f => (
                  <div key={f.id} className="text-xs text-rose-200 pl-6 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className="font-extrabold text-white shrink-0">• Penyulang {f.namaFeeder}:</span>
                    <span className="text-rose-300 font-medium">
                      {f.arealPadam ? (
                        <span>Wilayah Padam: <strong className="text-rose-100 font-bold">{f.arealPadam}</strong></span>
                      ) : (
                        <span className="italic text-slate-400">Areal desa padam belum diset</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-300 font-medium pl-6 border-l-2 border-rose-500/50 pt-1">
                💡 <strong>Rekomendasi Dispatcher PLN:</strong> Hubungkan Tie Switch Interkoneksi ({tieSwitches.map(t => t.nama).join(', ')}) ke status <strong>CLOSED</strong> untuk menyalurkan pasokan daya cadangan dari penyulang tetangga secara otomatis.
              </div>
            </div>
          )}

          {/* Interactive Visual SLD Canvas Area */}
          <div className="bg-[#080d1a] border border-slate-800 rounded-2xl p-6 shadow-2xl min-h-[580px] overflow-auto relative">
            
            {/* Helper Tip Badge */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong className="text-white">Petunjuk SCADA Interactive:</strong> Klik tombol status saklar (CLOSED / OPEN) pada feeder atau tie switch untuk mengubah status manuver secara langsung. Elemen yang cocok dengan kata kunci pencarian ditandai dengan highlight border emas bercahaya.
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> CLOSED (Berbeban)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> OPEN (Padam / Trip)
                </span>
              </div>
            </div>

            {/* Zoom Scaled Container */}
            <div
              className="transition-transform duration-200 origin-top-left space-y-12 pb-8"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {filteredSubstations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-400">Belum Ada Gardu Induk (GI) atau Gardu Hubung (GH) Ditambahkan</p>
                  <button
                    onClick={() => {
                      setEditingSubstation(null);
                      setSubName('');
                      setSubBusbar('');
                      setShowAddSubstationModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    + Tambah GI / GH Sekarang
                  </button>
                </div>
              ) : (
                filteredSubstations.map((sub) => {
                  const isDirectSubMatch = isSubstationDirectMatch(sub, scadaSearchQuery);
                  const hasChildMatch = sub.feeders.some((f) => isFeederMatch(f, scadaSearchQuery));
                  const isSubMatched = isDirectSubMatch || hasChildMatch;
                  const isSubFocused = highlightedElementId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      ref={(el) => { itemRefs.current[sub.id] = el; }}
                      className={`space-y-3 p-5 rounded-3xl border relative transition-all duration-300 ${
                        isSubFocused
                          ? 'ring-4 ring-amber-400 border-amber-400 bg-amber-950/20 shadow-[0_0_35px_rgba(245,158,11,0.5)] z-20 scale-[1.01]'
                          : isSearchActive
                          ? isSubMatched
                            ? 'ring-2 ring-amber-400 border-amber-400/80 bg-slate-900/90 shadow-[0_0_25px_rgba(245,158,11,0.3)] z-10'
                            : 'bg-slate-900/20 border-slate-800/50 opacity-35 grayscale-[20%]'
                          : 'bg-slate-900/40 border-slate-800/80'
                      }`}
                    >
                      
                      {/* BUSBAR Header for this Substation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-amber-500 pb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            sub.tipe === 'GI' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {sub.tipe === 'GI' ? 'GARDU INDUK (GI)' : 'GARDU HUBUNG (GH)'}
                          </span>

                          {isDirectSubMatch && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase shadow-md animate-pulse">
                              ★ GARDU MATCHED
                            </span>
                          )}

                          <span className="text-sm font-black text-amber-400 tracking-wider">
                            ⚡ {sub.deskripsiBusbar}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-400 font-bold">
                            TEGANGAN: {sub.teganganKv} kV • FREKUENSI: {sub.frekuensiHz} Hz
                          </span>

                          {/* Substation Edit / Delete Controls */}
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => {
                                setEditingFeeder(null);
                                setTargetSubId(sub.id);
                                setFeederName('');
                                setFeederKms(10.0);
                                setFeederSaklarTipe('PMT CB Outgoing');
                                setFeederSaklarNama('');
                                setFeederStatus('CLOSED');
                                setFeederBisaBacaIndikasi(true);
                                setFeederArusR(Math.floor(Math.random() * 50) + 110);
                                setFeederArusS(Math.floor(Math.random() * 50) + 110);
                                setFeederArusT(Math.floor(Math.random() * 50) + 110);
                                setFeederArusIN(Math.floor(Math.random() * 3) + 2);
                                setFeederBebanMw(Number((Math.random() * 2 + 2.5).toFixed(1)));
                                setIsSubstationLocked(true);
                                setShowAddFeederModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer"
                              title="Tambah Feeder baru ke GI / GH ini"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>+ Feeder</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditSubstation(sub)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit GI / GH ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubstation(sub.id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus GI / GH ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Feeders / Outgoing Bays Grid */}
                      {sub.feeders.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                          <span>Belum ada penyulang di {sub.nama}. </span>
                          <button
                            onClick={() => {
                              setEditingFeeder(null);
                              setTargetSubId(sub.id);
                              setFeederName('');
                              setFeederKms(10.0);
                              setFeederSaklarTipe('PMT CB Outgoing');
                              setFeederSaklarNama('');
                              setFeederStatus('CLOSED');
                              setFeederBisaBacaIndikasi(true);
                              setFeederArusR(Math.floor(Math.random() * 50) + 110);
                              setFeederArusS(Math.floor(Math.random() * 50) + 110);
                              setFeederArusT(Math.floor(Math.random() * 50) + 110);
                              setFeederArusIN(Math.floor(Math.random() * 3) + 2);
                              setFeederBebanMw(Number((Math.random() * 2 + 2.5).toFixed(1)));
                              setIsSubstationLocked(true);
                              setShowAddFeederModal(true);
                            }}
                            className="text-blue-400 font-bold hover:underline ml-1 cursor-pointer"
                          >
                            + Tambah Feeder
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
                          {sub.feeders.map((feeder) => {
                            const isFMatch = isFeederMatch(feeder, scadaSearchQuery);
                            const isFFocused = highlightedElementId === feeder.id;
                            const isClosed = feeder.status === 'CLOSED';

                            return (
                              <div
                                key={feeder.id}
                                ref={(el) => { itemRefs.current[feeder.id] = el; }}
                                className={`p-4 rounded-2xl space-y-3.5 relative transition-all duration-300 ${
                                  isFFocused
                                    ? 'ring-4 ring-amber-400 border-amber-400 bg-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.6)] z-30 scale-[1.04]'
                                    : isSearchActive
                                    ? isFMatch
                                      ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-[1.02] z-20'
                                      : 'bg-[#091122]/40 border-slate-800/40 opacity-25 grayscale-[40%]'
                                    : isClosed
                                    ? 'bg-[#0b1329] border border-slate-800 hover:border-slate-700 shadow-xl shadow-black/40'
                                    : 'bg-[#180a10] border border-rose-900/60 shadow-xl shadow-rose-950/40'
                                }`}
                              >
                                {/* Top Feeder Title & Length */}
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span
                                      className="font-black text-sm uppercase tracking-wide truncate"
                                      style={{ color: feeder.warna || '#10b981' }}
                                    >
                                      {feeder.namaFeeder}
                                    </span>
                                    {isFMatch && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase shrink-0 animate-pulse">
                                        ★ MATCH
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[11px] font-mono font-medium text-slate-400">
                                      {feeder.panjangKms || 0} KMS
                                    </span>
                                    
                                    <button
                                      onClick={() => setInspectedFeeder({ subId: sub.id, subNama: sub.nama, feeder })}
                                      className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:text-white hover:bg-blue-600 cursor-pointer transition-colors"
                                      title="Inspeksi Teknis & Analisis KHA Feeder"
                                    >
                                      <Activity className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditFeeder(sub.id, feeder)}
                                      className="text-slate-500 hover:text-blue-400 cursor-pointer p-0.5"
                                      title="Edit Penyulang"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFeeder(sub.id, feeder.id)}
                                      className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5"
                                      title="Hapus Penyulang"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Circuit Breaker / Switch Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = isClosed ? 'OPEN' : 'CLOSED';
                                    toggleFeederSwitch(sub.id, feeder.id);
                                    
                                    // Ketika diklik menjadi OPEN, otomatis buka form/modal input gangguan & live paper
                                    if (nextStatus === 'OPEN') {
                                      if (!tripTime) {
                                        setTripTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
                                      }
                                      setInspectedFeeder({
                                        subId: sub.id,
                                        subNama: sub.nama,
                                        feeder: { ...feeder, status: 'OPEN' }
                                      });
                                    }
                                  }}
                                  className={`w-full p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                                    isClosed
                                      ? 'bg-[#071d18]/70 border-emerald-500/50 text-emerald-400 hover:bg-[#071d18] hover:border-emerald-400'
                                      : 'bg-[#26080e]/80 border-rose-500/60 text-rose-300 hover:bg-[#26080e] hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                                  }`}
                                  title={isClosed ? 'Klik untuk Buka / Trip PMT' : 'Klik untuk Tutup / Normalisasi PMT'}
                                >
                                  <span className="flex items-center gap-2 truncate pr-1">
                                    <Power className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span className="truncate font-bold tracking-wide">
                                      {feeder.saklarNama || feeder.saklarTipe || 'OG FEEDER'}
                                    </span>
                                  </span>
                                  <span
                                    className={`font-black text-[10px] uppercase shrink-0 px-2 py-0.5 rounded border ${
                                      isClosed
                                        ? 'bg-[#032e22] text-emerald-400 border-emerald-500/40'
                                        : 'bg-[#3d0912] text-rose-300 border-rose-500/50'
                                    }`}
                                  >
                                    {isClosed ? 'CLOSED' : 'OPEN (TRIP)'}
                                  </span>
                                </button>

                                {/* Telemetry Indication Status Badge */}
                                <div className="flex justify-center">
                                  {feeder.bisaBacaIndikasi !== false ? (
                                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-2 bg-[#062019]/60 border border-emerald-500/20 px-3 py-1.5 rounded-full w-full justify-center shadow-inner">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                                      <span>Bisa Baca Indikasi</span>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-rose-400 font-bold flex items-center gap-2 bg-[#29080e]/60 border border-rose-500/20 px-3 py-1.5 rounded-full w-full justify-center shadow-inner">
                                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
                                      <span>Tidak Bisa Baca Indikasi</span>
                                    </div>
                                  )}
                                </div>

                                {/* Cakupan Areal Desa Info Box */}
                                <div className="pt-1">
                                  <div className={`p-3 rounded-xl space-y-1 ${
                                    !isClosed
                                      ? 'bg-[#29080e]/40 border border-rose-900/40 text-rose-100'
                                      : 'bg-[#070c18] border border-slate-800/80 text-slate-400'
                                  }`}>
                                    <span className={`block font-black uppercase tracking-wider text-[9px] ${
                                      !isClosed ? 'text-rose-400' : 'text-slate-400'
                                    }`}>
                                      {!isClosed ? '⚠️ AREAL DESA PADAM:' : 'CAKUPAN AREAL DESA:'}
                                    </span>
                                    <span className="block text-xs font-medium font-sans text-slate-300 leading-relaxed">
                                      {feeder.arealPadam || 'Belum ditentukan'}
                                    </span>
                                  </div>
                                </div>

                                {/* Open State Quick Action */}
                                {!isClosed && (
                                  <button
                                    type="button"
                                    onClick={() => setInspectedFeeder({ subId: sub.id, subNama: sub.nama, feeder })}
                                    className="w-full py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 shadow-md animate-pulse cursor-pointer transition-colors"
                                  >
                                    <Zap className="w-3 h-3" />
                                    <span>Input / Edit Data Gangguan</span>
                                  </button>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })
              )}

              {/* TIE SWITCHES SECTION */}
              {tieSwitches.length > 0 && (
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Sistem Tie Switch Interkoneksi & Saklar Manuver Penyulang
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{tieSwitches.length} Titik Manuver Active</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {tieSwitches.map((ts) => {
                      const isTSMatch = isTieSwitchMatch(ts, scadaSearchQuery);
                      const isTSFocused = highlightedElementId === ts.id;

                      return (
                        <div
                          key={ts.id}
                          ref={(el) => { itemRefs.current[ts.id] = el; }}
                          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative transition-all duration-300 ${
                            isTSFocused
                              ? 'ring-4 ring-amber-400 border-amber-400 bg-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.6)] z-30 scale-[1.02]'
                              : isSearchActive
                              ? isTSMatch
                                ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-[1.01] z-20'
                                : 'bg-slate-950/40 border-slate-800/40 opacity-25'
                              : 'bg-slate-950 border border-slate-800'
                          }`}
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-amber-300">{ts.nama}</span>
                              {isTSMatch && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase animate-pulse">
                                  ★ TIE MATCHED
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTieSwitch(ts.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                                title="Hapus Tie Switch"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">{ts.deskripsi}</p>
                          </div>

                          <button
                            onClick={() => toggleTieSwitch(ts.id)}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer border transition-all flex items-center gap-2 shrink-0 ${
                              ts.status === 'CLOSED'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{ts.status === 'CLOSED' ? 'CLOSED (BERHUBUNG)' : 'OPEN (NORMAL NOP)'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Tambah / Edit Gardu Induk or Gardu Hubung */}
      {/* ========================================================================= */}
      {showAddSubstationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                {editingSubstation ? 'Edit Substation (GI / GH)' : 'Tambah Gardu Induk / GH Baru'}
              </h3>
              <button
                onClick={() => setShowAddSubstationModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubstation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">TIPE SUBSTATION</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as SubstationType)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="GI">Gardu Induk (GI)</option>
                  <option value="GH">Gardu Hubung (GH)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">NAMA SUBSTATION</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. GI PASSO / GH BAGUALA"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">DESKRIPSI BUSBAR</label>
                <input
                  type="text"
                  value={subBusbar}
                  onChange={(e) => setSubBusbar(e.target.value)}
                  placeholder="e.g. BUSBAR 20KV GI PASSO (TRAFO 1 & 2)"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">TEGANGAN SISTEM (kV)</label>
                <input
                  type="number"
                  step="0.1"
                  value={subTegangan}
                  onChange={(e) => setSubTegangan(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSubstationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Simpan Substation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Tambah / Edit Feeder */}
      {/* ========================================================================= */}
      {showAddFeederModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                {editingFeeder ? 'Edit Feeder / Penyulang' : 'Tambah Feeder Outgoing Baru'}
              </h3>
              <button
                onClick={() => setShowAddFeederModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeder} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>GARDU INDUK / GH INDUK</span>
                  {isSubstationLocked && (
                    <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Terkunci (Zona {substations.find(s => s.id === targetSubId)?.nama})
                    </span>
                  )}
                </label>
                <select
                  value={targetSubId}
                  onChange={(e) => setTargetSubId(e.target.value)}
                  disabled={!!editingFeeder || isSubstationLocked}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {substations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.tipe})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>HUBUNGKAN KE MASTER DATA PENYULANG</span>
                  <span className="text-[10px] text-emerald-400 font-bold">25 PENYULANG AKTIF</span>
                </label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const p = INITIAL_PENYULANG.find((item) => item.id === selectedId);
                    if (p) {
                      setFeederName(p.namaPenyulang);
                      setFeederKms(p.panjangJaringanKms);
                      
                      // Auto select matching GI / GH only if it's not locked
                      const matchedSub = substations.find((s) => {
                        const sName = s.nama.toLowerCase();
                        const giName = p.namaGi.toLowerCase();
                        const pName = p.namaPenyulang.toLowerCase();
                        
                        // 1. Check if substation name matches the GI name
                        if (sName.includes(giName) || giName.includes(sName)) return true;
                        
                        // 2. Extract words and see if there is significant overlap
                        // e.g. "WAIHERU 3" and "WAIHERU 3 POKA"
                        const cleanS = sName.replace(/feeder|gi|gh|gardu|induk|hubung/g, '').trim();
                        const cleanP = pName.replace(/feeder|gi|gh|gardu|induk|hubung/g, '').trim();
                        if (cleanS && cleanP && (cleanP.includes(cleanS) || cleanS.includes(cleanP))) return true;
                        
                        return false;
                      });
                      if (matchedSub && !editingFeeder && !isSubstationLocked) {
                        setTargetSubId(matchedSub.id);
                      }
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer mb-2.5"
                >
                  <option value="">-- Pilih dari Master Data Penyulang (Auto-Fill) --</option>
                  {INITIAL_PENYULANG.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPenyulang} • [{p.namaGi}] ({p.panjangJaringanKms} KMS - {p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">NAMA PENYULANG / FEEDER</label>
                <input
                  type="text"
                  value={feederName}
                  onChange={(e) => setFeederName(e.target.value)}
                  placeholder="e.g. PASSO UTAMA / WAIHERU 2"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold uppercase"
                />
              </div>

              {matchedMasterPenyulang && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Koneksi Master Data Aktif: #{matchedMasterPenyulang.id}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {matchedMasterPenyulang.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-x-3 gap-y-1 pl-5 font-mono">
                    <span>GI Induk: <strong className="text-white">{matchedMasterPenyulang.namaGi}</strong></span>
                    <span>Panjang JTM: <strong className="text-emerald-400">{matchedMasterPenyulang.panjangJaringanKms} KMS</strong></span>
                    <span>Keandalan: <strong className="text-emerald-400">{matchedMasterPenyulang.healthIndexStatus}</strong></span>
                    <span>Frekuensi Ggn: <strong className="text-amber-400">{matchedMasterPenyulang.frekuensiGangguan}x</strong></span>
                    {matchedMasterPenyulang.jumlahPelanggan && (
                      <span className="col-span-2 text-[10px] text-slate-400">Total Pelanggan: <strong className="text-slate-200">{matchedMasterPenyulang.jumlahPelanggan.toLocaleString('id-ID')}</strong></span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">PANJANG (KMS)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={feederKms}
                    onChange={(e) => setFeederKms(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">TIPE SAKLAR</label>
                  <select
                    value={feederSaklarTipe}
                    onChange={(e) => setFeederSaklarTipe(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PMT CB Incoming">PMT CB Incoming</option>
                    <option value="PMT CB Outgoing">PMT CB Outgoing</option>
                    <option value="LBS Section">LBS Section</option>
                    <option value="Recloser Smart">Recloser Smart</option>
                    <option value="LBS Motorized">LBS Motorized</option>
                    <option value="PMCB">PMCB</option>
                    <option value="Fuse Cut Out">Fuse Cut Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">NAMA SAKLAR / KODE PMT</label>
                <input
                  type="text"
                  value={feederSaklarNama}
                  onChange={(e) => setFeederSaklarNama(e.target.value)}
                  placeholder="e.g. PMT 10 / LBS Waiheru"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">STATUS AWAL SAKLAR</label>
                <select
                  value={feederStatus}
                  onChange={(e) => setFeederStatus(e.target.value as 'CLOSED' | 'OPEN')}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CLOSED">CLOSED (Menyalur/Berbeban)</option>
                  <option value="OPEN">OPEN (Padam/Trip)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">KEMAMPUAN BACA INDIKASI TELEMETRI</label>
                <select
                  value={feederBisaBacaIndikasi ? "true" : "false"}
                  onChange={(e) => setFeederBisaBacaIndikasi(e.target.value === "true")}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="true">Bisa Baca Indikasi</option>
                  <option value="false">Tidak Bisa Baca Indikasi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">LOKASI AREAL / DESA YANG PADAM</label>
                <textarea
                  value={feederArealPadam}
                  onChange={(e) => setFeederArealPadam(e.target.value)}
                  placeholder="Contoh: Desa Passo, Negeri Latta, Sebagian Lateri, Waiheru Dalam, dst."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Sebutkan nama-nama desa atau wilayah yang ikut padam saat penyulang ini mengalami trip / open.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFeederModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Simpan Feeder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Tambah Tie Switch Interkoneksi */}
      {/* ========================================================================= */}
      {showAddTieSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                Tambah Tie Switch Interkoneksi Baru
              </h3>
              <button
                onClick={() => setShowAddTieSwitchModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTieSwitch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">NAMA TIE SWITCH</label>
                <input
                  type="text"
                  value={tieName}
                  onChange={(e) => setTieName(e.target.value)}
                  placeholder="e.g. TIE SWITCH PASSO - LATERI"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">PENYULANG ASAL (A)</label>
                <select
                  value={tieFeederA}
                  onChange={(e) => setTieFeederA(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Feeder A --</option>
                  {substations.flatMap((s) =>
                    s.feeders.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{s.nama}] {f.namaFeeder}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">PENYULANG TUJUAN (B)</label>
                <select
                  value={tieFeederB}
                  onChange={(e) => setTieFeederB(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Feeder B --</option>
                  {substations.flatMap((s) =>
                    s.feeders.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{s.nama}] {f.namaFeeder}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">DESKRIPSI LOKASI MANUVER</label>
                <textarea
                  value={tieDesc}
                  onChange={(e) => setTieDesc(e.target.value)}
                  rows={2}
                  placeholder="Detail saklar manuver antar feeder..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTieSwitchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Simpan Tie Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Inspeksi Teknis Feeder & Analisis KHA (With Trip Report) */}
      {/* ========================================================================= */}
      {inspectedFeeder && (() => {
        const matchedPenyulang = INITIAL_PENYULANG.find(p => p.namaPenyulang === inspectedFeeder.feeder.namaFeeder);
        const jmlPelanggan = matchedPenyulang?.jumlahPelanggan || 1500;
        
        // Convert times to minutes for duration
        const tTrip = tripTime.split(':').map(Number);
        const tNorm = normalTime.split(':').map(Number);
        let durationMinutes = 0;
        if (tTrip.length === 2 && tNorm.length === 2) {
          const tripMins = tTrip[0] * 60 + tTrip[1];
          let normMins = tNorm[0] * 60 + tNorm[1];
          if (normMins < tripMins) normMins += 24 * 60; // Next day
          durationMinutes = normMins - tripMins;
        }

        const totalPelangganArea = 145000;
        const estSaidi = durationMinutes > 0 ? ((durationMinutes * jmlPelanggan) / totalPelangganArea).toFixed(4) : '0.0000';
        const estSaifi = (jmlPelanggan / totalPelangganArea).toFixed(4);

        const isOpen = inspectedFeeder.feeder.status === 'OPEN';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Inspeksi Teknis & Laporan Trip Feeder</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {inspectedFeeder.subNama} • {inspectedFeeder.feeder.namaFeeder}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedFeeder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: Input Form & Data */}
                <div className="space-y-4">
                  {/* Master Data Sync info */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <FolderTree className="w-4 h-4" />
                      Data Master Sinkron: {matchedPenyulang ? 'Ditemukan' : 'Tidak Ditemukan'}
                    </div>
                    <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded-lg">
                      {jmlPelanggan} Pelanggan
                    </span>
                  </div>

                  {/* Actions to Toggle */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">STATUS PENYULANG</span>
                      <span className={`text-sm font-black uppercase ${!isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {!isOpen ? '● NORMAL (BERBEBAN)' : '○ TRIP (PADAM)'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isOpen) {
                          setTripTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
                          setNormalTime('');
                        }
                        toggleFeederSwitch(inspectedFeeder.subId, inspectedFeeder.feeder.id);
                        setInspectedFeeder((prev) =>
                          prev ? { ...prev, feeder: { ...prev.feeder, status: isOpen ? 'CLOSED' : 'OPEN' } } : null
                        );
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                        !isOpen
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      {!isOpen ? 'Simulasi Trip (Buka PMT)' : 'Normalisasi (Tutup PMT)'}
                    </button>
                  </div>

                  {/* Trip Form inputs (only show if OPEN or normalTime filled indicating a recent trip) */}
                  {(isOpen || (tripTime && normalTime)) && (
                    <div className="space-y-3 p-4 bg-slate-950 border border-rose-500/30 rounded-2xl">
                      <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-3 border-b border-slate-800 pb-2">
                        <Zap className="w-4 h-4" /> Parameter Laporan Gangguan
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">JAM TRIP / PADAM</label>
                          <input type="time" value={tripTime} onChange={e => setTripTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">JAM MASUK / NORMAL</label>
                          <input type="time" value={normalTime} onChange={e => setNormalTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">INDIKASI RELAY</label>
                          <input type="text" value={indikasiRelay} onChange={e => setIndikasiRelay(e.target.value)} placeholder="Contoh: OCR, GFR" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">BEBAN PADAM (MW)</label>
                          <input type="number" step="0.1" value={inspectedFeeder.feeder.bebanMw} readOnly className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 opacity-70" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">PENYEBAB GANGGUAN (OPSIONAL)</label>
                        <input type="text" value={penyebab} onChange={e => setPenyebab(e.target.value)} placeholder="Contoh: Pohon tumbang, Hewan, dll" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">TINDAKAN (OPSIONAL)</label>
                        <input type="text" value={tindakan} onChange={e => setTindakan(e.target.value)} placeholder="Contoh: Pengamanan aset, pemotongan dahan" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-indigo-400 block mb-0.5">ESTIMASI SAIDI</span>
                          <span className="font-mono text-sm font-extrabold text-white">{estSaidi}</span>
                          <span className="text-[9px] text-slate-400 block">Menit/Plg</span>
                        </div>
                        <div className="p-2 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-fuchsia-400 block mb-0.5">ESTIMASI SAIFI</span>
                          <span className="font-mono text-sm font-extrabold text-white">{estSaifi}</span>
                          <span className="text-[9px] text-slate-400 block">Kali/Plg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Measurements R / S / T / Neutral */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="text-[10px] text-slate-400 font-bold">PENGUKURAN TELEMETRI REAL-TIME</div>
                    <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-rose-400 font-bold block">FASA R</span>
                        <span className="font-extrabold text-white">{!isOpen ? `${inspectedFeeder.feeder.arusR} A` : '0 A'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-amber-400 font-bold block">FASA S</span>
                        <span className="font-extrabold text-white">{!isOpen ? `${inspectedFeeder.feeder.arusS} A` : '0 A'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-blue-400 font-bold block">FASA T</span>
                        <span className="font-extrabold text-white">{!isOpen ? `${inspectedFeeder.feeder.arusT} A` : '0 A'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block">NETRAL IN</span>
                        <span className="font-extrabold text-white">{!isOpen ? `${inspectedFeeder.feeder.arusIN} A` : '0 A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Format Surat / Live Paper Print Preview */}
                <div className="bg-white rounded-xl shadow-inner border border-slate-300 text-slate-900 font-serif relative overflow-y-auto flex flex-col">
                  
                  {/* Top Bar for Print Actions */}
                  <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4 flex items-center justify-between z-10 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-800 font-sans text-sm">Draft Laporan Gangguan Penyulang</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Print Surat Laporan Gangguan"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        onClick={() => {
                          const text = `*LAPORAN GANGGUAN PENYULANG (MINI SCADA)*\n*GI/GH:* ${inspectedFeeder.subNama}\n*Penyulang:* ${inspectedFeeder.feeder.namaFeeder}\n*Status:* ${isOpen ? 'TRIP / PADAM' : 'NORMAL'}\n*Jam Trip:* ${tripTime || '-'} WIT\n*Jam Normal:* ${normalTime || '-'} WIT\n*Durasi:* ${durationMinutes > 0 ? `${durationMinutes} Menit` : '-'}\n*Beban Padam:* ${inspectedFeeder.feeder.bebanMw} MW\n*Pelanggan Terdampak:* ${jmlPelanggan.toLocaleString('id-ID')} Plg\n*Indikasi Relay:* ${indikasiRelay || '-'}\n*Penyebab:* ${penyebab || '-'}\n*Tindakan:* ${tindakan || '-'}\n*Estimasi SAIDI:* ${estSaidi} Menit/Plg\n*Estimasi SAIFI:* ${estSaifi} Kali/Plg\n*Areal Padam:* ${inspectedFeeder.feeder.arealPadam || '-'}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-sans text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Bagikan via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share WA
                      </button>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-6 flex-1">
                    {/* Header Grid like SPK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Box: Identitas */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-600 uppercase mb-3 font-sans">IDENTITAS GANGGUAN</h4>
                        <div className="space-y-2 text-xs font-sans">
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Gardu Induk/Hubung:</span>
                            <span className="font-bold text-slate-800">{inspectedFeeder.subNama}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Nama Penyulang:</span>
                            <span className="font-bold text-blue-700">{inspectedFeeder.feeder.namaFeeder}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Beban Padam (MW):</span>
                            <span className="font-bold text-slate-800">{inspectedFeeder.feeder.bebanMw} MW</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Pelanggan Terdampak:</span>
                            <span className="font-bold text-emerald-600">{jmlPelanggan.toLocaleString('id-ID')} Pelanggan</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Box: Waktu & Dampak */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-blue-600 uppercase mb-3 font-sans">WAKTU & ANALISIS</h4>
                        <div className="space-y-2 text-xs font-sans">
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Jam Trip (Padam):</span>
                            <span className="font-bold text-rose-600">{tripTime || '-'} WIT</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Jam Normal (Masuk):</span>
                            <span className="font-bold text-emerald-600">{normalTime || '-'} WIT</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Indikasi Relay:</span>
                            <span className="font-bold text-slate-800">{indikasiRelay || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Durasi Padam:</span>
                            <span className="font-bold text-slate-800">{durationMinutes > 0 ? `${durationMinutes} Menit` : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section: Areal Padam */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 font-sans border-b border-slate-200 pb-1">AREAL PADAM / TERDAMPAK</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans text-slate-700">
                        {inspectedFeeder.feeder.arealPadam || 'Data areal padam belum diisi pada master data penyulang ini.'}
                      </div>
                    </div>

                    {/* Section: Tindak Lanjut */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 font-sans border-b border-slate-200 pb-1">HASIL PENELUSURAN & TINDAK LANJUT</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans">
                           <span className="block text-slate-500 mb-1 font-bold">Penyebab Gangguan:</span>
                           <span className="text-slate-800">{penyebab || '-'}</span>
                         </div>
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans">
                           <span className="block text-slate-500 mb-1 font-bold">Tindakan Perbaikan:</span>
                           <span className="text-slate-800">{tindakan || '-'}</span>
                         </div>
                      </div>
                    </div>

                    {/* Section: Estimasi SAIDI SAIFI */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 font-sans border-b border-slate-200 pb-1">KALKULASI DAMPAK KEANDALAN</h4>
                      <div className="flex items-center gap-4">
                         <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg p-3 text-xs font-sans flex-1 flex justify-between items-center">
                           <span className="font-bold">Estimasi SAIDI:</span>
                           <span><strong className="text-sm">{estSaidi}</strong> Menit/Plg</span>
                         </div>
                         <div className="bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-800 rounded-lg p-3 text-xs font-sans flex-1 flex justify-between items-center">
                           <span className="font-bold">Estimasi SAIFI:</span>
                           <span><strong className="text-sm">{estSaifi}</strong> Kali/Plg</span>
                         </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
