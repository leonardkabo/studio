import React, { useState } from "react";
import { X, Download, Image, Stamp, Sparkles, Check, FileCheck } from "lucide-react";
import { ExportOptions } from "../types";
import { useTheme } from "../context/ThemeContext";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (options: ExportOptions) => void;
  originalDimensions?: { width: number; height: number };
  initialTitle?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  originalDimensions = { width: 1920, height: 1080 },
  initialTitle = "Image",
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const defaultBaseName = initialTitle.replace(/\.[^/.]+$/, "").trim() || "Image";

  const [baseName, setBaseName] = useState<string>(defaultBaseName);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("jpeg");
  const [quality, setQuality] = useState<number>(0.92);
  const [scale, setScale] = useState<number>(1); // 1 = 100% full res
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [watermarkPosition, setWatermarkPosition] = useState<
    "bottom-right" | "bottom-left" | "top-right" | "center"
  >("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.7);

  const exportWidth = Math.round(originalDimensions.width * scale);
  const exportHeight = Math.round(originalDimensions.height * scale);

  const formatExtension = format === "jpeg" ? "jpg" : format;
  const cleanBaseName = baseName.trim() || "Image";
  const finalFilename = `${cleanBaseName}_OK.${formatExtension}`;

  const handleExport = () => {
    onConfirmExport({
      format,
      quality,
      scale,
      watermarkText,
      watermarkPosition,
      watermarkOpacity,
      customFileName: finalFilename,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          isLight
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-slate-900 border-slate-800 text-slate-100"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-base font-bold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                Exportation Haute Définition
              </h3>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Enregistrement automatique au format <span className="font-semibold text-emerald-500">nomd'origine_OK</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* File Name & Suffix _OK preview */}
          <div
            className={`p-3 rounded-xl border space-y-2 ${
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-950 border-slate-800 text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Nom de l'image (Préfixe) :</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                + Suffixe _OK
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                placeholder="Nom du fichier..."
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-900"
                    : "bg-slate-900 border-slate-700 text-slate-100"
                }`}
              />
              <div
                className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold whitespace-nowrap ${
                  isLight
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                }`}
              >
                _OK.{formatExtension}
              </div>
            </div>

            <div
              className={`flex items-center justify-between pt-1 text-[11px] ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              <span>Fichier qui sera téléchargé :</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {finalFilename}
              </span>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-1.5">
            <label
              className={`font-semibold ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}
            >
              Format de Fichier :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["jpeg", "png", "webp"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-3 rounded-xl border font-bold uppercase transition cursor-pointer ${
                    format === fmt
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                      : isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== "png" && (
            <div className="space-y-1">
              <div
                className={`flex justify-between font-semibold ${
                  isLight ? "text-slate-800" : "text-slate-200"
                }`}
              >
                <span>Qualité de Compression :</span>
                <span className="text-emerald-500 font-mono font-bold">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}

          {/* Resolution / Scale Selection */}
          <div className="space-y-1.5">
            <div
              className={`flex justify-between font-semibold ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}
            >
              <span>Résolution d'Exportation :</span>
              <span className="text-emerald-500 font-mono font-bold">
                {exportWidth} x {exportHeight} px
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Original (100%)", val: 1 },
                { label: "Format 4K (75%)", val: 0.75 },
                { label: "Format Web (50%)", val: 0.5 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setScale(opt.val)}
                  className={`py-2 px-2 text-[11px] rounded-xl border font-semibold transition cursor-pointer ${
                    scale === opt.val
                      ? isLight
                        ? "bg-slate-200 text-emerald-700 border-emerald-500 font-bold"
                        : "bg-slate-800 text-emerald-400 border-emerald-500 font-bold"
                      : isLight
                      ? "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Watermark Section */}
          <div
            className={`p-3 rounded-xl border space-y-3 ${
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-950 border-slate-800 text-slate-200"
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              <Stamp className="w-4 h-4 text-emerald-500" />
              <span>Filigrane / Signature Photographe (Optionnel) :</span>
            </div>

            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Ex: © Studio Mariage Prestige 2026"
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  : "bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600"
              }`}
            />

            {watermarkText.trim() && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={watermarkPosition}
                  onChange={(e: any) => setWatermarkPosition(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-800"
                      : "bg-slate-900 border-slate-700 text-slate-200"
                  }`}
                >
                  <option value="bottom-right">Bas Droite</option>
                  <option value="bottom-left">Bas Gauche</option>
                  <option value="top-right">Haut Droite</option>
                  <option value="center">Centre</option>
                </select>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Opacité:
                  </span>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full h-1 rounded accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
              isLight
                ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer transition"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger ({finalFilename})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
