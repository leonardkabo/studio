import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Type,
  Check,
  Eye,
  Sliders,
  Palette,
  Sparkles,
  PenTool,
  RotateCw,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  MoveHorizontal,
  MoveVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Lock,
  Unlock,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeftRight,
  Link,
  Unlink,
  GripVertical,
  Star,
  Bookmark,
  BookmarkCheck,
  Save,
  PlusCircle,
  Edit3,
  FolderHeart,
  CheckCircle2,
} from "lucide-react";
import { renderImageInText } from "../utils/imageTools";
import { useTheme } from "../context/ThemeContext";
import { SavedSignaturePreset } from "../types";
import {
  getSavedSignatures,
  saveSignaturePreset,
  deleteSignaturePreset,
  setDefaultSignature,
  getDefaultOrLastUsedSignature,
  setLastUsedSignatureId,
} from "../utils/signatureStorage";

// Icon definition for social & photography emblems
export interface SignatureIconItem {
  id: string;
  name: string;
  key: string;
  type: "builtin" | "custom";
  size: number; // in pixels (e.g., 17)
  scaleMultiplier?: number; // scale factor e.g. 1.0 (100%), 1.5, 2.0 (200%), 2.5, 3.0 (300%), 4.0, 5.0
  enabled: boolean;
  customDataUrl?: string;
  svgPath?: string;
  viewBox?: string;
}

export type AnchorPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type SignatureOrientation =
  | "horizontal"
  | "vertical-ccw" // -90 deg
  | "vertical-cw" // +90 deg
  | "vertical-stack"; // 0 deg stacked

export type IconStyleMode =
  | "badge-dark" // Black circle disk + white icon (as shown in user screenshots)
  | "badge-light" // White circle disk + black icon
  | "monochrome" // Simple glyph matching text color
  | "badge-gold" // Gold metallic badge
  | "official"; // Official brand colors

interface TextIncrustationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc: string;
  onApplyNewImage: (newImageDataUrl: string, actionTitle: string) => void;
  baseImageBeforeSignature?: string | null;
  hasAppliedSignature?: boolean;
  onRemoveSignature?: () => void;
}

// Built-in vector paths for all social & photographer icons
export const BUILTIN_ICONS_DEF: {
  key: string;
  name: string;
  svgPath: string;
  brandColor: string;
  viewBox?: string;
}[] = [
  {
    key: "facebook",
    name: "Facebook",
    brandColor: "#1877F2",
    svgPath:
      "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    key: "youtube",
    name: "YouTube",
    brandColor: "#FF0000",
    svgPath:
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    key: "instagram",
    name: "Instagram",
    brandColor: "#E1306C",
    svgPath:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    key: "x",
    name: "X / Twitter",
    brandColor: "#000000",
    svgPath:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    key: "messenger",
    name: "Messenger",
    brandColor: "#00B2FF",
    svgPath:
      "M12 2C6.48 2 2 6.16 2 11.29c0 2.92 1.46 5.53 3.74 7.24V22l3.42-1.88c.9.25 1.86.37 2.84.37 5.52 0 10-4.16 10-9.29S17.52 2 12 2zm1 12.5l-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z",
  },
  {
    key: "tiktok",
    name: "TikTok",
    brandColor: "#000000",
    svgPath:
      "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    brandColor: "#25D366",
    svgPath:
      "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.07c-.24.68-1.4 1.25-1.93 1.33-.51.08-1.17.11-3.37-.8-2.35-.97-3.87-3.36-3.99-3.52-.12-.16-.96-1.28-.96-2.44 0-1.16.61-1.73.83-1.96.22-.23.48-.29.64-.29.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.68 1.67.74 1.79.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-1.16.76-.94.16.22.84 1.12.98 1.4.14.28.08.52-.16 1.2z",
  },
  {
    key: "telegram",
    name: "Telegram",
    brandColor: "#229ED9",
    svgPath:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.6 7.55c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.15c-.13.13-.24.24-.49.24l.18-2.5 4.55-4.11c.2-.18-.04-.28-.31-.1l-5.63 3.54-2.42-.76c-.53-.17-.54-.53.11-.78l9.46-3.65c.44-.16.82.1.68.81z",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    brandColor: "#0A66C2",
    svgPath:
      "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.3a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z",
  },
  {
    key: "camera",
    name: "Appareil Photo",
    brandColor: "#eab308",
    svgPath:
      "M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  },
  {
    key: "globe",
    name: "Site Web / Globe",
    brandColor: "#06b6d4",
    svgPath:
      "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1a2 2 0 0 0 2 2v1.93zm6.9-2.54A8 8 0 0 1 12 20v-2a1 1 0 0 0-1-1H9v-2h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V6h2a2 2 0 0 0 2-2v-.41A7.95 7.95 0 0 1 19.93 12a7.87 7.87 0 0 1-2.03 5.39z",
  },
  {
    key: "phone",
    name: "Téléphone",
    brandColor: "#10b981",
    svgPath:
      "M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.72 11.72 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.72 11.72 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02l-2.2 2.2z",
  },
  {
    key: "mail",
    name: "Email / Mail",
    brandColor: "#f59e0b",
    svgPath:
      "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
  },
  {
    key: "verified",
    name: "Badge Vérifié",
    brandColor: "#3b82f6",
    svgPath:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
];

export const TextIncrustationModal: React.FC<TextIncrustationModalProps> = ({
  isOpen,
  onClose,
  originalImageSrc,
  onApplyNewImage,
  baseImageBeforeSignature,
  hasAppliedSignature,
  onRemoveSignature,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveBaseImage = baseImageBeforeSignature || originalImageSrc;

  const [mode, setMode] = useState<"signature" | "textOnImage" | "imageInText">("signature");

  // Multi-icons sequence (Facebook, YouTube, Instagram, X, Messenger, TikTok default as requested!)
  const [iconsList, setIconsList] = useState<SignatureIconItem[]>([
    { id: "1", name: "Facebook", key: "facebook", type: "builtin", size: 17, enabled: true },
    { id: "2", name: "YouTube", key: "youtube", type: "builtin", size: 17, enabled: true },
    { id: "3", name: "Instagram", key: "instagram", type: "builtin", size: 17, enabled: true },
    { id: "4", name: "X / Twitter", key: "x", type: "builtin", size: 17, enabled: true },
    { id: "5", name: "Messenger", key: "messenger", type: "builtin", size: 17, enabled: true },
    { id: "6", name: "TikTok", key: "tiktok", type: "builtin", size: 17, enabled: true },
  ]);

  // Global icon size control (default 17px matching user request!)
  const [globalIconSize, setGlobalIconSize] = useState<number>(17);
  const [globalIconScale, setGlobalIconScale] = useState<number>(1.0); // 1.0 (100%), 1.5 (150%), 2.0 (200%), 2.5 (250%), 3.0 (300%), 4.0, 5.0
  const [syncAllIconSizes, setSyncAllIconSizes] = useState<boolean>(true);

  // Icon visual styling
  const [iconStyle, setIconStyle] = useState<IconStyleMode>("badge-dark");
  const [iconSpacing, setIconSpacing] = useState<number>(6); // px gap between icons
  const [iconTextSpacing, setIconTextSpacing] = useState<number>(10); // px gap between icons & text
  const [iconPositionOrder, setIconPositionOrder] = useState<"icons-first" | "text-first">("icons-first");

  // Text & Signature Parameters
  const [text, setText] = useState<string>("Amouretvie Abms");
  const [fontFamily, setFontFamily] = useState<string>("'Montserrat', sans-serif");
  const [fontSizePx, setFontSizePx] = useState<number>(20); // in px
  const [fontWeight, setFontWeight] = useState<"normal" | "600" | "bold" | "800">("bold");
  const [textColor, setTextColor] = useState<string>("#000000"); // Dark default as in screenshots
  const [opacity, setOpacity] = useState<number>(100); // %

  // Alignment & Layout
  const [orientation, setOrientation] = useState<SignatureOrientation>("horizontal");
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition>("bottom-right");
  const [customMarginUnit, setCustomMarginUnit] = useState<"px" | "%">("px");
  const [customMarginLinked, setCustomMarginLinked] = useState<boolean>(true);
  const [customMarginX, setCustomMarginX] = useState<number>(20); // in px (e.g. 0 to 500) or % (0 to 50)
  const [customMarginY, setCustomMarginY] = useState<number>(20); // in px or %
  const [fineRotation, setFineRotation] = useState<number>(0); // -180 to 180 deg fine tweak

  // Drag & drop state for icon sequence reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Outline & Shadow
  const [hasOutline, setHasOutline] = useState<boolean>(false);
  const [outlineColor, setOutlineColor] = useState<string>("#ffffff");
  const [outlineWidth, setOutlineWidth] = useState<number>(2); // px
  const [hasShadow, setHasShadow] = useState<boolean>(false);
  const [shadowColor, setShadowColor] = useState<string>("rgba(0,0,0,0.5)");

  // Background Badge Box Option
  const [hasBadgeBox, setHasBadgeBox] = useState<boolean>(false);
  const [badgeBoxColor, setBadgeBoxColor] = useState<string>("rgba(255, 255, 255, 0.85)");
  const [badgeBoxPadding, setBadgeBoxPadding] = useState<number>(8);

  // Image in Text Mode Params
  const [bgColor, setBgColor] = useState<string>("#090d16");

  // Real-time Live Preview URL
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Saved Signature Presets State (User saved signatures)
  const [savedSignatures, setSavedSignatures] = useState<SavedSignaturePreset[]>(() => getSavedSignatures());
  const [activeSavedPresetId, setActiveSavedPresetId] = useState<string | null>(() => {
    const def = getDefaultOrLastUsedSignature();
    return def ? def.id : null;
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);
  const [savePresetName, setSavePresetName] = useState<string>("");
  const [saveAsDefaultCheck, setSaveAsDefaultCheck] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showFeedbackToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Function to apply a saved signature preset
  const handleApplySavedPreset = (preset: SavedSignaturePreset) => {
    if (preset.mode) setMode(preset.mode);
    if (preset.iconsList) setIconsList(preset.iconsList);
    if (preset.globalIconSize !== undefined) setGlobalIconSize(preset.globalIconSize);
    if (preset.globalIconScale !== undefined) setGlobalIconScale(preset.globalIconScale);
    if (preset.syncAllIconSizes !== undefined) setSyncAllIconSizes(preset.syncAllIconSizes);
    if (preset.iconStyle) setIconStyle(preset.iconStyle);
    if (preset.iconSpacing !== undefined) setIconSpacing(preset.iconSpacing);
    if (preset.iconTextSpacing !== undefined) setIconTextSpacing(preset.iconTextSpacing);
    if (preset.iconPositionOrder) setIconPositionOrder(preset.iconPositionOrder);
    if (preset.text !== undefined) setText(preset.text);
    if (preset.fontFamily) setFontFamily(preset.fontFamily);
    if (preset.fontSizePx !== undefined) setFontSizePx(preset.fontSizePx);
    if (preset.fontWeight) setFontWeight(preset.fontWeight);
    if (preset.textColor) setTextColor(preset.textColor);
    if (preset.opacity !== undefined) setOpacity(preset.opacity);
    if (preset.orientation) setOrientation(preset.orientation);
    if (preset.anchorPosition) setAnchorPosition(preset.anchorPosition);
    if (preset.customMarginUnit) setCustomMarginUnit(preset.customMarginUnit);
    if (preset.customMarginLinked !== undefined) setCustomMarginLinked(preset.customMarginLinked);
    if (preset.customMarginX !== undefined) setCustomMarginX(preset.customMarginX);
    if (preset.customMarginY !== undefined) setCustomMarginY(preset.customMarginY);
    if (preset.fineRotation !== undefined) setFineRotation(preset.fineRotation);
    if (preset.hasOutline !== undefined) setHasOutline(preset.hasOutline);
    if (preset.outlineColor) setOutlineColor(preset.outlineColor);
    if (preset.outlineWidth !== undefined) setOutlineWidth(preset.outlineWidth);
    if (preset.hasShadow !== undefined) setHasShadow(preset.hasShadow);
    if (preset.shadowColor) setShadowColor(preset.shadowColor);
    if (preset.hasBadgeBox !== undefined) setHasBadgeBox(preset.hasBadgeBox);
    if (preset.badgeBoxColor) setBadgeBoxColor(preset.badgeBoxColor);
    if (preset.badgeBoxPadding !== undefined) setBadgeBoxPadding(preset.badgeBoxPadding);

    setActiveSavedPresetId(preset.id);
    setLastUsedSignatureId(preset.id);
    showFeedbackToast(`Signature « ${preset.name} » appliquée !`);
  };

  // Function to save current signature settings
  const handleSaveCurrentPreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = savePresetName.trim() || `Signature ${text.trim() || "Personnalisée"}`;
    const newPreset = saveSignaturePreset({
      name: finalName,
      isDefault: saveAsDefaultCheck,
      mode,
      iconsList,
      globalIconSize,
      globalIconScale,
      syncAllIconSizes,
      iconStyle,
      iconSpacing,
      iconTextSpacing,
      iconPositionOrder,
      text,
      fontFamily,
      fontSizePx,
      fontWeight,
      textColor,
      opacity,
      orientation,
      anchorPosition,
      customMarginUnit,
      customMarginLinked,
      customMarginX,
      customMarginY,
      fineRotation,
      hasOutline,
      outlineColor,
      outlineWidth,
      hasShadow,
      shadowColor,
      hasBadgeBox,
      badgeBoxColor,
      badgeBoxPadding,
    });

    if (saveAsDefaultCheck) {
      setDefaultSignature(newPreset.id);
    }

    const updated = getSavedSignatures();
    setSavedSignatures(updated);
    setActiveSavedPresetId(newPreset.id);
    setIsSaveDialogOpen(false);
    setSavePresetName("");
    setSaveAsDefaultCheck(false);
    showFeedbackToast(`✓ Signature « ${newPreset.name} » enregistrée !`);
  };

  // Function to update active preset
  const handleUpdateActivePreset = () => {
    if (!activeSavedPresetId) return;
    const current = savedSignatures.find((s) => s.id === activeSavedPresetId);
    if (!current) return;

    saveSignaturePreset({
      name: current.name,
      isDefault: current.isDefault,
      mode,
      iconsList,
      globalIconSize,
      globalIconScale,
      syncAllIconSizes,
      iconStyle,
      iconSpacing,
      iconTextSpacing,
      iconPositionOrder,
      text,
      fontFamily,
      fontSizePx,
      fontWeight,
      textColor,
      opacity,
      orientation,
      anchorPosition,
      customMarginUnit,
      customMarginLinked,
      customMarginX,
      customMarginY,
      fineRotation,
      hasOutline,
      outlineColor,
      outlineWidth,
      hasShadow,
      shadowColor,
      hasBadgeBox,
      badgeBoxColor,
      badgeBoxPadding,
    }, activeSavedPresetId);

    const updated = getSavedSignatures();
    setSavedSignatures(updated);
    showFeedbackToast(`✓ Signature « ${current.name} » mise à jour !`);
  };

  // Function to delete a preset
  const handleDeleteSavedPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = savedSignatures.find((s) => s.id === presetId);
    const updated = deleteSignaturePreset(presetId);
    setSavedSignatures(updated);
    if (activeSavedPresetId === presetId) {
      setActiveSavedPresetId(null);
    }
    showFeedbackToast(`Signature ${target ? `« ${target.name} »` : ""} supprimée.`);
  };

  // Function to toggle default signature
  const handleToggleDefaultPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = setDefaultSignature(presetId);
    setSavedSignatures(updated);
    const target = updated.find((s) => s.id === presetId);
    showFeedbackToast(target?.isDefault ? `« ${target.name} » définie par défaut !` : "Signature par défaut désactivée.");
  };

  // Function to start a fresh new signature
  const handleStartNewBlankSignature = () => {
    setActiveSavedPresetId(null);
    setText("Ma Signature");
    setSavePresetName("");
    showFeedbackToast("Nouvelle signature prête à être personnalisée.");
  };

  // On modal open, ensure saved signatures are loaded
  useEffect(() => {
    if (isOpen) {
      const all = getSavedSignatures();
      setSavedSignatures(all);
    }
  }, [isOpen]);

  // Color Presets
  const colorPresets = [
    { name: "Noir Profond", color: "#000000" },
    { name: "Blanc Pur", color: "#ffffff" },
    { name: "Or Métallique", color: "#eab308" },
    { name: "Argent Métal", color: "#e2e8f0" },
    { name: "Bleu Nuit", color: "#1e293b" },
    { name: "Rose Gold", color: "#f43f5e" },
    { name: "Cyan Électrique", color: "#06b6d4" },
    { name: "Émeraude", color: "#10b981" },
  ];

  // Font Presets
  const fontPresets = [
    { name: "Montserrat (Moderne Bold - Style Capture)", family: "'Montserrat', sans-serif" },
    { name: "Poppins (Géométrique Net)", family: "'Poppins', sans-serif" },
    { name: "Inter (Design Minimaliste)", family: "Inter, sans-serif" },
    { name: "Playfair Display (Classique / Mariage / Luxe)", family: "'Playfair Display', serif" },
    { name: "Cinzel (Graveur Antique)", family: "'Cinzel', serif" },
    { name: "Dancing Script (Manuscrit Cursive)", family: "'Dancing Script', cursive" },
    { name: "Great Vibes (Signature Artiste Pro)", family: "'Great Vibes', cursive" },
    { name: "Sacramento (Calligraphie Fine)", family: "'Sacramento', cursive" },
    { name: "Caveat (Manuscrit Moderne)", family: "'Caveat', cursive" },
    { name: "Impact (Massif / Affiche)", family: "Impact, sans-serif" },
  ];

  // Quick Preset Templates
  const handleApplyPresetTemplate = (type: "social-full" | "amouretvie" | "camera-pro" | "contact-all" | "clean-white") => {
    if (type === "amouretvie" || type === "social-full") {
      setIconsList([
        { id: "1", name: "Facebook", key: "facebook", type: "builtin", size: 17, enabled: true },
        { id: "2", name: "YouTube", key: "youtube", type: "builtin", size: 17, enabled: true },
        { id: "3", name: "Instagram", key: "instagram", type: "builtin", size: 17, enabled: true },
        { id: "4", name: "X / Twitter", key: "x", type: "builtin", size: 17, enabled: true },
        { id: "5", name: "Messenger", key: "messenger", type: "builtin", size: 17, enabled: true },
        { id: "6", name: "TikTok", key: "tiktok", type: "builtin", size: 17, enabled: true },
      ]);
      setText("Amouretvie Abms");
      setFontFamily("'Montserrat', sans-serif");
      setFontWeight("bold");
      setIconStyle("badge-dark");
      setTextColor("#000000");
      setHasBadgeBox(true);
      setBadgeBoxColor("#ffffff");
      setBadgeBoxPadding(6);
      setCustomMarginUnit("px");
      setCustomMarginX(0);
      setCustomMarginY(0);
      setAnchorPosition("bottom-center");
      setOrientation("horizontal");
    } else if (type === "camera-pro") {
      setIconsList([
        { id: "c1", name: "Appareil Photo", key: "camera", type: "builtin", size: 20, enabled: true },
        { id: "c2", name: "Instagram", key: "instagram", type: "builtin", size: 20, enabled: true },
      ]);
      setText("L. Kabo Photography");
      setFontFamily("'Great Vibes', cursive");
      setTextColor("#eab308");
      setIconStyle("monochrome");
      setHasBadgeBox(false);
      setOrientation("horizontal");
    } else if (type === "contact-all") {
      setIconsList([
        { id: "ct1", name: "Site Web", key: "globe", type: "builtin", size: 16, enabled: true },
        { id: "ct2", name: "Téléphone", key: "phone", type: "builtin", size: 16, enabled: true },
        { id: "ct3", name: "Instagram", key: "instagram", type: "builtin", size: 16, enabled: true },
      ]);
      setText("+229 00 00 00 00 • @moncompte");
      setFontFamily("Inter, sans-serif");
      setTextColor("#ffffff");
      setIconStyle("badge-dark");
      setHasOutline(true);
      setOutlineColor("#000000");
    } else if (type === "clean-white") {
      setIconStyle("badge-light");
      setTextColor("#ffffff");
      setHasOutline(true);
      setOutlineColor("#000000");
      setOutlineWidth(1.5);
    }
  };

  // Add a built-in icon to the active sequence
  const handleAddBuiltinIcon = (def: typeof BUILTIN_ICONS_DEF[0]) => {
    const newItem: SignatureIconItem = {
      id: `icon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: def.name,
      key: def.key,
      type: "builtin",
      size: globalIconSize,
      enabled: true,
      svgPath: def.svgPath,
    };
    setIconsList((prev) => [...prev, newItem]);
  };

  // Upload Custom Logo PNG / SVG
  const handleUploadCustomLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newItem: SignatureIconItem = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "").substring(0, 15) || "Logo",
          key: "custom",
          type: "custom",
          size: globalIconSize,
          enabled: true,
          customDataUrl: dataUrl,
        };
        setIconsList((prev) => [...prev, newItem]);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  // Toggle icon enabled
  const handleToggleIcon = (id: string) => {
    setIconsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Remove icon
  const handleRemoveIcon = (id: string) => {
    setIconsList((prev) => prev.filter((item) => item.id !== id));
  };

  // Update specific icon size (px)
  const handleUpdateIconSize = (id: string, size: number) => {
    const validSize = Math.max(6, Math.min(250, size));
    setIconsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, size: validSize } : item))
    );
  };

  // Update specific icon scale multiplier (e.g. 1.0, 1.5, 2.0 = 200%, 2.5, 3.0 = 300%, etc.)
  const handleUpdateIconScale = (id: string, scale: number) => {
    const validScale = Math.max(0.5, Math.min(5.0, scale));
    setIconsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, scaleMultiplier: validScale } : item))
    );
  };

  // Update all icon sizes when global base size changes
  const handleGlobalIconSizeChange = (newSize: number) => {
    const validSize = Math.max(6, Math.min(250, newSize));
    setGlobalIconSize(validSize);
    if (syncAllIconSizes) {
      setIconsList((prev) => prev.map((item) => ({ ...item, size: validSize })));
    }
  };

  // Apply a global zoom multiplier across all icons
  const handleApplyGlobalScale = (multiplier: number) => {
    const validMultiplier = Math.max(0.5, Math.min(5.0, multiplier));
    setGlobalIconScale(validMultiplier);
    setIconsList((prev) =>
      prev.map((item) => ({
        ...item,
        scaleMultiplier: validMultiplier,
      }))
    );
  };

  // Reorder icons: step left/right, move to start/end, swap, reverse, and drag-and-drop
  const handleMoveIcon = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= iconsList.length) return;
    const updated = [...iconsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setIconsList(updated);
  };

  const handleMoveIconToExtremity = (index: number, position: "start" | "end") => {
    if (index < 0 || index >= iconsList.length) return;
    const updated = [...iconsList];
    const [item] = updated.splice(index, 1);
    if (position === "start") {
      updated.unshift(item);
    } else {
      updated.push(item);
    }
    setIconsList(updated);
  };

  const handleReverseIconsOrder = () => {
    setIconsList((prev) => [...prev].reverse());
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    setIconsList((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedIndex(null);
  };

  // Margin Change helper (syncs X and Y when linked)
  const handleMarginChange = (axis: "x" | "y", val: number) => {
    const valid = Math.max(0, val);
    if (axis === "x") {
      setCustomMarginX(valid);
      if (customMarginLinked) {
        setCustomMarginY(valid);
      }
    } else {
      setCustomMarginY(valid);
      if (customMarginLinked) {
        setCustomMarginX(valid);
      }
    }
  };

  // Generate SVG Data URI for an icon
  const getIconSvgDataUrl = (
    icon: SignatureIconItem,
    style: IconStyleMode,
    currentTextColor: string
  ): string => {
    const builtinDef = BUILTIN_ICONS_DEF.find((b) => b.key === icon.key);
    const pathData = icon.svgPath || builtinDef?.svgPath || "";
    const brandColor = builtinDef?.brandColor || "#000000";

    let circleBg = "";
    let glyphFill = "#ffffff";

    if (style === "badge-dark") {
      circleBg = `<circle cx="12" cy="12" r="11.5" fill="#000000"/>`;
      glyphFill = "#ffffff";
    } else if (style === "badge-light") {
      circleBg = `<circle cx="12" cy="12" r="11.5" fill="#ffffff"/>`;
      glyphFill = "#000000";
    } else if (style === "badge-gold") {
      circleBg = `<circle cx="12" cy="12" r="11.5" fill="#eab308"/>`;
      glyphFill = "#000000";
    } else if (style === "official") {
      circleBg = `<circle cx="12" cy="12" r="11.5" fill="${brandColor}"/>`;
      glyphFill = "#ffffff";
    } else {
      // Monochrome: no circle background, glyph uses text color
      circleBg = "";
      glyphFill = currentTextColor;
    }

    const transform = circleBg ? `transform="translate(4.8, 4.8) scale(0.6)"` : "";

    // 1024x1024 HD Vector viewBox ensures 100% razor-sharp rendering even when scaled to 500%
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1024" height="1024" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
      ${circleBg}
      <g ${transform} fill="${glyphFill}">
        <path d="${pathData}"/>
      </g>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Main Canvas Rendering Engine
  useEffect(() => {
    if (!isOpen || !effectiveBaseImage) return;
    let isSubscribed = true;

    const renderWatermarkCanvas = async () => {
      setIsRendering(true);
      const img = new Image();
      img.src = effectiveBaseImage;
      await new Promise((resolve) => (img.onload = resolve));

      if (!isSubscribed) return;

      if (mode === "imageInText") {
        const dataUrl = renderImageInText(img, text || "SIGNATURE", fontFamily, bgColor);
        if (isSubscribed) {
          setPreviewUrl(dataUrl);
          setIsRendering(false);
        }
        return;
      }

      // Base Canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1920;
      canvas.height = img.naturalHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // High quality smoothing for pristine vector scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw photo base
      ctx.drawImage(img, 0, 0);

      // Preload all active icons
      const activeIcons = iconsList.filter((i) => i.enabled);
      const loadedIconImages: { img: HTMLImageElement; size: number }[] = [];

      for (const iconItem of activeIcons) {
        const iconImg = new Image();
        if (iconItem.type === "custom" && iconItem.customDataUrl) {
          iconImg.src = iconItem.customDataUrl;
        } else {
          iconImg.src = getIconSvgDataUrl(iconItem, iconStyle, textColor);
        }
        await new Promise((res) => {
          iconImg.onload = res;
          iconImg.onerror = res;
        });
        const effectiveSize = Math.round(iconItem.size * (iconItem.scaleMultiplier || 1.0));
        loadedIconImages.push({ img: iconImg, size: effectiveSize });
      }

      if (!isSubscribed) return;

      // Scale calculations for High-DPI Canvas
      const canvasScale = Math.max(1, canvas.width / 1200);
      const scaledFontSize = Math.max(12, Math.round(fontSizePx * canvasScale));
      const fontStyleStr = `${fontWeight === "bold" ? "700" : fontWeight === "800" ? "800" : fontWeight === "600" ? "600" : "400"} ${scaledFontSize}px ${fontFamily}`;

      ctx.font = fontStyleStr;
      const textTrimmed = text.trim();
      const textMetrics = textTrimmed ? ctx.measureText(textTrimmed) : { width: 0 };
      const textWidth = textMetrics.width;
      const textHeight = scaledFontSize;

      // Calculate total bounding box dimensions in straight line
      const scaledIconSpacing = Math.round(iconSpacing * canvasScale);
      const scaledIconTextSpacing = Math.round(iconTextSpacing * canvasScale);

      let totalIconsWidth = 0;
      let maxIconHeight = 0;

      const computedIconSizes = loadedIconImages.map((item) => {
        const scaledSize = Math.round(item.size * canvasScale);
        totalIconsWidth += scaledSize;
        if (scaledSize > maxIconHeight) maxIconHeight = scaledSize;
        return { ...item, scaledSize };
      });

      if (computedIconSizes.length > 1) {
        totalIconsWidth += (computedIconSizes.length - 1) * scaledIconSpacing;
      }

      let totalContentWidth = 0;
      let totalContentHeight = 0;

      const isVerticalStack = orientation === "vertical-stack";

      if (isVerticalStack) {
        // Vertical stacked layout (icons on rows, text below)
        totalContentWidth = Math.max(totalIconsWidth, textWidth);
        totalContentHeight = maxIconHeight + (textTrimmed ? scaledIconTextSpacing + textHeight : 0);
      } else {
        // Straight line layout (Icons + Text side-by-side)
        const hasBoth = computedIconSizes.length > 0 && textTrimmed.length > 0;
        totalContentWidth =
          totalIconsWidth + (textTrimmed ? textWidth : 0) + (hasBoth ? scaledIconTextSpacing : 0);
        totalContentHeight = Math.max(maxIconHeight, textHeight);
      }

      // Pad for badge box if enabled
      const pad = hasBadgeBox ? Math.round(badgeBoxPadding * canvasScale) : 0;
      const unrotatedBoxW = totalContentWidth + pad * 2;
      const unrotatedBoxH = totalContentHeight + pad * 2;

      // Rotation determination: orientation + fine rotation
      let totalRotationDeg = fineRotation;
      if (orientation === "vertical-ccw") {
        totalRotationDeg -= 90; // -90 deg along left edge
      } else if (orientation === "vertical-cw") {
        totalRotationDeg += 90; // +90 deg along right edge
      }

      const rad = (totalRotationDeg * Math.PI) / 180;
      const cosVal = Math.abs(Math.cos(rad));
      const sinVal = Math.abs(Math.sin(rad));

      // Exact mathematical bounding box dimensions of the rotated signature on canvas
      const rotatedBoxWidth = unrotatedBoxW * cosVal + unrotatedBoxH * sinVal;
      const rotatedBoxHeight = unrotatedBoxW * sinVal + unrotatedBoxH * cosVal;

      // Calculate 9-Anchor Position Coordinates with exact pixel / percentage margins
      const marginPxX =
        customMarginUnit === "px"
          ? Math.round(customMarginX * canvasScale)
          : Math.round((customMarginX / 100) * canvas.width);
      const marginPxY =
        customMarginUnit === "px"
          ? Math.round(customMarginY * canvasScale)
          : Math.round((customMarginY / 100) * canvas.height);

      let centerTargetX = canvas.width / 2;
      let centerTargetY = canvas.height / 2;

      // Calculate exact center target X position based on anchor position
      if (anchorPosition === "top-left" || anchorPosition === "middle-left" || anchorPosition === "bottom-left") {
        centerTargetX = marginPxX + rotatedBoxWidth / 2;
      } else if (anchorPosition === "top-right" || anchorPosition === "middle-right" || anchorPosition === "bottom-right") {
        centerTargetX = canvas.width - marginPxX - rotatedBoxWidth / 2;
      } else {
        // center / top-center / bottom-center
        centerTargetX = canvas.width / 2;
      }

      // Calculate exact center target Y position based on anchor position
      if (anchorPosition === "top-left" || anchorPosition === "top-center" || anchorPosition === "top-right") {
        centerTargetY = marginPxY + rotatedBoxHeight / 2;
      } else if (anchorPosition === "bottom-left" || anchorPosition === "bottom-center" || anchorPosition === "bottom-right") {
        centerTargetY = canvas.height - marginPxY - rotatedBoxHeight / 2;
      } else {
        // middle-left / center / middle-right
        centerTargetY = canvas.height / 2;
      }

      // Context drawing transformations
      ctx.save();

      // Opacity
      ctx.globalAlpha = opacity / 100;

      ctx.translate(centerTargetX, centerTargetY);
      if (totalRotationDeg !== 0) {
        ctx.rotate(rad);
      }
      ctx.translate(-totalContentWidth / 2, -totalContentHeight / 2);

      // Draw Badge Box Background if enabled (White container / Banner)
      if (hasBadgeBox) {
        ctx.save();
        ctx.fillStyle = badgeBoxColor;
        ctx.beginPath();
        ctx.roundRect(
          -pad,
          -pad,
          totalContentWidth + pad * 2,
          totalContentHeight + pad * 2,
          Math.min(6, Math.round(totalContentHeight * 0.15))
        );
        ctx.fill();
        ctx.restore();
      }

      // Draw Shadow if enabled
      if (hasShadow) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = Math.round(4 * canvasScale);
        ctx.shadowOffsetX = Math.round(2 * canvasScale);
        ctx.shadowOffsetY = Math.round(2 * canvasScale);
      }

      let currentX = 0;
      const baselineY = totalContentHeight / 2;

      // Function to draw icons sequence
      const drawIconsSequence = () => {
        for (const iconObj of computedIconSizes) {
          const iconY = baselineY - iconObj.scaledSize / 2;
          ctx.drawImage(iconObj.img, currentX, iconY, iconObj.scaledSize, iconObj.scaledSize);
          currentX += iconObj.scaledSize + scaledIconSpacing;
        }
        if (computedIconSizes.length > 0) {
          currentX -= scaledIconSpacing; // revert last gap
        }
      };

      // Function to draw text
      const drawTextItem = () => {
        if (!textTrimmed) return;
        ctx.font = fontStyleStr;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        // Draw outline if enabled
        if (hasOutline && outlineWidth > 0) {
          ctx.save();
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = Math.max(1, outlineWidth * canvasScale);
          ctx.lineJoin = "round";
          ctx.strokeText(textTrimmed, currentX, baselineY);
          ctx.restore();
        }

        // Draw fill text
        ctx.fillStyle = textColor;
        ctx.fillText(textTrimmed, currentX, baselineY);
        currentX += textWidth;
      };

      // Sequential drawing on the straight line
      if (isVerticalStack) {
        // Draw icons centered on top
        if (computedIconSizes.length > 0) {
          currentX = (totalContentWidth - totalIconsWidth) / 2;
          drawIconsSequence();
        }
        // Draw text below
        if (textTrimmed) {
          currentX = (totalContentWidth - textWidth) / 2;
          ctx.font = fontStyleStr;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const textTopY = maxIconHeight + scaledIconTextSpacing;
          if (hasOutline && outlineWidth > 0) {
            ctx.save();
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = Math.max(1, outlineWidth * canvasScale);
            ctx.lineJoin = "round";
            ctx.strokeText(textTrimmed, currentX, textTopY);
            ctx.restore();
          }
          ctx.fillStyle = textColor;
          ctx.fillText(textTrimmed, currentX, textTopY);
        }
      } else {
        // Straight line side-by-side
        if (iconPositionOrder === "icons-first") {
          if (computedIconSizes.length > 0) {
            drawIconsSequence();
            if (textTrimmed) currentX += scaledIconTextSpacing;
          }
          if (textTrimmed) {
            drawTextItem();
          }
        } else {
          // Text first, then icons
          if (textTrimmed) {
            drawTextItem();
            if (computedIconSizes.length > 0) currentX += scaledIconTextSpacing;
          }
          if (computedIconSizes.length > 0) {
            drawIconsSequence();
          }
        }
      }

      ctx.restore();

      if (isSubscribed) {
        setPreviewUrl(canvas.toDataURL("image/jpeg", 0.95));
        setIsRendering(false);
      }
    };

    renderWatermarkCanvas();

    return () => {
      isSubscribed = false;
    };
  }, [
    mode,
    iconsList,
    globalIconSize,
    globalIconScale,
    iconStyle,
    iconSpacing,
    iconTextSpacing,
    iconPositionOrder,
    text,
    fontFamily,
    fontSizePx,
    fontWeight,
    textColor,
    opacity,
    orientation,
    anchorPosition,
    customMarginUnit,
    customMarginX,
    customMarginY,
    fineRotation,
    hasOutline,
    outlineColor,
    outlineWidth,
    hasShadow,
    shadowColor,
    hasBadgeBox,
    badgeBoxColor,
    badgeBoxPadding,
    bgColor,
    effectiveBaseImage,
    isOpen,
  ]);

  const handleApply = () => {
    if (previewUrl) {
      const activeCount = iconsList.filter((i) => i.enabled).length;
      onApplyNewImage(
        previewUrl,
        mode === "signature"
          ? `Signature & Logos (${activeCount} icônes + "${text}")`
          : mode === "imageInText"
          ? `Effet Image dans Texte "${text}"`
          : `Titre & Typographie "${text}"`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] space-y-3 transition-colors ${
          isLight
            ? "bg-white border border-slate-200 text-slate-900"
            : "bg-slate-900 border border-slate-800 text-slate-100"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 pt-4 pb-3 border-b shrink-0 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Studio Signature, Filigrane & Logos Live</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Multi-Logos & 9 Positions
                </span>
                {(hasAppliedSignature || baseImageBeforeSignature) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                    ✏️ Modification Active (Image Propre)
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Alignement horizontal/vertical des logos sociaux (FB, YouTube, Instagram, X, TikTok...) et textes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Mode & Presets Bar */}
        <div className="px-5 shrink-0 flex flex-wrap items-center justify-between gap-2">
          {/* Main 3 Modes */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setMode("signature")}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                mode === "signature"
                  ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>1. Signature Logos & Texte</span>
            </button>

            <button
              onClick={() => setMode("textOnImage")}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                mode === "textOnImage"
                  ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>2. Titre & Typographie Artistique</span>
            </button>

            <button
              onClick={() => setMode("imageInText")}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                mode === "imageInText"
                  ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>3. Image-dans-Texte</span>
            </button>
          </div>

          {/* Quick 1-Click Templates */}
          {mode === "signature" && (
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
              <span className={`text-[11px] font-semibold mr-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Modèles au Clic :
              </span>
              <button
                onClick={() => handleApplyPresetTemplate("amouretvie")}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 transition cursor-pointer"
                title="Modèle Amouretvie Abms"
              >
                ★ Amouretvie
              </button>
              <button
                onClick={() => handleApplyPresetTemplate("camera-pro")}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 transition cursor-pointer"
              >
                Photo-Calligraphie
              </button>
              <button
                onClick={() => handleApplyPresetTemplate("contact-all")}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition cursor-pointer"
              >
                Contact Pro 
              </button>
            </div>
          )}
        </div>

        {/* Workspace Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 flex-1 min-h-0 overflow-hidden pb-1">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 overflow-y-auto pr-1 text-xs no-scrollbar">
            {/* 0. Saved Signatures Presets Manager (User Requested) */}
            {mode === "signature" && (
              <div
                className={`p-3 rounded-xl border space-y-2.5 transition-all ${
                  isLight
                    ? "bg-amber-50/50 border-amber-200/80 shadow-xs"
                    : "bg-amber-950/20 border-amber-800/40 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs">
                      Mes Signatures Enregistrées ({savedSignatures.length}) :
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Add / New Blank button */}
                    <button
                      onClick={handleStartNewBlankSignature}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center space-x-1 cursor-pointer ${
                        isLight
                          ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                      title="Créer une nouvelle signature à partir de zéro"
                    >
                      <PlusCircle className="w-3 h-3 text-indigo-400" />
                      <span>+ Nouvelle</span>
                    </button>

                    {/* Save Current Button */}
                    <button
                      onClick={() => {
                        setSavePresetName(text ? `Signature ${text}` : "Ma Signature");
                        setIsSaveDialogOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1 cursor-pointer shadow-xs transition"
                      title="Enregistrer cette configuration pour la réutiliser sur toutes vos prochaines photos"
                    >
                      <Save className="w-3 h-3" />
                      <span>💾 Enregistrer</span>
                    </button>

                    {/* Update Current Preset Button if one is loaded */}
                    {activeSavedPresetId && (
                      <button
                        onClick={handleUpdateActivePreset}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center space-x-1 cursor-pointer shadow-xs transition"
                        title="Mettre à jour la signature enregistrée avec vos modifications actuelles"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Mettre à jour</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Presets List */}
                {savedSignatures.length === 0 ? (
                  <div
                    className={`p-2.5 rounded-lg border text-center text-[11px] ${
                      isLight
                        ? "bg-white/80 border-amber-200 text-slate-600"
                        : "bg-slate-900/80 border-amber-800/40 text-slate-400"
                    }`}
                  >
                    <p>
                      💡 <b>Astuce :</b> Vous n'avez pas encore de signature enregistrée. Cliquez sur <b>« 💾 Enregistrer »</b> pour sauvegarder vos réglages et les appliquer en 1 clic sur toutes vos futures images !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5 no-scrollbar">
                    {savedSignatures.map((preset) => {
                      const isActive = activeSavedPresetId === preset.id;
                      const activeIconsCount = preset.iconsList?.filter((i) => i.enabled).length || 0;

                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleApplySavedPreset(preset)}
                          className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                            isActive
                              ? isLight
                                ? "bg-amber-100/90 border-amber-400 shadow-xs ring-1 ring-amber-400"
                                : "bg-amber-950/50 border-amber-500 shadow-xs ring-1 ring-amber-500"
                              : isLight
                              ? "bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-300"
                              : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center space-x-1 overflow-hidden">
                              {preset.isDefault && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              <span
                                className={`font-bold text-[11px] truncate ${
                                  isActive
                                    ? "text-amber-700 dark:text-amber-300"
                                    : isLight
                                    ? "text-slate-800"
                                    : "text-slate-200"
                                }`}
                                title={preset.name}
                              >
                                {preset.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {/* Star Default Button */}
                              <button
                                onClick={(e) => handleToggleDefaultPreset(preset.id, e)}
                                className={`p-1 rounded-md transition cursor-pointer ${
                                  preset.isDefault
                                    ? "text-amber-500 hover:bg-amber-500/20"
                                    : "text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                                }`}
                                title={
                                  preset.isDefault
                                    ? "Signature par défaut sur les nouvelles images"
                                    : "Définir comme signature par défaut"
                                }
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    preset.isDefault ? "fill-amber-500" : ""
                                  }`}
                                />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => handleDeleteSavedPreset(preset.id, e)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Supprimer cette signature enregistrée"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            <span className="truncate max-w-[120px]">
                              {activeIconsCount} logo(s) • {preset.anchorPosition || "bas-droite"}
                            </span>

                            <span
                              className={`font-semibold text-[9px] px-1.5 py-0.2 rounded-md ${
                                isActive
                                  ? "bg-amber-500 text-slate-950"
                                  : isLight
                                  ? "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700"
                                  : "bg-slate-800 text-slate-300 group-hover:bg-amber-950 group-hover:text-amber-300"
                              }`}
                            >
                              {isActive ? "Active ✓" : "Charger"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 1. Logos & Icônes Sociaux Section */}
            {mode === "signature" && (
              <div
                className={`p-3 rounded-xl border space-y-3 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Logos & Icônes ({iconsList.filter((i) => i.enabled).length}/{iconsList.length}) :</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Reverse Order button */}
                    <button
                      onClick={handleReverseIconsOrder}
                      className={`px-2 py-1 rounded-md border text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer ${
                        isLight
                          ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700"
                      }`}
                      title="Inverser l'ordre de la séquence (gauche ⇄ droite)"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
                      <span>Inverser</span>
                    </button>

                    {/* Upload Custom Logo */}
                    <label className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center space-x-1 cursor-pointer transition shadow-xs">
                      <Upload className="w-3 h-3" />
                      <span>+ Importer Logo</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleUploadCustomLogo}
                      />
                    </label>
                  </div>
                </div>

                {/* Instructions & Visual Flow */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Ordre d'alignement (glissez ou utilisez les flèches ◀ ▶) :</span>
                    <span className="text-indigo-400 font-semibold">{iconsList.length} éléments</span>
                  </div>

                  {/* Active Icons Sequence Cards (Reorderable via Drag & Drop / Move buttons / Extremity buttons) */}
                  <div className="flex flex-col space-y-1.5 max-h-52 overflow-y-auto pr-0.5 no-scrollbar">
                    {iconsList.map((icon, idx) => {
                      const scale = icon.scaleMultiplier || 1.0;
                      const isZoomed = scale > 1.0;
                      return (
                        <div
                          key={icon.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs transition select-none ${
                            draggedIndex === idx ? "opacity-50 ring-2 ring-indigo-500" : ""
                          } ${
                            icon.enabled
                              ? isLight
                                ? isZoomed
                                  ? "bg-indigo-50/70 border-indigo-300 text-slate-900 shadow-xs"
                                  : "bg-white border-slate-300 text-slate-900 shadow-xs hover:border-indigo-400"
                                : isZoomed
                                ? "bg-indigo-950/40 border-indigo-600/60 text-slate-100"
                                : "bg-slate-900 border-slate-750 text-slate-100 hover:border-slate-600"
                              : "opacity-45 bg-slate-950 border-slate-800 line-through text-slate-500"
                          }`}
                        >
                          {/* Drag Handle & Order Badge & Title */}
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span
                              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5 shrink-0"
                              title="Maintenir et glisser pour déplacer cet élément"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>

                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 font-mono ${
                                icon.enabled
                                  ? isZoomed
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {idx + 1}
                            </span>

                            <button
                              onClick={() => handleToggleIcon(icon.id)}
                              className="cursor-pointer font-semibold flex items-center space-x-1.5 truncate text-left"
                              title={icon.enabled ? "Désactiver cet icône" : "Activer cet icône"}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  icon.enabled ? "bg-emerald-500" : "bg-slate-600"
                                }`}
                              />
                              <span className="truncate max-w-[95px] sm:max-w-[120px] font-medium text-[11px]">
                                {icon.name}
                              </span>
                            </button>

                            {/* Scale Indicator Badge if enlarged */}
                            {isZoomed && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                {Math.round(scale * 100)}%
                              </span>
                            )}
                          </div>

                          {/* Controls: Size px + Scale Multiplier + Step Buttons + Extremity Buttons + Delete */}
                          <div className="flex items-center space-x-1 shrink-0">
                            {/* Individual Scale Multiplier Selector */}
                            <select
                              value={scale}
                              onChange={(e) => handleUpdateIconScale(icon.id, parseFloat(e.target.value))}
                              className="bg-slate-950/80 rounded px-1 py-0.5 border border-slate-800 text-[10px] font-bold text-indigo-400 focus:outline-none cursor-pointer"
                              title="Agrandir ce logo spécifique (ex: 200%, 300%... sans perte de qualité)"
                            >
                              <option value="1">100%</option>
                              <option value="1.25">125%</option>
                              <option value="1.5">150%</option>
                              <option value="1.75">175%</option>
                              <option value="2">200% (2x)</option>
                              <option value="2.5">250% (2.5x)</option>
                              <option value="3">300% (3x)</option>
                              <option value="4">400% (4x)</option>
                              <option value="5">500% (5x)</option>
                            </select>

                            {/* Individual Size Input */}
                            <div className="flex items-center bg-slate-950/60 rounded px-1 border border-slate-800">
                              <input
                                type="number"
                                min="6"
                                max="250"
                                value={icon.size}
                                onChange={(e) => handleUpdateIconSize(icon.id, Number(e.target.value))}
                                className="w-7 text-[10px] text-center font-mono bg-transparent border-0 font-bold focus:outline-none text-indigo-400"
                                title={`Taille de base: ${icon.size}px (Rendu final: ${Math.round(icon.size * scale)}px)`}
                              />
                              <span className="text-[9px] text-slate-500">px</span>
                            </div>

                            {/* Reordering Button Group */}
                            <div className="flex items-center bg-slate-950/80 rounded border border-slate-800 p-0.5 space-x-0.5">
                              <button
                                onClick={() => handleMoveIconToExtremity(idx, "start")}
                                disabled={idx === 0}
                                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer text-slate-400"
                                title="Placer tout au début de la séquence"
                              >
                                <ChevronsLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveIcon(idx, "left")}
                                disabled={idx === 0}
                                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer text-slate-400"
                                title="Reculer d'un cran vers la gauche"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveIcon(idx, "right")}
                                disabled={idx === iconsList.length - 1}
                                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer text-slate-400"
                                title="Avancer d'un cran vers la droite"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveIconToExtremity(idx, "end")}
                                disabled={idx === iconsList.length - 1}
                                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer text-slate-400"
                                title="Placer à la toute fin de la séquence"
                              >
                                <ChevronsRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemoveIcon(icon.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer transition"
                              title="Supprimer cet icône"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Builtin Quick Icons Bar */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Ajouter d'autres logos / icônes prédéfinis :</span>
                  </div>
                  <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                    {BUILTIN_ICONS_DEF.map((b) => (
                      <button
                        key={b.key}
                        onClick={() => handleAddBuiltinIcon(b)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 transition cursor-pointer ${
                          isLight
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                        }`}
                      >
                        + {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Global Zoom & Scale Bar (>200% vector scale support) */}
                <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">
                      Échelle & Agrandissement Global (Zoom sans perte) :
                    </span>
                    <span className="font-bold text-indigo-400">
                      {Math.round(globalIconScale * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { label: "100%", val: 1.0 },
                      { label: "150%", val: 1.5 },
                      { label: "200%", val: 2.0 },
                      { label: "250%", val: 2.5 },
                      { label: "300%", val: 3.0 },
                      { label: "400%", val: 4.0 },
                      { label: "500%", val: 5.0 },
                    ].map((preset) => {
                      const isActive = Math.abs(globalIconScale - preset.val) < 0.05;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => handleApplyGlobalScale(preset.val)}
                          className={`py-1 rounded text-[10px] font-bold border transition cursor-pointer text-center ${
                            isActive
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-xs"
                              : isLight
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                          }`}
                          title={`Agrandir tous les logos à ${preset.label} de leur taille sans perte de qualité`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizing Controls: Global Icon Size (ex: 17px) & Spacing */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-400">Taille de base icônes :</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="6"
                          max="250"
                          value={globalIconSize}
                          onChange={(e) => handleGlobalIconSizeChange(Number(e.target.value))}
                          className="w-11 text-right px-1 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold text-[11px]"
                        />
                        <span className="font-bold text-indigo-400 text-[11px]">px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={globalIconSize}
                      onChange={(e) => handleGlobalIconSizeChange(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-400">Espacement entre logos :</span>
                      <span className="font-bold text-indigo-400">{iconSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="32"
                      value={iconSpacing}
                      onChange={(e) => setIconSpacing(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Vector Quality Note */}
                <div className="text-[10px] text-indigo-400 font-medium flex items-center space-x-1.5 bg-indigo-950/30 border border-indigo-800/40 rounded-lg px-2 py-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                  <span>
                    Rendu vectoriel pur Ultra-HD : logos et icônes nets à 200%, 300% ou 500%.
                  </span>
                </div>

                {/* Icon Style Mode */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Style d'affichage des badges/icônes :
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setIconStyle("badge-dark")}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                        iconStyle === "badge-dark"
                          ? "bg-slate-950 text-white border-indigo-500 ring-1 ring-indigo-500"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      ● Badge Disque Noir
                    </button>
                    <button
                      onClick={() => setIconStyle("badge-light")}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                        iconStyle === "badge-light"
                          ? "bg-white text-slate-900 border-indigo-500 ring-1 ring-indigo-500"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      ○ Badge Disque Blanc
                    </button>
                    <button
                      onClick={() => setIconStyle("monochrome")}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                        iconStyle === "monochrome"
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      ✦ Monochrome Épuré
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Text Input & Typography Controls */}
            <div
              className={`p-3 rounded-xl border space-y-2.5 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
              }`}
            >
              <div className="space-y-1">
                <label className="font-bold flex items-center justify-between text-xs">
                  <span>Texte de la Signature / Nom :</span>
                  <span className="text-[10px] text-indigo-400 font-semibold">{text.length} car.</span>
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex: Amouretvie Abms, Léonard Kabo..."
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-xs focus:outline-none focus:border-indigo-500 ${
                    isLight
                      ? "bg-white border-slate-300 text-slate-900"
                      : "bg-slate-900 border-slate-700 text-slate-100"
                  }`}
                />
              </div>

              {/* Font Family & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Police Calligraphique :</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-medium focus:outline-none ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900"
                        : "bg-slate-900 border-slate-700 text-slate-100"
                    }`}
                  >
                    {fontPresets.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Épaisseur du texte :</label>
                  <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value as any)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-[11px] font-medium focus:outline-none ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900"
                        : "bg-slate-900 border-slate-700 text-slate-100"
                    }`}
                  >
                    <option value="normal">Normal</option>
                    <option value="600">Demi-Gras (Semi-Bold)</option>
                    <option value="bold">Gras (Bold - Style Référence)</option>
                    <option value="800">Extra Gras (Ultra Bold)</option>
                  </select>
                </div>
              </div>

              {/* Font Size & Spacing to Icons */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-400">Taille de la police :</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={fontSizePx}
                        onChange={(e) => setFontSizePx(Number(e.target.value))}
                        className="w-10 text-right px-1 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold text-[11px]"
                      />
                      <span className="font-bold text-indigo-400 text-[11px]">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={fontSizePx}
                    onChange={(e) => setFontSizePx(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-400">Écart logos / texte :</span>
                    <span className="font-bold text-indigo-400">{iconTextSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={iconTextSpacing}
                    onChange={(e) => setIconTextSpacing(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Text Color Picker & Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-400 flex items-center space-x-1 text-[11px]">
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span>Couleur du texte :</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-400">{textColor}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {colorPresets.map((cp) => (
                    <button
                      key={cp.color}
                      onClick={() => setTextColor(cp.color)}
                      className={`w-5 h-5 rounded-full border border-slate-700 transition cursor-pointer shrink-0 flex items-center justify-center ${
                        textColor === cp.color ? "ring-2 ring-indigo-500 scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: cp.color }}
                      title={cp.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Orientation & 9 Anchor Positions Section */}
            <div
              className={`p-3 rounded-xl border space-y-2.5 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5 text-xs">
                  <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Alignement & 9 Positions sur la photo :</span>
                </span>
              </div>

              {/* Orientation Switcher (Horizontal vs Vertical CCW/CW vs Vertical Stack) */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setOrientation("horizontal")}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                    orientation === "horizontal"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <MoveHorizontal className="w-3 h-3" />
                  <span>↔ Horizontale</span>
                </button>

                <button
                  onClick={() => setOrientation("vertical-ccw")}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                    orientation === "vertical-ccw"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                  title="Orientation verticale le long du bord gauche (-90°)"
                >
                  <MoveVertical className="w-3 h-3" />
                  <span>↕ Verticale (-90°)</span>
                </button>

                <button
                  onClick={() => setOrientation("vertical-cw")}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                    orientation === "vertical-cw"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                  title="Orientation verticale le long du bord droit (+90°)"
                >
                  <MoveVertical className="w-3 h-3" />
                  <span>↕ Verticale (+90°)</span>
                </button>
              </div>

              {/* One-Click Direct Border Snapping Shortcuts */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">Positions rapides aux 4 bords de l'image :</span>
                  <span className="text-[10px] text-indigo-400 font-bold">0px / Collé</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <button
                    onClick={() => {
                      setAnchorPosition("top-center");
                      setOrientation("horizontal");
                      setCustomMarginUnit("px");
                      setCustomMarginX(0);
                      setCustomMarginY(0);
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                      anchorPosition === "top-center" && orientation === "horizontal" && customMarginY === 0
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <span>🔝 Bord Haut</span>
                    <span className="text-[9px] opacity-70">Horiz. (0px)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAnchorPosition("bottom-center");
                      setOrientation("horizontal");
                      setCustomMarginUnit("px");
                      setCustomMarginX(0);
                      setCustomMarginY(0);
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                      anchorPosition === "bottom-center" && orientation === "horizontal" && customMarginY === 0
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <span>🔻 Bord Bas</span>
                    <span className="text-[9px] opacity-70">Horiz. (0px)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAnchorPosition("middle-left");
                      setOrientation("vertical-ccw");
                      setCustomMarginUnit("px");
                      setCustomMarginX(0);
                      setCustomMarginY(0);
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                      anchorPosition === "middle-left" && orientation === "vertical-ccw" && customMarginX === 0
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <span>⬅️ Bord Gauche</span>
                    <span className="text-[9px] opacity-70">Vert. -90° (0px)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAnchorPosition("middle-right");
                      setOrientation("vertical-cw");
                      setCustomMarginUnit("px");
                      setCustomMarginX(0);
                      setCustomMarginY(0);
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                      anchorPosition === "middle-right" && orientation === "vertical-cw" && customMarginX === 0
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                    }`}
                  >
                    <span>➡️ Bord Droit</span>
                    <span className="text-[9px] opacity-70">Vert. +90° (0px)</span>
                  </button>
                </div>
              </div>

              {/* 9 Positions Grid 3x3 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Emplacement d'ancrage libre (9 zones) :
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  {/* Top Row */}
                  <button
                    onClick={() => setAnchorPosition("top-left")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "top-left"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↖ Haut-Gauche
                  </button>
                  <button
                    onClick={() => setAnchorPosition("top-center")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "top-center"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↑ Haut-Milieu
                  </button>
                  <button
                    onClick={() => setAnchorPosition("top-right")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "top-right"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↗ Haut-Droite
                  </button>

                  {/* Middle Row */}
                  <button
                    onClick={() => setAnchorPosition("middle-left")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "middle-left"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ← Centré Gauche
                  </button>
                  <button
                    onClick={() => setAnchorPosition("center")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "center"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ⦿ Plein Centre
                  </button>
                  <button
                    onClick={() => setAnchorPosition("middle-right")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "middle-right"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    → Centré Droite
                  </button>

                  {/* Bottom Row */}
                  <button
                    onClick={() => setAnchorPosition("bottom-left")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "bottom-left"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↙ Bas-Gauche
                  </button>
                  <button
                    onClick={() => setAnchorPosition("bottom-center")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "bottom-center"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↓ Bas-Milieu
                  </button>
                  <button
                    onClick={() => setAnchorPosition("bottom-right")}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      anchorPosition === "bottom-right"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    ↘ Bas-Droite
                  </button>
                </div>
              </div>

              {/* Margins & Distance to Edge Section (Exact Px or %) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                    <span>Distance du bord de l'image :</span>
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Unit Switcher: Pixels vs % */}
                    <div className="flex rounded-md border border-slate-700 bg-slate-900 p-0.5 text-[10px]">
                      <button
                        onClick={() => {
                          setCustomMarginUnit("px");
                          if (customMarginX < 1) setCustomMarginX(0);
                          else if (customMarginX <= 10) setCustomMarginX(20);
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          customMarginUnit === "px"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Pixels (px)
                      </button>
                      <button
                        onClick={() => {
                          setCustomMarginUnit("%");
                          if (customMarginX > 30) setCustomMarginX(4);
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          customMarginUnit === "%"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Pourcent (%)
                      </button>
                    </div>

                    {/* Link / Unlink Margins */}
                    <button
                      onClick={() => setCustomMarginLinked(!customMarginLinked)}
                      className={`p-1 rounded border text-[10px] transition cursor-pointer ${
                        customMarginLinked
                          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}
                      title={
                        customMarginLinked
                          ? "Marges X & Y synchronisées (cliquer pour dissocier)"
                          : "Marges X & Y indépendantes (cliquer pour lier)"
                      }
                    >
                      {customMarginLinked ? (
                        <Link className="w-3 h-3 text-indigo-400" />
                      ) : (
                        <Unlink className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Distance to Edge */}
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { label: "0px (Collé)", pxVal: 0, pctVal: 0 },
                    { label: "2px (Filet)", pxVal: 2, pctVal: 0.5 },
                    { label: "10px (Serré)", pxVal: 10, pctVal: 2 },
                    { label: "20px (Standard)", pxVal: 20, pctVal: 4 },
                    { label: "50px (Aéré)", pxVal: 50, pctVal: 8 },
                    { label: "100px (Large)", pxVal: 100, pctVal: 15 },
                  ].map((p) => {
                    const targetVal = customMarginUnit === "px" ? p.pxVal : p.pctVal;
                    const isActive = customMarginX === targetVal && (!customMarginLinked || customMarginY === targetVal);
                    return (
                      <button
                        key={p.label}
                        onClick={() => {
                          setCustomMarginX(targetVal);
                          if (customMarginLinked) setCustomMarginY(targetVal);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 transition cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                            : isLight
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Margin Sliders & Direct Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Margin X (Horizontal) */}
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Marge Horizontale (X) :</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max={customMarginUnit === "px" ? 500 : 50}
                          value={customMarginX}
                          onChange={(e) => handleMarginChange("x", Number(e.target.value))}
                          className="w-11 text-right px-1 rounded bg-slate-950 border border-slate-700 text-indigo-400 font-bold font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                        />
                        <span className="font-bold text-indigo-400 text-[10px]">
                          {customMarginUnit}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={customMarginUnit === "px" ? 250 : 35}
                      step={customMarginUnit === "px" ? 1 : 0.5}
                      value={customMarginX}
                      onChange={(e) => handleMarginChange("x", Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>0{customMarginUnit} (bord)</span>
                      <span>{customMarginUnit === "px" ? "250px" : "35%"}</span>
                    </div>
                  </div>

                  {/* Margin Y (Vertical) */}
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Marge Verticale (Y) :</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max={customMarginUnit === "px" ? 500 : 50}
                          value={customMarginY}
                          onChange={(e) => handleMarginChange("y", Number(e.target.value))}
                          className="w-11 text-right px-1 rounded bg-slate-950 border border-slate-700 text-indigo-400 font-bold font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                        />
                        <span className="font-bold text-indigo-400 text-[10px]">
                          {customMarginUnit}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={customMarginUnit === "px" ? 250 : 35}
                      step={customMarginUnit === "px" ? 1 : 0.5}
                      value={customMarginY}
                      onChange={(e) => handleMarginChange("y", Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>0{customMarginUnit} (bord)</span>
                      <span>{customMarginUnit === "px" ? "250px" : "35%"}</span>
                    </div>
                  </div>
                </div>

                {customMarginX === 0 && customMarginY === 0 && (
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1 bg-emerald-950/40 border border-emerald-800/40 rounded px-2 py-0.5">
                    <span>✓ Signature collée directement contre le bord de l'image (0px).</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Opacity & Finishing Options */}
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
              }`}
            >
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-400">Opacité de la signature / filigrane :</span>
                <span className="font-bold text-indigo-400">{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOutline}
                    onChange={(e) => setHasOutline(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                  />
                  <span className="text-slate-300 text-[11px]">Contour Texte</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBadgeBox}
                    onChange={(e) => setHasBadgeBox(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                  />
                  <span className="text-slate-300 text-[11px] font-semibold">Bandeau / Fond Rectangulaire</span>
                </label>
              </div>

              {/* Extended Badge Box Customizer */}
              {hasBadgeBox && (
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 mt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Couleur du fond :</span>
                    <div className="flex items-center space-x-1">
                      {[
                        { name: "Blanc Pur", col: "#ffffff" },
                        { name: "Blanc 90%", col: "rgba(255,255,255,0.9)" },
                        { name: "Noir 90%", col: "rgba(0,0,0,0.85)" },
                        { name: "Or Métal", col: "rgba(234,179,8,0.9)" },
                      ].map((bgPreset) => (
                        <button
                          key={bgPreset.name}
                          onClick={() => setBadgeBoxColor(bgPreset.col)}
                          className={`w-4 h-4 rounded border transition cursor-pointer ${
                            badgeBoxColor === bgPreset.col ? "ring-2 ring-indigo-500 scale-110" : ""
                          }`}
                          style={{ backgroundColor: bgPreset.col }}
                          title={bgPreset.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Marge interne (Padding) :</span>
                    <span className="text-indigo-400 font-bold">{badgeBoxPadding}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="18"
                    value={badgeBoxPadding}
                    onChange={(e) => setBadgeBoxPadding(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Real-time High-Resolution Canvas Live Preview (7 cols) */}
          <div
            className={`lg:col-span-7 border rounded-2xl overflow-hidden flex flex-col justify-between p-3 relative min-h-[380px] ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
            }`}
          >
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2 mb-2 shrink-0">
              <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-violet-400" />
                <span>Aperçu Réactif en Direct</span>
              </span>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Rendu Vectoriel Ultra-Net</span>
                </span>
              </div>
            </div>

            {/* Canvas / Image Output */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu Signature Live"
                  className="max-h-[420px] max-w-full w-auto object-contain rounded-xl shadow-2xl border border-slate-800/50"
                />
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center space-y-2">
                  <Sparkles className="w-6 h-6 text-slate-600 animate-spin" />
                  <span>Génération de la signature en cours...</span>
                </div>
              )}
            </div>

            {/* Quick Helper Tip */}
            <div
              className={`text-[10px] mt-2 p-2 rounded-xl border flex items-center justify-between ${
                isLight
                  ? "bg-white border-slate-200 text-slate-600"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              <span>
                💡 Position active :{" "}
                <b className="text-indigo-400 capitalize">
                  {anchorPosition} ({orientation})
                </b>{" "}
                • {iconsList.filter((i) => i.enabled).length} logo(s) • Taille : {globalIconSize}px
              </span>
              <span className="font-bold text-emerald-500">Prêt pour Export HD</span>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-t shrink-0 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              Annuler
            </button>

            {onRemoveSignature && (hasAppliedSignature || baseImageBeforeSignature) && (
              <button
                onClick={() => {
                  onRemoveSignature();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center space-x-1.5 cursor-pointer transition"
                title="Supprimer la signature et restaurer la photo originale propre"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer la Signature</span>
              </button>
            )}
          </div>

          <button
            onClick={handleApply}
            disabled={!previewUrl || isRendering}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center space-x-2 cursor-pointer transition"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer la Signature ({iconsList.filter((i) => i.enabled).length} logos + texte)</span>
          </button>
        </div>
        {/* Toast Feedback Notification */}
        {feedbackToast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-2xl border border-amber-500/50 flex items-center space-x-2 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Save Preset Dialog Modal */}
        {isSaveDialogOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md p-5 rounded-2xl shadow-2xl border flex flex-col space-y-4 animate-fade-in ${
                isLight
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Enregistrer la Signature</h4>
                    <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Réutilisez-la en 1 clic sur toutes vos futures images
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSaveDialogOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCurrentPreset} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Nom du modèle de signature :</label>
                  <input
                    type="text"
                    value={savePresetName}
                    onChange={(e) => setSavePresetName(e.target.value)}
                    placeholder="Ex: Signature Amouretvie, Signature Mariage..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                      isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900"
                        : "bg-slate-950 border-slate-700 text-slate-100"
                    }`}
                    autoFocus
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultCheck}
                    onChange={(e) => setSaveAsDefaultCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-medium">
                    Définir comme signature par défaut (chargée automatiquement)
                  </span>
                </label>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveDialogOpen(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                    }`}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
