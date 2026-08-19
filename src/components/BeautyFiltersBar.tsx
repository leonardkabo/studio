import React from "react";
import { BEAUTY_ONE_CLICK_FILTERS } from "../data/beautyFilters";
import { BeautyOneClickFilter } from "../types";
import {
  Sparkles,
  Layers,
  Sun,
  Heart,
  ShieldAlert,
  Smile,
  Zap,
  Sliders,
  Check,
  Flame,
  Wand2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface BeautyFiltersBarProps {
  activeFilterId?: string;
  onApplyFilter: (filter: BeautyOneClickFilter) => void;
  onOpenAutoFaceModal: () => void;
  isProcessing?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
  Layers: <Layers className="w-3.5 h-3.5 text-indigo-500" />,
  Sun: <Sun className="w-3.5 h-3.5 text-orange-500" />,
  Heart: <Heart className="w-3.5 h-3.5 text-rose-500" />,
  ShieldAlert: <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />,
  Smile: <Smile className="w-3.5 h-3.5 text-emerald-500" />,
  Zap: <Zap className="w-3.5 h-3.5 text-sky-500" />,
};

const BADGE_COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30",
  indigo: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
  orange: "bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30",
  rose: "bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30",
  purple: "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30",
  emerald: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  sky: "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30",
};

export const BeautyFiltersBar: React.FC<BeautyFiltersBarProps> = ({
  activeFilterId,
  onApplyFilter,
  onOpenAutoFaceModal,
  isProcessing = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`px-4 py-2 flex items-center justify-between space-x-3 overflow-x-auto no-scrollbar z-10 text-xs shadow-xs border-b transition-colors ${
        isLight
          ? "bg-slate-50 border-slate-200 text-slate-800"
          : "bg-slate-950 border-slate-800/80 text-slate-200"
      }`}
    >
      {/* Title Label */}
      <div className="flex items-center space-x-2 shrink-0">
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
            isLight
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-amber-500/30 text-amber-300"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-[11px]">
            Filtres Peau Pro 1-Clic :
          </span>
        </div>
      </div>

      {/* 1-Click Filter Buttons Carousel */}
      <div className="flex items-center space-x-2 overflow-x-auto py-0.5 px-1 no-scrollbar">
        {BEAUTY_ONE_CLICK_FILTERS.map((filter) => {
          const isActive = activeFilterId === filter.id;
          const icon = ICON_MAP[filter.iconName] || <Sparkles className="w-3.5 h-3.5" />;
          const badgeClass = BADGE_COLOR_MAP[filter.badgeColor] || BADGE_COLOR_MAP.amber;

          return (
            <button
              key={filter.id}
              onClick={() => onApplyFilter(filter)}
              disabled={isProcessing}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium transition-all duration-150 shrink-0 border relative group cursor-pointer disabled:opacity-50 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 font-bold scale-[1.02]"
                  : isLight
                  ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:shadow-xs"
                  : "bg-slate-900/90 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700 hover:shadow"
              }`}
              title={`${filter.name} : ${filter.description}`}
            >
              <span className="shrink-0">{icon}</span>
              <span className="whitespace-nowrap font-semibold">{filter.shortName}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                  isActive
                    ? "bg-slate-950 text-amber-300 border-slate-900"
                    : badgeClass
                }`}
              >
                {filter.badge}
              </span>
              {isActive && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3] ml-0.5" />}
            </button>
          );
        })}

        {/* Custom Tune Button */}
        <button
          onClick={onOpenAutoFaceModal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
            isLight
              ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
          }`}
          title="Ouvrir le studio d'ajustement sur-mesure et peinture de zones"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Ajuster sur-mesure...</span>
        </button>
      </div>
    </div>
  );
};
