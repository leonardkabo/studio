import React, { useState, useRef, useEffect } from "react";
import { X, Check, Lock, RotateCcw, Sliders, Brush as BrushIcon } from "lucide-react";
import { BrushSettings, BrushTipPreset } from "../types";

interface BrushSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brushSettings: BrushSettings;
  onUpdateBrushSettings: (newSettings: BrushSettings) => void;
}

export const DEFAULT_BRUSH_TIPS: BrushTipPreset[] = [
  { id: "tip-30-soft", name: "Rond Doux 30", size: 30, type: "soft", iconLabel: "30" },
  { id: "tip-123-hard", name: "Rond Dur 123", size: 123, type: "hard", iconLabel: "123" },
  { id: "tip-8-fine", name: "Pointe Fine 8", size: 8, type: "fine", iconLabel: "8" },
  { id: "tip-10-detail", name: "Détail 10", size: 10, type: "fine", iconLabel: "10" },
  { id: "tip-25-texture", name: "Texture 25", size: 25, type: "fuzzy", iconLabel: "25" },
  { id: "tip-112-broad", name: "Pinceau Large 112", size: 112, type: "broad", iconLabel: "112" },
  { id: "tip-60-speckle", name: "Moucheté 60", size: 60, type: "speckle", iconLabel: "60" },
  { id: "tip-50-oval", name: "Oval 50", size: 50, type: "soft", iconLabel: "50" },
  { id: "tip-25-dry", name: "Pinceau Sec 25", size: 25, type: "chalk", iconLabel: "25" },
  { id: "tip-30-airbrush", name: "Aérographe 30", size: 30, type: "soft", iconLabel: "30" },
  { id: "tip-50-medium", name: "Moyen 50", size: 50, type: "hard", iconLabel: "50" },
  { id: "tip-60-flat", name: "Plat 60", size: 60, type: "broad", iconLabel: "60" },
  { id: "tip-100-broad", name: "Large 100", size: 100, type: "broad", iconLabel: "100" },
  { id: "tip-127-fan", name: "Éventail 127", size: 127, type: "speckle", iconLabel: "127" },
  { id: "tip-284-spray", name: "Spray 284", size: 284, type: "speckle", iconLabel: "284" },
  { id: "tip-80-dots", name: "Gouttes 80", size: 80, type: "speckle", iconLabel: "80" },
  { id: "tip-174-hatch", name: "Hachure 174", size: 174, type: "chalk", iconLabel: "174" },
  { id: "tip-175-grain", name: "Grain 175", size: 175, type: "fuzzy", iconLabel: "175" },
  { id: "tip-306-scatter", name: "Dispersion 306", size: 306, type: "speckle", iconLabel: "306" },
  { id: "tip-50-smooth", name: "Lisse 50", size: 50, type: "hard", iconLabel: "50" },
  { id: "tip-16-hair", name: "Ligne Fine 16", size: 16, type: "fine", iconLabel: "16" },
];

export const BrushSettingsModal: React.FC<BrushSettingsModalProps> = ({
  isOpen,
  onClose,
  brushSettings,
  onUpdateBrushSettings,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const compassWidgetRef = useRef<HTMLDivElement>(null);
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Update real-time stroke preview
  useEffect(() => {
    if (!previewCanvasRef.current || !isOpen) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid for stroke preview
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render brush stroke path curve
    ctx.save();
    ctx.beginPath();

    const w = canvas.width;
    const h = canvas.height;
    const centerY = h / 2;

    // Draw wavy sinusoidal line
    const points: { x: number; y: number }[] = [];
    for (let x = 30; x <= w - 30; x += 2) {
      const y = centerY + Math.sin((x / w) * Math.PI * 3) * 16;
      points.push({ x, y });
    }

    // Render brush stamps along the path according to spacing, hardness, angle, roundness
    const radius = Math.max(2, brushSettings.size / 6);
    const hardness = brushSettings.hardness / 100;
    const angleRad = (brushSettings.angle * Math.PI) / 180;
    const roundFactor = Math.max(0.05, brushSettings.roundness / 100);

    for (let i = 0; i < points.length; i += Math.max(1, Math.floor(brushSettings.spacing / 8))) {
      const p = points[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angleRad);

      // Create radial gradient for soft/hard edge
      const grad = ctx.createRadialGradient(0, 0, radius * hardness, 0, 0, radius);
      grad.addColorStop(0, "rgba(20, 20, 25, 0.95)");
      if (hardness < 1) {
        grad.addColorStop(1, "rgba(20, 20, 25, 0)");
      } else {
        grad.addColorStop(1, "rgba(20, 20, 25, 0.95)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Apply oval roundness squishing
      ctx.ellipse(0, 0, radius, radius * roundFactor, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [brushSettings, isOpen]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof BrushSettings>(key: K, val: BrushSettings[K]) => {
    onUpdateBrushSettings({
      ...brushSettings,
      [key]: val,
    });
  };

  // Interactive compass angle and roundness mouse drag handler
  const handleCompassMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCompass(true);
    updateCompassPos(e);
  };

  const updateCompassPos = (e: React.MouseEvent | MouseEvent) => {
    if (!compassWidgetRef.current) return;
    const rect = compassWidgetRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Angle calculation (0 - 360)
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    // Distance calculation for Roundness / Arrondi (0% at center, 100% at edge)
    const maxRadius = rect.width / 2;
    const dist = Math.min(maxRadius, Math.sqrt(dx * dx + dy * dy));
    const roundness = Math.round(Math.max(5, (dist / maxRadius) * 100));

    onUpdateBrushSettings({
      ...brushSettings,
      angle: Math.round(deg),
      roundness,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#2b2d31] border border-[#3e4147] rounded-xl shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col max-h-[90vh]">
        {/* Modal Window Header */}
        <div className="bg-[#1e1f22] px-4 py-2.5 flex items-center justify-between border-b border-[#3e4147]">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-xs uppercase tracking-wider text-[#f2f3f5] flex items-center space-x-1.5">
              <BrushIcon className="w-4 h-4 text-indigo-400" />
              <span>Paramètres de pinceau</span>
            </span>
            <button className="px-3 py-1 bg-[#2b2d31] border border-[#3e4147] rounded text-xs font-semibold text-slate-300 hover:text-white transition">
              Pinceaux
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#35373c] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left options list + Right Brush parameters */}
        <div className="flex-1 flex overflow-hidden min-h-[460px]">
          {/* Left Column: Forme de la pointe + Dynamics List */}
          <div className="w-64 bg-[#232428] border-r border-[#3e4147] p-2 space-y-1 overflow-y-auto text-xs">
            {/* Active Selected Tab */}
            <div className="flex items-center justify-between px-3 py-2 rounded bg-[#35373c] text-white font-bold border-l-4 border-indigo-500">
              <span>Forme de la pointe de pinceau</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Configurable dynamics options */}
            {[
              { key: "shapeDynamics", label: "Dynamique de forme" },
              { key: "diffusion", label: "Diffusion" },
              { key: "texture", label: "Texture" },
              { key: "dualBrush", label: "Pinceau double" },
              { key: "colorDynamics", label: "Dynamique de la couleur" },
              { key: "transfer", label: "Transfert" },
              { key: "brushPose", label: "Pose du pinceau" },
              { key: "noise", label: "Bruit" },
              { key: "wetEdges", label: "Bords humides" },
              { key: "accumulation", label: "Accumulation" },
              { key: "smoothing", label: "Lissage" },
              { key: "protectTexture", label: "Protéger la texture" },
            ].map((opt) => {
              const isChecked = Boolean(brushSettings[opt.key as keyof BrushSettings]);
              return (
                <label
                  key={opt.key}
                  className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-[#2b2d31] cursor-pointer text-[#b5bac1] hover:text-white transition"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        updateSetting(opt.key as keyof BrushSettings, e.target.checked)
                      }
                      className="w-3.5 h-3.5 rounded bg-[#1e1f22] border-[#3e4147] accent-indigo-500"
                    />
                    <span>{opt.label}</span>
                  </div>
                  <Lock className="w-3 h-3 text-slate-500" />
                </label>
              );
            })}
          </div>

          {/* Right Area: Presets Grid + Sliders + Compass Control */}
          <div className="flex-1 p-4 bg-[#2b2d31] flex flex-col space-y-4 overflow-y-auto">
            {/* Brush Tips Grid Selector */}
            <div className="bg-[#1e1f22] border border-[#3e4147] rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                {DEFAULT_BRUSH_TIPS.map((tip) => {
                  const isSelected = brushSettings.selectedTipId === tip.id;
                  return (
                    <button
                      key={tip.id}
                      onClick={() => {
                        onUpdateBrushSettings({
                          ...brushSettings,
                          selectedTipId: tip.id,
                          size: tip.size,
                          hardness: tip.type === "soft" ? 0 : tip.type === "hard" ? 100 : 50,
                        });
                      }}
                      className={`p-2 rounded flex flex-col items-center justify-center transition border cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-400"
                          : "bg-[#2b2d31] border-[#3e4147] text-slate-300 hover:border-slate-500 hover:bg-[#35373c]"
                      }`}
                      title={tip.name}
                    >
                      {/* Visual Tip Shape Icon */}
                      <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center mb-1">
                        <span
                          className={`rounded-full bg-white transition-all ${
                            tip.type === "soft"
                              ? "blur-[1px] opacity-80"
                              : tip.type === "fine"
                              ? "w-1.5 h-1.5"
                              : "w-4 h-4"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-mono leading-none">{tip.iconLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Controls & Interactive Compass */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start text-xs">
              {/* Sliders Column */}
              <div className="md:col-span-8 space-y-3">
                {/* Taille Slider */}
                <div className="flex items-center space-x-3">
                  <span className="w-16 font-semibold text-slate-300">Taille</span>
                  <input
                    type="range"
                    min={1}
                    max={300}
                    value={brushSettings.size}
                    onChange={(e) => updateSetting("size", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#1e1f22] rounded accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={brushSettings.size}
                      onChange={(e) => updateSetting("size", Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 rounded bg-[#1e1f22] border border-[#3e4147] text-right text-xs font-mono text-white focus:outline-none"
                    />
                    <span className="text-slate-400">px</span>
                  </div>
                </div>

                {/* Symétrie X / Symétrie Y */}
                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={brushSettings.flipX}
                      onChange={(e) => updateSetting("flipX", e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-[#1e1f22] border-[#3e4147] accent-indigo-500"
                    />
                    <span>Symétrie X</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={brushSettings.flipY}
                      onChange={(e) => updateSetting("flipY", e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-[#1e1f22] border-[#3e4147] accent-indigo-500"
                    />
                    <span>Symétrie Y</span>
                  </label>
                </div>

                {/* Angle & Arrondi Inputs */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-16 text-slate-300">Angle :</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={brushSettings.angle}
                      onChange={(e) => updateSetting("angle", Number(e.target.value))}
                      className="w-20 px-1.5 py-0.5 rounded bg-[#1e1f22] border border-[#3e4147] text-right font-mono text-white focus:outline-none"
                    />
                    <span className="text-slate-400">°</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="w-16 text-slate-300">Arrondi :</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={brushSettings.roundness}
                      onChange={(e) => updateSetting("roundness", Number(e.target.value))}
                      className="w-20 px-1.5 py-0.5 rounded bg-[#1e1f22] border border-[#3e4147] text-right font-mono text-white focus:outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                {/* Dureté Slider */}
                <div className="flex items-center space-x-3 pt-1">
                  <span className="w-16 font-semibold text-slate-300">Dureté</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={brushSettings.hardness}
                    onChange={(e) => updateSetting("hardness", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#1e1f22] rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="w-12 text-right font-mono text-slate-300">
                    {brushSettings.hardness} %
                  </span>
                </div>

                {/* Pas Slider */}
                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-3.5 h-3.5 rounded bg-[#1e1f22] border-[#3e4147] accent-indigo-500"
                    />
                    <span className="font-semibold">Pas</span>
                  </label>

                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={brushSettings.spacing}
                    onChange={(e) => updateSetting("spacing", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#1e1f22] rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="w-12 text-right font-mono text-slate-300">
                    {brushSettings.spacing} %
                  </span>
                </div>
              </div>

              {/* Interactive Circle Target Angle & Roundness Widget (Col 4) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-2 bg-[#1e1f22] border border-[#3e4147] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Orientation & Arrondi
                </span>

                <div
                  ref={compassWidgetRef}
                  onMouseDown={handleCompassMouseDown}
                  onMouseMove={(e) => isDraggingCompass && updateCompassPos(e)}
                  onMouseUp={() => setIsDraggingCompass(false)}
                  onMouseLeave={() => setIsDraggingCompass(false)}
                  className="w-24 h-24 rounded-full border-2 border-slate-600 relative flex items-center justify-center bg-[#2b2d31] cursor-crosshair hover:border-indigo-400 transition"
                >
                  {/* Cardinal dots */}
                  <span className="w-2 h-2 rounded-full bg-slate-400 absolute top-1 left-1/2 -translate-x-1/2" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 absolute bottom-1 left-1/2 -translate-x-1/2" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 absolute left-1 top-1/2 -translate-y-1/2" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 absolute right-1 top-1/2 -translate-y-1/2" />

                  {/* Directional angle arrow line */}
                  <div
                    className="absolute w-full h-0.5 bg-indigo-500 origin-center pointer-events-none transition-transform"
                    style={{ transform: `rotate(${brushSettings.angle}deg)` }}
                  >
                    <div className="w-2 h-2 border-t-2 border-r-2 border-indigo-400 absolute right-0 -top-0.5 rotate-45" />
                  </div>

                  {/* Ellipse Roundness shape representation */}
                  <div
                    className="border border-indigo-400/80 rounded-full pointer-events-none transition-all"
                    style={{
                      width: `${Math.max(20, brushSettings.roundness)}%`,
                      height: "80%",
                      transform: `rotate(${brushSettings.angle}deg)`,
                    }}
                  />
                </div>

                <span className="text-[10px] text-slate-400 mt-2 font-mono">
                  {brushSettings.angle}° / {brushSettings.roundness}%
                </span>
              </div>
            </div>

            {/* Live Brush Stroke Preview Canvas */}
            <div className="border border-[#3e4147] rounded-lg overflow-hidden bg-white p-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Aperçu du Tracé du Pinceau
              </span>
              <canvas
                ref={previewCanvasRef}
                width={650}
                height={80}
                className="w-full h-20 rounded bg-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Window Footer */}
        <div className="bg-[#1e1f22] px-4 py-2.5 flex items-center justify-between border-t border-[#3e4147]">
          <span className="text-xs text-slate-400">
            Pinceau sélectionné : <strong>{brushSettings.size}px</strong> ({brushSettings.hardness}% dureté)
          </span>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            Valider & Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};
