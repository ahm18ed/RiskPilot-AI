import React, { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Loader2,
  Scale,
  Zap,
  DollarSign,
  Layers,
  FileBarChart,
  RotateCcw,
  User,
  Sliders,
  ChevronDown,
  Check,
  Download,
  Copy,
  Gavel,
  ShieldCheck,
  PauseCircle,
  Crosshair,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { ActionDraft, OperationExecutionLog } from '../../server/types';
import { AIStructuredResponse } from '../../server/aiService';

const assistantMarkdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-base font-bold text-slate-950 border-b border-slate-200 pb-2 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mt-5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 mt-4 mb-1.5">{children}</h3>,
  p: ({ children }) => <p className="my-2 leading-6 text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1 text-slate-700">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-blue-400 bg-blue-50/70 px-3 py-1 text-slate-700">{children}</blockquote>,
  hr: () => <hr className="my-4 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-max border-collapse text-left text-[11px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100 text-slate-700">{children}</thead>,
  th: ({ children }) => <th className="border-b border-slate-200 px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700">{children}</td>,
  tr: ({ children }) => <tr className="even:bg-slate-50/70">{children}</tr>,
  a: ({ children, href }) => <a className="text-blue-700 underline underline-offset-2" href={href} target="_blank" rel="noreferrer">{children}</a>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800">{children}</code>,
  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{children}</pre>
};

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  operations?: OperationExecutionLog[];
  workflowStage?: string;
  analysisSource?: AIStructuredResponse['analysisSource'];
  confidenceScore?: number;
  isFallback?: boolean;
  fallbackReason?: string;
  identifiedRisks?: string[];
  compoundingFactors?: string[];
  evidencePoints?: string[];
  optionsCompared?: {
    name: string;
    financialImpact: string;
    leadTime: string;
    stockOutRisk: string;
    pros: string[];
    cons: string[];
  }[];
  suggestedActionDraft?: AIStructuredResponse['suggestedActionDraft'];
  downloadableArtifact?: AIStructuredResponse['downloadableArtifact'];
  directExecutionResult?: AIStructuredResponse['directExecutionResult'];
  uncertainties?: string[];
}

interface AiAssistantViewProps {
  initialSupplierId?: string;
  onTransferAction: (actionDraft: Partial<ActionDraft>) => void;
  onSelectSupplier: (supplierId: string) => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  initialSupplierId = 'SUP-001',
  onTransferAction,
  onSelectSupplier
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSupplierId);
  const [inputQuery, setInputQuery] = useState('');
  const [datasetText, setDatasetText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active category tab for quick operations
  const [activeOpCategory, setActiveOpCategory] = useState<'forensics' | 'simulations' | 'commercial' | 'autonomous'>('forensics');

  // Interactive parameter drawers
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [demandSurgePct, setDemandSurgePct] = useState<number>(30);
  const [delayDays, setDelayDays] = useState<number>(10);
  const [splitRatioPrimaryPct, setSplitRatioPrimaryPct] = useState<number>(70);
  const [tightenedDefectTol, setTightenedDefectTol] = useState<number>(1.5);

  const [copiedArtifactId, setCopiedArtifactId] = useState<string | null>(null);

  // Multi-turn chat message history
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `### Welcome to RiskPilot AI Autonomous Procurement Agent

    I can analyze the live supplier-risk workspace and the included **Kaveri Spares & Hydraulics** dataset: 126 product SKUs, stock across six stores and two warehouses, sales history, 205 supplier quotes, and 43 purchase orders.

    Ask questions such as **“Which SKUs are low on stock?”, “Show stock for CLT-6120 by location”, “Which supplier has the lowest quote for BLT-1032?”, “What sold most in Hubli?”,** or **“Show open purchase orders.”**

**You can ask me to execute any procurement operation:**
- 🔬 **Defect Root Cause Pareto**: Analyze failure mechanisms (porosity vs runout), scrap costs, and CMM containment.
- 💰 **Financial Clawback Audit**: Recover unauthorized PO invoice variance across all suppliers.
- ⚖️ **Legal Breach Cure Notice**: Generate formal contractual demand letters and itemized damages claims.
- 🔀 **Dual-Sourcing Split Optimizer**: Model blended unit cost, scrap rate reduction, and line-starvation risk under custom splits (70/30, 60/40).
- 🛡️ **Regulatory Expiry Horizon Radar**: 90-day forecast of AS9100 / ISO / ITAR certification risks.
- ⚡ **Autonomous Direct Action Dispatch**: Create, approve, and record actions or freeze vendor status directly in the database.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleAsk = async (
    queryText: string,
    options?: {
      stressParams?: { demandSurgePct?: number; delayDays?: number };
      splitParams?: { primaryPct?: number };
      sensitivityParams?: { defectThresholdPct?: number; priceDeviationPct?: number };
    }
  ) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);

    const userMessageId = `user-${Date.now()}`;
    const userTurn: ChatTurn = {
      id: userMessageId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userTurn]);
    setInputQuery('');

    try {
      const historyPayload = chatHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.askAI(
        queryText,
        selectedSupplierId,
        'ITEM-001',
        historyPayload,
        options?.stressParams || (showAdvancedParams ? { demandSurgePct, delayDays } : undefined),
        options?.splitParams || (showAdvancedParams ? { primaryPct: splitRatioPrimaryPct } : undefined),
        options?.sensitivityParams || (showAdvancedParams ? { defectThresholdPct: tightenedDefectTol } : undefined),
        datasetText.trim() || undefined
      );

      const assistantTurn: ChatTurn = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: res.answerMarkdown,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operations: res.executedOperations,
        workflowStage: res.workflowStage,
        analysisSource: res.analysisSource,
        confidenceScore: res.confidenceScore,
        isFallback: res.isDeterministicFallback,
        fallbackReason: res.fallbackReason,
        identifiedRisks: res.identifiedRisks,
        compoundingFactors: res.compoundingFactors,
        evidencePoints: res.evidencePoints,
        optionsCompared: res.optionsCompared,
        suggestedActionDraft: res.suggestedActionDraft,
        downloadableArtifact: res.downloadableArtifact,
        directExecutionResult: res.directExecutionResult,
        uncertainties: res.uncertainties
      };

      setChatHistory(prev => [...prev, assistantTurn]);
    } catch (err: any) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setChatHistory([
      {
        id: 'msg-welcome-reset',
        role: 'assistant',
        content: 'Session reset. Ready for your next supplier risk investigation or autonomous procurement command.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedArtifactId(id);
    setTimeout(() => setCopiedArtifactId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-slate-700" />
            Autonomous AI Procurement Intelligence Agent
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Analyze the included spare-parts CSVs or run the supplier-risk operations below. Dataset answers use the supplied snapshot and linked stock, sales, supplier, and order data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>Target Vendor:</span>
            <select
              value={selectedSupplierId}
              onChange={e => {
                setSelectedSupplierId(e.target.value);
                onSelectSupplier(e.target.value);
              }}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:border-slate-400 font-medium cursor-pointer"
            >
              <option value="SUP-001">SUP-001: Apex Precision Hydraulics (Critical Risk Scenario)</option>
              <option value="SUP-042">SUP-042: Vanguard Micro-Foundry (Candidate Backup)</option>
              <option value="SUP-089">SUP-089: Helios Aero Dynamics (Tertiary Candidate)</option>
              <option value="SUP-002">SUP-002: Nova Technologies</option>
              <option value="SUP-003">SUP-003: Meridian Aerospace</option>
              <option value="SUP-015">SUP-015: Titan Forgings Corp</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            title="Reset conversation"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Advanced Agent Operational Dock */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 mr-2">
              Capabilities:
            </span>
            <button
              onClick={() => setActiveOpCategory('forensics')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                activeOpCategory === 'forensics'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Forensic Analysis
            </button>
            <button
              onClick={() => setActiveOpCategory('simulations')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                activeOpCategory === 'simulations'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Simulations & Sourcing
            </button>
            <button
              onClick={() => setActiveOpCategory('commercial')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                activeOpCategory === 'commercial'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Legal & Negotiation
            </button>
            <button
              onClick={() => setActiveOpCategory('autonomous')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                activeOpCategory === 'autonomous'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚡ Autonomous Execution
            </button>
          </div>

          <button
            onClick={() => setShowAdvancedParams(!showAdvancedParams)}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium self-end sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvancedParams ? 'Hide Parameter Sliders' : 'Simulation Sliders'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedParams ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dynamic Category Triggers */}
        {activeOpCategory === 'forensics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleAsk('Analyze lot inspection failure modes, porosity root causes, and scrap costs for Apex Precision.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Crosshair className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Defect Root Cause</span>
              </div>
              <div className="text-[10px] text-slate-500">Pareto breakdown & CMM runout</div>
            </button>

            <button
              onClick={() => handleAsk('Audit our total financial overpayment exposure and contract price leakage across all purchase orders.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Financial Audit</span>
              </div>
              <div className="text-[10px] text-slate-500">Unapproved PO variances</div>
            </button>

            <button
              onClick={() => handleAsk('Scan all supplier compliance certificates expiring in the next 15, 30, and 90 days.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Compliance Horizon</span>
              </div>
              <div className="text-[10px] text-slate-500">90-day AS9100 / ISO radar</div>
            </button>

            <button
              onClick={() => handleAsk('Scan our entire catalog for single-source Class-A components with less than 30 days of buffer cover.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Bottleneck Scan</span>
              </div>
              <div className="text-[10px] text-slate-500">Catalog sole-source parts</div>
            </button>
          </div>
        )}

        {activeOpCategory === 'simulations' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleAsk(`Run a quantitative supply shock stress test on Titanium Valves with +${demandSurgePct}% demand surge and +${delayDays} day delivery delay.`, { stressParams: { demandSurgePct, delayDays } })}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Supply Shock Sim</span>
              </div>
              <div className="text-[10px] text-slate-500">+{demandSurgePct}% Demand / +{delayDays}d Delay</div>
            </button>

            <button
              onClick={() => handleAsk(`Simulate a ${splitRatioPrimaryPct}/${100 - splitRatioPrimaryPct} order allocation split between Apex Precision and Vanguard Micro-Foundry.`, { splitParams: { primaryPct: splitRatioPrimaryPct } })}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Dual-Sourcing Split</span>
              </div>
              <div className="text-[10px] text-slate-500">{splitRatioPrimaryPct}% / {100 - splitRatioPrimaryPct}% allocation model</div>
            </button>

            <button
              onClick={() => handleAsk('Conduct a head-to-head sourcing comparison between Apex Precision, Vanguard Micro-Foundry, and Helios Aero Dynamics.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <FileBarChart className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Vendor Benchmark</span>
              </div>
              <div className="text-[10px] text-slate-500">Apex vs Vanguard vs Helios</div>
            </button>

            <button
              onClick={() => handleAsk(`Recalibrate risk scoring if defect tolerance is tightened from 3.0% down to ${tightenedDefectTol}%.`, { sensitivityParams: { defectThresholdPct: tightenedDefectTol } })}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Sliders className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Sensitivity Analysis</span>
              </div>
              <div className="text-[10px] text-slate-500">Defect tol: {tightenedDefectTol}%</div>
            </button>
          </div>
        )}

        {activeOpCategory === 'commercial' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleAsk('Generate a formal legal notice of material breach and demand for cure against Apex Precision under Master Supply Agreement terms.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <Gavel className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Legal Breach Notice</span>
              </div>
              <div className="text-[10px] text-slate-500">Cure ultimatum & damages claim</div>
            </button>

            <button
              onClick={() => handleAsk('Prepare an executive commercial negotiation script and bargaining levers for Apex Precision price renegotiation.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Negotiation Playbook</span>
              </div>
              <div className="text-[10px] text-slate-500">Dialogue script & trade levers</div>
            </button>

            <button
              onClick={() => handleAsk('Prepare an executive supply chain risk briefing for leadership with immediate 48-hour containment actions.')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-0.5">
                <FileBarChart className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Executive Briefing</span>
              </div>
              <div className="text-[10px] text-slate-500">C-Suite strategic synthesis</div>
            </button>
          </div>
        )}

        {activeOpCategory === 'autonomous' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleAsk('Execute action in database now: Dispatch and approve emergency CMM receiving inspection quarantine for Apex Precision.')}
              className="p-2.5 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 mb-0.5">
                <Zap className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Execute Quarantine Action</span>
              </div>
              <div className="text-[10px] text-rose-700">Directly creates & approves action in DB</div>
            </button>

            <button
              onClick={() => handleAsk('Execute action in database now: Put Apex Precision on probation and set status to UNDER_REVIEW pending compliance cure.')}
              className="p-2.5 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-0.5">
                <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Freeze Vendor / Set Probation</span>
              </div>
              <div className="text-[10px] text-amber-700">Mutates master status & logs audit</div>
            </button>

            <button
              onClick={() => handleAsk('Execute action in database now: Create and approve fast-track second-source qualification for Vanguard Micro-Foundry.')}
              className="p-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Approve Vanguard Qualification</span>
              </div>
              <div className="text-[10px] text-emerald-700">Commits dual-sourcing action draft</div>
            </button>
          </div>
        )}

        {/* Collapsible Advanced Parameters */}
        {showAdvancedParams && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-center animate-fade-in">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Demand Surge:</span>
                <span className="font-mono font-bold text-slate-900">+{demandSurgePct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={demandSurgePct}
                onChange={e => setDemandSurgePct(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Dual Sourcing Split (Primary):</span>
                <span className="font-mono font-bold text-slate-900">{splitRatioPrimaryPct}% / {100 - splitRatioPrimaryPct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                step={5}
                value={splitRatioPrimaryPct}
                onChange={e => setSplitRatioPrimaryPct(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Tighter Defect Tolerance:</span>
                <span className="font-mono font-bold text-slate-900">{tightenedDefectTol}% AQL</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.5}
                value={tightenedDefectTol}
                onChange={e => setTightenedDefectTol(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Multi-Turn Chat Conversation Flow */}
      <div className="space-y-4">
        {chatHistory.map(turn => {
          const isUser = turn.role === 'user';
          const datasetProviderUnavailable = turn.isFallback && /openrouter|gemini|live ai|provider|credit|quota|rate limit/i.test(turn.fallbackReason || '');
          return (
            <div
              key={turn.id}
              className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
                  <Brain className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-lg p-4 space-y-3 ${
                  isUser
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs w-full'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-100 pb-1.5 opacity-80">
                  <span className="font-semibold">{isUser ? 'Procurement Manager' : 'RiskPilot Intelligence Agent'}</span>
                  <div className="flex items-center gap-2">
                    {turn.workflowStage && (
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold">
                        Stage: {turn.workflowStage}
                      </span>
                    )}
                    {turn.analysisSource === 'openrouter' && (
                      <span className="px-1.5 py-0.2 bg-violet-50 text-violet-700 border border-violet-200 rounded font-bold">
                        OpenRouter · high reasoning
                      </span>
                    )}
                    {turn.analysisSource === 'gemini' && (
                      <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                        Gemini AI
                      </span>
                    )}
                    <span>{turn.timestamp}</span>
                  </div>
                </div>

                {/* Direct Autonomous Database Execution Banner */}
                {turn.directExecutionResult && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded p-3 flex items-start gap-2.5 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-xs">
                        ⚡ Autonomous Operation Committed to Database!
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        {turn.directExecutionResult.message}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono mt-1 text-emerald-700">
                        {turn.directExecutionResult.actionId && (
                          <span>Action ID: <strong>{turn.directExecutionResult.actionId}</strong></span>
                        )}
                        {turn.directExecutionResult.supplierStatus && (
                          <span>Vendor Status: <strong>{turn.directExecutionResult.supplierStatus}</strong></span>
                        )}
                        {turn.directExecutionResult.auditLogId && (
                          <span>Audit Ref: <strong>{turn.directExecutionResult.auditLogId}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {turn.analysisSource === 'dataset' && !isUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start gap-2 text-blue-900">
                    <FileBarChart className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <strong>{datasetProviderUnavailable ? 'Dataset-backed answer (live AI unavailable).' : turn.isFallback ? 'Direct answer from the dataset.' : 'AI analysis grounded in the dataset.'}</strong>{' '}
                      {datasetProviderUnavailable
                        ? turn.fallbackReason
                        : turn.isFallback
                          ? 'This answer is read or calculated directly from the included Kaveri spare-parts CSV snapshot.'
                        : 'This answer uses the included Kaveri spare-parts CSV snapshot.'}
                    </div>
                  </div>
                )}

                {turn.isFallback && turn.analysisSource !== 'dataset' && !isUser && (
                  <div className="bg-amber-50 border border-amber-300 rounded p-3 flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <strong>Live AI unavailable.</strong>{' '}
                      {turn.fallbackReason || 'This answer uses limited deterministic procurement rules.'}
                    </div>
                  </div>
                )}

                {/* Operations Executed Badges */}
                {turn.operations && turn.operations.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1 font-mono text-[11px]">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Operations Executed by Autonomous Agent:
                    </span>
                    {turn.operations.map((op, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-900">✓ {op.operationName}</span>
                        <span className="text-slate-500 text-[10px]">{op.operationType}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render assistant Markdown as structured headings, lists, and tables. */}
                {isUser ? (
                  <div className="whitespace-pre-wrap text-xs leading-5 text-white">{turn.content}</div>
                ) : (
                  <div className="max-w-none text-xs leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={assistantMarkdownComponents}>
                      {turn.content}
                    </ReactMarkdown>
                  </div>
                )}

                {!isUser && ((turn.evidencePoints?.length ?? 0) > 0 || (turn.uncertainties?.length ?? 0) > 0 || (turn.identifiedRisks?.length ?? 0) > 0) && (
                  <details className="mt-3 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-semibold text-slate-700">
                      <span>Evidence &amp; confidence checks</span>
                      {typeof turn.confidenceScore === 'number' && (
                        <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-600">
                          {Math.round(turn.confidenceScore)}% confidence
                        </span>
                      )}
                    </summary>
                    <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-700">
                      {(turn.evidencePoints?.length ?? 0) > 0 && (
                        <div>
                          <strong className="text-slate-900">Evidence used</strong>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {turn.evidencePoints!.map((point, index) => <li key={`evidence-${index}`}>{point}</li>)}
                          </ul>
                        </div>
                      )}
                      {(turn.identifiedRisks?.length ?? 0) > 0 && (
                        <div>
                          <strong className="text-slate-900">Risks identified</strong>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {turn.identifiedRisks!.map((risk, index) => <li key={`risk-${index}`}>{risk}</li>)}
                          </ul>
                        </div>
                      )}
                      {(turn.uncertainties?.length ?? 0) > 0 && (
                        <div>
                          <strong className="text-slate-900">Limits / uncertainties</strong>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">
                            {turn.uncertainties!.map((uncertainty, index) => <li key={`uncertainty-${index}`}>{uncertainty}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Downloadable Artifact Box (Legal letter / 8D Plan / Negotiation script) */}
                {turn.downloadableArtifact && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-700" />
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                            Generated Operational Document Artifact:
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {turn.downloadableArtifact.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(turn.id, turn.downloadableArtifact!.content)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium cursor-pointer transition-colors"
                        >
                          {copiedArtifactId === turn.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedArtifactId === turn.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => handleDownload(turn.downloadableArtifact!.fileName, turn.downloadableArtifact!.content)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compared Options Table If Present */}
                {turn.optionsCompared && turn.optionsCompared.length > 0 && (
                  <div className="border border-slate-200 rounded overflow-hidden mt-3">
                    <div className="bg-slate-50 px-3 py-1.5 font-bold text-slate-700 text-[11px] uppercase font-mono">
                      Decision Alternatives Evaluated:
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="py-1.5 px-3">Option</th>
                            <th className="py-1.5 px-3">Financial Impact</th>
                            <th className="py-1.5 px-3">Lead Time</th>
                            <th className="py-1.5 px-3">Stock-Out Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {turn.optionsCompared.map((opt, i) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 font-semibold text-slate-900">{opt.name}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{opt.financialImpact}</td>
                              <td className="py-2 px-3 font-mono text-slate-700">{opt.leadTime}</td>
                              <td className="py-2 px-3 font-mono">
                                <span className={opt.stockOutRisk.includes('85') ? 'text-red-700 font-bold' : 'text-slate-700'}>
                                  {opt.stockOutRisk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Draft Preparation Box */}
                {turn.suggestedActionDraft && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-2 mt-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-700" />
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                            Prepared Action Draft Ready for Approval:
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {turn.suggestedActionDraft.title}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onTransferAction(turn.suggestedActionDraft!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-2xs self-start sm:self-center"
                      >
                        <span>Submit to Action Center</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-700">
                      <div>Vendor: <strong className="text-slate-900">{turn.suggestedActionDraft.supplierName}</strong></div>
                      <div>Type: <strong className="text-slate-900">{turn.suggestedActionDraft.actionType}</strong></div>
                      <div>Urgency: <strong className="text-red-700">{turn.suggestedActionDraft.urgency}</strong></div>
                      <div>Due: <strong className="text-slate-900">{turn.suggestedActionDraft.recommendedDeadline}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs sticky bottom-4">
        <div className="mb-3">
          <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-500 mb-1.5">
            Optional dataset to analyze (JSON/CSV)
          </label>
          <textarea
            value={datasetText}
            onChange={e => setDatasetText(e.target.value)}
            rows={4}
            placeholder={'Paste a dataset here, e.g.\nregion,orders,defect_rate\nNorth,120,2.5\nWest,76,7.2'}
            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 resize-y"
          />
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAsk(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Ask anything: root cause, dual-sourcing 70/30, legal cure notice, cert expiries, or execute action..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{loading ? 'Analyzing evidence…' : 'Send Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
