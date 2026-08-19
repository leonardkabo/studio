import React from "react";
import {
  Sparkles,
  Scissors,
  Type,
  Smile,
  Wand2,
  Brush,
  Zap,
  Layers,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface QuickToolsBarProps {
  isHealingBrushActive: boolean;
  onToggleHealingBrush: () => void;
  onOpenTextModal: () => void;
  onOpenOverlayModal: () => void;
  onOpenBgModal: () => void;
  onAutoCleanBlemishes: () => void;
  onQuickSkinSmooth: () => void;
}

export const QuickToolsBar: React.FC<QuickToolsBarProps> = ({
  isHealingBrushActive,
  onToggleHealingBrush,
  onOpenTextModal,
  onOpenOverlayModal,
  onOpenBgModal,
  onAutoCleanBlemishes,
  onQuickSkinSmooth,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`px-4 py-1.5 flex items-center justify-between space-x-2 overflow-x-auto no-scrollbar z-10 text-xs shadow-xs border-b transition-colors ${
        isLight
          ? "bg-slate-50 border-slate-200 text-slate-800"
          : "bg-slate-950 border-slate-800 text-slate-200"
      }`}
    >
      <div className="flex items-center space-x-2 shrink-0">
        <span
          className={`font-semibold uppercase tracking-wider flex items-center space-x-1 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Outils Express :</span>
        </span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto py-0.5 no-scrollbar shrink-0">
        {/* Pinceau Anti-Boutons & Taches */}
        <button
          onClick={onToggleHealingBrush}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg font-semibold transition border cursor-pointer ${
            isHealingBrushActive
              ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse"
              : isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Cliquez sur l'image pour effacer automatiquement les boutons, acné et taches sur le visage ou le corps"
        >
          <Brush className="w-3.5 h-3.5 text-rose-500" />
          <span>{isHealingBrushActive ? "Pinceau Anti-Boutons ACTIF" : "Tampon Anti-Boutons & Taches"}</span>
        </button>

        {/* Auto Nettoyage Peau & Visage avec Flou Gaussien */}
        <button
          onClick={onAutoCleanBlemishes}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg border font-semibold transition cursor-pointer ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Studio Auto Visage : Détection des boutons, flou gaussien sur les zones tachetées et ajustements sur-mesure"
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Auto Nettoyage & Flou Visage</span>
        </button>

        {/* Lisser la Peau */}
        <button
          onClick={onQuickSkinSmooth}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg border font-semibold transition cursor-pointer ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Applique un lissage de peau naturel tout en conservant les pores et la netteté"
        >
          <Smile className="w-3.5 h-3.5 text-pink-500" />
          <span>Lisser la Peau IA</span>
        </button>

        {/* Suppression Arrière-Plan */}
        <button
          onClick={onOpenBgModal}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg border font-semibold transition cursor-pointer ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Détoure le sujet principal et supprime l'arrière-plan"
        >
          <Scissors className="w-3.5 h-3.5 text-emerald-500" />
          <span>Suppression Arrière-Plan</span>
        </button>

        {/* Incrustation Seconde Image / Logo */}
        <button
          onClick={onOpenOverlayModal}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg border font-semibold transition cursor-pointer ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Importer, rogner et superposer une seconde image ou un logo"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>Incruster Image & Logo</span>
        </button>

        {/* Signature & Texte */}
        <button
          onClick={onOpenTextModal}
          className={`flex items-center space-x-1.5 px-3 py-1.2 rounded-lg border font-semibold transition cursor-pointer ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
          title="Ajouter une signature calligraphique ou du texte avec aperçu en temps réel"
        >
          <Type className="w-3.5 h-3.5 text-violet-500" />
          <span>Signature & Texte</span>
        </button>
      </div>
    </div>
  );
};
