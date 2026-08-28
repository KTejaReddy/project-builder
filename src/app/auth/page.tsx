'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Globe, Mail, ShieldAlert, Sparkles, User, Key, Eye, EyeOff } from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectProject = searchParams.get('project');

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    } else if (searchParams.get('mode') === 'guest') {
      handleGuestLogin();
    }
  }, [searchParams]);

  const handleGuestLogin = () => {
    setLoading(true);
    const mockProfile = {
      name: 'Guest Developer',
      email: 'guest@projectforge.ai',
      xp: 350,
      level: 1,
      streak: 3,
      completedProjectsCount: 0,
      badges: ['First Step', 'Innovator'],
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
    localStorage.setItem('user_profile', JSON.stringify(mockProfile));

    if (redirectProject) {
      router.push(`/create?template=${redirectProject}`);
    } else {
      router.push('/dashboard');
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-800' };
    if (pass.length < 5) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (pass.length < 8) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    if (hasSpecial && hasNum) return { score: 4, label: 'Very Strong', color: 'bg-green-500' };
    return { score: 3, label: 'Strong', color: 'bg-yellow-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || (mode !== 'forgot' && !password)) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (mode === 'forgot') {
        setLoading(false);
        setSuccessMsg('Reset instruction link dispatched successfully! Check inbox logs.');
        return;
      }

      const mockProfile = {
        name: name || email.split('@')[0],
        email: email,
        xp: 350,
        level: 1,
        streak: 1,
        completedProjectsCount: 0,
        badges: ['Early Adopter'],
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
      localStorage.setItem('user_profile', JSON.stringify(mockProfile));
      
      setLoading(false);
      if (redirectProject) {
        router.push(`/create?template=${redirectProject}`);
      } else {
        router.push('/dashboard');
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-900/5 blur-[120px] pointer-events-none" />

      {/* App Brand Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group z-10">
        <div className="bg-indigo-600 p-2 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-wider text-white">
          ProjectForge <span className="text-indigo-500">AI</span>
        </span>
      </Link>

      <GlassCard className="w-full max-w-md border border-white/5 shadow-2xl relative z-10 p-8" hoverEffect={false}>
        {mode === 'login' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-xs mb-6">Continue engineering your dreams step-by-step.</p>
          </div>
        )}
        {mode === 'signup' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 text-xs mb-6">Initialize your learning path with ProjectForge.</p>
          </div>
        )}
        {mode === 'forgot' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
            <p className="text-gray-400 text-xs mb-6">Enter your email address to retrieve access details.</p>
          </div>
        )}

        {/* Success / Status Notification */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 text-left">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 text-left">Full Name</label>
              <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 focus-within:border-indigo-500/55 transition text-left">
                <User className="w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="bg-transparent outline-none w-full text-xs text-white" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 text-left">Email Address</label>
            <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 focus-within:border-indigo-500/55 transition text-left">
              <Mail className="w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.com" 
                className="bg-transparent outline-none w-full text-xs text-white" 
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-left">
                  <label className="block text-xs font-semibold text-gray-400">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')} 
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 focus-within:border-indigo-500/55 transition relative text-left">
                  <Key className="w-4 h-4 text-gray-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="bg-transparent outline-none w-full text-xs text-white pr-8" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter segment */}
                {mode === 'signup' && password && (
                  <div className="space-y-1 mt-2 text-left">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-500">Security Indicator:</span>
                      <span className={strength.score === 1 ? 'text-red-400' : strength.score === 2 ? 'text-orange-400' : strength.score === 3 ? 'text-yellow-400' : 'text-green-400'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-black/45 rounded overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: `${strength.score * 25}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 text-left">Confirm Password</label>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 focus-within:border-indigo-500/55 transition text-left">
                    <Key className="w-4 h-4 text-gray-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="bg-transparent outline-none w-full text-xs text-white" 
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center gap-2 text-left">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-indigo-650 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] text-gray-400 cursor-pointer select-none">Remember this active session credentials</label>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-lg shadow-lg hover:shadow-indigo-650/15 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <hr className="border-white/5" />
          <span className="bg-[#111827] px-3 text-[10px] text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-medium">
            OR CONTINUE WITH
          </span>
        </div>

        {/* Social logins */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={handleGuestLogin}
            className="bg-black/40 hover:bg-black/60 border border-white/10 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Google SSO
          </button>
          <button 
            onClick={handleGuestLogin}
            className="bg-black/40 hover:bg-black/60 border border-white/10 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            GitHub SSO
          </button>
        </div>

        <button 
          onClick={handleGuestLogin}
          className="text-[10px] text-gray-500 hover:text-white font-mono block mx-auto mb-4"
        >
          ⚡ Enter workspace as Guest Developer
        </button>

        {/* Auth Mode Toggle */}
        <div className="text-center text-xs text-gray-400">
          {mode === 'login' ? (
            <span>New to ProjectForge? <button onClick={() => setMode('signup')} className="text-indigo-400 hover:underline">Create Account</button></span>
          ) : mode === 'signup' ? (
            <span>Already have an account? <button onClick={() => setMode('login')} className="text-indigo-400 hover:underline">Sign In</button></span>
          ) : (
            <button onClick={() => setMode('login')} className="text-indigo-400 hover:underline">Return to Login</button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
