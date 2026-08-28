'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  ArrowLeft, 
  Trophy, 
  Flame, 
  Award, 
  Sparkles, 
  Lock, 
  CheckCircle,
  TrendingUp,
  Download,
  Users
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';

const initialBadges = [
  { id: 'b1', name: 'First Step', desc: 'Initialize your first workspace blueprint.', unlocked: true, icon: '🚀' },
  { id: 'b2', name: 'Innovator', desc: 'Custom compile a project using stack configurations.', unlocked: true, icon: '💡' },
  { id: 'b3', name: 'Database Architect', desc: 'Review DB column schemas and export SQL schemas.', unlocked: false, icon: '🗄️' },
  { id: 'b4', name: 'Clean Code Scribe', desc: 'Pass a code challenge review validation.', unlocked: false, icon: '✨' },
  { id: 'b5', name: 'AI Apprentice', desc: 'Leverage AI Explainer line code breakdowns.', unlocked: false, icon: '🤖' }
];

const mockLeaderboard = [
  { rank: 1, name: 'Alex Rivera', xp: 14200, level: 15, avatar: '👨‍💻' },
  { rank: 2, name: 'Elena Rostova', xp: 12500, level: 13, avatar: '👩‍💻' },
  { rank: 3, name: 'Marcus Sterling', xp: 11100, level: 12, avatar: '👨‍💻' },
  { rank: 244, name: 'Sarah Chen', xp: 520, level: 1, avatar: '👩‍💻' },
  { rank: 245, name: 'Guest Developer', xp: 350, level: 1, avatar: '👨‍💻', isCurrentUser: true },
  { rank: 246, name: 'David Kim', xp: 310, level: 1, avatar: '👨‍💻' }
];

export default function AchievementsPage() {
  const [profile, setProfile] = useState({
    name: 'Guest Developer',
    email: 'guest@projectforge.ai',
    xp: 350,
    level: 1,
    streak: 3,
    completedProjectsCount: 0,
    badges: ['First Step', 'Innovator']
  });

  const [activeCert, setActiveCert] = useState<string | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      
      // Update leaderboard profile XP
      const userIndex = mockLeaderboard.findIndex(u => u.isCurrentUser);
      if (userIndex !== -1) {
        mockLeaderboard[userIndex].xp = parsed.xp;
        mockLeaderboard[userIndex].level = parsed.level || Math.floor(parsed.xp / 1000) + 1;
        mockLeaderboard[userIndex].name = parsed.name;
      }
    }
  }, []);

  const computedLevel = Math.floor(profile.xp / 1000) + 1;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-900/5 blur-[120px] pointer-events-none" />

      {/* Header navbar */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-10 z-10 relative">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-sm text-gray-400">
          ProjectForge <span className="text-indigo-500">AI</span>
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Achievements Intro */}
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500/20" /> Developer Milestones
          </h1>
          <p className="text-xs text-gray-400 mt-1">Unlock badges, track global rankings, and compile engineering credentials.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard hoverEffect={false} className="border border-white/5 flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3.5 rounded-2xl">
              <Award className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">Level {computedLevel}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Developer Rank</div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect={false} className="border border-white/5 flex items-center gap-4">
            <div className="bg-orange-500/10 p-3.5 rounded-2xl">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500/20" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{profile.streak} Days</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Continuous Streak</div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect={false} className="border border-white/5 flex items-center gap-4">
            <div className="bg-green-500/10 p-3.5 rounded-2xl">
              <Trophy className="w-8 h-8 text-green-400 fill-green-400/20" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{profile.xp} XP</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Accumulated XP</div>
            </div>
          </GlassCard>
        </div>

        {/* Badges Grid & Leaderboard Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Badge grid: Left column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">🏅 Unlocked Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialBadges.map((badge) => {
                // Check if user has unlocked it
                const isUnlocked = profile.badges.includes(badge.name) || badge.unlocked;
                return (
                  <GlassCard 
                    key={badge.id} 
                    className={`border border-white/5 flex gap-4 ${isUnlocked ? '' : 'opacity-50'}`}
                    hoverEffect={isUnlocked}
                  >
                    <div className="text-3xl shrink-0 flex items-center justify-center bg-black/40 w-12 h-12 rounded-xl">
                      {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{badge.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{badge.desc}</p>
                      <div className="mt-2">
                        {isUnlocked ? (
                          <span className="text-[9px] text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Completed
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-500 font-bold">🔒 Locked</span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Certifications Block */}
            <div className="border-t border-white/5 pt-8 space-y-4">
              <h3 className="text-lg font-bold text-white">🎓 Course Certifications</h3>
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Full Stack Engineering Certification</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md">Complete any template project dashboard syllabus at 100% completion rates to unlock downloads.</p>
                </div>
                <button 
                  onClick={() => alert("Keep building! You will unlock printable PDFs once all lesson modules are marked completed.")}
                  className="bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-400 hover:text-white text-xs font-semibold py-2 px-5 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </GlassCard>
            </div>
          </div>

          {/* Leaderboard panel: Right Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Community Standings
            </h3>
            <GlassCard hoverEffect={false} className="border border-white/5 p-4">
              <div className="space-y-3.5">
                {mockLeaderboard.map((user) => (
                  <div 
                    key={user.rank} 
                    className={`flex items-center justify-between p-2.5 rounded-lg transition ${
                      user.isCurrentUser 
                        ? 'bg-indigo-600/10 border border-indigo-500/25 text-white font-bold' 
                        : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500 w-5 text-center">#{user.rank}</span>
                      <span className="text-base">{user.avatar}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs truncate max-w-[120px]">{user.name}</div>
                        <div className="text-[9px] text-gray-500">Level {user.level}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400">{user.xp} XP</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-4 mt-4 text-center text-[10px] text-gray-500 flex items-center gap-1.5 justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Leaderboard synchronizes hourly.
              </div>
            </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
}
