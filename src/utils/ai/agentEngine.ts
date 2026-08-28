import { Project, FileNode, ProjectTask } from '../../types/project';
import { AiProvider } from './providers';

// ─── Agent Personalities ──────────────────────────────────────────────────────
export interface AgentMessage {
  sender: string;
  avatar: string;
  role: string;
  message: string;
}

export const AGENT_TEAM = {
  pm: { name: 'Sarah (Project Manager)', role: 'PM', avatar: '📋' },
  architect: { name: 'Alex (Architect)', role: 'Architect', avatar: '📐' },
  developer: { name: 'David (Developer)', role: 'Developer', avatar: '💻' },
  security: { name: 'Elena (Security Auditor)', role: 'Security', avatar: '🔒' },
  performance: { name: 'Peter (Performance Optimizer)', role: 'Performance', avatar: '⚡' },
  tester: { name: 'Toby (Test Engineer)', role: 'Tester', avatar: '🧪' },
  debugger: { name: 'Dan (Debugger Agent)', role: 'Debugger', avatar: '🐛' }
};

// ─── Dynamic Agent Chat Generator ─────────────────────────────────────────────
export function getAgentChatForTask(task: ProjectTask): AgentMessage[] {
  return [
    {
      sender: AGENT_TEAM.pm.name,
      role: AGENT_TEAM.pm.role,
      avatar: AGENT_TEAM.pm.avatar,
      message: `Team, we are starting task "${task.title}". The goal is: ${task.description}. The expected files are: ${task.files.join(', ')}. David, please review the requirements and begin code generation.`
    },
    {
      sender: AGENT_TEAM.architect.name,
      role: AGENT_TEAM.architect.role,
      avatar: AGENT_TEAM.architect.avatar,
      message: `I've mapped out the modules. We must ensure the component structure is modular and respects our technology boundaries. The files will reside in: ${task.files.map(f => `\`${f}\``).join(', ')}.`
    },
    {
      sender: AGENT_TEAM.developer.name,
      role: AGENT_TEAM.developer.role,
      avatar: AGENT_TEAM.developer.avatar,
      message: `Understood. Generating clean code implementation now. I will focus on the acceptance criteria: ${task.acceptanceCriteria.join('; ')}.`
    },
    {
      sender: AGENT_TEAM.security.name,
      role: AGENT_TEAM.security.role,
      avatar: AGENT_TEAM.security.avatar,
      message: `I will audit the generated buffers. Ensure token keys are safe, input lengths are validated, and no unescaped database injections are possible.`
    },
    {
      sender: AGENT_TEAM.performance.name,
      role: AGENT_TEAM.performance.role,
      avatar: AGENT_TEAM.performance.avatar,
      message: `Make sure queries are optimized and the rendering loop avoids un-memoized callbacks.`
    },
    {
      sender: AGENT_TEAM.tester.name,
      role: AGENT_TEAM.tester.role,
      avatar: AGENT_TEAM.tester.avatar,
      message: `Writing Jest specifications to assert these actions. I'll execute compiler verification once ready.`
    }
  ];
}

// ─── Direct File Tree Injector ────────────────────────────────────────────────
export function addOrUpdateFileInTree(files: FileNode[], path: string, content: string): FileNode[] {
  const parts = path.split('/');
  const name = parts[parts.length - 1];

  // Helper to walk and insert recursively
  const walk = (nodes: FileNode[], currentParts: string[], index: number): FileNode[] => {
    const currentName = currentParts[index];
    const isLast = index === currentParts.length - 1;

    const existing = nodes.find(n => n.name === currentName);

    if (isLast) {
      if (existing) {
        return nodes.map(n => n.name === currentName ? { ...n, content } : n);
      } else {
        return [...nodes, { name: currentName, path, type: 'file', content, children: [] }];
      }
    }

    // It's a folder part
    if (existing) {
      return nodes.map(n => {
        if (n.name === currentName) {
          return {
            ...n,
            children: walk(n.children || [], currentParts, index + 1)
          };
        }
        return n;
      });
    } else {
      // Create folder
      const folderPath = currentParts.slice(0, index + 1).join('/');
      const newFolder: FileNode = {
        name: currentName,
        path: folderPath,
        type: 'folder',
        content: '',
        children: walk([], currentParts, index + 1)
      };
      return [...nodes, newFolder];
    }
  };

  return walk(files, parts, 0);
}

// ─── Code Syntax Checker & Self-Healing Parser ─────────────────────────────────
export interface CodeDiagnostic {
  valid: boolean;
  errors: string[];
  suggestedFix?: string;
}

export function checkCodeSyntax(code: string, path: string): CodeDiagnostic {
  const errors: string[] = [];
  
  // Basic brackets and parentheses matching check
  const checkMatchingPairs = (open: string, close: string) => {
    let count = 0;
    for (let i = 0; i < code.length; i++) {
      if (code[i] === open) count++;
      if (code[i] === close) count--;
      if (count < 0) {
        errors.push(`Unmatched closing character '${close}' at char offset ${i}`);
        return false;
      }
    }
    if (count > 0) {
      errors.push(`Unclosed character block starting with '${open}' (${count} occurrences unmatched)`);
      return false;
    }
    return true;
  };

  checkMatchingPairs('{', '}');
  checkMatchingPairs('(', ')');
  checkMatchingPairs('[', ']');

  // Basic JS/TS syntax warnings
  if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
    if (code.includes('const ') && !code.includes(' = ')) {
      errors.push(`Variable declaration "const" lacks assignment operator '='.`);
    }
  }

  if (errors.length > 0) {
    // Attempt automatic self-healing patch
    let healed = code;
    if (errors.some(e => e.includes(`Unclosed character block starting with '{'`))) {
      // Append missing closers
      healed = healed.trim() + '\n}';
    }
    return {
      valid: false,
      errors,
      suggestedFix: healed
    };
  }

  return { valid: true, errors: [] };
}

// ─── Dynamic Full-Stack Boilerplate Generator ───────────────────────────────
export function getBoilerplateForFile(path: string, projectName: string, techStack: any): string {
  const nameClean = projectName.replace(/\s+/g, '');
  
  if (path.includes('schema.sql')) {
    return `-- SQL Relational Database Migrations Schema for ${projectName}
-- Configured using ${techStack.database} database engine

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'backlog',
  estimated_hours INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  if (path.includes('auth.ts') || path.includes('auth.js')) {
    return `// Authentication Middleware and JWT Signatures verification
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-key-signature';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  email?: string;
}

export async function verifyToken(req: AuthenticatedRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.email = decoded.email;
    return true;
  } catch (err) {
    console.error('[Auth Middleware] JWT Verify failed:', err);
    return false;
  }
}
`;
  }

  if (path.includes('Dashboard.tsx') || path.includes('Dashboard.jsx')) {
    return `// Full-Stack Workspace Dashboard view Component for ${projectName}
import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard records.');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">${projectName} Dashboard</h1>
            <p className="text-xs text-gray-400">Manage relational datasets and application state routes.</p>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase font-bold font-mono">
            Online
          </span>
        </header>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">Loading metrics...</div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 text-left">
            Error: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-2 text-left">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Total Records</span>
              <div className="text-3xl font-extrabold text-white">{items.length}</div>
            </div>
            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-2 text-left col-span-2">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Data Collections</span>
              <ul className="mt-2 space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="bg-white/5 p-2 rounded border border-white/5 text-xs">
                    {item.name || 'Record Item'}
                  </li>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-gray-500 italic">No collections initialized. Create a task!</div>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;
  }

  if (path.includes('package.json')) {
    return `{
  "name": "${nameClean.toLowerCase()}",
  "version": "1.0.0",
  "description": "Production full-stack scaffolding for ${projectName}",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.1.0",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.55",
    "@types/node": "^20.11.19",
    "jest": "^29.7.0"
  }
}`;
  }

  // Generic fallback code matching typescript style
  return `// ${path} - Implementation file for ${projectName}
// Configured using frontend: ${techStack.frontend}, backend: ${techStack.backend}

console.log("[${nameClean}] Initializing file ${path.split('/').pop()}...");

export async function handler() {
  return {
    success: true,
    timestamp: Date.now(),
    message: "Welcome to the ${path.split('/').pop()} handler module."
  };
}
`;
}

// ─── Portfolio Exporter Generator ─────────────────────────────────────────────
export interface PortfolioBundle {
  readme: string;
  architectureGuide: string;
  databaseGuide: string;
  apiDocs: string;
  deploymentGuide: string;
  testingGuide: string;
  maintenanceGuide: string;
  portfolioDescription: string;
  resumeBulletPoints: string[];
  linkedinSummary: string;
  interviewQuestions: Array<{ question: string; answer: string; topic: string }>;
  systemDesignQuestions: Array<{ question: string; scenario: string; keyPoints: string[] }>;
}

export function generatePortfolioBundle(project: Project): PortfolioBundle {
  return {
    readme: `# ${project.name}\n\n${project.description}\n\n## Tech Stack\n- **Frontend**: ${project.techStack.frontend}\n- **Backend**: ${project.techStack.backend}\n- **Database**: ${project.techStack.database}\n- **Deployment**: ${project.techStack.deployment}\n`,
    architectureGuide: `# High-Level Architecture Guide\n\nSystem design topology:\n${project.architecture?.systemDiagram || 'Client-ServerRelational'}\n\nComponent flow diagram:\n${project.architecture?.componentDiagram || 'Layered modular flow.'}`,
    databaseGuide: `# Database & Schema Guide\n\nDatabase: ${project.techStack.database}\n\nSchemas:\n${JSON.stringify(project.dbSchemas, null, 2)}`,
    apiDocs: `# API Reference Documentation\n\nEndpoints:\n${JSON.stringify(project.apiDocs, null, 2)}`,
    deploymentGuide: `# Deployment Guide\n\nDeployment Target: ${project.techStack.deployment}\n\nConfig checks:\n1. Verify environment connection strings.\n2. Expose secure gateway routes.`,
    testingGuide: `# QA & Testing Guide\n\nRuns unit assertions and integration specs in Jest.`,
    maintenanceGuide: `# Maintenance Guide\n\nTrace log handlers and rotate secrets variables regularly.`,
    portfolioDescription: `Built a secure, scalable ${project.name} application utilizing ${project.techStack.frontend} for presentation and ${project.techStack.backend} for server operations, persisting to ${project.techStack.database}.`,
    resumeBulletPoints: [
      `Architected and scaffolded full-stack ${project.name} application utilizing ${project.techStack.frontend} and ${project.techStack.backend}.`,
      `Integrated relational schemas in ${project.techStack.database} minimizing database query durations.`,
      `Automated diagnostic code checking loops reducing production linting compilation errors.`
    ],
    linkedinSummary: `Excited to showcase my latest full-stack project, ${project.name}! Built completely with ${project.techStack.frontend}, ${project.techStack.backend}, and ${project.techStack.database}. Implemented authorization middleware, relational database models, and structured API endpoints. Check out my learning milestones!`,
    interviewQuestions: [
      {
        question: `How did you secure backend routes in ${project.name}?`,
        answer: 'By creating a JWT verify middleware checking authorization headers and validating expiration tags.',
        topic: 'Security'
      },
      {
        question: `What databases structures did you normalize for ${project.name}?`,
        answer: `Designed relational schemas for users and appointments tables, enforcing primary and foreign key constraints on ${project.techStack.database}.`,
        topic: 'Database Design'
      }
    ],
    systemDesignQuestions: [
      {
        question: `How would you scale ${project.name} to 100k daily active users?`,
        scenario: 'High traffic loading spikes checking backend query tables.',
        keyPoints: ['Use Redis caching layer', 'Database read replicas', 'Horizontal load balancer routing']
      }
    ]
  };
}
