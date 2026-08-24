import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  RotateCcw, 
  Trash2, 
  Check, 
  Maximize2, 
  X, 
  Sparkles,
  CheckCircle2,
  FileSignature
} from 'lucide-react';

interface DigitalSignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  signerName?: string;
  signerTitle?: string;
  penColor?: string;
  lineWidth?: number;
  height?: number;
  disabled?: boolean;
  placeholderText?: string;
  className?: string;
  showFullscreenModal?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  value,
  onChange,
  signerName = 'Penandatangan',
  signerTitle = 'Petugas',
  penColor = '#0f172a',
  lineWidth = 2.5,
  height = 140,
  disabled = false,
  placeholderText = 'Goreskan tanda tangan langsung di area ini (Touchscreen / Mouse / Stylus)',
  className = '',
  showFullscreenModal = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas with proper resolution (DPI scaling)
  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas resolution
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
    
    // If there is existing value and no local drawing has overwritten it yet
    if (value && !hasDrawn) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value, hasDrawn, penColor, lineWidth]);

  useEffect(() => {
    if (canvasRef.current && !value) {
      setupCanvas(canvasRef.current);
    }
  }, [setupCanvas, value]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setupCanvas(canvasRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  // Open modal setup
  useEffect(() => {
    if (isModalOpen && modalCanvasRef.current) {
      setTimeout(() => {
        if (modalCanvasRef.current) {
          setupCanvas(modalCanvasRef.current);
        }
      }, 50);
    }
  }, [isModalOpen, setupCanvas]);

  const getCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (
    e: React.PointerEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ) => {
    if (disabled) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save history before new stroke
    const dpr = window.devicePixelRatio || 1;
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-10), currentState]);

    setIsDrawing(true);
    const point = getCoordinates(e, canvas);
    lastPointRef.current = point;

    ctx.beginPath();
    ctx.arc(point.x, point.y, lineWidth / 3, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
  };

  const draw = (
    e: React.PointerEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPointRef.current) return;
    
    const currentPoint = getCoordinates(e, canvas);
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    lastPointRef.current = currentPoint;
    setHasDrawn(true);
  };

  const stopDrawing = (
    e: React.PointerEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    setIsDrawing(false);
    lastPointRef.current = null;
    
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearCanvas = (targetCanvas?: HTMLCanvasElement | null) => {
    const canvas = targetCanvas || canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setHistory([]);
    onChange(null);
  };

  const undoLastStroke = (targetCanvas?: HTMLCanvasElement | null) => {
    const canvas = targetCanvas || canvasRef.current;
    if (!canvas || history.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(prev => prev.slice(0, -1));
    
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Signature Box Container */}
      <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 shadow-inner relative overflow-hidden transition-all hover:border-slate-600">
        
        {/* Header bar above canvas */}
        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <FileSignature className="w-4 h-4 text-cyan-400" />
            <span>Tanda Tangan Digital ({signerName})</span>
          </div>

          <div className="flex items-center gap-1">
            {showFullscreenModal && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={disabled}
                className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Buka Layar Penuh untuk TTD Lebih Leluasa"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>
            )}

            {(value || hasDrawn) && (
              <button
                type="button"
                onClick={() => clearCanvas()}
                disabled={disabled}
                className="px-2 py-1 text-[11px] bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-rose-800/40"
                title="Hapus dan Buat Ulang Tanda Tangan"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area with Signature Line */}
        <div 
          className="relative bg-white rounded-lg border border-slate-300 overflow-hidden shadow-xs cursor-crosshair touch-none select-none"
          style={{ height: `${height}px` }}
        >
          {/* Subtle baseline for signing */}
          <div className="absolute left-6 right-6 bottom-7 border-b border-dashed border-slate-300 pointer-events-none flex justify-between items-center">
            <span className="text-[9px] text-slate-400 font-sans tracking-wide">
              Tanda Tangan: {signerName} ({signerTitle})
            </span>
            <span className="text-[9px] text-slate-300 font-mono">
              PLN ULP BAGUALA
            </span>
          </div>

          {/* Prompt text when empty */}
          {!value && !hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
              <PenTool className="w-5 h-5 text-slate-300 mb-1 opacity-60 animate-bounce" />
              <p className="text-[11px] font-semibold text-slate-400 leading-tight">
                {placeholderText}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 opacity-80">
                (Tanda tangan akan otomatis tersimpan & tertera di lembar cetak dokumen)
              </p>
            </div>
          )}

          {/* Interactive Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => startDrawing(e, canvasRef.current!)}
            onPointerMove={(e) => draw(e, canvasRef.current!)}
            onPointerUp={(e) => stopDrawing(e, canvasRef.current!)}
            onPointerLeave={(e) => stopDrawing(e, canvasRef.current!)}
            className="w-full h-full block bg-transparent"
            style={{ touchAction: 'none' }}
          />

          {/* Verified Badge Overlay if signed */}
          {(value || hasDrawn) && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded-md text-[9px] font-bold text-emerald-800 flex items-center gap-1 shadow-2xs pointer-events-none">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>TERTANDATANGANI DIGITAL</span>
            </div>
          )}
        </div>

        {/* Footer info & helper */}
        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Format TTD resmi PLN ULP Baguala
          </span>
          {value && (
            <span className="text-emerald-400 font-semibold font-mono">
              ✓ Siap dicetak pada laporan
            </span>
          )}
        </div>

      </div>

      {/* FULLSCREEN / EXPANDED SIGNATURE MODAL (Ideal for Tablets & Mobile Screens) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Tanda Tangan Digital Layar Penuh
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gunakan jari atau stylus untuk tanda tangan yang lebih leluasa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Canvas Pad */}
            <div 
              className="relative bg-white rounded-xl border-2 border-dashed border-slate-400 overflow-hidden shadow-inner cursor-crosshair touch-none select-none h-64 sm:h-80"
            >
              {/* Baseline */}
              <div className="absolute left-8 right-8 bottom-10 border-b-2 border-dashed border-slate-300 pointer-events-none flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Tanda Tangan: {signerName}
                </span>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  PT PLN (PERSERO)
                </span>
              </div>

              {!value && !hasDrawn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                  <PenTool className="w-8 h-8 text-slate-300 mb-2 opacity-70 animate-bounce" />
                  <p className="text-sm font-bold text-slate-500">
                    Goreskan tanda tangan Anda di area putih ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gunakan jari atau stylus dengan gerakan alami
                  </p>
                </div>
              )}

              <canvas
                ref={modalCanvasRef}
                onPointerDown={(e) => startDrawing(e, modalCanvasRef.current!)}
                onPointerMove={(e) => draw(e, modalCanvasRef.current!)}
                onPointerUp={(e) => stopDrawing(e, modalCanvasRef.current!)}
                onPointerLeave={(e) => stopDrawing(e, modalCanvasRef.current!)}
                className="w-full h-full block bg-transparent"
                style={{ touchAction: 'none' }}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => undoLastStroke(modalCanvasRef.current)}
                  disabled={history.length === 0}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearCanvas(modalCanvasRef.current)}
                  className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-800/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (modalCanvasRef.current) {
                    const dataUrl = modalCanvasRef.current.toDataURL('image/png');
                    onChange(dataUrl);
                  }
                  setIsModalOpen(false);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Tanda Tangan</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
