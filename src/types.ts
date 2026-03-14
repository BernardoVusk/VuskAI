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
  ADMIN_KEYS = 'ADMIN_KEYS',
  SETTINGS = 'SETTINGS',
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

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

export interface AcademyLesson {
  id: string;
  module_id: string;
  title: string;
  video_id: string;
  description: string;
  order: number;
  created_at: string;
}

export interface NeuralLibraryItem {
  id: string;
  name: string;
  prompt_text: string;
  image_before_url: string;
  image_after_url: string;
  video_url?: string;
  category: string;
  type: 'image' | 'video';
  analysis_mode?: string;
  tutorial_url?: string;
  created_at: string;
}
