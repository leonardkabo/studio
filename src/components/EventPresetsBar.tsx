import React from "react";
import { EVENT_PRESETS } from "../data/presets";
import { EventPreset, PresetCategory } from "../types";
import {
  Building2,
  Sun,
  Moon,
  Heart,
  User,
  Sparkles,
  Utensils,
  Film,
  Camera,
  Aperture,
  Sliders,
  Check,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface EventPresetsBarProps {
  activePresetId?: string;
  onSelectPreset: (preset: EventPreset) => void;
  onResetAdjustments: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4 text-amber-500" />,
  Moon: <Moon className="w-4 h-4 text-indigo-500" />,
  Heart: <Heart className="w-4 h-4 text-rose-500" />,
  User: <User className="w-4 h-4 text-sky-500" />,
  Sparkles: <Sparkles className="w-4 h-4 text-purple-500" />,
  Utensils: <Utensils className="w-4 h-4 text-emerald-500" />,
  Film: <Film className="w-4 h-4 text-teal-500" />,
  Camera: <Camera className="w-4 h-4 text-orange-500" />,
  Aperture: <Aperture className="w-4 h-4 text-slate-400" />,
};

export const EventPresetsBar: React.FC<EventPresetsBarProps> = ({
  activePresetId,
  onSelectPreset,
  onResetAdjustments,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`px-4 py-2 flex items-center justify-between space-x-3 overflow-x-auto no-scrollbar z-10 shadow-xs border-b transition-colors ${
        isLight
          ? "bg-slate-50 border-slate-200 text-slate-800"
          : "bg-slate-900/90 border-slate-800 text-slate-200"
      }`}
    >
      <div className="flex items-center space-x-2 shrink-0">
        <span
          className={`text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Retouche 1-Clic :</span>
        </span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto py-1 px-1 no-scrollbar">
        {/* Reset / Original Button */}
        <button
          onClick={onResetAdjustments}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer border ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
          title="Réinitialiser tous les réglages"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Original</span>
        </button>

        {/* Preset Buttons */}
        {EVENT_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const icon = ICON_MAP[preset.iconName] || <Sparkles className="w-4 h-4" />;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 border relative group ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : isLight
                  ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:shadow-xs"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600"
              }`}
              title={preset.description}
            >
              <span className="shrink-0">{icon}</span>
              <span className="whitespace-nowrap">{preset.name}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isLight
                    ? "bg-slate-100 text-slate-600 group-hover:text-slate-800"
                    : "bg-slate-900/60 text-slate-400 group-hover:text-slate-300"
                }`}
              >
                {preset.badgeText}
              </span>
              {isActive && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
