import React from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { WorkspaceTab } from "../types";
import { useTheme } from "../context/ThemeContext";

interface WorkspaceTabsBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string, e: React.MouseEvent) => void;
  onNewWorkspace: () => void;
}

export const WorkspaceTabsBar: React.FC<WorkspaceTabsBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewWorkspace,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      id="workspace-tabs-bar"
      className={`h-10 border-b flex items-center px-2 space-x-1 overflow-x-auto no-scrollbar select-none z-10 shrink-0 transition-colors ${
        isLight
          ? "bg-slate-100 border-slate-200"
          : "bg-slate-950 border-slate-800/90"
      }`}
    >
      {/* Workspace Tabs list */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const hasImage = !!tab.project.originalImage;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-t-lg border-t-2 text-xs font-medium transition cursor-pointer shrink-0 max-w-[220px] ${
                isActive
                  ? isLight
                    ? "bg-white text-slate-900 border-indigo-600 shadow-sm"
                    : "bg-slate-900 text-slate-100 border-indigo-500 shadow-sm"
                  : isLight
                  ? "bg-slate-200/70 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-transparent"
                  : "bg-slate-950/80 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent"
              }`}
              title={`${tab.title} (${hasImage ? "Image active" : "Vide / Transparent"})`}
            >
              {/* Tab Title */}
              <span className="truncate max-w-[140px]">
                {tab.title || `Espace ${idx + 1}`}
              </span>

              {/* Status indicator dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  hasImage ? "bg-emerald-500" : isLight ? "bg-slate-400" : "bg-slate-600"
                }`}
                title={hasImage ? "Contient une photo" : "Espace vide (fond transparent)"}
              />

              {/* Close Tab Red Cross Button (Photoshop Style) */}
              <button
                onClick={(e) => onCloseTab(tab.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition shrink-0 ml-1 cursor-pointer"
                title="Fermer cet espace de travail"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New Workspace Tab Button */}
      <button
        id="btn-new-workspace-tab"
        onClick={onNewWorkspace}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition border shrink-0 cursor-pointer shadow-sm ml-1 ${
          isLight
            ? "bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-300 hover:border-indigo-400"
            : "bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-800 hover:border-indigo-500"
        }`}
        title="Ouvrir un nouvel espace de travail (comme sur Photoshop)"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nouvel Espace</span>
      </button>
    </div>
  );
};
