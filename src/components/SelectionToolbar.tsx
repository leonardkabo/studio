import React from "react";
import {
  Crop,
  Square,
  Circle,
  Scissors,
  Wand2,
  Trash2,
  X,
  Sparkles,
  Sliders,
  Check,
  Zap,
} from "lucide-react";
import { SelectionMode, SelectionState } from "../types";
import { useTheme } from "../context/ThemeContext";

interface SelectionToolbarProps {
  selectionState: SelectionState;
  onSelectModeChange: (mode: SelectionMode) => void;
  onClearSelection: () => void;
  onAutoSelectSubject: () => void;
  onDeleteOutsideSelection: () => void;
  onDeleteInsideSelection: () => void;
  onApplyRetouchInsideSelection: () => void;
  isAnalyzingSubject: boolean;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectionState,
  onSelectModeChange,
  onClearSelection,
  onAutoSelectSubject,
  onDeleteOutsideSelection,
  onDeleteInsideSelection,
  onApplyRetouchInsideSelection,
  isAnalyzingSubject,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 backdrop-blur-md shadow-sm text-xs border-b transition-colors ${
        isLight
          ? "bg-white/95 border-slate-200 text-slate-800"
          : "bg-slate-900/95 border-slate-800 text-slate-200"
      }`}
    >
      {/* Mode Selectors */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        <span
          className={`font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center space-x-1 ${
            isLight ? "text-indigo-600" : "text-indigo-400"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Outil Sélection :</span>
        </span>

        {/* Auto Sujet IA */}
        <button
          onClick={onAutoSelectSubject}
          disabled={isAnalyzingSubject}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 ${
            selectionState.mode === "auto_subject"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
              : isLight
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
          title="Détection automatique IA du sujet / personne"
        >
          <Wand2 className={`w-3.5 h-3.5 text-amber-500 ${isAnalyzingSubject ? "animate-spin" : ""}`} />
          <span>{isAnalyzingSubject ? "Détection Sujet..." : "Sujet Automatique IA"}</span>
        </button>

        {/* Rectangle */}
        <button
          onClick={() => onSelectModeChange("rectangle")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            selectionState.mode === "rectangle"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
              : isLight
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
          title="Cadre de sélection rectangulaire"
        >
          <Square className={`w-3.5 h-3.5 ${isLight ? "text-indigo-600" : "text-indigo-300"}`} />
          <span>Rectangle</span>
        </button>

        {/* Ellipse */}
        <button
          onClick={() => onSelectModeChange("ellipse")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            selectionState.mode === "ellipse"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
              : isLight
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
          title="Sélection elliptique / circulaire"
        >
          <Circle className={`w-3.5 h-3.5 ${isLight ? "text-pink-600" : "text-pink-300"}`} />
          <span>Ellipse</span>
        </button>

        {/* Lasso Libre */}
        <button
          onClick={() => onSelectModeChange("lasso")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            selectionState.mode === "lasso"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
              : isLight
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
          title="Lasso à main levée"
        >
          <Crop className={`w-3.5 h-3.5 ${isLight ? "text-emerald-600" : "text-emerald-300"}`} />
          <span>Lasso Libre</span>
        </button>
      </div>

      {/* Active Selection Actions */}
      {selectionState.isActive && (
        <div className="flex items-center space-x-2 animate-fade-in">
          {/* Isolation sujet -> fond transparent */}
          <button
            onClick={onDeleteOutsideSelection}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
            title="Conserver le sujet et rendre l'arrière-plan transparent (Damier de transparence)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Isoler le Sujet (Fond Transparent)</span>
          </button>

          {/* Retoucher uniquement la zone sélectionnée */}
          <button
            onClick={onApplyRetouchInsideSelection}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer"
            title="Appliquer lissage/exposition uniquement dans la zone sélectionnée"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Retoucher Zone Sélectionnée</span>
          </button>

          {/* Effacer intérieur */}
          <button
            onClick={onDeleteInsideSelection}
            className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center space-x-1.5 cursor-pointer ${
              isLight
                ? "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200"
                : "bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border-slate-700"
            }`}
            title="Supprimer les pixels à l'intérieur de la sélection"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Effacer Zone</span>
          </button>

          {/* Désélectionner */}
          <button
            onClick={onClearSelection}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200"
                : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
            }`}
            title="Annuler la sélection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
