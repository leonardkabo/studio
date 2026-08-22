export interface HSLChannel {
  hue: number; // -100 to 100
  sat: number; // -100 to 100
  lum: number; // -100 to 100
}

export interface HSLSettings {
  red: HSLChannel;
  orange: HSLChannel;
  yellow: HSLChannel;
  green: HSLChannel;
  aqua: HSLChannel;
  blue: HSLChannel;
  purple: HSLChannel;
  magenta: HSLChannel;
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface AdjustmentSettings {
  exposure: number; // -100 to 100
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100
  temperature: number; // -100 to 100 (WB)
  tint: number; // -100 to 100 (WB Tint)
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
  clarity: number; // -100 to 100
  sharpness: number; // 0 to 100
  noiseReduction: number; // 0 to 100
  vignette: number; // -100 to 100
  skinSmoothing: number; // 0 to 100
  dehaze: number; // -100 to 100
  grain: number; // 0 to 100
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  hsl: HSLSettings;
  curvePoints: CurvePoint[];
}

export type PresetCategory = 
  | "indoor" 
  | "outdoor" 
  | "night" 
  | "wedding" 
  | "portrait" 
  | "concert" 
  | "food" 
  | "cinematic";

export interface EventPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  iconName: string;
  badgeText: string;
  settings: Partial<AdjustmentSettings>;
  aiPromptContext: string;
}

export interface HistoryItem {
  id: string;
  actionName: string;
  timestamp: number;
  settings: AdjustmentSettings;
  image?: string; // High-resolution data URL snapshot for non-destructive history navigation
  dimensions?: { width: number; height: number };
  signatureConfig?: any; // Preserves signature parameters for direct editing
}

export interface SnapshotItem {
  id: string;
  label: string;
  timestamp: number;
  settings: AdjustmentSettings;
  previewUrl?: string;
  imagePreview?: string;
}

export interface AIAnalysisReport {
  photoCategory: string;
  lightingDiagnosis: string;
  qualityDiagnosis: string;
  proAdvice: string;
  suggestedAdjustments: Partial<AdjustmentSettings>;
}

export interface ProjectState {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  originalImage: string; // Data URL or object URL
  dimensions: { width: number; height: number };
  settings: AdjustmentSettings;
  history: HistoryItem[];
  historyIndex: number;
  snapshots: SnapshotItem[];
  aiReport?: AIAnalysisReport;
  isCloudSynced: boolean;
}

export type ThemeMode = "dark" | "light";

export interface ExportOptions {
  format: "png" | "jpeg" | "webp";
  quality: number; // 0.5 to 1.0
  scale: number; // 1 = High Res original, 0.75 = 4K, 0.5 = 2K
  watermarkText: string;
  watermarkPosition: "bottom-right" | "bottom-left" | "top-right" | "center";
  watermarkOpacity: number;
  customFileName?: string;
}

export interface LocalCloudStorageStats {
  localProjectsCount: number;
  cloudSyncedCount: number;
  totalStorageUsedMB: number;
  privacyStatus: string;
}

export interface BrushTipPreset {
  id: string;
  name: string;
  size: number;
  type: "soft" | "hard" | "fine" | "broad" | "fuzzy" | "speckle" | "chalk";
  iconLabel?: string;
}

export interface BrushSettings {
  size: number; // 1 to 300 px
  hardness: number; // 0 to 100%
  spacing: number; // 1 to 100%
  angle: number; // 0 to 360 deg
  roundness: number; // 1 to 100% (Arrondi)
  smoothing: boolean; // Lissage
  flipX: boolean; // Symétrie X
  flipY: boolean; // Symétrie Y
  selectedTipId: string;
  shapeDynamics: boolean;
  diffusion: boolean;
  texture: boolean;
  dualBrush: boolean;
  colorDynamics: boolean;
  transfer: boolean;
  brushPose: boolean;
  noise: boolean;
  wetEdges: boolean;
  accumulation: boolean;
  protectTexture: boolean;
}

export type SelectionMode = "none" | "rectangle" | "ellipse" | "lasso" | "auto_subject";

export interface SelectionState {
  mode: SelectionMode;
  isActive: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  lassoPoints?: { x: number; y: number }[];
  subjectMaskData?: ImageData | null;
}

export interface BeautyFilterParams {
  blemishRemoval: number; // 0 to 100 (%)
  gaussianBlurRadius: number; // 0 to 20 (px)
  sensitivity: number; // 0 to 100 (%)
  preserveDetails: number; // 0 to 100 (%)
  skinWarmth: number; // -50 to +50
  glowIntensity?: number; // 0 to 100
  eyeLipPop?: number; // 0 to 100
  toneEvenness?: number; // 0 to 100
  acneHealingStrength?: number; // 0 to 100
}

export interface BeautyOneClickFilter {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  badge: string;
  badgeColor: "amber" | "rose" | "emerald" | "purple" | "sky" | "indigo" | "orange";
  iconName: string;
  params: BeautyFilterParams;
}

export interface LayerItem {
  id: string;
  name: string;
  imageSrc: string;
  x: number; // % position left (0-100) or pixel
  y: number; // % position top (0-100) or pixel
  width: number; // width in % of canvas or pixels
  height: number; // height in % of canvas or pixels
  rotation: number; // rotation in degrees
  opacity: number; // opacity 0-100
  visible: boolean;
  locked: boolean;
  blendMode: GlobalCompositeOperation;
  zIndex: number;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  project: ProjectState;
  layers: LayerItem[];
  activeLayerId: string | null;
}

export interface SignatureIconItem {
  id: string;
  name: string;
  key: string;
  type: "builtin" | "custom";
  size: number;
  scaleMultiplier?: number;
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
  | "vertical-ccw"
  | "vertical-cw"
  | "vertical-stack";

export type IconStyleMode =
  | "badge-dark"
  | "badge-light"
  | "monochrome"
  | "badge-gold"
  | "official";

export interface SavedSignaturePreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  mode: "signature" | "textOnImage" | "imageInText";
  iconsList: SignatureIconItem[];
  globalIconSize: number;
  globalIconScale: number;
  syncAllIconSizes: boolean;
  iconStyle: IconStyleMode;
  iconSpacing: number;
  iconTextSpacing: number;
  iconPositionOrder: "icons-first" | "text-first";
  text: string;
  fontFamily: string;
  fontSizePx: number;
  fontWeight: "normal" | "600" | "bold" | "800";
  textColor: string;
  opacity: number;
  orientation: SignatureOrientation;
  anchorPosition: AnchorPosition;
  customMarginUnit: "px" | "%";
  customMarginLinked: boolean;
  customMarginX: number;
  customMarginY: number;
  fineRotation: number;
  hasOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
  hasShadow: boolean;
  shadowColor: string;
  hasBadgeBox: boolean;
  badgeBoxColor: string;
  badgeBoxPadding: number;
  isDefault?: boolean;
}



