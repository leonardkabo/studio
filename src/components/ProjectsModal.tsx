import React, { useState } from "react";
import {
  X,
  FolderOpen,
  Trash2,
  HardDrive,
  Cloud,
  Download,
  Upload,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { LocalCloudStorageStats, ProjectState } from "../types";
import { downloadProjectBackupFile } from "../utils/storage";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectState[];
  currentProjectId?: string;
  onSelectProject: (project: ProjectState) => void;
  onDeleteProject: (id: string) => void;
  storageStats?: LocalCloudStorageStats;
  isCloudSyncEnabled: boolean;
  onToggleCloudSync: () => void;
  onImportBackupFile: (jsonStr: string) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onDeleteProject,
  storageStats,
  isCloudSyncEnabled,
  onToggleCloudSync,
  onImportBackupFile,
}) => {
  const stats = storageStats || {
    localProjectsCount: projects?.length ?? 0,
    cloudSyncedCount: 0,
    totalStorageUsedMB: 0,
    privacyStatus: "Confidentialité totale",
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onImportBackupFile(evt.target.result as string);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Bibliothèque de Projets & Sauvegarde</h3>
              <p className="text-xs text-slate-400">Stockage local sécurisé IndexedDB + Synchro Cloud Optionnelle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Cloud Toggle Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <HardDrive className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Projets Locaux</span>
              <span className="text-sm font-bold text-slate-100">{stats.localProjectsCount ?? projects?.length ?? 0} photo(s)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Espace Utilisé</span>
              <span className="text-sm font-bold text-slate-100">{stats.totalStorageUsedMB ?? 0} MB</span>
            </div>
          </div>

          <div
            onClick={onToggleCloudSync}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex items-center space-x-3 cursor-pointer transition"
          >
            <Cloud className={`w-5 h-5 ${isCloudSyncEnabled ? "text-indigo-400" : "text-slate-600"}`} />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Synchro Cloud</span>
              <span className="text-xs font-bold text-slate-200">
                {isCloudSyncEnabled ? "Active (Optionnel)" : "Désactivée"}
              </span>
            </div>
          </div>
        </div>

        {/* Import Backup JSON Action */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs shrink-0">
          <span className="text-slate-300">Importer une sauvegarde de projet (.json) :</span>
          <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer flex items-center space-x-1.5 transition">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Importer Projet</span>
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Aucun projet enregistré pour le moment.</p>
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              return (
                <div
                  key={proj.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isCurrent
                      ? "bg-indigo-950/40 border-indigo-500/50"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      {proj.originalImage ? (
                        <img
                          src={proj.originalImage}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sparkles className="w-5 h-5 text-slate-600 m-3" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{proj.title}</h4>
                      <p className="text-[10px] text-slate-400">
                        Modifié le {new Date(proj.updatedAt).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(proj.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadProjectBackupFile(proj)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Télécharger la sauvegarde de ce projet (.json)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow"
                    >
                      Charger
                    </button>

                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
