'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  ArrowLeft, 
  Settings, 
  Sliders, 
  Bell, 
  Cpu, 
  Trash2, 
  Save, 
  Sun, 
  Moon, 
  Keyboard,
  Key,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Info,
  Database
} from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';
import { useProjects } from '@/context/ProjectContext';
import { dbService } from '@/utils/supabase/service';

export default function SettingsPage() {
  const router = useRouter();
  const { saveApiKeys } = useProjects();

  // Settings states
  const [profileName, setProfileName] = useState('Guest Developer');
  const [profileEmail, setProfileEmail] = useState('guest@projectforge.ai');
  const [profileBio, setProfileBio] = useState('');
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [fontSize, setFontSize] = useState(12);
  const [tabSize, setTabSize] = useState(2);

  // Ollama configuration states
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [activeModel, setActiveModel] = useState('llama3.2');
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Inference tuning states
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [contextLength, setContextLength] = useState(2048);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [streaming, setStreaming] = useState(true);
  const [keepAlive, setKeepAlive] = useState('5m');

  // Load everything on startup
  useEffect(() => {
    // Load active settings profile
    dbService.getProfile().then(prof => {
      setProfileName(prof.name);
      setProfileEmail(prof.email);
      setProfileBio(prof.bio || '');
    });

    // Load configs from local storage
    const savedUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434';
    const savedModel = localStorage.getItem('ollama_model') || 'llama3.2';
    const savedTemp = Number(localStorage.getItem('ollama_temperature') || '0.7');
    const savedTopP = Number(localStorage.getItem('ollama_top_p') || '0.9');
    const savedCtx = Number(localStorage.getItem('ollama_context_length') || '2048');
    const savedMax = Number(localStorage.getItem('ollama_max_tokens') || '2048');
    const savedStream = localStorage.getItem('ollama_streaming') !== 'false';
    const savedKeepAlive = localStorage.getItem('ollama_keep_alive') || '5m';

    setOllamaUrl(savedUrl);
    setActiveModel(savedModel);
    setTemperature(savedTemp);
    setTopP(savedTopP);
    setContextLength(savedCtx);
    setMaxTokens(savedMax);
    setStreaming(savedStream);
    setKeepAlive(savedKeepAlive);

    // Initial check for models
    fetchModelsList(savedUrl, savedModel).catch(() => {});
  }, []);

  const fetchModelsList = async (targetUrl: string, currentActive = activeModel) => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tags', endpoint: targetUrl })
      });
      if (!response.ok) {
        throw new Error('Connection refused');
      }
      const data = await response.json();
      const list = data.models || [];
      setModels(list);

      // If active model is not in list, auto select the first available
      if (list.length > 0) {
        const found = list.some((m: any) => m.name === currentActive || m.model === currentActive);
        if (!found) {
          const firstModelName = list[0].name || list[0].model;
          setActiveModel(firstModelName);
          localStorage.setItem('ollama_model', firstModelName);
        }
      }
      return list;
    } catch (e) {
      console.error('Failed to query local models:', e);
      setModels([]);
      throw e;
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Attempting handshake with Ollama server...');
    try {
      const list = await fetchModelsList(ollamaUrl);
      setTestStatus('success');
      setTestMessage(`Successfully connected! Found ${list.length} local model(s) installed.`);
    } catch (e) {
      setTestStatus('failed');
      setTestMessage('Could not reach Ollama. Check if the local server process is active on this endpoint.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save updated profile via service
    await dbService.updateProfile({
      name: profileName,
      email: profileEmail,
      bio: profileBio
    });

    // Save Ollama parameters
    localStorage.setItem('ollama_url', ollamaUrl);
    localStorage.setItem('ollama_model', activeModel);
    localStorage.setItem('ollama_temperature', temperature.toString());
    localStorage.setItem('ollama_top_p', topP.toString());
    localStorage.setItem('ollama_context_length', contextLength.toString());
    localStorage.setItem('ollama_max_tokens', maxTokens.toString());
    localStorage.setItem('ollama_streaming', streaming.toString());
    localStorage.setItem('ollama_keep_alive', keepAlive);

    // Call saveApiKeys in context to update the workspace configurations
    saveApiKeys({
      'ollama_url': ollamaUrl
    });

    alert('Local Ollama AI configurations saved successfully!');
  };

  const handleHardReset = () => {
    const doubleCheck = confirm('⚠️ Warning: This will delete ALL ongoing projects and reset your XP level stand. Are you sure you want to proceed?');
    if (doubleCheck) {
      localStorage.clear();
      alert('Local workspace databases wiped. Redirecting to initialization auth...');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f8fafc] p-6 md:p-12 relative overflow-hidden">
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
      <main className="max-w-4xl mx-auto space-y-8 relative z-10 font-sans">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-indigo-400" /> Account Settings
          </h1>
          <p className="text-xs text-gray-450 mt-1">Configure your editor interface options, profile preferences, and local Ollama model parameters.</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Profile & Ollama Endpoint */}
            <div className="space-y-6">
              
              {/* Profile Information */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  👤 Profile Information
                </h3>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Profile Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Profile Biography</label>
                  <textarea 
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    rows={2}
                    placeholder="Short bio description..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500 transition leading-relaxed"
                  />
                </div>
              </GlassCard>

              {/* Local Ollama Endpoint Config */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Database className="w-4 h-4 text-indigo-400" /> Ollama Local Engine
                </h3>
                <p className="text-[10px] text-gray-500">Configure connection details for your local offline model server.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Ollama Connection Endpoint URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="http://localhost:11434"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        className="flex-1 bg-black/45 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        className="bg-indigo-650 hover:bg-indigo-650/80 border border-indigo-500/20 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition text-white"
                      >
                        {testStatus === 'testing' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : 'Test Connection'}
                      </button>
                    </div>
                  </div>

                  {testStatus !== 'idle' && (
                    <div className={`p-3 rounded-lg text-xs flex gap-2 items-start ${
                      testStatus === 'success' ? 'bg-green-950/20 border border-green-500/20 text-green-400' : 'bg-red-950/20 border border-red-500/20 text-red-400'
                    }`}>
                      {testStatus === 'success' ? (
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold">{testStatus === 'success' ? 'Connection Active' : 'Connection Failed'}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{testMessage}</div>
                      </div>
                    </div>
                  )}

                  <div className="bg-black/35 rounded-lg border border-white/5 p-3 flex gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-[9px] text-gray-500 leading-relaxed">
                      To utilize local AI, ensure that Ollama is running on your machine. You can verify it by executing <code className="bg-white/5 px-1 py-0.5 rounded text-white">ollama run llama3.2</code> or checking your task tray indicator.
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Theme Settings */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  🎨 Appearance Theme
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      theme === 'dark' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                        : 'bg-black/20 border-white/5 text-gray-500'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Light mode: Coming soon! Let's stick with our high-fidelity premium dark theme for now.")}
                    className="p-3 rounded-lg border border-white/5 text-xs text-gray-600 flex items-center justify-center gap-2 cursor-not-allowed bg-black/5 opacity-55"
                  >
                    <Sun className="w-4 h-4 text-gray-650" /> Light Mode
                  </button>
                </div>
              </GlassCard>
            </div>

            {/* Right Column: Editor Prefs & Model Settings & Manager */}
            <div className="space-y-6">
              
              {/* Editor Preferences */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Keyboard className="w-4 h-4 text-purple-400" /> Editor Configurations
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Editor Font Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                    >
                      <option value={10}>10px</option>
                      <option value={12}>12px (Default)</option>
                      <option value={14}>14px</option>
                      <option value={16}>16px</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Tab Indentation</label>
                    <select
                      value={tabSize}
                      onChange={(e) => setTabSize(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                    >
                      <option value={2}>2 Spaces</option>
                      <option value={4}>4 Spaces</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-black/20 p-2.5 rounded-lg border border-white/5 mt-2">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="accent-indigo-650 rounded"
                  />
                  <div>
                    <div className="text-xs text-white font-bold">Auto Save Files</div>
                    <div className="text-[9px] text-gray-500">Enable automatic compilation triggers in workspace.</div>
                  </div>
                </label>
              </GlassCard>

              {/* Local Ollama Model Manager and Advanced Parameters */}
              <GlassCard hoverEffect={false} className="border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-green-400" /> Model Configuration & Parameters
                </h3>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Active Inference Model</label>
                  <div className="flex gap-2">
                    <select
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                    >
                      {models.length > 0 ? (
                        models.map((m) => (
                          <option key={m.name || m.model} value={m.name || m.model}>
                            {m.name || m.model} ({m.details?.parameter_size || 'N/A'})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="llama3.2">llama3.2 (Default)</option>
                          <option value="deepseek-r1:7b">deepseek-r1:7b</option>
                          <option value="qwen2.5-coder">qwen2.5-coder</option>
                          <option value="gemma">gemma</option>
                          <option value="phi3">phi3</option>
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => fetchModelsList(ollamaUrl)}
                      className="bg-black/40 border border-white/10 hover:border-indigo-500 text-gray-300 hover:text-white p-2 rounded-lg transition"
                      title="Refresh models list"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingModels ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Installed Models list (Model Manager Table) */}
                <div className="space-y-2 mt-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Installed Models Manager</div>
                  {models.length > 0 ? (
                    <div className="border border-white/5 rounded-lg overflow-hidden bg-black/25 max-h-[140px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/5 text-[9px] text-gray-500 uppercase">
                            <th className="p-2">Model</th>
                            <th className="p-2">Size</th>
                            <th className="p-2">Family</th>
                            <th className="p-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {models.map((m) => {
                            const modelName = m.name || m.model;
                            const isActive = activeModel === modelName;
                            const sizeGB = (m.size / (1024 * 1024 * 1024)).toFixed(2);
                            return (
                              <tr key={modelName} className={`border-b border-white/5 hover:bg-white/5 last:border-none ${isActive ? 'bg-indigo-950/20' : ''}`}>
                                <td className="p-2 font-mono truncate max-w-[120px]" title={modelName}>{modelName}</td>
                                <td className="p-2 text-gray-400">{sizeGB} GB</td>
                                <td className="p-2 text-gray-400">{m.details?.family || 'GGUF'}</td>
                                <td className="p-2 text-right">
                                  {isActive ? (
                                    <span className="text-[9px] text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveModel(modelName)}
                                      className="text-[9px] text-indigo-400 hover:text-white font-bold bg-indigo-500/5 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded transition"
                                    >
                                      Use
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 italic p-3 border border-white/5 rounded-lg bg-black/15">
                      No local models detected. Click the refresh button to query Ollama.
                    </div>
                  )}
                </div>

                {/* Memory usage placeholder */}
                <div className="text-[9px] text-gray-500 bg-white/5 p-2 rounded-lg flex items-center justify-between border border-white/5">
                  <span>SYSTEM RAM ALLOCATION</span>
                  <span className="font-mono text-gray-400 font-bold">~4.5 GB / VRAM: Dynamic</span>
                </div>

                {/* Advanced inference configurations */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Advanced Inference Settings</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-1">Temperature ({temperature})</label>
                      <input 
                        type="range" 
                        min="0.0" 
                        max="1.5" 
                        step="0.1" 
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-1">Top P ({topP})</label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.05" 
                        value={topP}
                        onChange={(e) => setTopP(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-1">Context Length</label>
                      <input 
                        type="number" 
                        value={contextLength}
                        onChange={(e) => setContextLength(Number(e.target.value))}
                        className="w-full bg-black/45 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-1">Max Predictions</label>
                      <input 
                        type="number" 
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="w-full bg-black/45 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-1">Keep Alive Duration</label>
                      <input 
                        type="text" 
                        placeholder="5m"
                        value={keepAlive}
                        onChange={(e) => setKeepAlive(e.target.value)}
                        className="w-full bg-black/45 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-black/25 p-2 rounded-lg border border-white/5 mt-3 select-none">
                      <input
                        type="checkbox"
                        checked={streaming}
                        onChange={(e) => setStreaming(e.target.checked)}
                        className="accent-indigo-500"
                      />
                      <span className="text-[10px] text-white font-bold">Stream Response</span>
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-black/20 p-2.5 rounded-lg border border-white/5 mt-2">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="accent-indigo-650 rounded"
                  />
                  <div>
                    <div className="text-xs text-white font-bold">Streak Reminders</div>
                    <div className="text-[9px] text-gray-500">Send push reminders when daily streak is expiring.</div>
                  </div>
                </label>
              </GlassCard>

            </div>

          </div>

          {/* Action buttons bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-6">
            <button
              type="button"
              onClick={handleHardReset}
              className="bg-red-950/20 hover:bg-red-900 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-xs font-semibold py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" /> Reset Database Profile
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-8 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-650/15"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
