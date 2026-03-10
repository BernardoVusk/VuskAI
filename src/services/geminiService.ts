
// Vusk Vision Core Logic - Checkpoint v6.0.0
// Holistic Forensic Update: Reverse Engineering Computational Photography.
// Focus: Raw Smartphone Realism, Micro-Expressions, Deep Focus (No Bokeh).

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisError } from "../types";
import {
  PREFIX,
  SUFFIX,
  STUDIO_PREFIX,
  STUDIO_SUFFIX,
  ARCH_PREFIX,
  ARCH_SUFFIX,
  CINEMA_TECH_SPECS,
  TEXTURE_OVERLOAD_BLOCK,
  EYE_REALISM_BOOSTER,
  LIFESTYLE_PHYSICS,
  IDENTITY_ENFORCEMENT
} from "../lib/prompts";

const getClient = (): GoogleGenAI => {
  // In Vite, process.env is not defined in the browser, so we must safely check it
  // or just rely on import.meta.env
  let apiKey = '';
  try {
    // Try process.env first (for Netlify functions)
    if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
      apiKey = process.env.VITE_GEMINI_API_KEY;
    } else if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore
  }

  if (!apiKey) {
    try {
      // Try import.meta.env (for Vite frontend)
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please add VITE_GEMINI_API_KEY to your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const formatOutput = (text: string): string => {
  let clean = text.replace(PREFIX, "").replace(SUFFIX, "").trim();
  if (clean.startsWith('.') || clean.startsWith(',')) clean = clean.substring(1).trim();
  return `${PREFIX}\n\n${clean}\n\n${SUFFIX}`;
};

const formatMarketplaceOutput = (text: string): string => {
  return `${STUDIO_PREFIX}\n\n${text.trim()}\n\n${STUDIO_SUFFIX}`;
};

const formatArchitectureOutput = (text: string): string => {
  let clean = text.replace(ARCH_PREFIX, "").replace(ARCH_SUFFIX, "").replace(PREFIX, "").replace(SUFFIX, "").trim();
  if (clean.startsWith('.') || clean.startsWith(',')) clean = clean.substring(1).trim();
  return `${ARCH_PREFIX} ${clean} ${ARCH_SUFFIX}`;
};

const getCoreDescription = (text: string): string => {
   let clean = text;
   clean = clean.split(PREFIX).join("").split(SUFFIX).join("");
   clean = clean.split(STUDIO_PREFIX).join("").split(STUDIO_SUFFIX).join("");
   clean = clean.split(ARCH_PREFIX).join("").split(ARCH_SUFFIX).join("");
   // Remove cinema tech specs if present to avoid duplication
   clean = clean.split("**CINEMATOGRAPHY SPECS:**")[0]; 
   return clean.trim();
};

const parseJSONResponse = (text: string): AnalysisResult => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    
    if (!parsed || typeof parsed !== 'object') {
        throw new Error("Invalid JSON structure");
    }

    // Type guard / validation
    if (!('physicalDescription' in parsed) || !('suggestedPrompt' in parsed)) {
        throw new Error("Missing required fields in JSON response");
    }

    return parsed as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Invalid JSON response from AI");
  }
};

/**
 * Helper to add a timeout to a promise
 */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: A operação demorou mais de ${ms/1000}s`)), ms)
    )
  ]);
};

/**
 * Helper to retry API calls on 503/429 errors
 */
const withRetry = async <T>(fn: (attempt: number) => Promise<T>, maxRetries = 2): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Reduced timeout to 20s for faster feedback
      return await withTimeout(fn(i), 20000);
    } catch (error: any) {
      lastError = error;
      const message = (error.message || String(error)).toUpperCase();
      
      const isRetryable = 
        message.includes('503') || 
        message.includes('UNAVAILABLE') || 
        message.includes('429') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('TIMEOUT');
      
      if (isRetryable && i < maxRetries - 1) {
        // Exponential backoff: 2s, 4s, 8s...
        const delay = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
        console.warn(`Google API is busy or timed out. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Helper to try a primary model and fallback to a secondary one if it fails
 */
const withFallback = async <T>(
  primaryFn: (model: string) => Promise<T>,
  primaryModel: string = 'gemini-3-flash-preview',
  fallbackModel: string = 'gemini-3.1-pro-preview'
): Promise<T> => {
  try {
    // Try primary model with retries
    return await withRetry(() => primaryFn(primaryModel));
  } catch (error: any) {
    const message = (error.message || String(error)).toUpperCase();
    
    const isOverloaded = 
      message.includes('503') || 
      message.includes('UNAVAILABLE') || 
      message.includes('429') || 
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('TIMEOUT');

    if (isOverloaded) {
      console.warn(`Primary model (${primaryModel}) is overloaded. Falling back to ${fallbackModel}...`);
      // Try fallback model with retries
      return await withRetry(() => primaryFn(fallbackModel));
    }
    
    // If it's not an overload error, just rethrow
    throw error;
  }
};

/**
 * Step 1: Structural & Lighting Forensic Analyst (Identity Neutral)
 */
export const analyzeReferenceImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  const ai = getClient();
  
  // PROTOCOLO DE ENGENHARIA REVERSA: Análise de 6 Camadas com foco em Expressão, Olhos e Óptica.
  const prompt = `
    ACT AS: "Reverse Engineering Photography Analyst".
    Your goal is to extract the POSE, EXPRESSION, CLOTHING, LIGHTING, and OPTICS to create a perfect "container" prompt for a model replacement workflow.

    **CRITICAL INSTRUCTION: IGNORE THE REFERENCE PERSON'S IDENTITY.**
    - DO NOT describe hair color, hair style, hair length, or balding.
    - DO NOT describe tattoos, scars, birthmarks, or specific facial features (nose shape, eye color).
    - **FOCUS ONLY** on the "Mannequin" (Pose/Anatomy), the "Expression" (Muscle Action), the "Clothing" (Fabric/Drape), and the "Lighting".

    **ANALYZE THESE 6 LAYERS:**
    1. ANATOMICAL RIGGING
    2. FACIAL RIGGING & MICRO-EXPRESSIONS
    3. OCULAR FORENSICS
    4. CLOTHING & FABRIC PHYSICS
    5. LIGHTING MAP
    6. OPTICAL & IMPERFECTIONS

    **OUTPUT INSTRUCTION:** 
    Return a valid JSON object.
    
    **SUGGESTED PROMPT FORMAT:**
    Organize the 'suggestedPrompt' into 3 distinct paragraphs separated by double line breaks:
    PARAGRAPH 1 (BACKGROUND), PARAGRAPH 2 (SUBJECT), PARAGRAPH 3 (CHARACTERISTICS).
  `;

  try {
    const response = await withFallback((model) => ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicalDescription: { type: Type.STRING },
            suggestedPrompt: { type: Type.STRING },
          },
          required: ["physicalDescription", "suggestedPrompt"],
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    result.suggestedPrompt = formatOutput(result.suggestedPrompt);
    return result;
  } catch (error: unknown) {
    console.error("Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during analysis";
    throw new Error(`Analysis failed: ${message}`);
  }
};

export const analyzeLifestyleImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  const ai = getClient();
  // SYSTEM PROMPT: ENGENHARIA REVERSA DE LIFESTYLE (Baseado no Treino)
  const prompt = `
    ACT AS: "Reverse Engineering Photography Analyst" specialized in RAW PHOTOREALISM and LIFESTYLE SNAPSHOTS.

    Your task is to analyze the image and generate a prompt that recreates it as a CASUAL, UNEDITED IPHONE PHOTO.
    Ignore "artistic" interpretations. Focus on PHYSICS, OPTICS, and IMPERFECTIONS.

    **ANALYZE THESE 5 KEY AREAS:**
    1. OPTICS & SENSOR PHYSICS
    2. INTENTIONAL IMPERFECTIONS
    3. BANAL LIGHTING
    4. NEGATIVE CONCEPTUALIZATION
    5. SCENE & SUBJECT

    **OUTPUT FORMAT:**
    Return a valid JSON object.
  `;
  try {
    const response = await withFallback((model) => ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicalDescription: { type: Type.STRING },
            suggestedPrompt: { type: Type.STRING },
          },
          required: ["physicalDescription", "suggestedPrompt"],
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    result.suggestedPrompt = formatOutput(result.suggestedPrompt);
    return result;
  } catch (error: unknown) { 
    console.error("Lifestyle Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during lifestyle analysis";
    throw new Error(`Lifestyle Analysis failed: ${message}`);
  }
};

export const analyzeCinematicImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  const ai = getClient();
  const prompt = `
    ACT AS: "Master Director of Photography (DoP) & Colorist".
    Your mission: Translate this image into a high-budget HOLLYWOOD SCREENPLAY & SHOT LIST description.
    
    **REQUIRED CINEMATIC LAYERS:**
    1. CAMERA & LENS PACKAGE
    2. LIGHTING & ATMOSPHERE
    3. COLOR GRADING
    4. SCENE COMPOSITION & NARRATIVE

    **OUTPUT:** Return a valid JSON object.
  `;
  try {
    const response = await withFallback((model) => ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicalDescription: { type: Type.STRING },
            suggestedPrompt: { type: Type.STRING },
          },
          required: ["physicalDescription", "suggestedPrompt"],
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    return result;
  } catch (error: unknown) { 
    console.error("Cinematic Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during cinematic analysis";
    throw new Error(`Cinematic Analysis failed: ${message}`);
  }
};

export const analyzeMarketplaceImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  const ai = getClient();
  const prompt = `
    ACT AS: "The CTR Alchemist" (E-commerce Visual Expert).
    Analyze the product in this image for High-CTR Marketplace Photography.
    Physics Check, Hero Angle, and Buyer Vibe.
    
    Return a valid JSON object.
  `;
  try {
    const response = await withFallback((model) => ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicalDescription: { type: Type.STRING },
            suggestedPrompt: { type: Type.STRING },
          },
          required: ["physicalDescription", "suggestedPrompt"],
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    result.suggestedPrompt = formatMarketplaceOutput(result.suggestedPrompt);
    return result;
  } catch (error: unknown) { 
    console.error("Marketplace Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during marketplace analysis";
    throw new Error(`Marketplace Analysis failed: ${message}`);
  }
};

export const analyzeArchitectureImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  const ai = getClient();
  const prompt = `
    ACT AS: "The BIM Visionary" (Architectural Visualization Expert).
    Analyze the provided architectural image (drawing, render, or photo) and extract technical instructions for a PBR (Physically Based Rendering) and GI (Global Illumination) engine.

    **REQUIRED ANALYSIS:**
    1. **STRUCTURAL ELEMENTS:** Identify walls, windows, roof types, and structural rhythm.
    2. **MATERIALS:** Identify exact materials (e.g., "Exposed concrete," "Oak wood panels," "Double-glazed glass").
    3. **LIGHTING:** Identify light sources, time of day, and shadow quality.
    4. **ENVIRONMENT:** Identify surrounding vegetation, urban context, or interior decor.

    **OUTPUT INSTRUCTION:**
    Return a valid JSON object with:
    - "physicalDescription": A technical summary of the architecture and materials.
    - "suggestedPrompt": A high-end architectural visualization prompt.

    The "suggestedPrompt" must be detailed and professional.
  `;
  try {
    const response = await withFallback((model) => ai.models.generateContent({
      model: model, 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicalDescription: { type: Type.STRING },
            suggestedPrompt: { type: Type.STRING },
          },
          required: ["physicalDescription", "suggestedPrompt"],
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    result.suggestedPrompt = formatArchitectureOutput(result.suggestedPrompt);
    return result;
  } catch (error: unknown) { 
    console.error("Architecture Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during architecture analysis";
    throw new Error(`Architecture Analysis failed: ${message}`);
  }
};

export const createHookPrompt = async (userIdea: string): Promise<{ imagePrompt: string; videoPrompt: string }> => {
  const ai = getClient();
  const prompt = `Create raw POV prompts for: "${userIdea}". Return JSON.`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { text: prompt },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING },
            videoPrompt: { type: Type.STRING },
          },
        },
      }
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = JSON.parse(response.text);
    result.imagePrompt = formatOutput(result.imagePrompt);
    return result;
  } catch (error: unknown) { 
    console.error("Hook Prompt Creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during hook prompt creation";
    throw new Error(`Hook Prompt Creation failed: ${message}`);
  }
};

export const refinePrompt = async (originalPrompt: string, instruction: string): Promise<string> => {
  const ai = getClient();
  const prompt = `Update prompt: "${originalPrompt}" with instruction: "${instruction}". Keep original format. Return ONLY updated string.`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    return response.text.trim();
  } catch (error: unknown) { 
    console.error("Prompt Refinement failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during prompt refinement";
    throw new Error(`Prompt Refinement failed: ${message}`);
  }
};

export const generateIdentityImage = async (base64Ref: string, desc: string, scene: string, aspect: string): Promise<string> => {
  const ai = getClient();
  const coreDesc = getCoreDescription(desc);
  
  // PROTOCOLO DE FUSÃO (Modo Container para Rosto da Modelo)
  const opticsBlock = `
    **POSE & LIGHTING CONTAINER PROTOCOL:**
    1. **RIGGING FIDELITY:** Use the anatomical description as a strict wireframe.
    2. **EXPRESSION FIDELITY:** Apply the EXACT facial expression analyzed (squints, grimaces, smiles, mouth shape). The muscle tension must be 1:1 with the reference.
    3. **CLOTHING FIDELITY:** Render the clothing materials, folds, and textures exactly as analyzed.
    4. **IDENTITY NEUTRALITY:** Use a generic face placeholder, **BUT IT MUST HAVE REALISTIC SKIN TEXTURE**. Do not generate a smooth/blur face. It must look like a real person ready for a swap.
    5. **LIGHTING ACCURACY:** The light direction and intensity must match the analysis exactly.
  `;
  
  const prompt = `
    ${PREFIX}
    **STRUCTURAL POSE, EXPRESSION & CLOTHING MAP:**
    ${coreDesc}
    
    ${opticsBlock}
    
    ${TEXTURE_OVERLOAD_BLOCK}

    ${EYE_REALISM_BOOSTER}
    
    **SCENE CONTEXT:**
    ${scene}
    
    **STYLE:** Casual, unedited smartphone photography.
    ${IDENTITY_ENFORCEMENT}
    ${SUFFIX}
  `;
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Ref } }, { text: prompt }] },
      config: { imageConfig: { aspectRatio: aspect } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Identity Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during identity image generation";
    throw new Error(`Identity Image Generation failed: ${message}`);
  }
};

export const generateLifestyleImage = async (base64Ref: string, desc: string, scene: string, aspect: string): Promise<string> => {
  const ai = getClient();
  const coreDesc = getCoreDescription(desc);
  // INJECTING LIFESTYLE PHYSICS based on "Treino"
  const prompt = `
    ${PREFIX}
    
    **SCENE ANALYSIS & CONTEXT:**
    ${coreDesc}
    ${scene}
    
    ${LIFESTYLE_PHYSICS}
    
    ${SUFFIX}
  `;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Ref } }, { text: prompt }] },
      config: { imageConfig: { aspectRatio: aspect } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Lifestyle Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during lifestyle image generation";
    throw new Error(`Lifestyle Image Generation failed: ${message}`);
  }
};

export const generateCinematicImage = async (base64Ref: string, desc: string, scene: string, angle: string = "Medium Shot"): Promise<string> => {
  const ai = getClient();
  const coreDesc = getCoreDescription(desc);
  
  const prompt = `
    ACT AS: A Film Director visualizing a scene.
    
    **SCENE DESCRIPTION (Fixed Consistency):**
    ${coreDesc} (Keep the subject, clothes, and environment 100% consistent).
    ${scene}

    **CAMERA ANGLE INSTRUCTION:**
    **${angle}**
    (Adjust the composition strictly to this angle while maintaining the scene continuity).
    
    ${CINEMA_TECH_SPECS}
    
    **STYLE:** Cinematic film still, movie screengrab, masterpiece, color graded.
    **NEGATIVE PROMPT:** (video game:1.2), (3d render:1.2), (cartoon), (iphone photo), (amateur), (flat lighting), (bright clean skin).
  `;
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Ref } }, { text: prompt }] },
      // FORÇANDO 9:16 PARA VÍDEO VERTICAL
      config: { imageConfig: { aspectRatio: "9:16" } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Cinematic Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during cinematic image generation";
    throw new Error(`Cinematic Image Generation failed: ${message}`);
  }
};

export const generateMarketplaceImage = async (base64Ref: string, desc: string, scene: string, aspect: string): Promise<string> => {
  const ai = getClient();
  const envText = scene.trim() || "luxury minimalist studio";
  const coreDesc = getCoreDescription(desc);
  const fidelityEnforcement = `**THE CTR ALCHEMIST PROTOCOL:** 1. THE PRODUCT SUBJECT MUST BE A 1:1 CLONE. 2. BACKGROUND REPLACEMENT: ${envText}. 3. ALIGN LIGHTING.`;
  let finalPromptBody = coreDesc;
  if (finalPromptBody.includes("[MARKETPLACE_ENVIRONMENT]")) {
     finalPromptBody = finalPromptBody.replace("[MARKETPLACE_ENVIRONMENT]", envText);
  } else {
     finalPromptBody = `${finalPromptBody}\n\n**ENVIRONMENT:** ${envText}`;
  }
  const finalPrompt = `${STUDIO_PREFIX}\n${fidelityEnforcement}\n${finalPromptBody}\n${STUDIO_SUFFIX}`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Ref } }, { text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: aspect } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Marketplace Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during marketplace image generation";
    throw new Error(`Marketplace Image Generation failed: ${message}`);
  }
};

export const generateArchitectureImage = async (base64Ref: string, desc: string, scene: string, aspect: string): Promise<string> => {
  const ai = getClient();
  const styleText = scene.trim();
  const coreDesc = getCoreDescription(desc);
  const finalPrompt = `${ARCH_PREFIX}\n\n${coreDesc}\n\n**TECHNICAL OVERRIDE:** ${styleText}\n\n${ARCH_SUFFIX}`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Ref } }, { text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: aspect } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Architecture Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during architecture image generation";
    throw new Error(`Architecture Image Generation failed: ${message}`);
  }
};

export const generateRawImage = async (prompt: string, aspect: string): Promise<string> => {
  const ai = getClient();
  const finalPrompt = formatOutput(prompt);
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { text: finalPrompt },
      config: { imageConfig: { aspectRatio: aspect } }
    }));
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Generation failed: No image data returned.");
  } catch (error: unknown) {
    console.error("Raw Image Generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error during raw image generation";
    throw new Error(`Raw Image Generation failed: ${message}`);
  }
};
