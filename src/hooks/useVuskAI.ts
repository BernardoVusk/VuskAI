import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisMode, AnalysisResult, AppStatus, UserSubscriptions } from '../types';
import {
  analyzeReferenceImage,
  analyzeLifestyleImage,
  analyzeCinematicImage,
  analyzeMarketplaceImage,
  analyzeArchitectureImage,
  generateIdentityImage,
  generateLifestyleImage,
  generateCinematicImage,
  generateMarketplaceImage,
  generateArchitectureImage,
  refinePrompt
} from '../services/geminiService';
import { getSubscriptions, validateAndActivateKey, clearSubscriptions } from '../services/activationService';

interface UseVuskAIState {
  mode: AnalysisMode;
  image: string | null;
  analysis: AnalysisResult | null;
  status: AppStatus;
  resultImage: string | null;
  error: string | null;
  subscriptions: UserSubscriptions;
  isKeyModalOpen: boolean;
  isRefining: boolean;
}

export const useVuskAI = () => {
  const [state, setState] = useState<UseVuskAIState>({
    mode: AnalysisMode.IDENTITY,
    image: null,
    analysis: null,
    status: AppStatus.IDLE,
    resultImage: null,
    error: null,
    subscriptions: getSubscriptions(),
    isKeyModalOpen: false,
    isRefining: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check subscriptions on mount
    const subs = getSubscriptions();
    setState(prev => ({ ...prev, subscriptions: subs }));
  }, []);

  const setMode = (mode: AnalysisMode) => {
    setState(prev => ({ ...prev, mode, analysis: null, resultImage: null, error: null, status: AppStatus.IDLE }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setState(prev => ({ ...prev, error: "File size exceeds 10MB limit." }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          image: reader.result as string,
          analysis: null,
          resultImage: null,
          error: null,
          status: AppStatus.IDLE
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const checkSubscription = (targetMode: AnalysisMode = state.mode): boolean => {
    const subs = getSubscriptions();
    const isSubscribed = !!subs[targetMode]?.isActive;
    
    if (!isSubscribed) {
      setState(prev => ({ ...prev, isKeyModalOpen: true, subscriptions: subs }));
      return false;
    }
    
    setState(prev => ({ ...prev, subscriptions: subs }));
    return true;
  };

  const handleAnalyze = async () => {
    if (!checkSubscription()) return;
    if (!state.image) return;

    setState(prev => ({ ...prev, status: AppStatus.ANALYZING, error: null, analysis: null }));

    try {
      let result: AnalysisResult;
      const base64 = state.image.split(',')[1];
      const mimeType = state.image.split(';')[0].split(':')[1];

      switch (state.mode) {
        case AnalysisMode.IDENTITY:
          result = await analyzeReferenceImage(base64, mimeType);
          break;
        case AnalysisMode.LIFESTYLE:
          result = await analyzeLifestyleImage(base64, mimeType);
          break;
        case AnalysisMode.CINEMATIC:
          result = await analyzeCinematicImage(base64, mimeType);
          break;
        case AnalysisMode.MARKETPLACE:
          result = await analyzeMarketplaceImage(base64, mimeType);
          break;
        case AnalysisMode.ARCHITECTURE:
          result = await analyzeArchitectureImage(base64, mimeType);
          break;
        default:
          throw new Error("Invalid analysis mode");
      }

      setState(prev => ({ ...prev, analysis: result, status: AppStatus.REVIEW }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Analysis failed due to an unknown error.";
      setState(prev => ({ ...prev, status: AppStatus.ERROR, error: message }));
    }
  };

  const handleGenerate = async () => {
    if (!checkSubscription()) return;
    if (!state.image || !state.analysis) return;

    setState(prev => ({ ...prev, status: AppStatus.GENERATING, error: null }));

    try {
      let result: string;
      const base64 = state.image.split(',')[1];
      const aspect = "1:1"; // Default, could be configurable

      switch (state.mode) {
        case AnalysisMode.IDENTITY:
          result = await generateIdentityImage(base64, state.analysis.physicalDescription || "", state.analysis.suggestedPrompt, aspect);
          break;
        case AnalysisMode.LIFESTYLE:
          result = await generateLifestyleImage(base64, state.analysis.physicalDescription || "", state.analysis.suggestedPrompt, aspect);
          break;
        case AnalysisMode.CINEMATIC:
          result = await generateCinematicImage(base64, state.analysis.physicalDescription || "", state.analysis.suggestedPrompt);
          break;
        case AnalysisMode.MARKETPLACE:
          result = await generateMarketplaceImage(base64, state.analysis.physicalDescription || "", state.analysis.suggestedPrompt, aspect);
          break;
        case AnalysisMode.ARCHITECTURE:
          result = await generateArchitectureImage(base64, state.analysis.physicalDescription || "", state.analysis.suggestedPrompt, aspect);
          break;
        default:
          throw new Error("Invalid generation mode");
      }

      setState(prev => ({ ...prev, resultImage: result, status: AppStatus.COMPLETE }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Generation failed due to an unknown error.";
      setState(prev => ({ ...prev, status: AppStatus.ERROR, error: message }));
    }
  };

  const handleRefinePrompt = async (instruction: string) => {
    if (!state.analysis?.suggestedPrompt) return;

    setState(prev => ({ ...prev, isRefining: true, error: null }));

    try {
      const updatedPrompt = await refinePrompt(state.analysis.suggestedPrompt, instruction);
      setState(prev => ({
        ...prev,
        isRefining: false,
        analysis: prev.analysis ? { ...prev.analysis, suggestedPrompt: updatedPrompt } : null
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Prompt refinement failed.";
      setState(prev => ({ ...prev, isRefining: false, error: message }));
    }
  };

  const activateKey = async (key: string) => {
    try {
      const { mode: activatedMode } = await validateAndActivateKey(key);
      const updatedSubs = getSubscriptions();
      setState(prev => ({ 
        ...prev, 
        subscriptions: updatedSubs, 
        isKeyModalOpen: false, 
        error: null,
        mode: activatedMode === 'ALL' ? prev.mode : activatedMode
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Activation failed.";
      throw new Error(message);
    }
  };

  const closeKeyModal = () => setState(prev => ({ ...prev, isKeyModalOpen: false }));
  const openKeyModal = () => setState(prev => ({ ...prev, isKeyModalOpen: true }));
  const logout = () => {
    clearSubscriptions();
    setState(prev => ({ ...prev, subscriptions: {} }));
  };

  const resetError = () => setState(prev => ({ ...prev, error: null, status: AppStatus.IDLE }));

  return {
    ...state,
    setMode,
    handleImageUpload,
    handleAnalyze,
    handleGenerate,
    fileInputRef,
    resetError,
    activateKey,
    closeKeyModal,
    openKeyModal,
    logout,
    checkSubscription,
    handleRefinePrompt
  };
};
