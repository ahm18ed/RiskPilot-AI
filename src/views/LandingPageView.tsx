import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ENTERPRISE_PERSONAS, ROLE_LABELS } from '../types/auth';
import {
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Activity,
  Sliders,
  FileCheck,
  History,
  Lock,
  ChevronDown,
  Building,
  UserCheck,
  Zap,
  Layers,
  ArrowUpRight,
  Database,
  Cpu,
  RefreshCw,
  Scale
} from 'lucide-react';

interface LandingPageViewProps {
  onEnterWorkspace: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onOpenAuthModal?: (tab?: 'persona' | 'login' | 'register') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterWorkspace,
  onNavigateToLogin,
  onNavigateToSignup,
  onOpenAuthModal
}) => {
  const { user, isAuthenticated } = useAuth();

  // ROI Calculator interactive state
  const [annualSpend, setAnnualSpend] = useState<number>(120); // in Millions USD
  const [tier1Suppliers, setTier1Suppliers] = useState<number>(85);
  const [singleSourcePct, setSingleSourcePct] = useState<number>(28); // %

  // Calculated ROI values
  const estimatedDowntimeExposure = Math.round(annualSpend * 0.045 * (singleSourcePct / 25) * 10) / 10;
  const projectedSavings = Math.round(estimatedDowntimeExposure * 0.72 * 10) / 10;
  const paybackMonths = Math.max(1.2, Math.round((280000 / (projectedSavings * 1000000)) * 12 * 10) / 10);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive demo tab
  const [activeFeatureTab, setActiveFeatureTab] = useState<'fusion' | 'simulator' | 'governance' | 'audit'>('fusion');

  const faqs = [
    {
      q: 'How does RiskPilot AI safeguard against LLM hallucinations or inference timeouts?',
      a: 'RiskPilot AI employs a hybrid dual-engine architecture: all risk indices, price variance formulas, lead-time standard deviations, and Monte Carlo scenarios run on a deterministic, sub-second operations engine. The Gemini AI reasoning agent synthesizes multi-signal executive narratives and drafts action items. If an inference timeout occurs, the system automatically falls back to deterministic rule synthesis without operational disruption.'
    },
    {
      q: 'Can the AI autonomously submit binding purchase orders or cancel contracts without humans?',
      a: 'Never. RiskPilot AI adheres to strict Human-in-the-Loop (HITL) governance compliant with SOX 404 and ISO 9001. The AI autonomously detects anomalies, calculates financial trade-offs, and drafts proposed interventions (e.g., dual-sourcing RFQs, temporary holds, expedited audits). Every action requires explicit review, sign-off comments, and approval by authorized procurement executives.'
    },
    {
      q: 'Which ERP, MRP, and Quality Management systems are supported?',
      a: 'RiskPilot AI is designed to integrate with SAP S/4HANA, Oracle ERP Cloud, NetSuite, Coupa, Infor LN, and AS9100 QMS platforms via bidirectional REST APIs, webhook pipelines, and EDI 850/855 purchase order message standards.'
    },
    {
      q: 'What is the Demonstration Scenario preloaded in the live workspace?',
      a: 'The workspace comes preloaded with Apex Precision Hydraulics (SUP-001) as a live stress test. It demonstrates 6 converging risks on a critical titanium valve (CMP-TITAN-X1): 18-day delivery delays, 11.2% quality defect spike, 14.2% unilateral price escalation, and ISO 9001 audit expiration. You can simulate second-sourcing trade-offs and execute governed mitigation in real time.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-slate-700 selection:text-white">
      {/* Main Landing Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">RiskPilot</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-semibold">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Autonomous Supplier Risk Engine</p>
            </div>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#overview" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#scenario" className="hover:text-white transition-colors">
              Live Scenario
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#roi-calculator" className="hover:text-white transition-colors">
              ROI Estimator
            </a>
            <a href="#personas" className="hover:text-white transition-colors">
              Enterprise Personas
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{user.role}</div>
                </div>
                <button
                  onClick={onEnterWorkspace}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToLogin}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onNavigateToSignup}
                  className="px-3.5 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Create Account
                </button>
                <button
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('persona') : onNavigateToLogin()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hidden lg:flex"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Personas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden bg-radial from-slate-800/40 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Enterprise Release 2.4 · Autonomous Procurement & Risk Fusion</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Stop Multi-Million Dollar Supply Halts Before Lines Freeze.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            In aerospace, defense, and high-tech manufacturing, catastrophic supply failures happen because ERP, Quality, and Pricing signals are siloed.
            <strong className="text-white font-semibold"> RiskPilot AI </strong> unifies these signals into autonomous risk reasoning, mathematical decision simulations, and governed dual-approval workflows.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  onEnterWorkspace();
                } else {
                  onNavigateToLogin();
                }
              }}
              className="px-6 py-3.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-white/5 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? 'Launch Workspace' : 'Sign In to Access Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToLogin()}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-slate-300" />
              <span>Sign In / Select Role</span>
            </button>

            <a
              href="#scenario"
              className="px-4 py-3.5 text-slate-400 hover:text-slate-200 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Explore Scenario SUP-001</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border border-slate-800 bg-slate-950/70 p-6 rounded-2xl backdrop-blur-xs">
            <div className="p-2 border-r border-slate-800/80 last:border-none">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">$4.2M</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Avg. Line-Stop Loss Prevented</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Per critical assembly anomaly</div>
            </div>

            <div className="p-2 border-r border-slate-800/80 last:border-none">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">6 Signals</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Multi-Signal Convergence</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ERP, POs, QA, Specs & ISO</div>
            </div>

            <div className="p-2 border-r border-slate-800/80 last:border-none">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">84%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Faster Mitigation Turnaround</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Dual-sourcing RFQ in minutes</div>
            </div>

            <div className="p-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">SOX 404 Governed Approvals</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Human sign-off enforced</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demonstration Scenario Breakdown */}
      <section id="scenario" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 rounded font-semibold">
              Live Canonical Test Case
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-4 tracking-tight">
              Apex Precision Hydraulics (SUP-001)
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              This built-in challenge illustrates how separate, moderate ERP deviations compound into a critical assembly line shutdown on CMP-TITAN-X1.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: The Siloed Signals */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">1. Siloed ERP & QA Signals</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">ERP PO Delays (+18 Days)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      PO-2026-0881 scheduled for assembly Oct 12 is delayed past minimum safety stock window.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Quality Lot Spikes (11.2% Defects)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Inspection Lot INSP-904 failed micro-tolerance pressure tests; baseline was 3.5%.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Price Deviation (+14.2%)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Unilateral invoice surcharge of $142.00/unit exceeding Master Services Agreement caps.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">ISO 9001 Expiration Warning</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Certification expires in 21 days; supplier unresponsive to audit schedule.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Individual systems report LOW/MEDIUM alarms.
              </div>
            </div>

            {/* Column 2: RiskPilot AI Convergence */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">2. AI Synthesis & Simulation</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-purple-950/20 border border-purple-800/60 rounded text-purple-200">
                    <div className="flex items-center justify-between font-bold text-purple-300">
                      <span>Compounding Risk Index</span>
                      <span className="font-mono text-xs bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">
                        88/100 · CRITICAL
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/80 mt-1.5 leading-relaxed">
                      AI determines CMP-TITAN-X1 is a Criticality-A single-source valve for propulsion turbines. Factory line faces shutdown on Day 14.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Monte Carlo Simulation Matrix</div>
                    <ul className="text-slate-400 text-[11px] space-y-1.5 mt-2">
                      <li className="flex justify-between">
                        <span>Status Quo:</span>
                        <span className="text-red-400 font-mono">82% Stockout Risk / $3.4M Loss</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Dual-Source Expedite:</span>
                        <span className="text-emerald-400 font-mono">11% Stockout Risk / +$38K Cost</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Temporary PO Hold:</span>
                        <span className="text-amber-400 font-mono">Enforces Audit & Price Freeze</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-300 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini AI drafts structured dual-source RFQ package.
              </div>
            </div>

            {/* Column 3: Governed Resolution */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">3. Governed Action Execution</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Action Center Queue</div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Action draft <span className="font-mono text-white">ACT-001</span> generated: "Expedited Second-Source Qualification for CMP-TITAN-X1 with Delta Hydraulics".
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Human-in-the-Loop Sign-Off</div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Procurement Manager or CPO reviews trade-off numbers, enters mandatory review comment, and signs off.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <div className="font-semibold text-slate-200">Permanent SOX Audit Log</div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Event <span className="font-mono text-white">AUDIT-0042</span> appended to immutable ledger with reviewer identity, timestamp, and decision rationale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      onEnterWorkspace();
                    } else {
                      onNavigateToLogin();
                    }
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Resolve SUP-001 in Workspace' : 'Sign In to Access Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive Interactive Showcase */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Sourcing Intelligence Architecture
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Engineered for aerospace, automotive tier-1, and mission-critical manufacturing.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex border-b border-slate-800 justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveFeatureTab('fusion')}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeFeatureTab === 'fusion'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Multi-Signal Fusion</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('simulator')}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeFeatureTab === 'simulator'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Trade-Off Simulator</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('governance')}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeFeatureTab === 'governance'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Human-in-the-Loop Governance</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('audit')}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeFeatureTab === 'audit'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Immutable SOX Audit Trail</span>
            </button>
          </div>

          {/* Showcase Display Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
            {activeFeatureTab === 'fusion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs font-mono text-blue-400 font-semibold uppercase mb-2">
                    Autonomous Multi-Signal Radar
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Cross-Correlates Subtle Anomalies Across Every Procurement Silo
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Most ERP systems treat a 5-day PO delay, a 2% price deviation, and a supplier quality alert as disconnected items. RiskPilot AI computes the mathematical convergence across:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>On-Time Delivery (OTD) slippages compared to assembly safety stocks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Lot acceptance rates, defect types, and dimensional tolerance checks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Purchase order invoice price deviations against contractual master baselines</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>ISO 9001 / AS9100 / FAA compliance validity windows</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-slate-500">// Real-time Risk Engine Calculation</div>
                  <div className="text-emerald-400">OTD_Score: 62% (Threshold: 85%) -&gt; HIGH_RISK</div>
                  <div className="text-red-400">Defect_Rate: 11.2% (Threshold: 3.5%) -&gt; CRITICAL</div>
                  <div className="text-amber-400">Price_Variance: +14.2% on CMP-TITAN-X1 -&gt; UNAPPROVED</div>
                  <div className="text-purple-400">SingleSourceFlag: TRUE (No active approved backup)</div>
                  <div className="pt-2 border-t border-slate-800 text-white font-bold">
                    Aggregated Severity: CRITICAL · Automated Action Queued
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'simulator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs font-mono text-purple-400 font-semibold uppercase mb-2">
                    Predictive Sourcing Simulation
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Monte Carlo Scenario Modeling Before Spending a Single Dollar
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Never guess the outcome of dual-sourcing or inventory adjustments. RiskPilot calculates the financial trade-offs of 3 distinct operational strategies:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Status Quo vs Dual Sourcing vs Safety Stock Escalation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Stockout Probability vs Expedited Freight Costs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Net financial downside exposure quantified in dollars</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-200">Simulation Comparison Matrix</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-400">Option 1</div>
                      <div className="font-bold text-red-400 mt-1">Status Quo</div>
                      <div className="text-[10px] text-slate-500 mt-1">82% Stockout</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-purple-800">
                      <div className="text-purple-300">Option 2 (Best)</div>
                      <div className="font-bold text-purple-200 mt-1">Dual-Source</div>
                      <div className="text-[10px] text-emerald-400 mt-1">11% Stockout</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-400">Option 3</div>
                      <div className="font-bold text-amber-300 mt-1">Buffer Stock</div>
                      <div className="text-[10px] text-slate-400 mt-1">34% Stockout</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center font-mono">
                    Modelled across 10,000 supply disruption iterations
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'governance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs font-mono text-emerald-400 font-semibold uppercase mb-2">
                    Enforced Human-in-the-Loop
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Zero Autonomous Rogue POs: Enforced Executive Sign-Off
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Autonomous AI systems must never make unilateral procurement commitments without human approval. RiskPilot AI acts as an intelligence co-pilot:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Every action is drafted with title, supporting evidence, and urgency</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Role-based approvals (CPO, QA Director, Sourcing Specialist)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mandatory reviewer rationale recorded for compliance</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-white">Action ACT-001 Approval Gate</span>
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                      PENDING REVIEW
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Reviewer: <strong className="text-white">Elena Vance (CPO)</strong>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Comment: "Approved expedited dual-sourcing RFQ with Delta Hydraulics to secure turbine line continuity."
                  </div>
                  <div className="pt-2 flex gap-2">
                    <div className="flex-1 py-1.5 bg-emerald-600 text-white text-center rounded text-xs font-semibold">
                      Approve & Execute
                    </div>
                    <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-center rounded text-xs font-medium">
                      Reject
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'audit' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs font-mono text-amber-400 font-semibold uppercase mb-2">
                    Cryptographic Compliance
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Immutable SOX 404 & AS9100 Audit Trail
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Every risk alert triggered, simulation executed, action approved, and status change is immutably timestamped and recorded:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Cryptographic hash verification for tamper-proofing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Exportable compliance packages for external auditors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Complete actor attribution and timestamping</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-[11px] text-slate-500">// Audit Log Segment</div>
                  <div className="text-[11px] text-slate-300">
                    [AUDIT-0038] 2026-10-09T09:12:00Z | ACTOR: Elena Vance (CPO)
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    EVENT: ACTION_APPROVED | ACTION_ID: ACT-001 | DECISION: APPROVED
                  </div>
                  <div className="text-[11px] text-slate-400">
                    HASH: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                    SOX 404 & ISO 9001:2015 Audit Standard Verified
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive ROI & Downtime Exposure Calculator */}
      <section id="roi-calculator" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded font-semibold">
              Interactive Value Modeling
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3 tracking-tight">
              Calculate Your Supply Disruption Exposure
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Adjust your organization's parameters below to estimate preventable assembly downtime and projected net savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800">
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-300">Annual Strategic Direct Spend</span>
                  <span className="font-mono text-white text-sm">${annualSpend}M USD</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="5"
                  value={annualSpend}
                  onChange={e => setAnnualSpend(Number(e.target.value))}
                  className="w-full accent-white h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>$20M</span>
                  <span>$250M</span>
                  <span>$500M</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-300">Active Tier-1 & Tier-2 Suppliers</span>
                  <span className="font-mono text-white text-sm">{tier1Suppliers} Suppliers</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={tier1Suppliers}
                  onChange={e => setTier1Suppliers(Number(e.target.value))}
                  className="w-full accent-white h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>20</span>
                  <span>150</span>
                  <span>300</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-300">Single-Source Critical Parts Exposure</span>
                  <span className="font-mono text-white text-sm">{singleSourcePct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="2"
                  value={singleSourcePct}
                  onChange={e => setSingleSourcePct(Number(e.target.value))}
                  className="w-full accent-white h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>10% (Low)</span>
                  <span>30% (Standard)</span>
                  <span>60% (High)</span>
                </div>
              </div>
            </div>

            {/* Calculated Results */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 mb-1">Estimated Annual Exposure</div>
                <div className="text-3xl font-extrabold text-red-400 font-mono">
                  ${estimatedDowntimeExposure}M
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Projected factory line downtime, emergency expedited freight, and unannounced price deviation risks.
                </p>

                <div className="mt-6 pt-5 border-t border-slate-800">
                  <div className="text-xs font-mono uppercase text-emerald-400 mb-1">
                    Projected Savings with RiskPilot AI
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    ${projectedSavings}M / year
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Via early multi-signal detection (18 days in advance), automated dual-sourcing, and contractual hold execution.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Estimated Payback: </span>
                  <strong className="text-white font-mono">{paybackMonths} months</strong>
                </div>
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      onEnterWorkspace();
                    } else if (onOpenAuthModal) {
                      onOpenAuthModal('persona');
                    } else {
                      onNavigateToLogin();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-white text-slate-950 font-semibold rounded text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Verify in Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Personas & 1-Click Access Section */}
      <section id="personas" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded font-semibold">
              Multi-Role Access Control (RBAC)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3 tracking-tight">
              Experience the Workspace Through 4 Enterprise Roles
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Judges and evaluators can log in as any role with a single click to test permissions, approval gates, and views.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ENTERPRISE_PERSONAS.map(persona => {
              const roleMeta = ROLE_LABELS[persona.role];
              return (
                <div
                  key={persona.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
                >
                  <div>
                    <span
                      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border font-semibold mb-3 ${roleMeta.badgeColor}`}
                    >
                      {roleMeta.label}
                    </span>
                    <h3 className="text-base font-bold text-white">{persona.name}</h3>
                    <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">
                      {persona.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                      {persona.bio}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => onNavigateToLogin()}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <span>Sign In as {persona.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Everything judges and technical evaluators need to know about RiskPilot AI.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left text-sm font-semibold text-white flex items-center justify-between hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-4xl mx-auto text-center border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Shield Your Mission-Critical Supply Lines?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-3 max-w-2xl mx-auto">
            Experience the real-time multi-signal convergence radar, Monte Carlo simulator, and governed action center in our live demonstration sandbox.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  onEnterWorkspace();
                } else {
                  onNavigateToLogin();
                }
              }}
              className="px-6 py-3.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <span>{isAuthenticated ? 'Launch Live Workspace' : 'Sign In to Launch Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToLogin}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Sign In to Account
            </button>

            <button
              onClick={onNavigateToSignup}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Create Enterprise Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">RiskPilot AI · Enterprise Sourcing Intelligence & Risk Operations</span>
          </div>
          <div className="text-slate-500 text-[11px] text-center sm:text-right">
            ISO 9001:2015 · AS9100D · SOX 404 Governed · Sandbox Demonstration Environment Active
          </div>
        </div>
      </footer>
    </div>
  );
};
