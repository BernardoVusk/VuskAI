import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisMode, AnalysisResult, AppStatus, UserSubscriptions, PlanType } from '../types';
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
import { fetchUserSubscriptions, getLocalSubscriptions, validateAndActivateKey, clearSubscriptions } from '../services/activationService';
import { supabase } from '../lib/supabaseClient';

interface UseArchRenderState {
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
  isAdmin: boolean;
}

export const useArchRender = () => {
  const [state, setState] = useState<UseArchRenderState>({
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
    isAdmin: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSubscriptions = async (userId: string) => {
    try {
      // 1. Fetch from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const now = new Date();
      const subs: UserSubscriptions = {};

      if (!error && data) {
        // Check Architecture
        if (data.architecture_expiry && new Date(data.architecture_expiry) > now) {
          subs[AnalysisMode.ARCHITECTURE] = {
            isActive: true,
            plan: PlanType.PRO_30_DAYS,
            startDate: new Date().toISOString(),
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

        // Check Lifestyle
        if (data.lifestyle_expiry && new Date(data.lifestyle_expiry) > now) {
          subs[AnalysisMode.LIFESTYLE] = {
            isActive: true,
            plan: PlanType.PRO_30_DAYS,
            startDate: new Date().toISOString(),
            expiresAt: data.lifestyle_expiry,
          };
        }

        // Check Cinematic
        if (data.cinematic_expiry && new Date(data.cinematic_expiry) > now) {
          subs[AnalysisMode.CINEMATIC] = {
            isActive: true,
            plan: PlanType.PRO_30_DAYS,
            startDate: new Date().toISOString(),
            expiresAt: data.cinematic_expiry,
          };
        }
      }

      // 2. Merge with Local Storage
      // If logged in, we ONLY trust the database to prevent inheritance from other sessions
      const mergedSubs = userId ? subs : getLocalSubscriptions();

      setState(prev => ({ ...prev, subscriptions: mergedSubs }));
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      // Fallback to local only if DB fails
      setState(prev => ({ ...prev, subscriptions: getLocalSubscriptions() }));
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      const isAdmin = user?.email === 'bernardomorais28@yahoo.com' || user?.email === 'espetoclips@gmail.com' || user?.user_metadata?.role === 'admin';
      setState(prev => ({ ...prev, user, isAdmin }));
      if (user) {
        fetchSubscriptions(user.id);
      } else {
        setState(prev => ({ ...prev, subscriptions: {} }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      const isAdmin = user?.email === 'bernardomorais28@yahoo.com' || user?.email === 'espetoclips@gmail.com' || user?.user_metadata?.role === 'admin';
      setState(prev => ({ ...prev, user, isAdmin }));
      
      if (user) {
        if (event === 'SIGNED_IN') {
          // Clear local subscriptions on sign in to prevent inheritance from previous sessions
          clearSubscriptions();
        }
        fetchSubscriptions(user.id);
      } else {
        // Clear subscriptions when logged out
        clearSubscriptions();
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
      let historyId: string | null = null;
      try {
        const { data: historyData, error: historyError } = await supabase
          .from('history')
          .insert({
            user_id: state.user.id,
            mode: state.mode,
            status: 'processando'
          })
          .select()
          .single();

        if (!historyError && historyData) {
          historyId = historyData.id;
          console.log('Analysis history record created:', historyId);
        } else {
          console.warn('Could not create history record, proceeding anyway:', historyError);
        }
      } catch (err) {
        console.warn('Supabase history insert failed, proceeding anyway:', err);
      }

      // 2. Call Gemini directly from frontend
      let analysisResult: AnalysisResult;
      
      console.log('Starting Gemini analysis for mode:', state.mode);
      try {
        switch (state.mode) {
          case AnalysisMode.IDENTITY:
            analysisResult = await analyzeReferenceImage(base64, mimeType);
            break;
          case AnalysisMode.LIFESTYLE:
            analysisResult = await analyzeLifestyleImage(base64, mimeType);
            break;
          case AnalysisMode.CINEMATIC:
            analysisResult = await analyzeCinematicImage(base64, mimeType);
            break;
          case AnalysisMode.MARKETPLACE:
            analysisResult = await analyzeMarketplaceImage(base64, mimeType);
            break;
          case AnalysisMode.ARCHITECTURE:
            analysisResult = await analyzeArchitectureImage(base64, mimeType);
            break;
          default:
            throw new Error("Modo de análise inválido");
        }
      } catch (geminiErr: any) {
        console.error('Gemini Analysis Error:', geminiErr);
        throw new Error(`Erro na análise da IA: ${geminiErr.message || 'Erro desconhecido'}`);
      }

      console.log('Gemini analysis completed:', analysisResult);

      // 3. Update Supabase with the result
      if (historyId) {
        console.log('Updating Supabase history record...');
        try {
          const { error: updateError } = await supabase
            .from('history')
            .update({ 
              status: 'concluído', 
              result: analysisResult 
            })
            .eq('id', historyId);

          if (updateError) {
            console.error('Supabase update error:', updateError);
          } else {
            console.log('Supabase history record updated successfully');
          }
        } catch (err) {
          console.warn('Supabase history update failed:', err);
        }
      }

      setState(prev => ({ ...prev, analysis: analysisResult, status: AppStatus.REVIEW }));

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Analysis failed due to an unknown error.";
      console.error('Analysis error:', error);
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
      const { mode: activatedMode, subscription } = await validateAndActivateKey(key);
      
      // Sync to Supabase if user is logged in and mode has a column
      if (state.user) {
        const updates: any = {};
        const expiry = subscription.expiresAt;

        if (activatedMode === 'ALL') {
          updates.architecture_expiry = expiry;
          updates.identity_expiry = expiry;
          updates.marketplace_expiry = expiry;
          updates.lifestyle_expiry = expiry;
          updates.cinematic_expiry = expiry;
        } else {
          if (activatedMode === AnalysisMode.ARCHITECTURE) updates.architecture_expiry = expiry;
          if (activatedMode === AnalysisMode.IDENTITY) updates.identity_expiry = expiry;
          if (activatedMode === AnalysisMode.MARKETPLACE) updates.marketplace_expiry = expiry;
          if (activatedMode === AnalysisMode.LIFESTYLE) updates.lifestyle_expiry = expiry;
          if (activatedMode === AnalysisMode.CINEMATIC) updates.cinematic_expiry = expiry;
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('profiles').update(updates).eq('id', state.user.id);
        }
        
        await fetchSubscriptions(state.user.id);
      } else {
        // If not logged in, just update state from local storage
        setState(prev => ({ ...prev, subscriptions: getLocalSubscriptions() }));
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
    clearSubscriptions();
    setState(prev => ({ ...prev, subscriptions: {}, user: null }));
  };

  const resetError = () => setState(prev => ({ ...prev, error: null, status: AppStatus.IDLE }));

  const clearImage = () => {
    setState(prev => ({
      ...prev,
      image: null,
      analysis: null,
      resultImage: null,
      status: AppStatus.IDLE,
      error: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
    handleRefinePrompt,
    clearImage
  };
};
