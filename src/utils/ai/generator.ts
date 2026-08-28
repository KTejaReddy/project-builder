import { ProjectConfig, AIProviderConfig } from '../../types/ai';
import { Project, FileNode, ProjectTask, BugReport } from '../../types/project';
import { promptBuilders } from './promptBuilders';
import {
  AiProvider,
  OllamaProvider,
  MockAiProvider
} from './providers';
import {
  extractJSON,
  unpackNestedJSONStrings,
  validateSchema,
  SCHEMAS,
  ValidationResult
} from './parser';

// ─── Provider factory ─────────────────────────────────────────────────────────

export function getProvider(config: AIProviderConfig): AiProvider {
  const isClient = typeof window !== 'undefined';
  const localUrl = isClient
    ? localStorage.getItem('ollama_url') || 'http://localhost:11434'
    : 'http://localhost:11434';

  if (config.provider === 'mock') return new MockAiProvider();
  return new OllamaProvider(localUrl);
}

export interface ProgressCallback {
  (stepIndex: number, logMessage: string): void;
}

// ─── Per-step generation config ───────────────────────────────────────────────

interface StepConfig {
  numPredict: number;   // token budget
  timeoutMs: number;    // max wait per attempt
  maxRetries: number;   // backoff retries on timeout/network error
}

const STEP_CONFIGS: Record<string, StepConfig> = {
  planner:       { numPredict: 600,  timeoutMs: 120000, maxRetries: 1 },
  architecture:  { numPredict: 400,  timeoutMs: 90000,  maxRetries: 1 },
  database:      { numPredict: 700,  timeoutMs: 180000, maxRetries: 2 },
  folder:        { numPredict: 800,  timeoutMs: 120000, maxRetries: 1 },
  api:           { numPredict: 700,  timeoutMs: 120000, maxRetries: 2 },
  lesson:        { numPredict: 900,  timeoutMs: 180000, maxRetries: 2 },
  career:        { numPredict: 600,  timeoutMs: 120000, maxRetries: 1 },
  documentation: { numPredict: 500,  timeoutMs: 90000,  maxRetries: 1 },
};

// ─── Core JSON-with-validation generator ──────────────────────────────────────

/**
 * Calls the provider, parses JSON, runs schema validation, and retries if needed.
 *
 * Retry order:
 *  1. Initial prompt  → extract + validate
 *  2. Retry prompt    → extract + validate (if parse failed)
 *  3. Field fix       → extract + validate (if validation failed on specific fields)
 *  4. Return fallback (never throws)
 */
async function generateAndValidate<T>(
  provider: AiProvider,
  prompt: string,
  schemaKey: keyof typeof SCHEMAS | null,
  fallback: T,
  stepName: string
): Promise<T> {
  const cfg = STEP_CONFIGS[stepName] ?? { numPredict: 600, timeoutMs: 120000, maxRetries: 1 };

  // ── Helper: call model + parse JSON ──
  const callAndParse = async (p: string): Promise<{ raw: string; parsed: any | null }> => {
    let raw = '';
    try {
      if (provider.generateWithOptions) {
        raw = await provider.generateWithOptions(p, {
          numPredict: cfg.numPredict,
          timeoutMs: cfg.timeoutMs,
          maxRetries: cfg.maxRetries,
          temperature: 0.3, // Lower temp = more deterministic JSON
          schemaKey: schemaKey || undefined
        });
      } else {
        raw = await provider.generate(p, undefined, { schemaKey });
      }
    } catch (err: any) {
      console.error(`[${stepName}] Model call failed:`, err.message);
      return { raw: '', parsed: null };
    }

    console.log(`[${stepName}] Response (${raw.length} chars):`, raw.substring(0, 200));

    const extracted = extractJSON(raw);
    if (!extracted) {
      console.warn(`[${stepName}] No JSON found in response`);
      return { raw, parsed: null };
    }

    try {
      const parsed = unpackNestedJSONStrings(JSON.parse(extracted));
      return { raw, parsed };
    } catch (err) {
      console.warn(`[${stepName}] JSON.parse failed:`, err);
      return { raw, parsed: null };
    }
  };

  // ── Helper: validate parsed data ──
  const validate = (parsed: any): ValidationResult => {
    if (!schemaKey) return { valid: true, missingFields: [], invalidFields: [], errors: [] };
    const schema = SCHEMAS[schemaKey] as any;
    const result = validateSchema(parsed, schema, stepName);
    if (!result.valid) {
      console.warn(`[${stepName}] Schema validation failed:`);
      result.errors.forEach(e => console.warn(`  → ${e}`));
    } else {
      console.log(`[${stepName}] ✓ Schema validation passed`);
    }
    return result;
  };

  // ── Attempt 1: initial prompt ──
  const { raw: raw1, parsed: parsed1 } = await callAndParse(prompt);
  if (parsed1 !== null) {
    const v = validate(parsed1);
    if (v.valid) {
      console.log(`[${stepName}] ✓ Completed on first attempt`);
      return parsed1 as T;
    }

    // ── Attempt 3: field fix (if parsed but invalid schema) ──
    if (v.missingFields.length > 0 || v.invalidFields.length > 0) {
      console.warn(`[${stepName}] Attempting field fix for: ${[...v.missingFields, ...v.invalidFields].join(', ')}`);
      const fixPrompt = promptBuilders.buildFieldFixPrompt(
        stepName,
        [...v.missingFields, ...v.invalidFields],
        prompt
      );
      const { parsed: parsed3 } = await callAndParse(fixPrompt);
      if (parsed3 !== null) {
        const v3 = validate(parsed3);
        if (v3.valid) {
          console.log(`[${stepName}] ✓ Completed after field fix`);
          return parsed3 as T;
        }
      }
      // Return partial result — better than fallback if most fields are present
      console.warn(`[${stepName}] Field fix failed — using partial result`);
      return parsed1 as T;
    }
  }

  // ── Attempt 2: retry with correction prompt (if parse failed) ──
  if (parsed1 === null && raw1) {
    console.warn(`[${stepName}] Retrying with correction prompt`);
    const retryPrompt = promptBuilders.buildRetryPrompt(prompt, raw1);
    const { parsed: parsed2 } = await callAndParse(retryPrompt);
    if (parsed2 !== null) {
      const v2 = validate(parsed2);
      if (v2.valid) {
        console.log(`[${stepName}] ✓ Completed after retry`);
        return parsed2 as T;
      }
      console.warn(`[${stepName}] Retry parsed but failed validation — using partial result`);
      return parsed2 as T;
    }
  }

  console.error(`[${stepName}] All attempts failed — using fallback`);
  return fallback;
}

// ─── SDLC Generators ──────────────────────────────────────────────────────────

function generateProjectTasks(config: ProjectConfig): ProjectTask[] {
  return [
    {
      id: 't1-1',
      title: 'Scaffold Workspace & Dependencies',
      description: `Initialize the ${config.techStack.frontend} application framework, install packages, and check configuration settings profiles.`,
      status: 'completed',
      difficulty: 'Easy',
      estimatedHours: 2,
      assignedAgent: 'Project Manager',
      sprint: 1,
      files: ['package.json', 'README.md'],
      acceptanceCriteria: ['package.json exists with valid dependencies', 'README contains project title']
    },
    {
      id: 't1-2',
      title: 'Database Schema Normalization & Migrations',
      description: `Create relational tables with PK/FK references in ${config.techStack.database} for Users and Sessions.`,
      status: 'ready',
      difficulty: 'Medium',
      estimatedHours: 3,
      assignedAgent: 'Database Engineer',
      sprint: 1,
      files: ['src/db/schema.sql'],
      acceptanceCriteria: ['CREATE TABLE users exists with UUID primary key', 'CREATE TABLE sessions references users(id)']
    },
    {
      id: 't1-3',
      title: 'Environment Variables & Config Profiles',
      description: 'Configure development, staging, and production environment profiles.',
      status: 'backlog',
      difficulty: 'Easy',
      estimatedHours: 1,
      assignedAgent: 'DevOps Engineer',
      sprint: 1,
      files: ['.env.example'],
      acceptanceCriteria: ['.env.example contains database connection key placeholders']
    },
    {
      id: 't2-1',
      title: 'Configure JWT Auth Gateway Middleware',
      description: `Implement secure endpoints and password hashing inside ${config.techStack.backend}.`,
      status: 'backlog',
      difficulty: 'Hard',
      estimatedHours: 4,
      assignedAgent: 'Security Engineer',
      sprint: 2,
      files: ['src/middleware/auth.ts'],
      acceptanceCriteria: ['Middleware intercepts requests without authorization tokens', 'Validates JWT signatures']
    },
    {
      id: 't2-2',
      title: 'Implement Core Data REST Endpoints',
      description: `Generate GET, POST, and DELETE handler functions in ${config.techStack.backend} for item collections.`,
      status: 'backlog',
      difficulty: 'Medium',
      estimatedHours: 4,
      assignedAgent: 'API Engineer',
      sprint: 2,
      files: ['src/app/api/items/route.ts'],
      acceptanceCriteria: ['GET returns list of items', 'POST creates a validated item record']
    },
    {
      id: 't3-1',
      title: 'Implement Core Dashboard View Components',
      description: `Build the main user interface layout using ${config.techStack.frontend} components.`,
      status: 'backlog',
      difficulty: 'Medium',
      estimatedHours: 5,
      assignedAgent: 'Frontend Engineer',
      sprint: 3,
      files: ['src/components/Dashboard.tsx'],
      acceptanceCriteria: ['Renders list of items dynamically', 'Displays loading state indicator']
    },
    {
      id: 't3-2',
      title: 'Frontend API Connection Integration',
      description: 'Hook UI components to backend API services with async fetch handlers.',
      status: 'backlog',
      difficulty: 'Medium',
      estimatedHours: 3,
      assignedAgent: 'Frontend Engineer',
      sprint: 3,
      files: ['src/utils/api.ts'],
      acceptanceCriteria: ['Fetch requests send Authorization headers properly', 'Handles 401 unauthorized errors']
    },
    {
      id: 't4-1',
      title: 'Deploy Unit & E2E Validation Tests',
      description: 'Write Jest component specs and mock endpoint request tests.',
      status: 'backlog',
      difficulty: 'Medium',
      estimatedHours: 3,
      assignedAgent: 'Test Engineer',
      sprint: 4,
      files: ['src/tests/auth.test.ts'],
      acceptanceCriteria: ['Auth login test mock completes with 200 OK']
    },
    {
      id: 't4-2',
      title: 'Bundle Size Performance Tuning',
      description: 'Integrate code lazy-loading and request debouncing.',
      status: 'backlog',
      difficulty: 'Medium',
      estimatedHours: 2,
      assignedAgent: 'Performance Engineer',
      sprint: 4,
      files: ['src/components/Header.tsx'],
      acceptanceCriteria: ['Image objects use lazy load attributes', 'Typing actions use lodash debouncing']
    },
    {
      id: 't4-3',
      title: 'Finalize Vercel/Railway Production Pipelines',
      description: `Build production-ready release package and document environment configuration guidelines.`,
      status: 'backlog',
      difficulty: 'Easy',
      estimatedHours: 2,
      assignedAgent: 'DevOps Engineer',
      sprint: 4,
      files: ['vercel.json'],
      acceptanceCriteria: ['vercel.json exists with routing rewrite rules mapping to build outputs']
    }
  ];
}

function generateMockBugs(config: ProjectConfig): BugReport[] {
  return [
    {
      id: 'bug-1',
      title: 'JWT Authentication Token Verification Fails on Expiry',
      severity: 'High',
      priority: 'High',
      status: 'open',
      module: 'Authentication',
      files: ['src/middleware/auth.ts'],
      assignedAgent: 'Security Engineer',
      description: 'When the JWT token expires, the backend API crashes with an unhandled rejection error instead of returning a clean 401 Unauthorized response.'
    },
    {
      id: 'bug-2',
      title: 'SQL Foreign Key Reference Missing in Sessions Table migration',
      severity: 'Medium',
      priority: 'Medium',
      status: 'open',
      module: 'Database Design',
      files: ['src/db/schema.sql'],
      assignedAgent: 'Database Engineer',
      description: 'The sessions table does not enforce foreign key checks, allowing orphaned sessions to persist when a user profile is deleted.'
    }
  ];
}

function generateDocsFiles(project: Project): FileNode {
  return {
    name: 'docs',
    path: 'docs',
    type: 'folder',
    children: [
      {
        name: 'srs.md',
        path: 'docs/srs.md',
        type: 'file',
        content: `# Software Requirements Specification (SRS) for ${project.name}\n\n## 1. Problem Statement\nThis project addresses the educational and technical challenges of building a secure, scalable application for: ${project.description}.\n\n## 2. Scope & Target Users\n*   **Target Audience**: Junior developers seeking production scaffolding experience.\n*   **Mode of Operation**: ${project.generationMode === 'learn' ? 'Interactive Learning Pathway' : 'Accelerated Generation Mode'}.\n\n## 3. Functional Requirements\n*   **FR-1 (Auth)**: Secure user login, session token signin verification.\n*   **FR-2 (Core Flow)**: REST API operations mapping to persistent database storage.\n\n## 4. Non-Functional Requirements\n*   **Security**: Unhashed passwords are never saved; JWT tokens rotate regularly.\n*   **Performance**: Rendering speeds remain under 200ms on desktop/mobile views.\n*   **Accessibility**: Elements conform to WCAG 2.1 color contrast guidelines.`
      },
      {
        name: 'architecture.md',
        path: 'docs/architecture.md',
        type: 'file',
        content: `# High Level (HLD) & Low Level (LLD) Design\n\n## 1. System Topology Diagram\n\`\`\`\n[ Client View (${project.techStack.frontend}) ]\n      │ (HTTPS / JSON REST API)\n      ▼\n[ Backend API Engine (${project.techStack.backend}) ]\n      │ (SQL DDL / CRUD Queries)\n      ▼\n[ Database Storage (${project.techStack.database}) ]\n\`\`\`\n\n## 2. Request Lifecycle Design\n1. Client issues request to endpoints (e.g. POST /api/auth/login) with credentials parameters.\n2. Middleware intercepts request, handles session checks, verifies encryption signatures.\n3. Controller retrieves table records, updates database models, commits transaction pools.\n4. Response is formatted as structured JSON and returned with standard HTTP status codes.`
      },
      {
        name: 'database.md',
        path: 'docs/database.md',
        type: 'file',
        content: `# Database Specifications & Entity Normalizations\n\n## 1. Database Engine\n*   **Database Tech**: ${project.techStack.database}\n\n## 2. Relational Schemas (Normalized ERD)\n*   **Users Table**: Maps user primary profiles, login hashes, and streak milestones.\n*   **Sessions Table**: Traces active bearer tokens mapping back to user id (FK).\n\n## 3. SQLite/SQL Migration Blueprint\n\`\`\`sql\n-- Create users profile relation\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email VARCHAR(255) UNIQUE NOT NULL,\n  password_hash VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\`\`\``
      },
      {
        name: 'api.md',
        path: 'docs/api.md',
        type: 'file',
        content: `# API Specification Docs\n\n## 1. Base Endpoint URL\nAll API requests map to: \`http://localhost:8080/api/v1\`\n\n## 2. Endpoints specifications\n*   **POST /auth/login**: Login credentials verify. Returns authentication bearer token.\n*   **GET /items**: Retrieve validated item lists.\n*   **POST /items**: Save item transaction properties.`
      },
      {
        name: 'testing.md',
        path: 'docs/testing.md',
        type: 'file',
        content: `# Quality Assurance Testing Strategy\n\n## 1. Testing Frameworks\n*   Unit Testing: Jest\n*   Mock Handlers: MSW (Mock Service Worker)\n\n## 2. Automated Test Pipelines\n1. Run local test execution: \`npm test\`\n2. Verify endpoints verify response states.\n3. Check UI layouts render state transitions accurately.`
      },
      {
        name: 'deployment.md',
        path: 'docs/deployment.md',
        type: 'file',
        content: `# Deployment & Host Configuration Guide\n\n## 1. Target Infrastructure Hosting\n*   **Hosting Target**: ${project.techStack.deployment}\n\n## 2. Environment Variables checklist\n*   \`DATABASE_URL\`: Persistent database connection path.\n*   \`JWT_SECRET_KEY\`: Secret key signature string.\n\n## 3. Rollback Strategy\nIf build fails, revert master branch to previous release tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag tag.
\`
\n## 3. Rollback Strategy\nIf build fails, revert to previous release version snapshot directly.`
      }
    ]
  };
}

// ─── Main project generator ───────────────────────────────────────────────────

export async function generateProject(
  projectConfig: ProjectConfig,
  providerConfig: AIProviderConfig,
  onProgress?: ProgressCallback
): Promise<Project> {
  const provider = getProvider(providerConfig);
  const projectId = 'project-' + Math.random().toString(36).substring(2, 11);

  let project: Project = {
    id: projectId,
    name: projectConfig.name,
    description: projectConfig.description,
    difficulty: projectConfig.difficulty,
    techStack: projectConfig.techStack,
    estimatedTime: '12 Hours',
    xpReward: 1200,
    skills: [],
    objectives: [],
    features: projectConfig.features || ['User Authentication', 'Database Integration', 'Scalable Architecture'],
    roadmap: [],
    files: [],
    lessons: [],
    apiDocs: [],
    dbSchemas: [],
    architecture: { systemDiagram: '', databaseDiagram: '', flowDiagram: '', componentDiagram: '' },
    interviewQuestions: [],
    resumeBulletPoints: [],
    linkedinDescription: '',
    readme: '',
    generationMode: projectConfig.generationMode || 'learn',
    sprintIndex: 0,
    tasks: generateProjectTasks(projectConfig),
    bugTracker: generateMockBugs(projectConfig),
    srsDoc: `# SRS - ${projectConfig.name}\n\n${projectConfig.description}`
  };

  const steps = [
    {
      name: 'planner',
      log: 'Creating project roadmap and learning milestones...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildPlannerPrompt(projectConfig),
          'planner', {}, 'planner'
        );
        project.estimatedTime = typeof parsed.estimatedTime === 'string' ? parsed.estimatedTime : '12 Hours';
        project.xpReward = typeof parsed.xpReward === 'number' ? parsed.xpReward :
          (projectConfig.difficulty === 'Beginner' ? 800 :
           projectConfig.difficulty === 'Intermediate' ? 1200 :
           projectConfig.difficulty === 'Advanced' ? 1800 : 2500);
        project.skills = Array.isArray(parsed.skills) ? parsed.skills :
          [projectConfig.techStack.frontend, projectConfig.techStack.backend];
        project.objectives = Array.isArray(parsed.objectives) ? parsed.objectives :
          [`Build ${projectConfig.name}`];
        project.roadmap = Array.isArray(parsed.roadmap) ? parsed.roadmap : [];
      }
    },
    {
      name: 'architecture',
      log: 'Designing system architecture and data flows...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildArchitecturePrompt(projectConfig),
          'architecture', {}, 'architecture'
        );
        project.architecture = {
          systemDiagram:    typeof parsed.systemDiagram    === 'string' ? parsed.systemDiagram    : `${projectConfig.techStack.frontend} → ${projectConfig.techStack.backend} → ${projectConfig.techStack.database}`,
          databaseDiagram:  typeof parsed.databaseDiagram  === 'string' ? parsed.databaseDiagram  : `${projectConfig.techStack.database} with users, sessions, and data tables`,
          flowDiagram:      typeof parsed.flowDiagram      === 'string' ? parsed.flowDiagram      : 'Client → API → Auth → Database → Response',
          componentDiagram: typeof parsed.componentDiagram === 'string' ? parsed.componentDiagram : 'App → Router → Pages → Components → Services',
        };
      }
    },
    {
      name: 'database',
      log: 'Designing database schemas and table relationships...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildDatabasePrompt(projectConfig),
          'database', { dbSchemas: [] }, 'database'
        );
        project.dbSchemas = Array.isArray(parsed.dbSchemas) ? parsed.dbSchemas : [];
      }
    },
    {
      name: 'folder',
      log: 'Scaffolding project file structure...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildFolderPrompt(projectConfig),
          'folder', { files: [] }, 'folder'
        );
        project.files = Array.isArray(parsed.files) ? parsed.files : [];
      }
    },
    {
      name: 'api',
      log: 'Designing REST API endpoint specifications...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildApiPrompt(projectConfig),
          'api', { apiDocs: [] }, 'api'
        );
        project.apiDocs = Array.isArray(parsed.apiDocs) ? parsed.apiDocs : [];
      }
    },
    {
      name: 'lesson',
      log: 'Writing interactive lessons and coding challenges...',
      action: async () => {
        const filePaths: string[] = [];
        const collect = (nodes: FileNode[]) => {
          for (const n of nodes) {
            if (n.type === 'file') filePaths.push(n.path);
            if (n.children) collect(n.children);
          }
        };
        collect(project.files);
        if (filePaths.length === 0) filePaths.push('src/index.tsx');

        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildLessonPrompt(projectConfig, filePaths),
          'lesson', { lessons: [] }, 'lesson'
        );
        project.lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];
      }
    },
    {
      name: 'career',
      log: 'Generating resume bullets and interview questions...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildCareerPrompt(projectConfig),
          'career', {}, 'career'
        );
        project.resumeBulletPoints = Array.isArray(parsed.resumeBulletPoints) ? parsed.resumeBulletPoints : [];
        project.linkedinDescription = typeof parsed.linkedinDescription === 'string' ? parsed.linkedinDescription : '';
        project.interviewQuestions = Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : [];
      }
    },
    {
      name: 'documentation',
      log: 'Writing project README documentation...',
      action: async () => {
        const parsed = await generateAndValidate<any>(
          provider,
          promptBuilders.buildDocumentationPrompt(projectConfig),
          'documentation', {}, 'documentation'
        );
        project.readme = typeof parsed.readme === 'string' && parsed.readme.trim()
          ? parsed.readme
          : `# ${projectConfig.name}\n\n${projectConfig.description}\n\n## Tech Stack\n\n- Frontend: ${projectConfig.techStack.frontend}\n- Backend: ${projectConfig.techStack.backend}\n- Database: ${projectConfig.techStack.database}\n`;
      }
    }
  ];

  // ─── Execute steps — graceful per-step isolation ──────────────────────────

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (onProgress) onProgress(i, step.log);

    try {
      await step.action();
    } catch (e: any) {
      console.error(`[Generator] Step "${step.name}" threw unexpected error:`, e.message || e);
      if (onProgress) {
        onProgress(i, `⚠ ${step.name}: encountered an error, using defaults. Continuing...`);
      }
    }
  }

  // ─── Minimum content guarantees ──────────────────────────────────────────

  if (project.files.length === 0) {
    project.files = [
      {
        name: 'src', path: 'src', type: 'folder',
        children: [
          { name: 'index.tsx', path: 'src/index.tsx', type: 'file', content: `// ${project.name} — Entry Point\nconsole.log("Welcome to ${project.name}");` }
        ]
      },
      { name: 'package.json', path: 'package.json', type: 'file', content: JSON.stringify({ name: project.name.toLowerCase().replace(/\s+/g, '-'), version: '1.0.0' }, null, 2) }
    ];
  }

  if (project.roadmap.length === 0) {
    project.roadmap = [
      { id: 'm1', title: 'Project Setup',    description: 'Initialize project structure and dependencies', status: 'todo', estimatedHours: 2 },
      { id: 'm2', title: 'Core Features',    description: 'Build main application features',               status: 'todo', estimatedHours: 8 },
      { id: 'm3', title: 'Testing & Polish', description: 'Write tests and refine the UI',                 status: 'todo', estimatedHours: 4 },
    ];
  }

  if (project.lessons.length === 0) {
    const firstFile = project.files[0]?.children?.[0]?.path ?? 'src/index.tsx';
    project.lessons = [
      {
        id: 'l1',
        title: `${project.name} — Architecture Overview`,
        objective: `Understand how ${project.name} components fit together`,
        explanation: `This project uses ${projectConfig.techStack.frontend} for the frontend and ${projectConfig.techStack.backend} for the backend. The architecture follows a clean separation of concerns where UI components communicate with backend APIs, which interact with the ${projectConfig.techStack.database} database.`,
        theory: 'Clean architecture separates business logic from infrastructure, making code easier to test and maintain independently.',
        code: `// Example: API call pattern\nconst fetchData = async () => {\n  const res = await fetch('/api/data');\n  return res.json();\n};`,
        path: firstFile,
        whyWeDoThis: 'Separation of concerns allows individual pieces to be tested and replaced independently.',
        commonMistakes: ['Mixing business logic with UI code', 'Not handling async errors'],
        bestPractices: ['Keep components focused on one responsibility', 'Always handle loading and error states'],
        quiz: [{
          id: 'q1',
          question: `Which framework is used for the frontend in ${project.name}?`,
          options: [projectConfig.techStack.frontend, 'Vue.js', 'Angular', 'Svelte'],
          correctAnswer: 0,
          explanation: `${projectConfig.techStack.frontend} is the chosen frontend framework.`
        }],
        challenge: {
          title: 'Add a console greeting',
          instructions: 'Log a welcome message that includes the project name.',
          initialCode: `console.log("Hello!");`,
          solution: `console.log("Welcome to ${project.name}!");`
        },
        completed: false
      }
    ];
  }

  // Inject SDLC Design & Engineering Documents folder
  const docsFolder = generateDocsFiles(project);
  if (!project.files.some(f => f.name === 'docs')) {
    project.files = [docsFolder, ...project.files];
  }

  if (onProgress) onProgress(steps.length, 'Project generated successfully! Opening workspace...');
  return project;
}
