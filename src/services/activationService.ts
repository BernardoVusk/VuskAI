import { ActivationKey, PlanType, UserSubscriptions, AnalysisMode, ModeSubscription } from '../types';
import { supabase } from '../lib/supabaseClient';

export const fetchUserSubscriptions = async (): Promise<UserSubscriptions> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return {};

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('identity_expiry, architecture_expiry, marketplace_expiry')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) return {};

    const now = new Date();
    const subs: UserSubscriptions = {};

    const checkExpiry = (expiryDateStr: string | null, mode: AnalysisMode) => {
      if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        if (expiryDate > now) {
          subs[mode] = {
            isActive: true,
            plan: PlanType.PRO_30_DAYS, // Or derive from actual plan if stored
            startDate: new Date().toISOString(), // We don't have start date in DB currently, using now as placeholder
            expiresAt: expiryDate.toISOString(),
          };
        }
      }
    };

    checkExpiry(profile.identity_expiry, AnalysisMode.IDENTITY);
    checkExpiry(profile.architecture_expiry, AnalysisMode.ARCHITECTURE);
    checkExpiry(profile.marketplace_expiry, AnalysisMode.MARKETPLACE);
    
    // Lifestyle and Cinematic don't have DB columns yet, so they remain locked by default
    // unless we add them to the DB.

    return subs;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return {};
  }
};

// Keep local storage as fallback for the mock keys if needed, but prefer DB
const STORAGE_KEY = 'vusk_subscriptions_v2';

export const getLocalSubscriptions = (): UserSubscriptions => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  try {
    const subs = JSON.parse(stored) as UserSubscriptions;
    const now = new Date();
    
    const activeSubs: UserSubscriptions = {};
    Object.entries(subs).forEach(([mode, sub]) => {
      if (sub && new Date(sub.expiresAt) > now) {
        activeSubs[mode as AnalysisMode] = sub;
      }
    });
    
    if (Object.keys(activeSubs).length !== Object.keys(subs).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSubs));
    }
    
    return activeSubs;
  } catch {
    return {};
  }
};

// Mock database of keys
const MOCK_KEYS: Record<string, ActivationKey> = {
  // Identity Keys
  'ID-TRIAL-2024': { key: 'ID-TRIAL-2024', plan: PlanType.TRIAL, mode: AnalysisMode.IDENTITY, durationDays: 1, isUsed: false, createdAt: new Date().toISOString() },
  'ID-PRO-30D': { key: 'ID-PRO-30D', plan: PlanType.PRO_30_DAYS, mode: AnalysisMode.IDENTITY, durationDays: 30, isUsed: false, createdAt: new Date().toISOString() },
  
  // Lifestyle Keys
  'LIFE-TRIAL-2024': { key: 'LIFE-TRIAL-2024', plan: PlanType.TRIAL, mode: AnalysisMode.LIFESTYLE, durationDays: 1, isUsed: false, createdAt: new Date().toISOString() },
  
  // Cinematic Keys
  'CINE-PRO-7D': { key: 'CINE-PRO-7D', plan: PlanType.PRO_7_DAYS, mode: AnalysisMode.CINEMATIC, durationDays: 7, isUsed: false, createdAt: new Date().toISOString() },
  
  // Marketplace Keys
  'MARKET-PRO-30D': { key: 'MARKET-PRO-30D', plan: PlanType.PRO_30_DAYS, mode: AnalysisMode.MARKETPLACE, durationDays: 30, isUsed: false, createdAt: new Date().toISOString() },
  
  // Architecture Keys
  'ARCH-PRO-30D': { key: 'ARCH-PRO-30D', plan: PlanType.PRO_30_DAYS, mode: AnalysisMode.ARCHITECTURE, durationDays: 30, isUsed: false, createdAt: new Date().toISOString() },

  // Master Key (All Access)
  'VUSK-MASTER-KEY': { key: 'VUSK-MASTER-KEY', plan: PlanType.PRO_30_DAYS, mode: 'ALL', durationDays: 30, isUsed: false, createdAt: new Date().toISOString() },
};

export const validateAndActivateKey = async (inputKey: string): Promise<{ mode: AnalysisMode | 'ALL', subscription: ModeSubscription }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const keyData = MOCK_KEYS[inputKey];

  if (!keyData) {
    throw new Error("Invalid activation key.");
  }

  // In a real app, we would check if the key is already used in the DB.
  if (keyData.isUsed) {
     throw new Error("This key has already been used.");
  }

  const startDate = new Date();
  const expiresAt = new Date(startDate);
  expiresAt.setDate(startDate.getDate() + keyData.durationDays);

  const newSubscription: ModeSubscription = {
    isActive: true,
    plan: keyData.plan,
    startDate: startDate.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const currentSubs = getLocalSubscriptions();

  if (keyData.mode === 'ALL') {
    // Activate for all modes
    Object.values(AnalysisMode).forEach(mode => {
      currentSubs[mode] = newSubscription;
    });
  } else {
    // Activate for specific mode
    currentSubs[keyData.mode] = newSubscription;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSubs));
  
  return { mode: keyData.mode, subscription: newSubscription };
};

export const clearSubscriptions = () => {

  localStorage.removeItem(STORAGE_KEY);
};

