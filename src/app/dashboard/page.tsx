'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Flame, 
  Trophy, 
  Plus, 
  BookOpen, 
  ArrowRight, 
  Search,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  Settings,
  Trash2
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import { templateLibrary, templateCategories } from '@/data/templateLibrary';
import { useProjects } from '@/context/ProjectContext';
import { Project } from '@/types/project';

export default function UserDashboard() {
  const router = useRouter();
  const { userProjects, deleteProject } = useProjects();
  
  // Local profile states
  const [profile, setProfile] = useState({
    name: 'Guest Developer',
    email: 'guest@projectforge.ai',
    xp: 350,
    level: 1,
    streak: 3,
    completedProjectsCount: 0,
    badges: ['First Step', 'Innovator'],
    joinedDate: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Web Development');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Load profile
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      // Initialize guest profile if not set
      const defaultProfile = {
        name: 'Guest Developer',
        email: 'guest@projectforge.ai',
        xp: 350,
        level: 1,
        streak: 3,
        completedProjectsCount: 0,
        badges: ['First Step', 'Innovator'],
        joinedDate: 'July 2026'
      };
      localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
      setProfile(defaultProfile);
    }
  }, []);

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse('');

    setTimeout(() => {
      // Mocked high quality educational AI response
      const answer = `💡 **AI Mentor Response:**\n\nTo build database designs for projects like "${aiQuestion}", you should follow standard **relational normalization** principles:\n\n1. **Use UUIDs** instead of auto-incrementing integers for security in URLs.\n2. **Isolate transactional tables** from user tables to improve write operations scaling.\n3. **Map schemas inside migration tools** (like Prisma or Liquibase) rather than manual DB tools.\n\nWould you like me to generate a template database schema for this topic? Click "Create New Project" and we can design it together in Lesson Mode!`;
      setAiResponse(answer);
      setAiLoading(false);
    }, 1500);
  };

  // Compute stats details
  const levelProgress = (profile.xp % 1000) / 10; // Level is every 1000 XP
  const computedLevel = Math.floor(profile.xp / 1000) + 1;

  // Filter templates list
  const filteredTemplates = templateLibrary.filter(tpl => 
    tpl.category === activeCategory &&
    (tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tpl.technologies.frontend.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: string, name: string) => {
    const check = confirm(`Are you sure you want to delete "${name}" from your active workspace list?`);
    if (check) {
      deleteProject(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] flex flex-col md:flex-row relative">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#111827]/40 border-r border-white/5 flex flex-col justify-between shrink-0 p-6">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wider text-white">
              ProjectForge <span className="text-indigo-500">AI</span>
            </span>
          </Link>

          <div className="space-y-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Navigation</div>
            <Link href="/dashboard" className="flex items-center gap-2.5 text-white bg-indigo-600/10 border border-indigo-500/20 px-3 py-2 rounded-xl text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Dashboard
            </Link>
            <Link href="/create" className="flex items-center gap-2.5 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs transition">
              <Plus className="w-4 h-4" /> Create Project
            </Link>
            <Link href="/achievements" className="flex items-center gap-2.5 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs transition">
              <Trophy className="w-4 h-4" /> Achievements
            </Link>
            <Link href="/settings" className="flex items-center gap-2.5 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs transition">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </div>
        </div>

        {/* User stats widget at bottom of sidebar */}
        <div className="border-t border-white/5 pt-6 mt-6">
          <Link href="/profile" className="flex items-center gap-3 mb-2 hover:bg-white/5 p-1 rounded-xl transition">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-xs font-bold text-white truncate">{profile.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{profile.email}</div>
            </div>
          </Link>
          <div className="flex gap-2 items-center text-[11px] text-indigo-400">
            <Award className="w-3.5 h-3.5" /> Level {computedLevel} Developer
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto overflow-y-auto space-y-8 w-full">
        {/* TOP STATUS HEADER BAR */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Developer Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">Strengthen your portfolio by shipping real production projects.</p>
          </div>
          
          <div className="flex gap-3">
            {/* Streak Counter */}
            <div className="bg-[#111827]/40 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <div>
                <div className="text-xs font-bold text-white">{profile.streak} Day Streak</div>
                <div className="text-[9px] text-gray-500">Keep it up!</div>
              </div>
            </div>

            {/* Total XP Score */}
            <div className="bg-[#111827]/40 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <div>
                <div className="text-xs font-bold text-white">{profile.xp} XP</div>
                <div className="text-[9px] text-gray-500">Rank #245 (Bronze)</div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRESS WORKSPACE SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <GlassCard className="col-span-1 border border-white/5 flex flex-col justify-between" hoverEffect={false}>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Level Progression</h3>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold text-white">Level {computedLevel}</span>
                <span className="text-xs text-gray-400">{profile.xp % 1000} / 1000 XP</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-2 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500">Earn {1000 - (profile.xp % 1000)} more XP by completing milestones to reach Level {computedLevel + 1}!</p>
            </div>
            
            <div className="border-t border-white/5 pt-4 mt-6">
              <div className="text-xs font-semibold text-white mb-2">Achievements &amp; Badges</div>
              <div className="flex gap-2">
                {profile.badges.map((badge, i) => (
                  <span key={i} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2 py-1 rounded-lg">
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Quick AI Search Mentor */}
          <GlassCard className="col-span-1 lg:col-span-2 border border-white/5 flex flex-col justify-between" hoverEffect={false}>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Ask AI Mentor
              </h3>
              <p className="text-xs text-gray-400 mb-4">Query design workflows or architecture questions.</p>
              
              <form onSubmit={handleAskAI} className="flex gap-2 bg-black/40 border border-white/10 rounded-xl p-1">
                <input 
                  type="text" 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="e.g. How do I build a database for an e-commerce cart?" 
                  className="bg-transparent outline-none w-full text-xs pl-3 text-white" 
                />
                <button 
                  type="submit" 
                  disabled={aiLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0"
                >
                  {aiLoading ? 'Asking...' : 'Ask'}
                </button>
              </form>
            </div>

            {aiResponse && (
              <div className="mt-4 p-3 bg-black/30 border border-white/5 rounded-lg text-[11px] text-gray-300 overflow-y-auto max-h-[120px] whitespace-pre-wrap leading-relaxed">
                {aiResponse}
              </div>
            )}
            {!aiResponse && (
              <div className="text-[10px] text-gray-500 mt-6 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" /> AI response utilizes pre-trained architectural patterns.
              </div>
            )}
          </GlassCard>
        </div>

        {/* ACTIVE / CONTINUE LEARNING */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Continue Building</h2>
          {userProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userProjects.map((project) => {
                // Compute completed lessons percentage
                const completedCount = project.lessons.filter(l => l.completed).length;
                const progressPct = project.lessons.length > 0 
                  ? Math.round((completedCount / project.lessons.length) * 100)
                  : 0;

                return (
                  <GlassCard key={project.id} className="border border-white/5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase">
                          {project.difficulty}
                        </span>
                        <span className="text-[10px] text-green-400 font-semibold">{project.xpReward} XP</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-2">{project.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>Course Progress ({completedCount} / {project.lessons.length} lessons)</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <span className="text-[10px] text-gray-500 truncate max-w-[150px]">Stack: {project.techStack.frontend}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete Project Workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link 
                          href={`/workspace/${project.id}`}
                          className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                        >
                          Enter Workspace <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 bg-[#111827]/10 border border-white/5 rounded-2xl text-xs text-gray-400">
              You don&apos;t have any ongoing projects. Go select a template below or type a custom build prompt!
            </div>
          )}
        </section>

        {/* EXPLORE TEMPLATES GRID */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-white">Recommended Blueprints</h2>
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-1.5 rounded-lg text-xs w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search templates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-xs text-white" 
              />
            </div>
          </div>

          {/* Categories Tab Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
            {templateCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow' 
                    : 'bg-black/45 border-white/5 text-gray-450 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((tpl) => {
                const xpVal = tpl.difficulty === 'Beginner' ? 800 : tpl.difficulty === 'Intermediate' ? 1200 : tpl.difficulty === 'Advanced' ? 1800 : 2500;
                return (
                  <GlassCard key={tpl.id} className="border border-white/5 flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/15 px-2 py-0.5 rounded uppercase font-bold">
                          {tpl.difficulty}
                        </span>
                        <span className="text-[10px] text-green-400 font-semibold">+{xpVal} XP</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-2 truncate">{tpl.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{tpl.description}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-3">
                      <span className="text-[9px] text-gray-500 truncate max-w-[120px]">{tpl.technologies.frontend}</span>
                      <Link 
                        href={`/create?template=${tpl.id}`}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Select Blueprint
                      </Link>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-950/20 border border-white/5 rounded-xl text-xs text-gray-500">
                No blueprints match your query in this category.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

