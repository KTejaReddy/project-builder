'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  TrendingUp, 
  MessageSquare, 
  Flag, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  DollarSign 
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';

const initialUsers = [
  { name: 'Marcus Sterling', email: 'marcus@domain.com', xp: 11100, streak: 12, status: 'Active' },
  { name: 'Elena Rostova', email: 'elena@domain.com', xp: 12500, streak: 8, status: 'Active' },
  { name: 'Sarah Chen', email: 'sarah.c@domain.com', xp: 520, streak: 4, status: 'Inactive' },
  { name: 'John Doe', email: 'john@example.com', xp: 1200, streak: 2, status: 'Active' }
];

const initialFeedback = [
  { user: 'Marcus S.', topic: 'Monaco Editor saving latency', comment: 'Saving code in workspace sometimes lags by 0.5s. But AI explainer works beautifully!', date: '2 hours ago' },
  { user: 'Elena R.', topic: 'Uber Clone lesson content', comment: 'The geospatial queries lesson is extremely detailed. Helped me clear my interview!', date: '1 day ago' }
];

export default function AdminPanel() {
  const [flags, setFlags] = useState({
    monacoCollab: false,
    offlineLlama: true,
    sandboxV3: false,
    audioTutor: false
  });

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-900/5 blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-10 z-10 relative">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-sm text-gray-400">
          ProjectForge <span className="text-indigo-500">AI</span> Admin
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-indigo-400" /> Platform Administration
            </h1>
            <p className="text-xs text-gray-400 mt-1">Monitor active platform health-checks, analytics metrics, and deploy feature controls.</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            All services online
          </div>
        </div>

        {/* Analytics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard hoverEffect={false} className="border border-white/5 p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 font-bold uppercase">Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">124,520</div>
            <div className="text-[10px] text-green-400 mt-1">📈 +12% this week</div>
          </GlassCard>

          <GlassCard hoverEffect={false} className="border border-white/5 p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 font-bold uppercase">Active Projects</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">18,245</div>
            <div className="text-[10px] text-green-400 mt-1">📈 +5% this week</div>
          </GlassCard>

          <GlassCard hoverEffect={false} className="border border-white/5 p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 font-bold uppercase">SaaS Revenue</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">$34,890</div>
            <div className="text-[10px] text-indigo-400 mt-1">💰 MRR Targets met</div>
          </GlassCard>

          <GlassCard hoverEffect={false} className="border border-white/5 p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 font-bold uppercase">AI Scribe Calls</span>
              <Cpu className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">892,104</div>
            <div className="text-[10px] text-gray-500 mt-1">⏳ Latency: 120ms</div>
          </GlassCard>
        </div>

        {/* Analytics line charts split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main user metrics chart */}
          <GlassCard hoverEffect={false} className="lg:col-span-2 border border-white/5 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-green-400" /> Daily User Acquisition Rates
              </h3>
              <span className="text-[10px] text-gray-500">July 1 - July 7</span>
            </div>

            {/* Custom SVG line chart diagram to prevent recharts compilation dependencies errors */}
            <div className="bg-black/30 p-4 border border-white/5 rounded-xl">
              <svg viewBox="0 0 500 200" className="w-full h-auto">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Y Axis helper grids */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="40" y1="80" x2="480" y2="80" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="40" y1="130" x2="480" y2="130" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2"/>
                <line x1="40" y1="180" x2="480" y2="180" stroke="#374151" strokeWidth="1"/>

                {/* X Axis texts */}
                <text x="40" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 1</text>
                <text x="110" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 2</text>
                <text x="180" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 3</text>
                <text x="250" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 4</text>
                <text x="320" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 5</text>
                <text x="390" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 6</text>
                <text x="460" y="195" fill="#94A3B8" fontSize="8" textAnchor="middle">Jul 7</text>

                {/* Chart path area */}
                <path d="M 40 150 Q 110 110 180 120 T 250 80 T 320 90 T 390 50 T 460 35 L 460 180 L 40 180 Z" fill="url(#chartGrad)"/>
                {/* Chart path line */}
                <path d="M 40 150 Q 110 110 180 120 T 250 80 T 320 90 T 390 50 T 460 35" fill="none" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round"/>
              </svg>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <circle cx="460" cy="35" r="5" fill="#6366F1" stroke="#f8fafc" strokeWidth="1.5"/>
              </svg>
            </div>
          </GlassCard>

          {/* Feature Flags panel */}
          <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-purple-400" /> Platform feature flags
            </h3>
            
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">Monaco Collaboration</div>
                  <div className="text-[9px] text-gray-500">Enable real-time peer editing.</div>
                </div>
                <button 
                  onClick={() => toggleFlag('monacoCollab')}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition ${flags.monacoCollab ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition ${flags.monacoCollab ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">Offline Llama Models</div>
                  <div className="text-[9px] text-gray-500">Enable client offline compilation.</div>
                </div>
                <button 
                  onClick={() => toggleFlag('offlineLlama')}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition ${flags.offlineLlama ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition ${flags.offlineLlama ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">Interactive Sandbox v3</div>
                  <div className="text-[9px] text-gray-500">Run code in custom sub-iframe cells.</div>
                </div>
                <button 
                  onClick={() => toggleFlag('sandboxV3')}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition ${flags.sandboxV3 ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition ${flags.sandboxV3 ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Users list and feedback comments split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Users Table */}
          <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              👤 Student Enrollments
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-300">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 text-[10px] uppercase">
                    <th className="py-2">User details</th>
                    <th className="py-2">XP Score</th>
                    <th className="py-2">Streak</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {initialUsers.map((user, i) => (
                    <tr key={i}>
                      <td className="py-3">
                        <div className="font-bold text-white text-xs">{user.name}</div>
                        <div className="text-[9px] text-gray-500">{user.email}</div>
                      </td>
                      <td className="py-3 font-mono">{user.xp} XP</td>
                      <td className="py-3 font-mono">🔥 {user.streak} days</td>
                      <td className="py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          user.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button 
                          onClick={() => alert(`Suspended user ${user.name} successfully.`)}
                          className="text-[9px] font-bold text-red-400 hover:underline"
                        >
                          Suspend
                        </button>
                        <button 
                          onClick={() => alert(`Password reset link dispatched for ${user.email}.`)}
                          className="text-[9px] font-bold text-indigo-400 hover:underline"
                        >
                          Reset Pwd
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* User Feedback Reports */}
          <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-400" /> User Feedback Logs
            </h3>
            
            <div className="space-y-4">
              {initialFeedback.map((fb, i) => (
                <div key={i} className="bg-black/30 border border-white/5 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span className="font-bold text-indigo-300">{fb.user} - {fb.topic}</span>
                    <span>{fb.date}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{fb.comment}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

      </main>
    </div>
  );
}
