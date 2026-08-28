import { Project } from '../types/project';

export const templates: Project[] = [
  {
    id: 'ai-resume-builder',
    name: 'AI Resume Builder',
    description: 'A modern SaaS application that uses OpenAI to analyze resumes, recommend industry-specific bullet points, and generate PDF resumes with real-time editing.',
    difficulty: 'Intermediate',
    techStack: {
      frontend: 'React + Next.js (App Router)',
      backend: 'Next.js API Route Handlers',
      database: 'Supabase (PostgreSQL)',
      ai: 'OpenAI (GPT-4o)',
      deployment: 'Vercel'
    },
    estimatedTime: '12 Hours',
    xpReward: 1200,
    skills: ['React Hooks', 'Next.js 15 App Router', 'OpenAI API Integration', 'CSS Print Styles', 'Zod Validation'],
    objectives: [
      'Understand Next.js 15 Client vs Server Components.',
      'Implement validation on complex multi-step forms using Zod.',
      'Build secure backend API routes to interact with OpenAI.',
      'Create responsive, print-friendly CSS designs.'
    ],
    features: [
      'Multi-step Interactive Resume Form',
      'AI Resume Bullet Optimizer',
      'Real-time PDF print preview layout',
      'Autosave state & local caching'
    ],
    roadmap: [
      { id: 'm1', title: 'Setup & Form Architecture', description: 'Initialize the App Router, set up state structures, and implement Zod validation schemas.', status: 'completed', estimatedHours: 3 },
      { id: 'm2', title: 'AI Assistant API Route', description: 'Create `/api/generate` Route Handler, configure OpenAI client, and handle streaming completions.', status: 'in-progress', estimatedHours: 4 },
      { id: 'm3', title: 'PDF Generator & Printing UI', description: 'Design Tailwind print layouts and print configuration overlays.', status: 'todo', estimatedHours: 3 },
      { id: 'm4', title: 'Persistence & Deploy', description: 'Connect Supabase backend, store templates, and host on Vercel.', status: 'todo', estimatedHours: 2 }
    ],
    files: [
      {
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            name: 'components',
            path: 'src/components',
            type: 'folder',
            children: [
              {
                name: 'ResumeForm.tsx',
                path: 'src/components/ResumeForm.tsx',
                type: 'file',
                content: `import React, { useState } from 'react';

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ResumeData {
  fullName: string;
  email: string;
  skills: string;
  experience: Experience[];
}

export default function ResumeForm({ 
  data, 
  onChange, 
  onOptimize 
}: { 
  data: ResumeData; 
  onChange: (data: ResumeData) => void;
  onOptimize: (index: number) => void;
}) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleExpChange = (index: number, field: string, value: string) => {
    const updatedExp = [...data.experience];
    updatedExp[index] = { ...updatedExp[index], [field]: value };
    onChange({ ...data, experience: updatedExp });
  };

  const handleAddExperience = () => {
    onChange({
      ...data,
      experience: [...data.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const triggerOptimize = async (index: number) => {
    setLoadingIndex(index);
    await onOptimize(index);
    setLoadingIndex(null);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
      <h3 className="text-xl font-semibold text-indigo-400">Personal Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            value={data.fullName}
            onChange={handleInputChange}
            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white focus:border-indigo-500 outline-none"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={data.email}
            onChange={handleInputChange}
            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white focus:border-indigo-500 outline-none"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Skills (Comma separated)</label>
        <input 
          type="text" 
          name="skills" 
          value={data.skills}
          onChange={handleInputChange}
          className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white focus:border-indigo-500 outline-none"
          placeholder="React, TypeScript, Node.js"
        />
      </div>

      <div className="border-t border-gray-800 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-indigo-400">Work Experience</h3>
          <button 
            type="button" 
            onClick={handleAddExperience}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition"
          >
            + Add Experience
          </button>
        </div>

        {data.experience.map((exp, index) => (
          <div key={index} className="bg-black/30 border border-gray-800 p-4 rounded-lg space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Company Name"
                value={exp.company}
                onChange={(e) => handleExpChange(index, 'company', e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded p-2 text-white text-sm"
              />
              <input 
                type="text" 
                placeholder="Role / Title"
                value={exp.role}
                onChange={(e) => handleExpChange(index, 'role', e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded p-2 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Start Date (e.g. Jan 2024)"
                value={exp.startDate}
                onChange={(e) => handleExpChange(index, 'startDate', e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded p-2 text-white text-sm"
              />
              <input 
                type="text" 
                placeholder="End Date (or Present)"
                value={exp.endDate}
                onChange={(e) => handleExpChange(index, 'endDate', e.target.value)}
                className="bg-gray-950 border border-gray-800 rounded p-2 text-white text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400">Description</label>
                <button
                  type="button"
                  disabled={loadingIndex === index || !exp.role || !exp.description}
                  onClick={() => triggerOptimize(index)}
                  className="text-xs bg-purple-900/50 text-purple-200 border border-purple-800 hover:bg-purple-800 hover:text-white px-2 py-1 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingIndex === index ? 'Optimizing with AI...' : '✨ Optimize with AI'}
                </button>
              </div>
              <textarea 
                rows={3}
                placeholder="Describe your achievements..."
                value={exp.description}
                onChange={(e) => handleExpChange(index, 'description', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`
              }
            ]
          },
          {
            name: 'app',
            path: 'src/app',
            type: 'folder',
            children: [
              {
                name: 'api',
                path: 'src/app/api',
                type: 'folder',
                children: [
                  {
                    name: 'optimize',
                    path: 'src/app/api/optimize',
                    type: 'folder',
                    children: [
                      {
                        name: 'route.ts',
                        path: 'src/app/api/optimize/route.ts',
                        type: 'file',
                        content: `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { role, description } = await req.json();

    if (!role || !description) {
      return NextResponse.json(
        { error: 'Role and Description are required parameters.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return simulated optimized details if no API key is specified for local development
      console.warn('OPENAI_API_KEY is not defined. Using simulation mode.');
      const simulatedText = \`• Spearheaded development of core product features as a \${role}, increasing page performance by 40% using optimized query structures.
• Leveraged modern frontend practices to reduce customer onboarding friction by 25%.
• Mentored 3 junior developers and established clean-code linting and automated unit testing pipelines.\`;
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      return NextResponse.json({ optimizedText: simulatedText });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer. Rephrase the description into 3 impactful bullet points using the STAR method (Situation, Task, Action, Result). Start each bullet point with strong action verbs. Return ONLY bullet points.'
          },
          {
            role: 'user',
            content: \`Role: \${role}\\nDescription: \${description}\`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const optimizedText = data.choices[0]?.message?.content || 'Failed to generate bullet points.';
    return NextResponse.json({ optimizedText });

  } catch (error: any) {
    console.error('AI Optimisation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}`
                      }
                    ]
                  }
                ]
              },
              {
                name: 'page.tsx',
                path: 'src/app/page.tsx',
                type: 'file',
                content: `import React, { useState } from 'react';
import ResumeForm from '../components/ResumeForm';

export default function WorkspacePage() {
  const [data, setData] = useState({
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    skills: 'React, Next.js, Tailwind CSS, TypeScript, Node.js',
    experience: [
      {
        company: 'Innovate Tech',
        role: 'Frontend Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        description: 'Built customer dashboards and integrated REST APIs. Handled state management.'
      }
    ]
  });

  const handleOptimize = async (index: number) => {
    try {
      const exp = data.experience[index];
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: exp.role, description: exp.description })
      });
      const resData = await response.json();
      if (resData.optimizedText) {
        const updatedExp = [...data.experience];
        updatedExp[index].description = resData.optimizedText;
        setData({ ...data, experience: updatedExp });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 p-8 overflow-y-auto border-r border-gray-800">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          ProjectForge AI Resume Builder
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          Complete the form details and trigger AI optimizations to automatically rephrase your experience bullets.
        </p>
        <ResumeForm 
          data={data} 
          onChange={setData} 
          onOptimize={handleOptimize} 
        />
      </div>

      <div className="w-full lg:w-1/2 p-8 bg-gray-950 flex flex-col justify-start">
        <h2 className="text-xl font-bold text-gray-400 mb-6 border-b border-gray-800 pb-2">Live Printable Preview</h2>
        <div id="resume-preview" className="bg-white text-black p-8 shadow-2xl rounded aspect-[1/1.41] max-w-xl mx-auto w-full select-text">
          <h1 className="text-3xl font-serif font-bold text-center mb-1">{data.fullName || 'Name'}</h1>
          <p className="text-xs text-center border-b pb-4 mb-6 font-sans text-gray-600">{data.email || 'Email'}</p>
          
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-800 mb-2 border-b-2 border-gray-800 pb-1">Professional Experience</h3>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-4 text-xs">
              <div className="flex justify-between font-bold text-gray-900">
                <span>{exp.role || 'Role'} at {exp.company || 'Company'}</span>
                <span className="font-normal text-gray-600">{exp.startDate} - {exp.endDate}</span>
              </div>
              <div className="mt-1.5 text-gray-700 whitespace-pre-line leading-relaxed font-serif pl-2 border-l border-indigo-200">
                {exp.description || 'No achievements listed.'}
              </div>
            </div>
          ))}

          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-800 mt-6 mb-2 border-b-2 border-gray-800 pb-1">Technical Skills</h3>
          <p className="text-xs font-serif leading-relaxed text-gray-700">{data.skills || 'Add your skills'}</p>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="mt-6 mx-auto bg-gray-800 hover:bg-gray-700 text-white text-sm px-6 py-2 rounded-lg border border-gray-700 font-semibold transition"
        >
          🖨️ Export PDF / Print Resume
        </button>
      </div>
    </div>
  );
}`
              }
            ]
          }
        ]
      }
    ],
    lessons: [
      {
        id: 'l1',
        title: 'React Controlled Inputs & Form State Validation',
        objective: 'Implement React controlled forms for nested array structures, and prepare them for strict TypeScript static checks.',
        explanation: 'In web engineering, managing nested structures (like a list of work experiences) requires dynamic state replication. When updating arrays, React utilizes shallow comparisons to detect changes, requiring developers to copy arrays correctly before setting state.',
        theory: 'React uses a virtual DOM diffing process. When state modifications are triggered, React checks object references. Directly modifying an object (e.g. `state.experience[0].company = "New Company"`) updates the data but preserves the array reference in memory. As a result, React does not trigger a re-render. We must always create copy arrays using the spread operator (`...`) or copy utilities like `.map()` to preserve state immutability.',
        whyWeDoThis: 'Using immutability ensures predictable re-rendering cycles and allows React to implement optimizations. When building dashboards, tracking every character input changes local state, meaning performance bottlenecks can occur if components re-evaluate excessively without proper layout splitting.',
        commonMistakes: [
          'Directly mutating state arrays without cloning.',
          'Not setting unique `key` properties on list elements (which causes rendering errors and breaks client states).',
          'Declaring state structures in child inputs causing heavy input lag.'
        ],
        bestPractices: [
          'Use TypeScript schemas to define inputs.',
          'Leverage `useCallback` hook variables for high-frequency input handlers.',
          'Validate input formats using Zod declarations.'
        ],
        code: `// Correct nested experience updater in React:
const handleExpChange = (index: number, field: string, value: string) => {
  // 1. Clone the parent experience array
  const updatedExp = [...data.experience];
  
  // 2. Clone the specific experience item and replace field
  updatedExp[index] = { 
    ...updatedExp[index], 
    [field]: value 
  };
  
  // 3. Set parent state wrapper
  onChange({ ...data, experience: updatedExp });
};`,
        path: 'src/components/ResumeForm.tsx',
        quiz: [
          {
            id: 'q1',
            question: 'Why does React fail to trigger a re-render if you push directly into an array in state?',
            options: [
              'Because the array length is too small.',
              'Because the array reference address in memory remains the same, so React does not notice a change.',
              'Because push is not a valid JS array method.',
              'Because next.js disables automatic DOM updates.'
            ],
            correctAnswer: 1,
            explanation: 'React compares values shallowly. It checks if the array pointer has changed. Pushing elements changes the content of the array, but the pointer address remains identical.'
          },
          {
            id: 'q2',
            question: 'What is the correct way to update experience[index].company without mutating state directly?',
            options: [
              'data.experience[index].company = value; setData(data)',
              'setData({ ...data, company: value })',
              'Create a shallow copy of the experience array, update the specific item, and pass the new array to setData.',
              'Use the window.reload() command.'
            ],
            correctAnswer: 2,
            explanation: 'By copying the array and replacing the element inside, you create a new reference, forcing React to trigger visual rendering changes safely.'
          }
        ],
        challenge: {
          title: 'Add support for deleting a work experience block',
          instructions: 'Implement a new function inside `ResumeForm.tsx` to remove a work experience card at a specific index using JavaScript `.filter()`. Fill out the boilerplate logic.',
          initialCode: `// Implement removing experience at index:
const handleRemoveExperience = (index: number) => {
  // Your code here
};`,
          solution: `const handleRemoveExperience = (index: number) => {
  const updatedExp = data.experience.filter((_, i) => i !== index);
  onChange({ ...data, experience: updatedExp });
};`
        },
        completed: false
      },
      {
        id: 'l2',
        title: 'Building Secure Next.js Serverless Route Handlers',
        objective: 'Build a server-side POST API route that parses client requests, interfaces with the OpenAI REST endpoint, and protects environment API keys.',
        explanation: 'API tokens like `OPENAI_API_KEY` must never be exposed to browser clients. Web apps resolve this security risk by proxying OpenAI requests through Next.js serverless route handlers. The backend script receives simple requests, attaches the auth header, and contacts OpenAI.',
        theory: 'Next.js 15 route handlers execute on serverless node environments. When a POST request arrives, the route handler intercepts it, validates inputs, reads the environment variable key (`process.env.OPENAI_API_KEY`), executes a secure fetch request to `api.openai.com`, and responds with JSON.',
        whyWeDoThis: 'Exposing keys on client browsers makes them easily hijackable, allowing anyone to steal your credits or abuse the API. Serverless API routes act as secure gatekeepers.',
        commonMistakes: [
          'Exposing raw keys by naming them with the `NEXT_PUBLIC_` prefix.',
          'Not checking if parameters exist, leading to unhandled code exceptions.',
          'Forgetting error blocks (`try/catch`), crashing the node handler.'
        ],
        bestPractices: [
          'Always use server environment variables.',
          'Check for null parameters and return 400 Bad Request if missing.',
          'Secure API endpoints with rate limit rules.'
        ],
        code: `// Secure Next.js 15 POST API handler:
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { role, description } = await req.json();
    if (!role || !description) {
      return NextResponse.json({ error: 'Missing values' }, { status: 400 });
    }
    // OpenAI client call goes here (keys remain safe in environment)
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'System Error' }, { status: 500 });
  }
}`,
        path: 'src/app/api/optimize/route.ts',
        quiz: [
          {
            id: 'q1',
            question: 'What is the risk of prefixing an API key variable with NEXT_PUBLIC_?',
            options: [
              'It turns off typescript compiler types.',
              'Next.js bundle embeds it directly in the client javascript files, exposing it to anyone inspection tools.',
              'It restricts access to Vercel domains only.',
              'It increases server API request times.'
            ],
            correctAnswer: 1,
            explanation: 'Next.js automatically embeds variables starting with NEXT_PUBLIC_ in the client-side bundle. Secure keys must remain without this prefix so they are accessible only on the Node server.'
          }
        ],
        challenge: {
          title: 'Implement input schema validation with Zod',
          instructions: 'Write a basic validator block to ensure `role` is a string with at least 3 characters before calling OpenAI.',
          initialCode: `// Validate input variables:
function validate(role: string) {
  // Return true if length is at least 3
}`,
          solution: `function validate(role: string) {
  return typeof role === 'string' && role.trim().length >= 3;
}`
        },
        completed: false
      }
    ],
    apiDocs: [
      {
        method: 'POST',
        endpoint: '/api/optimize',
        description: 'Receives job roles and achievements, and sends them to OpenAI to return STAR-method optimized resume bullet points.',
        headers: {
          'Content-Type': 'application/json'
        },
        requestBody: `{
  "role": "Frontend Developer",
  "description": "I built pages and speeded up the website loads."
}`,
        responseBody: `{
  "optimizedText": "• Redesigned client dashboards using React, accelerating overall page load speed by 35%\\n• Standardized frontend routing protocols, reducing initial loading lag\\n• Engineered responsive layout elements, supporting 100% device compatibility"
}`,
        statusCodes: [
          { code: 200, description: 'Optimized bullets generated successfully.' },
          { code: 400, description: 'Invalid body parameters (missing role or description).' },
          { code: 500, description: 'Internal server error from OpenAI client.' }
        ]
      }
    ],
    dbSchemas: [
      {
        table: 'users',
        columns: [
          { name: 'id', type: 'uuid', key: 'PK' },
          { name: 'email', type: 'varchar(255)', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: true }
        ],
        sql: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
      },
      {
        table: 'resumes',
        columns: [
          { name: 'id', type: 'uuid', key: 'PK' },
          { name: 'user_id', type: 'uuid', key: 'FK', references: 'users.id' },
          { name: 'full_name', type: 'varchar(100)' },
          { name: 'skills_list', type: 'text' },
          { name: 'experience_data', type: 'jsonb' },
          { name: 'updated_at', type: 'timestamp' }
        ],
        sql: `CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  skills_list TEXT,
  experience_data JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
      }
    ],
    architecture: {
      systemDiagram: `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <defs>
    <linearGradient id="grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <linearGradient id="grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1F2937" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>

  <!-- Background Grid -->
  <rect width="800" height="400" fill="#09090B" rx="12"/>
  <path d="M 0 50 L 800 50 M 0 100 L 800 100 M 0 150 L 800 150 M 0 200 L 800 200 M 0 250 L 800 250 M 0 300 L 800 300 M 0 350 L 800 350" stroke="#1E293B" stroke-width="0.5"/>
  <path d="M 100 0 L 100 400 M 200 0 L 200 400 M 300 0 L 300 400 M 400 0 L 400 400 M 500 0 L 500 400 M 600 0 L 600 400 M 700 0 L 700 400" stroke="#1E293B" stroke-width="0.5"/>

  <!-- Client Browser -->
  <rect x="50" y="120" width="160" height="120" fill="url(#grad-dark)" stroke="#374151" stroke-width="1.5" rx="8"/>
  <rect x="50" y="120" width="160" height="25" fill="#111827" rx="8"/>
  <circle cx="65" cy="132" r="3" fill="#EF4444"/>
  <circle cx="75" cy="132" r="3" fill="#F59E0B"/>
  <circle cx="85" cy="132" r="3" fill="#22C55E"/>
  <text x="130" y="136" fill="#94A3B8" font-size="10" text-anchor="middle" font-family="sans-serif">Client UI (Next.js)</text>
  <text x="130" y="185" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">ResumeForm.tsx</text>
  <text x="130" y="205" fill="#6366F1" font-size="10" text-anchor="middle" font-family="sans-serif">React State Form</text>

  <!-- API Proxy (Next.js Route Handler) -->
  <rect x="320" y="120" width="180" height="120" fill="url(#grad-dark)" stroke="#6366F1" stroke-width="2" rx="8"/>
  <text x="410" y="145" fill="#6366F1" font-size="10" text-anchor="middle" font-weight="bold" font-family="sans-serif">SECURE PROXY</text>
  <text x="410" y="175" fill="#F8FAFC" font-size="13" text-anchor="middle" font-weight="bold" font-family="sans-serif">/api/optimize</text>
  <text x="410" y="195" fill="#94A3B8" font-size="10" text-anchor="middle" font-family="sans-serif">Next.js Route Handler</text>
  <text x="410" y="215" fill="#8B5CF6" font-size="9" text-anchor="middle" font-family="sans-serif">Process.env.OPENAI_KEY</text>

  <!-- OpenAI Service -->
  <rect x="590" y="60" width="160" height="90" fill="url(#grad-dark)" stroke="#374151" stroke-width="1.5" rx="8"/>
  <text x="670" y="95" fill="#F8FAFC" font-size="14" text-anchor="middle" font-weight="bold" font-family="sans-serif">OpenAI API</text>
  <text x="670" y="115" fill="#22C55E" font-size="10" text-anchor="middle" font-family="sans-serif">gpt-4o completion</text>

  <!-- Supabase DB -->
  <rect x="590" y="210" width="160" height="90" fill="url(#grad-dark)" stroke="#374151" stroke-width="1.5" rx="8"/>
  <text x="670" y="245" fill="#F8FAFC" font-size="14" text-anchor="middle" font-weight="bold" font-family="sans-serif">Supabase DB</text>
  <text x="670" y="265" fill="#8B5CF6" font-size="10" text-anchor="middle" font-family="sans-serif">PostgreSQL persistence</text>

  <!-- Data Flow Paths -->
  <!-- Client to API -->
  <path d="M 210 160 L 320 160" fill="none" stroke="#6366F1" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4"/>
  <text x="265" y="150" fill="#94A3B8" font-size="9" text-anchor="middle" font-family="sans-serif">POST JSON</text>

  <!-- API to OpenAI -->
  <path d="M 470 120 L 470 95 L 590 95" fill="none" stroke="#8B5CF6" stroke-width="2"/>
  <text x="530" y="85" fill="#94A3B8" font-size="9" text-anchor="middle" font-family="sans-serif">Bearer Token</text>

  <!-- API to DB -->
  <path d="M 470 240 L 470 260 L 590 260" fill="none" stroke="#8B5CF6" stroke-width="2"/>
  <text x="530" y="280" fill="#94A3B8" font-size="9" text-anchor="middle" font-family="sans-serif">SQL insert</text>

  <!-- Return Flow -->
  <path d="M 320 200 L 210 200" fill="none" stroke="#22C55E" stroke-width="2"/>
  <text x="265" y="220" fill="#22C55E" font-size="9" text-anchor="middle" font-family="sans-serif">Response HTML/JSON</text>
</svg>`,
      databaseDiagram: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="600" height="300" fill="#09090B" rx="8" stroke="#1F2937" stroke-width="1"/>
  <!-- Users Table -->
  <rect x="50" y="50" width="180" height="150" fill="#111827" stroke="#374151" stroke-width="1.5" rx="6"/>
  <rect x="50" y="50" width="180" height="30" fill="#1F2937" rx="6"/>
  <text x="140" y="70" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">users (Table)</text>
  <text x="65" y="105" fill="#6366F1" font-size="11" font-family="monospace">🔑 id: uuid (PK)</text>
  <text x="65" y="130" fill="#94A3B8" font-size="11" font-family="monospace">📧 email: varchar</text>
  <text x="65" y="155" fill="#94A3B8" font-size="11" font-family="monospace">📅 created_at: ts</text>

  <!-- Resumes Table -->
  <rect x="370" y="50" width="180" height="170" fill="#111827" stroke="#374151" stroke-width="1.5" rx="6"/>
  <rect x="370" y="50" width="180" height="30" fill="#1F2937" rx="6"/>
  <text x="460" y="70" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">resumes (Table)</text>
  <text x="385" y="105" fill="#6366F1" font-size="11" font-family="monospace">🔑 id: uuid (PK)</text>
  <text x="385" y="130" fill="#8B5CF6" font-size="11" font-family="monospace">🔗 user_id: uuid (FK)</text>
  <text x="385" y="155" fill="#94A3B8" font-size="11" font-family="monospace">📄 full_name: varchar</text>
  <text x="385" y="180" fill="#94A3B8" font-size="11" font-family="monospace">📊 experience: jsonb</text>
  <text x="385" y="205" fill="#94A3B8" font-size="11" font-family="monospace">⚙️ skills_list: text</text>

  <!-- Relationship Link -->
  <path d="M 230 105 L 370 130" fill="none" stroke="#6366F1" stroke-width="2" stroke-dasharray="4"/>
  <circle cx="230" cy="105" r="3" fill="#6366F1"/>
  <text x="300" y="105" fill="#a5b4fc" font-size="10" text-anchor="middle" font-family="sans-serif">1-to-Many</text>
</svg>`,
      flowDiagram: `<svg viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="600" height="250" fill="#09090B" rx="8" stroke="#1F2937" stroke-width="1"/>
  
  <rect x="30" y="100" width="100" height="50" fill="#1F2937" stroke="#374151" rx="6"/>
  <text x="80" y="130" fill="#F8FAFC" font-size="10" text-anchor="middle" font-family="sans-serif">User Types Text</text>

  <rect x="170" y="100" width="110" height="50" fill="#1F2937" stroke="#6366F1" rx="6"/>
  <text x="225" y="130" fill="#F8FAFC" font-size="10" text-anchor="middle" font-family="sans-serif">Trigger API POST</text>

  <rect x="320" y="100" width="110" height="50" fill="#1F2937" stroke="#8B5CF6" rx="6"/>
  <text x="375" y="130" fill="#F8FAFC" font-size="10" text-anchor="middle" font-family="sans-serif">OpenAI GPT-4o</text>

  <rect x="470" y="100" width="100" height="50" fill="#1F2937" stroke="#22C55E" rx="6"/>
  <text x="520" y="130" fill="#F8FAFC" font-size="10" text-anchor="middle" font-family="sans-serif">UI Updates</text>

  <path d="M 130 125 L 170 125" fill="none" stroke="#94A3B8" stroke-width="1.5"/>
  <path d="M 280 125 L 320 125" fill="none" stroke="#94A3B8" stroke-width="1.5"/>
  <path d="M 430 125 L 470 125" fill="none" stroke="#94A3B8" stroke-width="1.5"/>
</svg>`,
      componentDiagram: `<svg viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="600" height="250" fill="#09090B" rx="8" stroke="#1F2937" stroke-width="1"/>
  
  <rect x="50" y="70" width="150" height="110" fill="#111827" stroke="#374151" rx="6"/>
  <text x="125" y="95" fill="#94A3B8" font-size="11" text-anchor="middle" font-family="sans-serif">App (Page)</text>
  <text x="125" y="125" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">page.tsx</text>

  <rect x="380" y="30" width="170" height="70" fill="#111827" stroke="#6366F1" rx="6"/>
  <text x="465" y="55" fill="#6366F1" font-size="10" text-anchor="middle" font-family="sans-serif">COMPONENTS</text>
  <text x="465" y="75" fill="#F8FAFC" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">ResumeForm.tsx</text>

  <rect x="380" y="140" width="170" height="70" fill="#111827" stroke="#8B5CF6" rx="6"/>
  <text x="465" y="165" fill="#8B5CF6" font-size="10" text-anchor="middle" font-family="sans-serif">API ROUTES</text>
  <text x="465" y="185" fill="#F8FAFC" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">/api/optimize/route.ts</text>

  <path d="M 200 110 L 380 65" fill="none" stroke="#6366F1" stroke-width="1.5" stroke-dasharray="2"/>
  <path d="M 200 140 L 380 175" fill="none" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="2"/>
</svg>`
    },
    interviewQuestions: [
      {
        topic: 'React Immutability',
        question: 'Why should we avoid direct state mutations in React?',
        answer: 'React implements a shallow comparison check on reference types (like arrays and objects) to identify state modifications. Directly editing elements inside an object retains the identical memory address reference. React bypasses rendering since the pointer has not changed. Cloning creates a new memory location, forcing React to trigger visual rendering updates correctly.'
      },
      {
        topic: 'Serverless Security',
        question: 'What is the purpose of proxying OpenAI requests through a serverless API Route?',
        answer: 'Interfacing with OpenAI requires authentication using your private API secret key. Querying the LLM endpoints directly from the browser exposes the key inside request headers or client script bundles. Attackers could steal the secret to make infinite paid API requests on your account. Relaying client requests through a Next.js serverless route allows you to make server-to-server requests safely, keeping your secret key safe on the environment side.'
      }
    ],
    resumeBulletPoints: [
      'Engineered an interactive AI Resume Builder SaaS using Next.js 15 App Router and TypeScript, allowing real-time PDF layouts and offline local backups.',
      'Designed a secure serverless API backend in Next.js to proxy OpenAI GPT-4o prompts, optimizing user experience summaries into STAR-method bullets.',
      'Implemented fluid responsive forms using Zod input validation schemas, dropping input errors and form processing friction by 35%.'
    ],
    linkedinDescription: '🚀 I just completed building an AI Resume Builder using Next.js 15, React, TypeScript, Tailwind CSS, and OpenAI. The platform helps developers design print-perfect resumes and uses GPT-4o to optimize work experience bullet points on the fly! Throughout this project, I learned how to manage nested state immutability in React, build secure API proxy endpoints that prevent client-side key exposure, and construct CSS media query sheets for printing. Check out ProjectForge AI to explore my interactive code and design roadmap!',
    readme: `# AI Resume Builder SaaS

A premium, learning-focused web application built to help users craft professional resumes optimized by OpenAI.

## Tech Stack
- **Frontend:** React, Next.js (App Router), Tailwind CSS
- **Backend:** Next.js Route Handlers
- **Database:** Supabase (PostgreSQL)
- **AI Integrations:** OpenAI API (GPT-4o)

## Features
- **Interactive Multi-Step Forms:** Easily edit education and experiences.
- **AI Bullet Optimization:** One-click rephrasing into STAR-method achievements.
- **Print Layout Preview:** A real-time rendering of your resume showing exactly what will print.

## Getting Started
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Setup environment variables:
   \`\`\`env
   OPENAI_API_KEY=your_key_here
   \`\`\`
3. Launch development server:
   \`\`\`bash
   npm run dev
   \`\`\`
`
  },
  {
    id: 'hospital-management-system',
    name: 'Hospital Management System',
    description: 'A comprehensive, enterprise-ready hospital ERP that manages patient records, doctor timetables, appointment scheduling, and diagnosis logs.',
    difficulty: 'Advanced',
    techStack: {
      frontend: 'Next.js + Tailwind CSS',
      backend: 'Spring Boot + Java',
      database: 'PostgreSQL',
      ai: 'Gemini Pro (Diagnosis Assisting)',
      deployment: 'Docker + AWS'
    },
    estimatedTime: '20 Hours',
    xpReward: 2000,
    skills: ['Spring Boot REST APIs', 'JPA / Hibernate ORM', 'Relational DB Indexes', 'OAuth2 Security', 'Docker Compose'],
    objectives: [
      'Design clean relational databases with Foreign Keys, indexes, and join operations.',
      'Write Java Spring Boot Controllers with full input validation annotations.',
      'Integrate AI diagnostics with secure prompt guardrails.',
      'Configure containerized databases and services using Docker Compose.'
    ],
    features: [
      'Patient Admission & Dynamic Triage Log',
      'Doctor Timetable Booking & Appointment Schedules',
      'AI-Assisted Diagnostic Medical Scribe',
      'HIPAA-compliant audit logs schema'
    ],
    roadmap: [
      { id: 'h1', title: 'PostgreSQL Database & Relational Design', description: 'Draft ER Diagrams and tables with active constraints.', status: 'completed', estimatedHours: 4 },
      { id: 'h2', title: 'Spring Boot RESTful Core Services', description: 'Setup Spring Initializr project, configure JPA mapping entities, and build REST controllers.', status: 'in-progress', estimatedHours: 6 },
      { id: 'h3', title: 'AI Scribe & Diagnostic Assistance', description: 'Incorporate Google Gemini Pro API client to parse doctor notes and suggest medical coding (ICD-10).', status: 'todo', estimatedHours: 5 },
      { id: 'h4', title: 'Docker Containers & Cloud Deployment', description: 'Write Dockerfiles and Docker Compose profiles for local execution.', status: 'todo', estimatedHours: 5 }
    ],
    files: [
      {
        name: 'backend',
        path: 'backend',
        type: 'folder',
        children: [
          {
            name: 'src',
            path: 'backend/src',
            type: 'folder',
            children: [
              {
                name: 'main',
                path: 'backend/src/main',
                type: 'folder',
                children: [
                  {
                    name: 'java',
                    path: 'backend/src/main/java',
                    type: 'folder',
                    children: [
                      {
                        name: 'com',
                        path: 'backend/src/main/java/com',
                        type: 'folder',
                        children: [
                          {
                            name: 'hospital',
                            path: 'backend/src/main/java/com/hospital',
                            type: 'folder',
                            children: [
                              {
                                name: 'controller',
                                path: 'backend/src/main/java/com/hospital/controller',
                                type: 'folder',
                                children: [
                                  {
                                    name: 'AppointmentController.java',
                                    path: 'backend/src/main/java/com/hospital/controller/AppointmentController.java',
                                    type: 'file',
                                    content: `package com.hospital.controller;

import com.hospital.model.Appointment;
import com.hospital.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@Valid @RequestBody Appointment appointment) {
        if (appointment.getDoctorId() == null || appointment.getPatientId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return appointmentRepository.findById(id)
            .map(appointment -> {
                appointment.setStatus(status);
                Appointment updated = appointmentRepository.save(appointment);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}`
                                  }
                                ]
                              },
                              {
                                name: 'model',
                                path: 'backend/src/main/java/com/hospital/model',
                                type: 'folder',
                                children: [
                                  {
                                    name: 'Appointment.java',
                                    path: 'backend/src/main/java/com/hospital/model/Appointment.java',
                                    type: 'file',
                                    content: `package com.hospital.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Patient ID is mandatory")
    private Long patientId;

    @NotNull(message = "Doctor ID is mandatory")
    private Long doctorId;

    @NotNull(message = "Appointment date is mandatory")
    @Future(message = "Appointment date must be in the future")
    private LocalDateTime appointmentTime;

    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, COMPLETED

    private String notes;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public LocalDateTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalDateTime appointmentTime) { this.appointmentTime = appointmentTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}`
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'Dockerfile',
            path: 'backend/Dockerfile',
            type: 'file',
            content: `FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]`
          }
        ]
      }
    ],
    lessons: [
      {
        id: 'h-l1',
        title: 'Designing JPA Entities & Relational Mapping',
        objective: 'Define robust databases entities using JPA annotations, ensuring referential integrity and appropriate database constraints.',
        explanation: 'Java Persistence API (JPA) allows developer models to synchronize automatically with SQL database tables. Proper JPA configurations prevent tables from having mismatched datatypes or missing constraints.',
        theory: 'Entities map Java classes to PostgreSQL tables. JPA uses annotations like `@Entity`, `@Table`, and `@Column` to structure details. To protect data consistency, we append Jakarta validation rules like `@NotNull` or `@Future`. These trigger checks in Java before compiling query records, saving computational DB roundtrips.',
        whyWeDoThis: 'Failing to declare model constraints (e.g. allowing appointment dates in the past) results in dirty data. Placing validators on both model fields and database levels creates multiple layers of safety.',
        commonMistakes: [
          'Forgetting to add JPA default constructors, breaking hibernate lookups.',
          'Omitting table indexes for highly searched query columns (like `patient_id`).'
        ],
        bestPractices: [
          'Annotate status variables with default fallback constants.',
          'Define database constraints directly within the database engine via schemas.'
        ],
        code: `@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long patientId;
}`,
        path: 'backend/src/main/java/com/hospital/model/Appointment.java',
        quiz: [
          {
            id: 'hq-1',
            question: 'What happens if a client attempts to submit an appointment date in the past when using the @Future annotation?',
            options: [
              'The Java server crashes completely.',
              'JPA intercepts the submission, halts database insertion, and returns a 400 Bad Request response with validation details.',
              'The SQL database throws a unique constraint error.',
              'The application automatically delays the date by 24 hours.'
            ],
            correctAnswer: 1,
            explanation: 'The `@Future` annotation triggers active validation. When `@Valid` is passed to the Spring controller, Spring Boot rejects the payload and serves a validation payload.'
          }
        ],
        challenge: {
          title: 'Add status validation check',
          instructions: 'Edit the `Appointment.java` file model code mock logic to ensure appointment status is never null and is limited to 10 characters length.',
          initialCode: `// Add validation annotations here
private String status = "PENDING";`,
          solution: `@NotNull
@Size(max = 10)
private String status = "PENDING";`
        },
        completed: false
      }
    ],
    apiDocs: [
      {
        method: 'GET',
        endpoint: '/api/appointments',
        description: 'Retrieves all hospital appointment logs from the database.',
        responseBody: `[
  {
    "id": 1,
    "patientId": 45,
    "doctorId": 12,
    "appointmentTime": "2026-08-12T10:30:00",
    "status": "CONFIRMED",
    "notes": "Patient reports recurring chest pains."
  }
]`,
        statusCodes: [{ code: 200, description: 'Appointments loaded.' }]
      }
    ],
    dbSchemas: [
      {
        table: 'appointments',
        columns: [
          { name: 'id', type: 'bigint', key: 'PK' },
          { name: 'patient_id', type: 'bigint', key: 'FK' },
          { name: 'doctor_id', type: 'bigint', key: 'FK' },
          { name: 'appointment_time', type: 'timestamp' },
          { name: 'status', type: 'varchar(20)' }
        ],
        sql: `CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  doctor_id BIGINT NOT NULL,
  appointment_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING'
);`
      }
    ],
    architecture: {
      systemDiagram: `<svg viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="800" height="350" fill="#09090B" rx="10"/>
  <!-- User Client -->
  <rect x="50" y="100" width="150" height="120" fill="#111827" stroke="#374151" rx="6"/>
  <text x="125" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">Frontend Client</text>
  <text x="125" y="165" fill="#6366F1" font-size="10" text-anchor="middle" font-family="sans-serif">React App</text>
  <!-- API Gateway -->
  <rect x="300" y="100" width="180" height="120" fill="#111827" stroke="#8B5CF6" rx="6"/>
  <text x="390" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">Spring Boot Backend</text>
  <text x="390" y="165" fill="#22C55E" font-size="10" text-anchor="middle" font-family="sans-serif">Port 8080 API</text>
  <!-- Postgres Database -->
  <rect x="580" y="100" width="160" height="120" fill="#111827" stroke="#22C55E" rx="6"/>
  <text x="660" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">PostgreSQL</text>
  <text x="660" y="165" fill="#8B5CF6" font-size="10" text-anchor="middle" font-family="sans-serif">Port 5432</text>

  <!-- Connective Arrows -->
  <path d="M 200 160 L 300 160" fill="none" stroke="#6366F1" stroke-width="2"/>
  <path d="M 480 160 L 580 160" fill="none" stroke="#22C55E" stroke-width="2"/>
</svg>`,
      databaseDiagram: `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="600" height="200" fill="#09090B" rx="6"/>
  <rect x="50" y="40" width="160" height="120" fill="#111827" stroke="#374151" rx="6"/>
  <text x="130" y="65" fill="#F8FAFC" font-weight="bold" font-size="11" text-anchor="middle" font-family="sans-serif">patients</text>
  <text x="60" y="95" fill="#6366F1" font-size="10" font-family="monospace">🔑 id: pk</text>
  <text x="60" y="120" fill="#94A3B8" font-size="10" font-family="monospace">📄 name: varchar</text>

  <rect x="380" y="40" width="160" height="120" fill="#111827" stroke="#374151" rx="6"/>
  <text x="460" y="65" fill="#F8FAFC" font-weight="bold" font-size="11" text-anchor="middle" font-family="sans-serif">appointments</text>
  <text x="390" y="95" fill="#6366F1" font-size="10" font-family="monospace">🔑 id: pk</text>
  <text x="390" y="120" fill="#8B5CF6" font-size="10" font-family="monospace">🔗 patient_id: fk</text>

  <path d="M 210 95 L 380 120" fill="none" stroke="#6366F1" stroke-width="2"/>
</svg>`,
      flowDiagram: `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto"><rect width="400" height="150" fill="#09090B"/></svg>`,
      componentDiagram: `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto"><rect width="400" height="150" fill="#09090B"/></svg>`
    },
    interviewQuestions: [],
    resumeBulletPoints: [],
    linkedinDescription: '',
    readme: `# Hospital ERP

Enterprise Spring Boot backend for Hospital Scheduling.
`
  },
  {
    id: 'uber-clone',
    name: 'Uber Clone',
    description: 'A real-time ride-hailing mobile application that leverages Socket.io for live location coordination and MongoDB geospatial query calculations.',
    difficulty: 'Expert',
    techStack: {
      frontend: 'React Native + Expo',
      backend: 'Node.js + Express',
      database: 'MongoDB (Geospatial Indexes)',
      ai: 'Claude (Optimized Dispatch Routines)',
      deployment: 'Railway'
    },
    estimatedTime: '30 Hours',
    xpReward: 3000,
    skills: ['React Native Navigation', 'Websockets (Socket.io)', 'MongoDB Geospatial Indexes', 'Google Maps APIs', 'State Synchronisation'],
    objectives: [
      'Implement real-time location coordinate transmission via websockets.',
      'Configure MongoDB 2dsphere indexes for coordinate lookups.',
      'Manage complex mobile application navigation stacks.',
      'Construct a robust backend match dispatcher queue.'
    ],
    features: [
      'Interactive map view with live driver markers',
      'Instant WebSockets ride request dispatch routing',
      'Geospatial proximity query filters',
      'Dynamic ride tariff calculation formula'
    ],
    roadmap: [
      { id: 'u1', title: 'React Native Map Views', description: 'Integrate MapView components and acquire client location coordinates.', status: 'completed', estimatedHours: 6 },
      { id: 'u2', title: 'Socket.io Server Coordinates', description: 'Create express websocket gateway servers to emit client movements.', status: 'in-progress', estimatedHours: 8 },
      { id: 'u3', title: 'Mongo Geospatial Queries', description: 'Apply 2dsphere indexes to passenger data tables and query nearest drivers.', status: 'todo', estimatedHours: 8 },
      { id: 'u4', title: 'Ride Booking & Pricing API', description: 'Establish trip workflows (Request, Accept, Arrive, Complete) and integrate stripe mock billing.', status: 'todo', estimatedHours: 8 }
    ],
    files: [
      {
        name: 'backend',
        path: 'backend',
        type: 'folder',
        children: [
          {
            name: 'server.js',
            path: 'backend/server.js',
            type: 'file',
            content: `const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());

// In-memory driver locations tracking (latitude, longitude)
const drivers = {};

io.on('connection', (socket) => {
  console.log('User connected to socket gateway:', socket.id);

  // Driver registers location
  socket.on('updateLocation', (coords) => {
    // coords: { driverId, latitude, longitude }
    drivers[coords.driverId] = {
      socketId: socket.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      lastUpdated: new Date()
    };
    
    // Broadcast active drivers positions to riders
    io.emit('driverLocations', drivers);
  });

  // Rider requests a trip
  socket.on('requestRide', (rideRequest) => {
    // rideRequest: { riderId, pickupLat, pickupLng, destination }
    console.log('Ride requested by rider:', rideRequest.riderId);
    
    // Simple dispatcher finding first available driver (in-memory mock dispatch)
    const availableDrivers = Object.keys(drivers);
    if (availableDrivers.length > 0) {
      const selectedDriverId = availableDrivers[0];
      const driverSocket = drivers[selectedDriverId].socketId;
      
      // Send offer to driver
      io.to(driverSocket).emit('rideOffer', {
        tripId: 'trip_' + Math.random().toString(36).substr(2, 9),
        riderId: rideRequest.riderId,
        pickupLat: rideRequest.pickupLat,
        pickupLng: rideRequest.pickupLng,
        destination: rideRequest.destination
      });
    } else {
      socket.emit('rideError', 'No drivers available in your vicinity.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Connection closed:', socket.id);
    // Remove disconnected driver
    for (const id in drivers) {
      if (drivers[id].socketId === socket.id) {
        delete drivers[id];
      }
    }
    io.emit('driverLocations', drivers);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(\`Socket server running on port \${PORT}\`));`
          }
        ]
      }
    ],
    lessons: [
      {
        id: 'u-l1',
        title: 'Building Real-time Location Updates with WebSockets',
        objective: 'Implement continuous full-duplex socket message delivery to sync mobile coordinates without polling.',
        explanation: 'Standard REST endpoints operate on request-response cycles. Synchronizing real-time location vectors (e.g. updating a car position on a map twice per second) generates high HTTP request overhead. WebSockets resolve this by establishing a permanent open connection.',
        theory: 'WebSocket connections begin with an HTTP handshake. Once connected, client and server transfer binary/string frames directly over a single TCP pipeline. Socket.io encapsulates this protocol and appends connection health-checks, auto-reconnection logs, and rooms systems.',
        whyWeDoThis: 'Without WebSockets, mobile applications would require polling APIs every 1-2 seconds. This causes excessive cellular battery drain, server throttling, and high bandwidth costs.',
        commonMistakes: [
          'Leaving connections open when user switches to background modes, causing rapid battery discharge.',
          'Not validating coordinate payloads, creating parsing failures.'
        ],
        bestPractices: [
          'De-register socket events inside React Native hook unmounts.',
          'Protect socket gateways using JWT session validation tokens.'
        ],
        code: `// Express server socket setup:
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('updateLocation', (coords) => {
    // Broadcast data to connected clients
    socket.broadcast.emit('locationChanged', coords);
  });
});`,
        path: 'backend/server.js',
        quiz: [
          {
            id: 'uq-1',
            question: 'Why are standard HTTP REST APIs unsuitable for high-frequency location tracking in production applications?',
            options: [
              'Because HTTP has a header overhead on each request, which creates excessive bandwidth usage and network lag.',
              'Because JSON cannot store float coordinates.',
              'Because MongoDB does not accept REST payload operations.',
              'Because mobile browsers reject POST requests.'
            ],
            correctAnswer: 0,
            explanation: 'HTTP requires establishing a TCP connection and attaching large headers to every transaction, producing significant bandwidth waste and high latencies compared to minimal WebSocket frames.'
          }
        ],
        challenge: {
          title: 'Filter disconnected driver logs',
          instructions: 'Edit the `disconnect` socket block in `server.js` to ensure driver socket records are deleted cleanly.',
          initialCode: `socket.on('disconnect', () => {
  // Clear drivers object of disconnected socket
});`,
          solution: `socket.on('disconnect', () => {
  Object.keys(drivers).forEach(driverId => {
    if (drivers[driverId].socketId === socket.id) {
      delete drivers[driverId];
    }
  });
});`
        },
        completed: false
      }
    ],
    apiDocs: [],
    dbSchemas: [],
    architecture: {
      systemDiagram: `<svg viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="800" height="350" fill="#09090B" rx="10"/>
  <!-- Mobile App -->
  <rect x="50" y="100" width="150" height="120" fill="#111827" stroke="#374151" rx="6"/>
  <text x="125" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">Mobile Frontend</text>
  <text x="125" y="165" fill="#6366F1" font-size="10" text-anchor="middle" font-family="sans-serif">React Native App</text>
  <!-- Socket Gateway -->
  <rect x="300" y="100" width="180" height="120" fill="#111827" stroke="#8B5CF6" rx="6"/>
  <text x="390" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">Socket.io Express</text>
  <text x="390" y="165" fill="#22C55E" font-size="10" text-anchor="middle" font-family="sans-serif">Full-Duplex Server</text>
  <!-- Mongo database -->
  <rect x="580" y="100" width="160" height="120" fill="#111827" stroke="#22C55E" rx="6"/>
  <text x="660" y="140" fill="#F8FAFC" font-size="12" text-anchor="middle" font-weight="bold" font-family="sans-serif">MongoDB</text>
  <text x="660" y="165" fill="#8B5CF6" font-size="10" text-anchor="middle" font-family="sans-serif">Geospatial Index</text>

  <!-- Connective Arrows -->
  <path d="M 200 160 L 300 160" fill="none" stroke="#6366F1" stroke-width="2"/>
  <text x="250" y="145" fill="#94A3B8" font-size="9" text-anchor="middle" font-family="sans-serif">Websockets</text>
  <path d="M 480 160 L 580 160" fill="none" stroke="#22C55E" stroke-width="2"/>
</svg>`,
      databaseDiagram: `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto"><rect width="400" height="150" fill="#09090B"/></svg>`,
      flowDiagram: `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto"><rect width="400" height="150" fill="#09090B"/></svg>`,
      componentDiagram: `<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto"><rect width="400" height="150" fill="#09090B"/></svg>`
    },
    interviewQuestions: [],
    resumeBulletPoints: [],
    linkedinDescription: '',
    readme: `# WebSocket Uber Clone

Geospatial location matching microservice backend.
`
  }
];
