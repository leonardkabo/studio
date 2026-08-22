import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Sliders,
  Sparkles,
  Wand2,
  Columns,
  Download,
  Layers,
  Sparkle,
} from "lucide-react";
import { Header } from "./components/Header";
import { StudioControlHeader } from "./components/StudioControlHeader";
import { MainCanvas } from "./components/MainCanvas";
import { RightSidebarPanel } from "./components/RightSidebarPanel";
import { WorkspaceTabsBar } from "./components/WorkspaceTabsBar";
import { ExportModal } from "./components/ExportModal";
import { ProjectsModal } from "./components/ProjectsModal";
import { BatchProcessingModal } from "./components/BatchProcessingModal";
import { TextIncrustationModal } from "./components/TextIncrustationModal";
import { ImageOverlayModal } from "./components/ImageOverlayModal";
import { AutoFaceModal } from "./components/AutoFaceModal";
import { BackgroundRemovalModal } from "./components/BackgroundRemovalModal";
import { BrushSettingsModal } from "./components/BrushSettingsModal";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { KaboStoreModal } from "./components/KaboStoreModal";
import {
  AIAnalysisReport,
  AdjustmentSettings,
  AppliedStoreSignature,
  BeautyOneClickFilter,
  BrushSettings,
  EventPreset,
  ExportOptions,
  HistoryItem,
  KaboStoreItem,
  LayerItem,
  LocalCloudStorageStats,
  ProjectState,
  SavedSignaturePreset,
  SelectionMode,
  SelectionState,
  SnapshotItem,
  WorkspaceTab,
} from "./types";
import { DEFAULT_SETTINGS } from "./data/presets";
import { BEAUTY_ONE_CLICK_FILTERS } from "./data/beautyFilters";
import { createSampleEventPhotoDataUrl, exportHighResImage } from "./utils/canvasEngine";
import { renderMultipleSignaturesOnImage } from "./utils/compositeSignatureRenderer";
import {
  AutoFaceParams,
  applyOneClickBeautyFilter,
  applyRetouchToSelection,
  autoCleanSkinBlemishes,
  autoDetectSubjectSelection,
  eraseInsideSelection,
  isolateSelectionTransparent,
} from "./utils/imageTools";
import {
  deleteProjectFromLocal,
  getAllLocalProjects,
  getStorageStats,
  saveProjectToLocal,
} from "./utils/storage";
import { useTheme } from "./context/ThemeContext";

const createDefaultWorkspaceProject = (id: string, title: string): ProjectState => ({
  id,
  title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  originalImage: "", // Starts with NO image (transparent canvas)
  dimensions: { width: 1600, height: 1066 },
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  history: [
    {
      id: "hist_0",
      actionName: "Espace de travail créé",
      timestamp: Date.now(),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    },
  ],
  historyIndex: 0,
  snapshots: [],
  isCloudSynced: false,
});

export default function App() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-Workspace (Photoshop-like Document Tabs)
  const [workspaces, setWorkspaces] = useState<WorkspaceTab[]>([
    {
      id: "ws_1",
      title: "Sans titre-1",
      project: createDefaultWorkspaceProject("proj_1", "Sans titre-1"),
      layers: [],
      activeLayerId: null,
    },
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws_1");

  // Get active workspace tab
  const activeTab = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const project = activeTab.project;
  const layers = activeTab.layers || [];
  const activeLayerId = activeTab.activeLayerId || null;

  // Active Workspace Mutator Helper
  const updateActiveWorkspace = useCallback(
    (updater: (prevWs: WorkspaceTab) => WorkspaceTab) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === activeWorkspaceId ? updater(w) : w))
      );
    },
    [activeWorkspaceId]
  );

  // Active Project Mutator Helper
  const setProject = useCallback(
    (action: ProjectState | ((prevProj: ProjectState) => ProjectState)) => {
      updateActiveWorkspace((ws) => {
        const nextProject =
          typeof action === "function" ? action(ws.project) : action;
        return {
          ...ws,
          project: nextProject,
          title: nextProject.title || ws.title,
        };
      });
    },
    [updateActiveWorkspace]
  );

  const [activePresetId, setActivePresetId] = useState<string | undefined>();
  const [activeBeautyFilterId, setActiveBeautyFilterId] = useState<string | undefined>();
  const [activeBeautyFilterParams, setActiveBeautyFilterParams] = useState<AutoFaceParams | null>(null);
  const [baseImageBeforeBeautyFilter, setBaseImageBeforeBeautyFilter] = useState<string | null>(null);
  const [baseImageBeforeSignature, setBaseImageBeforeSignature] = useState<string | null>(null);
  const [hasAppliedSignature, setHasAppliedSignature] = useState<boolean>(false);
  const [isApplyingBeautyFilter, setIsApplyingBeautyFilter] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const beautyAdjustmentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Photoshop Style Brush Settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 30,
    hardness: 0,
    spacing: 25,
    angle: 0,
    roundness: 100,
    smoothing: true,
    flipX: false,
    flipY: false,
    selectedTipId: "tip-30-soft",
    shapeDynamics: true,
    diffusion: false,
    texture: false,
    dualBrush: false,
    colorDynamics: false,
    transfer: false,
    brushPose: false,
    noise: false,
    wetEdges: false,
    accumulation: false,
    protectTexture: false,
  });
  const [isBrushModalOpen, setIsBrushModalOpen] = useState<boolean>(false);

  // Selection Tool State
  const [selectionState, setSelectionState] = useState<SelectionState>({
    mode: "none",
    isActive: false,
  });
  const [isAnalyzingSubject, setIsAnalyzingSubject] = useState<boolean>(false);

  // Modals & Active Tools
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);
  const [isKaboStoreOpen, setIsKaboStoreOpen] = useState<boolean>(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState<boolean>(false);
  const [isOverlayModalOpen, setIsOverlayModalOpen] = useState<boolean>(false);
  const [isAutoFaceModalOpen, setIsAutoFaceModalOpen] = useState<boolean>(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [isHealingBrushActive, setIsHealingBrushActive] = useState<boolean>(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState<boolean>(false);

  // Applied signatures from KABO Store (can apply multiple!)
  const [appliedStoreSignatures, setAppliedStoreSignatures] = useState<AppliedStoreSignature[]>([]);

  // Storage and Library State
  const [allProjects, setAllProjects] = useState<ProjectState[]>([]);
  const [storageStats, setStorageStats] = useState<LocalCloudStorageStats>({
    localProjectsCount: 0,
    cloudSyncedCount: 0,
    totalStorageUsedMB: 0,
    privacyStatus: "Confidentialité totale",
  });

  // Load local projects list from IndexedDB on startup
  const refreshStorage = useCallback(async () => {
    try {
      const list = await getAllLocalProjects();
      setAllProjects(list);
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.error("Erreur chargement IndexedDB:", e);
    }
  }, []);

  useEffect(() => {
    refreshStorage();
    // Intentionally NO sample photo loaded on boot per user request: app starts clean with transparent background
  }, [refreshStorage]);

  // ================= WORKSPACE MANAGEMENT (Photoshop-like tabs) =================
  const handleNewWorkspace = () => {
    const newIndex = workspaces.length + 1;
    const newWsId = "ws_" + Date.now();
    const newTitle = `Sans titre-${newIndex}`;
    const newWs: WorkspaceTab = {
      id: newWsId,
      title: newTitle,
      project: createDefaultWorkspaceProject(`proj_${Date.now()}`, newTitle),
      layers: [],
      activeLayerId: null,
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWsId);
    setToastMessage(`Nouvel espace "${newTitle}" ouvert.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCloseWorkspace = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (workspaces.length <= 1) {
      // If closing last tab, reset to an empty workspace
      const newWsId = "ws_" + Date.now();
      const freshWs: WorkspaceTab = {
        id: newWsId,
        title: "Sans titre-1",
        project: createDefaultWorkspaceProject(`proj_${Date.now()}`, "Sans titre-1"),
        layers: [],
        activeLayerId: null,
      };
      setWorkspaces([freshWs]);
      setActiveWorkspaceId(newWsId);
      return;
    }

    const nextWorkspaces = workspaces.filter((w) => w.id !== tabId);
    setWorkspaces(nextWorkspaces);
    if (activeWorkspaceId === tabId) {
      setActiveWorkspaceId(nextWorkspaces[0].id);
    }
  };

  const handleSelectWorkspace = (tabId: string) => {
    setActiveWorkspaceId(tabId);
    setActiveBeautyFilterId(undefined);
    setActiveBeautyFilterParams(null);
    setBaseImageBeforeBeautyFilter(null);
    setSelectionState({ mode: "none", isActive: false });
  };

  // ================= LAYER MANAGEMENT =================
  const handleAddLayer = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newLayerId = "layer_" + Date.now();
      const newLayerName = file.name.replace(/\.[^/.]+$/, "") || `Calque ${layers.length + 1}`;

      const newLayer: LayerItem = {
        id: newLayerId,
        name: newLayerName,
        imageSrc: dataUrl,
        x: 50,
        y: 50,
        width: 35,
        height: 35,
        rotation: 0,
        opacity: 100,
        visible: true,
        locked: false,
        blendMode: "source-over",
        zIndex: layers.length + 1,
      };

      updateActiveWorkspace((ws) => ({
        ...ws,
        layers: [newLayer, ...ws.layers],
        activeLayerId: newLayerId,
      }));

      setToastMessage(`Calque "${newLayerName}" importé avec succès.`);
      setTimeout(() => setToastMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectLayer = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeLayerId: id,
    }));
  };

  const handleRemoveLayer = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      layers: ws.layers.filter((l) => l.id !== id),
      activeLayerId: ws.activeLayerId === id ? null : ws.activeLayerId,
    }));
  };

  const handleToggleLayerVisibility = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      layers: ws.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleToggleLayerLock = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      layers: ws.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    }));
  };

  const handleMoveLayerOrder = (id: string, direction: "up" | "down") => {
    updateActiveWorkspace((ws) => {
      const list = [...ws.layers];
      const idx = list.findIndex((l) => l.id === id);
      if (idx === -1) return ws;

      if (direction === "up" && idx > 0) {
        const temp = list[idx - 1];
        list[idx - 1] = list[idx];
        list[idx] = temp;
      } else if (direction === "down" && idx < list.length - 1) {
        const temp = list[idx + 1];
        list[idx + 1] = list[idx];
        list[idx] = temp;
      }

      // Reassign zIndexes
      const updatedList = list.map((l, i) => ({
        ...l,
        zIndex: list.length - i,
      }));

      return {
        ...ws,
        layers: updatedList,
      };
    });
  };

  const handleBringLayerToFront = (id: string) => {
    updateActiveWorkspace((ws) => {
      const target = ws.layers.find((l) => l.id === id);
      if (!target) return ws;
      const rest = ws.layers.filter((l) => l.id !== id);
      const list = [target, ...rest].map((l, i, arr) => ({
        ...l,
        zIndex: arr.length - i,
      }));
      return { ...ws, layers: list };
    });
  };

  const handleSendLayerToBack = (id: string) => {
    updateActiveWorkspace((ws) => {
      const target = ws.layers.find((l) => l.id === id);
      if (!target) return ws;
      const rest = ws.layers.filter((l) => l.id !== id);
      const list = [...rest, target].map((l, i, arr) => ({
        ...l,
        zIndex: arr.length - i,
      }));
      return { ...ws, layers: list };
    });
  };

  const handleUpdateLayerProp = (id: string, prop: keyof LayerItem, value: any) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      layers: ws.layers.map((l) => (l.id === id ? { ...l, [prop]: value } : l)),
    }));
  };

  // Selection actions
  const handleAutoSelectSubject = () => {
    setIsAnalyzingSubject(true);
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = project.dimensions.width;
      canvas.height = project.dimensions.height;
      const sel = autoDetectSubjectSelection(canvas);
      setSelectionState(sel);
      setIsAnalyzingSubject(false);
    }, 600);
  };

  const handleDeleteOutsideSelection = () => {
    const canvas = document.createElement("canvas");
    canvas.width = project.dimensions.width;
    canvas.height = project.dimensions.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.originalImage;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      isolateSelectionTransparent(canvas, selectionState);
      const transparentUrl = canvas.toDataURL("image/png");
      handleApplyNewImage(transparentUrl, "Isolation Sujet (Fond Transparent Damier)");
      setSelectionState({ mode: "none", isActive: false });
    };
  };

  const handleDeleteInsideSelection = () => {
    const canvas = document.createElement("canvas");
    canvas.width = project.dimensions.width;
    canvas.height = project.dimensions.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.originalImage;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      eraseInsideSelection(canvas, selectionState);
      const transparentUrl = canvas.toDataURL("image/png");
      handleApplyNewImage(transparentUrl, "Suppression de la zone sélectionnée");
      setSelectionState({ mode: "none", isActive: false });
    };
  };

  const handleApplyRetouchInsideSelection = () => {
    const canvas = document.createElement("canvas");
    canvas.width = project.dimensions.width;
    canvas.height = project.dimensions.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.originalImage;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      applyRetouchToSelection(canvas, selectionState);
      const newUrl = canvas.toDataURL("image/png");
      handleApplyNewImage(newUrl, "Retouche ciblée zone sélectionnée");
      setSelectionState({ mode: "none", isActive: false });
    };
  };

  // Save current project to IndexedDB when updated
  useEffect(() => {
    if (project.originalImage) {
      saveProjectToLocal(project).then(() => {
        refreshStorage();
      });
    }
  }, [project.settings, project.title, project.snapshots, project.isCloudSynced, refreshStorage]);

  // Push new state to non-destructive history stack
  const updateSettingsWithHistory = (
    newSettings: AdjustmentSettings,
    actionName: string = "Modification Réglages"
  ) => {
    setProject((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      const newHistoryItem: HistoryItem = {
        id: "hist_" + Math.random().toString(36).substring(2, 9),
        actionName,
        timestamp: Date.now(),
        settings: JSON.parse(JSON.stringify(newSettings)),
        image: prev.originalImage,
        dimensions: prev.dimensions,
      };

      newHistory.push(newHistoryItem);

      return {
        ...prev,
        settings: newSettings,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Handler for uploading image file
  const handleUploadImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "") || "Photo";
        setProject((prev) => ({
          ...prev,
          title: cleanTitle,
          originalImage: dataUrl,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
          history: [
            {
              id: "hist_0",
              actionName: "Nouvelle photo importée",
              timestamp: Date.now(),
              settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
              image: dataUrl,
              dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            },
          ],
          historyIndex: 0,
        }));
        setActivePresetId(undefined);
        setActiveBeautyFilterId(undefined);
        setActiveBeautyFilterParams(null);
        setBaseImageBeforeBeautyFilter(null);
        setBaseImageBeforeSignature(null);
        setHasAppliedSignature(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handler to load sample image for testing
  const handleLoadSample = () => {
    const sampleData = createSampleEventPhotoDataUrl();
    if (!sampleData) return;
    setProject((prev) => ({
      ...prev,
      title: "Photo Démo Studio",
      originalImage: sampleData,
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      history: [
        {
          id: "hist_0",
          actionName: "Photo démo chargée",
          timestamp: Date.now(),
          settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
          image: sampleData,
          dimensions: { width: 1600, height: 1066 },
        },
      ],
      historyIndex: 0,
    }));
    setActivePresetId(undefined);
    setActiveBeautyFilterId(undefined);
    setActiveBeautyFilterParams(null);
    setBaseImageBeforeBeautyFilter(null);
    setBaseImageBeforeSignature(null);
    setHasAppliedSignature(false);
  };

  // Apply new flattened image dataURL (from AI, tools, signature, text overlay, crop)
  const handleApplyNewImage = (newDataUrl: string, actionTitle: string) => {
    const img = new Image();
    img.onload = () => {
      const isSignatureAction =
        actionTitle.toLowerCase().includes("signature") ||
        actionTitle.toLowerCase().includes("filigrane") ||
        actionTitle.toLowerCase().includes("logos");

      setProject((prev) => {
        // Track the clean image before signature if not yet captured
        if (isSignatureAction && !actionTitle.toLowerCase().includes("retirée") && !actionTitle.toLowerCase().includes("supprimée")) {
          if (!baseImageBeforeSignature) {
            setBaseImageBeforeSignature(prev.originalImage);
          }
          setHasAppliedSignature(true);
        } else if (actionTitle.toLowerCase().includes("retirée") || actionTitle.toLowerCase().includes("supprimée")) {
          setHasAppliedSignature(false);
        }

        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        
        // Ensure current state before push has an image reference
        if (newHistory.length > 0 && !newHistory[newHistory.length - 1].image) {
          newHistory[newHistory.length - 1].image = prev.originalImage;
          newHistory[newHistory.length - 1].dimensions = prev.dimensions;
        }

        newHistory.push({
          id: "hist_" + Math.random().toString(36).substring(2, 9),
          actionName: actionTitle,
          timestamp: Date.now(),
          settings: JSON.parse(JSON.stringify(prev.settings)),
          image: newDataUrl,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
        });

        return {
          ...prev,
          originalImage: newDataUrl,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          history: newHistory,
          historyIndex: newHistory.length - 1,
          updatedAt: new Date().toISOString(),
        };
      });

      // Update baseImage tracking if needed
      setBaseImageBeforeBeautyFilter(newDataUrl);
      setToastMessage(`✓ ${actionTitle}`);
      setTimeout(() => setToastMessage(null), 3000);
    };
    img.src = newDataUrl;
  };

  // Dedicated 1-Click Signature Revert / Delete
  const handleRemoveSignature = () => {
    if (baseImageBeforeSignature) {
      handleApplyNewImage(baseImageBeforeSignature, "Signature supprimée / retirée");
      setBaseImageBeforeSignature(null);
      setHasAppliedSignature(false);
      setAppliedStoreSignatures([]);
      setToastMessage("✓ Signature retirée de l'image");
      setTimeout(() => setToastMessage(null), 3000);
    } else if (project.historyIndex > 0) {
      // Find prior image in history before signature step
      for (let i = project.historyIndex - 1; i >= 0; i--) {
        if (project.history[i].image) {
          handleApplyNewImage(project.history[i].image!, "Signature supprimée / retirée");
          setHasAppliedSignature(false);
          setAppliedStoreSignatures([]);
          setToastMessage("✓ Signature retirée de l'image");
          setTimeout(() => setToastMessage(null), 3000);
          break;
        }
      }
    }
  };

  // KABO Store Signature Multi-Application Engine
  const handleApplyStoreSignatureToImage = async (
    preset: SavedSignaturePreset,
    storeItem: KaboStoreItem
  ) => {
    if (!project.originalImage) return;

    // Preserve the clean base image before any signature is applied
    const cleanBase = baseImageBeforeSignature || project.originalImage;
    if (!baseImageBeforeSignature) {
      setBaseImageBeforeSignature(cleanBase);
    }

    const newInstance: AppliedStoreSignature = {
      instanceId: `app_sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeItemId: storeItem.id,
      title: storeItem.title,
      author: storeItem.author,
      preset: JSON.parse(JSON.stringify(preset)),
      appliedAt: Date.now(),
      enabled: true,
    };

    const updatedList = [...appliedStoreSignatures, newInstance];
    setAppliedStoreSignatures(updatedList);

    try {
      // Sequentially render all active signature layers onto cleanBase
      const compositeDataUrl = await renderMultipleSignaturesOnImage(
        cleanBase,
        updatedList.filter((s) => s.enabled).map((s) => s.preset)
      );

      handleApplyNewImage(
        compositeDataUrl,
        `Signature KABO Store (${updatedList.length}) : ${storeItem.title}`
      );
      setHasAppliedSignature(true);
      setToastMessage(`✓ Signature KABO Store ajoutée : ${storeItem.title}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Erreur lors de l'application de la signature du store:", err);
    }
  };

  // Remove a single specific KABO Store signature
  const handleRemoveAppliedStoreSignature = async (instanceId: string) => {
    const updatedList = appliedStoreSignatures.filter((s) => s.instanceId !== instanceId);
    setAppliedStoreSignatures(updatedList);

    const cleanBase = baseImageBeforeSignature || project.originalImage;
    if (updatedList.length === 0) {
      if (baseImageBeforeSignature) {
        handleApplyNewImage(baseImageBeforeSignature, "Signature KABO Store retirée");
        setBaseImageBeforeSignature(null);
        setHasAppliedSignature(false);
      }
    } else {
      try {
        const compositeDataUrl = await renderMultipleSignaturesOnImage(
          cleanBase,
          updatedList.filter((s) => s.enabled).map((s) => s.preset)
        );
        handleApplyNewImage(compositeDataUrl, "Signature KABO Store retirée");
      } catch (err) {
        console.error("Erreur mise à jour après suppression de signature:", err);
      }
    }
    setToastMessage("✓ Signature retirée de l'image");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Clear all applied KABO Store signatures
  const handleClearAllAppliedStoreSignatures = () => {
    setAppliedStoreSignatures([]);
    if (baseImageBeforeSignature) {
      handleApplyNewImage(baseImageBeforeSignature, "Toutes les signatures KABO Store retirées");
      setBaseImageBeforeSignature(null);
      setHasAppliedSignature(false);
    }
    setToastMessage("✓ Toutes les signatures KABO Store retirées");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1-Click Event Preset Application
  const handleSelectPreset = (preset: EventPreset) => {
    setActivePresetId(preset.id);
    const updatedSettings: AdjustmentSettings = {
      ...project.settings,
      ...preset.settings,
    };
    updateSettingsWithHistory(updatedSettings, `Preset : ${preset.name}`);
  };

  // Reset adjustments to default
  const handleResetAdjustments = () => {
    setActivePresetId(undefined);
    updateSettingsWithHistory(DEFAULT_SETTINGS, "Réinitialisation des réglages");
  };

  // Quick skin smoothing button
  const handleQuickSkinSmooth = () => {
    const currentVal = project.settings.skinSmoothing;
    const newVal = Math.min(100, currentVal + 40 || 50);
    updateSettingsWithHistory(
      { ...project.settings, skinSmoothing: newVal },
      `Lissage Peau IA (${newVal}%)`
    );
  };

  const handleUndo = () => {
    if (project.historyIndex > 0) {
      const targetIndex = project.historyIndex - 1;
      const targetItem = project.history[targetIndex];
      setProject((prev) => ({
        ...prev,
        settings: JSON.parse(JSON.stringify(targetItem.settings)),
        originalImage: targetItem.image || prev.originalImage,
        dimensions: targetItem.dimensions || prev.dimensions,
        historyIndex: targetIndex,
      }));

      // Check if we stepped back past a signature step
      const currentAction = project.history[project.historyIndex]?.actionName || "";
      if (currentAction.toLowerCase().includes("signature") || currentAction.toLowerCase().includes("filigrane")) {
        setHasAppliedSignature(false);
      }
      setToastMessage(`↩ Annulé : ${currentAction}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleRedo = () => {
    if (project.historyIndex < project.history.length - 1) {
      const targetIndex = project.historyIndex + 1;
      const targetItem = project.history[targetIndex];
      setProject((prev) => ({
        ...prev,
        settings: JSON.parse(JSON.stringify(targetItem.settings)),
        originalImage: targetItem.image || prev.originalImage,
        dimensions: targetItem.dimensions || prev.dimensions,
        historyIndex: targetIndex,
      }));

      if (targetItem.actionName.toLowerCase().includes("signature") || targetItem.actionName.toLowerCase().includes("filigrane")) {
        setHasAppliedSignature(true);
      }
      setToastMessage(`↪ Rétabli : ${targetItem.actionName}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleSelectHistoryIndex = (idx: number) => {
    if (idx >= 0 && idx < project.history.length) {
      const target = project.history[idx];
      setProject((prev) => ({
        ...prev,
        settings: JSON.parse(JSON.stringify(target.settings)),
        originalImage: target.image || prev.originalImage,
        dimensions: target.dimensions || prev.dimensions,
        historyIndex: idx,
      }));
      if (target.actionName.toLowerCase().includes("signature") || target.actionName.toLowerCase().includes("filigrane")) {
        setHasAppliedSignature(true);
      } else {
        setHasAppliedSignature(false);
      }
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project.historyIndex, project.history]);

  // 1-Click Pro Beauty & Skin Filter Engine
  const handleApplyBeautyFilter = (filter: BeautyOneClickFilter) => {
    if (!project.originalImage) return;

    // Preserve the clean base image before applying any beauty filter
    const baseSource = baseImageBeforeBeautyFilter || project.originalImage;
    if (!baseImageBeforeBeautyFilter) {
      setBaseImageBeforeBeautyFilter(project.originalImage);
    }

    setActiveBeautyFilterId(filter.id);
    setActiveBeautyFilterParams({ ...filter.params });
    setIsApplyingBeautyFilter(true);
    setToastMessage(`Application du filtre : ${filter.name}...`);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = baseSource;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || project.dimensions.width;
        canvas.height = img.naturalHeight || project.dimensions.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsApplyingBeautyFilter(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const processedDataUrl = applyOneClickBeautyFilter(canvas, filter.params);

        // Complementary non-destructive studio grading adjustments
        const newSettings: AdjustmentSettings = {
          ...project.settings,
          skinSmoothing: Math.max(project.settings.skinSmoothing, 30),
          clarity: filter.params.glowIntensity ? Math.max(project.settings.clarity, 5) : project.settings.clarity,
          vibrance: filter.params.skinWarmth > 0 ? Math.max(project.settings.vibrance, 8) : project.settings.vibrance,
        };

        setProject((prev) => {
          const newHistory = prev.history.slice(0, prev.historyIndex + 1);
          const newHistoryItem: HistoryItem = {
            id: "hist_" + Math.random().toString(36).substring(2, 9),
            actionName: `Filtre Peau Pro : ${filter.shortName}`,
            timestamp: Date.now(),
            settings: JSON.parse(JSON.stringify(newSettings)),
          };
          newHistory.push(newHistoryItem);

          return {
            ...prev,
            originalImage: processedDataUrl,
            settings: newSettings,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            updatedAt: new Date().toISOString(),
          };
        });

        setToastMessage(`✨ Filtre Peau Pro appliqué : ${filter.name}`);
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.error("Erreur application filtre peau pro:", err);
      } finally {
        setIsApplyingBeautyFilter(false);
      }
    };
    img.onerror = () => {
      setIsApplyingBeautyFilter(false);
      setToastMessage(null);
    };
  };

  // Real-time Manual Readjustment of any active Beauty Filter parameter
  const handleUpdateBeautyFilterParam = (paramKey: keyof AutoFaceParams, value: number) => {
    const baseSource = baseImageBeforeBeautyFilter || project.originalImage;
    if (!baseSource) return;

    if (!baseImageBeforeBeautyFilter) {
      setBaseImageBeforeBeautyFilter(project.originalImage);
    }

    const currentFilter = activeBeautyFilterId
      ? BEAUTY_ONE_CLICK_FILTERS.find((f) => f.id === activeBeautyFilterId)
      : null;
    const currentParams: AutoFaceParams =
      activeBeautyFilterParams ||
      (currentFilter ? { ...currentFilter.params } : { ...BEAUTY_ONE_CLICK_FILTERS[0].params });

    const newParams: AutoFaceParams = {
      ...currentParams,
      [paramKey]: value,
    };

    setActiveBeautyFilterParams(newParams);

    // Debounced real-time canvas recalculation
    if (beautyAdjustmentTimerRef.current) {
      clearTimeout(beautyAdjustmentTimerRef.current);
    }

    beautyAdjustmentTimerRef.current = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = baseSource;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || project.dimensions.width;
        canvas.height = img.naturalHeight || project.dimensions.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const updatedDataUrl = applyOneClickBeautyFilter(canvas, newParams);

        setProject((prev) => ({
          ...prev,
          originalImage: updatedDataUrl,
          updatedAt: new Date().toISOString(),
        }));
      };
    }, 120);
  };

  // Reset active beauty filter parameters back to preset original values
  const handleResetBeautyFilterParams = () => {
    if (!activeBeautyFilterId) return;
    const filter = BEAUTY_ONE_CLICK_FILTERS.find((f) => f.id === activeBeautyFilterId);
    if (!filter) return;

    setActiveBeautyFilterParams({ ...filter.params });
    handleApplyBeautyFilter(filter);
  };

  // Revert active beauty filter and restore original base image
  const handleRevertBeautyFilter = () => {
    if (!baseImageBeforeBeautyFilter) return;

    const restoredImage = baseImageBeforeBeautyFilter;
    setProject((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: "hist_" + Math.random().toString(36).substring(2, 9),
        actionName: "Annulation Filtre Peau (Image Originale)",
        timestamp: Date.now(),
        settings: JSON.parse(JSON.stringify(prev.settings)),
      });

      return {
        ...prev,
        originalImage: restoredImage,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });

    setActiveBeautyFilterId(undefined);
    setActiveBeautyFilterParams(null);
    setBaseImageBeforeBeautyFilter(null);
    setToastMessage("Image rétablie sans filtre beauté.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Automatic skin blemish cleaner action
  const handleAutoCleanBlemishes = () => {
    if (!project.originalImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.originalImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      autoCleanSkinBlemishes(canvas);
      const cleanedDataUrl = canvas.toDataURL("image/png");
      handleApplyNewImage(cleanedDataUrl, "Nettoyage Automatique des Imperfections");
    };
  };

  // AI Analysis Trigger
  const handleTriggerAiAnalysis = async () => {
    if (!project.originalImage) return;
    setIsAiAnalyzing(true);

    try {
      const simulatedReport: AIAnalysisReport = {
        photoCategory: "Portrait & Soirée",
        lightingDiagnosis: "Contraste dynamique bon, légère sous-exposition sur les visages.",
        qualityDiagnosis: "Netteté optimale, léger bruit dans les ombres.",
        proAdvice: "Augmentez l'exposition (+12) et appliquez un lissage de peau à 45% pour un rendu magazine.",
        suggestedAdjustments: {
          exposure: 12,
          highlights: -15,
          shadows: 18,
          temperature: 4,
          vibrance: 10,
          clarity: 8,
          skinSmoothing: 45,
        },
      };

      setProject((prev) => ({
        ...prev,
        aiReport: simulatedReport,
      }));

      // Apply suggestions
      if (simulatedReport.suggestedAdjustments) {
        updateSettingsWithHistory(
          { ...project.settings, ...simulatedReport.suggestedAdjustments },
          "Optimisation IA Gemini"
        );
      }

      setToastMessage("Analyse IA terminée et appliquée");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Custom AI Prompt handler
  const handleCustomAiPrompt = (promptText: string) => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      const newSettings = {
        ...project.settings,
        temperature: promptText.includes("chaud") ? 20 : project.settings.temperature,
        saturation: promptText.includes("couleur") ? 15 : project.settings.saturation,
        skinSmoothing: promptText.includes("peau") || promptText.includes("lisse") ? 60 : project.settings.skinSmoothing,
        exposure: promptText.includes("lum") || promptText.includes("clair") ? 15 : project.settings.exposure,
      };
      updateSettingsWithHistory(newSettings, `IA: "${promptText}"`);
      setIsAiAnalyzing(false);
      setToastMessage(`Prompt IA appliqué : "${promptText}"`);
      setTimeout(() => setToastMessage(null), 3000);
    }, 800);
  };

  // Snapshots
  const handleCreateSnapshot = (label: string) => {
    const newSnapshot: SnapshotItem = {
      id: "snap_" + Math.random().toString(36).substring(2, 9),
      label,
      timestamp: Date.now(),
      settings: JSON.parse(JSON.stringify(project.settings)),
      imagePreview: project.originalImage,
    };
    setProject((prev) => ({
      ...prev,
      snapshots: [newSnapshot, ...prev.snapshots],
    }));
    setToastMessage(`Instantané "${label}" créé`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRestoreSnapshot = (snapshot: SnapshotItem) => {
    updateSettingsWithHistory(snapshot.settings, `Restauration : ${snapshot.label}`);
    if (snapshot.imagePreview && snapshot.imagePreview !== project.originalImage) {
      handleApplyNewImage(snapshot.imagePreview, `Restauration Image : ${snapshot.label}`);
    }
  };

  // High-Res Export Execution
  const handleConfirmExport = async (options: ExportOptions) => {
    if (!project.originalImage) return;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = project.originalImage;
      await new Promise((resolve) => (img.onload = resolve));

      const dataUrl = await exportHighResImage(img, project.settings, options);
      if (!dataUrl) return;

      const formatExt = options.format === "jpeg" ? "jpg" : options.format;
      let downloadFilename = options.customFileName;
      if (!downloadFilename) {
        const cleanTitle = (project.title || "Image").replace(/\.[^/.]+$/, "").trim() || "Image";
        downloadFilename = `${cleanTitle}_OK.${formatExt}`;
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setIsExportOpen(false);
      setToastMessage(`Exporté sous ${downloadFilename}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error("Erreur export:", e);
    }
  };

  // Project Selection from Library Drawer
  const handleSelectProjectFromDrawer = (selectedProj: ProjectState) => {
    setProject(selectedProj);
    setActivePresetId(undefined);
    setActiveBeautyFilterId(undefined);
    setActiveBeautyFilterParams(null);
    setBaseImageBeforeBeautyFilter(null);
    setIsProjectsOpen(false);
  };

  // Delete project from library
  const handleDeleteProject = async (id: string) => {
    await deleteProjectFromLocal(id);
    await refreshStorage();
  };

  // Backup Import Handler
  const handleImportBackupFile = (importedProject: ProjectState) => {
    setProject(importedProject);
    setIsProjectsOpen(false);
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none font-sans transition-colors ${
        isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100"
      }`}
    >
      {/* Top Main Navigation Header */}
      <Header
        projectTitle={project.title}
        onTitleChange={(newTitle) => setProject((prev) => ({ ...prev, title: newTitle }))}
        onOpenExport={() => setIsExportOpen(true)}
        onExportClick={() => setIsExportOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        onOpenKaboStore={() => setIsKaboStoreOpen(true)}
        onUploadImage={handleUploadImageFile}
        onAutoFixClick={handleTriggerAiAnalysis}
        isAiAnalyzing={isAiAnalyzing}
        canUndo={project.historyIndex > 0}
        canRedo={project.historyIndex < project.history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        storageStats={storageStats}
        isCloudSyncEnabled={project.isCloudSynced}
        onToggleCloudSync={() =>
          setProject((prev) => ({ ...prev, isCloudSynced: !prev.isCloudSynced }))
        }
        hasImage={!!project.originalImage}
      />

      {/* Multi-Workspace Document Tabs (Photoshop-Style Tab bar) */}
      <WorkspaceTabsBar
        tabs={workspaces}
        activeTabId={activeWorkspaceId}
        onSelectTab={handleSelectWorkspace}
        onCloseTab={handleCloseWorkspace}
        onNewWorkspace={handleNewWorkspace}
      />

      {/* Main Studio Toolbar Header with 4 Unified Tool Sets */}
      {project.originalImage && (
        <StudioControlHeader
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          activeBeautyFilterId={activeBeautyFilterId}
          onApplyBeautyFilter={handleApplyBeautyFilter}
          onResetAdjustments={handleResetAdjustments}
          isHealingBrushActive={isHealingBrushActive}
          onToggleHealingBrush={() => setIsHealingBrushActive(!isHealingBrushActive)}
          onOpenTextModal={() => setIsTextModalOpen(true)}
          onOpenOverlayModal={() => setIsOverlayModalOpen(true)}
          onOpenBgModal={() => setIsBgModalOpen(true)}
          onOpenKaboStore={() => setIsKaboStoreOpen(true)}
          onAutoCleanBlemishes={handleAutoCleanBlemishes}
          onQuickSkinSmooth={handleQuickSkinSmooth}
          onOpenAutoFaceModal={() => setIsAutoFaceModalOpen(true)}
          selectionState={selectionState}
          onSelectModeChange={(mode: SelectionMode) =>
            setSelectionState({ mode, isActive: mode !== "none" })
          }
          onClearSelection={() => setSelectionState({ mode: "none", isActive: false })}
          onAutoSelectSubject={handleAutoSelectSubject}
          onDeleteOutsideSelection={handleDeleteOutsideSelection}
          onDeleteInsideSelection={handleDeleteInsideSelection}
          onApplyRetouchInsideSelection={handleApplyRetouchInsideSelection}
          isAnalyzingSubject={isAnalyzingSubject}
        />
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-2 rounded-full shadow-xl shadow-amber-500/10 flex items-center space-x-2 backdrop-blur-md animate-fade-in pointer-events-none">
            {isApplyingBeautyFilter ? (
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <span className="text-amber-400">✨</span>
            )}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Floating Quick Action Pill for Active Signature (Easy Edit / Remove before export) */}
        {hasAppliedSignature && project.originalImage && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in transition-all max-w-[95vw] ${
              isLight
                ? "bg-white/95 border-amber-300 text-slate-900 shadow-amber-500/15"
                : "bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-950/50"
            }`}
          >
            {appliedStoreSignatures.length > 0 ? (
              <>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-500">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>KABO Store ({appliedStoreSignatures.length})</span>
                </div>
                <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

                {/* Individual signatures chips with 1-click delete */}
                <div className="flex flex-wrap items-center gap-1.5 max-h-16 overflow-y-auto no-scrollbar">
                  {appliedStoreSignatures.map((sig) => (
                    <div
                      key={sig.instanceId}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${
                        isLight
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-amber-950/50 border-amber-800 text-amber-200"
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{sig.title}</span>
                      <button
                        onClick={() => handleRemoveAppliedStoreSignature(sig.instanceId)}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                        title={`Supprimer ${sig.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                <button
                  onClick={() => setIsKaboStoreOpen(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1 transition cursor-pointer shadow-xs"
                  title="Ajouter d'autres signatures ou logos depuis le KABO Store"
                >
                  <span>+ KABO Store</span>
                </button>
                <button
                  onClick={handleClearAllAppliedStoreSignatures}
                  className="px-2 py-1 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center space-x-1 transition cursor-pointer"
                  title="Tout retirer et restaurer l'image propre"
                >
                  <span>Tout retirer</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-500">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Signature Active</span>
                </div>
                <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => setIsTextModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center space-x-1 transition cursor-pointer shadow-xs"
                  title="Modifier la signature (changer icônes, ordre, position, texte, marge...)"
                >
                  <span>✏️ Modifier</span>
                </button>
                <button
                  onClick={handleRemoveSignature}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center space-x-1 transition cursor-pointer"
                  title="Supprimer la signature et restaurer la photo originale propre"
                >
                  <span>🗑️ Supprimer</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Central Interactive Studio Canvas Stage */}
        <MainCanvas
          imageSrc={project.originalImage || null}
          settings={project.settings}
          onSettingsChange={(newSettings) => updateSettingsWithHistory(newSettings)}
          isSplitView={isSplitView}
          onToggleSplitView={() => setIsSplitView(!isSplitView)}
          onUploadImage={handleUploadImageFile}
          onLoadSampleImage={handleLoadSample}
          isHealingBrushActive={isHealingBrushActive}
          onToggleHealingBrush={() => setIsHealingBrushActive(!isHealingBrushActive)}
          onApplyNewImage={handleApplyNewImage}
          originalCanvasRef={originalCanvasRef}
          brushSettings={brushSettings}
          onOpenBrushSettings={() => setIsBrushModalOpen(true)}
          selectionState={selectionState}
          onSelectionStateChange={setSelectionState}
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={handleSelectLayer}
          onUpdateLayerProp={handleUpdateLayerProp}
          onAddLayer={handleAddLayer}
        />

        {/* Right Adjustment & Layer Control Panel (Desktop View) */}
        <div className="hidden md:flex h-full shrink-0">
          <RightSidebarPanel
            settings={project.settings}
            onSettingsChange={(newSettings) => updateSettingsWithHistory(newSettings)}
            aiReport={project.aiReport}
            isAiAnalyzing={isAiAnalyzing}
            onTriggerAiAnalysis={handleTriggerAiAnalysis}
            onCustomAiPrompt={handleCustomAiPrompt}
            history={project.history}
            historyIndex={project.historyIndex}
            onSelectHistoryIndex={handleSelectHistoryIndex}
            snapshots={project.snapshots}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            isHealingBrushActive={isHealingBrushActive}
            onToggleHealingBrush={() => setIsHealingBrushActive(!isHealingBrushActive)}
            onOpenTextModal={() => setIsTextModalOpen(true)}
            onOpenBgModal={() => setIsBgModalOpen(true)}
            onAutoCleanBlemishes={handleAutoCleanBlemishes}
            activeBeautyFilterId={activeBeautyFilterId}
            activeBeautyFilterParams={activeBeautyFilterParams}
            onApplyBeautyFilter={handleApplyBeautyFilter}
            onUpdateBeautyFilterParam={handleUpdateBeautyFilterParam}
            onResetBeautyFilterParams={handleResetBeautyFilterParams}
            onRevertBeautyFilter={handleRevertBeautyFilter}
            onOpenAutoFaceModal={() => setIsAutoFaceModalOpen(true)}
            // Layer Management Props
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={handleSelectLayer}
            onAddLayer={handleAddLayer}
            onRemoveLayer={handleRemoveLayer}
            onToggleLayerVisibility={handleToggleLayerVisibility}
            onToggleLayerLock={handleToggleLayerLock}
            onMoveLayerOrder={handleMoveLayerOrder}
            onBringLayerToFront={handleBringLayerToFront}
            onSendLayerToBack={handleSendLayerToBack}
            onUpdateLayerProp={handleUpdateLayerProp}
          />
        </div>
      </div>

      {/* Mobile Sliding Bottom Sheet / Drawer for Tools */}
      {isMobileToolsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileToolsOpen(false)}
          />
          <div
            className={`relative z-10 w-full max-h-[85vh] h-[80vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col border-t transition-colors ${
              isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            }`}
          >
            {/* Drawer handle */}
            <div className="w-12 h-1.5 bg-slate-400/40 rounded-full mx-auto my-2 shrink-0" />
            <div className="flex-1 overflow-hidden flex flex-col">
              <RightSidebarPanel
                settings={project.settings}
                onSettingsChange={(newSettings) => updateSettingsWithHistory(newSettings)}
                aiReport={project.aiReport}
                isAiAnalyzing={isAiAnalyzing}
                onTriggerAiAnalysis={handleTriggerAiAnalysis}
                onCustomAiPrompt={handleCustomAiPrompt}
                history={project.history}
                historyIndex={project.historyIndex}
                onSelectHistoryIndex={handleSelectHistoryIndex}
                snapshots={project.snapshots}
                onCreateSnapshot={handleCreateSnapshot}
                onRestoreSnapshot={handleRestoreSnapshot}
                isHealingBrushActive={isHealingBrushActive}
                onToggleHealingBrush={() => setIsHealingBrushActive(!isHealingBrushActive)}
                onOpenTextModal={() => setIsTextModalOpen(true)}
                onOpenBgModal={() => setIsBgModalOpen(true)}
                onAutoCleanBlemishes={handleAutoCleanBlemishes}
                activeBeautyFilterId={activeBeautyFilterId}
                activeBeautyFilterParams={activeBeautyFilterParams}
                onApplyBeautyFilter={handleApplyBeautyFilter}
                onUpdateBeautyFilterParam={handleUpdateBeautyFilterParam}
                onResetBeautyFilterParams={handleResetBeautyFilterParams}
                onRevertBeautyFilter={handleRevertBeautyFilter}
                onOpenAutoFaceModal={() => setIsAutoFaceModalOpen(true)}
                onCloseMobile={() => setIsMobileToolsOpen(false)}
                // Layer Management Props
                layers={layers}
                activeLayerId={activeLayerId}
                onSelectLayer={handleSelectLayer}
                onAddLayer={handleAddLayer}
                onRemoveLayer={handleRemoveLayer}
                onToggleLayerVisibility={handleToggleLayerVisibility}
                onToggleLayerLock={handleToggleLayerLock}
                onMoveLayerOrder={handleMoveLayerOrder}
                onBringLayerToFront={handleBringLayerToFront}
                onSendLayerToBack={handleSendLayerToBack}
                onUpdateLayerProp={handleUpdateLayerProp}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Phone Portrait & Landscape) */}
      <nav
        className={`md:hidden shrink-0 border-t px-3 py-2 flex items-center justify-around z-30 shadow-lg transition-colors ${
          isLight ? "bg-white/95 border-slate-200" : "bg-slate-900/95 border-slate-800"
        }`}
      >
        <button
          onClick={() => setIsMobileToolsOpen(true)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
            isMobileToolsOpen
              ? "text-indigo-600 font-bold"
              : isLight
              ? "text-slate-700 hover:text-indigo-600"
              : "text-slate-300 hover:text-indigo-400"
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">Outils</span>
        </button>

        <button
          onClick={() => setIsAutoFaceModalOpen(true)}
          disabled={!project.originalImage}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer disabled:opacity-40 ${
            isLight ? "text-slate-700 hover:text-pink-600" : "text-slate-300 hover:text-pink-400"
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-pink-500" />
          <span className="text-[10px] font-semibold">Beauté</span>
        </button>

        <button
          onClick={handleTriggerAiAnalysis}
          disabled={isAiAnalyzing || !project.originalImage}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer text-indigo-600 disabled:opacity-40"
        >
          <Wand2 className={`w-5 h-5 mb-0.5 ${isAiAnalyzing ? "animate-spin" : ""}`} />
          <span className="text-[10px] font-semibold">Auto IA</span>
        </button>

        <button
          onClick={() => setIsSplitView(!isSplitView)}
          disabled={!project.originalImage}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer disabled:opacity-40 ${
            isSplitView ? "text-indigo-600 font-bold" : isLight ? "text-slate-700" : "text-slate-300"
          }`}
        >
          <Columns className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">Avant/Après</span>
        </button>

        <button
          onClick={() => setIsExportOpen(true)}
          disabled={!project.originalImage}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer disabled:opacity-40 shadow-sm"
        >
          <Download className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Export HD</span>
        </button>
      </nav>

      {/* Photoshop Style Brush Settings Modal */}
      <BrushSettingsModal
        isOpen={isBrushModalOpen}
        onClose={() => setIsBrushModalOpen(false)}
        brushSettings={brushSettings}
        onUpdateBrushSettings={setBrushSettings}
      />

      {/* High Res Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onConfirmExport={handleConfirmExport}
        originalDimensions={project.dimensions}
        initialTitle={project.title}
      />

      {/* Projects Library Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={allProjects}
        currentProjectId={project.id}
        onSelectProject={handleSelectProjectFromDrawer}
        onDeleteProject={handleDeleteProject}
        storageStats={storageStats}
        isCloudSyncEnabled={project.isCloudSynced}
        onToggleCloudSync={() =>
          setProject((prev) => ({ ...prev, isCloudSynced: !prev.isCloudSynced }))
        }
        onImportBackupFile={handleImportBackupFile}
      />

      {/* Batch Processing Modal */}
      <BatchProcessingModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onOpenKaboStore={() => {
          setIsBatchOpen(false);
          setIsKaboStoreOpen(true);
        }}
      />

      {/* Text & Signature Studio Modal */}
      <TextIncrustationModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        originalImageSrc={project.originalImage}
        baseImageBeforeSignature={baseImageBeforeSignature}
        hasAppliedSignature={hasAppliedSignature}
        onRemoveSignature={handleRemoveSignature}
        onApplyNewImage={handleApplyNewImage}
        onOpenKaboStore={() => {
          setIsTextModalOpen(false);
          setIsKaboStoreOpen(true);
        }}
      />

      {/* KABO Store Shared Community Library Modal */}
      <KaboStoreModal
        isOpen={isKaboStoreOpen}
        onClose={() => setIsKaboStoreOpen(false)}
        onApplyStoreSignatureToImage={handleApplyStoreSignatureToImage}
        onRemoveAppliedStoreSignature={handleRemoveAppliedStoreSignature}
        onClearAllAppliedStoreSignatures={handleClearAllAppliedStoreSignatures}
        appliedStoreSignatures={appliedStoreSignatures}
        hasActiveImage={!!project.originalImage}
        activeImageSrc={project.originalImage}
        onOpenSignatureEditor={() => {
          setIsKaboStoreOpen(false);
          setIsTextModalOpen(true);
        }}
      />

      {/* Secondary Image Overlay & Crop Modal */}
      <ImageOverlayModal
        isOpen={isOverlayModalOpen}
        onClose={() => setIsOverlayModalOpen(false)}
        originalImageSrc={project.originalImage}
        onApplyNewImage={handleApplyNewImage}
      />

      {/* Auto Face & Blemish Clean with Gaussian Blur Modal */}
      <AutoFaceModal
        isOpen={isAutoFaceModalOpen}
        onClose={() => setIsAutoFaceModalOpen(false)}
        originalImageSrc={baseImageBeforeBeautyFilter || project.originalImage}
        initialParams={activeBeautyFilterParams || undefined}
        initialFilterId={activeBeautyFilterId}
        onApplyNewImage={handleApplyNewImage}
      />

      {/* Background Removal Modal */}
      <BackgroundRemovalModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        originalImageSrc={project.originalImage}
        onApplyNewImage={handleApplyNewImage}
      />
    </div>
  );
}
