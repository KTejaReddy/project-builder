'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  ArrowLeft, 
  User, 
  Calendar, 
  Flame, 
  Trophy, 
  Award, 
  BookOpen, 
  Bookmark, 
  FileText, 
  Cpu 
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import { dbService, UserProfile, ActivityLog } from '@/utils/supabase/service';
import { Bookmark as BookmarkType } from '@/types/ai';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const prof = await dbService.getProfile();
        setProfile(prof);
        const logs = await dbService.getActivityLogs();
        setActivities(logs);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center py-12 text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        <div className="text-xs text-gray-400 font-mono animate-pulse">Retrieving user profile and activity credentials...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] p-6 md:p-12 relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-indigo-900/5 blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-10 z-10 relative">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-sm text-gray-400">
          ProjectForge <span className="text-indigo-500">AI</span>
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Profile Card Header */}
        <GlassCard hoverEffect={false} className="border border-white/5 p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-3xl shrink-0 shadow-lg">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide w-fit">
                Level {profile.level} Developer
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-xl">{profile.bio || "No profile biography defined yet."}</p>
            
            <div className="flex gap-4 items-center text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> {profile.email}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-400" /> Joined {profile.joinedDate}</span>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {/* Streak */}
            <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 mx-auto" />
              <div className="text-xs font-bold text-white mt-1">{profile.streak} Day Streak</div>
            </div>
            {/* XP */}
            <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl text-center">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500 mx-auto" />
              <div className="text-xs font-bold text-white mt-1">{profile.xp} XP</div>
            </div>
          </div>
        </GlassCard>

        {/* Profile Split layout info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Badges & Certificates */}
          <div className="md:col-span-1 space-y-6">
            <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Earned Badges
              </h3>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.badges.map((badge, idx) => (
                  <span 
                    key={idx} 
                    className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-3 py-1 rounded-xl font-bold uppercase tracking-wider"
                  >
                    🏆 {badge}
                  </span>
                ))}
              </div>
            </GlassCard>

            <GlassCard hoverEffect={false} className="border border-white/5 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-400" /> Career Milestones
              </h3>
              
              <div className="space-y-3 pt-2 text-xs">
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                  <div className="font-bold text-white">Full-Stack Architect Entry</div>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">Completed 1st modular project stack architecture review blueprint.</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Chronological Activities Feed */}
          <div className="md:col-span-2">
            <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Activity Log Feed
              </h3>
              
              {activities.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <div className="bg-indigo-650/20 p-2 rounded-lg text-indigo-400 shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="text-xs font-bold text-white flex justify-between">
                          <span>
                            {act.actionType === 'profile_updated' && '👤 Profile Settings Changed'}
                            {act.actionType === 'project_deleted' && '🗑️ Project Deleted'}
                            {act.actionType === 'version_created' && '📁 Project Version Snapshot Taken'}
                            {!['profile_updated', 'project_deleted', 'version_created'].includes(act.actionType) && act.actionType}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono font-normal">
                            {new Date(act.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {act.metadata?.fields && `Fields edited: ${act.metadata.fields.join(', ')}`}
                          {act.metadata?.projectId && `ID: ${act.metadata.projectId}`}
                          {act.metadata?.versionNumber && `Snapshot version: #${act.metadata.versionNumber}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-gray-500">
                  No active session activity logs recorded. Launch templates to trigger audits!
                </div>
              )}
            </GlassCard>
          </div>

        </div>

      </main>
    </div>
  );
}
