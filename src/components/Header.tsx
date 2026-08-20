import React, { useRef } from "react";
import {
  Sparkles,
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  Columns,
  FolderOpen,
  Cloud,
  CheckCircle2,
  Lock,
  Layers,
  Wand2,
  Sun,
  Moon,
} from "lucide-react";
import { LocalCloudStorageStats } from "../types";
import { useTheme } from "../context/ThemeContext";
import defaultAppLogo from "../assets/images/amour_et_vie_30_ans_logo_1787222546850.jpg";

export interface HeaderProps {
  projectTitle?: string;
  onTitleChange?: (title: string) => void;
  onUploadClick?: () => void;
  onUploadImage?: (file: File) => void;
  onAutoFixClick?: () => void;
  isAiAnalyzing?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
  onExportClick?: () => void;
  onOpenExport?: () => void;
  onOpenProjects?: () => void;
  onOpenBatch?: () => void;
  storageStats?: LocalCloudStorageStats;
  isCloudSyncEnabled?: boolean;
  onToggleCloudSync?: () => void;
  hasImage?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  onTitleChange,
  onUploadClick,
  onUploadImage,
  onAutoFixClick,
  isAiAnalyzing = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isSplitView = false,
  onToggleSplitView,
  onExportClick,
  onOpenExport,
  onOpenProjects,
  onOpenBatch,
  storageStats,
  isCloudSyncEnabled = false,
  onToggleCloudSync,
  hasImage = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [customLogoUrl, setCustomLogoUrl] = React.useState<string>(() => {
    try {
      return localStorage.getItem("studio_custom_logo") || "";
    } catch {
      return "";
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setCustomLogoUrl(result);
          try {
            localStorage.setItem("studio_custom_logo", result);
          } catch (err) {
            console.warn("Storage quota exceeded", err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = storageStats || {
    localProjectsCount: 0,
    cloudSyncedCount: 0,
    totalStorageUsedMB: 0,
    privacyStatus: "Confidentialité totale",
  };

  const handleUploadClickInternal = () => {
    if (onUploadClick) {
      onUploadClick();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadImage) {
      onUploadImage(e.target.files[0]);
    }
  };

  const handleExport = onExportClick || onOpenExport;
  const isLight = theme === "light";

  return (
    <header
      className={`h-16 px-4 flex items-center justify-between z-20 select-none shadow-sm border-b transition-colors ${
        isLight
          ? "bg-white border-slate-200 text-slate-900"
          : "bg-slate-900 border-slate-800 text-slate-100"
      }`}
    >
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        {/* Circular Logo with Rounded Borders & Clear Visual Depth */}
        <div
          onClick={() => logoInputRef.current?.click()}
          className="relative group cursor-pointer"
          title="Logo Studio (Cliquer pour changer ou importer un logo personnalisé)"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-amber-400 p-[2.5px] shadow-lg shadow-indigo-500/30 shrink-0 transition-transform group-hover:scale-105">
            <div
              className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border border-white/30 shadow-inner ${
                isLight ? "bg-slate-900" : "bg-slate-950"
              }`}
            >
              <img
                src={customLogoUrl || defaultAppLogo || "/logo.png"}
                alt="Logo Studio"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1
              className={`text-base font-bold tracking-tight ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              Kaboom <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Studio</span>
            </h1>
            <span
              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                isLight
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
              }`}
            >
              Pro IA 100% Gratuit
            </span>
          </div>
          <p
            className={`text-xs hidden sm:block ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Retouche photo automatique & événementielle
          </p>
        </div>
      </div>

      {/* Center Controls (Actions on active canvas) */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Upload Button */}
        <button
          id="btn-upload-header"
          onClick={handleUploadClickInternal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${
            isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
          title="Ouvrir une nouvelle photo"
        >
          <Upload className="w-4 h-4 text-indigo-500" />
          <span className="hidden md:inline">Ouvrir Photo</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {hasImage && (
          <>
            {/* Auto-Fix IA Button */}
            <button
              id="btn-auto-fix-header"
              onClick={onAutoFixClick}
              disabled={isAiAnalyzing}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
              title="Analyse et retouche automatique par l'intelligence artificielle"
            >
              <Wand2 className={`w-4 h-4 ${isAiAnalyzing ? "animate-spin" : ""}`} />
              <span>{isAiAnalyzing ? "Analyse IA..." : "Auto Retouche IA"}</span>
            </button>

            <div
              className={`h-5 w-px mx-1 hidden sm:block ${
                isLight ? "bg-slate-200" : "bg-slate-800"
              }`}
            />

            {/* Undo / Redo */}
            <button
              id="btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg disabled:opacity-30 transition cursor-pointer ${
                isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
              title="Annuler (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg disabled:opacity-30 transition cursor-pointer ${
                isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
              title="Rétablir (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Split View Toggle */}
            <button
              id="btn-split-view"
              onClick={onToggleSplitView}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isSplitView
                  ? "bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
              title="Comparer Avant / Après"
            >
              <Columns className="w-4 h-4" />
            </button>
          </>
        )}

        <div
          className={`h-5 w-px mx-1 hidden sm:block ${
            isLight ? "bg-slate-200" : "bg-slate-800"
          }`}
        />

        {/* Batch process */}
        <button
          id="btn-batch-process"
          onClick={onOpenBatch}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer border border-transparent ${
            isLight
              ? "text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              : "text-slate-300 hover:bg-slate-800 hover:border-slate-700"
          }`}
          title="Traitement par lot"
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span className="hidden lg:inline font-medium">Traitement Lot</span>
        </button>

        {/* Projects Library */}
        <button
          id="btn-open-projects"
          onClick={onOpenProjects}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border border-transparent relative ${
            isLight
              ? "text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              : "text-slate-300 hover:bg-slate-800 hover:border-slate-700"
          }`}
          title="Bibliothèque de projets enregistrés"
        >
          <FolderOpen className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Projets</span>
          {(stats.localProjectsCount ?? 0) > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                isLight
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-indigo-500/20 text-indigo-300"
              }`}
            >
              {stats.localProjectsCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Controls: Theme Toggle, Privacy Badge & High Res Export */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle (Dark / Light) */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-sm ${
            isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
          title={isLight ? "Passer en Mode Sombre" : "Passer en Mode Clair"}
        >
          {isLight ? (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline font-medium">Sombre</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-medium">Clair</span>
            </>
          )}
        </button>

        {/* Privacy & Storage Badge */}
        <div
          onClick={onToggleCloudSync}
          className={`hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300"
              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
          title="Touche pour basculer la synchronisation Cloud optionnelle"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local</span>
          <div
            className={`h-3 w-px ${isLight ? "bg-slate-300" : "bg-slate-800"}`}
          />
          <Cloud
            className={`w-3.5 h-3.5 ${
              isCloudSyncEnabled ? "text-indigo-500" : "text-slate-400"
            }`}
          />
          <span className="text-[11px]">
            {isCloudSyncEnabled ? "Cloud ON" : "Cloud Off"}
          </span>
        </div>

        {/* Export Button */}
        {hasImage && (
          <button
            id="btn-export-header"
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="Exporter en Haute Résolution (nomd'origine_OK)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter HD</span>
            <span className="sm:hidden">Export</span>
          </button>
        )}
      </div>
    </header>
  );
};

