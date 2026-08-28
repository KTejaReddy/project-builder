'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Terminal, 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  Cpu, 
  Database, 
  Layout, 
  Cloud,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import { templateLibrary } from '@/data/templateLibrary';
import { Difficulty } from '@/types/project';
import { useProjects } from '@/context/ProjectContext';
import LoadingExperience from '@/components/ui/LoadingExperience';

function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const { createProject, generationStatus, activeStepLog } = useProjects();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  
  const [frontend, setFrontend] = useState('React');
  const [backend, setBackend] = useState('Next.js API Routes');
  const [database, setDatabase] = useState('Supabase (PostgreSQL)');
  const [ai, setAi] = useState('OpenAI');
  const [deployment, setDeployment] = useState('Vercel');

  const [generationMode, setGenerationMode] = useState<'fast' | 'learn'>('learn');
  const [aiExplain, setAiExplain] = useState(true);
  const [aiDebug, setAiDebug] = useState(true);
  const [aiQuiz, setAiQuiz] = useState(true);

  // Load template details if query param exists
  useEffect(() => {
    if (templateId) {
      const template = templateLibrary.find(t => t.id === templateId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setDifficulty(template.difficulty);
        setFrontend(template.technologies.frontend);
        setBackend(template.technologies.backend);
        setDatabase(template.technologies.database);
        setAi(template.technologies.ai);
        setDeployment(template.technologies.deployment);
      }
    }
  }, [templateId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    // Convert selection names to standard provider keys
    const providerKeyMap: Record<string, string> = {
      'openai': 'openai',
      'gemini pro': 'gemini',
      'claude 3.5': 'claude',
      'ollama (llama 3)': 'ollama',
      'mock': 'mock'
    };
    
    // Default to mock if no keys are set, or use user selection
    const selectedProvider = providerKeyMap[ai.toLowerCase()] || 'mock';

    const config = {
      name,
      description,
      difficulty,
      techStack: { frontend, backend, database, ai, deployment },
      features: templateLibrary.find(t => t.id === templateId)?.features,
      generationMode,
      options: {
        explainCode: aiExplain,
        diagnostics: aiDebug,
        quizzes: aiQuiz
      }
    };

    const generatedId = await createProject(config, selectedProvider as any);
    if (generatedId) {
      router.push(`/workspace/${generatedId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-10 z-10 relative">
        <Link 
          href="/dashboard" 
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-sm text-gray-400">
          ProjectForge <span className="text-indigo-500">AI</span>
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto">
        {(!generationStatus.isGenerating && !generationStatus.currentStep) ? (
          <GlassCard className="border border-white/5 p-8" hoverEffect={false}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              <h1 className="text-2xl font-bold text-white">Configure New Project</h1>
            </div>
            <p className="text-xs text-gray-400 mb-8 border-b border-white/5 pb-4">
              Our AI Mentor will generate folder files, interactive lessons, database diagrams, and API docs tailored to your selection.
            </p>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Project Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. AI Resume Builder"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Difficulty Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as Difficulty[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`text-[10px] font-bold py-2 rounded-lg border transition ${
                            difficulty === level 
                              ? 'bg-indigo-600 border-indigo-500 text-white' 
                              : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Learning Experience Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGenerationMode('learn')}
                        className={`text-xs p-3 rounded-xl border text-left flex flex-col justify-between transition h-24 ${
                          generationMode === 'learn'
                            ? 'bg-indigo-650/20 border-indigo-500 text-indigo-400 font-bold'
                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="font-extrabold text-xs flex items-center gap-1.5">🎓 Learn Mode</span>
                        <span className="text-[9px] font-normal text-gray-450 mt-1 leading-snug">AI teaches step-by-step with interactive quizzes and locked checkpoints. Recommended!</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGenerationMode('fast')}
                        className={`text-xs p-3 rounded-xl border text-left flex flex-col justify-between transition h-24 ${
                          generationMode === 'fast'
                            ? 'bg-indigo-650/20 border-indigo-500 text-indigo-400 font-bold'
                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="font-extrabold text-xs flex items-center gap-1.5">⚡ Fast Mode</span>
                        <span className="text-[9px] font-normal text-gray-450 mt-1 leading-snug">Accelerated scaffolding. Instantly generates all code templates and career docs.</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Project Goal / Core Features</label>
                    <textarea 
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what the application does. E.g. A multi-step form that captures resume items and optimizes experience paragraphs using OpenAI completions."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 transition leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Side: Stack Config */}
                <div className="space-y-4 bg-black/20 p-4 border border-white/5 rounded-2xl">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" /> Technologies stack Configuration
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Layout className="w-3.5 h-3.5 text-indigo-400" /> Frontend</label>
                    <select 
                      value={frontend} 
                      onChange={(e) => setFrontend(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                    >
                      <option>React</option>
                      <option>Next.js (App Router)</option>
                      <option>React Native (Expo)</option>
                      <option>Vue.js</option>
                      <option>Svelte</option>
                      <option>HTML / Vanilla CSS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-purple-400" /> Backend Engine</label>
                    <select 
                      value={backend} 
                      onChange={(e) => setBackend(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                    >
                      <option>Next.js API Routes</option>
                      <option>Node.js + Express</option>
                      <option>FastAPI (Python)</option>
                      <option>Spring Boot (Java)</option>
                      <option>Flask</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Database className="w-3.5 h-3.5 text-green-400" /> Persistent Database</label>
                    <select 
                      value={database} 
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                    >
                      <option>Supabase (PostgreSQL)</option>
                      <option>MongoDB</option>
                      <option>PostgreSQL (Raw)</option>
                      <option>SQLite</option>
                      <option>Firebase Firestore</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1">AI Engine</label>
                      <select 
                        value={ai} 
                        onChange={(e) => setAi(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                      >
                        <option>OpenAI</option>
                        <option>Gemini Pro</option>
                        <option>Claude 3.5</option>
                        <option>Ollama (Llama 3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Cloud className="w-3.5 h-3.5 text-indigo-400" /> Hosting</label>
                      <select 
                        value={deployment} 
                        onChange={(e) => setDeployment(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                      >
                        <option>Vercel</option>
                        <option>Railway</option>
                        <option>Render</option>
                        <option>Docker + AWS</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional AI Features */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Coding Assistant Features</div>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/10 p-3 rounded-xl hover:bg-black/60 transition">
                    <input 
                      type="checkbox" 
                      checked={aiExplain}
                      onChange={(e) => setAiExplain(e.target.checked)}
                      className="rounded accent-indigo-600" 
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Line Explainer</div>
                      <div className="text-[9px] text-gray-500">Break down logic details.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/10 p-3 rounded-xl hover:bg-black/60 transition">
                    <input 
                      type="checkbox" 
                      checked={aiDebug}
                      onChange={(e) => setAiDebug(e.target.checked)}
                      className="rounded accent-indigo-600" 
                    />
                    <div>
                      <div className="text-xs font-bold text-white">AI Diagnostics</div>
                      <div className="text-[9px] text-gray-500">Scan code issues.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/10 p-3 rounded-xl hover:bg-black/60 transition">
                    <input 
                      type="checkbox" 
                      checked={aiQuiz}
                      onChange={(e) => setAiQuiz(e.target.checked)}
                      className="rounded accent-indigo-600" 
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Lesson Challenges</div>
                      <div className="text-[9px] text-gray-500">Interactive quizzes.</div>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Generate Interactive Learning Workspace
              </button>
            </form>
          </GlassCard>
        ) : (
          <LoadingExperience status={generationStatus} activeLog={activeStepLog} />
        )}
      </div>
    </div>
  );
}

export default function CreateProject() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    }>
      <CreateProjectContent />
    </Suspense>
  );
}
