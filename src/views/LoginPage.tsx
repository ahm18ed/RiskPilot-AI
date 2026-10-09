import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ENTERPRISE_PERSONAS, ROLE_LABELS, UserRole } from '../types/auth';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Activity,
  Layers,
  FileCheck
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onNavigateToLanding: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignup,
  onNavigateToLanding,
  onLoginSuccess
}) => {
  const { loginWithEmail, loginWithSSO, loginAsPersona, isLoading } = useAuth();

  const [email, setEmail] = useState('elena.vance@aerodynamics.com');
  const [password, setPassword] = useState('Enterprise#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your enterprise work email.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithEmail(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSO = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      setIsSubmitting(true);
      await loginWithSSO('Okta Enterprise SSO');
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'SSO handshake failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonaSelect = async (personaId: string) => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      setIsSubmitting(true);
      await loginAsPersona(personaId);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate persona.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToLanding}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Landing Page</span>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div
            onClick={onNavigateToLanding}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold tracking-tight text-white">RiskPilot</span>
                <span className="text-[9px] font-mono uppercase px-1 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-semibold">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Enterprise Access Gate</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Don't have an enterprise account?
          </span>
          <button
            onClick={onNavigateToSignup}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Hero Brief (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80 p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-[11px] font-mono text-cyan-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                ENTERPRISE WORKSPACE
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug mb-4">
                Autonomous Supplier Risk & Predictive Governance
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Protect multi-million dollar production lines from compounding financial distress, quality holds, and single-source choke points.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Continuous Signal Synthesis</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fuses Altman Z-Score, quality defect rates, and delivery variances before line shutdowns happen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">SOX 404 & AS9100 Rev D Governance</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Role-based approval gates with an immutable append-only audit trail and human-in-the-loop control.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Dual-Engine Reliability</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deterministic mathematical scoring with automated Gemini AI reasoning and instant fallback safety.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Active Scenario: Apex Precision (SUP-001)</span>
                <span className="text-emerald-400 font-semibold">99.98% Uptime</span>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Sign In to RiskPilot AI
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Enter your organization credentials or test drive with an executive persona
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              {/* Alert Feedback */}
              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {infoMsg && (
                <div className="mb-5 p-3 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{infoMsg}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enterprise Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. elena.vance@aerodynamics.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setInfoMsg('For evaluation: Use pre-filled password or select an Executive Persona below.')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Remember workstation session</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">256-bit TLS Encrypted</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-white/5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to RiskPilot</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* SSO Option */}
              <div className="mt-5">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Or enterprise identity
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSSO}
                  disabled={isSubmitting || isLoading}
                  className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>Single Sign-On (Okta / SAML 2.0 / Azure AD)</span>
                </button>
              </div>

              {/* 1-Click Executive Persona Fast-Track */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Evaluator Fast-Track (1-Click Persona Sign-In)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    No password required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ENTERPRISE_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePersonaSelect(p.id)}
                      disabled={isSubmitting || isLoading}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-cyan-500/10 text-slate-200 group-hover:text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-slate-700">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono truncate">
                          {ROLE_LABELS[p.role]?.label || p.role}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {p.department}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Register Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <div>
                Need a new enterprise profile?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Back to product overview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
