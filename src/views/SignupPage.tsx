import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, UserRole } from '../types/auth';
import {
  Shield,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  FileCheck,
  Check
} from 'lucide-react';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onNavigateToLanding: () => void;
  onSignupSuccess: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onNavigateToLogin,
  onNavigateToLanding,
  onSignupSuccess
}) => {
  const { registerUser, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('AeroDynamics Global Corp');
  const [department, setDepartment] = useState('Strategic Sourcing & Category Management');
  const [role, setRole] = useState<UserRole>('CHIEF_PROCUREMENT_OFFICER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'AS9100 Compliant'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid enterprise work email.');
      return;
    }
    if (!organization.trim()) {
      setErrorMsg('Please specify your enterprise or organization name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to the AS9100 / SOX audit accountability terms.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({
        name,
        email,
        role,
        organization,
        department,
        password
      });
      onSignupSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create enterprise account.');
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
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Account Provisioning</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Already have an enterprise account?
          </span>
          <button
            onClick={onNavigateToLogin}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
          
          {/* Left Hero Brief (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/80 p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden self-stretch">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-[11px] font-mono text-emerald-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ENTERPRISE ONBOARDING
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug mb-4">
                Empower Your Supply Chain with Governed AI
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Join forward-thinking aerospace, defense, and industrial manufacturers preventing line-down crises through predictive risk mitigation.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Role-Specific Workspaces</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Segregated controls customized for CPOs, Sourcing Leads, Quality Directors, and SOX Auditors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Full Audit Attribution</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Every action approval, decision simulation, and risk override is stamped with your executive name and timestamp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Pre-Configured Live Dataset</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Instant access to test multi-tier supplier disruptions including the Apex Precision Hydraulics scenario.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                <span className="text-white font-semibold">AS9100 Rev D & SOX 404 Compliant</span> · Enterprise Single Sign-On Ready
              </div>
            </div>
          </div>

          {/* Right Signup Card */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Create Enterprise Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Provision your risk intelligence profile and operational role
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Error Feedback */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Vance"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. e.vance@aerodynamics.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Organization and Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enterprise / Organization <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. AeroDynamics Global Corp"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Department / Division
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Strategic Sourcing"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Enterprise Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Functional Governance Role <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      roleKey: 'CHIEF_PROCUREMENT_OFFICER' as UserRole,
                      title: 'Chief Procurement Officer',
                      desc: 'Full approval authority, executive overrides & SOX sign-off',
                      badge: 'Executive Level'
                    },
                    {
                      roleKey: 'SOURCING_SPECIALIST' as UserRole,
                      title: 'Sourcing Specialist',
                      desc: 'Decision simulations, RFQ drafting & dual-source analysis',
                      badge: 'Operational'
                    },
                    {
                      roleKey: 'QUALITY_DIRECTOR' as UserRole,
                      title: 'Quality Director',
                      desc: 'Defect containment, AS9100 quality holds & quarantine',
                      badge: 'QA / Compliance'
                    },
                    {
                      roleKey: 'SOX_AUDITOR' as UserRole,
                      title: 'SOX / Internal Auditor',
                      desc: 'Read-only immutable audit trail review & compliance logs',
                      badge: 'Independent Audit'
                    }
                  ].map((item) => (
                    <button
                      key={item.roleKey}
                      type="button"
                      onClick={() => setRole(item.roleKey)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        role === item.roleKey
                          ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{item.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-slate-200">
                      {strengthLabels[Math.min(strength, 3)]}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full ${
                          lvl <= strength ? strengthColors[strength] : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>
                    I confirm my operational responsibility and agree to{' '}
                    <strong className="text-slate-200 font-semibold">SOX 404 segregation of duties</strong> and{' '}
                    <strong className="text-slate-200 font-semibold">AS9100 Rev D audit traceability</strong>.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Enterprise Account & Launch Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <div>
                Already have an enterprise account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Sign in here
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
