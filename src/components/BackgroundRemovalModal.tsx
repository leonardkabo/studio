import React, { useState } from "react";
import { X, Scissors, Check, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { removeBackgroundSmart } from "../utils/imageTools";

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc: string;
  onApplyNewImage: (newImageDataUrl: string, actionTitle: string) => void;
}

export const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  originalImageSrc,
  onApplyNewImage,
}) => {
  const [bgMode, setBgMode] = useState<"transparent" | "solid" | "blur">("transparent");
  const [bgColor, setBgColor] = useState<string>("#0f172a");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const processRemoval = async () => {
    if (!isOpen || !originalImageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = originalImageSrc;
    await new Promise((res) => (img.onload = res));

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1600;
    canvas.height = img.naturalHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const resultUrl = removeBackgroundSmart(canvas, bgMode, bgColor);
      setPreviewDataUrl(resultUrl);
    }
    setIsProcessing(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      processRemoval();
    }
  }, [bgMode, bgColor, originalImageSrc, isOpen]);

  const handleApply = () => {
    if (previewDataUrl) {
      onApplyNewImage(
        previewDataUrl,
        bgMode === "transparent"
          ? "Détourage Arrière-Plan Transparent"
          : bgMode === "blur"
          ? "Flou Arrière-Plan Studio"
          : `Fond Couleur Unie ${bgColor}`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Détourage & Suppression d'Arrière-Plan</h3>
              <p className="text-xs text-slate-400">Isoles le sujet principal et remplace le fond en 1 clic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 shrink-0 text-xs">
          <label className="font-semibold text-slate-200 block">Mode d'Arrière-Plan :</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setBgMode("transparent")}
              className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                bgMode === "transparent"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
              }`}
            >
              1. Transparence PNG
            </button>

            <button
              onClick={() => setBgMode("blur")}
              className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                bgMode === "blur"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
              }`}
            >
              2. Flou Artistique Bokeh
            </button>

            <button
              onClick={() => setBgMode("solid")}
              className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                bgMode === "solid"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
              }`}
            >
              3. Couleur Unie Studio
            </button>
          </div>

          {bgMode === "solid" && (
            <div className="flex items-center space-x-3 pt-2">
              <span className="text-slate-300">Couleur du nouveau fond :</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-slate-400 font-mono">{bgColor}</span>
            </div>
          )}
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2 relative min-h-[200px]">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2 text-rose-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs">Détourage de l'arrière-plan en cours...</span>
            </div>
          ) : previewDataUrl ? (
            <img src={previewDataUrl} alt="Aperçu Détourage" className="max-h-[260px] w-auto object-contain rounded-lg shadow-lg" />
          ) : (
            <div className="text-slate-500 text-xs">Aperçu indisponible.</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-3 shrink-0 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Annuler
          </button>

          <button
            onClick={handleApply}
            disabled={!previewDataUrl || isProcessing}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer le Détourage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
