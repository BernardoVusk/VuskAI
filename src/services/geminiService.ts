
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
 * Helper to retry API calls on 503/429 errors
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toUpperCase();
      const message = (error.message || "").toUpperCase();
      
      const isRetryable = 
        message.includes('503') || 
        message.includes('UNAVAILABLE') || 
        message.includes('429') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        errorStr.includes('503') ||
        errorStr.includes('UNAVAILABLE') ||
        error.status === 'UNAVAILABLE' ||
        error.code === 503;
      
      if (isRetryable && i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Google API is busy (503/429). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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

    1. **💀 ANATOMICAL RIGGING (The Container):**
       - Describe the skeleton position strictly. "Subject seated, head tilted 15 degrees left, chin up."
       - Finger placement is CRITICAL.
       - Body language: "Slouching shoulders," "Spine straight," "Leaning forward."

    2. **😲 FACIAL RIGGING & MICRO-EXPRESSIONS (The Emotion):**
       - **EYE TENSION:** Are the eyes squinting (Duchenne marker)? Wide open in shock? Relaxed? Look for "crow's feet" tension or brow furrowing.
       - **MOUTH MECHANICS:** Describe the exact shape. "Wide open laugh exposing upper teeth," "Tight-lipped grimace," "Biting lower lip," "Puffing cheeks," "Tongue sticking out."
       - **JAW & MUSCLES:** Is the jaw clenched? Are there dimples visible? 
       - **CARETA/GRIMACE:** If they are making a funny face, describe the distortion explicitly.

    3. **👁️ OCULAR FORENSICS (The Soul):**
       - **SCLERA:** Is it off-white? Veined? Yellowed? (Never pure white).
       - **IRIS:** Fibrous texture? Crypts? Limbal ring softness?
       - **MOISTURE:** Wetness on the waterline (tear meniscus) and caruncle (pink corner).
       - **GEOMETRY:** Corneal bulge/refraction if side view.

    4. **👗 CLOTHING & FABRIC PHYSICS (Detail Heavy):**
       - **MATERIAL:** Identify exact fabric (e.g., "Heavyweight French Terry cotton," "Sheer chiffon," "Rigid raw denim").
       - **TEXTURE & FINISH:** Describe the surface (e.g., "Ribbed texture," "Satin sheen," "Distressed vintage wash").
       - **FIT & DRAPE:** How it hangs on the body.

    5. **💡 LIGHTING MAP (The Texture Source):**
       - **DIRECTION:** Exact source angle. "Hard sunlight from top-right."
       - **BANALITY:** Is it "boring office fluorescent"? "Harsh noon sun"? Avoid "cinematic" terms.

    6. **📷 OPTICAL & IMPERFECTIONS:**
       - **FOCUS:** Confirm background is in focus (Deep DoF).
       - **IMPERFECTIONS:** Mention if the framing is crooked, if there are smudges, or if the composition is "accidental".

    **OUTPUT INSTRUCTION:** 
    Return a valid JSON object with the following structure:
    {
      "physicalDescription": "Detailed description of pose, expression, and clothing...",
      "suggestedPrompt": "The full prompt text..."
    }

    **SUGGESTED PROMPT FORMAT:**
    Organize the 'suggestedPrompt' into 3 distinct paragraphs separated by double line breaks:
    
    **PARAGRAPH 1 (BACKGROUND):** Describe the environment, setting, and background elements in detail.
    
    **PARAGRAPH 2 (SUBJECT):** Describe the person (if present), their pose, anatomy, expression, clothing, and textures.
    
    **PARAGRAPH 3 (CHARACTERISTICS):** Describe the technical image characteristics, lighting, optics, imperfections, and camera settings.

    **START WITH:** "The most real and human possible..." (in the characteristics paragraph or implicitly handled by the prefix).
    **END WITH:** "...f/1.8, ISO 200, Background fully sharp. ${IDENTITY_ENFORCEMENT}"
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = parseJSONResponse(response.text);
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

    **ANALYZE THESE 5 KEY AREAS (The DNA of the Prompt):**

    1. **🔭 OPTICS & SENSOR PHYSICS:**
       - Estimate focal length (~26mm wide for phone).
       - Estimate Aperture/ISO (e.g., "f/1.8, ISO 400").
       - **FOCUS:** Confirm if the background is sharp (Deep Depth of Field).
       - **NOISE:** Is there digital grain?

    2. **❌ INTENTIONAL IMPERFECTIONS (Crucial for Realism):**
       - **FRAMING:** Is it crooked? Off-center? Accidental cropping?
       - **DIRT/TEXTURE:** Look for smudges on mirrors, dirty foam, dust on surfaces, messy hair, wrinkles in clothes.
       - **MOTION:** Is there slight motion blur on hands or background?

    3. **💡 BANAL LIGHTING (The "Boring" Light):**
       - Is it harsh noon sun? Overhead fluorescent? Camera flash bounce?
       - AVOID "Golden Hour" or "Cinematic" unless strictly visible. Prefer "Natural", "Neutral", "Hard-edged shadows".

    4. **🚫 NEGATIVE CONCEPTUALIZATION:**
       - Explicitly state: "No color grading, no cinematic look, no stylization, no bokeh".

    5. **🌍 SCENE & SUBJECT:**
       - Describe the scene physically (materials, colors, objects).
       - Describe the subject's pose as "casual" or "unposed".

    **OUTPUT FORMAT:**
    Return a valid JSON object with the following structure:
    {
      "physicalDescription": "Detailed description...",
      "suggestedPrompt": "The prompt MUST start with: 'The most real and human possible...' and end with technical metadata."
    }
  `;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = parseJSONResponse(response.text);
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
    
    **REQUIRED CINEMATIC LAYERS (Must analyze for Vertical Video Production 9:16):**

    1.  **🎥 CAMERA & LENS PACKAGE:**
        - Identify the visual language: Is it Anamorphic (oval bokeh, horizontal flares)? Is it Spherical (sharp, clean)?
        - Sensor Size: "Large Format (IMAX)" for epic scale or "Super 35mm" for classic grain.
        - Focal Length: "85mm Telephoto" (compressed background) vs "24mm Wide" (expansive).
        - **ASPECT RATIO:** Enforce 9:16 vertical composition instructions.

    2.  **💡 LIGHTING & ATMOSPHERE (Volumetrics):**
        - Analyze the light ratios: "Chiaroscuro" (high contrast), "Rembrandt Lighting" (triangle on cheek), or "Soft Diffused Moonlight".
        - ATMOSPHERE: Is there "Haze", "Fog", "Dust particles", or "Steam"? (Crucial for video depth).
        - Color Temp: "Warm Tungsten (3200K)" vs "Cool Daylight (5600K)".

    3.  **🎨 COLOR GRADING (The "Look"):**
        - Define the LUT/Grade: "Teal & Orange" (Action), "Bleach Bypass" (Gritty war/crime), "Technicolor" (Vibrant vintage), or "Desaturated Noir".
        - Describe the shadows: Are they crushed black or lifted matte grey?

    4.  **🎬 SCENE COMPOSITION & NARRATIVE:**
        - Rule of Thirds, Leading Lines, Center Framing (Wes Anderson style).
        - Describe the subject's action as a "Keyframe": "Subject is frozen mid-stride," "Looking intensely off-camera."

    **OUTPUT:** Return a valid JSON object with the following structure:
    {
      "physicalDescription": "Detailed shot list description...",
      "suggestedPrompt": "A single, epic paragraph suitable for Midjourney/Stable Diffusion..."
    }
  `;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = parseJSONResponse(response.text);
    // We don't use formatCinematicOutput here because we want the raw prompt from the new logic
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
    OUTPUT STRUCTURE: [SUBJECT ANCHOR], [ENVIRONMENT & VIBE], [LIGHTING], [TECHNICAL], [COMPOSITION].
    
    Return a valid JSON object with:
    {
      "physicalDescription": "Analysis of the product...",
      "suggestedPrompt": "The optimized prompt..."
    }
  `;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = parseJSONResponse(response.text);
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
  const prompt = `ACT AS: "The BIM Visionary". Analyze the technical drawing for PBR/GI rendering instructions. Return JSON with "physicalDescription" and "suggestedPrompt".`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
    }));

    if (!response.text) {
        throw new Error("No text response from AI");
    }

    const result = parseJSONResponse(response.text);
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
