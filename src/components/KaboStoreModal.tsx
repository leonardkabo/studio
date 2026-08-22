import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Store,
  Search,
  Upload,
  Download,
  Trash2,
  Heart,
  Sparkles,
  Check,
  ShieldCheck,
  Share2,
  Eye,
  BookmarkPlus,
  RefreshCw,
  Grid,
  Image as ImageIcon,
  Sun,
  Moon,
} from "lucide-react";
import {
  KaboStoreItem,
  KaboStoreCategory,
  KaboStoreItemType,
  SavedSignaturePreset,
  AppliedStoreSignature,
} from "../types";
import {
  fetchKaboStoreItems,
  publishToKaboStore,
  deleteFromKaboStore,
  likeKaboStoreItem,
  recordKaboStoreDownload,
  generatePresetThumbnail,
  generatePresetLivePreview,
} from "../utils/kaboStoreApi";
import { getSavedSignatures, saveSignaturePreset } from "../utils/signatureStorage";
import { useTheme } from "../context/ThemeContext";

interface KaboStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Canvas & Image actions
  hasImage?: boolean;
  hasActiveImage?: boolean;
  activeImageSrc?: string | null;
  onApplyStoreSignatureToImage: (preset: SavedSignaturePreset, storeItem: KaboStoreItem) => void;
  appliedStoreSignatures: AppliedStoreSignature[];
  onRemoveAppliedStoreSignature: (instanceId: string) => void;
  onClearAllAppliedStoreSignatures: () => void;
  // Current active signature in editor (for easy sharing)
  currentActivePreset?: SavedSignaturePreset | null;
  onLoadPresetIntoEditor?: (preset: SavedSignaturePreset) => void;
  onOpenSignatureEditor?: () => void;
}

const CATEGORIES: KaboStoreCategory[] = [
  "Tous",
  "Événementiel & Soirée",
  "Mariage & Cérémonie",
  "Studio & Portrait",
  "Photographe Pro",
  "Réseaux Sociaux",
  "Minimaliste",
  "Filigranes",
  "Commercial & Marque",
];

export const KaboStoreModal: React.FC<KaboStoreModalProps> = ({
  isOpen,
  onClose,
  hasImage,
  hasActiveImage,
  activeImageSrc,
  onApplyStoreSignatureToImage,
  appliedStoreSignatures,
  onRemoveAppliedStoreSignature,
  onClearAllAppliedStoreSignatures,
  currentActivePreset,
  onLoadPresetIntoEditor,
  onOpenSignatureEditor,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const isPhotoAvailable = Boolean(hasActiveImage || hasImage || activeImageSrc);

  const [items, setItems] = useState<KaboStoreItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<KaboStoreCategory>("Tous");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes" | "name">("popular");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local like tracking
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(() => new Set());

  // Interactive Live Preview Modal State
  const [previewItem, setPreviewItem] = useState<KaboStoreItem | null>(null);
  const [previewMode, setPreviewMode] = useState<"photo" | "dark" | "light" | "checker">("photo");
  const [previewLiveUrl, setPreviewLiveUrl] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Publish Dialog State
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState<boolean>(false);
  const [publishTitle, setPublishTitle] = useState<string>("");
  const [publishAuthor, setPublishAuthor] = useState<string>(() => {
    try {
      return localStorage.getItem("kabo_store_author_name") || "";
    } catch {
      return "";
    }
  });
  const [publishCategory, setPublishCategory] = useState<KaboStoreCategory>("Studio & Portrait");
  const [publishType, setPublishType] = useState<KaboStoreItemType>("signature");
  const [publishTags, setPublishTags] = useState<string>("Signature, Pro, HD");
  const [selectedLocalPresetId, setSelectedLocalPresetId] = useState<string>("current");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishPreviewUrl, setPublishPreviewUrl] = useState<string>("");

  // Delete Confirmation Dialog
  const [itemToDelete, setItemToDelete] = useState<KaboStoreItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await fetchKaboStoreItems({
        category: selectedCategory,
        search: searchQuery,
        type: selectedType,
        sort: sortBy,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, selectedCategory, selectedType, sortBy]);

  // Search Debounce
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Live Preview generation whenever previewItem or previewMode changes
  useEffect(() => {
    if (!previewItem) {
      setPreviewLiveUrl("");
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);

    const mode = !isPhotoAvailable && previewMode === "photo" ? "dark" : previewMode;

    generatePresetLivePreview(previewItem.preset, mode, activeImageSrc, 1280, 720)
      .then((url) => {
        if (isMounted) {
          setPreviewLiveUrl(url);
          setIsPreviewLoading(false);
        }
      })
      .catch((err) => {
        console.error("Preview render error:", err);
        if (isMounted) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [previewItem, previewMode, activeImageSrc, isPhotoAvailable]);

  // Open Preview Modal for an item
  const handleOpenPreview = (item: KaboStoreItem) => {
    setPreviewItem(item);
    setPreviewMode(isPhotoAvailable ? "photo" : "dark");
  };

  // Update Publish Preview when selected preset changes
  useEffect(() => {
    if (!isPublishDialogOpen) return;

    let targetPreset: SavedSignaturePreset | null = null;
    if (selectedLocalPresetId === "current" && currentActivePreset) {
      targetPreset = currentActivePreset;
    } else {
      const localPresets = getSavedSignatures();
      targetPreset = localPresets.find((p) => p.id === selectedLocalPresetId) || currentActivePreset || null;
    }

    if (targetPreset) {
      generatePresetThumbnail(targetPreset, "dark", 640, 360).then((url) => {
        setPublishPreviewUrl(url);
      });
    }
  }, [isPublishDialogOpen, selectedLocalPresetId, currentActivePreset]);

  const handleApplySignature = async (item: KaboStoreItem) => {
    onApplyStoreSignatureToImage(item.preset, item);
    await recordKaboStoreDownload(item.id);
    showToast(`✓ Signature "${item.title}" appliquée sur votre image.`);
  };

  const handleSaveToLocal = (item: KaboStoreItem) => {
    const newPreset: SavedSignaturePreset = {
      ...item.preset,
      id: `saved_from_store_${Date.now()}`,
      name: `${item.title} (Store)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSignaturePreset(newPreset);
    showToast(`✓ "${item.title}" enregistrée dans "Mes Signatures" locales !`);
  };

  const handleLike = async (item: KaboStoreItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (likedItemIds.has(item.id)) return;
    const nextSet = new Set(likedItemIds);
    nextSet.add(item.id);
    setLikedItemIds(nextSet);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, likesCount: (i.likesCount || 0) + 1 } : i))
    );

    const res = await likeKaboStoreItem(item.id);
    if (res.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, likesCount: res.likesCount } : i))
      );
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFromKaboStore(itemToDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      if (previewItem?.id === itemToDelete.id) {
        setPreviewItem(null);
      }
      showToast(`✓ La signature "${itemToDelete.title}" a été supprimée du KABO Store.`);
      setItemToDelete(null);
    } catch (err: any) {
      showToast(`❌ ${err.message || "Erreur lors de la suppression"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPublishDialog = () => {
    if (currentActivePreset) {
      setPublishTitle(currentActivePreset.name || currentActivePreset.text || "Nouvelle Signature Pro");
      setSelectedLocalPresetId("current");
    } else {
      const localPresets = getSavedSignatures();
      if (localPresets.length > 0) {
        setPublishTitle(localPresets[0].name);
        setSelectedLocalPresetId(localPresets[0].id);
      }
    }
    setIsPublishDialogOpen(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTitle.trim()) {
      showToast("Veuillez saisir un nom pour votre signature.");
      return;
    }

    let targetPreset: SavedSignaturePreset | null = null;
    if (selectedLocalPresetId === "current" && currentActivePreset) {
      targetPreset = currentActivePreset;
    } else {
      const localPresets = getSavedSignatures();
      targetPreset = localPresets.find((p) => p.id === selectedLocalPresetId) || currentActivePreset || null;
    }

    if (!targetPreset) {
      showToast("Aucune configuration de signature sélectionnée.");
      return;
    }

    setIsPublishing(true);
    try {
      const authorName = publishAuthor.trim() || "Photographe Créateur";
      try {
        localStorage.setItem("kabo_store_author_name", authorName);
      } catch {}

      const previewUrl = await generatePresetThumbnail(targetPreset, "dark", 640, 360);

      const parsedTags = publishTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await publishToKaboStore({
        title: publishTitle.trim(),
        author: authorName,
        category: publishCategory,
        itemType: publishType,
        preset: targetPreset,
        previewDataUrl: previewUrl,
        tags: parsedTags.length > 0 ? parsedTags : ["Signature", "KABO Store"],
      });

      setItems((prev) => [created, ...prev]);
      setIsPublishDialogOpen(false);
      showToast(`🎉 Signature "${created.title}" publiée avec succès sur le KABO Store !`);
    } catch (err: any) {
      showToast(`❌ ${err.message || "Erreur lors de la publication"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const localSavedPresets = useMemo(() => {
    return getSavedSignatures();
  }, [isPublishDialogOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div
        className={`w-full max-w-6xl max-h-[94vh] h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-colors ${
          isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-100"
        }`}
      >
        {/* Header: Title, Share CTA & Close */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? "bg-slate-50/90 border-slate-200" : "bg-slate-950/90 border-slate-800"
          }`}
        >
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-[2px] shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold tracking-tight">KABO Store</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Bibliothèque Partagée
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Libre & Gratuit</span>
                </span>
              </div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Prévisualisez et appliquez des signatures & logos partagés par la communauté
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenPublishDialog}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transition"
              title="Partager votre propre signature sur le KABO Store"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Partager une Signature</span>
              <span className="sm:hidden">Partager</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Applied Signatures Strip */}
        {appliedStoreSignatures && appliedStoreSignatures.length > 0 && (
          <div
            className={`px-4 py-2 border-b flex items-center justify-between overflow-x-auto no-scrollbar gap-2 shrink-0 ${
              isLight ? "bg-amber-50/70 border-amber-200" : "bg-amber-950/30 border-amber-900/40"
            }`}
          >
            <div className="flex items-center space-x-2 shrink-0">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {appliedStoreSignatures.length} signature(s) active(s) :
              </span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
              {appliedStoreSignatures.map((sig, idx) => (
                <div
                  key={sig.instanceId}
                  className={`flex items-center space-x-2 px-2.5 py-1 rounded-xl text-xs font-semibold border shrink-0 transition ${
                    isLight
                      ? "bg-white border-amber-300 text-slate-800 shadow-xs"
                      : "bg-slate-900 border-amber-700/60 text-slate-200 shadow-xs"
                  }`}
                >
                  <span className="text-amber-500 font-mono text-[10px]">#{idx + 1}</span>
                  <span className="max-w-[140px] truncate">{sig.title}</span>
                  <button
                    onClick={() => onRemoveAppliedStoreSignature(sig.instanceId)}
                    className="p-0.5 rounded text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title={`Retirer "${sig.title}"`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {appliedStoreSignatures.length > 1 && (
                <button
                  onClick={onClearAllAppliedStoreSignatures}
                  className="text-[11px] font-bold text-rose-500 hover:underline px-2 cursor-pointer shrink-0"
                >
                  Tout retirer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Clean Filter Bar */}
        <div
          className={`p-3 border-b space-y-2.5 shrink-0 ${
            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une signature, un style ou un auteur..."
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    : "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type & Sort Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-800"
                    : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
              >
                <option value="all">Tous les formats</option>
                <option value="signature">Signatures Complètes</option>
                <option value="badge">Bandeaux & Cartouches</option>
                <option value="watermark">Filigranes</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                  isLight
                    ? "bg-white border-slate-300 text-slate-800"
                    : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
              >
                <option value="popular">🔥 Plus populaires</option>
                <option value="newest">✨ Plus récents</option>
                <option value="likes">❤️ Les plus aimés</option>
                <option value="name">🔤 Nom (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                      : isLight
                      ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-200"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Airy Grid Area (Minimal Details, No Descriptions) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Chargement des signatures...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm">Aucun modèle trouvé</h3>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Aucune signature ne correspond à votre recherche.
              </p>
              <button
                onClick={handleOpenPublishDialog}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
              >
                Partager une création
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {items.map((item) => {
                const isLiked = likedItemIds.has(item.id);
                const isApplied = appliedStoreSignatures.some((a) => a.storeItemId === item.id);

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 group hover:shadow-xl ${
                      isLight
                        ? "bg-white border-slate-200/90 hover:border-amber-300"
                        : "bg-slate-950/80 border-slate-800/90 hover:border-amber-500/50"
                    }`}
                  >
                    {/* Visual Thumbnail Area - Click to open Full Interactive Preview */}
                    <div
                      onClick={() => handleOpenPreview(item)}
                      className="relative w-full h-44 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {item.previewDataUrl ? (
                        <img
                          src={item.previewDataUrl}
                          alt={item.title}
                          className="w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Store className="w-8 h-8 text-amber-500 mx-auto mb-1 opacity-60" />
                          <span className="text-[11px] text-slate-400 font-medium">Signature personnalisée</span>
                        </div>
                      )}

                      {/* Top Category Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-amber-400 border border-amber-500/30 backdrop-blur-xs">
                          {item.category}
                        </span>
                        {item.isVerifiedPro && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 flex items-center space-x-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Pro</span>
                          </span>
                        )}
                      </div>

                      {/* Top Right Quick Delete (Server-level) */}
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700/60 transition cursor-pointer backdrop-blur-xs"
                          title="Supprimer du KABO Store"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Hover Overlay Hint */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg flex items-center space-x-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Prévisualiser</span>
                        </span>
                      </div>
                    </div>

                    {/* Airy Card Content (Minimal, Clean, No Long Descriptions) */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                      {/* Title & Author */}
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Par <span className="font-semibold text-slate-700 dark:text-slate-300">{item.author}</span>
                        </p>
                      </div>

                      {/* Actions Strip */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        {/* Likes & Local Save */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1" title="Utilisations">
                              <Download className="w-3 h-3 text-emerald-500" />
                              <span>{item.downloadsCount || 0}</span>
                            </span>
                            <button
                              onClick={(e) => handleLike(item, e)}
                              className={`flex items-center space-x-1 transition cursor-pointer ${
                                isLiked ? "text-rose-500 font-bold" : "hover:text-rose-400"
                              }`}
                              title="Aimer ce modèle"
                            >
                              <Heart className={`w-3 h-3 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{item.likesCount || 0}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleSaveToLocal(item)}
                            className="text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold text-[11px]"
                            title="Sauvegarder dans 'Mes Signatures' locales"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Sauvegarder</span>
                          </button>
                        </div>

                        {/* Dual Action Buttons: Preview & Apply */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleOpenPreview(item)}
                            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border ${
                              isLight
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                                : "bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-700"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-500" />
                            <span>Aperçu</span>
                          </button>

                          <button
                            onClick={() => handleApplySignature(item)}
                            disabled={!isPhotoAvailable}
                            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer shadow-xs ${
                              isApplied
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 disabled:opacity-40"
                            }`}
                            title={
                              isPhotoAvailable
                                ? "Appliquer sur la photo ouverte"
                                : "Ouvrez une photo pour appliquer cette signature"
                            }
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Ajoutée</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Appliquer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isLight ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-500">Astuce :</span>
            <span>Cliquez sur n'importe quel modèle pour le prévisualiser en direct sur votre photo avant de l'appliquer.</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
              isLight
                ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700"
            }`}
          >
            Fermer
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-70 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs font-bold shadow-2xl border border-amber-500/50 flex items-center space-x-2 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ======================================================================== */}
        {/* INTERACTIVE FULL-SIZE LIVE PREVIEW MODAL (PREVIEW BEFORE APPLYING)      */}
        {/* ======================================================================== */}
        {previewItem && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div
              className={`w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              {/* Preview Header */}
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm sm:text-base">{previewItem.title}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        {previewItem.category}
                      </span>
                    </div>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Créé par <span className="font-semibold text-slate-700 dark:text-slate-300">{previewItem.author}</span>
                    </p>
                  </div>
                </div>

                {/* Close Preview Button */}
                <button
                  onClick={() => setPreviewItem(null)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                  title="Fermer l'aperçu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Background Selector Tabs */}
              <div
                className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
                  isLight ? "bg-slate-100/70 border-slate-200" : "bg-slate-950/70 border-slate-800"
                }`}
              >
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Mode de prévisualisation :
                </span>

                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {isPhotoAvailable && (
                    <button
                      onClick={() => setPreviewMode("photo")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        previewMode === "photo"
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : isLight
                          ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-200"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Sur ma photo</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewMode("dark")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      previewMode === "dark"
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Fond Sombre</span>
                  </button>

                  <button
                    onClick={() => setPreviewMode("light")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      previewMode === "light"
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Fond Clair</span>
                  </button>

                  <button
                    onClick={() => setPreviewMode("checker")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      previewMode === "checker"
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Damier Transparent</span>
                  </button>
                </div>
              </div>

              {/* Preview Main Stage */}
              <div className="flex-1 overflow-hidden p-4 sm:p-6 flex items-center justify-center bg-slate-950/90 relative min-h-[300px]">
                {isPreviewLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Génération de la prévisualisation HD...</p>
                  </div>
                ) : previewLiveUrl ? (
                  <div className="w-full h-full max-h-[55vh] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
                    <img
                      src={previewLiveUrl}
                      alt={previewItem.title}
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <p className="text-xs">Impossible de générer l'aperçu.</p>
                  </div>
                )}
              </div>

              {/* Preview Bottom Action Bar */}
              <div
                className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSaveToLocal(previewItem)}
                    className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      isLight
                        ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700"
                    }`}
                  >
                    <BookmarkPlus className="w-4 h-4 text-amber-500" />
                    <span>Sauvegarder dans Mes Signatures</span>
                  </button>

                  <button
                    onClick={() => {
                      setItemToDelete(previewItem);
                    }}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition cursor-pointer"
                    title="Supprimer du KABO Store"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setPreviewItem(null)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                      isLight
                        ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    Fermer l'aperçu
                  </button>

                  <button
                    onClick={() => {
                      handleApplySignature(previewItem);
                      setPreviewItem(null);
                    }}
                    disabled={!isPhotoAvailable}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Appliquer sur ma Photo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* PUBLISH / SHARE DIALOG                                                   */}
        {/* ======================================================================== */}
        {isPublishDialogOpen && (
          <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className={`w-full max-w-lg p-5 rounded-3xl shadow-2xl border flex flex-col space-y-4 animate-fade-in ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Partager sur KABO Store</h3>
                    <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Rendez votre signature disponible pour la communauté
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPublishDialogOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
                {/* Source Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Signature source à partager :</label>
                  <select
                    value={selectedLocalPresetId}
                    onChange={(e) => setSelectedLocalPresetId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                      isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                    }`}
                  >
                    {currentActivePreset && (
                      <option value="current">
                        Signature actuelle en cours d'édition ("{currentActivePreset.name || currentActivePreset.text}")
                      </option>
                    )}
                    {localSavedPresets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.iconsList.filter((i) => i.enabled).length} logos • {p.orientation})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Preview */}
                {publishPreviewUrl && (
                  <div className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-2">
                    <img src={publishPreviewUrl} alt="Aperçu" className="max-h-full max-w-full object-contain" />
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Titre de la signature :</label>
                  <input
                    type="text"
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="Ex: Signature Mariage Or..."
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                    }`}
                  />
                </div>

                {/* Author Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Nom de l'auteur / Studio :</label>
                  <input
                    type="text"
                    value={publishAuthor}
                    onChange={(e) => setPublishAuthor(e.target.value)}
                    placeholder="Ex: Votre nom ou Studio..."
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                    }`}
                  />
                </div>

                {/* Category & Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Catégorie :</label>
                    <select
                      value={publishCategory}
                      onChange={(e) => setPublishCategory(e.target.value as KaboStoreCategory)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                        isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                      }`}
                    >
                      {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold block">Type :</label>
                    <select
                      value={publishType}
                      onChange={(e) => setPublishType(e.target.value as KaboStoreItemType)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                        isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                      }`}
                    >
                      <option value="signature">Signature Complète</option>
                      <option value="badge">Bandeau / Cartouche</option>
                      <option value="watermark">Filigrane</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Tags (séparés par des virgules) :</label>
                  <input
                    type="text"
                    value={publishTags}
                    onChange={(e) => setPublishTags(e.target.value)}
                    placeholder="Mariage, Or, Instagram, HD..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isLight ? "bg-slate-50 border-slate-300" : "bg-slate-950 border-slate-700 text-slate-100"
                    }`}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsPublishDialogOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Publication...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Publier sur KABO Store</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* DELETE CONFIRMATION DIALOG                                               */}
        {/* ======================================================================== */}
        {itemToDelete && (
          <div className="fixed inset-0 z-80 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md p-5 rounded-3xl shadow-2xl border flex flex-col space-y-4 animate-fade-in ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Supprimer du KABO Store ?</h4>
                  <p className="text-xs text-rose-400 font-semibold">Cette action est irréversible.</p>
                </div>
              </div>

              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                Voulez-vous vraiment supprimer la signature <b>"{itemToDelete.title}"</b> ? Elle sera effacée du serveur et ne sera plus disponible dans la bibliothèque communautaire.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span>Suppression...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmer la Suppression</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
