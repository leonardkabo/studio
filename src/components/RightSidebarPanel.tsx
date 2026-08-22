import React, { useState } from "react";
import {
  Wand2,
  Sliders,
  Palette,
  History,
  Sparkles,
  Sun,
  Thermometer,
  Eye,
  Smile,
  ShieldAlert,
  Bot,
  MessageSquare,
  BookmarkPlus,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Info,
  Brush,
  Scissors,
  Type,
  FolderClosed,
  FolderOpen,
  Layers,
  Zap,
} from "lucide-react";
import {
  AIAnalysisReport,
  AdjustmentSettings,
  BeautyOneClickFilter,
  HistoryItem,
  HSLChannel,
  LayerItem,
  SnapshotItem,
} from "../types";
import { BEAUTY_ONE_CLICK_FILTERS } from "../data/beautyFilters";
import { AutoFaceParams } from "../utils/imageTools";
import { LayersPanel } from "./LayersPanel";
import { useTheme } from "../context/ThemeContext";

interface RightSidebarPanelProps {
  settings: AdjustmentSettings;
  onSettingsChange: (newSettings: AdjustmentSettings) => void;
  aiReport?: AIAnalysisReport;
  isAiAnalyzing: boolean;
  onTriggerAiAnalysis: () => void;
  onCustomAiPrompt: (promptText: string) => void;
  history: HistoryItem[];
  historyIndex: number;
  onSelectHistoryIndex: (index: number) => void;
  snapshots: SnapshotItem[];
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshot: SnapshotItem) => void;
  isHealingBrushActive: boolean;
  onToggleHealingBrush: () => void;
  onOpenTextModal: () => void;
  onOpenBgModal: () => void;
  onAutoCleanBlemishes: () => void;
  onApplyBeautyFilter?: (filter: BeautyOneClickFilter) => void;
  activeBeautyFilterId?: string;
  activeBeautyFilterParams?: AutoFaceParams | null;
  onUpdateBeautyFilterParam?: (paramKey: keyof AutoFaceParams, value: number) => void;
  onResetBeautyFilterParams?: () => void;
  onRevertBeautyFilter?: () => void;
  onOpenAutoFaceModal?: () => void;
  onCloseMobile?: () => void;
  // Layers Support
  layers: LayerItem[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: (file: File) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onMoveLayerOrder: (id: string, direction: "up" | "down") => void;
  onBringLayerToFront: (id: string) => void;
  onSendLayerToBack: (id: string) => void;
  onUpdateLayerProp: (id: string, prop: keyof LayerItem, value: any) => void;
}

export const RightSidebarPanel: React.FC<RightSidebarPanelProps> = ({
  settings,
  onSettingsChange,
  aiReport,
  isAiAnalyzing,
  onTriggerAiAnalysis,
  onCustomAiPrompt,
  history,
  historyIndex,
  onSelectHistoryIndex,
  snapshots,
  onCreateSnapshot,
  onRestoreSnapshot,
  isHealingBrushActive,
  onToggleHealingBrush,
  onOpenTextModal,
  onOpenBgModal,
  onAutoCleanBlemishes,
  onApplyBeautyFilter,
  activeBeautyFilterId,
  activeBeautyFilterParams,
  onUpdateBeautyFilterParam,
  onResetBeautyFilterParams,
  onRevertBeautyFilter,
  onOpenAutoFaceModal,
  onCloseMobile,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onMoveLayerOrder,
  onBringLayerToFront,
  onSendLayerToBack,
  onUpdateLayerProp,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [snapshotName, setSnapshotName] = useState<string>("");
  const [showBeautySliders, setShowBeautySliders] = useState<boolean>(true);
  const [isSidebarDocked, setIsSidebarDocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("studio_sidebar_docked");
      return saved !== null ? saved === "true" : true; // Plié par défaut (true)
    } catch {
      return true;
    }
  });

  const handleToggleSidebarDocked = (docked: boolean) => {
    setIsSidebarDocked(docked);
    try {
      localStorage.setItem("studio_sidebar_docked", String(docked));
    } catch {
      // ignore
    }
  };
  const [isWideMode, setIsWideMode] = useState<boolean>(false);
  const [toolLayoutMode, setToolLayoutMode] = useState<"vertical" | "grid">("vertical");
  const [activeSubToolFilter, setActiveSubToolFilter] = useState<string>("all");

  // Photoshop Collapsible Window Panels State (true = unfolded, false = folded/plié)
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    layers: true, // Calques & Superposition
    beauty: true, // Beauté & Visage
    studio: false, // Studio & Incrustation
    light: true, // Lumière & Tonalité
    color: false, // Balance des blancs & Couleurs
    details: false, // Piqué, Dépiqué & Bruit
    hsl: false, // Gradation HSL
    ai: false, // Assistant IA Gemini
    history: false, // Historique & Instantanés
  });

  const togglePanel = (key: string) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Click Fold All (Tout Plier)
  const foldAllPanels = () => {
    setOpenPanels({
      layers: false,
      beauty: false,
      studio: false,
      light: false,
      color: false,
      details: false,
      hsl: false,
      ai: false,
      history: false,
    });
  };

  // 1-Click Unfold All (Tout Déplier)
  const unfoldAllPanels = () => {
    setOpenPanels({
      layers: true,
      beauty: true,
      studio: true,
      light: true,
      color: true,
      details: true,
      hsl: true,
      ai: true,
      history: true,
    });
  };

  // 1-Click Focus on specific panel only
  const focusOnlyPanel = (key: string) => {
    setOpenPanels({
      layers: key === "layers",
      beauty: key === "beauty",
      studio: key === "studio",
      light: key === "light",
      color: key === "color",
      details: key === "details",
      hsl: key === "hsl",
      ai: key === "ai",
      history: key === "history",
    });
  };

  // Helper slider update handler
  const handleValueChange = (key: keyof AdjustmentSettings, val: number) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  // HSL channel slider update handler
  const handleHslChange = (
    channel: keyof AdjustmentSettings["hsl"],
    property: keyof HSLChannel,
    val: number
  ) => {
    onSettingsChange({
      ...settings,
      hsl: {
        ...settings.hsl,
        [channel]: {
          ...settings.hsl[channel],
          [property]: val,
        },
      },
    });
  };

  const submitCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onCustomAiPrompt(customPrompt.trim());
    setCustomPrompt("");
  };

  const handleCreateSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label = snapshotName.trim() || `Instantané ${snapshots.length + 1}`;
    onCreateSnapshot(label);
    setSnapshotName("");
  };

  const { theme } = useTheme();
  const isLight = theme === "light";

  if (isSidebarDocked) {
    return (
      <div
        className={`border-l flex flex-col items-center py-4 px-2 space-y-4 z-20 shadow-xl transition-all select-none w-14 shrink-0 ${
          isLight
            ? "bg-white/95 border-slate-200 text-slate-700 backdrop-blur-xs"
            : "bg-slate-900/95 border-slate-800 text-slate-300 backdrop-blur-xs"
        }`}
      >
        <button
          onClick={() => handleToggleSidebarDocked(false)}
          className="w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/35 transition-all transform hover:scale-105 flex items-center justify-center cursor-pointer"
          title="Déplier le panneau latéral de retouche"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col items-center space-y-4 pt-3 text-[11px] font-semibold">
          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("layers");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                : "hover:bg-indigo-950/50 text-slate-400 hover:text-indigo-400"
            }`}
            title="Calques & Superpositions"
          >
            Calques
          </button>

          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("beauty");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-pink-50 text-slate-600 hover:text-pink-600"
                : "hover:bg-pink-950/50 text-slate-400 hover:text-pink-400"
            }`}
            title="Beauté & Visage"
          >
            Beauté
          </button>

          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("light");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-amber-50 text-slate-600 hover:text-amber-600"
                : "hover:bg-amber-950/50 text-slate-400 hover:text-amber-400"
            }`}
            title="Lumière & Tonalité"
          >
            Lumière
          </button>

          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("hsl");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-cyan-50 text-slate-600 hover:text-cyan-600"
                : "hover:bg-cyan-950/50 text-slate-400 hover:text-cyan-400"
            }`}
            title="Couleurs & HSL"
          >
            HSL
          </button>

          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("ai");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                : "hover:bg-indigo-950/50 text-slate-400 hover:text-indigo-400"
            }`}
            title="Assistant IA Gemini"
          >
            IA
          </button>

          <button
            onClick={() => {
              handleToggleSidebarDocked(false);
              focusOnlyPanel("history");
            }}
            className={`px-1.5 py-1 rounded-lg transition cursor-pointer text-center ${
              isLight
                ? "hover:bg-emerald-50 text-slate-600 hover:text-emerald-600"
                : "hover:bg-emerald-950/50 text-slate-400 hover:text-emerald-400"
            }`}
            title="Historique & Instantanés"
          >
            Hist.
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`border-l flex flex-col h-full z-10 select-none shadow-2xl transition-all duration-200 ${
        isWideMode ? "w-full md:w-[540px] lg:w-[620px]" : "w-full sm:w-96 md:w-88 lg:w-96"
      } ${
        isLight
          ? "bg-slate-50/95 border-slate-200 text-slate-900 shadow-slate-300/50"
          : "bg-slate-900 border-slate-800 text-slate-100 shadow-2xl"
      }`}
    >
      {/* Top Dock Control Bar - Clean Typography & Layout Toggles */}
      <div
        className={`border-b p-2.5 flex items-center justify-between shrink-0 transition-colors ${
          isLight ? "bg-white border-slate-200" : "bg-slate-950 border-slate-800"
        }`}
      >
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              isLight ? "text-slate-800" : "text-slate-100"
            }`}
          >
            Panneaux d'Outils
          </span>

          {/* Grid / Vertical Layout Toggle for Desktop */}
          <div className="hidden sm:flex items-center space-x-1 border rounded-lg p-0.5 border-slate-700/50">
            <button
              onClick={() => setToolLayoutMode("vertical")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                toolLayoutMode === "vertical"
                  ? "bg-indigo-600 text-white"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Affichage Vertical classique"
            >
              Vertical
            </button>
            <button
              onClick={() => {
                setToolLayoutMode("grid");
                setIsWideMode(true);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                toolLayoutMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Affichage Grille 2-colonnes / Panoramique"
            >
              Grille
            </button>
          </div>
        </div>

        {/* Global Fold / Unfold Control & Dock / Expand Button */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={foldAllPanels}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
            title="Plier toutes les fenêtres pour aérer l'interface"
          >
            Tout Plier
          </button>

          <button
            onClick={unfoldAllPanels}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
            title="Déplier toutes les fenêtres pour tout afficher"
          >
            Tout Déplier
          </button>

          {/* Desktop Wide Mode Toggle */}
          <button
            onClick={() => setIsWideMode(!isWideMode)}
            className={`hidden lg:inline-flex px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
              isWideMode
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
            title={isWideMode ? "Réduire la largeur" : "Élargir le panneau (Vue Grille)"}
          >
            {isWideMode ? "Normal" : "Élargir"}
          </button>

          {/* Mobile Close or Desktop Dock */}
          {onCloseMobile ? (
            <button
              onClick={onCloseMobile}
              className={`p-1 rounded-lg transition cursor-pointer md:hidden ${
                isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Fermer le tiroir"
            >
              ✕
            </button>
          ) : null}

          <button
            onClick={() => handleToggleSidebarDocked(true)}
            className={`hidden md:inline-flex p-1 rounded-lg transition cursor-pointer ${
              isLight
                ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Masquer le panneau pour agrandir la photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Direct Jump Filter Pills - Clean Text Only */}
      <div
        className={`border-b px-2 py-1.5 flex items-center space-x-1 overflow-x-auto no-scrollbar shrink-0 text-[11px] transition-colors ${
          isLight ? "bg-slate-100/90 border-slate-200" : "bg-slate-950/80 border-slate-800/80"
        }`}
      >
        {[
          { id: "layers", label: "Calques" },
          { id: "beauty", label: "Beauté" },
          { id: "studio", label: "Studio" },
          { id: "light", label: "Lumière" },
          { id: "color", label: "Couleurs" },
          { id: "details", label: "Piqué" },
          { id: "hsl", label: "HSL" },
          { id: "ai", label: "IA" },
          { id: "history", label: "Historique" },
        ].map((cat) => {
          const isOpen = openPanels[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => focusOnlyPanel(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                isOpen
                  ? "bg-indigo-600 text-white shadow-sm"
                  : isLight
                  ? "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                  : "bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion Window Panels Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* ================= FENÊTRE CALQUES & SUPERPOSITION ================= */}
        {openPanels.layers && (
          <LayersPanel
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={onSelectLayer}
            onAddLayer={onAddLayer}
            onRemoveLayer={onRemoveLayer}
            onToggleVisibility={onToggleLayerVisibility}
            onToggleLock={onToggleLayerLock}
            onMoveLayerOrder={onMoveLayerOrder}
            onBringToFront={onBringLayerToFront}
            onSendToBack={onSendLayerToBack}
            onUpdateLayerProp={onUpdateLayerProp}
          />
        )}

        {/* ================= FENÊTRE 1: BEAUTÉ & VISAGE ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("beauty")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>1. Retouche Beauté & Visage</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.beauty ? "Déplié" : "Plié"}
              </span>
              {openPanels.beauty ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.beauty && (
            <div
              className={`p-3.5 space-y-4 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              {/* 1-Click Pro Beauty Filters Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? "text-amber-700" : "text-amber-300"}`}>
                    Filtres Peau Pro 1-Clic
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isLight
                        ? "text-slate-600 bg-slate-100 border-slate-200"
                        : "text-slate-400 bg-slate-900 border-slate-800"
                    }`}
                  >
                    Instant Studio
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {BEAUTY_ONE_CLICK_FILTERS.map((filter) => {
                    const isActive = activeBeautyFilterId === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => onApplyBeautyFilter?.(filter)}
                        title={`${filter.name} : ${filter.description}`}
                        className={`w-full px-3 py-2 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? isLight
                              ? "bg-amber-50 border-amber-400 shadow-xs shadow-amber-500/10 font-bold"
                              : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 shadow-md shadow-amber-500/10 font-bold"
                            : isLight
                            ? "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                            : "bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 flex-1 pr-2">
                          <span
                            className={`text-xs font-semibold transition ${
                              isLight
                                ? "text-slate-800 group-hover:text-amber-700"
                                : "text-slate-200 group-hover:text-amber-300"
                            } ${isActive ? "font-bold" : ""}`}
                          >
                            {filter.name}
                          </span>
                          {isActive && <Check className={`w-3.5 h-3.5 shrink-0 ${isLight ? "text-amber-600" : "text-amber-400"}`} />}
                        </div>
                        <span
                          className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                            isActive
                              ? isLight
                                ? "bg-amber-200 text-amber-900 border-amber-300"
                                : "bg-amber-500/30 text-amber-300 border-amber-500/40"
                              : isLight
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-slate-950 text-amber-400 border-slate-800"
                          }`}
                        >
                          {filter.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Manual Readjustment Sliders Section */}
              <div
                className={`p-3 rounded-2xl border space-y-3 shadow-xs ${
                  isLight
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-slate-900/90 border-amber-500/30 shadow-md shadow-amber-500/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowBeautySliders(!showBeautySliders)}
                    className="flex items-center space-x-1.5 text-left cursor-pointer group"
                  >
                    <span
                      className={`text-[11px] font-bold transition ${
                        isLight ? "text-amber-900 group-hover:text-amber-700" : "text-amber-200 group-hover:text-amber-100"
                      }`}
                    >
                      Réglages Manuels du Filtre
                    </span>
                    {activeBeautyFilterId && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                          isLight
                            ? "bg-amber-200 text-amber-900 border-amber-300"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {BEAUTY_ONE_CLICK_FILTERS.find((f) => f.id === activeBeautyFilterId)?.shortName || "Actif"}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center space-x-1">
                    {activeBeautyFilterId && onResetBeautyFilterParams && (
                      <button
                        onClick={onResetBeautyFilterParams}
                        className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          isLight
                            ? "text-slate-600 hover:text-amber-800 bg-white border-slate-200"
                            : "text-slate-400 hover:text-amber-300 bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                        title="Réinitialiser aux valeurs d'origine du filtre"
                      >
                        Défaut
                      </button>
                    )}
                    {activeBeautyFilterId && onRevertBeautyFilter && (
                      <button
                        onClick={onRevertBeautyFilter}
                        className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          isLight
                            ? "text-rose-600 hover:text-rose-700 bg-rose-50 border-rose-200"
                            : "text-rose-400 hover:text-rose-300 bg-rose-950/40 border-rose-900/40"
                        }`}
                        title="Annuler le filtre peau et revenir à l'image d'origine"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>

                {showBeautySliders && (
                  <div
                    className={`space-y-3 pt-1 border-t ${
                      isLight ? "border-amber-200/80" : "border-slate-800/80"
                    }`}
                  >
                    {/* 1. Blemish Removal */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Suppression Boutons & Acné
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-amber-700" : "text-amber-400"}`}>
                          {(activeBeautyFilterParams?.blemishRemoval ?? 75)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeBeautyFilterParams?.blemishRemoval ?? 75}
                        onChange={(e) => onUpdateBeautyFilterParam?.("blemishRemoval", Number(e.target.value))}
                        className={`w-full accent-amber-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 2. Gaussian Blur Frequency Smoothing */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Lissage & Flou Fréquence
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-sky-700" : "text-sky-400"}`}>
                          {(activeBeautyFilterParams?.gaussianBlurRadius ?? 8)} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={activeBeautyFilterParams?.gaussianBlurRadius ?? 8}
                        onChange={(e) => onUpdateBeautyFilterParam?.("gaussianBlurRadius", Number(e.target.value))}
                        className={`w-full accent-sky-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 3. Studio Cheek Glow & Highlight */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Éclat Pommettes & Glow 3D
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-amber-700" : "text-amber-300"}`}>
                          {(activeBeautyFilterParams?.glowIntensity ?? 40)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeBeautyFilterParams?.glowIntensity ?? 40}
                        onChange={(e) => onUpdateBeautyFilterParam?.("glowIntensity", Number(e.target.value))}
                        className={`w-full accent-amber-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 4. Preserve Details */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Protection Yeux & Lèvres
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                          {(activeBeautyFilterParams?.preserveDetails ?? 75)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={activeBeautyFilterParams?.preserveDetails ?? 75}
                        onChange={(e) => onUpdateBeautyFilterParam?.("preserveDetails", Number(e.target.value))}
                        className={`w-full accent-emerald-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 5. Skin Warmth */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Chaleur & Teinte Dorée
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-orange-700" : "text-orange-400"}`}>
                          {(activeBeautyFilterParams?.skinWarmth ?? 5) > 0 ? `+${activeBeautyFilterParams?.skinWarmth ?? 5}` : (activeBeautyFilterParams?.skinWarmth ?? 5)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={activeBeautyFilterParams?.skinWarmth ?? 5}
                        onChange={(e) => onUpdateBeautyFilterParam?.("skinWarmth", Number(e.target.value))}
                        className={`w-full accent-orange-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 6. Spot Sensitivity */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Sensibilité Détection Taches
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-rose-700" : "text-rose-400"}`}>
                          {(activeBeautyFilterParams?.sensitivity ?? 75)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={activeBeautyFilterParams?.sensitivity ?? 75}
                        onChange={(e) => onUpdateBeautyFilterParam?.("sensitivity", Number(e.target.value))}
                        className={`w-full accent-rose-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 7. Eye & Lip Pop Clarity */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Clarté Regard & Lèvres
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-indigo-700" : "text-indigo-400"}`}>
                          {(activeBeautyFilterParams?.eyeLipPop ?? 40)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeBeautyFilterParams?.eyeLipPop ?? 40}
                        onChange={(e) => onUpdateBeautyFilterParam?.("eyeLipPop", Number(e.target.value))}
                        className={`w-full accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>

                    {/* 8. Skin Tone Evenness */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Uniformité du Teint
                        </span>
                        <span className={`font-mono font-bold text-[10px] ${isLight ? "text-teal-700" : "text-teal-400"}`}>
                          {(activeBeautyFilterParams?.toneEvenness ?? 70)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeBeautyFilterParams?.toneEvenness ?? 70}
                        onChange={(e) => onUpdateBeautyFilterParam?.("toneEvenness", Number(e.target.value))}
                        className={`w-full accent-teal-500 h-1.5 rounded-lg appearance-none cursor-pointer ${
                          isLight ? "bg-slate-200" : "bg-slate-950"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Retouch Action Buttons */}
              <div
                className={`grid grid-cols-2 gap-2 text-xs pt-1 border-t ${
                  isLight ? "border-slate-200" : "border-slate-800/80"
                }`}
              >
                <button
                  onClick={onToggleHealingBrush}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col space-y-1 cursor-pointer ${
                    isHealingBrushActive
                      ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                      : isLight
                      ? "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300"
                      : "bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className={`font-bold ${isLight ? "text-rose-600" : "text-rose-400"}`}>Tampon Zone</span>
                  <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Effacer boutons & taches
                  </span>
                </button>

                <button
                  onClick={onOpenAutoFaceModal || onAutoCleanBlemishes}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col space-y-1 cursor-pointer ${
                    isLight
                      ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className={`font-bold ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>Atelier Studio IA</span>
                  <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Zones & masque pinceau
                  </span>
                </button>
              </div>

              {/* Skin Smoothing Slider */}
              <SliderControl
                label="Lissage Cutané Peau IA"
                value={settings.skinSmoothing || 0}
                min={0}
                max={100}
                onChange={(v) => handleValueChange("skinSmoothing", v)}
                isLight={isLight}
              />
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 2: STUDIO & INCRUSTATION ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("studio")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>2. Studio, Détourage & Incrustation</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.studio ? "Déplié" : "Plié"}
              </span>
              {openPanels.studio ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.studio && (
            <div
              className={`p-3.5 space-y-3 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={onOpenBgModal}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col space-y-1 cursor-pointer ${
                    isLight
                      ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                  }`}
                >
                  <span className={`font-bold ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>Effacer le Fond</span>
                  <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Détourage & Flou Bokeh
                  </span>
                </button>

                <button
                  onClick={onOpenTextModal}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col space-y-1 cursor-pointer ${
                    isLight
                      ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                  }`}
                >
                  <span className={`font-bold ${isLight ? "text-violet-700" : "text-violet-400"}`}>Signature & Filigrane</span>
                  <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Logos Sociaux, Marge 0px & Texte
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 3: LUMIÈRE & EXPOSITION ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("light")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>3. Exposition & Lumière</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.light ? "Déplié" : "Plié"}
              </span>
              {openPanels.light ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.light && (
            <div
              className={`p-3.5 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              } ${toolLayoutMode === "grid" || isWideMode ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}`}
            >
              <SliderControl
                label="Exposition"
                value={settings.exposure}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("exposure", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Contraste"
                value={settings.contrast}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("contrast", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Hautes Lumières"
                value={settings.highlights}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("highlights", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Ombres"
                value={settings.shadows}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("shadows", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Blancs"
                value={settings.whites}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("whites", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Noirs"
                value={settings.blacks}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("blacks", v)}
                isLight={isLight}
              />
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 4: COULEURS & BALANCE DES BLANCS ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("color")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>4. Balance des Blancs & Couleurs</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.color ? "Déplié" : "Plié"}
              </span>
              {openPanels.color ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.color && (
            <div
              className={`p-3.5 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              } ${toolLayoutMode === "grid" || isWideMode ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}`}
            >
              <SliderControl
                label="Température (°K)"
                value={settings.temperature}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("temperature", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Teinte (Vert / Magenta)"
                value={settings.tint}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("tint", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Vibrance"
                value={settings.vibrance}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("vibrance", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Saturation"
                value={settings.saturation}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("saturation", v)}
                isLight={isLight}
              />
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 5: PIQUÉ, DÉPIQUÉ & BRUIT ISO ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("details")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>5. Piqué, Clarté & Bruit ISO</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.details ? "Déplié" : "Plié"}
              </span>
              {openPanels.details ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.details && (
            <div
              className={`p-3.5 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              } ${toolLayoutMode === "grid" || isWideMode ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}`}
            >
              <SliderControl
                label="Clarté / Micro-contraste"
                value={settings.clarity}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("clarity", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Correction du Voile (Dehaze)"
                value={settings.dehaze}
                min={-100}
                max={100}
                onChange={(v) => handleValueChange("dehaze", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Netteté"
                value={settings.sharpness}
                min={0}
                max={100}
                onChange={(v) => handleValueChange("sharpness", v)}
                isLight={isLight}
              />
              <SliderControl
                label="Réduction du Bruit ISO"
                value={settings.noiseReduction}
                min={0}
                max={100}
                onChange={(v) => handleValueChange("noiseReduction", v)}
                isLight={isLight}
              />
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 6: GRADATION HSL (8 CANAUX) ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("hsl")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>6. Gradation Couleurs HSL (8 Canaux)</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.hsl ? "Déplié" : "Plié"}
              </span>
              {openPanels.hsl ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.hsl && (
            <div
              className={`p-3.5 space-y-3 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Ajustez individuellement la teinte, la saturation et la luminance de chaque nuance.
              </p>

              {([
                ["red", "Rouge", "bg-red-500"],
                ["orange", "Orange", "bg-orange-500"],
                ["yellow", "Jaune", "bg-yellow-500"],
                ["green", "Vert", "bg-green-500"],
                ["aqua", "Aqua", "bg-cyan-500"],
                ["blue", "Bleu", "bg-blue-500"],
                ["purple", "Violet", "bg-purple-500"],
                ["magenta", "Magenta", "bg-pink-500"],
              ] as const).map(([channelKey, label, dotBg]) => {
                const ch = settings.hsl[channelKey];
                return (
                  <div
                    key={channelKey}
                    className={`p-2.5 rounded-xl border space-y-2 transition-colors ${
                      isLight
                        ? "bg-slate-50 border-slate-200"
                        : "bg-slate-950 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotBg}`} />
                      <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        {label}
                      </span>
                    </div>

                    <SliderControl
                      label="Teinte"
                      value={ch.hue}
                      min={-100}
                      max={100}
                      onChange={(v) => handleHslChange(channelKey, "hue", v)}
                      isLight={isLight}
                    />
                    <SliderControl
                      label="Saturation"
                      value={ch.sat}
                      min={-100}
                      max={100}
                      onChange={(v) => handleHslChange(channelKey, "sat", v)}
                      isLight={isLight}
                    />
                    <SliderControl
                      label="Luminance"
                      value={ch.lum}
                      min={-100}
                      max={100}
                      onChange={(v) => handleHslChange(channelKey, "lum", v)}
                      isLight={isLight}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 7: ASSISTANT & DIAGNOSTIC IA ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("ai")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>7. Diagnostic & Assistant IA Gemini</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.ai ? "Déplié" : "Plié"}
              </span>
              {openPanels.ai ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.ai && (
            <div
              className={`p-3.5 space-y-4 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              <button
                onClick={onTriggerAiAnalysis}
                disabled={isAiAnalyzing}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isAiAnalyzing ? "Analyse Gemini en cours..." : "Lancer l'Auto-Diagnostic IA"}</span>
              </button>

              {aiReport && (
                <div
                  className={`p-3 rounded-xl border space-y-2 text-xs ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className={`font-bold uppercase text-[10px] ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
                    Diagnostique ({aiReport.photoCategory})
                  </div>
                  <p className={isLight ? "text-slate-700" : "text-slate-300"}>{aiReport.lightingDiagnosis}</p>
                  <p className={`italic ${isLight ? "text-indigo-700" : "text-indigo-200"}`}>{aiReport.proAdvice}</p>
                </div>
              )}

              <form onSubmit={submitCustomPrompt} className="space-y-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Rends les couleurs chaleureuses et lisses la peau du visage..."
                  rows={2}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none resize-none ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                      : "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isAiAnalyzing}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  Appliquer l'Instruction IA
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ================= FENÊTRE 8: HISTORIQUE & INSTANTANÉS ================= */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-xs transition-colors ${
            isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950/60"
          }`}
        >
          <button
            onClick={() => togglePanel("history")}
            className={`w-full p-3 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-900"
                : "bg-slate-950 hover:bg-slate-900 text-slate-100"
            }`}
          >
            <span>8. Historique des Actions ({history.length})</span>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {openPanels.history ? "Déplié" : "Plié"}
              </span>
              {openPanels.history ? (
                <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              )}
            </div>
          </button>

          {openPanels.history && (
            <div
              className={`p-3.5 space-y-4 border-t transition-colors ${
                isLight ? "border-slate-200 bg-white" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              {/* Snapshots Form */}
              <form onSubmit={handleCreateSnapshotSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="Nom de l'instantané..."
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                      : "bg-slate-950 border-slate-800 text-slate-200"
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Sauvegarder
                </button>
              </form>

              {/* Action Stack */}
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {history.map((item, idx) => {
                  const isCurrent = idx === historyIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectHistoryIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? isLight
                            ? "bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold"
                            : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold"
                          : isLight
                          ? "bg-slate-50 hover:bg-slate-100 text-slate-600"
                          : "bg-slate-950 hover:bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      <span>{item.actionName}</span>
                      {isCurrent && <Check className={`w-3.5 h-3.5 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

// Reusable Slider Component
function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
  isLight = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  isLight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        <span>{label}</span>
        <span
          onClick={() => onChange(0)}
          className={`font-mono font-semibold cursor-pointer hover:underline ${
            isLight ? "text-indigo-600" : "text-indigo-400"
          }`}
          title="Clic pour réinitialiser à 0"
        >
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
          isLight ? "bg-slate-200" : "bg-slate-800"
        }`}
      />
    </div>
  );
}
