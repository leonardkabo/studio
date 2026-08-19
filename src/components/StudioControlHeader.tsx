import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  AlignLeft,
} from "lucide-react";
import { EVENT_PRESETS } from "../data/presets";
import { BEAUTY_ONE_CLICK_FILTERS } from "../data/beautyFilters";
import { EventPreset, BeautyOneClickFilter, SelectionMode, SelectionState } from "../types";
import { useTheme } from "../context/ThemeContext";

interface StudioControlHeaderProps {
  activePresetId?: string;
  onSelectPreset: (preset: EventPreset) => void;
  activeBeautyFilterId?: string;
  onApplyBeautyFilter?: (filter: BeautyOneClickFilter) => void;
  onResetAdjustments: () => void;
  isHealingBrushActive: boolean;
  onToggleHealingBrush: () => void;
  onOpenTextModal: () => void;
  onOpenOverlayModal: () => void;
  onOpenBgModal: () => void;
  onAutoCleanBlemishes: () => void;
  onQuickSkinSmooth: () => void;
  onOpenAutoFaceModal?: () => void;
  // Selection Toolbar Support
  selectionState?: SelectionState;
  onSelectModeChange?: (mode: SelectionMode) => void;
  onClearSelection?: () => void;
  onAutoSelectSubject?: () => void;
  onDeleteOutsideSelection?: () => void;
  onDeleteInsideSelection?: () => void;
  onApplyRetouchInsideSelection?: () => void;
  isAnalyzingSubject?: boolean;
}

type ToolSetKey = "beauty" | "presets" | "express" | "selection";

export const StudioControlHeader: React.FC<StudioControlHeaderProps> = ({
  activePresetId,
  onSelectPreset,
  activeBeautyFilterId,
  onApplyBeautyFilter,
  onResetAdjustments,
  isHealingBrushActive,
  onToggleHealingBrush,
  onOpenTextModal,
  onOpenOverlayModal,
  onOpenBgModal,
  onAutoCleanBlemishes,
  onQuickSkinSmooth,
  onOpenAutoFaceModal,
  selectionState,
  onSelectModeChange,
  onClearSelection,
  onAutoSelectSubject,
  onDeleteOutsideSelection,
  onDeleteInsideSelection,
  onApplyRetouchInsideSelection,
  isAnalyzingSubject = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Active Tool Set (null = folded/plié)
  const [activeSet, setActiveSet] = useState<ToolSetKey | null>("beauty");
  const [layoutOrientation, setLayoutOrientation] = useState<"horizontal" | "vertical">("horizontal");

  const handleToggleSet = (setKey: ToolSetKey) => {
    if (activeSet === setKey) {
      // Re-click on the same active set folds/closes it
      setActiveSet(null);
    } else {
      // Click on a new set opens it
      setActiveSet(setKey);
    }
  };

  return (
    <div
      className={`border-b transition-colors z-20 shadow-xs ${
        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* Prime Abord : Les 4 Ensembles d'Outils Majeurs */}
      <div
        className={`px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b ${
          isLight ? "bg-white border-slate-200/80" : "bg-slate-950 border-slate-800/80"
        }`}
      >
        <div className="flex items-center space-x-2 shrink-0">
          {/* Ensemble 1: Filtres Peau Pro 1-Clic */}
          <button
            onClick={() => handleToggleSet("beauty")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeSet === "beauty"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-extrabold"
                : isLight
                ? "bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white"
            }`}
            title="Ouvrir / Fermer l'ensemble Filtres Peau Pro 1-Clic"
          >
            <span>Filtres Peau Pro 1-Clic ({BEAUTY_ONE_CLICK_FILTERS.length})</span>
            {activeSet === "beauty" ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-950" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {/* Ensemble 2: Lumières & Ambiances */}
          <button
            onClick={() => handleToggleSet("presets")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeSet === "presets"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-extrabold"
                : isLight
                ? "bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white"
            }`}
            title="Ouvrir / Fermer l'ensemble Lumières & Ambiances"
          >
            <span>Lumières & Ambiances ({EVENT_PRESETS.length})</span>
            {activeSet === "presets" ? (
              <ChevronUp className="w-3.5 h-3.5 text-white" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {/* Ensemble 3: Outils Express & Détourage */}
          <button
            onClick={() => handleToggleSet("express")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeSet === "express"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-extrabold"
                : isLight
                ? "bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white"
            }`}
            title="Ouvrir / Fermer l'ensemble Outils Express & Détourage"
          >
            <span>Outils Express & Détourage (6)</span>
            {activeSet === "express" ? (
              <ChevronUp className="w-3.5 h-3.5 text-white" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {/* Ensemble 4: Outils Sélection */}
          <button
            onClick={() => handleToggleSet("selection")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeSet === "selection"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-extrabold"
                : isLight
                ? "bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200"
                : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white"
            }`}
            title="Ouvrir / Fermer l'ensemble Outils Sélection"
          >
            <span>Outils Sélection (4)</span>
            {activeSet === "selection" ? (
              <ChevronUp className="w-3.5 h-3.5 text-white" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>
        </div>

        {/* Orientation Switcher & Global Fold indicator */}
        <div className="flex items-center space-x-2 shrink-0">
          {activeSet !== null && (
            <div
              className={`flex items-center space-x-1 p-0.5 rounded-lg border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-800"
              }`}
            >
              <button
                onClick={() => setLayoutOrientation("horizontal")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  layoutOrientation === "horizontal"
                    ? "bg-indigo-600 text-white"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Afficher les outils en ligne fluide / horizontal"
              >
                <AlignLeft className="w-3 h-3" />
                <span>Horizontal</span>
              </button>
              <button
                onClick={() => setLayoutOrientation("vertical")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  layoutOrientation === "vertical"
                    ? "bg-indigo-600 text-white"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Afficher les outils en grille verticale ordonnée"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Vertical / Grille</span>
              </button>
            </div>
          )}

          {activeSet !== null && (
            <button
              onClick={() => setActiveSet(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center space-x-1 ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
              title="Plier l'ensemble actuel pour libérer l'espace photo"
            >
              <span>Plier</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Zone Dépliée : Tous les outils de l'ensemble sélectionné (sans aucun élément caché) */}
      {activeSet !== null && (
        <div
          className={`p-3 transition-all animate-fade-in ${
            isLight ? "bg-slate-100/70 text-slate-900" : "bg-slate-950/80 text-slate-100"
          }`}
        >
          {/* Ensemble 1 : Filtres Peau Pro 1-Clic */}
          {activeSet === "beauty" && (
            <div
              className={`${
                layoutOrientation === "vertical"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2"
                  : "flex flex-wrap items-center gap-2"
              }`}
            >
              {onOpenAutoFaceModal && (
                <button
                  onClick={onOpenAutoFaceModal}
                  className="px-3.5 py-2 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition cursor-pointer text-center whitespace-nowrap"
                  title="Ouvrir l'Atelier Studio pour régler chaque curseur et peindre au masque"
                >
                  Réajuster & Masque...
                </button>
              )}

              {BEAUTY_ONE_CLICK_FILTERS.map((f) => {
                const isActive = f.id === activeBeautyFilterId;
                return (
                  <button
                    key={f.id}
                    onClick={() => onApplyBeautyFilter?.(f)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 font-bold scale-[1.02]"
                        : isLight
                        ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:shadow-xs"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                    title={`${f.name} : ${f.description}`}
                  >
                    <span>{f.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-slate-950 text-amber-300"
                          : isLight
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-950 text-slate-400"
                      }`}
                    >
                      {f.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Ensemble 2 : Lumières & Ambiances */}
          {activeSet === "presets" && (
            <div
              className={`${
                layoutOrientation === "vertical"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
                  : "flex flex-wrap items-center gap-2"
              }`}
            >
              <button
                onClick={onResetAdjustments}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                }`}
                title="Réinitialiser tous les réglages à la photo d'origine"
              >
                Original (Sans Filtre)
              </button>

              {EVENT_PRESETS.map((p) => {
                const isActive = p.id === activePresetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPreset(p)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold scale-[1.02]"
                        : isLight
                        ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:shadow-xs"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700"
                    }`}
                    title={p.description}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Ensemble 3 : Outils Express & Détourage */}
          {activeSet === "express" && (
            <div
              className={`${
                layoutOrientation === "vertical"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2"
                  : "flex flex-wrap items-center gap-2"
              }`}
            >
              <button
                onClick={onToggleHealingBrush}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                  isHealingBrushActive
                    ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse"
                    : isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Activer le tampon correcteur pour cliquer sur les boutons et taches"
              >
                {isHealingBrushActive ? "Pinceau Zone ACTIF" : "Tampon Anti-Boutons Zone"}
              </button>

              <button
                onClick={onAutoCleanBlemishes}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Ouvrir le studio Auto Visage : détection des imperfections, flou gaussien et barres d'ajustement"
              >
                Auto Nettoyage & Flou Visage
              </button>

              <button
                onClick={onQuickSkinSmooth}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Lisser la peau instantanément"
              >
                Lisser la Peau IA
              </button>

              <button
                onClick={onOpenBgModal}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Supprimer l'arrière-plan ou détourer le sujet"
              >
                Suppression Fond & Détourage
              </button>

              <button
                onClick={onOpenOverlayModal}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Ajouter et positionner une deuxième photo, logo ou filigrane"
              >
                Incruster Image & Logo
              </button>

              <button
                onClick={onOpenTextModal}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                }`}
                title="Ajouter une signature calligraphique ou du texte"
              >
                Signature & Texte
              </button>
            </div>
          )}

          {/* Ensemble 4 : Outils Sélection */}
          {activeSet === "selection" && (
            <div className="space-y-2">
              <div
                className={`${
                  layoutOrientation === "vertical"
                    ? "grid grid-cols-2 sm:grid-cols-4 gap-2"
                    : "flex flex-wrap items-center gap-2"
                }`}
              >
                <button
                  onClick={onAutoSelectSubject}
                  disabled={isAnalyzingSubject}
                  className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer disabled:opacity-50 text-xs border text-center ${
                    selectionState?.mode === "auto_subject"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                  }`}
                  title="Détection automatique du sujet par IA"
                >
                  {isAnalyzingSubject ? "Détection Sujet IA..." : "Sujet Automatique IA"}
                </button>

                <button
                  onClick={() => onSelectModeChange?.("rectangle")}
                  className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer text-xs border text-center ${
                    selectionState?.mode === "rectangle"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                  }`}
                  title="Sélection par cadre rectangulaire"
                >
                  Rectangle
                </button>

                <button
                  onClick={() => onSelectModeChange?.("ellipse")}
                  className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer text-xs border text-center ${
                    selectionState?.mode === "ellipse"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                  }`}
                  title="Sélection circulaire ou ovale"
                >
                  Ellipse
                </button>

                <button
                  onClick={() => onSelectModeChange?.("lasso")}
                  className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer text-xs border text-center ${
                    selectionState?.mode === "lasso"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800"
                  }`}
                  title="Sélection au lasso libre"
                >
                  Lasso Libre
                </button>
              </div>

              {/* Actions de sélection si active */}
              {selectionState?.isActive && (
                <div className="pt-2 border-t border-slate-300 dark:border-slate-800 flex flex-wrap items-center gap-2 animate-fade-in">
                  <button
                    onClick={onDeleteOutsideSelection}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                    title="Conserver le sujet sélectionné et rendre tout le reste transparent"
                  >
                    Isoler le Sujet (Fond Transparent)
                  </button>

                  <button
                    onClick={onApplyRetouchInsideSelection}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                    title="Appliquer lissage/exposition uniquement à l'intérieur de la sélection"
                  >
                    Retoucher la Zone Sélectionnée
                  </button>

                  <button
                    onClick={onDeleteInsideSelection}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isLight
                        ? "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200"
                        : "bg-slate-900 hover:bg-rose-600 text-rose-300 hover:text-white border-slate-800"
                    }`}
                    title="Effacer le contenu de la zone sélectionnée"
                  >
                    Effacer dans la Zone
                  </button>

                  <button
                    onClick={onClearSelection}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isLight
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                    title="Annuler la sélection en cours"
                  >
                    Désélectionner (✕)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

