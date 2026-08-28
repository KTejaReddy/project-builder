import { Project, Difficulty, TechStack } from './project';

export type AIProviderType = 'openai' | 'gemini' | 'claude' | 'groq' | 'ollama' | 'openrouter' | 'mock';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string; // For Ollama or custom endpoints
  modelName?: string;
  temperature?: number;
  topP?: number;
  numCtx?: number;
  maxTokens?: number;
  streaming?: boolean;
  keepAlive?: string;
}

export interface ProjectConfig {
  name: string;
  description: string;
  difficulty: Difficulty;
  techStack: TechStack;
  features?: string[];
  generationMode?: 'fast' | 'learn';
  options?: {
    explainCode?: boolean;
    diagnostics?: boolean;
    quizzes?: boolean;
  };
}

export interface GenerationStep {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: string[];
}

export interface GenerationStatus {
  isGenerating: boolean;
  currentStep: number;
  steps: GenerationStep[];
  error?: string;
}

export interface AIResponseParserResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== LEARNING ENGINE EXTENSIONS ====================

export type BookmarkType = 'file' | 'lesson' | 'doc' | 'architecture' | 'database' | 'api' | 'chat';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  title: string;
  pathOrId: string;
  projectId: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  linkedFile?: string;
  linkedLessonId?: string;
  projectId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isPinned?: boolean;
}

export interface SkillProgress {
  skill: string;
  level: number; // 0 to 100
  category: 'frontend' | 'backend' | 'database' | 'architecture' | 'security' | 'other';
}

export interface StudyAnalytics {
  hoursStudied: number;
  estimatedRemainingTime: number; // Hours
  skillsProgress: SkillProgress[];
  weakConcepts: string[];
  strongConcepts: string[];
  quizAverageScore: number;
  challengesCompleted: number;
}

export interface LessonProgressState {
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  challengeAttempts?: number;
  hintsUsed?: number;
  timeSpent?: number; // Minutes
}
