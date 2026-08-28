'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  BookOpen, 
  Layers, 
  Cpu, 
  ArrowRight, 
  Play, 
  Code, 
  Sparkles, 
  Check, 
  ChevronDown, 
  Star,
  Users,
  Award,
  Lock
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';

// FAQ list
const faqs = [
  {
    q: "How does ProjectForge AI teach me software engineering?",
    a: "Unlike simple code generators that just give you copy-paste outputs, ProjectForge AI splits any project into interactive roadmaps, conceptual database designs, API endpoints, folder breakdowns, and code files. Every milestone comes with an educational lesson containing core theory, 'why we do this', common mistakes, and interactive quizzes to make sure you learn."
  },
  {
    q: "Can I generate my own custom projects or only templates?",
    a: "Both! You can choose from our 20+ pre-built SaaS templates or type any custom prompt (e.g. 'I want to build a decentralized micro-blogging app with Next.js'). Our system generates a tailored course structure, interactive code tree, and custom lessons specifically for that stack."
  },
  {
    q: "What programming languages and frameworks are supported?",
    a: "We support a wide array of modern technologies including React, Next.js, TypeScript, React Native, Node.js, Spring Boot, FastAPI, Django, MongoDB, PostgreSQL, Supabase, Docker, and deployment setups on AWS or Vercel."
  },
  {
    q: "Do I need to pay for OpenAI API keys to use the mentor?",
    a: "No! ProjectForge AI includes built-in AI credits. You can run code optimizations, generate debug suggestions, and chat with your AI Coding Mentor out of the box. Pro accounts unlock access to advanced models like GPT-4o, Claude 3.5 Sonnet, and Gemini Pro."
  }
];

// Project templates
const sampleTemplates = [
  { name: 'AI Resume Builder', difficulty: 'Intermediate', lang: 'React + Next.js', xp: '1,200 XP', path: 'ai-resume-builder' },
  { name: 'Hospital Management ERP', difficulty: 'Advanced', lang: 'Spring Boot + Postgres', xp: '2,000 XP', path: 'hospital-management-system' },
  { name: 'Uber Clone Realtime Map', difficulty: 'Expert', lang: 'React Native + Sockets', xp: '3,000 XP', path: 'uber-clone' },
  { name: 'Netflix Clone', difficulty: 'Intermediate', lang: 'Next.js + Tailwind', xp: '1,500 XP', path: 'netflix-clone' }
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F8FAFC] flex flex-col relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            ProjectForge <span className="text-indigo-500">AI</span>
          </span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#templates" className="hover:text-white transition">Templates</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </nav>
        <div className="flex gap-4 items-center">
          <Link href="/auth?mode=login" className="text-sm font-medium text-gray-400 hover:text-white transition">
            Sign In
          </Link>
          <Link 
            href="/auth?mode=signup" 
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
          >
            Start Building
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-6 md:px-12 pt-20 pb-16 flex flex-col items-center text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full py-1.5 px-4 text-xs font-semibold mb-8 hover:bg-indigo-500/15 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Introducing ProjectForge AI v1.0 — Start Coding Free
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6 text-gradient"
        >
          Build Any Software Project.<br />
          <span className="text-gradient-purple">Learn Every Single Line.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-xl text-gray-400 max-w-3xl leading-relaxed mb-10"
        >
          Generate production-ready code trees, architectural diagrams, and tailored lessons. 
          The ultimate AI coding mentor that teaches you software engineering through direct project execution.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full mb-16"
        >
          <Link 
            href="/auth?mode=guest" 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-600/15 hover:shadow-indigo-500/35 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
          <a 
            href="#templates" 
            className="w-full sm:w-auto bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-semibold px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            Explore Projects
          </a>
          <button 
            onClick={() => alert("Watch Demo: Loading ProjectForge walkthrough...")}
            className="w-full sm:w-auto text-gray-400 hover:text-white font-semibold py-2 px-4 flex items-center justify-center gap-2 transition"
          >
            <div className="bg-gray-900 border border-gray-800 p-2 rounded-full hover:bg-gray-850 transition">
              <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* 3D DASHBOARD PREVIEW */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-6xl relative"
        >
          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-3xl -z-10 animate-glow" />
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header tab window mock */}
            <div className="bg-[#111827] border-b border-white/5 py-3 px-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-black/40 border border-white/5 text-xs text-gray-400 py-1 px-8 rounded-lg select-none">
                projectforge-ai.com/workspace/ai-resume-builder
              </div>
              <div className="w-12" />
            </div>
            
            {/* Mock Layout Grid */}
            <div className="grid grid-cols-12 h-[350px] md:h-[480px] text-left">
              {/* Sidebar */}
              <div className="col-span-3 bg-black/40 border-r border-white/5 p-4 hidden md:flex flex-col justify-between text-xs text-gray-400">
                <div className="space-y-4">
                  <div className="text-gray-500 font-semibold tracking-wider text-[10px] uppercase">WORKSPACE</div>
                  <div className="flex items-center gap-2 text-white bg-indigo-600/10 border border-indigo-500/20 px-2 py-1.5 rounded-lg">
                    <Terminal className="w-4 h-4 text-indigo-400" /> Code Workspace
                  </div>
                  <div className="flex items-center gap-2 hover:text-white px-2 py-1 transition cursor-pointer">
                    <BookOpen className="w-4 h-4" /> Lesson Mode (2/10)
                  </div>
                  <div className="flex items-center gap-2 hover:text-white px-2 py-1 transition cursor-pointer">
                    <Layers className="w-4 h-4" /> Relational Architecture
                  </div>
                  <div className="flex items-center gap-2 hover:text-white px-2 py-1 transition cursor-pointer">
                    <Cpu className="w-4 h-4" /> API Specifications
                  </div>
                </div>
                <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3">
                  <div className="text-indigo-400 font-bold mb-1">XP Progress</div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[65%]" />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                    <span>Lvl 3</span>
                    <span>1,250 / 2,000 XP</span>
                  </div>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="col-span-12 md:col-span-6 bg-black/60 p-5 font-mono text-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="text-gray-500 mb-2">// 🚀 Secure API route to proxy OpenAI models</div>
                  <div className="text-indigo-300">import <span className="text-purple-400">{"{ NextResponse }"}</span> from <span className="text-green-300">&apos;next/server&apos;</span>;</div>
                  <div className="text-gray-300"></div>
                  <div className="text-indigo-300">export async function <span className="text-yellow-400">POST</span>(req: Request) {"{"}</div>
                  <div className="text-gray-300">&nbsp;&nbsp;try {"{"}</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;const {"{ role, description }"} = await req.json();</div>
                  <div className="text-gray-500">&nbsp;&nbsp;&nbsp;&nbsp;// Validate parameter properties</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;if (!role || !description) {"{"}</div>
                  <div className="text-red-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return NextResponse.json({"{ error: 'Missing values' }"}, {"{ status: 400 }"});</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;{"}"}</div>
                  <div className="text-gray-500">&nbsp;&nbsp;&nbsp;&nbsp;// Connect securely on Node environment level</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;const apiKey = process.env.OPENAI_API_KEY;</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;const res = await <span className="text-yellow-400">fetch</span>(<span className="text-green-300">&apos;https://api.openai.com/v1/chat/completions&apos;</span>);</div>
                  <div className="text-indigo-300">&nbsp;&nbsp;&nbsp;&nbsp;return NextResponse.json({"{ optimizedText }"});</div>
                  <div className="text-gray-300">&nbsp;&nbsp;{"}"} catch (e) {"{"}</div>
                  <div className="text-red-400">&nbsp;&nbsp;&nbsp;&nbsp;return NextResponse.json({"{ error: 'Server error' }"}, {"{ status: 500 }"});</div>
                  <div className="text-gray-300">&nbsp;&nbsp;{"}"}</div>
                  <div className="text-indigo-300">{"}"}</div>
                </div>
                
                {/* Micro code action buttons */}
                <div className="flex gap-2 border-t border-white/5 pt-4">
                  <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded text-[10px] font-bold cursor-pointer">
                    ✨ AI Explain
                  </span>
                  <span className="bg-purple-600/20 text-purple-400 border border-purple-500/20 px-3 py-1 rounded text-[10px] font-bold cursor-pointer">
                    🐛 AI Debug
                  </span>
                  <span className="bg-green-600/20 text-green-400 border border-green-500/20 px-3 py-1 rounded text-[10px] font-bold cursor-pointer">
                    🔧 AI Refactor
                  </span>
                </div>
              </div>

              {/* AI Assistant Sidebar */}
              <div className="col-span-12 md:col-span-3 bg-[#111827]/40 border-l border-white/5 p-4 flex flex-col justify-between text-xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Sparkles className="w-4 h-4" /> AI MENTOR
                  </div>
                  <div className="bg-[#111827]/80 border border-white/5 p-3 rounded-lg text-gray-300 leading-relaxed text-[11px]">
                    I noticed your API handler reads `process.env.OPENAI_API_KEY`. This is a secure best practice! 
                    Never prefix it with `NEXT_PUBLIC_` or the client bundle will leak your API credentials.
                  </div>
                  <div className="border border-white/5 p-2 rounded-lg bg-black/40 text-[10px]">
                    <div className="text-gray-500 mb-1">PROMPT</div>
                    <div className="text-gray-300">Why are we proxying this instead of calling from React?</div>
                  </div>
                </div>
                <div className="border border-white/5 p-2 rounded-lg flex items-center bg-black/40">
                  <input 
                    type="text" 
                    placeholder="Ask AI Mentor..." 
                    className="bg-transparent outline-none w-full text-[11px] text-gray-400" 
                    disabled 
                  />
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATISTICS */}
      <section className="py-12 border-y border-white/5 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-5xl font-extrabold text-indigo-500 mb-1">120K+</div>
            <div className="text-xs md:text-sm text-gray-400">Active Developers</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-extrabold text-purple-500 mb-1">200+</div>
            <div className="text-xs md:text-sm text-gray-400">Project Blueprints</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-extrabold text-green-500 mb-1">4.9/5</div>
            <div className="text-xs md:text-sm text-gray-400">User Rating</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-extrabold text-indigo-500 mb-1">98%</div>
            <div className="text-xs md:text-sm text-gray-400">Completion rate</div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURES */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Unmatched Educational Toolkit</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            We combined all elements of professional engineering - Architecture, Database Design, Code Execution, and AI Mentorship - into a unified interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard glowColor="indigo" hoverEffect>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Lesson Mode &amp; Quizzes</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every coding step is backed by clean theory, explanations of common architectural mistakes, and quizzes to evaluate your progress.
            </p>
          </GlassCard>

          <GlassCard glowColor="purple" hoverEffect>
            <div className="bg-purple-600/10 border border-purple-500/20 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual System Architecture</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Review automatically generated SQL relational schemas, API request-response specifications, and dynamic flowcharts of component interactions.
            </p>
          </GlassCard>

          <GlassCard glowColor="green" hoverEffect>
            <div className="bg-green-600/10 border border-green-500/20 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6">
              <Code className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Monaco Code Editor</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Edit codebase files in the cloud with complete syntax highlighting, file explorer trees, interactive code adjustments, and live preview rendering.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-gray-950/20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-gray-400 text-sm">Four simple steps to engineer a project and master the stack.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="text-5xl font-extrabold text-indigo-500/20 mb-4 font-mono">01</div>
              <h4 className="text-lg font-bold mb-2">Input Idea</h4>
              <p className="text-gray-400 text-xs leading-relaxed">Type any project description or pick from the preconfigured startup templates.</p>
            </div>
            <div className="relative">
              <div className="text-5xl font-extrabold text-indigo-500/20 mb-4 font-mono">02</div>
              <h4 className="text-lg font-bold mb-2">Explore Roadmap</h4>
              <p className="text-gray-400 text-xs leading-relaxed">Examine the structured milestones, DB tables, and API layouts generated for your system.</p>
            </div>
            <div className="relative">
              <div className="text-5xl font-extrabold text-indigo-500/20 mb-4 font-mono">03</div>
              <h4 className="text-lg font-bold mb-2">Study &amp; Code</h4>
              <p className="text-gray-400 text-xs leading-relaxed">Solve quizzes, follow the lesson code explanations line-by-line, and adjust code in the editor.</p>
            </div>
            <div className="relative">
              <div className="text-5xl font-extrabold text-indigo-500/20 mb-4 font-mono">04</div>
              <h4 className="text-lg font-bold mb-2">Export Work</h4>
              <p className="text-gray-400 text-xs leading-relaxed">Export source code, generate custom interview questions, and extract copy-ready CV accomplishments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE TEMPLATES */}
      <section id="templates" className="py-24 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Build from Starter Blueprints</h2>
            <p className="text-gray-400 text-sm max-w-lg">Accelerate your training by selecting one of our curated high-quality software configurations.</p>
          </div>
          <Link href="/auth?mode=signup" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1.5 mt-4 md:mt-0 transition">
            View all 20+ templates <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleTemplates.map((tpl, i) => (
            <GlassCard key={i} className="flex flex-col justify-between h-48 border border-white/5" hoverEffect>
              <div>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {tpl.difficulty}
                </span>
                <h4 className="text-lg font-bold mt-2 text-white">{tpl.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{tpl.lang}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs font-semibold text-green-400">{tpl.xp}</span>
                <Link 
                  href={`/auth?mode=guest&project=${tpl.path}`}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded transition"
                >
                  Configure
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 md:px-12 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Transparent Pricing</h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">Unlock unlimited project generations, custom AI model configurations, and downloadable project certifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <GlassCard hoverEffect={false} className="border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-300">Free Tier</h3>
              <p className="text-gray-400 text-xs mt-1">Perfect to get started learning.</p>
              <div className="text-4xl font-extrabold text-white my-6">$0 <span className="text-xs text-gray-500">/ forever</span></div>
              <ul className="space-y-3.5 text-xs text-gray-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Access to 3 standard templates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Interactive Monaco Editor (local)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Standard Lesson Mode &amp; Quizzes</li>
                <li className="flex items-center gap-2 text-gray-600"><Lock className="w-3.5 h-3.5" /> No Custom Workspace Generation</li>
                <li className="flex items-center gap-2 text-gray-600"><Lock className="w-3.5 h-3.5" /> No AI Code Refactoring</li>
              </ul>
            </div>
            <Link href="/auth?mode=signup" className="mt-8 block text-center bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 rounded-xl transition">
              Get Started
            </Link>
          </GlassCard>

          {/* Pro Tier (Recommended) */}
          <GlassCard hoverEffect={false} className="border-2 border-indigo-500 relative flex flex-col justify-between shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
              RECOMMENDED
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-400">Pro Developer</h3>
              <p className="text-gray-400 text-xs mt-1">For learners seeking fast growth.</p>
              <div className="text-4xl font-extrabold text-white my-6">$19 <span className="text-xs text-gray-500">/ month</span></div>
              <ul className="space-y-3.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <b>Unlimited</b> project generations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Full Access to all 20+ templates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Premium AI Mentor (Unlimited credits)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Custom Architecture Export</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> CV and Interview prep generators</li>
              </ul>
            </div>
            <Link href="/auth?mode=signup" className="mt-8 block text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20">
              Go Pro Now
            </Link>
          </GlassCard>

          {/* Enterprise Tier */}
          <GlassCard hoverEffect={false} className="border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-300">Team / School</h3>
              <p className="text-gray-400 text-xs mt-1">For cohorts, bootcamps and classes.</p>
              <div className="text-4xl font-extrabold text-white my-6">Custom <span className="text-xs text-gray-500">/ custom</span></div>
              <ul className="space-y-3.5 text-xs text-gray-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Custom team dashboards</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Classroom progress metrics</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Group leaderboard challenges</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Custom API deployment integrations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority enterprise support</li>
              </ul>
            </div>
            <button 
              onClick={() => alert("Contact Sales at sales@projectforge.ai")} 
              className="mt-8 block text-center bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 rounded-xl transition"
            >
              Contact Sales
            </button>
          </GlassCard>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/5 bg-[#111827]/25 rounded-xl overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full text-left p-5 flex justify-between items-center text-sm font-semibold hover:bg-white/5 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-5 pt-0 border-t border-white/5 text-xs text-gray-400 leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 border-t border-white/5 bg-gray-950/40 relative">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Join our Newsletter</h2>
          <p className="text-gray-400 text-xs md:text-sm mb-6">Stay informed on new technologies, educational roadmaps, and programming course releases.</p>
          {subscribed ? (
            <div className="text-green-400 font-bold p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm">
              ✓ Welcome to ProjectForge! Check your inbox for your first challenge.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 p-1.5 bg-black/40 border border-white/10 rounded-xl">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.com" 
                className="bg-transparent outline-none w-full text-sm pl-3 text-white" 
              />
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#09090B] px-6 md:px-12 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gray-800 p-1.5 rounded-lg flex items-center justify-center">
              <Terminal className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="font-bold text-sm tracking-wider text-gray-300">
              ProjectForge <span className="text-indigo-500">AI</span>
            </span>
          </div>
          <div className="flex gap-8">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#templates" className="hover:text-white transition">Blueprints</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="mailto:support@projectforge.ai" className="hover:text-white transition">Contact</a>
          </div>
          <p>© 2026 ProjectForge AI. Engineered with ❤️ for developers worldwide.</p>
        </div>
      </footer>
    </div>
  );
}
