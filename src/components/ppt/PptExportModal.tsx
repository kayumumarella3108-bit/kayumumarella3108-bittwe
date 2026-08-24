import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Move,
  Layout,
  Type,
  Maximize2,
  RotateCcw,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  Grid,
  Layers,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';
import {
  PptSlideConfig,
  PptElement,
  PptExportData,
  createDefaultPptSlideDeck,
  exportDeckToPptx,
  getBgDataUrl
} from './pptTemplate';

interface PptExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: PptExportData;
}

export const PptExportModal: React.FC<PptExportModalProps> = ({
  isOpen,
  onClose,
  exportData
}) => {
  const [slides, setSlides] = useState<PptSlideConfig[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [dragState, setDragState] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize slide deck when modal opens or exportData changes
  useEffect(() => {
    if (isOpen) {
      if (exportData.slides && exportData.slides.length > 0) {
        setSlides(exportData.slides);
      } else {
        const defaultDeck = createDefaultPptSlideDeck(exportData);
        setSlides(defaultDeck);
      }
      setActiveSlideIndex(0);
      setSelectedElementId(null);
    }
  }, [isOpen, exportData]);

  if (!isOpen) return null;

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Selected element helper
  const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId) || null;

  // Handle Dragging Element on Canvas
  const handleMouseDown = (e: React.MouseEvent, elementId: string, origX: number, origY: number) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    setDragState({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    const deltaXPct = Math.round((deltaX / rect.width) * 100);
    const deltaYPct = Math.round((deltaY / rect.height) * 100);

    let newX = Math.max(0, Math.min(90, dragState.origX + deltaXPct));
    let newY = Math.max(0, Math.min(90, dragState.origY + deltaYPct));

    // Snap to 2% grid if enabled
    if (showGrid) {
      newX = Math.round(newX / 2) * 2;
      newY = Math.round(newY / 2) * 2;
    }

    updateElementProps(dragState.elementId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Update properties of an element in current slide
  const updateElementProps = (elementId: string, updates: Partial<PptElement>) => {
    setSlides(prevSlides =>
      prevSlides.map((slide, sIdx) => {
        if (sIdx !== activeSlideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements.map(el => {
            if (el.id !== elementId) return el;
            return { ...el, ...updates };
          })
        };
      })
    );
  };

  // Toggle Visibility of Element
  const toggleElementVisibility = (elementId: string) => {
    const el = currentSlide.elements.find(e => e.id === elementId);
    if (el) {
      updateElementProps(elementId, { visible: !el.visible });
    }
  };

  // Delete Element
  const handleDeleteElement = (elementId: string) => {
    setSlides(prevSlides =>
      prevSlides.map((slide, sIdx) => {
        if (sIdx !== activeSlideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements.filter(el => el.id !== elementId)
        };
      })
    );
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Add Custom Text/Note Element to active slide
  const handleAddTextElement = () => {
    const newEl: PptElement = {
      id: `custom_text_${Date.now()}`,
      type: 'text',
      label: 'Teks Catatan Baru',
      x: 10,
      y: 70,
      w: 80,
      h: 12,
      fontSize: 14,
      fontColor: '#0F172A',
      textAlign: 'left',
      visible: true,
      content: 'Tuliskan catatan tambahan atau instruksi di sini...'
    };

    setSlides(prevSlides =>
      prevSlides.map((slide, sIdx) => {
        if (sIdx !== activeSlideIndex) return slide;
        return {
          ...slide,
          elements: [...slide.elements, newEl]
        };
      })
    );
    setSelectedElementId(newEl.id);
  };

  // Add New Custom Blank Slide
  const handleAddNewSlide = () => {
    const newSlideId = `slide_custom_${Date.now()}`;
    const newSlide: PptSlideConfig = {
      id: newSlideId,
      title: `Slide Baru ${slides.length + 1}`,
      category: 'Kustom',
      elements: [
        {
          id: `title_${newSlideId}`,
          type: 'title',
          label: 'Judul Slide',
          x: 8,
          y: 18,
          w: 84,
          h: 10,
          fontSize: 26,
          fontColor: '#0F172A',
          textAlign: 'left',
          visible: true,
          content: 'JUDUL SLIDE KHUSUS LAPORAN'
        },
        {
          id: `text_${newSlideId}`,
          type: 'text',
          label: 'Konten Teks',
          x: 8,
          y: 32,
          w: 84,
          h: 50,
          fontSize: 14,
          fontColor: '#334155',
          textAlign: 'left',
          visible: true,
          content: 'Tambahkan poin penting, penjelasan teknis, atau temuan lapangan di sini.'
        }
      ]
    };

    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setSelectedElementId(null);
  };

  // Delete Slide
  const handleDeleteSlide = (sIdx: number) => {
    if (slides.length <= 1) return;
    const newDeck = slides.filter((_, idx) => idx !== sIdx);
    setSlides(newDeck);
    setActiveSlideIndex(Math.max(0, sIdx - 1));
    setSelectedElementId(null);
  };

  // Move Slide Order
  const handleMoveSlide = (sIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const newDeck = [...slides];
    const temp = newDeck[sIdx];
    newDeck[sIdx] = newDeck[targetIdx];
    newDeck[targetIdx] = temp;

    setSlides(newDeck);
    setActiveSlideIndex(targetIdx);
  };

  // Reset Standard Slide Layout
  const handleResetLayout = () => {
    const defaultDeck = createDefaultPptSlideDeck(exportData);
    setSlides(defaultDeck);
    setSelectedElementId(null);
  };

  // Trigger PPTX Export File Download
  const handleExportPptx = async () => {
    setIsExporting(true);
    try {
      const fileName = `Laporan_Keandalan_PLN_${exportData.unitName?.replace(/\s+/g, '_') || 'ULP_Baguala'}_${new Date().toISOString().split('T')[0]}.pptx`;
      await exportDeckToPptx(slides, fileName);
    } catch (err) {
      console.error('Error exporting PPTX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const bgUrl = getBgDataUrl();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col text-slate-100 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Prinjau & Editor Tata Letak PPT PowerPoint
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Template Danantara & PLN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur posisi elemen, edit teks, atau geser grafik secara presisi sebelum mengunduh file presentation .pptx
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showGrid
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Garis Bantu Grid</span>
            </button>

            <button
              onClick={handleResetLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Posisi</span>
            </button>

            <button
              onClick={handleExportPptx}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30 border border-sky-400/40 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses PPTX...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh File PPT (.pptx)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY EDITOR */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-950/60">
          
          {/* LEFT COLUMN: SLIDE NAVIGATION */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2 bg-slate-900/90 border-r border-slate-800/80 p-3 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Daftar Slide ({slides.length})
              </span>
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
              {slides.map((slide, sIdx) => {
                const isActive = sIdx === activeSlideIndex;
                return (
                  <div
                    key={slide.id}
                    onClick={() => {
                      setActiveSlideIndex(sIdx);
                      setSelectedElementId(null);
                    }}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-950/60 border-sky-500/80 text-white shadow-md shadow-sky-950/50'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Thumbnail Preview Aspect Ratio Box */}
                    <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2 border border-slate-700/50 flex items-center justify-center">
                      <img
                        src={bgUrl}
                        alt="Bg Template"
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                      />
                      <div className="relative z-10 px-2 py-1 bg-slate-950/80 backdrop-blur rounded text-[10px] font-bold text-sky-300 truncate max-w-[90%]">
                        {slide.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-200 truncate">
                        {sIdx + 1}. {slide.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(sIdx, 'up');
                          }}
                          disabled={sIdx === 0}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(sIdx, 'down');
                          }}
                          disabled={sIdx === slides.length - 1}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlide(sIdx);
                            }}
                            className="p-1 hover:bg-rose-500/20 rounded text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddNewSlide}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-sky-500/40 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Slide Baru</span>
            </button>
          </div>

          {/* CENTER COLUMN: LIVE 16:9 SLIDE PREVIEW CANVAS */}
          <div
            className="col-span-12 md:col-span-6 lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center overflow-auto relative select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* CANVAS CONTAINER (Aspect Ratio 16:9 Widescreen) */}
            <div className="w-full max-w-4xl flex flex-col items-center">
              
              {/* Canvas Bar Status */}
              <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  Prinjau Slide {activeSlideIndex + 1} dari {slides.length}:{' '}
                  <span className="text-sky-400 font-bold">{currentSlide?.title}</span>
                </span>
                <span className="text-[11px] bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-slate-400">
                  Resolusi Output: 16:9 PowerPoint Widescreen
                </span>
              </div>

              {/* SLIDE CANVAS STAGE */}
              <div
                ref={canvasRef}
                onClick={() => setSelectedElementId(null)}
                className="relative w-full aspect-video rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden bg-white cursor-crosshair"
                style={{
                  backgroundImage: `url(${bgUrl})`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center'
                }}
              >
                {/* Optional Grid Overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-15"
                    style={{
                      backgroundImage: `linear-gradient(to right, #00A3E0 1px, transparent 1px), linear-gradient(to bottom, #00A3E0 1px, transparent 1px)`,
                      backgroundSize: '10% 10%'
                    }}
                  />
                )}

                {/* SLIDE ELEMENTS RENDERING */}
                {currentSlide?.elements.map(el => {
                  if (el.visible === false) return null;
                  const isSelected = selectedElementId === el.id;

                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
                      className={`absolute cursor-grab active:cursor-grabbing transition-shadow z-20 group rounded-md p-1 ${
                        isSelected
                          ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-black/20 bg-sky-500/10 border border-sky-400 shadow-xl'
                          : 'hover:outline hover:outline-1 hover:outline-sky-400/60'
                      }`}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.w}%`,
                        height: `${el.h}%`
                      }}
                    >
                      {/* Selection Drag Handle Badge */}
                      {isSelected && (
                        <div className="absolute -top-3 -left-2 bg-sky-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-30">
                          <Move className="w-2.5 h-2.5" />
                          <span>{el.label} (X:{el.x}%, Y:{el.y}%)</span>
                        </div>
                      )}

                      {/* Render Element Content Types */}
                      {el.type === 'title' && (
                        <div
                          className="w-full h-full font-black flex items-center leading-tight tracking-tight"
                          style={{
                            fontSize: `${Math.max(12, (el.fontSize || 26) * 0.55)}px`,
                            color: el.fontColor || '#0F172A',
                            justifyContent:
                              el.textAlign === 'center'
                                ? 'center'
                                : el.textAlign === 'right'
                                ? 'flex-end'
                                : 'flex-start'
                          }}
                        >
                          {el.content}
                        </div>
                      )}

                      {(el.type === 'subtitle' || el.type === 'text' || el.type === 'notes') && (
                        <div
                          className="w-full h-full whitespace-pre-wrap overflow-hidden leading-snug"
                          style={{
                            fontSize: `${Math.max(10, (el.fontSize || 14) * 0.55)}px`,
                            color: el.fontColor || '#334155',
                            textAlign: el.textAlign || 'left'
                          }}
                        >
                          {el.content}
                        </div>
                      )}

                      {el.type === 'kpi' && Array.isArray(el.content) && (
                        <div className="w-full h-full grid grid-cols-4 gap-2 items-center">
                          {el.content.map((kpi: any, kIdx: number) => (
                            <div
                              key={kIdx}
                              className="bg-white/90 backdrop-blur border border-sky-200/80 rounded-lg p-2 flex flex-col justify-between shadow-sm h-full"
                              style={{ borderColor: kpi.color || '#0284C7' }}
                            >
                              <span className="text-[10px] font-bold text-slate-500 truncate">
                                {kpi.title}
                              </span>
                              <span
                                className="text-xs sm:text-sm font-black"
                                style={{ color: kpi.color || '#0284C7' }}
                              >
                                {kpi.value} <span className="text-[9px] font-semibold">{kpi.unit || ''}</span>
                              </span>
                              {kpi.note && (
                                <span className="text-[8px] text-slate-500 truncate">
                                  {kpi.note}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {el.type === 'chart' && (
                        <div className="w-full h-full bg-slate-900/10 border border-sky-400/30 rounded-lg overflow-hidden flex items-center justify-center p-1">
                          {el.content ? (
                            <img
                              src={el.content}
                              alt="Chart Export"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400 text-xs">
                              <BarChart2 className="w-8 h-8 text-sky-500" />
                              <span>[ Visual Grafik Keandalan ]</span>
                            </div>
                          )}
                        </div>
                      )}

                      {el.type === 'table' && el.content && el.content.headers && (
                        <div className="w-full h-full overflow-hidden bg-white border border-slate-300 rounded-md text-[9px]">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-sky-600 text-white font-bold">
                                {el.content.headers.map((h: string, hIdx: number) => (
                                  <th key={hIdx} className="p-1 border border-sky-500 text-left">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(el.content.rows || []).slice(0, 4).map((row: string[], rIdx: number) => (
                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                  {row.map((val: string, vIdx: number) => (
                                    <td key={vIdx} className="p-1 border border-slate-200 text-slate-800 truncate">
                                      {val}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Helper Drag Tip */}
              <div className="mt-3 flex items-center justify-between w-full text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  Petunjuk: Klik dan **drag (geser)** kotak elemen pada kanvas di atas untuk menyesuaikan posisinya.
                </span>
                <button
                  onClick={handleAddTextElement}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Teks Baru</span>
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED ELEMENT INSPECTOR & POSITION EDITOR */}
          <div className="col-span-12 md:col-span-3 lg:col-span-3 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-sky-400" />
                <span>Pengaturan Elemen Slide</span>
              </h3>
            </div>

            {selectedElement ? (
              <div className="flex flex-col gap-4 text-xs">
                
                {/* Element Name & Type Header */}
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-sky-400">
                      Tipe: {selectedElement.type}
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedElement.label}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleElementVisibility(selectedElement.id)}
                      className={`p-1.5 rounded-lg border ${
                        selectedElement.visible !== false
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}
                      title="Tampilkan / Sembunyikan"
                    >
                      {selectedElement.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteElement(selectedElement.id)}
                      className="p-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/30"
                      title="Hapus Elemen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* POSITION COORDINATES & SIZE SLIDERS */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <span className="font-extrabold text-slate-300 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-sky-400" />
                    <span>Koordinat Posisi & Ukuran (%)</span>
                  </span>

                  {/* Slider X */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Posisi X (Kiri):</span>
                      <span className="font-bold text-sky-400">{selectedElement.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={selectedElement.x}
                      onChange={(e) => updateElementProps(selectedElement.id, { x: parseInt(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider Y */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Posisi Y (Atas):</span>
                      <span className="font-bold text-sky-400">{selectedElement.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={selectedElement.y}
                      onChange={(e) => updateElementProps(selectedElement.id, { y: parseInt(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider Width */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Lebar (Width):</span>
                      <span className="font-bold text-sky-400">{selectedElement.w}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedElement.w}
                      onChange={(e) => updateElementProps(selectedElement.id, { w: parseInt(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider Height */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Tinggi (Height):</span>
                      <span className="font-bold text-sky-400">{selectedElement.h}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={selectedElement.h}
                      onChange={(e) => updateElementProps(selectedElement.id, { h: parseInt(e.target.value) })}
                      className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Quick Preset Alignments */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Preset Posisi Cepat:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => updateElementProps(selectedElement.id, { x: 8, w: 84 })}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 rounded border border-slate-700"
                      >
                        Penuh Tengah
                      </button>
                      <button
                        onClick={() => updateElementProps(selectedElement.id, { x: 8, w: 40 })}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 rounded border border-slate-700"
                      >
                        Sisi Kiri
                      </button>
                      <button
                        onClick={() => updateElementProps(selectedElement.id, { x: 52, w: 40 })}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 rounded border border-slate-700"
                      >
                        Sisi Kanan
                      </button>
                    </div>
                  </div>
                </div>

                {/* TEXT CONTENT & TYPOGRAPHY EDITOR */}
                {(selectedElement.type === 'title' ||
                  selectedElement.type === 'subtitle' ||
                  selectedElement.type === 'text' ||
                  selectedElement.type === 'notes') && (
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
                    <span className="font-extrabold text-slate-300 flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-sky-400" />
                      <span>Isi Teks & Format</span>
                    </span>

                    {/* Textarea Input */}
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Teks Elemen:</label>
                      <textarea
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElementProps(selectedElement.id, { content: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Font Size & Color */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 mb-1 block">Ukuran Font (pt):</label>
                        <input
                          type="number"
                          min="8"
                          max="60"
                          value={selectedElement.fontSize || 14}
                          onChange={(e) => updateElementProps(selectedElement.id, { fontSize: parseInt(e.target.value) || 14 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 mb-1 block">Warna Teks:</label>
                        <input
                          type="color"
                          value={selectedElement.fontColor || '#0F172A'}
                          onChange={(e) => updateElementProps(selectedElement.id, { fontColor: e.target.value })}
                          className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg p-0.5 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Alignment Controls */}
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Rata Teks:</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => updateElementProps(selectedElement.id, { textAlign: 'left' })}
                          className={`p-1.5 flex justify-center rounded ${
                            selectedElement.textAlign === 'left' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateElementProps(selectedElement.id, { textAlign: 'center' })}
                          className={`p-1.5 flex justify-center rounded ${
                            selectedElement.textAlign === 'center' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateElementProps(selectedElement.id, { textAlign: 'right' })}
                          className={`p-1.5 flex justify-center rounded ${
                            selectedElement.textAlign === 'right' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                <Move className="w-8 h-8 text-slate-600" />
                <span className="text-xs font-semibold text-slate-400">Pilih Elemen Pada Kanvas Slide</span>
                <p className="text-[11px] text-slate-500">
                  Klik salah satu kotak judul, grafik, atau tabel pada kanvas di tengah untuk mengubah koordinat dan ukuran posisinya.
                </p>
              </div>
            )}

            {/* List of all elements in active slide for quick selection */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Semua Elemen Pada Slide Ini ({currentSlide?.elements.length})
              </span>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {currentSlide?.elements.map(el => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                      selectedElementId === el.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{el.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">{el.x}%,{el.y}%</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
