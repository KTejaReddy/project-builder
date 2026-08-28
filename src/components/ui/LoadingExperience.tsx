'use client';

import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import GlassCard from './glass-card';
import { GenerationStatus } from '../../types/ai';

interface LoadingExperienceProps {
  status: GenerationStatus;
  activeLog: string;
}

export default function LoadingExperience({ status, activeLog }: LoadingExperienceProps) {
  const completedCount = status.steps.filter(s => s.status === 'completed').length;
  const pct = Math.round((completedCount / status.steps.length) * 100);

  return (
    <GlassCard className="border border-white/5 p-8 max-w-2xl mx-auto font-mono text-xs text-gray-400" hoverEffect={false}>
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
        <span className="text-indigo-400 font-bold flex items-center gap-2">
          {status.isGenerating ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          COMPILING WORKSPACE ENVIRONMENT
        </span>
        <span className="text-gray-500 font-bold">{pct}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {status.steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isRunning = step.status === 'running';
          
          return (
            <div 
              key={step.id} 
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                isCompleted 
                  ? 'bg-green-500/5 border-green-500/10 text-green-400/80' 
                  : isRunning 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-white font-bold' 
                    : 'bg-black/20 border-white/5 text-gray-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : isRunning ? (
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-gray-700 shrink-0" />
              )}
              <span className="truncate text-[10px] uppercase tracking-wider">{idx + 1}. {step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Console Log Output */}
      <div className="bg-black/60 p-4 border border-white/5 rounded-xl min-h-[70px] flex items-start gap-2.5">
        {status.error ? (
          <>
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-red-400 font-bold">{status.error}</span>
          </>
        ) : (
          <>
            <span className="text-indigo-500 animate-pulse shrink-0">&gt;_</span>
            <span className="text-gray-300 leading-relaxed text-[11px]">{activeLog}</span>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 text-gray-500 text-[10px]">
        <Clock className="w-3.5 h-3.5" />
        <span>Deploying configuration scripts directly in the browser sandboxed memory context.</span>
      </div>
    </GlassCard>
  );
}
