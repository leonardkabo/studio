import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Crop as CropIcon,
  Layers,
  Check,
  RotateCw,
  Move,
  Eye,
  Sliders,
  Maximize2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ImageOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc: string;
  onApplyNewImage: (newImageDataUrl: string, actionTitle: string) => void;
}

export const ImageOverlayModal: React.FC<ImageOverlayModalProps> = ({
  isOpen,
  onClose,
  originalImageSrc,
  onApplyNewImage,
}) => {
  // State for imported overlay image
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [overlayImgElem, setOverlayImgElem] = useState<HTMLImageElement | null>(null);

  // Cropping State for the imported secondary image
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }); // percentage values 0-100%
  const [croppedOverlayUrl, setCroppedOverlayUrl] = useState<string | null>(null);

  // Overlay Adjustment Controls
  const [posX, setPosX] = useState<number>(85); // % from left (85 = bottom right default)
  const [posY, setPosY] = useState<number>(85); // % from top
  const [scale, setScale] = useState<number>(25); // % scale relative to base image
  const [rotation, setRotation] = useState<number>(0); // degrees
  const [opacity, setOpacity] = useState<number>(90); // %
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>("source-over");

  // Real-time Live Preview Canvas URL
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load imported overlay image element
  const handleOverlayFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOverlaySrc(result);

      const img = new Image();
      img.onload = () => {
        setOverlayImgElem(img);
        setCroppedOverlayUrl(result);
        setCropRect({ x: 0, y: 0, width: 100, height: 100 });
        setIsCropping(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Perform Crop on Secondary Image
  const applySecondaryCrop = () => {
    if (!overlayImgElem) return;

    const canvas = document.createElement("canvas");
    const nw = overlayImgElem.naturalWidth;
    const nh = overlayImgElem.naturalHeight;

    const cropX = Math.round((cropRect.x / 100) * nw);
    const cropY = Math.round((cropRect.y / 100) * nh);
    const cropW = Math.max(10, Math.round((cropRect.width / 100) * nw));
    const cropH = Math.max(10, Math.round((cropRect.height / 100) * nh));

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(overlayImgElem, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const croppedData = canvas.toDataURL("image/png");
    setCroppedOverlayUrl(croppedData);
    setIsCropping(false);
  };

  // Real-Time Canvas Live Preview Generator
  useEffect(() => {
    if (!isOpen || !originalImageSrc) return;

    let isSubscribed = true;
    const generateRealtimePreview = async () => {
      const baseImg = new Image();
      baseImg.src = originalImageSrc;
      await new Promise((resolve) => (baseImg.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.naturalWidth || 1920;
      canvas.height = baseImg.naturalHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw base image
      ctx.drawImage(baseImg, 0, 0);

      // Render Overlay Image if uploaded
      const targetOverlaySrc = croppedOverlayUrl || overlaySrc;
      if (targetOverlaySrc) {
        const overImg = new Image();
        overImg.src = targetOverlaySrc;
        await new Promise((resolve) => (overImg.onload = resolve));

        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.globalCompositeOperation = blendMode;

        // Calculate size & position
        const maxDim = Math.min(canvas.width, canvas.height);
        const overW = (overImg.naturalWidth / overImg.naturalHeight) * maxDim * (scale / 100);
        const overH = maxDim * (scale / 100);

        const targetX = (posX / 100) * canvas.width;
        const targetY = (posY / 100) * canvas.height;

        ctx.translate(targetX, targetY);
        ctx.rotate((rotation * Math.PI) / 180);

        ctx.drawImage(overImg, -overW / 2, -overH / 2, overW, overH);
        ctx.restore();
      }

      if (isSubscribed) {
        setPreviewUrl(canvas.toDataURL("image/png", 0.95));
      }
    };

    generateRealtimePreview();

    return () => {
      isSubscribed = false;
    };
  }, [
    originalImageSrc,
    overlaySrc,
    croppedOverlayUrl,
    posX,
    posY,
    scale,
    rotation,
    opacity,
    blendMode,
    isOpen,
  ]);

  const handleApplyToMainProject = () => {
    if (previewUrl) {
      onApplyNewImage(previewUrl, "Incrustation Image & Logo Surposé");
      onClose();
    }
  };

  // Quick Preset Positions
  const setPresetPos = (preset: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center") => {
    switch (preset) {
      case "top-left":
        setPosX(15);
        setPosY(15);
        break;
      case "top-right":
        setPosX(85);
        setPosY(15);
        break;
      case "bottom-left":
        setPosX(15);
        setPosY(85);
        break;
      case "bottom-right":
        setPosX(85);
        setPosY(85);
        break;
      case "center":
        setPosX(50);
        setPosY(50);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Incruster une Image / Filigrane & Rogner</h3>
              <p className="text-xs text-slate-400">Ajoutez un logo, sticker ou seconde photo, rognez-la et ajustez en temps réel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto pr-1 no-scrollbar text-xs">
            {/* Step 1: Upload Secondary Image */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <label className="font-bold text-slate-200 flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>1. Importer l'Image à Superposer :</span>
              </label>

              <label className="flex items-center justify-center space-x-2 p-3 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500 bg-slate-900/60 hover:bg-slate-900 text-slate-300 font-semibold cursor-pointer transition">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>{overlaySrc ? "Changer l'image superposée" : "Choisir une photo / logo (PNG, JPG)"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOverlayFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Step 2: Crop Option for Imported Image */}
            {overlaySrc && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <CropIcon className="w-4 h-4 text-amber-400" />
                    <span>2. Rognage de l'Image Importée :</span>
                  </label>
                  <button
                    onClick={() => setIsCropping(!isCropping)}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition flex items-center space-x-1 cursor-pointer ${
                      isCropping
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <CropIcon className="w-3.5 h-3.5" />
                    <span>{isCropping ? "Mode Rognage Actif" : "Rogner l'Image"}</span>
                  </button>
                </div>

                {isCropping && (
                  <div className="space-y-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                    <p className="text-[11px] text-slate-400">Ajustez la zone à découper sur la seconde photo :</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Position X : {cropRect.x}%</span>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          value={cropRect.x}
                          onChange={(e) => setCropRect({ ...cropRect, x: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">Position Y : {cropRect.y}%</span>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          value={cropRect.y}
                          onChange={(e) => setCropRect({ ...cropRect, y: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">Largeur : {cropRect.width}%</span>
                        <input
                          type="range"
                          min="10"
                          max={100 - cropRect.x}
                          value={cropRect.width}
                          onChange={(e) => setCropRect({ ...cropRect, width: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hauteur : {cropRect.height}%</span>
                        <input
                          type="range"
                          min="10"
                          max={100 - cropRect.y}
                          value={cropRect.height}
                          onChange={(e) => setCropRect({ ...cropRect, height: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={applySecondaryCrop}
                        className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider la Découpe</span>
                      </button>
                      <button
                        onClick={() => {
                          setCroppedOverlayUrl(overlaySrc);
                          setCropRect({ x: 0, y: 0, width: 100, height: 100 });
                          setIsCropping(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Positioning, Scaling & Opacity Controls */}
            {overlaySrc && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <label className="font-bold text-slate-200 flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>3. Ajustements & Placement :</span>
                </label>

                {/* Preset Position Buttons */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px] block font-semibold">Position Rapide :</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      onClick={() => setPresetPos("top-left")}
                      className="py-1 px-1 rounded bg-slate-900 border border-slate-800 hover:bg-indigo-600/30 text-slate-300 font-bold text-[10px]"
                    >
                      Haut-G
                    </button>
                    <button
                      onClick={() => setPresetPos("top-right")}
                      className="py-1 px-1 rounded bg-slate-900 border border-slate-800 hover:bg-indigo-600/30 text-slate-300 font-bold text-[10px]"
                    >
                      Haut-D
                    </button>
                    <button
                      onClick={() => setPresetPos("center")}
                      className="py-1 px-1 rounded bg-slate-900 border border-slate-800 hover:bg-indigo-600/30 text-slate-300 font-bold text-[10px]"
                    >
                      Centre
                    </button>
                    <button
                      onClick={() => setPresetPos("bottom-left")}
                      className="py-1 px-1 rounded bg-slate-900 border border-slate-800 hover:bg-indigo-600/30 text-slate-300 font-bold text-[10px]"
                    >
                      Bas-G
                    </button>
                    <button
                      onClick={() => setPresetPos("bottom-right")}
                      className="py-1 px-1 rounded bg-indigo-600 text-white border border-indigo-500 font-bold text-[10px]"
                    >
                      Bas-D
                    </button>
                  </div>
                </div>

                {/* Fine Sliders */}
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Taille (Échelle) :</span>
                      <span className="font-bold text-indigo-400">{scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Position X :</span>
                        <span className="font-bold text-indigo-400">{posX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={posX}
                        onChange={(e) => setPosX(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Position Y :</span>
                        <span className="font-bold text-indigo-400">{posY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={posY}
                        onChange={(e) => setPosY(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Rotation :</span>
                        <span className="font-bold text-indigo-400">{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Opacité / Transparence :</span>
                        <span className="font-bold text-indigo-400">{opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">Mode de Fusion (Blend Mode) :</span>
                    <select
                      value={blendMode}
                      onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    >
                      <option value="source-over">Normal (Superposition)</option>
                      <option value="multiply">Produit (Multiply / Sombre)</option>
                      <option value="screen">Superposition Lumineuse (Screen)</option>
                      <option value="overlay">Incrustation (Overlay Contrasté)</option>
                      <option value="soft-light">Lumière Douce (Soft Light)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Interactive Canvas Preview (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-3 relative min-h-[340px]">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
              <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Aperçu en Temps Réel du Rendu</span>
              </span>
              <span className="text-[11px] text-slate-500 italic">Mise à jour instantanée</span>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu Incrustation Image"
                  className="max-h-[380px] max-w-full w-auto object-contain rounded-lg shadow-xl border border-slate-800/50"
                />
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center space-y-2">
                  <Sparkles className="w-6 h-6 text-slate-600 animate-spin" />
                  <span>Chargement de la composition...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between shrink-0 border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
          >
            Annuler
          </button>

          <button
            onClick={handleApplyToMainProject}
            disabled={!previewUrl}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer transition"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer l'Incrustation d'Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
