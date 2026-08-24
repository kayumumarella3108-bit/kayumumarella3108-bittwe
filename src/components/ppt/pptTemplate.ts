import pptxgen from 'pptxgenjs';

export interface PptElement {
  id: string;
  type: 'title' | 'subtitle' | 'kpi' | 'chart' | 'table' | 'text' | 'image' | 'notes';
  label: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  w: number; // percentage (0-100)
  h: number; // percentage (0-100)
  fontSize?: number; // pt
  fontColor?: string; // hex color e.g. #0F172A
  bgColor?: string; // hex or transparent
  borderColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  visible?: boolean;
  content?: any; // text or chart data or table data
}

export interface PptSlideConfig {
  id: string;
  title: string;
  category: string;
  elements: PptElement[];
}

export interface PptExportData {
  reportTitle: string;
  unitName: string;
  dateStr: string;
  petugasName: string;
  petugasRole: string;
  kpiList: Array<{ title: string; value: string; unit?: string; note?: string; color?: string }>;
  tableHeaders?: string[];
  tableData?: string[][];
  chartImageBase64?: string; // Data URL of chart image rendered from canvas
  chartTitle?: string;
  notesText?: string;
  slides?: PptSlideConfig[];
}

// Generate high-resolution Danantara-PLN SVG background template matching user's image.png
export const getDanantaraPlnBgSvg = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#D7F2F6"/>
        <stop offset="45%" stop-color="#EAF8FA"/>
        <stop offset="100%" stop-color="#F4FCFD"/>
      </linearGradient>
      <linearGradient id="plnMobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00A7BA"/>
        <stop offset="100%" stop-color="#008392"/>
      </linearGradient>
    </defs>

    <!-- Background Canvas -->
    <rect width="1920" height="1080" fill="url(#bgGrad)"/>

    <!-- Left Curved Teal Arc Accent -->
    <path d="M 0,100 C 110,100 110,320 0,320 Z" fill="#1497AC" />

    <!-- TOP LEFT LOGO: Danantara Indonesia -->
    <g transform="translate(35, 32)">
      <!-- Black emblem circle with red & white sash -->
      <circle cx="32" cy="32" r="32" fill="#111827"/>
      <!-- Red swoop -->
      <path d="M 12,34 C 20,20 42,18 52,28 C 40,24 24,32 18,46 Z" fill="#DC2626"/>
      <!-- White swoop -->
      <path d="M 18,46 C 24,32 40,24 52,28 C 42,38 28,46 18,46 Z" fill="#FFFFFF"/>
      
      <!-- Text Danantara Indonesia -->
      <text x="80" y="34" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="900" font-size="34" fill="#111827" letter-spacing="-0.5">Danantara</text>
      <text x="80" y="62" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="800" font-size="30" fill="#111827" letter-spacing="-0.5">Indonesia</text>
    </g>

    <!-- TOP RIGHT LOGO: PLN Logo -->
    <g transform="translate(1650, 32)">
      <!-- Yellow Square Badge -->
      <rect x="0" y="0" width="72" height="72" rx="4" fill="#FFE600"/>
      <!-- Blue Wavy Lines -->
      <path d="M 12,48 Q 22,42 36,48 T 60,48" stroke="#00A3E0" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M 12,58 Q 22,52 36,58 T 60,58" stroke="#00A3E0" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <!-- Red Lightning Bolt -->
      <path d="M 40,8 L 22,36 L 35,36 L 28,64 L 50,30 L 37,30 Z" fill="#E50012"/>
      <!-- Text PLN -->
      <text x="88" y="54" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="900" font-size="46" fill="#00A3E0" letter-spacing="1">PLN</text>
    </g>

    <!-- BOTTOM LEFT LOGO: PLN Mobile App Icon -->
    <g transform="translate(35, 960)">
      <rect x="0" y="0" width="82" height="82" rx="20" fill="url(#plnMobileGrad)"/>
      <path d="M 45,14 L 32,42 L 42,42 L 36,68 L 54,38 L 43,38 Z" fill="#FFE600"/>
      <text x="12" y="52" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">PLN</text>
      <text x="12" y="68" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#FFFFFF">mobile</text>
    </g>

    <!-- BOTTOM RIGHT: Double Chevron Arrow -->
    <g transform="translate(1730, 860)">
      <!-- Outer Translucent Chevron -->
      <path d="M 0,60 L 40,0 L 70,0 L 30,60 L 70,120 L 40,120 Z" fill="#00BCD4" opacity="0.3"/>
      <!-- Inner Chevrons -->
      <path d="M 32,60 L 72,0 L 102,0 L 62,60 L 102,120 L 72,120 Z" fill="#00ACC1" opacity="0.45"/>
      <path d="M 64,60 L 104,0 L 134,0 L 94,60 L 134,120 L 104,120 Z" fill="#0097A7" opacity="0.6"/>
    </g>
  </svg>`;
  return svg;
};

// Converts SVG template into Data URL string
export const getBgDataUrl = (): string => {
  const svg = getDanantaraPlnBgSvg();
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

// Render SVG string into PNG base64 via HTML5 Canvas (for max PPT compatibility)
export const renderBgToPngBase64 = (): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(getBgDataUrl());
      return;
    }
    const img = new Image();
    const svgDataUrl = getBgDataUrl();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1920, 1080);
        try {
          const pngData = canvas.toDataURL('image/png');
          resolve(pngData);
        } catch {
          resolve(svgDataUrl);
        }
      } else {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => {
      resolve(svgDataUrl);
    };
    img.src = svgDataUrl;
  });
};

// Build Default Slide Configuration Deck
export const createDefaultPptSlideDeck = (data: PptExportData): PptSlideConfig[] => {
  return [
    {
      id: 'slide_1_cover',
      title: 'Cover & Ringkasan Laporan',
      category: 'Cover Laporan',
      elements: [
        {
          id: 'title_1',
          type: 'title',
          label: 'Judul Utama Laporan',
          x: 10,
          y: 20,
          w: 80,
          h: 15,
          fontSize: 32,
          fontColor: '#0F172A',
          textAlign: 'center',
          visible: true,
          content: data.reportTitle || 'LAPORAN KEANDALAN SISTEM KELISTRIKAN 20KV'
        },
        {
          id: 'sub_1',
          type: 'subtitle',
          label: 'Sub-Judul & Meta Unit',
          x: 15,
          y: 36,
          w: 70,
          h: 10,
          fontSize: 18,
          fontColor: '#0284C7',
          textAlign: 'center',
          visible: true,
          content: `PT PLN (PERSERO) • ${data.unitName || 'ULP BAGUALA - AMBON'} | ${data.dateStr || new Date().toLocaleDateString('id-ID')}`
        },
        {
          id: 'kpi_box_1',
          type: 'kpi',
          label: 'Metrik Utama (KPI Cards)',
          x: 8,
          y: 50,
          w: 84,
          h: 22,
          visible: true,
          content: data.kpiList || [
            { title: 'Gangguan Trip', value: '0 Kejadian', note: 'Sistem Terkendali Aman', color: '#10B981' },
            { title: 'Realisasi SAIDI', value: '1.25', unit: 'menit/plg', color: '#0284C7' },
            { title: 'Realisasi SAIFI', value: '0.04', unit: 'kali/plg', color: '#8B5CF6' },
            { title: 'Kinerja Feeder', value: '100%', note: 'Normal 20kV', color: '#F59E0B' }
          ]
        },
        {
          id: 'petugas_1',
          type: 'notes',
          label: 'Informasi Pelapor & Unit',
          x: 10,
          y: 76,
          w: 80,
          h: 12,
          fontSize: 12,
          fontColor: '#334155',
          textAlign: 'center',
          visible: true,
          content: `Pelapor: ${data.petugasName || 'Petugas Yantek'} (${data.petugasRole || 'Operator System'}) • Status Laporan: RESMI TERVERIFIKASI`
        }
      ]
    },
    {
      id: 'slide_2_chart',
      title: 'Grafik Visualisasi Data',
      category: 'Grafik & Tren',
      elements: [
        {
          id: 'title_2',
          type: 'title',
          label: 'Judul Slide Grafik',
          x: 8,
          y: 16,
          w: 84,
          h: 8,
          fontSize: 24,
          fontColor: '#0F172A',
          textAlign: 'left',
          visible: true,
          content: data.chartTitle || 'GRAFIK TREN KEANDALAN & GANGGUAN TRIP FEEDER'
        },
        {
          id: 'chart_img_2',
          type: 'chart',
          label: 'Tampilan Grafik (Canvas/Image)',
          x: 8,
          y: 26,
          w: 84,
          h: 58,
          visible: true,
          content: data.chartImageBase64 || null
        },
        {
          id: 'chart_notes_2',
          type: 'notes',
          label: 'Catatan Analisis Grafik',
          x: 8,
          y: 86,
          w: 84,
          h: 8,
          fontSize: 11,
          fontColor: '#475569',
          textAlign: 'left',
          visible: true,
          content: 'Catatan: Data grafik diperbarui secara otomatis dari sistem monitoring keandalan jaringan 20kV PLN ULP Baguala.'
        }
      ]
    },
    {
      id: 'slide_3_table',
      title: 'Tabel Detail & Laporan Kejadian',
      category: 'Data Tabel',
      elements: [
        {
          id: 'title_3',
          type: 'title',
          label: 'Judul Slide Tabel Data',
          x: 8,
          y: 16,
          w: 84,
          h: 8,
          fontSize: 24,
          fontColor: '#0F172A',
          textAlign: 'left',
          visible: true,
          content: 'TABEL RINCIAN KEJADIAN & MONITORING OPERASIONAL'
        },
        {
          id: 'table_3',
          type: 'table',
          label: 'Tabel Data Utama',
          x: 8,
          y: 26,
          w: 84,
          h: 58,
          visible: true,
          content: {
            headers: data.tableHeaders || ['No', 'Nama Penyulang / Feeder', 'Jam Padam', 'Jam Nyala', 'Arus Trip (A)', 'Penyebab / Indikasi'],
            rows: data.tableData || [
              ['1', 'Penyulang Passer (PAS)', '08:15', '08:45', '240 A', 'OHL Sentuhan Pohon Rintisan'],
              ['2', 'Penyulang Baguala (BAG)', '11:20', '11:35', '180 A', 'Relay GFR Trip Transient'],
              ['3', 'Penyulang Passo (PSO)', '14:00', '14:10', '120 A', 'Uji Coba Proteksi Switchgear']
            ]
          }
        },
        {
          id: 'notes_3',
          type: 'notes',
          label: 'Ringkasan Tabel',
          x: 8,
          y: 86,
          w: 84,
          h: 8,
          fontSize: 11,
          fontColor: '#475569',
          textAlign: 'left',
          visible: true,
          content: 'Seluruh tindak lanjut gangguan telah dilaksanakan sesuai SOP Keselamatan Kerja (K3) dan Sertifikat Laik Operasi (SLO).'
        }
      ]
    },
    {
      id: 'slide_4_rekomendasi',
      title: 'Rekomendasi & Penutup',
      category: 'Rekomendasi & Notes',
      elements: [
        {
          id: 'title_4',
          type: 'title',
          label: 'Judul Slide Rekomendasi',
          x: 8,
          y: 18,
          w: 84,
          h: 8,
          fontSize: 24,
          fontColor: '#0F172A',
          textAlign: 'left',
          visible: true,
          content: 'REKOMENDASI TEKNIS & CATATAN PENUTUP'
        },
        {
          id: 'text_4',
          type: 'text',
          label: 'Poin Rekomendasi Utama',
          x: 8,
          y: 28,
          w: 84,
          h: 52,
          fontSize: 14,
          fontColor: '#1E293B',
          textAlign: 'left',
          visible: true,
          content: data.notesText || `1. Melakukan inspeksi thermovision berkala pada sambungan jumper & FCO Gardu Trafo.\n2. Mengintensifkan perintisan pohon (Right of Way / ROW) minimum 2.5 meter dari SUTM 20kV.\n3. Memastikan keandalan batere suplai DC di Gardu Induk & Recloser Otomatis.\n4. Mempercepat tindak lanjut pengaduan pelanggan melalui integrasi PLN Mobile & Yantek.`
        },
        {
          id: 'sign_4',
          type: 'notes',
          label: 'Blok Lembar Pengesahan',
          x: 55,
          y: 80,
          w: 37,
          h: 12,
          fontSize: 12,
          fontColor: '#0F172A',
          textAlign: 'center',
          visible: true,
          content: `Disetujui Oleh:\nManager ULP Baguala\n\n______________________`
        }
      ]
    }
  ];
};

// Export Slide Deck directly to PPTX file via pptxgenjs
export const exportDeckToPptx = async (
  slides: PptSlideConfig[],
  fileName = 'Laporan_Keandalan_PLN_ULP_Baguala.pptx'
) => {
  const pptx = new pptxgen();

  // Set 16:9 Widescreen aspect ratio
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Laporan Keandalan Sistem Kelistrikan 20kV - PLN ULP Baguala';
  pptx.company = 'PT PLN (Persero) - Danantara Indonesia';

  // Render high-res background template
  const bgDataUrl = await renderBgToPngBase64();

  for (const slideConfig of slides) {
    const pptxSlide = pptx.addSlide();

    // Set Danantara-PLN template background
    pptxSlide.background = { data: bgDataUrl };

    for (const el of slideConfig.elements) {
      if (el.visible === false) continue;

      // Convert percentage coordinates (0-100%) to PPT inches (16:9 = 10" x 5.625" or percentage)
      const xPct: any = `${el.x}%`;
      const yPct: any = `${el.y}%`;
      const wPct: any = `${el.w}%`;
      const hPct: any = `${el.h}%`;

      if (el.type === 'title') {
        pptxSlide.addText(el.content || '', {
          x: xPct,
          y: yPct,
          w: wPct,
          h: hPct,
          fontSize: el.fontSize || 26,
          fontFace: 'Arial',
          bold: true,
          color: el.fontColor ? el.fontColor.replace('#', '') : '0F172A',
          align: el.textAlign || 'left',
          valign: 'middle'
        });
      } else if (el.type === 'subtitle' || el.type === 'text' || el.type === 'notes') {
        pptxSlide.addText(el.content || '', {
          x: xPct,
          y: yPct,
          w: wPct,
          h: hPct,
          fontSize: el.fontSize || 14,
          fontFace: 'Arial',
          bold: el.type === 'subtitle',
          color: el.fontColor ? el.fontColor.replace('#', '') : '334155',
          align: el.textAlign || 'left',
          valign: 'top'
        });
      } else if (el.type === 'kpi' && Array.isArray(el.content)) {
        // Render KPI Cards in slide
        const cardCount = el.content.length;
        const cardWidth = Math.max(15, Math.floor(el.w / cardCount) - 2);

        el.content.forEach((kpi: any, idx: number) => {
          const cardX = el.x + idx * (cardWidth + 2);
          const cardColor = kpi.color ? kpi.color.replace('#', '') : '0284C7';

          // Card shape box
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: `${cardX}%` as any,
            y: yPct,
            w: `${cardWidth}%` as any,
            h: hPct,
            fill: { color: 'FFFFFF' },
            line: { color: cardColor, width: 1.5 }
          });

          // KPI Title
          pptxSlide.addText(kpi.title || '', {
            x: `${cardX + 1}%` as any,
            y: `${el.y + 2}%` as any,
            w: `${cardWidth - 2}%` as any,
            h: '4%' as any,
            fontSize: 10,
            bold: true,
            color: '64748B',
            align: 'center'
          });

          // KPI Value
          pptxSlide.addText(`${kpi.value || '0'} ${kpi.unit || ''}`, {
            x: `${cardX + 1}%` as any,
            y: `${el.y + 7}%` as any,
            w: `${cardWidth - 2}%` as any,
            h: '7%' as any,
            fontSize: 18,
            bold: true,
            color: cardColor,
            align: 'center'
          });

          // KPI Note
          if (kpi.note) {
            pptxSlide.addText(kpi.note, {
              x: `${cardX + 1}%` as any,
              y: `${el.y + 15}%` as any,
              w: `${cardWidth - 2}%` as any,
              h: '4%' as any,
              fontSize: 9,
              color: '475569',
              align: 'center'
            });
          }
        });
      } else if (el.type === 'chart' && el.content) {
        // Embed image of chart (base64 PNG)
        try {
          pptxSlide.addImage({
            data: el.content,
            x: xPct,
            y: yPct,
            w: wPct,
            h: hPct
          });
        } catch {
          // Fallback box if chart image fails
          pptxSlide.addText('[ Tampilan Grafik Keandalan ]', {
            x: xPct,
            y: yPct,
            w: wPct,
            h: hPct,
            fontSize: 14,
            align: 'center',
            color: '94A3B8'
          });
        }
      } else if (el.type === 'table' && el.content && el.content.headers) {
        const { headers, rows } = el.content;
        const tableRows = [
          headers.map((h: string) => ({
            text: h,
            options: { bold: true, fill: '0284C7', color: 'FFFFFF', fontSize: 10, align: 'center' }
          })),
          ...(rows || []).map((row: string[], rIdx: number) =>
            row.map((val: string) => ({
              text: val,
              options: {
                fontSize: 9,
                color: '1E293B',
                fill: rIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF',
                align: 'left'
              }
            }))
          )
        ];

        pptxSlide.addTable(tableRows as any, {
          x: xPct,
          y: yPct,
          w: wPct,
          h: hPct,
          border: { type: 'solid', pt: 1, color: 'CBD5E1' }
        });
      }
    }
  }

  await pptx.writeFile({ fileName });
};
