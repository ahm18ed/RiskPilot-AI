import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Brain,
  SlidersHorizontal,
  ClipboardList,
  History,
  RotateCcw,
  Sparkles,
  Shield,
  Calendar,
  LogOut,
  UserCheck,
  ChevronDown,
  Globe,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ENTERPRISE_PERSONAS, ROLE_LABELS } from '../types/auth';

export type ActiveTab =
  | 'dashboard'
  | 'investigation'
  | 'ai-assistant'
  | 'simulator'
  | 'actions'
  | 'audit';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSupplier: (supplierId: string) => void;
  onResetData: () => void;
  onOpenLanding: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onOpenAuthModal?: (tab?: 'persona' | 'login' | 'register') => void;
  draftActionsCount: number;
  criticalAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onSelectSupplier,
  onResetData,
  onOpenLanding,
  onNavigateToLogin,
  onNavigateToSignup,
  onOpenAuthModal,
  draftActionsCount,
  criticalAlertsCount
}) => {
  const { user, isAuthenticated, switchPersona, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Subdued Challenge Context Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Demonstration Scenario:</span>
          <span className="text-slate-600">
            Apex Precision Hydraulics (SUP-001) · 6 signals converging on Titanium Valve (CMP-TITAN-X1)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onSelectSupplier('SUP-001');
              setActiveTab('investigation');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Investigate Scenario
          </button>
          <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] border-l border-slate-200 pl-3">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            System Date: Oct 9, 2026
          </div>
        </div>
      </div>

      {/* Brand + utility actions */}
      <div className="w-full px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
          <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-white">
            <Shield className="w-4 h-4 text-slate-100" />
          </div>
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">
                RiskPilot
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">Supplier Risk Intelligence</p>
          </div>
        </div>

        {/* Right Actions: Tour, Reset & User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Landing Page Tour Toggle */}
          <button
            onClick={onOpenLanding}
            title="View Product Overview & Architecture Tour"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">Product Tour</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="Reset dataset back to canonical state"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Data</span>
          </button>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer text-left"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="hidden lg:block leading-none">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
                    {user.title.split('&')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
                  {/* User Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                          ROLE_LABELS[user.role]?.badgeColor || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {ROLE_LABELS[user.role]?.label || user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">{user.organization}</p>
                  </div>

                  {/* Switch Persona Section */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-1 mb-1.5">
                      Switch Role (Judge Evaluation)
                    </div>
                    <div className="space-y-1">
                      {ENTERPRISE_PERSONAS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchPersona(p.id);
                            setUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors cursor-pointer ${
                            user.id === p.id
                              ? 'bg-slate-100 font-semibold text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div>
                            <div className="text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.title.split('&')[0]}</div>
                          </div>
                          {user.id === p.id && (
                            <span className="text-[9px] font-mono text-emerald-600 font-bold">ACTIVE</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="px-2 py-1 border-b border-slate-100 space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenLanding();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Product Overview & Architecture Tour</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToLogin();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sign In to Different Account</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToSignup();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Register New Enterprise Profile</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="px-2 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        onNavigateToLogin();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onNavigateToLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-300" />
                <span>Sign In</span>
              </button>
              <button
                onClick={onNavigateToSignup}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Navigation — full-width row so labels stay on one line */}
      <nav className="flex items-stretch gap-1 overflow-x-auto border-t border-slate-200 px-4 lg:px-6 h-12 text-sm font-medium">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
          Dashboard
          {criticalAlertsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[11px] font-mono font-semibold">
              {criticalAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('investigation')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'investigation'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          Supplier Deep Dive
        </button>

        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'ai-assistant'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain className="w-4 h-4 text-slate-400 shrink-0" />
          AI Assistant
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          Decision Simulator
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
          Action Center
          {draftActionsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-mono">
              {draftActionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`shrink-0 flex flex-row items-center gap-2 border-b-2 px-4 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-slate-400 shrink-0" />
          Audit Trail
        </button>
      </nav>
    </header>
  );
};
