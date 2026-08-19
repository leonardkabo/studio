import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiAvailable: !!process.env.GEMINI_API_KEY });
});

// API Route: AI Photo Analysis & Auto-Adjustments Generation
app.post("/api/gemini/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", eventType, customInstruction } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Clé API Gemini non configurée. Le mode de calcul automatique local prend le relais.",
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Tu es un retoucheur photo professionnel chevronné spécialisé dans la photographie d'événements (mariages, soirées fermées, installations extérieures, portraits studio, concerts).
Analyse minutieusement cette photo et fournis un diagnostic technique détaillé ainsi que des paramètres précis de retouche numérique pour optimiser l'image.

Contexte d'événement spécifié par l'utilisateur: ${eventType || "Détection Automatique"}
Directives personnalisées: ${customInstruction || "Aucune, optimise automatiquement au maximum du rendu professionnel."}

Fournis une réponse JSON stricte respectant ce schéma exact.
Toutes les valeurs numériques doivent être des entiers réalistes:
- exposure: entre -100 et +100
- contrast: entre -100 et +100
- highlights: entre -100 et +100
- shadows: entre -100 et +100
- whites: entre -100 et +100
- blacks: entre -100 et +100
- temperature: entre -100 (très froid) et +100 (très chaud)
- tint: entre -100 (vert) et +100 (magenta)
- saturation: entre -100 et +100
- vibrance: entre -100 et +100
- clarity: entre -100 et +100
- sharpness: entre 0 et 100
- noiseReduction: entre 0 et 100 (utile pour les photos de nuit/intérieurs sombres)
- vignette: entre -100 et +100
- skinSmoothing: entre 0 et 100
- hsl: ajustement par canal de couleur (red, orange, yellow, green, aqua, blue, purple, magenta) avec hue, saturation, luminance pour chacun.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            photoCategory: {
              type: Type.STRING,
              description: "Catégorie détectée de la photo (ex: Mariage, Lieu Clos Intérieur, Nuit, Extérieur, Portrait)",
            },
            lightingDiagnosis: {
              type: Type.STRING,
              description: "Analyse professionnelle de l'éclairage et de l'exposition",
            },
            qualityDiagnosis: {
              type: Type.STRING,
              description: "Analyse du bruit, de la balance des blancs et de la netteté",
            },
            proAdvice: {
              type: Type.STRING,
              description: "Conseils du retoucheur pour mettre en valeur cette photo",
            },
            suggestedAdjustments: {
              type: Type.OBJECT,
              properties: {
                exposure: { type: Type.INTEGER },
                contrast: { type: Type.INTEGER },
                highlights: { type: Type.INTEGER },
                shadows: { type: Type.INTEGER },
                whites: { type: Type.INTEGER },
                blacks: { type: Type.INTEGER },
                temperature: { type: Type.INTEGER },
                tint: { type: Type.INTEGER },
                saturation: { type: Type.INTEGER },
                vibrance: { type: Type.INTEGER },
                clarity: { type: Type.INTEGER },
                sharpness: { type: Type.INTEGER },
                noiseReduction: { type: Type.INTEGER },
                vignette: { type: Type.INTEGER },
                skinSmoothing: { type: Type.INTEGER },
              },
              required: [
                "exposure",
                "contrast",
                "highlights",
                "shadows",
                "whites",
                "blacks",
                "temperature",
                "tint",
                "saturation",
                "vibrance",
                "clarity",
                "sharpness",
                "noiseReduction",
                "vignette",
                "skinSmoothing",
              ],
            },
          },
          required: [
            "photoCategory",
            "lightingDiagnosis",
            "qualityDiagnosis",
            "proAdvice",
            "suggestedAdjustments",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Réponse IA vide");
    }

    const parsedData = JSON.parse(resultText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erreur Gemini Photo Analysis:", error);
    res.status(500).json({
      error: "Erreur lors de l'analyse IA de la photo: " + (error.message || "inconnue"),
    });
  }
});

// API Route: Custom AI Natural Language Retouch Instruction
app.post("/api/gemini/custom-retouch", async (req, res) => {
  try {
    const { userPrompt, currentSettings } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Clé API non disponible.",
      });
    }

    const promptText = `L'utilisateur souhaite ajuster l'image avec cette consigne en langage naturel: "${userPrompt}".
Paramètres actuels: ${JSON.stringify(currentSettings || {})}

Calcule le nouvel ensemble de réglages (exposure -100 à 100, contrast, highlights, shadows, whites, blacks, temperature, tint, saturation, vibrance, clarity, sharpness, noiseReduction, vignette, skinSmoothing).
Explique aussi brièvement en français la modication apportée.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            adjustments: {
              type: Type.OBJECT,
              properties: {
                exposure: { type: Type.INTEGER },
                contrast: { type: Type.INTEGER },
                highlights: { type: Type.INTEGER },
                shadows: { type: Type.INTEGER },
                whites: { type: Type.INTEGER },
                blacks: { type: Type.INTEGER },
                temperature: { type: Type.INTEGER },
                tint: { type: Type.INTEGER },
                saturation: { type: Type.INTEGER },
                vibrance: { type: Type.INTEGER },
                clarity: { type: Type.INTEGER },
                sharpness: { type: Type.INTEGER },
                noiseReduction: { type: Type.INTEGER },
                vignette: { type: Type.INTEGER },
                skinSmoothing: { type: Type.INTEGER },
              },
              required: [
                "exposure",
                "contrast",
                "highlights",
                "shadows",
                "whites",
                "blacks",
                "temperature",
                "tint",
                "saturation",
                "vibrance",
                "clarity",
                "sharpness",
                "noiseReduction",
                "vignette",
                "skinSmoothing",
              ],
            },
          },
          required: ["explanation", "adjustments"],
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Erreur Custom Retouch:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur LuminaPro Studio actif sur le port ${PORT}`);
  });
}

startServer();
