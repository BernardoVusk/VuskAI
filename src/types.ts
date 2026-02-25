export interface AnalysisResult {
  physicalDescription: string;
  suggestedPrompt: string;
  metadata?: Record<string, unknown>;
}

export enum AnalysisMode {
  IDENTITY = 'IDENTITY',
  LIFESTYLE = 'LIFESTYLE',
  CINEMATIC = 'CINEMATIC',
  MARKETPLACE = 'MARKETPLACE',
  ARCHITECTURE = 'ARCHITECTURE',
}

export interface AnalysisError {
  code: string;
  message: string;
  details?: unknown;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface GenerationConfig {
  scenario: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  style: string;
}

export enum PlanType {
  TRIAL = 'TRIAL',
  PRO_1_DAY = 'PRO_1_DAY',
  PRO_7_DAYS = 'PRO_7_DAYS',
  PRO_30_DAYS = 'PRO_30_DAYS',
}

export interface ActivationKey {
  key: string;
  plan: PlanType;
  mode: AnalysisMode | 'ALL';
  durationDays: number;
  isUsed: boolean;
  createdAt: string;
}

export interface ModeSubscription {
  isActive: boolean;
  plan: PlanType;
  startDate: string;
  expiresAt: string;
}

export type UserSubscriptions = Partial<Record<AnalysisMode, ModeSubscription>>;
