export interface LoginBgPreset {
  id: string;
  name: string;
  category: 'EBT' | 'Jaringan 20kV' | 'Gardu & Trafo' | 'Alam & Lanskap' | 'Cyber Modern';
  url: string;
  description: string;
  defaultTurbines?: boolean;
}

export interface LoginBgConfig {
  type: 'preset' | 'custom_url' | 'custom_upload';
  presetId: string;
  customUrl?: string;
  customBase64?: string;
  overlayOpacity: number; // 10 to 90 (%)
  blurLevel: number; // 0 to 10 (px)
  showTurbines: boolean;
  showStreamLines: boolean;
  contrastLevel?: number; // 100 to 150 (%)
}

export const PRESET_LOGIN_BACKGROUNDS: LoginBgPreset[] = [
  {
    id: 'ebt-wind-turbine',
    name: 'EBT Kincir Angin & Hijau (Default)',
    category: 'EBT',
    url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2000&auto=format&fit=crop',
    description: 'Pemandangan ladang kincir angin EBT berlatar belakang alam hijau asri',
    defaultTurbines: true
  },
  {
    id: 'gardu-induk-20kv',
    name: 'Gardu Induk & Trafo Daya 20kV',
    category: 'Gardu & Trafo',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2000&auto=format&fit=crop',
    description: 'Instalasi Gardu Induk kelistrikan tegangan tinggi & distribusi 20kV',
    defaultTurbines: false
  },
  {
    id: 'transmisi-sunset',
    name: 'Menara Transmisi & Senja Emas',
    category: 'Jaringan 20kV',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=2000&auto=format&fit=crop',
    description: 'Siluet menara transmisi listrik membentang dengan langit senja dramatis',
    defaultTurbines: false
  },
  {
    id: 'cyber-electric-grid',
    name: 'Grid Kelistrikan Cyber Blue 20kV',
    category: 'Cyber Modern',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2000&auto=format&fit=crop',
    description: 'Efek futuristik koneksi distribusi energi listrik digital berkecepatan tinggi',
    defaultTurbines: true
  },
  {
    id: 'solar-farm-ebt',
    name: 'Ladang Panel Surya (PLTS EBT)',
    category: 'EBT',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=2000&auto=format&fit=crop',
    description: 'Pembangkit Listrik Tenaga Surya ramah lingkungan masa depan',
    defaultTurbines: false
  },
  {
    id: 'industrial-night-power',
    name: 'Pembangkit Listrik Malam Hari',
    category: 'Gardu & Trafo',
    url: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=2000&auto=format&fit=crop',
    description: 'Kemegahan infrastruktur pembangkit tenaga listrik dengan gemerlap lampu malam',
    defaultTurbines: false
  },
  {
    id: 'alam-maluku-baguala',
    name: 'Pesisir Pantai & Alam Baguala',
    category: 'Alam & Lanskap',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    description: 'Keindahan bentang alam pesisir Maluku wilayah kerja PLN ULP Baguala',
    defaultTurbines: true
  },
  {
    id: 'tiang-jtm-langit-biru',
    name: 'Jaringan Tiang JTM 20kV Bersih',
    category: 'Jaringan 20kV',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop',
    description: 'Tiang distribusi saluran udara tegangan menengah berlatar langit biru cerah',
    defaultTurbines: false
  }
];

export const DEFAULT_LOGIN_BG_CONFIG: LoginBgConfig = {
  type: 'preset',
  presetId: 'ebt-wind-turbine',
  overlayOpacity: 30,
  blurLevel: 0,
  showTurbines: true,
  showStreamLines: true,
  contrastLevel: 125
};

const STORAGE_KEY = 'pln_baguala_login_bg_config';

export const getLoginBgConfig = (): LoginBgConfig => {
  if (typeof window === 'undefined') return DEFAULT_LOGIN_BG_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOGIN_BG_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_LOGIN_BG_CONFIG,
      ...parsed
    };
  } catch {
    return DEFAULT_LOGIN_BG_CONFIG;
  }
};

export const saveLoginBgConfig = (config: LoginBgConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('pln_login_bg_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save login background config:', err);
  }
};

export const resetLoginBgConfig = (): LoginBgConfig => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('pln_login_bg_updated', { detail: DEFAULT_LOGIN_BG_CONFIG }));
    } catch (err) {
      console.error('Failed to reset login background config:', err);
    }
  }
  return DEFAULT_LOGIN_BG_CONFIG;
};

export const getActiveBgImageUrl = (config: LoginBgConfig): string => {
  if (config.type === 'custom_upload' && config.customBase64) {
    return config.customBase64;
  }
  if (config.type === 'custom_url' && config.customUrl) {
    return config.customUrl;
  }
  const preset = PRESET_LOGIN_BACKGROUNDS.find((p) => p.id === config.presetId);
  return preset ? preset.url : DEFAULT_LOGIN_BG_CONFIG.presetId;
};
