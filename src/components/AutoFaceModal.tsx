import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Wand2,
  Sliders,
  Eye,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Zap,
  Brush,
  Eraser,
  Layers,
  Trash2,
  RefreshCw,
  Circle,
  MousePointer,
  Sun,
  Flame,
} from "lucide-react";
import { processAdvancedAutoFace, AutoFaceParams } from "../utils/imageTools";
import { BEAUTY_ONE_CLICK_FILTERS } from "../data/beautyFilters";
import { BeautyOneClickFilter } from "../types";

interface AutoFaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc: string;
  initialParams?: AutoFaceParams;
  initialFilterId?: string;
  onApplyNewImage: (newImageDataUrl: string, actionTitle: string, appliedParams?: AutoFaceParams) => void;
}

type ApplicationZoneMode = "full" | "brush";

const PRESETS = [
  {
    name: "Naturel & Subtil",
    desc: "Correction douce, conserve le grain naturel de la peau",
    params: {
      blemishRemoval: 50,
      gaussianBlurRadius: 4,
      sensitivity: 50,
      preserveDetails: 85,
      skinWarmth: 0,
    },
  },
  {
    name: "Équilibré Studio",
    desc: "Élimination efficace des boutons avec lissage homogène",
    params: {
      blemishRemoval: 75,
      gaussianBlurRadius: 8,
      sensitivity: 70,
      preserveDetails: 75,
      skinWarmth: 10,
    },
  },
  {
    name: "Peau Parfaite (Zéro Défaut)",
    desc: "Gomme les imperfections et floute intensément les zones tachetées",
    params: {
      blemishRemoval: 95,
      gaussianBlurRadius: 14,
      sensitivity: 85,
      preserveDetails: 60,
      skinWarmth: 15,
    },
  },
  {
    name: "Correction Boutons Seuls",
    desc: "Nettoie uniquement les taches et boutons sans flouter la peau",
    params: {
      blemishRemoval: 100,
      gaussianBlurRadius: 0,
      sensitivity: 90,
      preserveDetails: 95,
      skinWarmth: 0,
    },
  },
];

export const AutoFaceModal: React.FC<AutoFaceModalProps> = ({
  isOpen,
  onClose,
  originalImageSrc,
  initialParams,
  initialFilterId,
  onApplyNewImage,
}) => {
  const [params, setParams] = useState<AutoFaceParams>(() => {
    return initialParams ? { ...initialParams } : {
      blemishRemoval: 80,
      gaussianBlurRadius: 8,
      sensitivity: 75,
      preserveDetails: 75,
      skinWarmth: 5,
      glowIntensity: 40,
      eyeLipPop: 40,
      toneEvenness: 70,
    };
  });

  const [previewSrc, setPreviewSrc] = useState<string>(originalImageSrc);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    if (initialFilterId) {
      const f = BEAUTY_ONE_CLICK_FILTERS.find((filter) => filter.id === initialFilterId);
      if (f) return f.name;
    }
    return "Équilibré Studio";
  });
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Sync initial parameters whenever modal is opened with new props
  useEffect(() => {
    if (isOpen) {
      if (initialParams) {
        setParams({ ...initialParams });
        if (initialFilterId) {
          const matched = BEAUTY_ONE_CLICK_FILTERS.find((f) => f.id === initialFilterId);
          setActivePreset(matched ? matched.name : "Personnalisé");
        }
      }
    }
  }, [isOpen, initialParams, initialFilterId]);

  // Zone selection state
  const [zoneMode, setZoneMode] = useState<ApplicationZoneMode>("full");
  const [brushSize, setBrushSize] = useState<number>(40);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(true);
  const [hasPaintedMask, setHasPaintedMask] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image onto offscreen canvas & initialize mask canvas
  useEffect(() => {
    if (!originalImageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalImageSrc;
    img.onload = () => {
      imgRef.current = img;
      const cvs = document.createElement("canvas");
      const maxDim = 1200;
      let w = img.naturalWidth || 1200;
      let h = img.naturalHeight || 900;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        canvasRef.current = cvs;
      }

      // Init offscreen mask canvas
      const mCvs = document.createElement("canvas");
      mCvs.width = w;
      mCvs.height = h;
      maskCanvasRef.current = mCvs;
      setHasPaintedMask(false);

      renderPreview(params, null);
    };
  }, [originalImageSrc]);

  // Sync visible overlay mask canvas
  const updateOverlayVisual = useCallback(() => {
    const mCvs = maskCanvasRef.current;
    const oCvs = overlayCanvasRef.current;
    if (!mCvs || !oCvs) return;

    oCvs.width = mCvs.width;
    oCvs.height = mCvs.height;
    const oCtx = oCvs.getContext("2d");
    if (!oCtx) return;

    oCtx.clearRect(0, 0, oCvs.width, oCvs.height);

    if (zoneMode === "brush" && showMaskOverlay) {
      oCtx.save();
      oCtx.fillStyle = "rgba(16, 185, 129, 0.4)"; // Soft Emerald tint for painted mask
      oCtx.drawImage(mCvs, 0, 0);
      oCtx.globalCompositeOperation = "source-in";
      oCtx.fillRect(0, 0, oCvs.width, oCvs.height);
      oCtx.restore();
    }
  }, [zoneMode, showMaskOverlay]);

  // Debounced/throttled preview generation
  const renderPreview = useCallback((currentParams: AutoFaceParams, activeMask: HTMLCanvasElement | null) => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    setTimeout(() => {
      if (canvasRef.current) {
        const resultUrl = processAdvancedAutoFace(
          canvasRef.current,
          currentParams,
          activeMask
        );
        setPreviewSrc(resultUrl);
      }
      setIsProcessing(false);
    }, 10);
  }, []);

  const handleParamChange = (key: keyof AutoFaceParams, value: number) => {
    setActivePreset(null);
    const updated = { ...params, [key]: value };
    setParams(updated);
    renderPreview(updated, zoneMode === "brush" && hasPaintedMask ? maskCanvasRef.current : null);
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setActivePreset(preset.name);
    setParams(preset.params);
    renderPreview(preset.params, zoneMode === "brush" && hasPaintedMask ? maskCanvasRef.current : null);
  };

  const handleResetParams = () => {
    const defaultParams = PRESETS[1].params;
    setActivePreset("Équilibré Studio");
    setParams(defaultParams);
    renderPreview(defaultParams, zoneMode === "brush" && hasPaintedMask ? maskCanvasRef.current : null);
  };

  // Brush drawing logic on mask canvas
  const drawOnMask = (clientX: number, clientY: number) => {
    const mCvs = maskCanvasRef.current;
    const container = imageContainerRef.current;
    if (!mCvs || !container) return;

    const imgEl = container.querySelector("img");
    if (!imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;

    const cx = relX * mCvs.width;
    const cy = relY * mCvs.height;
    const scaledRadius = (brushSize / rect.width) * mCvs.width;

    const mCtx = mCvs.getContext("2d");
    if (!mCtx) return;

    mCtx.save();
    if (isEraser) {
      mCtx.globalCompositeOperation = "destination-out";
      mCtx.beginPath();
      mCtx.arc(cx, cy, scaledRadius, 0, Math.PI * 2);
      mCtx.fill();
    } else {
      mCtx.globalCompositeOperation = "source-over";
      mCtx.fillStyle = "#ffffff";
      mCtx.beginPath();
      mCtx.arc(cx, cy, scaledRadius, 0, Math.PI * 2);
      mCtx.fill();
    }
    mCtx.restore();

    setHasPaintedMask(true);
    updateOverlayVisual();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoneMode !== "brush") return;
    setIsDrawing(true);
    drawOnMask(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (zoneMode !== "brush" || !isDrawing) return;
    drawOnMask(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    if (zoneMode !== "brush" || !isDrawing) return;
    setIsDrawing(false);
    renderPreview(params, maskCanvasRef.current);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoneMode !== "brush" || e.touches.length === 0) return;
    setIsDrawing(true);
    drawOnMask(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoneMode !== "brush" || !isDrawing || e.touches.length === 0) return;
    drawOnMask(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (zoneMode !== "brush" || !isDrawing) return;
    setIsDrawing(false);
    renderPreview(params, maskCanvasRef.current);
  };

  // Mask clearing & inversion helpers
  const handleClearMask = () => {
    const mCvs = maskCanvasRef.current;
    if (mCvs) {
      const mCtx = mCvs.getContext("2d");
      mCtx?.clearRect(0, 0, mCvs.width, mCvs.height);
    }
    setHasPaintedMask(false);
    updateOverlayVisual();
    renderPreview(params, null);
  };

  const handleFillAllMask = () => {
    const mCvs = maskCanvasRef.current;
    if (mCvs) {
      const mCtx = mCvs.getContext("2d");
      if (mCtx) {
        mCtx.fillStyle = "#ffffff";
        mCtx.fillRect(0, 0, mCvs.width, mCvs.height);
      }
    }
    setHasPaintedMask(true);
    updateOverlayVisual();
    renderPreview(params, mCvs);
  };

  const handleSwitchZoneMode = (mode: ApplicationZoneMode) => {
    setZoneMode(mode);
    if (mode === "full") {
      renderPreview(params, null);
    } else {
      updateOverlayVisual();
      renderPreview(params, hasPaintedMask ? maskCanvasRef.current : null);
    }
  };

  useEffect(() => {
    updateOverlayVisual();
  }, [zoneMode, showMaskOverlay, updateOverlayVisual]);

  // Apply to full-resolution image
  const handleApply = () => {
    if (!originalImageSrc) return;
    setIsProcessing(true);

    const fullImg = new Image();
    fullImg.crossOrigin = "anonymous";
    fullImg.src = originalImageSrc;
    fullImg.onload = () => {
      const fullCanvas = document.createElement("canvas");
      const fw = fullImg.naturalWidth || 1600;
      const fh = fullImg.naturalHeight || 1200;
      fullCanvas.width = fw;
      fullCanvas.height = fh;

      const ctx = fullCanvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(fullImg, 0, 0);

      let finalMaskCanvas: HTMLCanvasElement | null = null;
      if (zoneMode === "brush" && hasPaintedMask && maskCanvasRef.current) {
        finalMaskCanvas = document.createElement("canvas");
        finalMaskCanvas.width = fw;
        finalMaskCanvas.height = fh;
        const fmCtx = finalMaskCanvas.getContext("2d");
        if (fmCtx) {
          fmCtx.drawImage(maskCanvasRef.current, 0, 0, fw, fh);
        }
      }

      const finalDataUrl = processAdvancedAutoFace(fullCanvas, params, finalMaskCanvas);
      const titleMode = zoneMode === "brush" ? "Zone Sélectionnée" : "Visage Entier";
      onApplyNewImage(
        finalDataUrl,
        `Retouche Visage Pro (${activePreset || titleMode} - Lissage ${params.gaussianBlurRadius}px, Glow ${params.glowIntensity || 0}%)`,
        params
      );
      onClose();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Nettoyage Auto Visage & Flou Gaussien
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Zones au Choix
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Détection des boutons et flou gaussien sur visage entier ou zones peintes sur mesure
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={isZoomed ? "Réduire aperçu" : "Agrandir aperçu"}
            >
              {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Canvas Preview + Brush Painter */}
          <div className={`${isZoomed ? "lg:col-span-12" : "lg:col-span-7"} p-4 flex flex-col justify-between bg-slate-950/60 relative min-h-[400px]`}>
            
            {/* Top Preview Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 z-10">
              <div className="flex items-center space-x-2">
                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => handleSwitchZoneMode("full")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      zoneMode === "full"
                        ? "bg-amber-500 text-slate-950 shadow font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Visage Entier</span>
                  </button>
                  <button
                    onClick={() => handleSwitchZoneMode("brush")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      zoneMode === "brush"
                        ? "bg-amber-500 text-slate-950 shadow font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Brush className="w-3.5 h-3.5" />
                    <span>Peindre Zone Précise</span>
                  </button>
                </div>

                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
                    showOriginal
                      ? "bg-amber-500/30 border-amber-400 text-amber-200"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="Maintenir enfoncé pour voir l'image originale sans filtre"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showOriginal ? "Original" : "Avant/Après"}</span>
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Calcul...</span>
                </div>
              )}
            </div>

            {/* Brush Controls Bar (When zoneMode === 'brush') */}
            {zoneMode === "brush" && (
              <div className="mb-3 p-2.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEraser(false)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      !isEraser
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Brush className="w-3.5 h-3.5" />
                    <span>Pinceau</span>
                  </button>
                  <button
                    onClick={() => setIsEraser(true)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      isEraser
                        ? "bg-red-500 text-white font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Gomme</span>
                  </button>
                </div>

                {/* Brush size slider */}
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-medium">Taille:</span>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 accent-emerald-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-emerald-400 font-bold">{brushSize}px</span>
                </div>

                {/* Mask quick actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMaskOverlay(!showMaskOverlay)}
                    className={`px-2 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                      showMaskOverlay
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                    title="Afficher/masquer le masque vert"
                  >
                    Masque Vert
                  </button>
                  <button
                    onClick={handleFillAllMask}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    Tout Peindre
                  </button>
                  <button
                    onClick={handleClearMask}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 border border-slate-700 transition cursor-pointer"
                    title="Effacer la zone sélectionnée"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Canvas / Interactive Image Container */}
            <div
              ref={imageContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`flex-1 flex items-center justify-center relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 min-h-[300px] select-none ${
                zoneMode === "brush" ? "cursor-crosshair" : ""
              }`}
            >
              <img
                src={showOriginal ? originalImageSrc : previewSrc}
                alt="Aperçu Visage Retouché"
                className="max-h-[480px] w-auto object-contain transition-all duration-100 pointer-events-none"
              />

              {/* Visual Mask Overlay Canvas */}
              {zoneMode === "brush" && showMaskOverlay && (
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 max-h-[480px] m-auto object-contain pointer-events-none"
                />
              )}

              {showOriginal && (
                <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  PHOTO ORIGINALE
                </div>
              )}

              {zoneMode === "brush" && !hasPaintedMask && (
                <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
                  <span className="bg-slate-900/90 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                    ✨ Peignez directement sur le visage pour choisir les zones à lisser
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2">
              {zoneMode === "brush"
                ? "Zone verte = zone de lissage et d'effacement des boutons. Les autres parties restent 100% nettes."
                : "Aperçu haute fidélité en temps réel. Ajustez les curseurs à droite pour personnaliser le rendu."}
            </p>
          </div>

          {/* Right Column: Controls & Adjustment Sliders */}
          {!isZoomed && (
            <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-6 bg-slate-900">
              
              {/* Presets section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Filtres Peau Pro 1-Clic</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">1-Clic Magique</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {BEAUTY_ONE_CLICK_FILTERS.map((f) => {
                    const isActive = activePreset === f.name;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setActivePreset(f.name);
                          setParams({ ...f.params });
                        }}
                        className={`text-left p-2 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm"
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-[11px] truncate">{f.shortName}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-amber-400 border border-slate-800 shrink-0 ml-1">
                            {f.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {f.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adjustment Sliders */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ajustements Précis du Rendu</span>
                  </span>
                  <button
                    onClick={handleResetParams}
                    className="text-[11px] text-slate-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Réinitialiser</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {/* Slider 1: Blemish Removal Intensity */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                        Suppression Boutons & Acné
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {params.blemishRemoval}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.blemishRemoval}
                      onChange={(e) => handleParamChange("blemishRemoval", Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 2: Gaussian Blur Skin Smoothness */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        Flou Gaussien / Lissage Fréquence
                      </label>
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {params.gaussianBlurRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={params.gaussianBlurRadius}
                      onChange={(e) => handleParamChange("gaussianBlurRadius", Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 3: Studio Highlight & Cheek Glow */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        Éclat Pommettes & Glow 3D
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {params.glowIntensity || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.glowIntensity || 0}
                      onChange={(e) => handleParamChange("glowIntensity", Number(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 4: Detail Preservation */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Protection Yeux, Cils & Lèvres
                      </label>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {params.preserveDetails}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={params.preserveDetails}
                      onChange={(e) => handleParamChange("preserveDetails", Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 5: Skin Warmth / Glow */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Chaleur & Teinte Dorée
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {params.skinWarmth > 0 ? `+${params.skinWarmth}` : params.skinWarmth}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={params.skinWarmth}
                      onChange={(e) => handleParamChange("skinWarmth", Number(e.target.value))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 6: Sensitivity */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Sensibilité Détection Taches
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {params.sensitivity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={params.sensitivity}
                      onChange={(e) => handleParamChange("sensitivity", Number(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 7: Eye & Lip Pop */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Clarté Regard & Lèvres
                      </label>
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {params.eyeLipPop || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.eyeLipPop || 0}
                      onChange={(e) => handleParamChange("eyeLipPop", Number(e.target.value))}
                      className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Slider 8: Tone Evenness */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Uniformité du Teint
                      </label>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {params.toneEvenness || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.toneEvenness || 0}
                      onChange={(e) => handleParamChange("toneEvenness", Number(e.target.value))}
                      className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Appliquer au Projet</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
