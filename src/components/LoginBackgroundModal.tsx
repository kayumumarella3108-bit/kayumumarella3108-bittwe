import React, { useState, useEffect } from 'react';
import {
  Image,
  Upload,
  Link,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Sliders,
  Wind,
  Zap,
  Eye,
  Trash2,
  Layers,
  Palette
} from 'lucide-react';
import {
  LoginBgConfig,
  PRESET_LOGIN_BACKGROUNDS,
  DEFAULT_LOGIN_BG_CONFIG,
  getLoginBgConfig,
  saveLoginBgConfig,
  resetLoginBgConfig,
  getActiveBgImageUrl
} from '../utils/loginBgStorage';

interface LoginBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newConfig: LoginBgConfig) => void;
}

export const LoginBackgroundModal: React.FC<LoginBackgroundModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [config, setConfig] = useState<LoginBgConfig>(getLoginBgConfig());
  const [activeTab, setActiveTab] = useState<'preset' | 'upload' | 'url' | 'effects'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [previewError, setPreviewError] = useState<string>('');
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const current = getLoginBgConfig();
      setConfig(current);
      if (current.type === 'custom_url' && current.customUrl) {
        setCustomUrlInput(current.customUrl);
      }
      setIsSuccessNotification(false);
      setPreviewError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['Semua', 'Mobil Listrik (EV)', 'EBT', 'Jaringan 20kV', 'Gardu & Trafo', 'Cyber Modern', 'Alam & Lanskap'];

  const filteredPresets = PRESET_LOGIN_BACKGROUNDS.filter((p) => {
    if (selectedCategory === 'Semua') return true;
    return p.category === selectedCategory;
  });

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_LOGIN_BACKGROUNDS.find((p) => p.id === presetId);
    setConfig((prev) => ({
      ...prev,
      type: 'preset',
      presetId,
      showTurbines: preset?.defaultTurbines ?? prev.showTurbines
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPreviewError('File harus berupa format gambar (JPG, PNG, WebP).');
      return;
    }

    // Limit to 4MB for localStorage comfort
    if (file.size > 4 * 1024 * 1024) {
      setPreviewError('Ukuran gambar maksimal 4MB agar performa aplikasi tetap cepat.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        type: 'custom_upload',
        customBase64: base64
      }));
    };
    reader.onerror = () => {
      setPreviewError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      setPreviewError('Silakan masukkan link URL gambar.');
      return;
    }
    setPreviewError('');
    setConfig((prev) => ({
      ...prev,
      type: 'custom_url',
      customUrl: customUrlInput.trim()
    }));
  };

  const handleSave = () => {
    saveLoginBgConfig(config);
    setIsSuccessNotification(true);
    if (onSaved) onSaved(config);
    setTimeout(() => {
      setIsSuccessNotification(false);
      onClose();
    }, 600);
  };

  const handleResetDefault = () => {
    const def = resetLoginBgConfig();
    setConfig(def);
    setCustomUrlInput('');
    setPreviewError('');
    setIsSuccessNotification(true);
    if (onSaved) onSaved(def);
    setTimeout(() => {
      setIsSuccessNotification(false);
    }, 1000);
  };

  const activeImageUrl = getActiveBgImageUrl(config);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-4xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                Ganti Latar Belakang Menu Login
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold uppercase flex items-center gap-1">
                  👑 Khusus Owner
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pengaturan latar belakang login utama (Global Default). Hanya dapat dikelola oleh Owner Sistem.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Preview Card (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Preview Tampilan
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {config.type === 'preset' ? 'Preset Pilihan' : config.type === 'custom_upload' ? 'Upload Sendiri' : 'Custom URL'}
              </span>
            </div>

            {/* Interactive Preview Canvas Window */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-inner flex flex-col items-center justify-center p-4">
              {/* Background Image Layer */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(6,78,59,0.3) 0%, rgba(2,6,23,0.95) 100%), url('${activeImageUrl}')`,
                  opacity: (100 - config.overlayOpacity) / 100,
                  filter: `blur(${config.blurLevel}px) contrast(${config.contrastLevel || 125}%)`
                }}
              />

              {/* Mini Turbines in Preview */}
              {config.showTurbines && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between px-3 pb-0 opacity-40 pointer-events-none">
                  <div className="w-8 h-14 bg-gradient-to-t from-emerald-600/50 to-transparent rounded-t-full" />
                  <div className="w-12 h-20 bg-gradient-to-t from-emerald-500/60 to-transparent rounded-t-full" />
                  <div className="w-9 h-16 bg-gradient-to-t from-emerald-600/50 to-transparent rounded-t-full" />
                </div>
              )}

              {/* Stream Lines in Preview */}
              {config.showStreamLines && (
                <div className="absolute inset-x-0 bottom-4 h-6 border-b border-dashed border-emerald-400/40 pointer-events-none" />
              )}

              {/* Mini Simulated Login Box Card */}
              <div className="relative z-10 w-full max-w-[200px] bg-white/95 rounded-xl p-3 shadow-xl backdrop-blur-xs text-center pointer-events-none space-y-1.5 border border-emerald-500/30">
                <div className="text-[10px] font-black text-slate-900 leading-tight">Perang Padam Baguala</div>
                <div className="text-[8px] text-slate-500 font-medium leading-tight">Digitalisasi Monitoring 20kV</div>
                
                <div className="space-y-1 pt-1">
                  <div className="w-full h-4 bg-slate-100 rounded border border-slate-200 flex items-center px-1.5 text-[7px] text-slate-400">
                    Username...
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded border border-slate-200 flex items-center px-1.5 text-[7px] text-slate-400">
                    ••••••••
                  </div>
                  <div className="w-full h-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded text-[7px] text-white font-bold flex items-center justify-center">
                    Masuk Aplikasi
                  </div>
                </div>
              </div>

              {/* Badge info on top */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-[9px] text-slate-300 font-mono">
                Opacity: {config.overlayOpacity}% • Blur: {config.blurLevel}px
              </div>
            </div>

            {/* Quick Effect Sliders inside Left Column */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Kecerahan Latar (Overlay Kegelapan)
                </span>
                <span className="font-mono text-emerald-400">{config.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="5"
                value={config.overlayOpacity}
                onChange={(e) => setConfig({ ...config, overlayOpacity: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-200 pt-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Efek Blur Latar Belakang
                </span>
                <span className="font-mono text-emerald-400">{config.blurLevel}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={config.blurLevel}
                onChange={(e) => setConfig({ ...config, blurLevel: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-300 hover:text-white">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    Kincir Angin EBT Bergerak
                  </span>
                  <input
                    type="checkbox"
                    checked={config.showTurbines}
                    onChange={(e) => setConfig({ ...config, showTurbines: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-300 hover:text-white">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Garis Animasi Aliran Listrik
                  </span>
                  <input
                    type="checkbox"
                    checked={config.showStreamLines}
                    onChange={(e) => setConfig({ ...config, showStreamLines: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Source Tabs & Presets (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('preset')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'preset'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                <span>Preset PLN ({PRESET_LOGIN_BACKGROUNDS.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Foto</span>
              </button>

              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>
            </div>

            {/* Error Message */}
            {previewError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 font-semibold">
                {previewError}
              </div>
            )}

            {/* TAB 1: PRESET BACKGROUNDS */}
            {activeTab === 'preset' && (
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[380px] pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = config.type === 'preset' && config.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 text-left bg-slate-950 ${
                          isSelected
                            ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                            : 'border-slate-800 hover:border-slate-600 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Thumbnail Image */}
                        <div className="aspect-[16/10] w-full overflow-hidden relative">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[9px] font-bold text-amber-300 border border-slate-700">
                            {preset.category}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="p-2.5 space-y-0.5">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD CUSTOM IMAGE */}
            {activeTab === 'upload' && (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl bg-slate-950/60 text-center transition-colors flex flex-col items-center justify-center space-y-3 group">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Pilih Foto dari Komputer atau HP
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Dukung format JPG, PNG, atau WebP resolusi HD (Maksimal 4MB). Foto akan disimpan di browser Anda.
                    </p>
                  </div>

                  <label className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/30 transition-all">
                    <span>Jelajahi File Gambar...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {config.type === 'custom_upload' && config.customBase64 && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={config.customBase64}
                        alt="Upload Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">Gambar Kustom Terpasang</div>
                        <div className="text-[10px] text-slate-400">Siap diterapkan sebagai latar belakang login</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectPreset('ebt-wind-turbine')}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/60 transition-colors"
                      title="Hapus foto kustom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CUSTOM URL */}
            {activeTab === 'url' && (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3">
                  <label className="block text-xs font-bold text-slate-300">
                    Alamat URL Gambar (Direct Link)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://contoh-gambar.com/latar-pln.jpg"
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                    <button
                      onClick={handleApplyUrl}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shrink-0"
                    >
                      Muat Gambar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pastikan URL mengarah ke file gambar langsung (misal Unsplash, Imgur, atau hosting PLN).
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-900/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default EBT</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isSuccessNotification
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-105'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-blue-600/30'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSuccessNotification ? 'Tersimpan!' : 'Terapkan & Simpan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
