import { Project, FileNode } from '../../types/project';

// Recursive helper to build text tree representation
function buildFileTreeString(nodes: FileNode[], depth = 0): string {
  let result = '';
  const indent = '  '.repeat(depth);
  for (const node of nodes) {
    if (node.type === 'folder') {
      result += `${indent}📁 ${node.name}/\n`;
      if (node.children) {
        result += buildFileTreeString(node.children, depth + 1);
      }
    } else {
      result += `${indent}📄 ${node.name}\n`;
    }
  }
  return result;
}

export const exportService = {
  exportToMarkdown(project: Project): string {
    let md = `# Project Plan: ${project.name}\n\n`;
    md += `## Overview\n${project.description}\n\n`;
    md += `**Difficulty Level:** ${project.difficulty}\n`;
    md += `**Estimated Time:** ${project.estimatedTime}\n`;
    md += `**XP Rewards:** +${project.xpReward} XP\n\n`;

    md += `## Tech Stack\n`;
    md += `- Frontend: ${project.techStack.frontend}\n`;
    md += `- Backend: ${project.techStack.backend}\n`;
    md += `- Database: ${project.techStack.database}\n`;
    md += `- AI: ${project.techStack.ai}\n`;
    md += `- Deployment: ${project.techStack.deployment}\n\n`;

    md += `## Skills Learned\n`;
    project.skills.forEach(s => { md += `- ${s}\n`; });
    md += `\n`;

    md += `## Project Objectives\n`;
    project.objectives.forEach(o => { md += `- ${o}\n`; });
    md += `\n`;

    md += `## Development Roadmap\n`;
    project.roadmap.forEach(m => {
      md += `### ${m.title} (Est: ${m.estimatedHours}h - Status: ${m.status})\n`;
      md += `${m.description}\n\n`;
    });

    md += `## Directory Structure\n\`\`\`\n`;
    md += buildFileTreeString(project.files);
    md += `\`\`\`\n\n`;

    md += `## Database Schema\n`;
    project.dbSchemas.forEach(schema => {
      md += `### Table: ${schema.table}\n`;
      md += `| Column | Type | Key | Nullable | References |\n`;
      md += `|---|---|---|---|---|\n`;
      schema.columns.forEach(col => {
        md += `| ${col.name} | ${col.type} | ${col.key || '-'} | ${col.nullable} | ${col.references || '-'} |\n`;
      });
      md += `\n\`\`\`sql\n${schema.sql}\n\`\`\`\n\n`;
    });

    md += `## API Specifications\n`;
    project.apiDocs.forEach(api => {
      md += `### ${api.method} ${api.endpoint}\n`;
      md += `*Description:* ${api.description}\n\n`;
      if (api.requestBody) {
        md += `**Request Payload:**\n\`\`\`json\n${api.requestBody}\n\`\`\`\n`;
      }
      md += `**Response Payload:**\n\`\`\`json\n${api.responseBody}\n\`\`\`\n\n`;
    });

    md += `## Resume Bullet Points\n`;
    project.resumeBulletPoints.forEach(r => { md += `- ${r}\n`; });
    md += `\n`;

    md += `## LinkedIn Description\n\`\`\`text\n${project.linkedinDescription}\n\`\`\`\n\n`;

    md += `## System Documentation & README.md\n`;
    md += project.readme;

    return md;
  },

  exportToJSON(project: Project): string {
    return JSON.stringify(project, null, 2);
  },

  triggerDownload(filename: string, content: string, contentType: string) {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  downloadMarkdown(project: Project) {
    const md = this.exportToMarkdown(project);
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-plan.md`;
    this.triggerDownload(filename, md, 'text/markdown;charset=utf-8;');
  },

  downloadJSON(project: Project) {
    const json = this.exportToJSON(project);
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-plan.json`;
    this.triggerDownload(filename, json, 'application/json;charset=utf-8;');
  },

  downloadPDFPlaceholder(project: Project) {
    const md = this.exportToMarkdown(project);
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-plan-pdf.txt`;
    alert('PDF Export simulation: Downloading formatted plan metadata details as a text document.');
    this.triggerDownload(filename, md, 'text/plain;charset=utf-8;');
  },

  downloadZIPPlaceholder(project: Project) {
    let archiveContent = `=========================================================\n`;
    archiveContent += `WORKSPACE ARCHIVE ZIP MAPPING FOR ${project.name.toUpperCase()}\n`;
    archiveContent += `=========================================================\n\n`;
    
    const writeFiles = (nodes: FileNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'file') {
          archiveContent += `FILE: ${n.path}\n`;
          archiveContent += `---------------------------------------------------------\n`;
          archiveContent += `${n.content || '// Empty'}\n`;
          archiveContent += `=========================================================\n\n`;
        } else if (n.children) {
          writeFiles(n.children);
        }
      });
    };
    writeFiles(project.files);

    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-codebase.txt`;
    alert('ZIP Export simulation: Downloading flat codebase files archive mapping document.');
    this.triggerDownload(filename, archiveContent, 'text/plain;charset=utf-8;');
  },

  // 1. Technical & HR Interview Package
  downloadInterviewPackage(project: Project) {
    let content = `=========================================================\n`;
    content += `CAREER PREPARATION: INTERVIEW PRACTICE PACKAGE FOR ${project.name.toUpperCase()}\n`;
    content += `=========================================================\n\n`;
    
    content += `## TECHNICAL QUESTIONS (${project.techStack.frontend} + ${project.techStack.backend})\n`;
    content += `Q1: How do we handle asynchronous lifecycle updates in ${project.techStack.frontend} without triggering memory leaks?\n`;
    content += `A1: Leverage clean-up hooks or unbind listeners inside return clauses.\n\n`;
    content += `Q2: Why was ${project.techStack.database} selected over other storage layers for this architecture?\n`;
    content += `A2: It fits relational data queries and handles ACID constraints smoothly.\n\n`;
    
    content += `## SYSTEM DESIGN QUESTIONS\n`;
    content += `Q3: How would you scale the message handler system if real-time peer counts exceed 10k concurrent connections?\n`;
    content += `A3: Introduce Redis Pub/Sub channels to distribute events across containerized servers.\n\n`;
    
    content += `## BEHAVIORAL & HR QUESTIONS\n`;
    content += `Q4: What was the most significant technical challenge you faced while building this project?\n`;
    content += `A4: Managing state synchronizations across offline local caches and live database triggers.\n\n`;

    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-interview-prep.txt`;
    this.triggerDownload(filename, content, 'text/plain;charset=utf-8;');
  },

  // 2. ATS Friendly Resume Package
  downloadResumePackage(project: Project) {
    let content = `=========================================================\n`;
    content += `PORTFOLIO BOOSTER: ATS RESUME SECTIONS FOR ${project.name.toUpperCase()}\n`;
    content += `=========================================================\n\n`;
    
    content += `### ATS EXPERIENCES BULLET POINTS:\n`;
    project.resumeBulletPoints.forEach(pt => {
      content += `- ${pt}\n`;
    });
    content += `- Engineered high-efficiency workspace dashboards using ${project.techStack.frontend} and integrated real-time microservices.\n`;
    content += `- Implemented database schemas on ${project.techStack.database} checking performance indicators.\n\n`;
    
    content += `### LINKEDIN PROFILE HIGHLIGHTS:\n`;
    content += `${project.linkedinDescription || 'Shipped a new tech product dashboard using automated pipelines.'}\n\n`;
    
    content += `### SHORT PORTFOLIO OUTLINE:\n`;
    content += `Built a full-featured ${project.name} app incorporating modular architectures, progressive lessons structures, and Dockerized configurations.\n`;

    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-resume-assets.txt`;
    this.triggerDownload(filename, content, 'text/plain;charset=utf-8;');
  },

  // 3. Deployment Configurations Guide
  downloadDeploymentConfig(project: Project) {
    let content = `=========================================================\n`;
    content += `DEPLOYMENT SPECIFICATIONS & DOCKERFILES FOR ${project.name.toUpperCase()}\n`;
    content += `=========================================================\n\n`;
    
    content += `### 1. DOCKER CONFIGURATION\n\n`;
    content += `#### Dockerfile\n`;
    content += `\`\`\`dockerfile\n`;
    content += `FROM node:18-alpine AS base\n`;
    content += `WORKDIR /app\n`;
    content += `COPY package*.json ./\n`;
    content += `RUN npm install\n`;
    content += `COPY . .\n`;
    content += `RUN npm run build\n`;
    content += `EXPOSE 3000\n`;
    content += `CMD ["npm", "start"]\n`;
    content += `\`\`\`\n\n`;
    
    content += `#### docker-compose.yml\n`;
    content += `\`\`\`yaml\n`;
    content += `version: '3.8'\n`;
    content += `services:\n`;
    content += `  web:\n`;
    content += `    build: .\n`;
    content += `    ports:\n`;
    content += `      - "3000:3000"\n`;
    content += `    environment:\n`;
    content += `      - NODE_ENV=production\n`;
    content += `      - DATABASE_URL=\${DATABASE_URL}\n`;
    content += `\`\`\`\n\n`;
    
    content += `### 2. CLOUD ENVIRONMENT PRESETS (${project.techStack.deployment})\n`;
    content += `- Build Command: \`npm run build\`\n`;
    content += `- Install Command: \`npm install\`\n`;
    content += `- Required Vars: DATABASE_URL, NEXT_PUBLIC_API_URL, NODE_ENV=production\n`;

    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-deployment.txt`;
    this.triggerDownload(filename, content, 'text/plain;charset=utf-8;');
  },

  // 4. Interactive Showcase Portfolio HTML Page
  downloadPortfolioPage(project: Project) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Project Showcase</title>
  <style>
    body {
      background: #09090b;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 2rem;
      display: flex;
      justify-content: center;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1.5rem;
      padding: 2.5rem;
      max-width: 700px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    h1 { color: #818cf8; margin-top: 0; }
    .badge {
      background: rgba(129, 140, 248, 0.1);
      color: #818cf8;
      border: 1px solid rgba(129, 140, 248, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    .tech-grid {
      display: grid;
      grid-cols: 2;
      gap: 1rem;
      margin: 2rem 0;
    }
    .tech-item {
      background: rgba(0,0,0,0.2);
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255,255,255,0.02);
    }
    .tech-label { font-size: 0.7rem; color: #6b7280; font-weight: bold; text-transform: uppercase; }
    .tech-val { font-size: 0.9rem; font-weight: bold; margin-top: 0.2rem; }
    pre {
      background: #000;
      padding: 1rem;
      border-radius: 0.75rem;
      overflow-x: auto;
      font-size: 0.8rem;
      color: #34d399;
      border: 1px solid rgba(255,255,255,0.05);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${project.difficulty}</div>
    <h1>${project.name}</h1>
    <p style="color: #a1a1aa; line-height: 1.6;">${project.description}</p>
    
    <h3>🚀 Technology Stack Blueprint</h3>
    <div class="tech-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
      <div class="tech-item">
        <div class="tech-label">Frontend</div>
        <div class="tech-val">${project.techStack.frontend}</div>
      </div>
      <div class="tech-item">
        <div class="tech-label">Backend</div>
        <div class="tech-val">${project.techStack.backend}</div>
      </div>
      <div class="tech-item">
        <div class="tech-label">Database</div>
        <div class="tech-val">${project.techStack.database}</div>
      </div>
      <div class="tech-item">
        <div class="tech-label">Deployment</div>
        <div class="tech-val">${project.techStack.deployment}</div>
      </div>
    </div>

    <h3>⚡ Mastered Outcomes</h3>
    <ul style="color: #d1d5db; line-height: 1.6;">
      ${project.objectives.map(o => `<li>${o}</li>`).join('')}
    </ul>
    
    <h3>📄 Generated README overview</h3>
    <pre>${project.readme.substring(0, 500)}...</pre>
  </div>
</body>
</html>`;
    
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-portfolio.html`;
    this.triggerDownload(filename, html, 'text/html;charset=utf-8;');
  }
};
