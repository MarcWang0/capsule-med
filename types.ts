export interface Capsule {
  id: number;
  title: string;
  subject: string;
  theme: string;
  videoUrl?: string; // URL to YouTube, Vimeo, or MP4
  duration?: string;
  description?: string;
}

export interface ThemeGroup {
  name: string;
  capsules: Capsule[];
}

export interface SubjectGroup {
  name: string;
  themes: ThemeGroup[];
}

export enum ViewMode {
  DEFAULT = 'DEFAULT',
  FOCUS = 'FOCUS', // Anti-scroll / Cinema mode
}

export enum TimerMode {
  WORK = 'WORK',
  BREAK = 'BREAK',
}

// --- Types pour le Quiz ---

export interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  explanation: string; // Le texte affiché lors de la correction
}

export interface QuizData {
  capsuleId: number;
  questions: QuizQuestion[];
}