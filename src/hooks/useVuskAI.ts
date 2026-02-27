import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisMode, AnalysisResult, AppStatus, UserSubscriptions, PlanType } from '../types';
import {
  generateIdentityImage,
  generateLifestyleImage,
  generateCinematicImage,
  generateMarketplaceImage,
  generateArchitectureImage,
  refinePrompt
} from '../services/geminiService';
import { validateAndActivateKey } from '../services/activationService';
import { supabase } from '../lib/supabaseClient';

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
  user: any | null;
}

export const useVuskAI = () => {
  const [state, setState] = useState<UseVuskAIState>({
    mode: AnalysisMode.ARCHITECTURE, // Defaulting to Architecture as requested
    image: null,
    analysis: null,
    status: AppStatus.IDLE,
    resultImage: null,
    error: null,
    subscriptions: {},
    isKeyModalOpen: false,
    isRefining: false,
    user: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSubscriptions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const now = new Date();
      const subs: UserSubscriptions = {};

      // Check Architecture
      if (data.architecture_expiry && new Date(data.architecture_expiry) > now) {
        subs[AnalysisMode.ARCHITECTURE] = {
          isActive: true,
          plan: PlanType.PRO_30_DAYS,
          startDate: new Date().toISOString(), // We don't store start date in this simple schema
          expiresAt: data.architecture_expiry,
        };
      }

      // Check Identity
      if (data.identity_expiry && new Date(data.identity_expiry) > now) {
        subs[AnalysisMode.IDENTITY] = {
          isActive: true,
          plan: PlanType.PRO_30_DAYS,
          startDate: new Date().toISOString(),
          expiresAt: data.identity_expiry,
        };
      }

      // Check Marketplace
      if (data.marketplace_expiry && new Date(data.marketplace_expiry) > now) {
        subs[AnalysisMode.MARKETPLACE] = {
          isActive: true,
          plan: PlanType.PRO_30_DAYS,
          startDate: new Date().toISOString(),
          expiresAt: data.marketplace_expiry,
        };
      }

      setState(prev => ({ ...prev, subscriptions: subs }));
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState(prev => ({ ...prev, user }));
      if (user) {
        fetchSubscriptions(user.id);
      } else {
        setState(prev => ({ ...prev, subscriptions: {} }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState(prev => ({ ...prev, user }));
      if (user) {
        fetchSubscriptions(user.id);
      } else {
        setState(prev => ({ ...prev, subscriptions: {} }));
      }
    });

    return () => subscription.unsubscribe();
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
    const isSubscribed = !!state.subscriptions[targetMode]?.isActive;
    
    if (!isSubscribed) {
      setState(prev => ({ ...prev, isKeyModalOpen: true }));
      return false;
    }
    
    return true;
  };

  const handleAnalyze = async () => {
    if (!checkSubscription()) return;
    if (!state.image || !state.user) {
      if (!state.user) {
        setState(prev => ({ ...prev, error: "Você precisa estar logado para usar esta função." }));
      }
      return;
    }

    setState(prev => ({ ...prev, status: AppStatus.ANALYZING, error: null, analysis: null }));

    try {
      const base64 = state.image.split(',')[1];
      const mimeType = state.image.split(';')[0].split(':')[1];

      // 1. Create a row in the history table
      const { data: historyData, error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: state.user.id,
          mode: state.mode,
          status: 'processando'
        })
        .select()
        .single();

      if (historyError || !historyData) {
        throw new Error("Erro ao criar registro de análise no banco de dados.");
      }

      const historyId = historyData.id;

      // 2. Call the Express API
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historyId,
          base64Image: base64,
          mimeType,
          mode: state.mode
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao iniciar a análise em segundo plano.");
      }

      // 3. Listen for updates on the history row using Supabase Realtime
      const channel = supabase
        .channel(`history_updates_${historyId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'history',
            filter: `id=eq.${historyId}`
          },
          (payload) => {
            const newRecord = payload.new;
            if (newRecord.status === 'concluído') {
              setState(prev => ({ ...prev, analysis: newRecord.result as AnalysisResult, status: AppStatus.REVIEW }));
              supabase.removeChannel(channel);
            } else if (newRecord.status === 'erro') {
              setState(prev => ({ ...prev, status: AppStatus.ERROR, error: newRecord.error || "Erro durante a análise." }));
              supabase.removeChannel(channel);
            }
          }
        )
        .subscribe();

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
    // We keep this for backward compatibility with the mock keys if needed,
    // but ideally activation should be handled via Stripe/Supabase.
    try {
      const { mode: activatedMode } = await validateAndActivateKey(key);
      
      // If we want to sync this to Supabase, we would do it here.
      // For now, we just update local state to allow immediate access if they use a mock key.
      const now = new Date();
      const newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      if (state.user) {
         let column = '';
         if (activatedMode === AnalysisMode.ARCHITECTURE) column = 'architecture_expiry';
         if (activatedMode === AnalysisMode.IDENTITY) column = 'identity_expiry';
         if (activatedMode === AnalysisMode.MARKETPLACE) column = 'marketplace_expiry';
         
         if (column) {
            await supabase.from('profiles').update({ [column]: newExpiry }).eq('id', state.user.id);
            await fetchSubscriptions(state.user.id);
         }
      }

      setState(prev => ({ 
        ...prev, 
        isKeyModalOpen: false, 
        error: null,
        mode: activatedMode === 'ALL' ? prev.mode : activatedMode as AnalysisMode
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Activation failed.";
      throw new Error(message);
    }
  };

  const closeKeyModal = () => setState(prev => ({ ...prev, isKeyModalOpen: false }));
  const openKeyModal = () => setState(prev => ({ ...prev, isKeyModalOpen: true }));
  const logout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, subscriptions: {}, user: null }));
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
