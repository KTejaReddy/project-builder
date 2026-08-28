export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  ai: string;
  deployment: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  estimatedHours: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed index of correct option
  explanation: string;
}

export interface LessonChallenge {
  title: string;
  instructions: string;
  initialCode: string;
  solution: string;
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  explanation: string;
  diagram?: string; // HTML/SVG string or description
  theory: string;
  code: string;
  path: string; // Associated file path (e.g. "src/components/ResumeForm.tsx")
  whyWeDoThis: string;
  commonMistakes: string[];
  bestPractices: string[];
  quiz: QuizQuestion[];
  challenge: LessonChallenge;
  completed: boolean;
}

export interface APIDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  headers?: Record<string, string>;
  requestBody?: string; // Pretty formatted JSON
  responseBody: string; // Pretty formatted JSON
  statusCodes: { code: number; description: string }[];
}

export interface DatabaseSchema {
  table: string;
  columns: {
    name: string;
    type: string;
    key?: 'PK' | 'FK';
    nullable?: boolean;
    references?: string;
  }[];
  sql: string;
}

export interface ArchitectureDiagrams {
  systemDiagram: string; // SVG or mermaid markup
  databaseDiagram: string;
  flowDiagram: string;
  componentDiagram: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  topic: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'ready' | 'in-progress' | 'review' | 'testing' | 'completed' | 'blocked';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedHours: number;
  assignedAgent: string;
  sprint: number;
  files: string[];
  acceptanceCriteria: string[];
}

export interface BugReport {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in-progress' | 'resolved';
  module: string;
  files: string[];
  assignedAgent: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  techStack: TechStack;
  estimatedTime: string;
  xpReward: number;
  skills: string[];
  objectives: string[];
  features: string[];
  roadmap: Milestone[];
  files: FileNode[];
  lessons: Lesson[];
  apiDocs: APIDoc[];
  dbSchemas: DatabaseSchema[];
  architecture: ArchitectureDiagrams;
  interviewQuestions: InterviewQuestion[];
  resumeBulletPoints: string[];
  linkedinDescription: string;
  readme: string;
  generationMode?: 'fast' | 'learn';
  tasks?: ProjectTask[];
  bugTracker?: BugReport[];
  sprintIndex?: number;
  srsDoc?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  completedProjectsCount: number;
  badges: string[];
  joinedDate: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  level: number;
  avatar: string;
  isCurrentUser?: boolean;
}
