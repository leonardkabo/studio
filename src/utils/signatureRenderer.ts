import { SavedSignaturePreset, SignatureIconItem, IconStyleMode } from "../types";

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
    brandColor: "#0084FF",
    svgPath:
      "M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.077.299 2.222.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.56 6.963z",
  },
  {
    key: "tiktok",
    name: "TikTok",
    brandColor: "#000000",
    svgPath:
      "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.3 6.3 0 0 0 1.95-4.48V8.71a8.19 8.19 0 0 0 4.94 1.64V6.9a4.82 4.82 0 0 1-1.11-.21z",
  },
  {
    key: "camera",
    name: "Appareil Photo Pro",
    brandColor: "#0284c7",
    svgPath:
      "M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  },
  {
    key: "signature",
    name: "Plume Signature",
    brandColor: "#eab308",
    svgPath:
      "M20.71 4.63l-1.34-1.34a2 2 0 0 0-2.83 0L3 16.5V21h4.5L20.71 7.46a2 2 0 0 0 0-2.83zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z",
  },
  {
    key: "heart",
    name: "Cœur Romantique",
    brandColor: "#e11d48",
    svgPath:
      "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  },
  {
    key: "star",
    name: "Étoile Star",
    brandColor: "#f59e0b",
    svgPath:
      "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  },
  {
    key: "phone",
    name: "Téléphone",
    brandColor: "#10b981",
    svgPath:
      "M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z",
  },
  {
    key: "globe",
    name: "Site Web",
    brandColor: "#6366f1",
    svgPath:
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.95a15.7 15.7 0 0 0-1.38-5.46A8.01 8.01 0 0 1 19.93 11zM12 4.07c.9 1.48 1.6 3.38 1.9 5.93h-3.8c.3-2.55 1-4.45 1.9-5.93zm-5.93 6.93h3.95c.16-1.95.66-3.84 1.45-5.46A8.01 8.01 0 0 0 6.07 11zM4.07 13h3.95c.16 1.95.66 3.84 1.45 5.46A8.01 8.01 0 0 1 4.07 13zm7.93 6.93c-.9-1.48-1.6-3.38-1.9-5.93h3.8c-.3 2.55-1 4.45-1.9 5.93zm2.55-1.47c.79-1.62 1.29-3.51 1.45-5.46h3.95a8.01 8.01 0 0 1-5.4 5.46z",
  },
  {
    key: "mail",
    name: "E-mail",
    brandColor: "#ef4444",
    svgPath:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    brandColor: "#25D366",
    svgPath:
      "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.49-8.414z",
  },
];

export const getIconSvgDataUrl = (
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1024" height="1024" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
    ${circleBg}
    <g ${transform} fill="${glyphFill}">
      <path d="${pathData}"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Render a SavedSignaturePreset onto a target Canvas
 */
export async function renderSignaturePresetOnCanvas(
  canvas: HTMLCanvasElement,
  preset: SavedSignaturePreset
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    iconsList = [],
    globalIconSize = 18,
    globalIconScale = 1.0,
    iconStyle = "badge-dark",
    iconSpacing = 6,
    iconTextSpacing = 10,
    iconPositionOrder = "icons-first",
    text = "",
    fontFamily = "Montserrat, sans-serif",
    fontSizePx = 22,
    fontWeight = "600",
    textColor = "#ffffff",
    opacity = 100,
    orientation = "horizontal",
    anchorPosition = "bottom-right",
    customMarginUnit = "px",
    customMarginX = 35,
    customMarginY = 35,
    fineRotation = 0,
    hasOutline = true,
    outlineColor = "#000000",
    outlineWidth = 2,
    hasShadow = true,
    shadowColor = "rgba(0,0,0,0.8)",
    hasBadgeBox = false,
    badgeBoxColor = "rgba(0,0,0,0.4)",
    badgeBoxPadding = 10,
  } = preset;

  // High quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

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
    const baseSize = iconItem.size || globalIconSize;
    const effectiveSize = Math.round(baseSize * (iconItem.scaleMultiplier || globalIconScale || 1.0));
    loadedIconImages.push({ img: iconImg, size: effectiveSize });
  }

  // Scale calculations for High-DPI Canvas
  const canvasScale = Math.max(1, canvas.width / 1200);
  const scaledFontSize = Math.max(12, Math.round(fontSizePx * canvasScale));
  const fontStyleStr = `${fontWeight === "bold" ? "700" : fontWeight === "800" ? "800" : fontWeight === "600" ? "600" : "400"} ${scaledFontSize}px ${fontFamily}`;

  ctx.font = fontStyleStr;
  const textTrimmed = (text || "").trim();
  const textMetrics = textTrimmed ? ctx.measureText(textTrimmed) : { width: 0 };
  const textWidth = textMetrics.width;
  const textHeight = scaledFontSize;

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
    totalContentWidth = Math.max(totalIconsWidth, textWidth);
    totalContentHeight = maxIconHeight + (textTrimmed ? scaledIconTextSpacing + textHeight : 0);
  } else {
    const hasBoth = computedIconSizes.length > 0 && textTrimmed.length > 0;
    totalContentWidth =
      totalIconsWidth + (textTrimmed ? textWidth : 0) + (hasBoth ? scaledIconTextSpacing : 0);
    totalContentHeight = Math.max(maxIconHeight, textHeight);
  }

  const pad = hasBadgeBox ? Math.round(badgeBoxPadding * canvasScale) : 0;
  const unrotatedBoxW = totalContentWidth + pad * 2;
  const unrotatedBoxH = totalContentHeight + pad * 2;

  let totalRotationDeg = fineRotation;
  if (orientation === "vertical-ccw") {
    totalRotationDeg -= 90;
  } else if (orientation === "vertical-cw") {
    totalRotationDeg += 90;
  }

  const rad = (totalRotationDeg * Math.PI) / 180;
  const cosVal = Math.abs(Math.cos(rad));
  const sinVal = Math.abs(Math.sin(rad));

  const rotatedBoxWidth = unrotatedBoxW * cosVal + unrotatedBoxH * sinVal;
  const rotatedBoxHeight = unrotatedBoxW * sinVal + unrotatedBoxH * cosVal;

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

  if (anchorPosition === "top-left" || anchorPosition === "middle-left" || anchorPosition === "bottom-left") {
    centerTargetX = marginPxX + rotatedBoxWidth / 2;
  } else if (anchorPosition === "top-right" || anchorPosition === "middle-right" || anchorPosition === "bottom-right") {
    centerTargetX = canvas.width - marginPxX - rotatedBoxWidth / 2;
  } else {
    centerTargetX = canvas.width / 2;
  }

  if (anchorPosition === "top-left" || anchorPosition === "top-center" || anchorPosition === "top-right") {
    centerTargetY = marginPxY + rotatedBoxHeight / 2;
  } else if (anchorPosition === "bottom-left" || anchorPosition === "bottom-center" || anchorPosition === "bottom-right") {
    centerTargetY = canvas.height - marginPxY - rotatedBoxHeight / 2;
  } else {
    centerTargetY = canvas.height / 2;
  }

  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.translate(centerTargetX, centerTargetY);
  if (totalRotationDeg !== 0) {
    ctx.rotate(rad);
  }
  ctx.translate(-totalContentWidth / 2, -totalContentHeight / 2);

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

  if (hasShadow) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = Math.round(4 * canvasScale);
    ctx.shadowOffsetX = Math.round(2 * canvasScale);
    ctx.shadowOffsetY = Math.round(2 * canvasScale);
  }

  let currentX = 0;
  const baselineY = totalContentHeight / 2;

  const drawIconsSequence = () => {
    for (const iconObj of computedIconSizes) {
      const iconY = baselineY - iconObj.scaledSize / 2;
      ctx.drawImage(iconObj.img, currentX, iconY, iconObj.scaledSize, iconObj.scaledSize);
      currentX += iconObj.scaledSize + scaledIconSpacing;
    }
    if (computedIconSizes.length > 0) {
      currentX -= scaledIconSpacing;
    }
  };

  const drawTextItem = () => {
    if (!textTrimmed) return;
    ctx.font = fontStyleStr;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (hasOutline && outlineWidth > 0) {
      ctx.save();
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = Math.max(1, outlineWidth * canvasScale);
      ctx.lineJoin = "round";
      ctx.strokeText(textTrimmed, currentX, baselineY);
      ctx.restore();
    }

    ctx.fillStyle = textColor;
    ctx.fillText(textTrimmed, currentX, baselineY);
    currentX += textWidth;
  };

  if (isVerticalStack) {
    if (computedIconSizes.length > 0) {
      currentX = (totalContentWidth - totalIconsWidth) / 2;
      drawIconsSequence();
    }
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
    if (iconPositionOrder === "icons-first") {
      if (computedIconSizes.length > 0) {
        drawIconsSequence();
        if (textTrimmed) currentX += scaledIconTextSpacing;
      }
      if (textTrimmed) {
        drawTextItem();
      }
    } else {
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
}
