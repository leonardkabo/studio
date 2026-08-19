import React, { useState } from "react";
import { X, Layers, Upload, Download, Check, Sparkles, Loader2 } from "lucide-react";
import { EVENT_PRESETS } from "../data/presets";
import { EventPreset } from "../types";
import { renderAdjustedCanvas } from "../utils/canvasEngine";
import { useTheme } from "../context/ThemeContext";

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchFile {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "completed";
  processedDataUrl?: string;
}

export const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [files, setFiles] = useState<BatchFile[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<EventPreset>(EVENT_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files) as File[];
      const newFiles: BatchFile[] = fileList.map((f) => ({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "processing" } : f))
      );

      // Render preset onto canvas
      const img = new Image();
      img.src = item.previewUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      renderAdjustedCanvas(
        img,
        canvas,
        {
          exposure: selectedPreset.settings.exposure || 0,
          contrast: selectedPreset.settings.contrast || 0,
          highlights: selectedPreset.settings.highlights || 0,
          shadows: selectedPreset.settings.shadows || 0,
          whites: selectedPreset.settings.whites || 0,
          blacks: selectedPreset.settings.blacks || 0,
          temperature: selectedPreset.settings.temperature || 0,
          tint: selectedPreset.settings.tint || 0,
          saturation: selectedPreset.settings.saturation || 0,
          vibrance: selectedPreset.settings.vibrance || 0,
          clarity: selectedPreset.settings.clarity || 0,
          sharpness: selectedPreset.settings.sharpness || 20,
          noiseReduction: selectedPreset.settings.noiseReduction || 10,
          vignette: selectedPreset.settings.vignette || 0,
          skinSmoothing: selectedPreset.settings.skinSmoothing || 0,
          dehaze: selectedPreset.settings.dehaze || 0,
          grain: selectedPreset.settings.grain || 0,
          rotation: 0,
          flipH: false,
          flipV: false,
          hsl: {
            red: { hue: 0, sat: 0, lum: 0 },
            orange: { hue: 0, sat: 0, lum: 0 },
            yellow: { hue: 0, sat: 0, lum: 0 },
            green: { hue: 0, sat: 0, lum: 0 },
            aqua: { hue: 0, sat: 0, lum: 0 },
            blue: { hue: 0, sat: 0, lum: 0 },
            purple: { hue: 0, sat: 0, lum: 0 },
            magenta: { hue: 0, sat: 0, lum: 0 },
          },
          curvePoints: [
            { x: 0, y: 0 },
            { x: 128, y: 128 },
            { x: 255, y: 255 },
          ],
        },
        1
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "completed", processedDataUrl: dataUrl } : f
        )
      );
    }

    setIsProcessing(false);
  };

  const downloadAll = () => {
    files.forEach((f) => {
      if (f.processedDataUrl) {
        const baseName = f.file.name.replace(/\.[^/.]+$/, "").trim() || "Image";
        const a = document.createElement("a");
        a.href = f.processedDataUrl;
        a.download = `${baseName}_OK.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col transition-colors ${
          isLight
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-slate-900 border-slate-800 text-slate-100"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 shrink-0 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                Traitement d'Événement par Lot
              </h3>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Exportation automatique au format <span className="font-semibold text-emerald-500">nomd'origine_OK.jpg</span>
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

        {/* Preset Selector */}
        <div className="space-y-1.5 shrink-0 text-xs">
          <label className={`font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
            Préréglage à Appliquer au Lot :
          </label>
          <select
            value={selectedPreset.id}
            onChange={(e) => {
              const p = EVENT_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) setSelectedPreset(p);
            }}
            className={`w-full p-2.5 rounded-xl border font-medium ${
              isLight
                ? "bg-slate-50 border-slate-300 text-slate-900"
                : "bg-slate-950 border-slate-800 text-slate-200"
            }`}
          >
            {EVENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Multiple Files */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border shrink-0 ${
            isLight
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          <span className="text-xs">Sélectionnez plusieurs photos d'événement :</span>
          <label className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition shadow">
            <Upload className="w-3.5 h-3.5" />
            <span>Ajouter Photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Files Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1 custom-scrollbar">
          {files.map((f) => {
            const baseName = f.file.name.replace(/\.[^/.]+$/, "").trim() || "Image";
            return (
              <div
                key={f.id}
                className={`p-2 rounded-xl border relative group overflow-hidden ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-800"
                    : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              >
                <img
                  src={f.processedDataUrl || f.previewUrl}
                  alt={f.file.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[10px] truncate block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {f.file.name}
                  </span>
                  {f.status === "completed" && (
                    <span className="text-[9px] font-mono font-bold text-emerald-500">
                      {baseName}_OK.jpg
                    </span>
                  )}
                </div>

                {f.status === "completed" && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-emerald-500 text-white shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {f.status === "processing" && (
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div
          className={`flex items-center justify-between border-t pt-4 shrink-0 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {files.length} photo(s) chargée(s)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={processBatch}
              disabled={files.length === 0 || isProcessing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? "Traitement..." : "Lancer le Traitement"}</span>
            </button>

            <button
              onClick={downloadAll}
              disabled={!files.some((f) => f.status === "completed")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Tout Télécharger (*_OK.jpg)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
