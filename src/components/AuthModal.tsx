import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ENTERPRISE_PERSONAS, ROLE_LABELS, UserRole } from '../types/auth';
import {
  X,
  Shield,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Briefcase,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'persona' | 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'persona',
  onSuccess
}) => {
  const { loginAsPersona, loginWithEmail, loginWithSSO, registerUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'persona' | 'login' | 'register'>(defaultTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('elena.vance@aerodynamics.com');
  const [loginPassword, setLoginPassword] = useState('Enterprise#2026');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOrg, setRegOrg] = useState('AeroDynamics Global Corp');
  const [regDept, setRegDept] = useState('Strategic Sourcing');
  const [regRole, setRegRole] = useState<UserRole>('CHIEF_PROCUREMENT_OFFICER');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePersonaSelect = async (personaId: string) => {
    setErrorMsg(null);
    try {
      await loginAsPersona(personaId);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter an enterprise email address.');
      return;
    }
    try {
      await loginWithEmail(loginEmail, loginPassword);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleSSOLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithSSO('Okta Enterprise SSO');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'SSO handshake failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName.trim() || !regEmail.trim() || !regOrg.trim()) {
      setErrorMsg('Please fill in all required enterprise fields.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    try {
      await registerUser({
        name: regName,
        email: regEmail,
        role: regRole,
        organization: regOrg,
        department: regDept,
        password: regPassword
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">RiskPilot AI</h3>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-white/15 text-slate-200 rounded font-semibold">
                  Secure Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise Multi-Signal Sourcing & Risk Governance Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('persona');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'persona'
                ? 'border-slate-900 text-slate-900 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Personas</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
              Judge Quick Demo
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-slate-900 text-slate-900 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Enterprise Sign In</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'border-slate-900 text-slate-900 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Register Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: 1-Click Persona Demo */}
        {activeTab === 'persona' && (
          <div className="p-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Select an Enterprise Persona for Instant Evaluation
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Each persona experiences tailored access levels, dual-approval controls, and role-specific views.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {ENTERPRISE_PERSONAS.map(persona => {
                const roleMeta = ROLE_LABELS[persona.role];
                return (
                  <div
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona.id)}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${roleMeta.badgeColor}`}
                        >
                          {roleMeta.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 group-hover:text-slate-900">
                        {persona.name}
                      </h5>
                      <p className="text-xs text-slate-600 font-medium leading-tight mt-0.5">
                        {persona.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {persona.bio}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 truncate max-w-[170px]">
                        {persona.email}
                      </span>
                      <span className="text-slate-900 font-semibold group-hover:underline flex items-center gap-1">
                        Select Role
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Persistent session saved in local storage · No password required
              </span>
              <button
                onClick={handleSSOLogin}
                className="text-slate-700 hover:text-slate-950 font-medium hover:underline cursor-pointer"
              >
                Or simulate Okta SSO
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Standard Enterprise Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleEmailLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enterprise Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. elena.vance@aerodynamics.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 hover:underline cursor-pointer">
                  Forgot credentials?
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                Remember this device for 30 days
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                AS9100 / SOX compliant
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>{isLoading ? 'Verifying Session...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink mx-2 text-[10px] uppercase font-mono text-slate-400">
                  Or Single Sign-On
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleSSOLogin}
                disabled={isLoading}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Sign in with Enterprise SSO (Okta / SAML 2.0)</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Register Account */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 space-y-3.5 max-h-[460px] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. David Sterling"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="d.sterling@defensecorp.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Company *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regOrg}
                    onChange={e => setRegOrg(e.target.value)}
                    placeholder="e.g. AeroDynamics Global Corp"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={regDept}
                    onChange={e => setRegDept(e.target.value)}
                    placeholder="e.g. Strategic Procurement"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designated Enterprise Role *
              </label>
              <select
                value={regRole}
                onChange={e => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="CHIEF_PROCUREMENT_OFFICER">
                  Chief Procurement Officer (Full Executive Sign-Off Authority)
                </option>
                <option value="SOURCING_SPECIALIST">
                  Lead Sourcing Specialist (Trade-off Modeling & RFQs)
                </option>
                <option value="QUALITY_DIRECTOR">
                  Director of QA & AS9100 (Defect Lots & Quarantine Holds)
                </option>
                <option value="SOX_AUDITOR">
                  Internal SOX / ISO Auditor (Audit Trail Verification)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white font-mono"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5 items-center">
                <div
                  className={`h-1 flex-1 rounded-full ${
                    regPassword.length > 0 ? (regPassword.length >= 8 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'
                  }`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${
                    regPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                ></div>
                <div
                  className={`h-1 flex-1 rounded-full ${
                    regPassword.length >= 12 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                ></div>
                <span className="text-[10px] text-slate-400 font-mono ml-1">
                  {regPassword.length >= 8 ? 'Strong' : 'Min 6 chars'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Launch Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center text-[11px] text-slate-500">
          RiskPilot AI Enterprise Security · 256-bit TLS Encryption · SOX Section 404 Compliant
        </div>
      </div>
    </div>
  );
};
