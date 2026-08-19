import React, { useRef } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Move,
  RotateCw,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { LayerItem } from "../types";
import { useTheme } from "../context/ThemeContext";

interface LayersPanelProps {
  layers: LayerItem[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: (file: File) => void;
  onRemoveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayerOrder: (id: string, direction: "up" | "down") => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onUpdateLayerProp: (id: string, prop: keyof LayerItem, value: any) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayerOrder,
  onBringToFront,
  onSendToBack,
  onUpdateLayerProp,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div
      className={`border rounded-2xl overflow-hidden shadow-xs transition-colors text-xs ${
        isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
      }`}
    >
      {/* Panel Header */}
      <div
        className={`p-3 flex items-center justify-between border-b transition-colors ${
          isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className={`font-bold text-xs ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            Calques & Superposition ({layers.length})
          </span>
        </div>

        {/* Add photo layer button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer text-[11px] shadow-sm"
          title="Importer une photo supplémentaire comme nouveau calque"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter Photo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onAddLayer(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="p-3 space-y-3">
        {/* Layer Stack (Photoshop style: top layer first) */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
          {layers.length === 0 ? (
            <div
              className={`p-4 text-center rounded-xl border border-dashed transition-colors ${
                isLight
                  ? "text-slate-500 bg-slate-50 border-slate-200"
                  : "text-slate-500 bg-slate-900/40 border-slate-800"
              }`}
            >
              <p className="text-[11px]">Aucun calque secondaire.</p>
              <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-400" : "text-slate-600"}`}>
                Cliquez sur "+ Ajouter Photo" pour superposer des images.
              </p>
            </div>
          ) : (
            layers.map((layer, index) => {
              const isSelected = layer.id === activeLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`p-2 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-indigo-50 border-indigo-300 shadow-xs"
                        : "bg-indigo-950/40 border-indigo-500/60 shadow-sm"
                      : isLight
                      ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      : "bg-slate-900/80 border-slate-800/80 hover:bg-slate-850"
                  }`}
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Layer Thumbnail */}
                    <div
                      className={`w-9 h-9 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center ${
                        isLight
                          ? "bg-slate-200 border-slate-300 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#cbd5e1_0%_50%)] bg-[length:6px_6px]"
                          : "bg-slate-950 border-slate-700/80 bg-[repeating-conic-gradient(#334155_0%_25%,#1e293b_0%_50%)] bg-[length:6px_6px]"
                      }`}
                    >
                      <img
                        src={layer.imageSrc}
                        alt={layer.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-bold truncate text-[11px] ${
                            isSelected
                              ? isLight
                                ? "text-indigo-900 font-extrabold"
                                : "text-indigo-200"
                              : isLight
                              ? "text-slate-800"
                              : "text-slate-300"
                          }`}
                        >
                          {layer.name}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-2 text-[9px] font-mono ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                        <span>Pos: {Math.round(layer.x)}%, {Math.round(layer.y)}%</span>
                        <span>Op: {layer.opacity}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Visibility, Lock, Order, Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Move up / down */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayerOrder(layer.id, "up");
                      }}
                      disabled={index === 0}
                      className={`p-1 rounded disabled:opacity-20 cursor-pointer transition ${
                        isLight
                          ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title="Monter (vers l'avant)"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayerOrder(layer.id, "down");
                      }}
                      disabled={index === layers.length - 1}
                      className={`p-1 rounded disabled:opacity-20 cursor-pointer transition ${
                        isLight
                          ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title="Descendre (vers l'arrière)"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {/* Visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}
                      className={`p-1 rounded cursor-pointer transition ${
                        isLight
                          ? "text-slate-500 hover:text-indigo-600 hover:bg-slate-200"
                          : "text-slate-400 hover:text-indigo-300 hover:bg-slate-800"
                      }`}
                      title={layer.visible ? "Masquer le calque" : "Afficher le calque"}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveLayer(layer.id);
                      }}
                      className={`p-1 rounded cursor-pointer transition ${
                        isLight
                          ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          : "text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                      }`}
                      title="Supprimer ce calque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Layer Quick Adjustments */}
        {activeLayer && (
          <div
            className={`p-2.5 rounded-xl border space-y-2.5 transition-colors ${
              isLight
                ? "bg-slate-50 border-slate-200"
                : "bg-slate-900/90 border-slate-800"
            }`}
          >
            <div className={`flex items-center justify-between text-[11px] font-bold ${isLight ? "text-slate-800" : "text-slate-300"}`}>
              <span>Réglages Calque : <span className={isLight ? "text-indigo-600" : "text-indigo-400"}>{activeLayer.name}</span></span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onBringToFront(activeLayer.id)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                    isLight
                      ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                  title="Mettre tout au premier plan"
                >
                  Premier Plan
                </button>
                <button
                  onClick={() => onSendToBack(activeLayer.id)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition cursor-pointer ${
                    isLight
                      ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                  title="Mettre tout en arrière-plan"
                >
                  Arrière-Plan
                </button>
              </div>
            </div>

            {/* Opacity slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px]">
                <span className={isLight ? "text-slate-600" : "text-slate-400"}>Opacité</span>
                <span className={`font-mono font-bold ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>{activeLayer.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeLayer.opacity}
                onChange={(e) => onUpdateLayerProp(activeLayer.id, "opacity", Number(e.target.value))}
                className={`w-full accent-indigo-500 h-1 rounded-lg appearance-none cursor-pointer ${
                  isLight ? "bg-slate-200" : "bg-slate-950"
                }`}
              />
            </div>

            {/* Size / Scale Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px]">
                <span className={isLight ? "text-slate-600" : "text-slate-400"}>Taille / Échelle</span>
                <span className={`font-mono font-bold ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>{Math.round(activeLayer.width)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                value={activeLayer.width}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateLayerProp(activeLayer.id, "width", val);
                  onUpdateLayerProp(activeLayer.id, "height", val);
                }}
                className={`w-full accent-indigo-500 h-1 rounded-lg appearance-none cursor-pointer ${
                  isLight ? "bg-slate-200" : "bg-slate-950"
                }`}
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px]">
                <span className={isLight ? "text-slate-600" : "text-slate-400"}>Rotation</span>
                <span className={`font-mono font-bold ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>{activeLayer.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={activeLayer.rotation}
                onChange={(e) => onUpdateLayerProp(activeLayer.id, "rotation", Number(e.target.value))}
                className={`w-full accent-indigo-500 h-1 rounded-lg appearance-none cursor-pointer ${
                  isLight ? "bg-slate-200" : "bg-slate-950"
                }`}
              />
            </div>

            {/* Blend Mode Selector */}
            <div className="flex items-center justify-between pt-1 text-[10px]">
              <span className={isLight ? "text-slate-600" : "text-slate-400"}>Mode de Fusion</span>
              <select
                value={activeLayer.blendMode}
                onChange={(e) => onUpdateLayerProp(activeLayer.id, "blendMode", e.target.value as GlobalCompositeOperation)}
                className={`border rounded px-2 py-1 text-[10px] focus:outline-none ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-800"
                    : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Produit (Multiply)</option>
                <option value="screen">Superposition (Screen)</option>
                <option value="overlay">Incrustation (Overlay)</option>
                <option value="darken">Obscurcir</option>
                <option value="lighten">Éclaircir</option>
                <option value="color-dodge">Densité couleur -</option>
                <option value="color-burn">Densité couleur +</option>
                <option value="hard-light">Lumière crue</option>
                <option value="soft-light">Lumière tamisée</option>
                <option value="difference">Différence</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
