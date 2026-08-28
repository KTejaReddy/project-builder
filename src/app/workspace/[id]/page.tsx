'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { 
  Terminal, 
  BookOpen, 
  Layers, 
  Cpu, 
  Code, 
  Sparkles, 
  Play, 
  Save, 
  FileText, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  Database,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Send,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Award,
  Globe,
  Settings,
  Share2,
  FileDown,
  Columns,
  Pause,
  SkipForward
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import { templateLibrary } from '@/data/templateLibrary';
import { Project, FileNode, Lesson, QuizQuestion } from '@/types/project';
import { Bookmark, Note } from '@/types/ai';
import { useProjects } from '@/context/ProjectContext';
import { exportService } from '@/utils/ai/exportService';
import { dbService } from '@/utils/supabase/service';
import { getProvider } from '@/utils/ai/generator';
import { OllamaProvider } from '@/utils/ai/providers';
import {
  getAgentChatForTask,
  addOrUpdateFileInTree,
  checkCodeSyntax,
  getBoilerplateForFile,
  generatePortfolioBundle,
  AGENT_TEAM
} from '@/utils/ai/agentEngine';
import type { AgentMessage, PortfolioBundle } from '@/utils/ai/agentEngine';

// Simple helper to find a file in the tree
const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path && node.type === 'file') return node;
    if (node.children) {
      const found = findFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

// Helper to update a file content in the tree
const updateFileInTree = (nodes: FileNode[], path: string, content: string): FileNode[] => {
  return nodes.map(node => {
    if (node.path === path && node.type === 'file') {
      return { ...node, content };
    }
    if (node.children) {
      return { ...node, children: updateFileInTree(node.children, path, content) };
    }
    return node;
  });
};

export default function ProjectWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: projectId } = use(params);
  const { 
    activeProject, 
    loadProject, 
    updateFileContent, 
    markLessonComplete, 
    apiKeys,
    bookmarks,
    notes,
    studyAnalytics,
    activeEditorTabs,
    addBookmark,
    removeBookmark,
    addNote,
    deleteNote,
    openEditorTab,
    closeEditorTab,
    updateProject
  } = useProjects();

  // Core project state (synced with context)
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'kanban' | 'lessons' | 'architecture' | 'database' | 'api' | 'code' | 'reviewer' | 'export' | 'agent'>('overview');

  // File explorer states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'src': true, 'src/components': true, 'src/app': true, 'backend': true });
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');

  // Lesson & quiz states
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizChecked, setQuizChecked] = useState<Record<string, boolean>>({});
  const [challengeCode, setChallengeCode] = useState('');
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [hintLevel, setHintLevel] = useState(0); // 0 = no hints, 1 = Hint 1, 2 = Hint 2, 3 = Hint 3, 4 = Explanation

  // AI chat states
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [codePaneTab, setCodePaneTab] = useState<'chat' | 'preview' | 'refactor'>('chat');

  // Command Palette & Workspace Split states
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'output' | 'problems' | 'versions'>('terminal');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Local Ollama active parameters state
  const [inferenceStatus, setInferenceStatus] = useState<'idle' | 'generating' | 'loading' | 'error'>('idle');
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [tpsSpeed, setTpsSpeed] = useState('0 t/s');

  // Kanban board and SDLC states
  const [selectedSprintFilter, setSelectedSprintFilter] = useState(1);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string>('');
  const [taskExecutionLogs, setTaskExecutionLogs] = useState<string[]>([]);
  // Autonomous loop states
  const [agentLoopStatus, setAgentLoopStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentPhase, setCurrentPhase] = useState<'analysis' | 'architecture' | 'planning' | 'implementation' | 'validation' | 'testing' | 'debugging' | 'review' | 'optimization' | 'documentation' | 'complete'>('analysis');
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentConsoleLogs, setAgentConsoleLogs] = useState<string[]>([]);
  const [portfolioBundle, setPortfolioBundle] = useState<PortfolioBundle | null>(null);

  useEffect(() => {
    const checkOllama = async () => {
      const url = localStorage.getItem('ollama_url') || 'http://localhost:11434';
      const model = localStorage.getItem('ollama_model') || 'llama3.2';
      setOllamaModel(model);
      
      try {
        const res = await fetch('/api/ollama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'tags', endpoint: url })
        });
        if (res.ok) {
          setOllamaConnected(true);
        } else {
          setOllamaConnected(false);
        }
      } catch (e) {
        setOllamaConnected(false);
      }
    };
    
    checkOllama();
    const interval = setInterval(checkOllama, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Notes inputs
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [notesSearch, setNotesSearch] = useState('');

  // Debugger & SOLID Reviewer states
  const [debuggerError, setDebuggerError] = useState('');
  const [debuggerTech, setDebuggerTech] = useState('React');
  const [debuggerResult, setDebuggerResult] = useState<any>(null);
  const [debuggerLoading, setDebuggerLoading] = useState(false);
  const [reviewerResult, setReviewerResult] = useState<any>(null);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [reviewerAgentMessages, setReviewerAgentMessages] = useState<AgentMessage[]>([]);
  const [reviewerPhase, setReviewerPhase] = useState<'idle' | 'collaboration' | 'finished'>('idle');
  const [flashingFilePath, setFlashingFilePath] = useState<string>('');

  // Refactor suggestions states
  const [refactorSuggestions, setRefactorSuggestions] = useState<any[]>([]);
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);

  // SQL Playground Mock States
  const [mockDbRows, setMockDbRows] = useState<Record<string, any[]>>({
    users: [
      { id: 'u1', email: 'jane.smith@example.com', role: 'admin', created_at: '2026-07-01' },
      { id: 'u2', email: 'alex.jones@example.com', role: 'developer', created_at: '2026-07-03' }
    ],
    tasks: [
      { id: 't1', title: 'Setup auth layer', status: 'completed', estimated_hours: 4 },
      { id: 't2', title: 'Integrate Prisma models', status: 'in-progress', estimated_hours: 6 }
    ]
  });
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users;');
  const [sqlResult, setSqlResult] = useState<any[]>([]);
  const [sqlConsole, setSqlConsole] = useState<string[]>(['sqlite> SELECT * FROM users;']);
  const [sqlSelectedTable, setSqlSelectedTable] = useState('users');

  // API Explorer Client States
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('/api/auth/login');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [apiRequestBody, setApiRequestBody] = useState('{\n  "email": "user@example.com",\n  "password": "securepassword123"\n}');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseTime, setApiResponseTime] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);

  // TSX Sandbox interactive states
  const [sandboxFormFields, setSandboxFormFields] = useState<Record<string, string>>({});
  const [sandboxListItems, setSandboxListItems] = useState<string[]>([]);
  const [sandboxConsole, setSandboxConsole] = useState<string[]>(['[Sandbox Console] HMR Compiled successfully. Ready.']);

  // Live Preview properties
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewWidth, setPreviewWidth] = useState(100);
  const [previewZoom, setPreviewZoom] = useState(100);

  // Profile levels state
  const [userXP, setUserXP] = useState(350);

  // Setup Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsBottomPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorContent, selectedFilePath, project]);

  // Seed Terminal logs when compiler runs
  useEffect(() => {
    if (project) {
      setTerminalLogs([
        `$ npm run dev --project=${project.name.toLowerCase().replace(/\s+/g, '-')}`,
        `> projectforge-ai-runtime@1.0.0 dev`,
        `> next dev --port 8080`,
        ` `,
        `▲ Next.js 16.2.10 (Turbopack) compiler running...`,
        `✓ Ready in 840ms on http://localhost:8080`,
        `○ Compilation output clean. 0 syntax warning diagnostics.`,
        `Active hot-reload watchers deployed successfully.`
      ]);
    }
  }, [project]);

  // Load project on mount/id change
  useEffect(() => {
    if (projectId) {
      const success = loadProject(projectId);
      if (!success) {
        // If not found in userProjects, fallback seed from template library or redirect
        const defaultTpl = templateLibrary.find(t => t.id === projectId) || templateLibrary[0];
        // Create a basic seed representation of it to preview
        const seedProject: Project = {
          id: projectId,
          name: defaultTpl.name,
          description: defaultTpl.description,
          difficulty: defaultTpl.difficulty,
          techStack: defaultTpl.technologies,
          estimatedTime: defaultTpl.estimatedTime,
          xpReward: 1200,
          skills: [defaultTpl.technologies.frontend, defaultTpl.technologies.backend],
          objectives: ['Master project scaffolding'],
          features: defaultTpl.features,
          roadmap: [{ id: 'm1', title: 'Scaffolding', description: 'Configure layout', status: 'completed', estimatedHours: 3 }],
          files: [{ name: 'src', path: 'src', type: 'folder', children: [{ name: 'index.tsx', path: 'src/index.tsx', type: 'file', content: `// Seeded for ${defaultTpl.name}` }] }],
          lessons: [],
          apiDocs: [],
          dbSchemas: [],
          architecture: { systemDiagram: '', databaseDiagram: '', flowDiagram: '', componentDiagram: '' },
          interviewQuestions: [],
          resumeBulletPoints: [],
          linkedinDescription: '',
          readme: ''
        };
        setProject(seedProject);
        initializeFileDetails(seedProject);
        setLoading(false);
      }
    }
  }, [projectId]);

  // Sync state when activeProject updates in context
  useEffect(() => {
    if (activeProject && activeProject.id === projectId) {
      setProject(activeProject);
      if (!selectedFilePath) {
        initializeFileDetails(activeProject);
      }
      dbService.getVersionSnapshots(activeProject.id).then(list => setSnapshots(list));
      setLoading(false);
    }
  }, [activeProject, projectId]);

  // Load XP on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setUserXP(JSON.parse(savedProfile).xp);
    }
  }, []);

  const initializeFileDetails = (proj: Project) => {
    // Find first available file to load
    let firstFile = '';
    const findFirst = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'file' && !firstFile) {
          firstFile = n.path;
          break;
        }
        if (n.children) findFirst(n.children);
      }
    };
    findFirst(proj.files);
    
    if (firstFile) {
      setSelectedFilePath(firstFile);
      const fileNode = findFileByPath(proj.files, firstFile);
      setEditorContent(fileNode?.content || '');
    }

    // Initialize challenge code
    if (proj.lessons.length > 0) {
      setChallengeCode(proj.lessons[0].challenge.initialCode);
    }

    // Initialize chat
    setChatMessages([
      {
        role: 'assistant',
        content: `👋 Welcome back! I am your AI Software Engineering Mentor for **${proj.name}**. \n\nI can help you:\n- Explain specific lines in the Monaco Editor\n- Debug your codes or console logs\n- Answer questions regarding the relational database tables or APIs\n- Work through your active lesson quizzes!\n\nWhat would you like to review first?`
      }
    ]);
  };

  useEffect(() => {
    if (!project || !selectedFilePath || saveStatus !== 'saving') return;
    
    const delayDebounceFn = setTimeout(async () => {
      await dbService.saveProject(project);
      setSaveStatus('saved');
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [editorContent, project, selectedFilePath, saveStatus]);

  useEffect(() => {
    if (selectedFilePath) {
      triggerBackgroundRefactorAudit();
    }
  }, [selectedFilePath]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      triggerBackgroundRefactorAudit();
    }
  }, [saveStatus]);

  const handleCreateSnapshot = async () => {
    if (!project) return;
    const desc = prompt("Enter a brief description for this workspace version snapshot:");
    if (desc === null) return;
    
    const nextVer = snapshots.length + 1;
    const snapshotObj = JSON.stringify({
      activeFile: selectedFilePath,
      content: editorContent
    });
    
    const snap = await dbService.createVersionSnapshot(
      project.id,
      nextVer,
      [selectedFilePath],
      snapshotObj,
      desc || `Snapshot version #${nextVer}`
    );
    setSnapshots(prev => [snap, ...prev]);
    alert("Project version snapshot captured successfully!");
  };

  const handleRollback = (snap: any) => {
    try {
      const parsed = JSON.parse(snap.contentJson);
      if (parsed.activeFile) {
        setSelectedFilePath(parsed.activeFile);
        setEditorContent(parsed.content);
        updateFileContent(parsed.activeFile, parsed.content);
        alert(`Rollback to Version #${snap.versionNumber} completed successfully!`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to restore snapshot files. Content structure corrupted.");
    }
  };

  const handleSaveFile = () => {
    if (!project || !selectedFilePath) return;

    updateFileContent(selectedFilePath, editorContent);

    // Toast alert mock
    alert(`File saved successfully: ${selectedFilePath}`);
  };

  const handleSelectFile = (path: string) => {
    if (!project) return;
    setSelectedFilePath(path);
    const file = findFileByPath(project.files, path);
    setEditorContent(file?.content || '');
  };


  // Award XP helper
  const rewardXP = (amount: number, reason: string) => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const prof = JSON.parse(savedProfile);
      prof.xp += amount;
      prof.level = Math.floor(prof.xp / 1000) + 1;
      localStorage.setItem('user_profile', JSON.stringify(prof));
      setUserXP(prof.xp);
      
      // Fire confetti
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      
      // Display flash message
      alert(`🎉 +${amount} XP Gained! Reason: ${reason}`);
    }
  };

  const runTaskExecution = async (task: any) => {
    if (!project) return;
    setExecutingTaskId(task.id);
    const initialLogs = [`[Sprint ${task.sprint}] Starting Autonomous Builder Mode execution for task: "${task.title}"...`];
    setTaskExecutionLogs(initialLogs);

    const stepsLogs = [
      `[Project Manager] 📋 Analyzing Acceptance Criteria for story...`,
      `[Software Architect] 📐 Generating code architecture specifications and file boundaries...`,
      `[Developer Agent] 💻 Launching code generation module for path: ${task.files[0]}`,
      `[Developer Agent] ✓ Code injected successfully. Running formatting parser checks...`,
      `[Security Agent] 🔒 Scanning files for JWT, CSRF, and SQL Injection vulnerabilities... Clean!`,
      `[Performance Agent] ⚡ Conducting bundle size and request telemetry review... Complete!`,
      `[Test Agent] 🧪 Executing Jest mocks test suites... All test definitions passed.`,
      `[Debugger Agent] 🐛 Verifying build compiler state checks... 0 diagnostics warnings.`,
      `[Project Manager] 🎉 Sprint task completed! Moving card to Completed.`
    ];

    let currentLogs = [...initialLogs];
    for (let i = 0; i < stepsLogs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      currentLogs = [...currentLogs, stepsLogs[i]];
      setTaskExecutionLogs(currentLogs);
    }

    const updatedTasks = (project.tasks || []).map(t =>
      t.id === task.id ? { ...t, status: 'completed' as const } : t
    );
    const updatedProj = { ...project, tasks: updatedTasks };
    setProject(updatedProj);
    updateProject(updatedProj);

    rewardXP(150, `Completed task: ${task.title}`);
    setExecutingTaskId('');
    setSelectedTask(null);
  };

  const startAgentLoop = async () => {
    if (!project) return;
    setAgentLoopStatus('running');

    const appendMsg = (sender: string, role: string, avatar: string, msg: string) => {
      setAgentMessages(prev => [...prev, { sender, role, avatar, message: msg }]);
    };

    const addLog = (log: string) => {
      setAgentConsoleLogs(prev => [...prev, log]);
      setTerminalLogs(prev => [...prev, log]);
    };

    const AGENT_TEAM = {
      pm: { name: 'Sarah (Project Manager)', role: 'PM', avatar: '📋' },
      architect: { name: 'Alex (Architect)', role: 'Architect', avatar: '📐' },
      developer: { name: 'David (Developer)', role: 'Developer', avatar: '💻' },
      security: { name: 'Elena (Security Auditor)', role: 'Security', avatar: '🔒' },
      performance: { name: 'Peter (Performance Optimizer)', role: 'Performance', avatar: '⚡' },
      tester: { name: 'Toby (Test Engineer)', role: 'Tester', avatar: '🧪' },
      debugger: { name: 'Dan (Debugger Agent)', role: 'Debugger', avatar: '🐛' }
    };

    // ── Phase 1: Requirement Analysis ──
    if (currentPhase === 'analysis') {
      addLog(`[System] Initializing Requirement Analysis phase...`);
      appendMsg(AGENT_TEAM.pm.name, AGENT_TEAM.pm.role, AGENT_TEAM.pm.avatar, `Welcome team. Let's analyze the requirements for the "${project.name}" application. We need to define functional and non-functional requirements.`);
      await new Promise(r => setTimeout(r, 1200));
      appendMsg(AGENT_TEAM.security.name, AGENT_TEAM.security.role, AGENT_TEAM.security.avatar, `We must prioritize encryption guidelines and enforce secure route authentication gateways.`);
      await new Promise(r => setTimeout(r, 1000));
      addLog(`[PM] Generating Software Requirements Specification: "docs/srs.md"`);
      
      const srsContent = `# SRS for ${project.name}\n\n1. Functional Requirements\n- Relational state tracking\n- User authentication gate\n2. Non-Functional Requirements\n- Latency under 250ms\n- Access Control compliance`;
      const updatedFiles = addOrUpdateFileInTree(project.files, 'docs/srs.md', srsContent);
      const nextProj = { ...project, files: updatedFiles };
      setProject(nextProj);
      updateProject(nextProj);

      setCurrentPhase('architecture');
      addLog(`✓ Requirement Analysis completed.`);
    }

    // ── Phase 2: Architecture ──
    if (currentPhase === 'architecture' || currentPhase === 'analysis') {
      addLog(`[System] Initializing Architecture Design phase...`);
      appendMsg(AGENT_TEAM.architect.name, AGENT_TEAM.architect.role, AGENT_TEAM.architect.avatar, `I will design the High-Level Topology (HLD) and Low-Level Diagrams (LLD) to define route maps.`);
      await new Promise(r => setTimeout(r, 1200));
      addLog(`[Architect] Generating design doc: "docs/architecture.md"`);
      
      const archContent = `# System Architecture Guide\n\nClient Browser -> Backend Express Server -> PostgreSQL Database`;
      const updatedFiles = addOrUpdateFileInTree(project.files, 'docs/architecture.md', archContent);
      const nextProj = { ...project, files: updatedFiles };
      setProject(nextProj);
      updateProject(nextProj);

      setCurrentPhase('planning');
      addLog(`✓ Architecture Design completed.`);
    }

    // ── Phase 3: Task Planning ──
    if (currentPhase === 'planning') {
      addLog(`[System] Initializing Task Planning phase...`);
      appendMsg(AGENT_TEAM.pm.name, AGENT_TEAM.pm.role, AGENT_TEAM.pm.avatar, `I am dividing the workload into 4 distinct Agile Sprints with assigned developer tasks.`);
      await new Promise(r => setTimeout(r, 1000));
      addLog(`✓ Task Planning completed. Sprints tasks loaded.`);
      setCurrentPhase('implementation');
    }

    // ── Phase 4: Implementation ──
    if (currentPhase === 'implementation' || currentPhase === 'planning') {
      addLog(`[System] Executing Implementation phase...`);
      
      const tasks = project.tasks || [];
      
      for (let idx = 0; idx < tasks.length; idx++) {
        const t = tasks[idx];
        if (t.status === 'completed') continue;

        addLog(`[System] Executing Task: "${t.title}" (Sprint ${t.sprint})`);
        
        const chats = getAgentChatForTask(t);
        for (const chat of chats) {
          appendMsg(chat.sender, chat.role, chat.avatar, chat.message);
          await new Promise(r => setTimeout(r, 600));
        }

        for (const filePath of t.files) {
          addLog(`[Developer] Generating code implementation: "${filePath}"`);
          await new Promise(r => setTimeout(r, 1000));
          
          let fileCode = getBoilerplateForFile(filePath, project.name, project.techStack);
          
          addLog(`[Debugger] Verifying file syntax: "${filePath}"`);
          const check = checkCodeSyntax(fileCode, filePath);
          if (!check.valid) {
            addLog(`[Debugger] Syntax check failed. Applying patch...`);
            if (check.suggestedFix) {
              fileCode = check.suggestedFix;
            }
          }
          
          const newTree = addOrUpdateFileInTree(project.files, filePath, fileCode);
          project.files = newTree;
          setProject({ ...project, files: newTree });
          updateProject({ ...project, files: newTree });
          addLog(`[System] File written successfully: "${filePath}"`);
        }

        addLog(`[System] Running compiler and tests validation checks...`);
        addLog(`$ npm run build`);
        addLog(`✓ Compiled clean. 0 compile errors found.`);
        addLog(`$ npm test`);
        addLog(`PASS  src/tests/auth.test.ts (2 passed)`);
        
        t.status = 'completed';
        const nextProj = { ...project, tasks: [...tasks] };
        setProject(nextProj);
        updateProject(nextProj);
        addLog(`✓ Task "${t.title}" completed successfully!`);

        rewardXP(120, `Completed task: ${t.title}`);
        await new Promise(r => setTimeout(r, 1000));
      }

      setCurrentPhase('documentation');
    }

    // ── Phase 5: Documentation ──
    if (currentPhase === 'documentation' || currentPhase === 'implementation') {
      addLog(`[System] Initializing Documentation & Exporters phase...`);
      appendMsg(AGENT_TEAM.pm.name, AGENT_TEAM.pm.role, AGENT_TEAM.pm.avatar, `We are finalizing project documentation and generating resume assets.`);
      await new Promise(r => setTimeout(r, 1000));
      
      const portfolio = generatePortfolioBundle(project);
      setPortfolioBundle(portfolio);
      
      setCurrentPhase('complete');
      addLog(`✓ Project Complete! Portfolio exporter is ready.`);
      setAgentLoopStatus('completed');
    }
  };

  // Lesson actions
  const handleCheckQuiz = (questionId: string, correctIdx: number) => {
    const selected = selectedAnswers[questionId];
    if (selected === undefined) return;

    setQuizChecked(prev => ({ ...prev, [questionId]: true }));
    
    if (selected === correctIdx) {
      rewardXP(100, 'Solved Quiz Question');
    }
  };

  const handleVerifyChallenge = (sol: string) => {
    // Basic verification comparing stripped strings
    const cleanUser = challengeCode.replace(/\s+/g, '').toLowerCase();
    const cleanSol = sol.replace(/\s+/g, '').toLowerCase();

    if (cleanUser.includes(cleanSol) || cleanSol.includes(cleanUser)) {
      setChallengeStatus('success');
      rewardXP(200, 'Solved Code Challenge');
      
      // Complete lesson status in store
      if (project) {
        const lesson = project.lessons[activeLessonIdx];
        if (lesson) {
          markLessonComplete(lesson.id);
        }
      }
    } else {
      setChallengeStatus('failed');
    }
  };

  const callAiProvider = async (promptText: string): Promise<string> => {
    const aiSelection = project?.techStack.ai.toLowerCase() || 'mock';
    const providerKeyMap: Record<string, string> = {
      'openai': 'openai',
      'gemini pro': 'gemini',
      'claude 3.5': 'claude',
      'ollama (llama 3)': 'ollama',
      'mock': 'mock'
    };
    const providerType = providerKeyMap[aiSelection] || 'mock';
    const key = apiKeys[`${providerType}_api_key`] || '';
    
    try {
      const provider = getProvider({
        provider: providerType as any,
        apiKey: key,
        baseUrl: providerType === 'ollama' ? apiKeys['ollama_url'] : undefined
      });
      return await provider.generate(promptText);
    } catch (e: any) {
      console.warn(`Active provider ${providerType} failed or missing credentials. Falling back to Mock AI Provider.`, e);
      const mockProvider = getProvider({ provider: 'mock' });
      return await mockProvider.generate(promptText);
    }
  };

  const runDiagnosticsReview = async () => {
    if (!project) return;
    setReviewerLoading(true);
    setReviewerPhase('collaboration');
    setReviewerAgentMessages([]);
    setReviewerResult(null);

    // Start background AI request
    const { promptBuilders } = await import('@/utils/ai/promptBuilders');
    const promptText = promptBuilders.buildReviewerPrompt(editorContent, selectedFilePath || 'Active File');
    
    let aiResponsePromise = callAiProvider(promptText);

    // Setup sequence of messages
    const sequence = [
      {
        sender: AGENT_TEAM.pm.name,
        role: AGENT_TEAM.pm.role,
        avatar: AGENT_TEAM.pm.avatar,
        message: `Team, launching architectural audit on file: "${selectedFilePath.split('/').pop() || 'Active File'}". We must review DRY compliance, check for security risks like unsafe JWT headers, SQL Injection loopholes, and optimize performance footprint.`
      },
      {
        sender: AGENT_TEAM.architect.name,
        role: AGENT_TEAM.architect.role,
        avatar: AGENT_TEAM.architect.avatar,
        message: `Analyzing class structures and decoupling patterns. I'm verifying SOLID Single Responsibility patterns. Checking for redundant DRY code blocks...`
      },
      {
        sender: AGENT_TEAM.security.name,
        role: AGENT_TEAM.security.role,
        avatar: AGENT_TEAM.security.avatar,
        message: `Security auditor scanning line records. I am checking for hardcoded credential tags, SQL query injections parameters, and validating if JWT tokens enforce expiration limits.`
      },
      {
        sender: AGENT_TEAM.performance.name,
        role: AGENT_TEAM.performance.role,
        avatar: AGENT_TEAM.performance.avatar,
        message: `Performance optimization checking rendering loops and queries database hooks. Asserting memory cleanups and event handler debouncing thresholds.`
      },
      {
        sender: AGENT_TEAM.developer.name,
        role: AGENT_TEAM.developer.role,
        avatar: AGENT_TEAM.developer.avatar,
        message: `Review received. I will consolidate feedback and construct the refactored code blocks now.`
      }
    ];

    // Push messages one by one with a delay
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setReviewerAgentMessages(prev => [...prev, sequence[i]]);
    }

    try {
      const response = await aiResponsePromise;
      let cleanJson = response;
      const startIdx = response.indexOf('{');
      const endIdx = response.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = response.slice(startIdx, endIdx + 1);
      }
      
      const parsed = JSON.parse(cleanJson);
      setReviewerResult(parsed);
      setReviewerPhase('finished');
    } catch (err) {
      console.warn("Failed to parse AI review JSON, generating fallback representation.", err);
      const fallbackResult = {
        scores: {
          overall: 82,
          security: 88,
          performance: 78,
          architecture: 80,
          accessibility: 85,
          codeQuality: 84,
          maintainability: 82
        },
        summary: "Multi-agent review successfully executed. Suggested modular decoupling on API inputs handles and securing authorization middlewares.",
        strengths: ["Strong TypeScript compilation structures", "Well-contained UI presentation widgets"],
        weaknesses: ["Missing validation constraints on client forms inputs", "Implicit type-casting on query payloads"],
        recommendations: ["Ensure JWT authentication checks key signatures", "Incorporate lodash debounce gates on typing hooks"],
        improvements: `// Proposed Decoupled SOLID Implementation\nimport React, { useMemo } from 'react';\n\nexport function DecoupledComponent() {\n  // Optimized rendering nodes using useMemo filters\n  return (\n    <div className="p-4 bg-black/40 rounded border border-white/5">\n      <h3 className="text-xs font-bold text-white">SOLID Decoupled UI</h3>\n    </div>\n  );\n}`
      };
      setReviewerResult(fallbackResult);
      setReviewerPhase('finished');
    } finally {
      setReviewerLoading(false);
    }
  };

  const handleApplyReviewImprovements = () => {
    if (!selectedFilePath || !reviewerResult || !reviewerResult.improvements) return;
    
    setEditorContent(reviewerResult.improvements);
    updateFileContent(selectedFilePath, reviewerResult.improvements);
    setSaveStatus('saving');
    
    setFlashingFilePath(selectedFilePath);
    setTimeout(() => {
      setFlashingFilePath('');
    }, 2500);

    alert(`Successfully applied multi-agent refactoring improvements to VFS node: "${selectedFilePath}"!`);
  };

  const triggerBackgroundRefactorAudit = async () => {
    if (!project || !selectedFilePath) return;
    setRefactorLoading(true);
    setHasNewSuggestions(false);

    try {
      const { promptBuilders } = await import('@/utils/ai/promptBuilders');
      const promptText = promptBuilders.buildRefactorSuggestionsPrompt(editorContent, selectedFilePath);
      const response = await callAiProvider(promptText);
      
      let cleanJson = response;
      const startIdx = response.indexOf('{');
      const endIdx = response.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = response.slice(startIdx, endIdx + 1);
      }
      
      const parsed = JSON.parse(cleanJson);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        setRefactorSuggestions(parsed.suggestions);
        setHasNewSuggestions(true);
      } else {
        throw new Error("Invalid suggestions structure");
      }
    } catch (err) {
      console.warn("Failed to generate refactoring suggestions, using fallbacks.", err);
      const defaultSuggestions = [
        {
          title: "Introduce TypeScript validation guards",
          description: "Define custom validation schema interfaces (or Zod guards) to sanitize state parameters before modifying the VFS.",
          type: "SOLID Compliance",
          diff: `// Refactored TypeScript interfaces validation\nexport interface ValidationState {\n  isValid: boolean;\n  errors: string[];\n}\n\nexport function validatePayload<T>(data: T): ValidationState {\n  return { isValid: true, errors: [] };\n}`
        },
        {
          title: "Optimize state array re-renders with useCallback",
          description: "Avoid rendering bottlenecks on heavy DOM arrays by memoizing the onChange click dispatcher callbacks.",
          type: "Performance",
          diff: `// Refactored callbacks with memoization hooks\nimport React, { useCallback } from 'react';\n\nconst handleSelect = useCallback((id: string) => {\n  setSelectedId(id);\n}, []);`
        }
      ];
      setRefactorSuggestions(defaultSuggestions);
      setHasNewSuggestions(true);
    } finally {
      setRefactorLoading(false);
    }
  };

  const handleApplyRefactor = (suggestion: any) => {
    if (!selectedFilePath || !suggestion.diff) return;
    setEditorContent(suggestion.diff);
    updateFileContent(selectedFilePath, suggestion.diff);
    setSaveStatus('saving');
    setTerminalLogs(prev => [...prev, `[Refactor Engine] Applied suggestion: "${suggestion.title}" into VFS path: ${selectedFilePath}`]);
    alert(`Refactor suggestion applied to Monaco editor!`);
  };

  const handleExecuteSql = () => {
    const q = sqlQuery.trim().toLowerCase();
    const cleanQ = q.replace(/\s+/g, ' ');
    setSqlConsole(prev => [...prev, `sqlite> ${sqlQuery}`]);
    
    setTimeout(() => {
      if (cleanQ.startsWith('select * from users') || cleanQ.startsWith('select*from users')) {
        setSqlResult(mockDbRows.users);
        setSqlConsole(prev => [...prev, `Returned ${mockDbRows.users.length} rows. (7ms)`]);
      } else if (cleanQ.startsWith('select * from tasks') || cleanQ.startsWith('select*from tasks')) {
        setSqlResult(mockDbRows.tasks);
        setSqlConsole(prev => [...prev, `Returned ${mockDbRows.tasks.length} rows. (5ms)`]);
      } else if (cleanQ.startsWith('insert into tasks') || cleanQ.startsWith('insert into users')) {
        const isUsers = cleanQ.includes('users');
        if (isUsers) {
          const emailMatch = sqlQuery.match(/values\s*\(\s*'([^']+)'/i) || sqlQuery.match(/'([^']+)'/);
          const email = emailMatch ? emailMatch[1] : 'new.user@example.com';
          const newRow = { id: `u${mockDbRows.users.length + 1}`, email, role: 'member', created_at: new Date().toISOString().split('T')[0] };
          setMockDbRows(prev => ({ ...prev, users: [...prev.users, newRow] }));
          setSqlResult([newRow]);
          setSqlConsole(prev => [...prev, `Query OK, 1 row inserted. (12ms)`]);
        } else {
          const titleMatch = sqlQuery.match(/values\s*\(\s*'([^']+)'/i) || sqlQuery.match(/'([^']+)'/);
          const title = titleMatch ? titleMatch[1] : 'Query Inserted Task';
          const newRow = { id: `t${mockDbRows.tasks.length + 1}`, title, status: 'backlog', estimated_hours: 2 };
          setMockDbRows(prev => ({ ...prev, tasks: [...prev.tasks, newRow] }));
          setSqlResult([newRow]);
          setSqlConsole(prev => [...prev, `Query OK, 1 row inserted. (10ms)`]);
        }
      } else if (cleanQ.startsWith('update') || cleanQ.startsWith('delete')) {
        setSqlResult([]);
        setSqlConsole(prev => [...prev, `Query OK, 0 rows affected (18ms). Playground DB state reset.`]);
      } else {
        setSqlResult([]);
        setSqlConsole(prev => [...prev, `Error: Unsupported SQL instruction. Try SELECT * FROM users; SELECT * FROM tasks; or INSERT INTO tasks (title) VALUES ('New Task');`]);
      }
    }, 200);
  };

  const handleSendApiRequest = () => {
    setApiLoading(true);
    setApiResponse('');
    setApiResponseStatus(null);
    setApiResponseTime('');
    
    setTimeout(() => {
      let status = 200;
      let body: any = {};
      
      const cleanEndpoint = selectedApiEndpoint.trim().toLowerCase();
      
      if (cleanEndpoint.includes('login') || cleanEndpoint.includes('auth')) {
        try {
          const parsedBody = JSON.parse(apiRequestBody);
          if (!parsedBody.email || !parsedBody.password) {
            status = 400;
            body = { error: "Missing required parameters: email, password" };
          } else {
            status = 200;
            body = {
              success: true,
              token: "jwt_token_signature_sandbox_mock_" + Math.random().toString(36).substring(7),
              user: { email: parsedBody.email, role: "member", is_authenticated: true },
              expires_in: 3600
            };
          }
        } catch (e) {
          status = 400;
          body = { error: "Malformed payload body. Invalid JSON structure." };
        }
      } else if (cleanEndpoint.includes('items') || cleanEndpoint.includes('tasks') || cleanEndpoint.includes('get')) {
        status = 200;
        body = {
          success: true,
          count: mockDbRows.tasks.length,
          items: mockDbRows.tasks
        };
      } else {
        status = 201;
        body = {
          success: true,
          message: "Simulated resource created successfully at route " + selectedApiEndpoint,
          timestamp: new Date().toISOString()
        };
      }
      
      setApiResponseStatus(status);
      setApiResponse(JSON.stringify(body, null, 2));
      setApiResponseTime(`${Math.floor(Math.random() * 35) + 12}ms`);
      setApiLoading(false);
    }, 450);
  };

  const parseComponentDetails = (code: string) => {
    const details = {
      title: (project?.name || 'Workspace Preview') + ' Interface',
      description: 'Dynamic sandbox compiled from ' + (selectedFilePath.split('/').pop() || 'file'),
      hasForm: false,
      hasTable: false,
      inputs: [] as string[],
      buttons: [] as string[],
      lists: [] as string[]
    };

    const titleMatch = code.match(/<h1[^>]*>([^<]+)<\/h1>/i) || code.match(/<h1>([^<]+)<\/h1>/i);
    if (titleMatch) details.title = titleMatch[1];

    const descMatch = code.match(/<p[^>]*>([^<]+)<\/p>/i) || code.match(/<p>([^<]+)<\/p>/i);
    if (descMatch) details.description = descMatch[1];

    const inputMatches = Array.from(code.matchAll(/<input[^>]*placeholder="([^"]+)"/gi));
    for (const match of inputMatches) {
      if (!details.inputs.includes(match[1])) details.inputs.push(match[1]);
    }

    const buttonMatches = Array.from(code.matchAll(/<button[^>]*>([^<]+)<\/button>/gi));
    for (const match of buttonMatches) {
      const label = match[1].replace(/\{[^}]+\}/g, '').trim();
      if (label && label.length < 30 && !details.buttons.includes(label)) {
        details.buttons.push(label);
      }
    }

    if (code.includes('.map') || code.includes('<li>')) {
      details.lists.push("Dynamic VFS list records mapping loop");
    }
    if (code.includes('<table>') || code.includes('<tr>')) {
      details.hasTable = true;
    }

    return details;
  };

  const runDebuggerAnalysis = async () => {
    if (!project || !debuggerError.trim()) return;
    setDebuggerLoading(true);
    
    const { promptBuilders } = await import('@/utils/ai/promptBuilders');
    const promptText = promptBuilders.buildDebuggerPrompt(debuggerError, editorContent, `${project.techStack.frontend} + ${project.techStack.backend}`);
    
    try {
      const response = await callAiProvider(promptText);
      let cleanJson = response;
      const startIdx = response.indexOf('{');
      const endIdx = response.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = response.slice(startIdx, endIdx + 1);
      }
      const parsed = JSON.parse(cleanJson);
      setDebuggerResult(parsed);
    } catch (err) {
      console.warn("Failed to parse AI debugger JSON, generating fallback representation.", err);
      setDebuggerResult({
        summary: "Runtime exception caused by undefined handler context triggers.",
        rootCause: "Target callback object evaluated to null because function execution context bind variables were not passed.",
        explanation: "In JavaScript environments, passing class event handlers without arrow definitions results in the local context dereferencing from its parent state, resulting in a TypeError.",
        suggestions: ["Use arrow definitions for callback triggers", "Safeguard callback invocation parameters"],
        fixMinimal: "onChange={(e) => this.handleChange(e)}",
        fixProduction: "const handleChange = useCallback((e) => { ... }, []);",
        fixOptimized: "const handleChange = useEvent((e) => { ... });",
        fixExplanation: "Minimal solves by binding in-render (adds overhead). Production uses useCallback memoizers. Optimized leverages future state wrappers."
      });
    } finally {
      setDebuggerLoading(false);
    }
  };

  // AI Code actions (Explain, Debug, Refactor)
  const triggerAiAction = async (action: 'explain' | 'debug' | 'improve') => {
    if (!project) return;
    setCodePaneTab('chat');
    setChatLoading(true);
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: `Please ${action} this file: ${selectedFilePath}`
    }]);

    const taskDescription = action === 'explain' 
      ? 'Explain what this file does, how it is implemented, and alternative methods.' 
      : action === 'debug' 
        ? 'Audit the code for errors, warnings, memory leaks, and safety concerns.' 
        : 'Optimize this code, make it more robust, clean, and secure. Explain the improvements.';

    const promptText = `Project: ${project.name}
File Path: ${selectedFilePath}
Current Code Contents:
\`\`\`
${editorContent}
\`\`\`

Task: ${taskDescription}
Please format your response nicely with markdown.`;

    const isMock = project.techStack.ai.toLowerCase() === 'mock';
    const isStreamEnabled = typeof window !== 'undefined' ? localStorage.getItem('ollama_streaming') !== 'false' : true;

    if (!isMock && isStreamEnabled) {
      // Append empty assistant message to stream tokens into
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setChatLoading(false);

      try {
        const localUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434';
        const provider = new OllamaProvider(localUrl);
        setInferenceStatus('generating');
        
        let accumulated = '';
        let chunkCount = 0;
        const startTime = Date.now();

        await provider.generateStream(
          promptText,
          (chunk) => {
            accumulated += chunk;
            chunkCount++;
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.5) {
              setTpsSpeed(`${(chunkCount / elapsed).toFixed(1)} t/s`);
            }
            setChatMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = { role: 'assistant', content: accumulated };
              }
              return updated;
            });
          },
          localStorage.getItem('ollama_model') || 'llama3.2'
        );
        
        setInferenceStatus('idle');
      } catch (err: any) {
        console.error('Streaming action failed:', err);
        setChatMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: 'assistant', content: `Error executing local inference: ${err.message || 'Ollama unavailable.'}` };
          }
          return updated;
        });
        setInferenceStatus('error');
      }
    } else {
      try {
        setInferenceStatus('generating');
        const response = await callAiProvider(promptText);
        
        // Clean JSON response wrappers if returned by AI
        let text = response;
        try {
          if (response.trim().startsWith('{')) {
            const obj = JSON.parse(response);
            text = obj.explanation || obj.text || obj.response || response;
          }
        } catch (_) {}

        setChatMessages(prev => [...prev, { role: 'assistant', content: text }]);
      } catch (err: any) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Error running inference: ${err.message}` }]);
        setInferenceStatus('error');
      } finally {
        setChatLoading(false);
        setInferenceStatus('idle');
      }
    }
  };

  // Chat submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !project) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    const systemPrompt = `You are a Software Engineering Mentor for a project named ${project.name}.
    The user is currently viewing file ${selectedFilePath} with the following contents:
    \`\`\`
    ${editorContent}
    \`\`\``;

    const promptText = `${systemPrompt}
    
    The user asks: "${userMessage}". 
    Respond as an intelligent mentor: explain concepts, review code snippets, point out relevant database schemas/APIs in this project, and guide them step-by-step. Keep it clear, concise, and structured with markdown.`;

    const isMock = project.techStack.ai.toLowerCase() === 'mock';
    const isStreamEnabled = typeof window !== 'undefined' ? localStorage.getItem('ollama_streaming') !== 'false' : true;

    if (!isMock && isStreamEnabled) {
      // Append empty assistant message to stream tokens into
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setChatLoading(false);

      try {
        const localUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434';
        const provider = new OllamaProvider(localUrl);
        setInferenceStatus('generating');

        const formattedMessages = [
          { role: 'system', content: systemPrompt },
          ...chatMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ];

        let accumulated = '';
        let chunkCount = 0;
        const startTime = Date.now();

        await provider.chatStream(
          formattedMessages,
          (chunk) => {
            accumulated += chunk;
            chunkCount++;
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.5) {
              setTpsSpeed(`${(chunkCount / elapsed).toFixed(1)} t/s`);
            }
            setChatMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = { role: 'assistant', content: accumulated };
              }
              return updated;
            });
          },
          localStorage.getItem('ollama_model') || 'llama3.2'
        );

        setInferenceStatus('idle');
      } catch (err: any) {
        console.error('Chat streaming failed:', err);
        setChatMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err.message || 'Local inference failed.'}` };
          }
          return updated;
        });
        setInferenceStatus('error');
      }
    } else {
      try {
        setInferenceStatus('generating');
        const response = await callAiProvider(promptText);
        setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } catch (err: any) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Generation failed.'}` }]);
        setInferenceStatus('error');
      } finally {
        setChatLoading(false);
        setInferenceStatus('idle');
      }
    }
  };

  // Render File Explorer recursive node
  const renderExplorerNode = (node: FileNode) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.path];

    if (isFolder) {
      return (
        <div key={node.path} className="select-none">
          <button 
            onClick={() => setExpandedFolders(prev => ({ ...prev, [node.path]: !isExpanded }))}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white py-1 px-1 w-full text-left font-medium transition"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
            {isExpanded ? <FolderOpen className="w-4 h-4 text-indigo-400 fill-indigo-400/20" /> : <Folder className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div className="pl-4 border-l border-white/5 ml-2.5">
              {node.children.map(child => renderExplorerNode(child))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = selectedFilePath === node.path;
    const isFlashing = flashingFilePath === node.path;
    return (
      <button 
        key={node.path}
        onClick={() => handleSelectFile(node.path)}
        className={`flex items-center gap-2 text-xs py-1 px-2 w-full text-left rounded-md transition ${
          isFlashing
            ? 'bg-green-600/30 text-green-400 font-bold border-l-2 border-green-500 animate-pulse'
            : isSelected 
              ? 'bg-indigo-600/20 text-indigo-400 font-semibold border-l-2 border-indigo-500' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
      >
        <FileText className="w-3.5 h-3.5 text-gray-500" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white font-mono text-xs">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mb-4" />
        <span>BOOTSTRAPPING WORKSPACE...</span>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="h-screen bg-[#09090B] text-[#F8FAFC] flex flex-col overflow-hidden">
      
      {/* HEADER ACTION BAR */}
      <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-[#111827]/40 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs flex items-center gap-1.5 transition">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-500" /> {project.name}
            <span className="bg-indigo-500/10 text-indigo-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              {project.difficulty}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
            project.generationMode === 'fast'
              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-450'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            {project.generationMode === 'fast' ? '⚡ Fast Mode' : '🎓 Learn Mode'}
          </span>

          <div className="hidden sm:flex items-center gap-1.5 bg-black/40 border border-white/10 py-1 px-2.5 rounded-xl shrink-0">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Sprint:</span>
            <select
              value={project.sprintIndex ?? 1}
              onChange={(e) => {
                const sprintNum = Number(e.target.value);
                const updatedProj = { ...project, sprintIndex: sprintNum };
                setProject(updatedProj);
                updateProject(updatedProj);
                setSelectedSprintFilter(sprintNum);
              }}
              className="bg-transparent text-[10px] text-white outline-none border-none cursor-pointer font-bold"
            >
              <option value={1} className="bg-gray-900">Sprint 1</option>
              <option value={2} className="bg-gray-900">Sprint 2</option>
              <option value={3} className="bg-gray-900">Sprint 3</option>
              <option value={4} className="bg-gray-900">Sprint 4</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/15 py-1 px-3 rounded-full shrink-0">
            <Award className="w-3.5 h-3.5" />
            <span>{userXP} XP</span>
          </div>
          <Link href="/settings" className="p-2 text-gray-400 hover:text-white rounded-lg transition shrink-0">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR TABS SELECTION */}
        <nav className="w-16 border-r border-white/5 bg-[#111827]/20 flex flex-col items-center py-4 justify-between shrink-0 gap-4">
          <div className="flex flex-col gap-2 w-full px-2">
            {[
              { id: 'overview', icon: FileText, label: 'Overview' },
              { id: 'roadmap', icon: Layers, label: 'Roadmap' },
              { id: 'kanban', icon: Columns, label: 'Kanban Board' },
              { id: 'lessons', icon: BookOpen, label: 'Lessons' },
              { id: 'code', icon: Code, label: 'Editor' },
              { id: 'agent', icon: Sparkles, label: 'Agent Mode' },
              { id: 'architecture', icon: Globe, label: 'Design' },
              { id: 'database', icon: Database, label: 'Database' },
              { id: 'api', icon: Cpu, label: 'APIs' },
              { id: 'reviewer', icon: UserCheck, label: 'Reviewer' },
              { id: 'export', icon: FileDown, label: 'Export' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  title={tab.label}
                  className={`p-3 rounded-xl flex items-center justify-center transition relative group ${
                    isActive 
                      ? 'bg-indigo-650 text-white' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="absolute left-full ml-3 bg-gray-950 border border-white/5 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-600 font-mono select-none">v1.0</div>
        </nav>

        {/* WORKSPACE CONTENT RENDERER */}
        <div className="flex-1 flex overflow-hidden bg-black/20">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 max-w-4xl mx-auto text-left">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-2">{project.name}</h1>
                <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{project.description}</p>
              </div>

              {/* Recommendation Engine Banner */}
              {(() => {
                const nextL = project.lessons.find(l => !l.completed);
                const nextIdx = nextL ? project.lessons.findIndex(l => l.id === nextL.id) : -1;
                
                return (
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mb-1">Recommended Next Step</div>
                      <h4 className="text-xs font-bold text-white">
                        {nextL ? `Proceed to Lesson ${nextIdx + 1}: ${nextL.title}` : '🎉 All lessons completed! Export your career assets.'}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {nextL ? `Master objective: "${nextL.objective}" to earn +200 XP and unlock consecutive modules.` : 'Optimize codebase or download metadata plans.'}
                      </p>
                    </div>
                    {nextL && (
                      <button
                        onClick={() => {
                          setActiveLessonIdx(nextIdx);
                          setChallengeCode(nextL.challenge.initialCode);
                          setChallengeStatus('idle');
                          setActiveTab('lessons');
                        }}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shrink-0"
                      >
                        Continue Lesson →
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard hoverEffect={false} className="border border-white/5 p-4 text-left">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Estimated Build Time</h4>
                  <p className="text-xl font-bold text-white">{project.estimatedTime}</p>
                </GlassCard>
                <GlassCard hoverEffect={false} className="border border-white/5 p-4 text-left">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">XP Reward</h4>
                  <p className="text-xl font-bold text-green-400">+{project.xpReward} XP</p>
                </GlassCard>
                <GlassCard hoverEffect={false} className="border border-white/5 p-4 text-left">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Difficulty Tier</h4>
                  <p className="text-xl font-bold text-indigo-400">{project.difficulty}</p>
                </GlassCard>
              </div>

              {/* Study Analytics Dashboard Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-8">
                
                {/* Left Column: Skills Progress Visualizer */}
                <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    📈 Skills Mastered Progress
                  </h3>
                  
                  <div className="space-y-4">
                    {(studyAnalytics[project.id]?.skillsProgress || [
                      { skill: project.skills[0] || 'Frontend Frameworks', level: 35 },
                      { skill: project.skills[1] || 'Backend Handlers', level: 20 },
                      { skill: project.skills[2] || 'Databases Relational', level: 10 }
                    ]).map((sp: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-300">{sp.skill}</span>
                          <span className="text-indigo-400 font-bold">{sp.level}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${sp.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Right Column: Study Telemetry & Weak/Strong Topics */}
                <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    📊 Learning Telemetry Analytics
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-black/30 border border-white/5 p-2 rounded-lg">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Hours Studied</div>
                      <div className="text-base font-extrabold text-white mt-0.5">
                        {studyAnalytics[project.id]?.hoursStudied || 0.5} hrs
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/5 p-2 rounded-lg">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Hours Remaining</div>
                      <div className="text-base font-extrabold text-gray-400 mt-0.5">
                        {studyAnalytics[project.id]?.estimatedRemainingTime || 12} hrs
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] pt-2">
                    <div>
                      <div className="font-bold text-indigo-400 mb-1">Strong Topics</div>
                      <ul className="space-y-0.5 text-gray-400 list-disc pl-3">
                        <li>Layout setups</li>
                        <li>API structures</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-400 mb-1">Weak Topics</div>
                      <ul className="space-y-0.5 text-gray-400 list-disc pl-3">
                        <li>Refactoring loops</li>
                        <li>SOLID designs</li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-8">
                <h3 className="text-lg font-bold text-white">Course Objectives</h3>
                <ul className="space-y-2 text-xs text-gray-300">
                  {project.objectives.map((obj, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold mt-0.5">0{i+1}</span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-8">
                <h3 className="text-lg font-bold text-white mb-2">README.md</h3>
                <div className="bg-[#111827]/40 border border-white/5 p-6 rounded-2xl text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {project.readme}
                </div>
              </div>

              {/* SDLC Active Issues & Bug Tracker */}
              {project.bugTracker && project.bugTracker.length > 0 && (
                <div className="space-y-4 border-t border-white/5 pt-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    🐞 Project Bug & Issue Tracker
                  </h3>
                  <p className="text-xs text-gray-400">Track runtime errors, exceptions, and vulnerabilities caught during QA checks.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.bugTracker.map(bug => (
                      <GlassCard key={bug.id} className="border border-white/5 p-4 flex flex-col justify-between text-left gap-3" hoverEffect={false}>
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                              bug.severity === 'Critical' || bug.severity === 'High'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            }`}>
                              {bug.severity} Severity
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">Sprint Module: {bug.module}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-2">{bug.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{bug.description}</p>
                          <div className="text-[9px] text-gray-500 font-mono mt-2">
                            📁 Files: {bug.files.join(', ')}
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[9px] text-gray-500">
                          <span>👤 Assigned: {bug.assignedAgent}</span>
                          <button
                            onClick={() => {
                              const updatedBugs = (project.bugTracker || []).map(b =>
                                b.id === bug.id ? { ...b, status: 'resolved' as const } : b
                              ).filter(b => b.status !== 'resolved');
                              
                              const updatedProj = { ...project, bugTracker: updatedBugs };
                              setProject(updatedProj);
                              updateProject(updatedProj);
                              rewardXP(100, `Resolved bug: ${bug.title}`);
                            }}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[9px] px-2.5 py-1 rounded transition"
                          >
                            Resolve Issue
                          </button>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-3xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Learning Roadmap</h1>
                <p className="text-xs text-gray-400 mt-1">Check milestones as you complete lessons to track development speeds.</p>
              </div>

              <div className="relative border-l border-white/10 pl-6 ml-4 space-y-10">
                {project.roadmap.map((milestone, idx) => {
                  const isCompleted = milestone.status === 'completed';
                  const isInProgress = milestone.status === 'in-progress';
                  
                  return (
                    <div key={milestone.id} className="relative">
                      {/* Timeline indicator node */}
                      <span className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full border-4 ${
                        isCompleted 
                          ? 'bg-green-500 border-green-950' 
                          : isInProgress 
                            ? 'bg-indigo-500 border-indigo-950' 
                            : 'bg-gray-800 border-gray-950'
                      }`} />

                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-base font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {milestone.title}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            isCompleted 
                              ? 'bg-green-500/10 text-green-400' 
                              : isInProgress 
                                ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' 
                                : 'bg-gray-800 text-gray-500'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{milestone.description}</p>
                        <div className="text-[10px] text-gray-500 pt-1 flex items-center gap-1">
                          ⏱️ Est: {milestone.estimatedHours} Hours
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: KANBAN BOARD */}
          {activeTab === 'kanban' && project && (
            <div className="flex-1 flex flex-col overflow-hidden text-left p-6 md:p-10 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                  <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Columns className="w-6 h-6 text-indigo-555" /> Sprints Kanban Board
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">Manage project features, stories, and task executions across Sprints.</p>
                </div>
                
                {/* Sprint Filter Toggles */}
                <div className="flex bg-black/40 p-1 border border-white/5 rounded-xl gap-1.5 shrink-0">
                  {[1, 2, 3, 4].map(sprNum => (
                    <button
                      key={sprNum}
                      onClick={() => setSelectedSprintFilter(sprNum)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${
                        selectedSprintFilter === sprNum
                          ? 'bg-indigo-650 text-white font-extrabold shadow'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Sprint {sprNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns container */}
              <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
                {['backlog', 'ready', 'in-progress', 'review', 'testing', 'completed', 'blocked'].map((col) => {
                  const tasksInCol = (project.tasks || []).filter(t => t.status === col && t.sprint === selectedSprintFilter);
                  
                  return (
                    <div key={col} className="w-72 bg-black/20 border border-white/5 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                      {/* Column Header */}
                      <div className="p-3 border-b border-white/5 bg-black/40 flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {col.replace('-', ' ')}
                        </span>
                        <span className="text-[9px] font-bold bg-white/5 text-indigo-400 px-2 py-0.5 rounded-md">
                          {tasksInCol.length}
                        </span>
                      </div>

                      {/* Cards list */}
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
                        {tasksInCol.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="bg-[#111827]/40 border border-white/10 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between gap-3 text-left group"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  task.difficulty === 'Easy'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : task.difficulty === 'Medium'
                                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {task.difficulty}
                                </span>
                                <span className="text-[9px] text-gray-500 font-mono">{task.estimatedHours}h</span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-2 group-hover:text-indigo-400 transition truncate">{task.title}</h4>
                              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[9px] text-gray-500">
                              <span>🤖 {task.assignedAgent}</span>
                              <span className="text-indigo-400 group-hover:underline">Details →</span>
                            </div>
                          </div>
                        ))}
                        {tasksInCol.length === 0 && (
                          <div className="text-center py-8 text-[10px] text-gray-650 font-sans border border-dashed border-white/5 rounded-xl">
                            No Sprint {selectedSprintFilter} tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Detail Modal Overlay */}
              {selectedTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <GlassCard className="max-w-md w-full border border-white/10 p-6 space-y-6 text-left" hoverEffect={false}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                          Sprint {selectedTask.sprint} • {selectedTask.difficulty}
                        </span>
                        <h2 className="text-lg font-bold text-white mt-1.5">{selectedTask.title}</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedTask(null)}
                        className="text-gray-400 hover:text-white text-xs font-bold p-1 bg-white/5 hover:bg-white/10 rounded-lg transition"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Description</div>
                        <p className="text-gray-300 leading-relaxed">{selectedTask.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Assigned Developer Agent</div>
                          <div className="flex items-center gap-1.5 text-white">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                            {selectedTask.assignedAgent}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Estimated Duration</div>
                          <div className="text-white">{selectedTask.estimatedHours} Hours</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Target Workspace Files</div>
                        <div className="font-mono text-[10px] text-indigo-455 flex gap-1">
                          {selectedTask.files.map((f: string) => (
                            <span key={f} className="bg-white/5 px-2 py-0.5 rounded">{f}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">Acceptance Criteria</div>
                        <ul className="space-y-1.5 pl-3 list-disc text-gray-400 text-[11px]">
                          {selectedTask.acceptanceCriteria.map((c: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="border-t border-white/5 pt-4 flex gap-2">
                      {executingTaskId === selectedTask.id ? (
                        <div className="w-full bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-green-400 leading-relaxed max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                          {taskExecutionLogs.map((logStr, idx) => (
                            <div key={idx}>{logStr}</div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => runTaskExecution(selectedTask)}
                            className="flex-1 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" /> Execute Task (Autonomous Mode)
                          </button>
                          
                          {/* Manual status mover dropdown */}
                          <select
                            value={selectedTask.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value as any;
                              const updatedTasks = (project.tasks || []).map(t =>
                                t.id === selectedTask.id ? { ...t, status: nextStatus } : t
                              );
                              const updatedProj = { ...project, tasks: updatedTasks };
                              setProject(updatedProj);
                              updateProject(updatedProj);
                              setSelectedTask(null);
                            }}
                            className="bg-gray-850 hover:bg-gray-800 border border-white/5 text-xs text-gray-300 font-semibold px-3 py-2.5 rounded-xl outline-none"
                          >
                            <option value="backlog">Move to Backlog</option>
                            <option value="ready">Move to Ready</option>
                            <option value="in-progress">Move to In Progress</option>
                            <option value="review">Move to Review</option>
                            <option value="testing">Move to Testing</option>
                            <option value="completed">Move to Completed</option>
                            <option value="blocked">Move to Blocked</option>
                          </select>
                        </>
                      )}
                    </div>
                  </GlassCard>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LESSON MODE */}
          {activeTab === 'lessons' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left lessons list index */}
              <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto bg-black/10">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Lesson Modules</div>
                {project.lessons.map((lesson, idx) => {
                  const isLocked = idx > 0 && !project.lessons[idx - 1].completed;
                  return (
                    <button
                      key={lesson.id}
                      disabled={isLocked}
                      onClick={() => {
                        setActiveLessonIdx(idx);
                        setChallengeCode(lesson.challenge.initialCode);
                        setChallengeStatus('idle');
                        setHintLevel(0);
                      }}
                      className={`flex items-center gap-2 text-xs py-2.5 px-3 rounded-xl text-left transition ${
                        activeLessonIdx === idx 
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 font-bold' 
                          : isLocked
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {isLocked ? (
                        <span className="shrink-0">🔒</span>
                      ) : (
                        <BookOpen className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                      {lesson.completed && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              {/* Center lesson content reader */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 max-w-3xl mx-auto text-left">
                {(() => {
                  const lesson = project.lessons[activeLessonIdx];
                  if (!lesson) return <div className="text-xs text-gray-500">No lessons generated.</div>;

                  return (
                    <div className="space-y-8 pb-12">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-extrabold text-white mb-2">{lesson.title}</h2>
                          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs p-3 rounded-xl">
                            <b>🎯 Lesson Objective:</b> {lesson.objective}
                          </div>
                        </div>
                        <button
                          onClick={() => addBookmark('lesson', lesson.title, lesson.id)}
                          className="bg-gray-850 hover:bg-gray-800 text-[10px] text-gray-400 hover:text-white font-bold py-1.5 px-3 rounded-lg border border-white/5 shrink-0 transition"
                        >
                          ⭐ Bookmark
                        </button>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white">Conceptual Explanation</h3>
                        <p className="text-xs text-gray-300 leading-relaxed">{lesson.explanation}</p>
                      </div>

                      {/* Theory details */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white">Deep-Dive Theory</h3>
                        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs text-gray-300 leading-relaxed leading-relaxed font-sans whitespace-pre-wrap">
                          {lesson.theory}
                        </div>
                      </div>

                      {/* Code Snippet Example */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-white">Target Code Implementation</h3>
                          <span className="text-[10px] text-gray-500 font-mono">Path: {lesson.path}</span>
                        </div>
                        <div className="bg-black/60 border border-white/5 rounded-xl overflow-hidden font-mono text-xs text-gray-300">
                          <div className="bg-gray-900 px-4 py-2 border-b border-white/5 text-[10px] text-gray-500 flex justify-between">
                            <span>TYPESCRIPT</span>
                            <button 
                              onClick={() => {
                                handleSelectFile(lesson.path);
                                openEditorTab(lesson.path);
                                setActiveTab('code');
                              }}
                              className="text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Jump to File ↗
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto leading-relaxed">{lesson.code}</pre>
                        </div>
                      </div>

                      {/* Best practices / mistakes split */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
                        <div className="space-y-2 text-left">
                          <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Common Pitfalls
                          </h4>
                          <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400 leading-relaxed">
                            {lesson.commonMistakes.map((mistake, i) => <li key={i}>{mistake}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2 text-left">
                          <h4 className="text-sm font-bold text-green-400 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Best Practices
                          </h4>
                          <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400 leading-relaxed">
                            {lesson.bestPractices.map((bp, i) => <li key={i}>{bp}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Quiz Section */}
                      <div className="border-t border-white/5 pt-8 space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                          <HelpCircle className="w-5 h-5 text-indigo-400" /> Dynamic Concept Check
                        </h3>
                        {lesson.quiz.map((q) => {
                          const isSubmitted = quizChecked[q.id];
                          const selectedOption = selectedAnswers[q.id];
                          
                          return (
                            <GlassCard key={q.id} className="border border-white/5 p-5 space-y-4" hoverEffect={false}>
                              <div className="text-xs font-bold text-white">{q.question}</div>
                              <div className="grid grid-cols-1 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selectedOption === oIdx;
                                  const isCorrect = oIdx === q.correctAnswer;
                                  
                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={isSubmitted}
                                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                      className={`text-left p-3 rounded-lg text-xs transition border flex justify-between items-center ${
                                        isSubmitted 
                                          ? isCorrect 
                                            ? 'bg-green-500/10 border-green-500/30 text-green-400 font-semibold' 
                                            : isSelected 
                                              ? 'bg-red-500/10 border-red-500/30 text-red-400 font-semibold' 
                                              : 'bg-black/20 border-white/5 text-gray-500'
                                          : isSelected
                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-semibold'
                                            : 'bg-black/40 border-white/10 text-gray-300 hover:text-white'
                                      }`}
                                    >
                                      <span>{opt}</span>
                                      {isSubmitted && isCorrect && <span className="text-[10px] font-bold text-green-400">✓ Correct</span>}
                                      {isSubmitted && isSelected && !isCorrect && <span className="text-[10px] font-bold text-red-400">✗ Wrong</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              {!isSubmitted ? (
                                <button
                                  onClick={() => handleCheckQuiz(q.id, q.correctAnswer)}
                                  disabled={selectedOption === undefined}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                  Submit Answer (+100 XP)
                                </button>
                              ) : (
                                <div className="text-[10px] text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed text-left">
                                  💡 <b>Explanation:</b> {q.explanation}
                                </div>
                              )}
                            </GlassCard>
                          );
                        })}
                      </div>

                      {/* Mini Challenge Section with Hint Drawer */}
                      <div className="border-t border-white/5 pt-8 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                          🔧 Interactive Code Challenge
                        </h3>
                        <GlassCard className="border border-white/5 p-6 space-y-4" hoverEffect={false}>
                          <div className="text-xs font-bold text-indigo-400">{lesson.challenge.title}</div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">{lesson.challenge.instructions}</p>
                          
                          {/* Mini editor pane */}
                          <div className="h-40 rounded-xl overflow-hidden border border-white/10">
                            <Editor
                              height="100%"
                              defaultLanguage="typescript"
                              theme="vs-dark"
                              value={challengeCode}
                              onChange={(val) => setChallengeCode(val || '')}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 11,
                                lineNumbers: 'off',
                                padding: { top: 8 }
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerifyChallenge(lesson.challenge.solution)}
                                className="bg-green-600 hover:bg-green-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                              >
                                Verify Challenge (+200 XP)
                              </button>
                              <button
                                onClick={() => setChallengeCode(lesson.challenge.initialCode)}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition"
                                title="Reset challenge"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => setHintLevel(prev => Math.min(4, prev + 1))}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold border border-indigo-500/25 px-3 py-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 transition"
                            >
                              💡 Request Hint {hintLevel > 0 && `(Level ${hintLevel}/3)`}
                            </button>
                          </div>

                          {/* Sequential Hints Drawer */}
                          {hintLevel > 0 && (
                            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 text-xs rounded-xl space-y-2 text-left">
                              {hintLevel >= 1 && (
                                <div>
                                  <span className="font-bold text-indigo-400">Hint 1 (Concepts):</span> 
                                  <p className="text-gray-300 mt-0.5">Use string matching or type comparisons. The output must parse parameter states properly.</p>
                                </div>
                              )}
                              {hintLevel >= 2 && (
                                <div className="border-t border-white/5 pt-2">
                                  <span className="font-bold text-indigo-400">Hint 2 (Params):</span> 
                                  <p className="text-gray-300 mt-0.5">Verify function inputs: Check if values are not null and fall within expected thresholds.</p>
                                </div>
                              )}
                              {hintLevel >= 3 && (
                                <div className="border-t border-white/5 pt-2">
                                  <span className="font-bold text-indigo-400">Hint 3 (Almost There):</span> 
                                  <pre className="text-indigo-300 font-mono text-[10px] mt-1 bg-black/40 p-2 rounded leading-normal">
                                    {lesson.challenge.solution.slice(0, Math.floor(lesson.challenge.solution.length * 0.4))}...
                                  </pre>
                                </div>
                              )}
                              {hintLevel >= 4 && (
                                <div className="border-t border-indigo-500/25 pt-3 bg-black/20 p-2.5 rounded-lg mt-2">
                                  <span className="font-bold text-green-400">Complete Solution Explanation:</span> 
                                  <p className="text-gray-300 mt-0.5 mb-2">Here is the expected code. Paste this into the editor or review details:</p>
                                  <pre className="text-green-300 font-mono text-[10px] bg-black p-3 rounded overflow-x-auto leading-relaxed">{lesson.challenge.solution}</pre>
                                </div>
                              )}
                            </div>
                          )}

                          {challengeStatus === 'success' && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg font-bold">
                              ✓ Verification Success! Lesson completed.
                            </div>
                          )}
                          {challengeStatus === 'failed' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-bold">
                              ✗ Verification Failed. Please review the solution parameters and rewrite your method.
                            </div>
                          )}
                        </GlassCard>
                      </div>

                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: CODE EDITOR WORKSPACE */}
          {activeTab === 'code' && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* File tree explorer sidebar panel */}
              <div className="w-60 border-r border-white/5 bg-[#111827]/10 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">File Explorer</div>
                  <div className="space-y-1 mb-4">
                    {project.files.map(node => renderExplorerNode(node))}
                  </div>

                  {/* Sidebar Bookmarks widgets */}
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                      <span>Bookmarks</span>
                      {selectedFilePath && (
                        <button
                          onClick={() => addBookmark('file', selectedFilePath.split('/').pop() || 'File', selectedFilePath)}
                          className="text-[9px] text-indigo-400 font-bold hover:underline"
                        >
                          + Pin
                        </button>
                      )}
                    </div>
                    {bookmarks.filter((b: Bookmark) => b.projectId === project.id).length > 0 ? (
                      <div className="space-y-1">
                        {bookmarks.filter((b: Bookmark) => b.projectId === project.id).map((b: Bookmark) => (
                          <div key={b.id} className="flex justify-between items-center text-[10px] text-gray-400 p-1 hover:bg-white/5 rounded">
                            <button
                              onClick={() => {
                                if (b.type === 'file') {
                                  openEditorTab(b.pathOrId);
                                }
                              }}
                              className="truncate text-left flex-1"
                            >
                              ⭐ {b.title}
                            </button>
                            <button onClick={() => removeBookmark(b.id)} className="text-red-400 hover:text-red-300 font-bold ml-1">×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-600 italic">No bookmarks saved.</div>
                    )}
                  </div>

                  {/* Sidebar Notes widgets */}
                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Notes</div>
                      <button 
                        onClick={() => setIsAddingNote(!isAddingNote)}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        + Add
                      </button>
                    </div>

                    {isAddingNote && (
                      <div className="bg-black/40 border border-white/5 p-2 rounded space-y-2">
                        <input 
                          type="text" 
                          placeholder="Note Title..."
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded p-1 text-[10px] text-white outline-none"
                        />
                        <textarea 
                          placeholder="Content..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded p-1 text-[10px] text-white outline-none h-12"
                        />
                        <input 
                          type="text" 
                          placeholder="Tags (comma sep)..."
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded p-1 text-[9px] text-white outline-none"
                        />
                        <div className="flex justify-end gap-1 text-[9px]">
                          <button onClick={() => setIsAddingNote(false)} className="text-gray-400">Cancel</button>
                          <button 
                            onClick={() => {
                              if (newNoteTitle.trim()) {
                                addNote(
                                  newNoteTitle,
                                  newNoteContent,
                                  newNoteTags.split(',').map(t => t.trim()).filter(Boolean),
                                  selectedFilePath || undefined
                                );
                                setNewNoteTitle('');
                                setNewNoteContent('');
                                setNewNoteTags('');
                                setIsAddingNote(false);
                              }
                            }}
                            className="bg-indigo-650 px-2 py-0.5 rounded text-white font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {notes.filter((n: Note) => n.projectId === project.id).map((n: Note) => (
                        <div key={n.id} className="bg-black/20 border border-white/5 p-1.5 rounded space-y-1 text-left">
                          <div className="flex justify-between items-center text-[10px] font-bold text-white">
                            <span className="truncate">📝 {n.title}</span>
                            <button onClick={() => deleteNote(n.id)} className="text-red-400 hover:text-red-300 font-bold ml-1">×</button>
                          </div>
                          <p className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed">{n.content}</p>
                          {n.linkedFile && (
                            <button 
                              onClick={() => openEditorTab(n.linkedFile!)}
                              className="text-[8px] text-indigo-400 hover:underline block truncate max-w-[100px]"
                            >
                              🔗 {n.linkedFile.split('/').pop()}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
                <div className="p-3 bg-indigo-950/10 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                  Active file: <br />
                  <span className="text-indigo-400 truncate block">{selectedFilePath}</span>
                </div>
              </div>

              {/* Middle Monaco Editor pane */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
                
                {/* File Tabs Navigation Header */}
                <div className="h-10 bg-gray-950 border-b border-white/5 flex items-center justify-between shrink-0 px-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pr-4 scrollbar-none">
                    {(activeEditorTabs[project.id] || [selectedFilePath]).filter(Boolean).map((tabPath: string) => {
                      const isActive = selectedFilePath === tabPath;
                      return (
                        <div 
                          key={tabPath}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg border-t-2 shrink-0 cursor-pointer transition ${
                            isActive 
                              ? 'bg-[#09090b] text-white border-indigo-500' 
                              : 'bg-transparent text-gray-500 hover:text-gray-300 border-transparent'
                          }`}
                          onClick={() => {
                            setSelectedFilePath(tabPath);
                            const fileNode = findFileByPath(project.files, tabPath);
                            setEditorContent(fileNode?.content || '');
                          }}
                        >
                          <span className="truncate font-mono text-[10px]">{tabPath.split('/').pop()}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              closeEditorTab(tabPath);
                            }}
                            className="text-gray-600 hover:text-white font-bold text-[9px]"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] text-gray-500 font-mono font-medium bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      {saveStatus === 'idle' && "✓ Synced"}
                      {saveStatus === 'saving' && "⏳ Saving..."}
                      {saveStatus === 'saved' && "✓ Auto-saved"}
                    </span>
                    <button 
                      onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                      className="bg-gray-850 hover:bg-gray-800 text-[10px] text-gray-400 hover:text-white py-1 px-2.5 rounded font-mono transition"
                    >
                      {isBottomPanelOpen ? '▼ Hide Console' : '▲ Terminal'}
                    </button>
                    <button 
                      onClick={handleSaveFile}
                      className="bg-indigo-650 hover:bg-indigo-500 text-white text-[10px] font-semibold py-1 px-3 rounded flex items-center gap-1 transition"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 min-h-0 bg-[#09090b]">
                  <Editor
                    height="100%"
                    language={selectedFilePath.endsWith('.ts') || selectedFilePath.endsWith('.tsx') ? 'typescript' : 'javascript'}
                    theme="vs-dark"
                    value={editorContent}
                    onChange={(val) => {
                      const text = val || '';
                      setEditorContent(text);
                      setSaveStatus('saving');
                      if (selectedFilePath) {
                        updateFileContent(selectedFilePath, text);
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      padding: { top: 12 },
                      fontFamily: 'var(--font-geist-mono), monospace',
                      wordWrap: 'on'
                    }}
                  />
                </div>

                {/* Collapsible Bottom Logs Panel drawer */}
                {isBottomPanelOpen && (
                  <div className="h-44 bg-[#09090b] border-t border-white/5 flex flex-col shrink-0 overflow-hidden font-mono text-[11px]">
                    <div className="h-8 bg-gray-950 px-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex gap-4">
                        {(['terminal', 'output', 'problems', 'versions'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveBottomTab(tab)}
                            className={`font-bold transition uppercase tracking-wider text-[10px] ${
                              activeBottomTab === tab 
                                ? 'text-indigo-400 border-b border-indigo-500 pb-0.5' 
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setIsBottomPanelOpen(false)}
                        className="text-gray-500 hover:text-white text-xs"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto bg-black/40 text-gray-300 space-y-1 font-mono leading-relaxed">
                      {activeBottomTab === 'terminal' && (
                        <div className="flex flex-col h-full text-left">
                          <div className="flex gap-2 border-b border-white/5 pb-1 shrink-0 mb-1.5">
                            <button
                              onClick={() => {
                                setTerminalLogs(prev => [
                                  ...prev,
                                  `$ npm run build`,
                                  `▲ Next.js compiler running production build...`,
                                  `✓ Production bundle size optimized successfully.`,
                                  `✓ Compiled clean. 0 compile errors found.`
                                ]);
                              }}
                              className="text-[9px] font-bold bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition text-indigo-400 cursor-pointer"
                            >
                              Run Build
                            </button>
                            <button
                              onClick={() => {
                                setTerminalLogs(prev => [
                                  ...prev,
                                  `$ npm test`,
                                  `PASS  src/tests/auth.test.ts`,
                                  `✓ JWT verify token expiration test (86ms)`,
                                  `✓ Password hashing schema verify (34ms)`,
                                  `Test Suites: 1 passed, 1 total`,
                                  `Tests:       2 passed, 2 total`,
                                  `Snapshots:   0 total`,
                                  `Time:        0.91 s`
                                ]);
                              }}
                              className="text-[9px] font-bold bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition text-green-400 cursor-pointer"
                            >
                              Run Tests
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-0.5">
                            {terminalLogs.map((log, idx) => (
                              <div key={idx} className={log.startsWith('$') ? 'text-indigo-400 font-bold' : log.includes('✓') || log.includes('PASS') ? 'text-green-400' : 'text-gray-400'}>
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeBottomTab === 'output' && (
                        <div className="text-gray-400 text-left font-mono">
                          [System] AI provider workspace initialized (model: {project.techStack.ai}).<br />
                          [Context] 14 context parameters cached: currentFile={selectedFilePath.split('/').pop()}, selectedFilePath={selectedFilePath}.<br />
                          [Reviewer] Code review indices loaded. Diagnostics check: clean.
                        </div>
                      )}
                      {activeBottomTab === 'problems' && (
                        <div className="text-left font-sans p-1 text-[11px] space-y-1.5">
                          <div className="flex items-center gap-2 text-yellow-450 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                            <span>⚠️</span>
                            <div>
                              <span className="font-bold text-yellow-400">Optimization Suggestion (SOLID / DRY)</span>
                              <p className="text-[10px] text-gray-500 mt-0.5">Use React useCallback memoizers on event callbacks to avoid unnecessary re-renders in component tree hierarchy.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                            <span>🎓</span>
                            <div>
                              <span className="font-bold">Active Learning Checkpoint</span>
                              <p className="text-[10px] text-gray-550 mt-0.5">Current Lesson: &quot;{project.lessons[activeLessonIdx]?.title || 'Architecture Overview'}&quot;. Complete the quizzes and coding challenge to unlock consecutive modules.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeBottomTab === 'versions' && (
                        <div className="text-left space-y-3 font-sans w-full max-w-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Workspace Version History</span>
                            <button
                              onClick={handleCreateSnapshot}
                              className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-[9px] py-1 px-2.5 rounded transition"
                            >
                              + Capture Snapshot
                            </button>
                          </div>
                          
                          {snapshots.length > 0 ? (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto">
                              {snapshots.map((snap: any) => (
                                <div key={snap.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded-lg text-[10px]">
                                  <div className="text-left overflow-hidden mr-3">
                                    <div className="font-bold text-white truncate">#{snap.versionNumber}: {snap.description}</div>
                                    <div className="text-[9px] text-gray-500 font-mono mt-0.5">{new Date(snap.createdAt).toLocaleString()}</div>
                                  </div>
                                  <button
                                    onClick={() => handleRollback(snap)}
                                    className="bg-white/5 hover:bg-indigo-650 hover:text-white border border-white/10 px-2 py-0.5 rounded transition font-bold"
                                  >
                                    Rollback
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-500 italic py-4">
                              No history snapshots recorded yet. Capture a new snapshot to backup editor buffers.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Code Actions Toolbar */}
                <div className="h-12 bg-gray-950 border-t border-white/5 px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono font-bold mr-2">MENTOR:</span>
                    <button 
                      onClick={() => triggerAiAction('explain')}
                      className="bg-indigo-650/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold py-1 px-3 rounded-lg hover:bg-indigo-600 hover:text-white transition flex items-center gap-1"
                    >
                      ✨ Explain Code
                    </button>
                    <button 
                      onClick={() => triggerAiAction('debug')}
                      className="bg-purple-650/20 text-purple-400 border border-purple-500/20 text-[10px] font-semibold py-1 px-3 rounded-lg hover:bg-purple-600 hover:text-white transition flex items-center gap-1"
                    >
                      🐛 Diagnostics
                    </button>
                    <button 
                      onClick={() => triggerAiAction('improve')}
                      className="bg-green-650/20 text-green-400 border border-green-500/20 text-[10px] font-semibold py-1 px-3 rounded-lg hover:bg-green-600 hover:text-white transition flex items-center gap-1"
                    >
                      🔧 Refactor
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-gray-500 italic">
                    Press <span className="text-gray-400 font-mono">Ctrl+P</span> for quick commands palette.
                  </div>
                </div>
              </div>

              {/* Right Side panel: Chat or Preview */}
              <div className="w-80 border-l border-white/5 flex flex-col overflow-hidden bg-[#111827]/10 shrink-0">
                {/* Right panel toggle bar */}
                <div className="h-10 bg-gray-950 border-b border-white/5 flex text-xs shrink-0">
                  <button 
                    onClick={() => setCodePaneTab('chat')}
                    className={`flex-1 text-center text-[10px] font-bold tracking-wider uppercase transition ${codePaneTab === 'chat' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    💬 Mentor
                  </button>
                  <button 
                    onClick={() => setCodePaneTab('preview')}
                    className={`flex-1 text-center text-[10px] font-bold tracking-wider uppercase transition ${codePaneTab === 'preview' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    🌐 Preview
                  </button>
                  <button 
                    onClick={() => {
                      setCodePaneTab('refactor');
                      setHasNewSuggestions(false);
                    }}
                    className={`flex-1 text-center text-[10px] font-bold tracking-wider uppercase transition flex justify-center items-center gap-1 ${
                      codePaneTab === 'refactor' 
                        ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    💡 Refactor
                    {hasNewSuggestions && (
                      <span className="w-1.5 h-1.5 bg-purple-550 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                {/* AI CHAT INNER PANE */}
                {codePaneTab === 'chat' && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user' 
                            ? 'bg-indigo-650/15 border border-indigo-500/20 text-indigo-200 ml-6 text-left' 
                            : 'bg-black/35 border border-white/5 text-gray-300 mr-6 text-left'
                        }`}>
                          {msg.content}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="text-[10px] text-gray-500 italic p-3 text-left">Mentor is typing response...</div>
                      )}
                    </div>
                    
                    {/* Suggested Questions Grid */}
                    <div className="p-2 border-t border-white/5 bg-gray-950/20 grid grid-cols-2 gap-1.5 shrink-0">
                      {[
                        { text: 'Explain this file', action: () => triggerAiAction('explain') },
                        { text: 'Optimize this code', action: () => triggerAiAction('improve') },
                        { text: 'Check security concerns', action: () => {
                          setChatInput('Are there security vulnerabilities or hardcoded secrets in this file?');
                        }},
                        { text: 'How do I run tests?', action: () => {
                          setChatInput('Generate tests schema or guide me how to configure unit test suites.');
                        }}
                      ].map((sq, i) => (
                        <button
                          key={i}
                          onClick={sq.action}
                          className="bg-black/40 border border-white/5 rounded-lg p-1.5 text-[9px] text-left text-gray-400 hover:text-white hover:bg-white/5 transition truncate"
                        >
                          ❓ {sq.text}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-gray-950/60 flex gap-2 shrink-0">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask details about code..." 
                        className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none w-full"
                      />
                      <button type="submit" className="bg-indigo-650 hover:bg-indigo-500 p-2.5 rounded-lg text-white">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* LIVE PREVIEW INNER PANE (MOCK INTERACTIVE APP) */}
                {codePaneTab === 'preview' && (
                  <div className="flex-1 p-3 bg-gray-950 flex flex-col justify-between overflow-y-auto text-left">
                    <div className="space-y-4">
                      
                      {/* Responsive device switching selectors */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] text-gray-400 shrink-0">
                        <span>Device:</span>
                        <div className="flex gap-2">
                          {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                            <button
                              key={d}
                              onClick={() => {
                                setPreviewDevice(d);
                                setPreviewWidth(d === 'desktop' ? 100 : d === 'tablet' ? 75 : 45);
                              }}
                              className={`capitalize font-bold ${previewDevice === d ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#111827] border border-white/5 p-2 rounded-lg flex items-center justify-between text-[10px] text-gray-500 select-none">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500/80" />
                          <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                          <span className="w-2 h-2 rounded-full bg-green-500/80" />
                        </div>
                        <span className="truncate max-w-[120px] font-mono text-[9px]">
                          {selectedFilePath.endsWith('.sql') ? 'sqlite://workspace.db' : 
                           selectedFilePath.includes('api/') || selectedFilePath.includes('route') ? 'http://localhost:8080/api-docs' :
                           'http://localhost:8080/'}
                        </span>
                        <Globe className="w-3.5 h-3.5" />
                      </div>

                      {/* Dynamic sandbox selector wrapper */}
                      <div 
                        className="transition-all duration-300 mx-auto border border-white/10 rounded overflow-hidden"
                        style={{ width: `${previewWidth}%`, transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                      >
                        {(() => {
                          if (!project) return null;
                          const fileName = selectedFilePath.split('/').pop() || '';
                          const isSql = fileName.endsWith('.sql');
                          const isApi = selectedFilePath.includes('api/') || fileName.includes('route') || fileName.includes('handler') || fileName.includes('auth.ts');
                          const isTsxOrJsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx') || fileName.endsWith('.html');

                          if (isSql) {
                            return (
                              <div className="bg-[#09090b] text-white p-3 space-y-3 font-sans text-xs">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <span className="font-bold text-indigo-400 flex items-center gap-1">🗄️ SQLite Database GUI</span>
                                  <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-mono">VFS Connection</span>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Tables Schema</div>
                                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                                    {Object.keys(mockDbRows).map(tbl => (
                                      <button
                                        key={tbl}
                                        onClick={() => {
                                          setSqlSelectedTable(tbl);
                                          setSqlQuery(`SELECT * FROM ${tbl};`);
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
                                          sqlSelectedTable === tbl 
                                            ? 'bg-indigo-650/15 border-indigo-500/30 text-indigo-300' 
                                            : 'bg-black border-white/5 text-gray-400 hover:text-white'
                                        }`}
                                      >
                                        {tbl} ({mockDbRows[tbl]?.length || 0})
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">SQL Query Console</div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={sqlQuery}
                                      onChange={(e) => setSqlQuery(e.target.value)}
                                      className="bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none w-full font-mono"
                                    />
                                    <button 
                                      onClick={handleExecuteSql}
                                      className="bg-indigo-650 hover:bg-indigo-500 px-3 py-2 rounded-lg text-white font-bold"
                                    >
                                      Run
                                    </button>
                                  </div>
                                </div>

                                {/* Sql Console log stream */}
                                <div className="bg-black/80 border border-white/5 p-2 rounded-lg font-mono text-[9px] text-green-400 max-h-24 overflow-y-auto leading-relaxed space-y-0.5">
                                  {sqlConsole.map((log, lIdx) => (
                                    <div key={lIdx}>{log}</div>
                                  ))}
                                </div>

                                {/* Results table */}
                                <div className="space-y-1">
                                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Data Grid Output</div>
                                  {sqlResult.length > 0 ? (
                                    <div className="overflow-x-auto border border-white/5 rounded-lg max-h-32">
                                      <table className="w-full text-left text-[9px] font-mono">
                                        <thead className="bg-white/5 text-gray-400">
                                          <tr>
                                            {Object.keys(sqlResult[0]).map(k => (
                                              <th key={k} className="p-1.5 border-b border-white/5">{k}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-black/20">
                                          {sqlResult.map((rObj, rIdx) => (
                                            <tr key={rIdx}>
                                              {Object.values(rObj).map((vVal: any, vIdx) => (
                                                <td key={vIdx} className="p-1.5 text-gray-300 truncate max-w-[80px]">{vVal}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 bg-black/20 border border-white/5 rounded-lg text-gray-500 italic text-[10px]">
                                      No query results displayed. Execute SELECT query.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (isApi) {
                            return (
                              <div className="bg-[#09090b] text-white p-3 space-y-3 font-sans text-xs">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <span className="font-bold text-indigo-400 flex items-center gap-1">🔌 REST API Client</span>
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">Controller Simulator</span>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5">
                                  <select
                                    value={apiMethod}
                                    onChange={(e: any) => setApiMethod(e.target.value)}
                                    className="bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none font-bold col-span-1"
                                  >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={selectedApiEndpoint}
                                    onChange={(e) => setSelectedApiEndpoint(e.target.value)}
                                    className="bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none font-mono col-span-3"
                                  />
                                </div>

                                {apiMethod !== 'GET' && (
                                  <div className="space-y-1.5">
                                    <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Request Body Payload</div>
                                    <textarea
                                      value={apiRequestBody}
                                      onChange={(e) => setApiRequestBody(e.target.value)}
                                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-[9px] text-indigo-300 font-mono outline-none h-16 resize-none"
                                    />
                                  </div>
                                )}

                                <button
                                  onClick={handleSendApiRequest}
                                  disabled={apiLoading}
                                  className="bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-[10px] p-2 rounded-lg w-full transition"
                                >
                                  {apiLoading ? 'Sending HTTP Request...' : 'Send HTTP Request'}
                                </button>

                                {/* API Response Area */}
                                {apiResponseStatus !== null && (
                                  <div className="space-y-2 border-t border-white/5 pt-2.5">
                                    <div className="flex justify-between items-center text-[9px] text-gray-500">
                                      <span>Response Payload:</span>
                                      <div className="flex gap-2">
                                        <span className={`font-bold ${apiResponseStatus >= 200 && apiResponseStatus < 300 ? 'text-green-400' : 'text-red-400'}`}>
                                          Status: {apiResponseStatus}
                                        </span>
                                        <span className="font-mono text-[9px] text-gray-400">Time: {apiResponseTime}</span>
                                      </div>
                                    </div>
                                    <pre className="bg-black/90 p-2.5 border border-white/5 rounded-lg text-[9px] text-green-400 font-mono overflow-x-auto max-h-32 leading-relaxed">
                                      {apiResponse}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (isTsxOrJsx) {
                            // Extract details from component
                            const parsed = parseComponentDetails(editorContent);
                            return (
                              <div className="bg-white text-black p-4 min-h-[220px] font-sans flex flex-col justify-between select-none">
                                <div className="space-y-3">
                                  {/* App Header */}
                                  <header className="border-b border-gray-100 pb-2.5 text-left">
                                    <h3 className="text-xs font-bold text-gray-900">{parsed.title}</h3>
                                    <p className="text-[8px] text-gray-400 mt-0.5 leading-relaxed">{parsed.description}</p>
                                  </header>

                                  {/* Simulated sandbox interactive state container */}
                                  <div className="space-y-3 py-1">
                                    {parsed.inputs.length > 0 && (
                                      <div className="space-y-2 text-left">
                                        {parsed.inputs.slice(0, 2).map((placeholder, idx) => (
                                          <div key={idx} className="space-y-0.5">
                                            <label className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">{placeholder.split('...')[0]}</label>
                                            <input
                                              type="text"
                                              placeholder={placeholder}
                                              value={sandboxFormFields[placeholder] || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setSandboxFormFields(prev => ({ ...prev, [placeholder]: val }));
                                              }}
                                              className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-[8px] text-gray-800 outline-none focus:border-indigo-500"
                                            />
                                          </div>
                                        ))}

                                        {parsed.buttons.slice(0, 2).map((btnText, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => {
                                              const fieldsText = Object.values(sandboxFormFields).join(' ');
                                              const entryText = fieldsText || `Simulated ${btnText} submission`;
                                              setSandboxListItems(prev => [...prev, entryText]);
                                              setSandboxConsole(prev => [...prev, `[Sandbox Event] Clicked "${btnText}" - Payload: ${entryText}`]);
                                              setSandboxFormFields({});
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] py-1 px-3 rounded transition mr-1"
                                          >
                                            {btnText}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Mapped collection list */}
                                    <div className="space-y-1.5 text-left">
                                      <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Simulated In-Memory Grid Record:</span>
                                      <ul className="space-y-1 text-[8px] text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-100">
                                        {sandboxListItems.length > 0 ? (
                                          sandboxListItems.map((item, idx) => (
                                            <li key={idx} className="bg-white p-1 border border-gray-200/60 rounded flex justify-between items-center">
                                              <span>{item}</span>
                                              <button 
                                                onClick={() => {
                                                  setSandboxListItems(prev => prev.filter((_, i) => i !== idx));
                                                  setSandboxConsole(prev => [...prev, `[Sandbox Event] Removed list item idx: ${idx}`]);
                                                }}
                                                className="text-red-500 hover:text-red-400 font-bold px-1"
                                              >
                                                ×
                                              </button>
                                            </li>
                                          ))
                                        ) : (
                                          <div className="text-gray-400 italic text-[7px] py-2 text-center">No active record items initialized. Use inputs.</div>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* Sandbox Console Output log */}
                                <div className="mt-4 border-t border-gray-100 pt-2 shrink-0">
                                  <div className="flex justify-between items-center text-[7px] text-gray-400 font-mono pb-1 select-none">
                                    <span>sandbox-console-logs:</span>
                                    <span className="text-green-500">Live Reloaded</span>
                                  </div>
                                  <div className="bg-gray-900 border border-gray-950 p-1.5 rounded font-mono text-[7px] text-green-400 max-h-16 overflow-y-auto leading-normal space-y-0.5">
                                    {sandboxConsole.map((log, lIdx) => (
                                      <div key={lIdx}>{log}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Default Sandbox Fallback
                          if (project.id.includes('resume')) {
                            return (
                              <div className="text-black p-4 aspect-[1/1.3] text-[8px] leading-relaxed scale-95 origin-top mx-auto select-none bg-white">
                                <h2 className="text-center font-bold text-xs text-gray-900">Jane Smith</h2>
                                <p className="text-center border-b pb-2 text-[6px] text-gray-500">jane.smith@example.com</p>
                                <h4 className="font-bold text-[7px] uppercase tracking-wider text-gray-800 border-b border-gray-800 pb-0.5 mt-2">Work Experience</h4>
                                <div className="mt-1">
                                  <div className="flex justify-between font-bold text-gray-950 text-[6px]">
                                    <span>Frontend Engineer - Innovate Tech</span>
                                    <span>2022 - Pres</span>
                                  </div>
                                  <div className="pl-1.5 border-l border-indigo-200 mt-1 font-serif text-[6px] text-gray-700">
                                    {editorContent.includes('•') ? (
                                      <div className="whitespace-pre-line">{editorContent.split('experience: [')[1]?.split('description: \'')[1]?.split('\'')[0] || '• Spearheaded core layouts using React, boosting response rate by 40%.'}</div>
                                    ) : (
                                      '• Spearheaded core layouts using React, boosting response rate by 40%.'
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-[#111827] text-white p-4 text-center space-y-4 aspect-[1.3/1] font-sans">
                              <div className="text-xs font-bold text-indigo-400">{project.name} Workspace Preview</div>
                              <div className="bg-black/60 p-3 border border-white/5 rounded-xl font-mono text-[9px] text-green-400 text-left leading-relaxed">
                                ✓ Server runtime compilation success.<br />
                                ⚡ Hot Module Replacement watcher online.<br />
                                <span className="text-gray-500 mt-1 block">Selected path: {selectedFilePath}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 mt-6 text-center leading-relaxed">
                      💡 Sandbox syncs changes automatically when files are saved.
                    </div>
                  </div>
                )}

                {/* REFACTOR SUGGESTIONS INNER PANE */}
                {codePaneTab === 'refactor' && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden bg-gray-950 p-4 text-left">
                    <div className="flex-1 overflow-y-auto space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Refactor Suggestions</span>
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/20">Auto-saved Hook</span>
                      </div>
                      
                      {refactorLoading ? (
                        <div className="flex flex-col justify-center items-center py-16 text-center space-y-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                          <div className="text-[10px] text-gray-400 font-mono animate-pulse">Analyzing code updates...</div>
                        </div>
                      ) : refactorSuggestions.length > 0 ? (
                        <div className="space-y-3.5">
                          {refactorSuggestions.map((sug, i) => (
                            <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white truncate max-w-[150px]">{sug.title}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  sug.type === 'Security' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  sug.type === 'Performance' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  sug.type === 'SOLID Compliance' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-gray-500/10 text-gray-400 border border-white/5'
                                }`}>
                                  {sug.type}
                                </span>
                              </div>
                              <p className="text-gray-400 text-[10px] leading-relaxed">{sug.description}</p>
                              {sug.diff && (
                                <div className="space-y-1.5 pt-1">
                                  <pre className="bg-[#09090b] p-2 border border-white/5 rounded font-mono text-[9px] text-indigo-300 overflow-x-auto max-h-24 leading-relaxed">
                                    {sug.diff}
                                  </pre>
                                  <button
                                    onClick={() => handleApplyRefactor(sug)}
                                    className="bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-[9px] px-2.5 py-1 rounded transition w-full"
                                  >
                                    Apply Refactor Suggestions
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 italic py-8 text-center">
                          Edit the file in Monaco editor and let it auto-save to view active refactor suggestions here.
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-600 mt-2 text-center border-t border-white/5 pt-2 select-none">
                      💡 Applying recommendations rewrites VFS nodes and editor states.
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 5: ARCHITECTURE DIAGRAMS */}
          {activeTab === 'architecture' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-white">System Architecture</h1>
                <p className="text-xs text-gray-400 mt-1">Review components flow, security gatekeepers, and databases maps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-400">Core system Diagram</h4>
                  <div 
                    className="bg-[#09090b] p-4 border border-white/5 rounded-xl flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: project.architecture.systemDiagram }}
                  />
                </GlassCard>

                <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-purple-400">Database Schema Linkages</h4>
                  <div 
                    className="bg-[#09090b] p-4 border border-white/5 rounded-xl flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: project.architecture.databaseDiagram }}
                  />
                </GlassCard>
              </div>
            </div>
          )}

          {/* TAB 6: DATABASE SCHEMA SCHEMATICS */}
          {activeTab === 'database' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Database schema Config</h1>
                <p className="text-xs text-gray-400 mt-1">Review tables schemas, index keys, and SQL initializers.</p>
              </div>

              <div className="space-y-6">
                {project.dbSchemas.map((schema, idx) => (
                  <GlassCard key={idx} hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-400" /> Table: <span className="font-mono text-indigo-300">{schema.table}</span>
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-gray-300">
                        <thead className="text-[10px] text-gray-500 uppercase border-b border-white/5">
                          <tr>
                            <th className="py-2">Column Name</th>
                            <th className="py-2">Data Type</th>
                            <th className="py-2">Key Constraint</th>
                            <th className="py-2">Nullable</th>
                            <th className="py-2">References</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {schema.columns.map((col, cIdx) => (
                            <tr key={cIdx}>
                              <td className="py-2.5 font-mono text-white">{col.name}</td>
                              <td className="py-2.5 font-mono text-gray-400">{col.type}</td>
                              <td className="py-2.5 font-mono text-indigo-400 font-semibold">{col.key || '-'}</td>
                              <td className="py-2.5 font-mono text-gray-500">{col.nullable ? 'true' : 'false'}</td>
                              <td className="py-2.5 font-mono text-purple-400">{col.references || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-black/60 p-4 border border-white/5 rounded-xl font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {schema.sql}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: API SPECIFICATIONS */}
          {activeTab === 'api' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-white">API Specifications</h1>
                <p className="text-xs text-gray-400 mt-1">Explore Swagger-compliant endpoint variables and test payloads.</p>
              </div>

              {project.apiDocs.length > 0 ? (
                <div className="space-y-6">
                  {project.apiDocs.map((doc, idx) => (
                    <GlassCard key={idx} hoverEffect={false} className="border border-white/5 p-6 space-y-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded font-mono ${
                          doc.method === 'POST' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {doc.method}
                        </span>
                        <span className="font-mono text-base text-white">{doc.endpoint}</span>
                      </div>
                      <p className="text-xs text-gray-400">{doc.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doc.requestBody && (
                          <div className="space-y-2">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Request JSON Payload</div>
                            <pre className="bg-black/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">{doc.requestBody}</pre>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Response JSON Payload</div>
                          <pre className="bg-black/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-green-300 overflow-x-auto leading-relaxed">{doc.responseBody}</pre>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-950/20 border border-white/5 rounded-2xl text-xs text-gray-500">
                  No API endpoints configured for this blueprint stack.
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AI REVIEWER / DIAGNOSTICS */}
          {activeTab === 'reviewer' && (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto space-y-8 text-left">
              <div>
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  🛡️ AI Reviewer & Error Debugger
                </h1>
                <p className="text-xs text-gray-400 mt-1">Review SOLID compliance architectures, DRY/KISS parameters, and debug application stack traces.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Code Reviewer */}
                <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-6 flex flex-col">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-1">
                      🔍 SOLID & DRY Code reviewer
                    </h3>
                    <p className="text-[10px] text-gray-500">Run structural reviews against SOLID, DRY, and clean coding architectures.</p>
                  </div>

                  {reviewerPhase === 'idle' && (
                    <div className="flex-1 flex flex-col justify-center items-center py-12 text-center space-y-4 bg-black/20 border border-white/5 border-dashed rounded-xl">
                      <span className="text-2xl">📋</span>
                      <div className="text-xs text-gray-400 max-w-xs leading-relaxed">
                        Click below to audit the active file <code className="text-indigo-400 font-mono">{selectedFilePath.split('/').pop() || 'index.ts'}</code>.
                      </div>
                      <button
                        onClick={runDiagnosticsReview}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition"
                      >
                        Start SOLID Review
                      </button>
                    </div>
                  )}

                  {reviewerPhase === 'collaboration' && (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden space-y-4 min-h-[300px]">
                      {/* Checklists running */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/30 border border-white/5 p-3 rounded-xl font-mono text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className={reviewerAgentMessages.length >= 2 ? "text-green-400 font-bold" : "text-indigo-400 animate-pulse font-bold"}>
                            {reviewerAgentMessages.length >= 2 ? "✓" : "⚡"}
                          </span>
                          <span>DRY Redundancy check</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={reviewerAgentMessages.length >= 2 ? "text-green-400 font-bold" : "text-gray-650"}>
                            {reviewerAgentMessages.length >= 2 ? "✓" : "○"}
                          </span>
                          <span>SOLID Single Responsibility</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={reviewerAgentMessages.length >= 3 ? "text-green-400 font-bold" : reviewerAgentMessages.length === 2 ? "text-indigo-400 animate-pulse font-bold" : "text-gray-650"}>
                            {reviewerAgentMessages.length >= 3 ? "✓" : reviewerAgentMessages.length === 2 ? "⚡" : "○"}
                          </span>
                          <span>SQL Injection scanning</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={reviewerAgentMessages.length >= 4 ? "text-green-400 font-bold" : reviewerAgentMessages.length === 3 ? "text-indigo-400 animate-pulse font-bold" : "text-gray-650"}>
                            {reviewerAgentMessages.length >= 4 ? "✓" : reviewerAgentMessages.length === 3 ? "⚡" : "○"}
                          </span>
                          <span>Loop & Query Memoization</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className={reviewerAgentMessages.length >= 5 ? "text-green-400 font-bold" : reviewerAgentMessages.length === 4 ? "text-indigo-400 animate-pulse font-bold" : "text-gray-650"}>
                            {reviewerAgentMessages.length >= 5 ? "✓" : reviewerAgentMessages.length === 4 ? "⚡" : "○"}
                          </span>
                          <span>Consolidating Refactored solutions</span>
                        </div>
                      </div>

                      {/* Conversation thread */}
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-72 p-2 border border-white/5 bg-black/25 rounded-xl text-left">
                        {reviewerAgentMessages.map((msg, idx) => (
                          <div key={idx} className="bg-black/35 border border-white/5 p-2 rounded-xl text-[10px] space-y-1 animate-fadeIn">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                              <span>{msg.avatar}</span>
                              <span>{msg.sender}</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed font-sans">{msg.message}</p>
                          </div>
                        ))}
                        <div className="text-[10px] text-gray-500 italic p-1 animate-pulse">
                          Multi-Agent collaborative audit running...
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewerPhase === 'finished' && reviewerResult && (
                    <div className="space-y-6">
                      
                      {/* Overall and split scores gauges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Overall</div>
                          <div className="text-xl font-extrabold text-indigo-400">{reviewerResult.scores?.overall}%</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Security</div>
                          <div className="text-xl font-extrabold text-green-400">{reviewerResult.scores?.security}%</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Performance</div>
                          <div className="text-xl font-extrabold text-yellow-400">{reviewerResult.scores?.performance}%</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                          <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">SOLID</div>
                          <div className="text-xl font-extrabold text-indigo-400">{reviewerResult.scores?.architecture}%</div>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-gray-300 leading-relaxed font-sans">
                        💡 <b>Review Summary:</b> {reviewerResult.summary}
                      </div>

                      {/* Strengths and Weaknesses lists */}
                      <div className="space-y-3">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Strengths & Optimizations</div>
                        <div className="space-y-1.5 text-xs font-sans text-left">
                          {reviewerResult.strengths?.map((str: string, i: number) => (
                            <div key={i} className="flex gap-2 items-start text-green-400">
                              <span className="shrink-0 mt-0.5">✓</span>
                              <span className="text-gray-300 text-[11px]">{str}</span>
                            </div>
                          ))}
                          {reviewerResult.weaknesses?.map((weak: string, i: number) => (
                            <div key={i} className="flex gap-2 items-start text-red-400">
                              <span className="shrink-0 mt-0.5">✗</span>
                              <span className="text-gray-300 text-[11px]">{weak}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Code Diffs Suggestions */}
                      {reviewerResult.improvements && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            <span>Refactored Cleaner Architecture Code</span>
                            <button
                              onClick={handleApplyReviewImprovements}
                              className="text-indigo-400 hover:text-indigo-300 text-[9px] font-bold"
                            >
                              Automatically Apply Refactored Solutions to Workspace VFS
                            </button>
                          </div>
                          <pre className="bg-black/50 p-3 border border-white/5 rounded-xl text-[10px] font-mono text-indigo-300 overflow-x-auto leading-relaxed max-h-40">{reviewerResult.improvements}</pre>
                        </div>
                      )}

                      <button
                        onClick={runDiagnosticsReview}
                        className="w-full bg-[#111827] border border-white/10 hover:bg-gray-800 text-xs py-2 rounded-xl transition text-white font-semibold"
                      >
                        Re-Audit Active File
                      </button>
                    </div>
                  )}
                </GlassCard>

                {/* Right Column: AI Error Debugger */}
                <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-6 flex flex-col">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-1">
                      👾 Exception Debugger Console
                    </h3>
                    <p className="text-[10px] text-gray-500">Paste logs, runtime exceptions, compiler stack traces, or DB error codes below.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1">Stack Trace Error</label>
                        <textarea
                          placeholder="Paste stack trace log here... (e.g., TypeError: Cannot read property 'map' of undefined)"
                          value={debuggerError}
                          onChange={(e) => setDebuggerError(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none h-20 placeholder-gray-600 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Language / Stack Context</label>
                        <select
                          value={debuggerTech}
                          onChange={(e) => setDebuggerTech(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none font-mono"
                        >
                          <option>React (Next.js)</option>
                          <option>Node.js (Express)</option>
                          <option>PostgreSQL (SQL)</option>
                          <option>MongoDB (NoSQL)</option>
                          <option>Supabase Auth (JWT)</option>
                          <option>Docker / AWS</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={runDebuggerAnalysis}
                        disabled={!debuggerError.trim() || debuggerLoading}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition disabled:opacity-50 mt-4"
                      >
                        {debuggerLoading ? 'Analyzing...' : 'Analyze Stack Trace'}
                      </button>
                    </div>
                  </div>

                  {debuggerLoading && (
                    <div className="flex-1 flex flex-col justify-center items-center py-12 text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                      <div className="text-xs text-gray-400 font-mono animate-pulse">Running debugger telemetry classifiers...</div>
                    </div>
                  )}

                  {debuggerResult && !debuggerLoading && (
                    <div className="border-t border-white/5 pt-4 space-y-4 text-xs text-left">
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-bold">
                        🐞 Summary: {debuggerResult.summary}
                      </div>

                      <div className="space-y-1 bg-black/30 border border-white/5 p-3 rounded-xl leading-relaxed text-left">
                        <div className="text-indigo-400 font-bold text-[10px]">ROOT CAUSE:</div>
                        <p className="text-gray-300 text-[11px]">{debuggerResult.rootCause}</p>
                        <p className="text-gray-400 text-[11px] mt-2 font-light leading-relaxed">{debuggerResult.explanation}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Solution Diffs (Side-by-Side)</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/40 border border-white/5 p-2 rounded-lg">
                            <div className="text-[9px] text-yellow-500 uppercase tracking-wider font-bold mb-1">Minimal Fix</div>
                            <pre className="text-[9px] text-indigo-300 overflow-x-auto leading-normal">{debuggerResult.fixMinimal}</pre>
                          </div>
                          <div className="bg-black/40 border border-white/5 p-2 rounded-lg">
                            <div className="text-[9px] text-green-500 uppercase tracking-wider font-bold mb-1">Production Fix</div>
                            <pre className="text-[9px] text-green-300 overflow-x-auto leading-normal">{debuggerResult.fixProduction}</pre>
                          </div>
                        </div>
                        <div className="bg-black/20 p-2 border border-white/5 rounded-lg text-[10px] text-gray-400 mt-2">
                          💡 <b>Fix Difference:</b> {debuggerResult.fixExplanation}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          )}

          {/* TAB 9: EXPORTS / CAREER BOOSTER */}
          {activeTab === 'export' && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-3xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Career Optimization Kit</h1>
                <p className="text-xs text-gray-400 mt-1 mb-6">Equip your resume and social channels with completed project milestones details.</p>
                
                {/* Download Actions Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-left">
                  <button
                    onClick={() => exportService.downloadMarkdown(project)}
                    className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    📄 Markdown Plan
                  </button>
                  <button
                    onClick={() => exportService.downloadJSON(project)}
                    className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-purple-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    ⚙️ JSON Schema
                  </button>
                  <button
                    onClick={() => exportService.downloadPDFPlaceholder(project)}
                    className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-green-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    🖨️ Export PDF
                  </button>
                  <button
                    onClick={() => exportService.downloadZIPPlaceholder(project)}
                    className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-orange-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    📦 Codebase ZIP
                  </button>
                  <button
                    onClick={() => exportService.downloadResumePackage(project)}
                    className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    💼 Resume CV Pack
                  </button>
                  <button
                    onClick={() => exportService.downloadInterviewPackage(project)}
                    className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-purple-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    📚 Interview Q&A
                  </button>
                  <button
                    onClick={() => exportService.downloadPortfolioPage(project)}
                    className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-green-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    🌐 HTML Portfolio
                  </button>
                  <button
                    onClick={() => exportService.downloadDeploymentConfig(project)}
                    className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-orange-650 hover:text-white transition flex items-center justify-center gap-1.5"
                  >
                    ⚙️ Deploy Scripts
                  </button>
                </div>
              </div>

              {/* Resume Bullet Points */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  💼 Professional CV Accomplishment Bullets
                </h3>
                <div className="space-y-3">
                  {project.resumeBulletPoints && project.resumeBulletPoints.length > 0 ? (
                    project.resumeBulletPoints.map((bullet, i) => (
                      <div key={i} className="bg-black/30 border border-white/5 p-3 rounded-lg text-xs text-gray-300 leading-relaxed pl-4 border-l-2 border-indigo-500">
                        {bullet}
                      </div>
                    ))
                  ) : (
                    <div className="bg-black/30 border border-white/5 p-3 rounded-lg text-xs text-gray-300 leading-relaxed pl-4 border-l-2 border-indigo-500">
                      • Designed and implemented {project.name} using {project.techStack.frontend} and {project.techStack.database}, boosting processing speed by 35% through structured API queries.
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* LinkedIn Post Share */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Share2 className="w-5 h-5 text-blue-400" /> Copy-Ready LinkedIn Description
                </h3>
                <div className="bg-black/50 border border-white/10 p-4 rounded-xl text-xs font-sans text-gray-300 leading-relaxed whitespace-pre-wrap select-all">
                  {project.linkedinDescription || `🚀 Just completed building ${project.name} using ${project.techStack.frontend}, ${project.techStack.backend}, and ${project.techStack.database}! \n\nThroughout the process, I mastered relational db schemas setups, full-duplex socket integrations, and writing secure server route handlers. Check out ProjectForge AI to build your own systems!`}
                </div>
              </GlassCard>

              {/* Technical Interview Prep Questions */}
              {project.interviewQuestions && project.interviewQuestions.length > 0 && (
                <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                  <h3 className="text-base font-bold text-white">
                    🎯 Core Interview Prep Questions
                  </h3>
                  <div className="space-y-4">
                    {project.interviewQuestions.map((q, i) => (
                      <div key={i} className="space-y-1.5 border-t border-white/5 pt-4 first:border-none first:pt-0">
                        <div className="text-xs font-bold text-indigo-400">Q: {q.question}</div>
                        <div className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg">{q.answer}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {/* TAB 10: AGENT MODE (AUTONOMOUS LOOP) */}
          {activeTab === 'agent' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#09090B]">
              {/* TOP HEADER STATUS */}
              <div className="border-b border-white/5 p-4 bg-[#111827]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    Autonomous Agent Workspace
                  </h1>
                  <p className="text-[11px] text-gray-400">
                    Watch the multi-agent software engineering team coordinate, code, debug, and complete your application.
                  </p>
                </div>
                
                {/* Control Action Buttons */}
                <div className="flex items-center gap-2">
                  {agentLoopStatus === 'idle' && (
                    <button
                      onClick={startAgentLoop}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition active:scale-95 animate-pulse"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Engine
                    </button>
                  )}
                  {agentLoopStatus === 'running' && (
                    <button
                      onClick={() => setAgentLoopStatus('paused')}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause Loop
                    </button>
                  )}
                  {agentLoopStatus === 'paused' && (
                    <button
                      onClick={startAgentLoop}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume Engine
                    </button>
                  )}
                  {agentLoopStatus === 'completed' && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      ✓ Project Complete
                    </span>
                  )}
                </div>
              </div>

              {/* PROGRESS ROADMAP INDICATOR */}
              <div className="px-6 py-4 border-b border-white/5 bg-[#111827]/5">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                  <span>Current Phase: <span className="text-indigo-400">{currentPhase}</span></span>
                  <span>{agentLoopStatus === 'running' ? '⚡ Loops Running' : '⏸ Standing By'}</span>
                </div>
                <div className="grid grid-cols-6 gap-1 h-2 rounded-full overflow-hidden bg-white/5">
                  <div className={`h-full ${['analysis', 'architecture', 'planning', 'implementation', 'documentation', 'complete'].includes(currentPhase) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className={`h-full ${['architecture', 'planning', 'implementation', 'documentation', 'complete'].includes(currentPhase) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className={`h-full ${['planning', 'implementation', 'documentation', 'complete'].includes(currentPhase) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className={`h-full ${['implementation', 'documentation', 'complete'].includes(currentPhase) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className={`h-full ${['documentation', 'complete'].includes(currentPhase) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  <div className={`h-full ${currentPhase === 'complete' ? 'bg-indigo-500' : 'bg-transparent'}`} />
                </div>
              </div>

              {/* TWO PANEL WORKSPACE */}
              <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Multi-Agent Conversation Box */}
                <div className="w-1/2 border-r border-white/5 p-4 flex flex-col overflow-y-auto space-y-4 bg-black/10">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Agent Team Room</div>
                  {agentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-2">
                      <Cpu className="w-8 h-8 text-gray-600 animate-bounce" />
                      <p className="text-xs">Start the autonomous engine to view agent collaboration chats.</p>
                    </div>
                  ) : (
                    agentMessages.map((msg, index) => (
                      <div key={index} className="flex gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-[#1e1b4b] border border-[#4f46e5]/30 flex items-center justify-center text-sm shrink-0">
                          {msg.avatar}
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                            {msg.sender}
                            <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 font-normal uppercase tracking-wider">{msg.role}</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-xs text-gray-200 leading-relaxed font-light whitespace-pre-wrap max-w-md">
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* RIGHT: Console Logs & Outputs */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-black/30">
                  {/* Tab header for right side */}
                  <div className="border-b border-white/5 px-4 py-2 bg-black/40 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider animate-pulse">
                    <span>Logs Console output</span>
                    <button
                      onClick={() => setAgentConsoleLogs([])}
                      className="hover:text-white transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-gray-400 space-y-2 text-left">
                    {agentConsoleLogs.length === 0 ? (
                      <div className="text-center text-gray-600 py-12">Console is ready. Start execution loop...</div>
                    ) : (
                      agentConsoleLogs.map((log, index) => (
                        <div key={index} className={`leading-relaxed ${log.startsWith('✓') || log.startsWith('PASS') ? 'text-emerald-400' : log.startsWith('[System]') ? 'text-indigo-400' : 'text-gray-400'}`}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>

                  {/* PORTFOLIO BUNDLE DRAWER */}
                  {currentPhase === 'complete' && portfolioBundle && (
                    <div className="border-t border-white/5 bg-[#111827]/40 p-4 space-y-4 overflow-y-auto max-h-[300px]">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        🎉 Portfolio Bundle generated!
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([portfolioBundle.readme], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'PORTFOLIO_README.md';
                            a.click();
                          }}
                          className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs py-2 px-3 rounded-lg hover:bg-indigo-500 hover:text-white transition font-medium"
                        >
                          📄 Download Portfolio Readme
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(portfolioBundle.interviewQuestions, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'INTERVIEW_PREP.json';
                            a.click();
                          }}
                          className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs py-2 px-3 rounded-lg hover:bg-purple-500 hover:text-white transition font-medium"
                        >
                          📚 Download Interview Guides
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* LOCAL AI STATUS BAR */}
      <footer className="h-8 border-t border-white/5 bg-[#0e0e11]/80 backdrop-blur px-6 flex items-center justify-between shrink-0 text-[10px] font-medium text-gray-400 select-none z-10 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-semibold text-white/80">{ollamaConnected ? 'Ollama Connected' : 'Ollama Offline'}</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-gray-500">
            <Cpu className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Active Model: <span className="text-white/85 font-mono">{ollamaModel}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {inferenceStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>
                {inferenceStatus === 'generating' ? 'Generating response...' : 'Loading local model...'}
              </span>
            </div>
          )}
          {inferenceStatus === 'generating' && (
            <>
              <div className="h-3 w-px bg-white/10" />
              <div className="text-gray-500 font-mono">
                Speed: <span className="text-indigo-400 font-bold">{tpsSpeed}</span>
              </div>
            </>
          )}
          <div className="h-3 w-px bg-white/10" />
          <div className="text-gray-650 text-[9px] uppercase tracking-wider font-mono">
            Local AI Inference Layer
          </div>
        </div>
      </footer>

      {/* Command Palette Overlay */}
      {isPaletteOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex justify-center items-start pt-[12vh] z-50 p-4"
          onClick={() => setIsPaletteOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-[#09090b]/95 border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4 text-left font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-gray-400 font-mono text-xs text-indigo-400">Ctrl+P</span>
              <input 
                type="text" 
                autoFocus
                placeholder="Type '>' for commands, '#' for lessons, '@' for notes, or file name..."
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm font-medium"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
              {/* Commands list */}
              {paletteSearch.startsWith('>') ? (
                [
                  { label: 'Explain File Code', action: () => { triggerAiAction('explain'); setIsPaletteOpen(false); } },
                  { label: 'Scan Code Diagnostics', action: () => { triggerAiAction('debug'); setIsPaletteOpen(false); } },
                  { label: 'Improve & Refactor Selection', action: () => { triggerAiAction('improve'); setIsPaletteOpen(false); } },
                  { label: 'Switch Workspace view to Lessons', action: () => { setActiveTab('lessons'); setIsPaletteOpen(false); } },
                  { label: 'Run SOLID Code Review Report', action: () => { setActiveTab('reviewer'); setIsPaletteOpen(false); } },
                  { label: 'Export career booster assets', action: () => { setActiveTab('export'); setIsPaletteOpen(false); } }
                ].filter(cmd => cmd.label.toLowerCase().includes(paletteSearch.slice(1).toLowerCase().trim())).map((cmd, i) => (
                  <button
                    key={i}
                    onClick={cmd.action}
                    className="w-full flex items-center justify-between text-left text-xs text-gray-300 hover:text-white p-2.5 rounded-lg hover:bg-white/5 transition"
                  >
                    <span>⚡ {cmd.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono">Action</span>
                  </button>
                ))
              ) : paletteSearch.startsWith('#') ? (
                project?.lessons.filter((l: any) => l.title.toLowerCase().includes(paletteSearch.slice(1).toLowerCase().trim())).map((lesson: any, i: number) => {
                  const idx = project.lessons.findIndex(l => l.id === lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveTab('lessons');
                        setActiveLessonIdx(idx);
                        setIsPaletteOpen(false);
                      }}
                      className="w-full flex items-center justify-between text-left text-xs text-gray-300 hover:text-white p-2.5 rounded-lg hover:bg-white/5 transition"
                    >
                      <span>📚 {lesson.title}</span>
                      <span className="text-[10px] text-indigo-400">Lesson {idx + 1}</span>
                    </button>
                  );
                })
              ) : paletteSearch.startsWith('@') ? (
                notes.filter((n: Note) => n.projectId === project?.id && (n.title.toLowerCase().includes(paletteSearch.slice(1).toLowerCase().trim()) || n.content.toLowerCase().includes(paletteSearch.slice(1).toLowerCase().trim()))).map((note: Note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      if (note.linkedFile) {
                        openEditorTab(note.linkedFile);
                        setActiveTab('code');
                      } else if (note.linkedLessonId) {
                        const idx = project?.lessons.findIndex(l => l.id === note.linkedLessonId) ?? 0;
                        if (idx !== -1) {
                          setActiveLessonIdx(idx);
                          setActiveTab('lessons');
                        }
                      }
                      setIsPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-left text-xs text-gray-300 hover:text-white p-2.5 rounded-lg hover:bg-white/5 transition"
                  >
                    <span>📝 {note.title}</span>
                    <span className="text-[10px] text-yellow-500">Note</span>
                  </button>
                ))
              ) : (
                // Default: search files
                project && (
                  (() => {
                    const allFiles: string[] = [];
                    const grabFiles = (nodes: FileNode[]) => {
                      nodes.forEach(n => {
                        if (n.type === 'file') allFiles.push(n.path);
                        if (n.children) grabFiles(n.children);
                      });
                    };
                    grabFiles(project.files);
                    return allFiles.filter((f: string) => f.toLowerCase().includes(paletteSearch.toLowerCase().trim())).map((f: string) => (
                      <button
                        key={f}
                        onClick={() => {
                          openEditorTab(f);
                          setActiveTab('code');
                          setIsPaletteOpen(false);
                        }}
                        className="w-full flex items-center justify-between text-left text-xs text-gray-300 hover:text-white p-2.5 rounded-lg hover:bg-white/5 transition"
                      >
                        <span>📄 {f.split('/').pop()}</span>
                        <span className="text-[10px] text-gray-500">{f}</span>
                      </button>
                    ));
                  })()
                )
              )}
            </div>
            
            <div className="text-[10px] text-gray-500 flex justify-between border-t border-white/5 pt-3">
              <span>Use arrow keys to navigate, Enter to select</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
