import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Activity,
  Columns,
  Eye,
  Wand2,
  Upload,
  Sparkles,
  Info,
  Brush,
  Scissors,
  Type,
  Check,
  Sliders,
  Crop,
  Square,
  Circle,
  Move,
  RotateCcw,
} from "lucide-react";
import { AdjustmentSettings, BrushSettings, LayerItem, SelectionState } from "../types";
import {
  calculateHistogram,
  renderAdjustedCanvas,
  renderHistogramGraph,
} from "../utils/canvasEngine";
import { healBlemishSpotWithBrush, healBlemishStrokeWithBrush } from "../utils/imageTools";
import { useTheme } from "../context/ThemeContext";

interface MainCanvasProps {
  imageSrc: string | null;
  settings: AdjustmentSettings;
  onSettingsChange: (newSettings: AdjustmentSettings) => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onUploadImage: (file: File) => void;
  onLoadSampleImage: () => void;
  isHealingBrushActive: boolean;
  onToggleHealingBrush: () => void;
  onApplyNewImage: (dataUrl: string, title: string) => void;
  originalCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  brushSettings: BrushSettings;
  onOpenBrushSettings: () => void;
  selectionState: SelectionState;
  onSelectionStateChange: (newSel: SelectionState) => void;
  // Layers & Image Transformation
  layers: LayerItem[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayerProp: (id: string, prop: keyof LayerItem, value: any) => void;
  onAddLayer: (file: File) => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  imageSrc,
  settings,
  onSettingsChange,
  isSplitView,
  onToggleSplitView,
  onUploadImage,
  onLoadSampleImage,
  isHealingBrushActive,
  onToggleHealingBrush,
  onApplyNewImage,
  originalCanvasRef,
  brushSettings,
  onOpenBrushSettings,
  selectionState,
  onSelectionStateChange,
  layers,
  activeLayerId,
  onSelectLayer,
  onUpdateLayerProp,
  onAddLayer,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const adjustedCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [showHistogram, setShowHistogram] = useState<boolean>(true);
  const [healingToast, setHealingToast] = useState<string | null>(null);

  // Active Tool Mode: normal / select / crop / transform_layer
  const [activeTool, setActiveTool] = useState<"pointer" | "crop" | "move">("pointer");

  // Crop Box state on Base Image
  const [isCroppingBase, setIsCroppingBase] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  // Layer drag & resize interaction state
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragLayerStart, setDragLayerStart] = useState<{
    mouseX: number;
    mouseY: number;
    layerX: number;
    layerY: number;
  } | null>(null);

  // Selection Box Drag State
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);

  // Continuous Brush Painting state
  const [isPaintingHealing, setIsPaintingHealing] = useState<boolean>(false);
  const lastHealingPosRef = useRef<{ x: number; y: number } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);

  // Load Image element when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      imgElementRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imgElementRef.current = img;
      renderAllCanvases();
    };
  }, [imageSrc]);

  // Re-render canvases when settings, split view, or brush target changes
  useEffect(() => {
    renderAllCanvases();
  }, [
    settings,
    imageSrc,
    isSplitView,
    zoom,
    selectionState,
    dragCurrent,
    mouseCanvasPos,
    isHealingBrushActive,
    brushSettings,
    layers,
    activeLayerId,
    cropRect,
    isCroppingBase,
  ]);

  const renderAllCanvases = () => {
    const img = imgElementRef.current;
    if (!img) return;

    // 1. Render Adjusted Canvas
    if (adjustedCanvasRef.current) {
      renderAdjustedCanvas(img, adjustedCanvasRef.current, settings, 1);
    }

    // 2. Render Selection Overlay & Photoshop Brush Ring Cursor Canvas
    if (selectionCanvasRef.current && adjustedCanvasRef.current) {
      const selCanvas = selectionCanvasRef.current;
      const adjCanvas = adjustedCanvasRef.current;

      selCanvas.width = adjCanvas.width;
      selCanvas.height = adjCanvas.height;

      const ctx = selCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, selCanvas.width, selCanvas.height);

        // Draw selection path / box if active
        if (selectionState.isActive || isSelecting) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = (Date.now() / 100) % 12;

          let rect = selectionState.rect;
          if (isSelecting && dragStart && dragCurrent) {
            const minX = Math.min(dragStart.x, dragCurrent.x);
            const minY = Math.min(dragStart.y, dragCurrent.y);
            const w = Math.abs(dragCurrent.x - dragStart.x);
            const h = Math.abs(dragCurrent.y - dragStart.y);
            rect = { x: minX, y: minY, width: w, height: h };
          }

          if (rect && (selectionState.mode === "rectangle" || selectionState.mode === "auto_subject")) {
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          } else if (rect && selectionState.mode === "ellipse") {
            ctx.beginPath();
            ctx.ellipse(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
              rect.width / 2,
              rect.height / 2,
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
            ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
            ctx.fill();
          } else if (selectionState.mode === "lasso" && lassoPoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            for (let i = 1; i < lassoPoints.length; i++) {
              ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
            }
            if (!isSelecting) ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
            ctx.fill();
          }
        }

        // Draw Photoshop Style Interactive Brush Cursor Ring Overlay
        if (mouseCanvasPos && isHealingBrushActive) {
          const { x: mx, y: my } = mouseCanvasPos;
          const radius = Math.max(3, brushSettings.size / 2);
          const roundFactor = Math.max(0.1, brushSettings.roundness / 100);
          const angleRad = (brushSettings.angle * Math.PI) / 180;

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(angleRad);

          // Outer high-contrast black shadow ring
          ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * roundFactor, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Inner crisp white ring
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * roundFactor, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Center precision crosshair point
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // 3. Render Original Canvas (unadjusted) for split-view comparison
    if (originalCanvasRef.current && isSplitView) {
      const defaultSettings = {
        ...settings,
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        temperature: 0,
        tint: 0,
        saturation: 0,
        vibrance: 0,
        clarity: 0,
        sharpness: 0,
        noiseReduction: 0,
        vignette: 0,
        skinSmoothing: 0,
        dehaze: 0,
        grain: 0,
      };
      renderAdjustedCanvas(img, originalCanvasRef.current, defaultSettings, 1);
    }

    // 4. Render Histogram
    if (adjustedCanvasRef.current && histogramCanvasRef.current && showHistogram) {
      const histogramData = calculateHistogram(adjustedCanvasRef.current);
      renderHistogramGraph(histogramCanvasRef.current, histogramData);
    }
  };

  // Perform Crop on Base Image
  const handleApplyCropBase = () => {
    if (!adjustedCanvasRef.current) return;
    const canvas = adjustedCanvasRef.current;
    const cropX = Math.round((cropRect.x / 100) * canvas.width);
    const cropY = Math.round((cropRect.y / 100) * canvas.height);
    const cropW = Math.max(20, Math.round((cropRect.width / 100) * canvas.width));
    const cropH = Math.max(20, Math.round((cropRect.height / 100) * canvas.height));

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const croppedDataUrl = cropCanvas.toDataURL("image/png");
    onApplyNewImage(croppedDataUrl, "Recadrage de l'image");
    setIsCroppingBase(false);
  };

  // Drag Drop Handlers for opening photos
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (imageSrc) {
        // If image already exists, offer adding as layer or opening
        onAddLayer(file);
      } else {
        onUploadImage(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Convert client coordinates to canvas pixel coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = adjustedCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Convert touch coordinates to canvas pixel coordinates for mobile devices
  const getCanvasTouchCoords = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = adjustedCanvasRef.current;
    if (!canvas || e.touches.length === 0) return null;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  // Mouse Down Event Handler
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (isHealingBrushActive) {
      setIsPaintingHealing(true);
      lastHealingPosRef.current = coords;
      applyHealingAtPos(coords.x, coords.y);
      return;
    }

    if (selectionState.mode !== "none") {
      setIsSelecting(true);
      setDragStart(coords);
      setDragCurrent(coords);
      if (selectionState.mode === "lasso") {
        setLassoPoints([coords]);
      }
    }
  };

  // Touch Start Event Handler (Mobile)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasTouchCoords(e);
    if (!coords) return;

    if (isHealingBrushActive) {
      setIsPaintingHealing(true);
      lastHealingPosRef.current = coords;
      applyHealingAtPos(coords.x, coords.y);
      return;
    }

    if (selectionState.mode !== "none") {
      setIsSelecting(true);
      setDragStart(coords);
      setDragCurrent(coords);
      if (selectionState.mode === "lasso") {
        setLassoPoints([coords]);
      }
    }
  };

  // Mouse Move Event Handler
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setMouseCanvasPos(coords);

    if (isHealingBrushActive && isPaintingHealing) {
      if (lastHealingPosRef.current) {
        applyHealingStroke(lastHealingPosRef.current, coords);
      }
      lastHealingPosRef.current = coords;
      return;
    }

    if (isSelecting) {
      setDragCurrent(coords);
      if (selectionState.mode === "lasso") {
        setLassoPoints((prev) => [...prev, coords]);
      }
    }
  };

  // Touch Move Event Handler (Mobile)
  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasTouchCoords(e);
    if (!coords) return;

    setMouseCanvasPos(coords);

    if (isHealingBrushActive && isPaintingHealing) {
      if (lastHealingPosRef.current) {
        applyHealingStroke(lastHealingPosRef.current, coords);
      }
      lastHealingPosRef.current = coords;
      return;
    }

    if (isSelecting) {
      setDragCurrent(coords);
      if (selectionState.mode === "lasso") {
        setLassoPoints((prev) => [...prev, coords]);
      }
    }
  };

  // Mouse Up Event Handler
  const handleCanvasMouseUp = () => {
    if (isHealingBrushActive && isPaintingHealing) {
      setIsPaintingHealing(false);
      lastHealingPosRef.current = null;
      setHealingToast("Zone nettoyée avec succès");
      setTimeout(() => setHealingToast(null), 2500);
      return;
    }

    if (isSelecting && dragStart && dragCurrent) {
      setIsSelecting(false);
      const minX = Math.min(dragStart.x, dragCurrent.x);
      const minY = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);

      if (w > 5 && h > 5) {
        onSelectionStateChange({
          ...selectionState,
          isActive: true,
          rect: { x: minX, y: minY, width: w, height: h },
          lassoPoints: selectionState.mode === "lasso" ? lassoPoints : undefined,
        });
      }
    }
  };

  // Touch End Event Handler (Mobile)
  const handleCanvasTouchEnd = () => {
    handleCanvasMouseUp();
    setMouseCanvasPos(null);
  };

  const handleCanvasMouseLeave = () => {
    setMouseCanvasPos(null);
    if (isPaintingHealing) {
      setIsPaintingHealing(false);
      lastHealingPosRef.current = null;
    }
    if (isSelecting) {
      setIsSelecting(false);
    }
  };

  // Apply Healing Spot using custom brush settings
  const applyHealingAtPos = (x: number, y: number) => {
    if (!adjustedCanvasRef.current) return;
    const canvas = adjustedCanvasRef.current;

    healBlemishSpotWithBrush(canvas, x, y, brushSettings);
    const newImageDataUrl = canvas.toDataURL("image/png");
    onApplyNewImage(newImageDataUrl, `Tampon correcteur (${Math.round(x)}, ${Math.round(y)})`);
  };

  // Apply Continuous Healing Stroke
  const applyHealingStroke = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (!adjustedCanvasRef.current) return;
    const canvas = adjustedCanvasRef.current;

    healBlemishStrokeWithBrush(canvas, p1.x, p1.y, p2.x, p2.y, brushSettings);
  };

  // Handle Layer Drag on Stage (Photoshop Move Tool)
  const handleLayerMouseDown = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectLayer(layerId);
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    setDraggingLayerId(layerId);
    setDragLayerStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
    });
  };

  // Handle global stage mouse move for layer repositioning
  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newPos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(newPos);
      return;
    }

    if (draggingLayerId && dragLayerStart && stageRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragLayerStart.mouseX) / stageRect.width) * 100;
      const deltaY = ((e.clientY - dragLayerStart.mouseY) / stageRect.height) * 100;

      const newX = Math.max(0, Math.min(100, dragLayerStart.layerX + deltaX));
      const newY = Math.max(0, Math.min(100, dragLayerStart.layerY + deltaY));

      onUpdateLayerProp(draggingLayerId, "x", newX);
      onUpdateLayerProp(draggingLayerId, "y", newY);
    }
  };

  const handleStageMouseUp = () => {
    setIsDraggingSplit(false);
    setDraggingLayerId(null);
    setDragLayerStart(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => setZoom(1);

  const handleRotate = () => {
    const nextRot = (settings.rotation + 90) % 360;
    onSettingsChange({ ...settings, rotation: nextRot });
  };

  const handleFlipH = () => {
    onSettingsChange({ ...settings, flipH: !settings.flipH });
  };

  const handleFlipV = () => {
    onSettingsChange({ ...settings, flipV: !settings.flipV });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`flex-1 flex flex-col relative overflow-hidden select-none transition-colors ${
        isLight ? "bg-slate-200" : "bg-slate-950"
      }`}
    >
      {/* Top Floating Utility Canvas Control Toolbar */}
      <div
        className={`absolute top-3 left-3 z-30 flex items-center space-x-1.5 rounded-xl p-1 backdrop-blur-md shadow-xl text-xs transition-colors ${
          isLight
            ? "bg-white/90 border border-slate-300 text-slate-700 shadow-slate-300/50"
            : "bg-slate-900/90 border border-slate-800/90 text-slate-300"
        }`}
      >
        <button
          onClick={handleZoomIn}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Zoom Avant (Agrandir)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-bold text-indigo-500 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Zoom Arrière (Rétrécir)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Taille Réelle (100%)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className={`h-4 w-px mx-0.5 ${isLight ? "bg-slate-300" : "bg-slate-800"}`} />

        {/* Rotate & Flip */}
        <button
          onClick={handleRotate}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Pivoter 90° à droite"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleFlipH}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            settings.flipH
              ? "bg-indigo-600 text-white"
              : isLight
              ? "hover:bg-slate-100 text-slate-700"
              : "hover:bg-slate-800 text-slate-300"
          }`}
          title="Symétrie Horizontale (Miroir)"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={handleFlipV}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            settings.flipV
              ? "bg-indigo-600 text-white"
              : isLight
              ? "hover:bg-slate-100 text-slate-700"
              : "hover:bg-slate-800 text-slate-300"
          }`}
          title="Symétrie Verticale"
        >
          <FlipVertical className="w-4 h-4" />
        </button>

        <div className={`h-4 w-px mx-0.5 ${isLight ? "bg-slate-300" : "bg-slate-800"}`} />

        {/* Crop tool toggle */}
        {imageSrc && (
          <button
            onClick={() => setIsCroppingBase(!isCroppingBase)}
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              isCroppingBase
                ? "bg-amber-600 text-white font-bold"
                : isLight
                ? "hover:bg-slate-100 text-slate-700"
                : "hover:bg-slate-800 text-slate-300"
            }`}
            title="Outil Recadrage au curseur"
          >
            <Crop className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">Recadrer</span>
          </button>
        )}

        {/* Split View Compare */}
        {imageSrc && (
          <button
            onClick={onToggleSplitView}
            className={`px-2 py-1.5 rounded-lg transition flex items-center space-x-1 font-semibold text-xs cursor-pointer ${
              isSplitView
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isLight
                ? "hover:bg-slate-100 text-slate-700"
                : "hover:bg-slate-800 text-slate-300"
            }`}
            title="Vue Partagée Avant / Après"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSplitView ? "Fermer Split" : "Avant / Après"}</span>
          </button>
        )}

        <button
          onClick={() => setShowHistogram(!showHistogram)}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            showHistogram
              ? isLight
                ? "bg-slate-100 text-indigo-600 font-bold"
                : "bg-slate-800 text-indigo-400 font-bold"
              : isLight
              ? "hover:bg-slate-100 text-slate-500"
              : "hover:bg-slate-800 text-slate-400"
          }`}
          title="Afficher/Masquer l'Histogramme"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time Histogram Overlay */}
      {showHistogram && imageSrc && (
        <div
          className={`absolute top-4 right-4 z-20 w-48 rounded-xl p-2.5 backdrop-blur-md shadow-xl text-xs space-y-1 transition-colors ${
            isLight
              ? "bg-white/90 border border-slate-300 text-slate-800"
              : "bg-slate-900/90 border border-slate-800 text-slate-300"
          }`}
        >
          <div
            className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-b pb-1 ${
              isLight ? "text-slate-600 border-slate-200" : "text-slate-400 border-slate-800"
            }`}
          >
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-indigo-500" />
              <span>Histogramme</span>
            </span>
            <span className={isLight ? "text-slate-400" : "text-slate-500"}>RGB & Lum</span>
          </div>
          <canvas
            ref={histogramCanvasRef}
            width={180}
            height={80}
            className={`w-full h-20 rounded border ${
              isLight ? "border-slate-300 bg-slate-100" : "border-slate-800/80 bg-slate-950"
            }`}
          />
        </div>
      )}

      {/* Active Healing Brush Control HUD */}
      {isHealingBrushActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 rounded-2xl bg-rose-950/90 border border-rose-500/40 backdrop-blur-md shadow-2xl text-xs text-rose-100 animate-fade-in">
          <Brush className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-bold">Mode Pinceau Tampon : Peignez ou glissez pour effacer boutons et taches</span>
          <div className="h-4 w-px bg-rose-800" />
          <button
            onClick={onOpenBrushSettings}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Paramètres ({brushSettings.size}px, {brushSettings.hardness}%)</span>
          </button>
          <button
            onClick={onToggleHealingBrush}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
          >
            Quitter
          </button>
        </div>
      )}

      {/* Interactive Crop HUD */}
      {isCroppingBase && imageSrc && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 rounded-2xl bg-amber-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl text-xs text-amber-100 animate-fade-in">
          <Crop className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold">Mode Recadrage : Ajustez la zone ci-dessous</span>
          <div className="h-4 w-px bg-amber-800" />
          <button
            onClick={handleApplyCropBase}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold flex items-center space-x-1 transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Appliquer Recadrage</span>
          </button>
          <button
            onClick={() => setIsCroppingBase(false)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Healing Toast Feedback */}
      {healingToast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{healingToast}</span>
        </div>
      )}

      {/* Main Workspace Stage Canvas Viewport with Transparent Damier Photoshop Pattern */}
      <div
        ref={stageRef}
        className="flex-1 relative flex items-center justify-center p-4 max-w-full max-h-full overflow-auto custom-scrollbar"
      >
        {/* Transparent Checkerboard Grid Background Stage (Damier Photoshop de Base) */}
        <div
          className={`relative rounded-sm overflow-hidden shadow-2xl min-w-[320px] min-h-[240px] flex items-center justify-center transition-colors ${
            isLight
              ? "border border-slate-300 shadow-slate-300/50 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:16px_16px]"
              : "border border-slate-800/80 bg-[repeating-conic-gradient(#334155_0%_25%,#1e293b_0%_50%)] bg-[length:16px_16px]"
          }`}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {/* If NO BASE IMAGE: Show Transparent Canvas Workspace with Center Call to Action */}
          {!imageSrc ? (
            <div
              className={`w-[600px] h-[420px] max-w-[80vw] max-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-xs transition-colors ${
                isLight ? "bg-slate-100/40" : "bg-slate-950/40"
              }`}
            >
              <div
                className={`p-8 rounded-2xl border flex flex-col items-center space-y-4 max-w-md shadow-2xl transition-colors ${
                  isLight
                    ? "bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60"
                    : "bg-slate-900/90 border-slate-800 text-slate-100"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isLight
                      ? "bg-indigo-50 border border-indigo-200"
                      : "bg-indigo-600/20 border border-indigo-500/30"
                  }`}
                >
                  <Upload
                    className={`w-7 h-7 animate-bounce ${
                      isLight ? "text-indigo-600" : "text-indigo-400"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <h3
                    className={`font-bold text-base ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    Espace de Travail Transparent
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    Déposez une photo ou cliquez sur le bouton pour commencer.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 w-full">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer une Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          onUploadImage(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={onLoadSampleImage}
                    className={`px-3 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer border ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                        : "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                    }`}
                  >
                    Photo Démo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Base Image Output Canvas */
            <div className="relative touch-none">
              <canvas
                ref={adjustedCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onTouchStart={handleCanvasTouchStart}
                onTouchMove={handleCanvasTouchMove}
                onTouchEnd={handleCanvasTouchEnd}
                onTouchCancel={handleCanvasTouchEnd}
                className={`max-w-[85vw] max-h-[80vh] object-contain transition-all block ${
                  isHealingBrushActive
                    ? "cursor-crosshair ring-2 ring-rose-500/80"
                    : selectionState.mode !== "none"
                    ? "cursor-crosshair ring-2 ring-indigo-500/80"
                    : ""
                }`}
                style={
                  isSplitView
                    ? { clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }
                    : undefined
                }
              />

              {/* Selection Overlay Path Canvas */}
              <canvas
                ref={selectionCanvasRef}
                className="absolute inset-0 pointer-events-none w-full h-full"
              />

              {/* Original Canvas for Split View Comparison */}
              {isSplitView && (
                <canvas
                  ref={originalCanvasRef}
                  className="absolute inset-0 max-w-[85vw] max-h-[80vh] object-contain shadow-2xl pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
                  }}
                />
              )}

              {/* Interactive Crop Box Overlay */}
              {isCroppingBase && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <div
                    className="absolute border-2 border-amber-400 bg-amber-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-auto"
                    style={{
                      left: `${cropRect.x}%`,
                      top: `${cropRect.y}%`,
                      width: `${cropRect.width}%`,
                      height: `${cropRect.height}%`,
                    }}
                  >
                    {/* Grid rule of thirds */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-amber-400/40" />
                      <div className="border-r border-b border-amber-400/40" />
                      <div className="border-b border-amber-400/40" />
                      <div className="border-r border-b border-amber-400/40" />
                      <div className="border-r border-b border-amber-400/40" />
                      <div className="border-b border-amber-400/40" />
                      <div className="border-r border-amber-400/40" />
                      <div className="border-r border-amber-400/40" />
                      <div />
                    </div>

                    {/* Corner resize handle icons */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-slate-900" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-slate-900" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-slate-900" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-slate-900" />
                  </div>
                </div>
              )}

              {/* SECONDARY LAYER STACK (Photoshop Layers overlay on top of base image) */}
              {layers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = layer.id === activeLayerId;

                return (
                  <div
                    key={layer.id}
                    onMouseDown={(e) => handleLayerMouseDown(layer.id, e)}
                    className={`absolute select-none cursor-move transition-shadow ${
                      isSelected
                        ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-950 shadow-2xl"
                        : "hover:ring-1 hover:ring-indigo-400/60"
                    }`}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                      opacity: layer.opacity / 100,
                      mixBlendMode: layer.blendMode as any,
                      zIndex: layer.zIndex + 10,
                    }}
                  >
                    <img
                      src={layer.imageSrc}
                      alt={layer.name}
                      className="w-full h-auto object-contain pointer-events-none rounded"
                      referrerPolicy="no-referrer"
                    />

                    {/* Active Layer Move / Resize Bounding Box */}
                    {isSelected && (
                      <div className="absolute inset-0 border border-indigo-400 pointer-events-none">
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-500 border border-white" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border border-white" />
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-500 border border-white" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border border-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Split View Divider handle */}
        {isSplitView && imageSrc && (
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_12px_rgba(255,255,255,0.8)] flex items-center justify-center"
            style={{ left: `${splitPos}%` }}
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-lg text-xs text-white">
              <Columns className="w-3.5 h-3.5" />
            </div>

            {/* Labels */}
            <span className="absolute top-4 -left-16 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-slate-300 font-bold uppercase pointer-events-none">
              Original
            </span>
            <span className="absolute top-4 -right-16 px-2 py-0.5 rounded bg-indigo-600 text-[10px] text-white font-bold uppercase pointer-events-none">
              Retouché
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
