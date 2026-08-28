'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, FileNode } from '../types/project';
import { 
  ProjectConfig, 
  GenerationStatus, 
  AIProviderType, 
  AIProviderConfig,
  Bookmark,
  Note,
  ChatMessage,
  StudyAnalytics,
  SkillProgress
} from '../types/ai';
import { generateProject } from '../utils/ai/generator';

interface ProjectContextType {
  userProjects: Project[];
  activeProject: Project | null;
  generationStatus: GenerationStatus;
  apiKeys: Record<string, string>;
  activeStepLog: string;
  bookmarks: Bookmark[];
  notes: Note[];
  chats: Record<string, ChatMessage[]>;
  studyAnalytics: Record<string, StudyAnalytics>;
  activeEditorTabs: Record<string, string[]>;
  activeTabKeys: Record<string, string>;
  currentLessonIndex: Record<string, number>;
  
  loadProject: (id: string) => boolean;
  createProject: (config: ProjectConfig, providerType: AIProviderType) => Promise<string | null>;
  updateFileContent: (path: string, content: string) => void;
  updateProject: (project: Project) => void;
  markLessonComplete: (lessonId: string) => void;
  deleteProject: (id: string) => void;
  saveApiKeys: (keys: Record<string, string>) => void;
  
  // Bookmarks
  addBookmark: (type: Bookmark['type'], title: string, pathOrId: string) => void;
  removeBookmark: (id: string) => void;
  
  // Notes
  addNote: (title: string, content: string, tags: string[], linkedFile?: string, linkedLessonId?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Chat History
  addChatMessage: (role: ChatMessage['role'], content: string) => void;
  pinChatMessage: (msgId: string) => void;
  deleteChatMessage: (msgId: string) => void;
  clearChatHistory: () => void;
  
  // Editor Tabs
  openEditorTab: (path: string) => void;
  closeEditorTab: (path: string) => void;
  setActiveEditorTab: (path: string) => void;
  
  // Lesson Progress
  setCurrentLessonIndex: (index: number) => void;
  updateAnalytics: (updates: Partial<StudyAnalytics>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeStepLog, setActiveStepLog] = useState('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  
  // Learning Engine State Memory
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [studyAnalytics, setStudyAnalytics] = useState<Record<string, StudyAnalytics>>({});
  const [activeEditorTabs, setActiveEditorTabs] = useState<Record<string, string[]>>({});
  const [activeTabKeys, setActiveTabKeys] = useState<Record<string, string>>({});
  const [currentLessonIndex, setCurrentLessonIndexMap] = useState<Record<string, number>>({});

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    isGenerating: false,
    currentStep: 0,
    steps: [
      { id: 'planner', label: 'Milestones Planning', status: 'idle', logs: [] },
      { id: 'architecture', label: 'System Architecture Design', status: 'idle', logs: [] },
      { id: 'database', label: 'Database Design', status: 'idle', logs: [] },
      { id: 'folder', label: 'Folder Scaffolding', status: 'idle', logs: [] },
      { id: 'api', label: 'API Specifications', status: 'idle', logs: [] },
      { id: 'lesson', label: 'Lessons Generation', status: 'idle', logs: [] },
      { id: 'career', label: 'Career Optimization', status: 'idle', logs: [] },
      { id: 'documentation', label: 'README Compilation', status: 'idle', logs: [] }
    ]
  });

  // Load everything on startup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load projects
    const savedProjects = localStorage.getItem('user_projects');
    if (savedProjects) {
      setUserProjects(JSON.parse(savedProjects));
    }

    // Load API Keys
    const keys: Record<string, string> = {};
    const providerKeys = ['openai_api_key', 'gemini_api_key', 'claude_api_key', 'groq_api_key', 'ollama_url', 'openrouter_api_key'];
    providerKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) keys[k] = val;
    });
    setApiKeys(keys);

    // Load Bookmarks, Notes, Chats, Analytics, Editor Tabs, Lesson Positions
    setBookmarks(JSON.parse(localStorage.getItem('user_bookmarks') || '[]'));
    setNotes(JSON.parse(localStorage.getItem('user_notes') || '[]'));
    setChats(JSON.parse(localStorage.getItem('user_chats') || '{}'));
    setStudyAnalytics(JSON.parse(localStorage.getItem('user_analytics') || '{}'));
    setActiveEditorTabs(JSON.parse(localStorage.getItem('user_editor_tabs') || '{}'));
    setActiveTabKeys(JSON.parse(localStorage.getItem('user_active_tab') || '{}'));
    setCurrentLessonIndexMap(JSON.parse(localStorage.getItem('user_active_lesson') || '{}'));
  }, []);

  const saveProjectsList = (newList: Project[]) => {
    setUserProjects(newList);
    localStorage.setItem('user_projects', JSON.stringify(newList));
  };

  const loadProject = (id: string): boolean => {
    const found = userProjects.find(p => p.id === id);
    if (found) {
      setActiveProject(found);
      
      // Initialize analytics for project if not existing
      if (id && !studyAnalytics[id]) {
        const defaultAnalytics: StudyAnalytics = {
          hoursStudied: 0.5,
          estimatedRemainingTime: found.lessons.length * 1.5,
          quizAverageScore: 0,
          challengesCompleted: 0,
          weakConcepts: [],
          strongConcepts: [],
          skillsProgress: found.skills.map((s, idx) => ({
            skill: s,
            level: idx === 0 ? 30 : idx === 1 ? 15 : 0,
            category: idx < 2 ? 'frontend' : 'backend'
          }))
        };
        const updated = { ...studyAnalytics, [id]: defaultAnalytics };
        setStudyAnalytics(updated);
        localStorage.setItem('user_analytics', JSON.stringify(updated));
      }
      
      return true;
    }
    return false;
  };

  const createProject = async (config: ProjectConfig, providerType: AIProviderType): Promise<string | null> => {
    const cleanSteps = generationStatus.steps.map(s => ({ ...s, status: 'idle' as const, logs: [] }));
    setGenerationStatus({
      isGenerating: true,
      currentStep: 0,
      steps: cleanSteps
    });
    setActiveStepLog('Initializing compilation process...');

    const providerConfig: AIProviderConfig = {
      provider: providerType,
      apiKey: apiKeys[`${providerType}_api_key`] || '',
      baseUrl: providerType === 'ollama' ? apiKeys['ollama_url'] : undefined
    };

    try {
      const generated = await generateProject(config, providerConfig, (stepIdx, logMessage) => {
        setGenerationStatus(prev => {
          const updatedSteps = [...prev.steps];
          if (stepIdx > 0 && stepIdx <= updatedSteps.length) {
            updatedSteps[stepIdx - 1].status = 'completed';
          }
          if (stepIdx < updatedSteps.length) {
            updatedSteps[stepIdx].status = 'running';
          }
          return {
            ...prev,
            currentStep: stepIdx,
            steps: updatedSteps
          };
        });
        setActiveStepLog(logMessage);
      });

      // Update final step as completed
      setGenerationStatus(prev => {
        const steps = prev.steps.map(s => ({ ...s, status: 'completed' as const }));
        return {
          ...prev,
          currentStep: steps.length,
          steps,
          isGenerating: false
        };
      });

      // Add to user projects
      const updatedList = [generated, ...userProjects];
      saveProjectsList(updatedList);
      setActiveProject(generated);
      
      return generated.id;

    } catch (err: any) {
      console.error('Project Generation Failed:', err);
      setGenerationStatus(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || 'Generation aborted due to execution error.'
      }));
      return null;
    }
  };

  const updateFileContent = (path: string, content: string) => {
    if (!activeProject) return;

    const updateInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.path === path && n.type === 'file') {
          return { ...n, content };
        }
        if (n.children) {
          return { ...n, children: updateInTree(n.children) };
        }
        return n;
      });
    };

    const updatedFiles = updateInTree(activeProject.files);
    const updatedProj = { ...activeProject, files: updatedFiles };
    setActiveProject(updatedProj);

    const index = userProjects.findIndex(p => p.id === activeProject.id);
    if (index !== -1) {
      const list = [...userProjects];
      list[index] = updatedProj;
      saveProjectsList(list);
    }
  };

  const updateProject = (updatedProj: Project) => {
    setActiveProject(updatedProj);
    const index = userProjects.findIndex(p => p.id === updatedProj.id);
    if (index !== -1) {
      const list = [...userProjects];
      list[index] = updatedProj;
      saveProjectsList(list);
    }
  };

  const markLessonComplete = (lessonId: string) => {
    if (!activeProject) return;

    const updatedLessons = activeProject.lessons.map(l => 
      l.id === lessonId ? { ...l, completed: true } : l
    );
    const updatedProj = { ...activeProject, lessons: updatedLessons };
    setActiveProject(updatedProj);

    const index = userProjects.findIndex(p => p.id === activeProject.id);
    if (index !== -1) {
      const list = [...userProjects];
      list[index] = updatedProj;
      saveProjectsList(list);
    }

    // Award XP
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const prof = JSON.parse(savedProfile);
      prof.xp += 200; // Lesson XP
      prof.level = Math.floor(prof.xp / 1000) + 1;
      localStorage.setItem('user_profile', JSON.stringify(prof));
    }

    // Update Analytics Completed Count
    const pId = activeProject.id;
    const currentAnal = studyAnalytics[pId];
    if (currentAnal) {
      const completedCount = updatedLessons.filter(l => l.completed).length;
      updateAnalytics({
        challengesCompleted: completedCount,
        hoursStudied: currentAnal.hoursStudied + 0.4,
        estimatedRemainingTime: Math.max(0, currentAnal.estimatedRemainingTime - 0.5)
      });
    }
  };

  const deleteProject = (id: string) => {
    const list = userProjects.filter(p => p.id !== id);
    saveProjectsList(list);
    if (activeProject?.id === id) {
      setActiveProject(null);
    }

    // Clean other keys
    const removeKey = (key: string) => {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      delete saved[id];
      localStorage.setItem(key, JSON.stringify(saved));
    };
    removeKey('user_chats');
    removeKey('user_analytics');
    removeKey('user_editor_tabs');
    removeKey('user_active_tab');
    removeKey('user_active_lesson');
  };

  const saveApiKeys = (keys: Record<string, string>) => {
    setApiKeys(keys);
    Object.entries(keys).forEach(([k, val]) => {
      localStorage.setItem(k, val);
    });
  };

  // ==================== LEARNING ENGINE STATE ACTIONS ====================

  const addBookmark = (type: Bookmark['type'], title: string, pathOrId: string) => {
    if (!activeProject) return;
    const newBookmark: Bookmark = {
      id: 'bm-' + Math.random().toString(36).substring(2, 11),
      type,
      title,
      pathOrId,
      projectId: activeProject.id,
      timestamp: Date.now()
    };
    const updated = [newBookmark, ...bookmarks];
    setBookmarks(updated);
    localStorage.setItem('user_bookmarks', JSON.stringify(updated));
  };

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('user_bookmarks', JSON.stringify(updated));
  };

  const addNote = (title: string, content: string, tags: string[], linkedFile?: string, linkedLessonId?: string) => {
    if (!activeProject) return;
    const newNote: Note = {
      id: 'nt-' + Math.random().toString(36).substring(2, 11),
      title,
      content,
      tags,
      isPinned: false,
      linkedFile,
      linkedLessonId,
      projectId: activeProject.id,
      timestamp: Date.now()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('user_notes', JSON.stringify(updated));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotes(updated);
    localStorage.setItem('user_notes', JSON.stringify(updated));
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('user_notes', JSON.stringify(updated));
  };

  const addChatMessage = (role: ChatMessage['role'], content: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const projectMsgs = chats[pId] || [];
    const newMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 11),
      role,
      content,
      timestamp: Date.now()
    };
    const updatedMsgs = [...projectMsgs, newMsg];
    const updatedChats = { ...chats, [pId]: updatedMsgs };
    setChats(updatedChats);
    localStorage.setItem('user_chats', JSON.stringify(updatedChats));
  };

  const pinChatMessage = (msgId: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const projectMsgs = chats[pId] || [];
    const updatedMsgs = projectMsgs.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m);
    const updatedChats = { ...chats, [pId]: updatedMsgs };
    setChats(updatedChats);
    localStorage.setItem('user_chats', JSON.stringify(updatedChats));
  };

  const deleteChatMessage = (msgId: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const projectMsgs = chats[pId] || [];
    const updatedMsgs = projectMsgs.filter(m => m.id !== msgId);
    const updatedChats = { ...chats, [pId]: updatedMsgs };
    setChats(updatedChats);
    localStorage.setItem('user_chats', JSON.stringify(updatedChats));
  };

  const clearChatHistory = () => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const updatedChats = { ...chats, [pId]: [] };
    setChats(updatedChats);
    localStorage.setItem('user_chats', JSON.stringify(updatedChats));
  };

  const openEditorTab = (path: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const tabs = activeEditorTabs[pId] || [];
    if (!tabs.includes(path)) {
      const updatedTabs = { ...activeEditorTabs, [pId]: [...tabs, path] };
      setActiveEditorTabs(updatedTabs);
      localStorage.setItem('user_editor_tabs', JSON.stringify(updatedTabs));
    }
    setActiveEditorTab(path);
  };

  const closeEditorTab = (path: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const tabs = activeEditorTabs[pId] || [];
    const updated = tabs.filter(t => t !== path);
    const updatedTabs = { ...activeEditorTabs, [pId]: updated };
    setActiveEditorTabs(updatedTabs);
    localStorage.setItem('user_editor_tabs', JSON.stringify(updatedTabs));

    if (activeTabKeys[pId] === path) {
      const nextActive = updated.length > 0 ? updated[updated.length - 1] : '';
      setActiveEditorTab(nextActive);
    }
  };

  const setActiveEditorTab = (path: string) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const updatedActive = { ...activeTabKeys, [pId]: path };
    setActiveTabKeys(updatedActive);
    localStorage.setItem('user_active_tab', JSON.stringify(updatedActive));
  };

  const setCurrentLessonIndex = (index: number) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const updatedPos = { ...currentLessonIndex, [pId]: index };
    setCurrentLessonIndexMap(updatedPos);
    localStorage.setItem('user_active_lesson', JSON.stringify(updatedPos));
  };

  const updateAnalytics = (updates: Partial<StudyAnalytics>) => {
    if (!activeProject) return;
    const pId = activeProject.id;
    const currentAnal = studyAnalytics[pId] || {
      hoursStudied: 0.5,
      estimatedRemainingTime: 12,
      quizAverageScore: 0,
      challengesCompleted: 0,
      weakConcepts: [],
      strongConcepts: [],
      skillsProgress: []
    };
    const updated = { ...studyAnalytics, [pId]: { ...currentAnal, ...updates } };
    setStudyAnalytics(updated);
    localStorage.setItem('user_analytics', JSON.stringify(updated));
  };

  return (
    <ProjectContext.Provider value={{
      userProjects,
      activeProject,
      generationStatus,
      apiKeys,
      activeStepLog,
      bookmarks,
      notes,
      chats,
      studyAnalytics,
      activeEditorTabs,
      activeTabKeys,
      currentLessonIndex,
      
      loadProject,
      createProject,
      updateFileContent,
      updateProject,
      markLessonComplete,
      deleteProject,
      saveApiKeys,
      
      // Bookmarks
      addBookmark,
      removeBookmark,
      
      // Notes
      addNote,
      updateNote,
      deleteNote,
      
      // Chat Message
      addChatMessage,
      pinChatMessage,
      deleteChatMessage,
      clearChatHistory,
      
      // Editor Tabs
      openEditorTab,
      closeEditorTab,
      setActiveEditorTab,
      
      // Lesson Nav
      setCurrentLessonIndex,
      updateAnalytics
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
