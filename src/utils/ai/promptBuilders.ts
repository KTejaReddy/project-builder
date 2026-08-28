import { ProjectConfig } from '../../types/ai';

// ─── Shared strict JSON instruction ──────────────────────────────────────────
const JSON_ONLY = `

CRITICAL: Return ONLY the raw JSON object below. No markdown. No backticks. No explanations. No preamble. Start with { end with }.`;

export const promptBuilders = {

  // ── Planner ────────────────────────────────────────────────────────────────
  buildPlannerPrompt(config: ProjectConfig): string {
    return `You are a software architect. Generate a project plan as JSON.

Project: ${config.name}
Description: ${config.description}
Difficulty: ${config.difficulty}
Stack: ${config.techStack.frontend} / ${config.techStack.backend} / ${config.techStack.database}

Return this exact JSON structure:
{
  "overview": "2-sentence description of the project and its architecture",
  "estimatedTime": "12 Hours",
  "xpReward": 1200,
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "objectives": ["objective1", "objective2", "objective3"],
  "roadmap": [
    {"id": "m1", "title": "Phase Title", "description": "What happens in this phase", "status": "todo", "estimatedHours": 3},
    {"id": "m2", "title": "Phase Title", "description": "What happens in this phase", "status": "todo", "estimatedHours": 4},
    {"id": "m3", "title": "Phase Title", "description": "What happens in this phase", "status": "todo", "estimatedHours": 5}
  ]
}

xpReward must be: Beginner=800, Intermediate=1200, Advanced=1800, Expert=2500.
${JSON_ONLY}`;
  },

  // ── Architecture ───────────────────────────────────────────────────────────
  buildArchitecturePrompt(config: ProjectConfig): string {
    return `Describe the system architecture for this project as JSON.

Project: ${config.name}
Stack: ${config.techStack.frontend} / ${config.techStack.backend} / ${config.techStack.database}

Return this exact JSON structure (all values are plain text strings, NOT SVG, NOT HTML):
{
  "systemDiagram": "Describe in 2 sentences how the frontend, backend, and database connect",
  "databaseDiagram": "Describe the main database tables and their relationships in 2 sentences",
  "flowDiagram": "Describe the authentication or core request-response flow in 2 sentences",
  "componentDiagram": "Describe the main components or modules and how they are organized in 2 sentences"
}
${JSON_ONLY}`;
  },

  // ── Database ───────────────────────────────────────────────────────────────
  buildDatabasePrompt(config: ProjectConfig): string {
    return `Generate database schema for this project as JSON.

Project: ${config.name}
Database: ${config.techStack.database}

Return exactly 2 table schemas in this JSON structure:
{
  "dbSchemas": [
    {
      "table": "users",
      "columns": [
        {"name": "id", "type": "UUID", "key": "PK", "nullable": false, "references": null},
        {"name": "email", "type": "VARCHAR(255)", "key": null, "nullable": false, "references": null},
        {"name": "created_at", "type": "TIMESTAMP", "key": null, "nullable": false, "references": null}
      ],
      "sql": "CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW());"
    },
    {
      "table": "sessions",
      "columns": [
        {"name": "id", "type": "UUID", "key": "PK", "nullable": false, "references": null},
        {"name": "user_id", "type": "UUID", "key": "FK", "nullable": false, "references": "users"}
      ],
      "sql": "CREATE TABLE sessions (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id));"
    }
  ]
}

Replace the example tables with tables appropriate for: ${config.name}.
Keep SQL short (one line per CREATE TABLE). Limit to 2 tables only.
${JSON_ONLY}`;
  },

  // ── Folder Structure ───────────────────────────────────────────────────────
  buildFolderPrompt(config: ProjectConfig): string {
    return `Generate a project folder structure as JSON.

Project: ${config.name}
Stack: ${config.techStack.frontend} / ${config.techStack.backend}

Return exactly this JSON structure with 8-12 nodes total:
{
  "files": [
    {
      "name": "src",
      "path": "src",
      "type": "folder",
      "content": "",
      "children": [
        {"name": "index.tsx", "path": "src/index.tsx", "type": "file", "content": "// Entry point", "children": []},
        {"name": "App.tsx", "path": "src/App.tsx", "type": "file", "content": "// Root component", "children": []},
        {
          "name": "components",
          "path": "src/components",
          "type": "folder",
          "content": "",
          "children": [
            {"name": "Header.tsx", "path": "src/components/Header.tsx", "type": "file", "content": "// Header component", "children": []}
          ]
        }
      ]
    },
    {"name": "package.json", "path": "package.json", "type": "file", "content": "// Package config", "children": []},
    {"name": "README.md", "path": "README.md", "type": "file", "content": "// Documentation", "children": []}
  ]
}

Customize the file names for ${config.name} using ${config.techStack.frontend}. Keep total nodes under 12.
${JSON_ONLY}`;
  },

  // ── API Docs ───────────────────────────────────────────────────────────────
  buildApiPrompt(config: ProjectConfig): string {
    return `Generate 3 REST API endpoint specs for this project as JSON.

Project: ${config.name}
Backend: ${config.techStack.backend}

IMPORTANT: requestBody and responseBody must be JSON OBJECTS, not strings.

Return exactly this JSON structure:
{
  "apiDocs": [
    {
      "method": "POST",
      "endpoint": "/api/auth/login",
      "description": "Authenticate user and return JWT token",
      "headers": {"Content-Type": "application/json"},
      "requestBody": {"email": "user@example.com", "password": "secret123"},
      "responseBody": {"token": "jwt-token-here", "user": {"id": "1", "email": "user@example.com"}},
      "statusCodes": [
        {"code": 200, "description": "Login successful"},
        {"code": 401, "description": "Invalid credentials"}
      ]
    },
    {
      "method": "GET",
      "endpoint": "/api/items",
      "description": "Retrieve list of items",
      "headers": {"Authorization": "Bearer <token>"},
      "requestBody": null,
      "responseBody": {"items": [{"id": "1", "name": "Item Name"}], "total": 1},
      "statusCodes": [
        {"code": 200, "description": "Success"},
        {"code": 401, "description": "Unauthorized"}
      ]
    },
    {
      "method": "POST",
      "endpoint": "/api/items",
      "description": "Create a new item",
      "headers": {"Content-Type": "application/json", "Authorization": "Bearer <token>"},
      "requestBody": {"name": "New Item", "description": "Item description"},
      "responseBody": {"id": "2", "name": "New Item", "created": true},
      "statusCodes": [
        {"code": 201, "description": "Created"},
        {"code": 400, "description": "Validation error"}
      ]
    }
  ]
}

Replace the example endpoints with endpoints appropriate for: ${config.name}.
requestBody must be a JSON object or null. responseBody must be a JSON object. Never use strings for these.
${JSON_ONLY}`;
  },

  // ── Lessons ────────────────────────────────────────────────────────────────
  buildLessonPrompt(config: ProjectConfig, activeFilePaths: string[]): string {
    const path1 = activeFilePaths[0] || 'src/index.tsx';
    return `Generate 1 educational lesson for this project as JSON.

Project: ${config.name}
Stack: ${config.techStack.frontend} + ${config.techStack.backend}

Return exactly this JSON structure:
{
  "lessons": [
    {
      "id": "l1",
      "title": "Core Architecture of ${config.name}",
      "objective": "One sentence describing what the student will learn",
      "explanation": "3-4 sentence explanation of the core concept",
      "theory": "2-3 sentence technical deep-dive",
      "code": "// Short 5-10 line code example\\nfunction example() {\\n  return true;\\n}",
      "path": "${path1}",
      "whyWeDoThis": "1-2 sentence explanation of the architectural reason",
      "commonMistakes": ["Mistake one description", "Mistake two description"],
      "bestPractices": ["Best practice one", "Best practice two"],
      "quiz": [
        {
          "id": "q1",
          "question": "A multiple choice question about the lesson topic?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why option A is correct"
        }
      ],
      "challenge": {
        "title": "Hands-on challenge title",
        "instructions": "Write a function that does X",
        "initialCode": "// Your code here",
        "solution": "function solution() { return true; }"
      },
      "completed": false
    }
  ]
}

Customize all content for ${config.name} using ${config.techStack.frontend}.
Keep code examples under 10 lines. Keep all text fields concise.
${JSON_ONLY}`;
  },

  // ── Career ─────────────────────────────────────────────────────────────────
  buildCareerPrompt(config: ProjectConfig): string {
    return `Generate career assets for a developer who built this project as JSON.

Project: ${config.name}
Tech: ${config.techStack.frontend}, ${config.techStack.backend}, ${config.techStack.database}

Return exactly this JSON structure:
{
  "resumeBulletPoints": [
    "Built [specific feature] using ${config.techStack.frontend} and ${config.techStack.backend}, resulting in [quantified outcome]",
    "Implemented [specific feature] reducing [metric] by [percentage]",
    "Designed [specific architecture] supporting [scale/users]"
  ],
  "linkedinDescription": "Excited to share my latest project!\\n\\nI built ${config.name} — [2-3 sentence description of what it does and what you learned].\\n\\nKey technologies: ${config.techStack.frontend}, ${config.techStack.backend}, ${config.techStack.database}.",
  "interviewQuestions": [
    {
      "question": "How did you design the database schema for this project?",
      "answer": "2-3 sentence answer describing the approach and reasoning",
      "topic": "Database Design"
    },
    {
      "question": "What was the most challenging part of building this?",
      "answer": "2-3 sentence answer describing the challenge and how you solved it",
      "topic": "Problem Solving"
    },
    {
      "question": "How would you scale this application?",
      "answer": "2-3 sentence answer describing scaling strategy",
      "topic": "Architecture"
    }
  ]
}

Replace example text with specific content for ${config.name}.
${JSON_ONLY}`;
  },

  // ── Documentation ──────────────────────────────────────────────────────────
  buildDocumentationPrompt(config: ProjectConfig): string {
    return `Generate a README for this project as JSON.

Project: ${config.name}
Description: ${config.description}
Stack: ${config.techStack.frontend} / ${config.techStack.backend} / ${config.techStack.database}

Return exactly this JSON structure:
{
  "readme": "# ${config.name}\\n\\n${config.description}\\n\\n## Tech Stack\\n\\n- **Frontend**: ${config.techStack.frontend}\\n- **Backend**: ${config.techStack.backend}\\n- **Database**: ${config.techStack.database}\\n\\n## Getting Started\\n\\n\`\`\`bash\\nnpm install\\nnpm run dev\\n\`\`\`\\n\\n## Features\\n\\n- Feature one description\\n- Feature two description\\n- Feature three description\\n\\n## Architecture\\n\\nBrief 2-3 sentence description of how the system is structured.\\n"
}

Replace placeholder text with content specific to ${config.name}.
The readme field must be a single string with \\n for newlines.
${JSON_ONLY}`;
  },

  // ── Debugger ───────────────────────────────────────────────────────────────
  buildDebuggerPrompt(errorMsg: string, code: string, techStack: string): string {
    const truncatedCode = code.length > 1200 ? code.slice(0, 1200) + '\n// ... truncated' : code;
    return `Analyze this code error and return a diagnostic as JSON.

Error: "${errorMsg}"
Stack: ${techStack}
Code:
\`\`\`
${truncatedCode}
\`\`\`

Return exactly this JSON structure:
{
  "summary": "One sentence: what is broken",
  "rootCause": "Technical reason why this failed",
  "explanation": "2-3 sentence educational explanation of the concept",
  "suggestions": ["How to avoid this in future", "Second tip", "Third tip"],
  "fixMinimal": "// Smallest code change to fix the error",
  "fixProduction": "// Production-quality fixed code",
  "fixOptimized": "// Optimized version of the fix",
  "fixExplanation": "Key differences between the three fixes"
}
${JSON_ONLY}`;
  },

  // ── Reviewer ───────────────────────────────────────────────────────────────
  buildReviewerPrompt(code: string, fileName: string): string {
    const truncatedCode = code.length > 1200 ? code.slice(0, 1200) + '\n// ... truncated' : code;
    return `Perform a code review for SOLID/DRY/KISS principles and return as JSON.

File: "${fileName}"
Code:
\`\`\`
${truncatedCode}
\`\`\`

Return exactly this JSON structure:
{
  "scores": {
    "overall": 80,
    "security": 85,
    "performance": 75,
    "architecture": 80,
    "accessibility": 70,
    "codeQuality": 82,
    "maintainability": 78
  },
  "summary": "2-3 sentence overall assessment",
  "strengths": ["Strength one", "Strength two"],
  "weaknesses": ["Weakness one", "Weakness two"],
  "recommendations": ["Action one", "Action two", "Action three"],
  "improvements": "// Refactored code snippet here"
}
${JSON_ONLY}`;
  },

  buildRefactorSuggestionsPrompt(code: string, fileName: string): string {
    const truncatedCode = code.length > 1200 ? code.slice(0, 1200) + '\n// ... truncated' : code;
    return `Analyze the following file and generate 2-4 actionable refactoring recommendations.
Focus on: DRY violations, SOLID design issues, performance bugs, and potential security gaps.

File: "${fileName}"
Code:
\`\`\`
${truncatedCode}
\`\`\`

Return exactly this JSON structure:
{
  "suggestions": [
    {
      "title": "Short title of suggestion",
      "description": "Educational explanation of why this change is needed and how it improves the code",
      "type": "Performance" | "Security" | "SOLID Compliance" | "Code Style",
      "diff": "// Complete replacement code block for the affected code segment"
    }
  ]
}
${JSON_ONLY}`;
  },

  // ── Retry correction prompt ────────────────────────────────────────────────
  buildRetryPrompt(originalPrompt: string, failedResponse: string): string {
    const preview = failedResponse.substring(0, 150);
    return `Your previous response was not valid JSON and could not be parsed.

Your response started with: "${preview}..."

You MUST return ONLY a valid JSON object.
- Start with {
- End with }
- No markdown, no backticks, no text before or after the JSON

Original task:
${originalPrompt}
${JSON_ONLY}`;
  },

  // ── Partial field fix prompt ───────────────────────────────────────────────
  buildFieldFixPrompt(stepName: string, missingFields: string[], originalPrompt: string): string {
    return `The JSON you generated for the "${stepName}" step was missing or had invalid values for these fields: ${missingFields.join(', ')}.

Please regenerate ONLY a valid JSON object that includes ALL the required fields.
Pay particular attention to: ${missingFields.join(', ')}.

Original task:
${originalPrompt}
${JSON_ONLY}`;
  }
};
