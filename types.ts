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