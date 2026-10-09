import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { DecisionSimulationResult } from '../../server/decisionEngine';
import { DecisionOption, ActionDraft } from '../../server/types';

interface DecisionSimulatorViewProps {
  initialSupplierId?: string;
  onDraftAction: (draft: Partial<ActionDraft>) => void;
  onSelectSupplier: (supplierId: string) => void;
}

export const DecisionSimulatorView: React.FC<DecisionSimulatorViewProps> = ({
  initialSupplierId = 'SUP-001',
  onDraftAction,
  onSelectSupplier
}) => {
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<DecisionSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runSimulation(supplierId);
  }, [supplierId]);

  const runSimulation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateDecision(id);
      setSimulation(res);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = (option: DecisionOption) => {
    if (!simulation) return;
    const template = option.actionDraftTemplate;
    onDraftAction({
      actionType: template.actionType,
      title: template.title,
      supplierId: template.actionType === 'SECOND_SOURCE_QUALIFICATION' ? 'SUP-042' : simulation.supplier.id,
      supplierName: template.actionType === 'SECOND_SOURCE_QUALIFICATION' ? 'Vanguard Micro-Foundry' : simulation.supplier.name,
      itemId: simulation.item.id,
      itemCode: simulation.item.code,
      itemName: simulation.item.name,
      reason: `Strategy Selection: "${option.name}". Estimated impact: ${option.estimatedFinancialImpact}.`,
      supportingEvidence: `Current stock cover: ${simulation.stockCoverSummary.daysOfStockCover} days; lead time: ${option.leadTimeDays} days; stock-out risk: ${option.stockOutRiskPct}%.`,
      recommendedDeadline: new Date(Date.now() + template.recommendedDeadlineDays * 86400000).toISOString().split('T')[0],
      urgency: template.urgency,
      expectedOutcome: template.expectedOutcome,
      assignedTo: 'Lead Sourcing Specialist & Director of Procurement',
      notes: template.suggestedNotes
    });
  };

  const stockSummary = simulation?.stockCoverSummary;

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
            Procurement Decision Strategy Simulator
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Evaluate operational trade-offs between holding orders, mandatory lot audits, pricing clawbacks, and fast-track dual-sourcing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-mono">Supplier Target:</label>
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 font-medium"
          >
            <option value="SUP-001">SUP-001: Apex Precision (Challenge Scenario)</option>
            <option value="SUP-042">SUP-042: Vanguard Micro-Foundry</option>
            <option value="SUP-089">SUP-089: Helios Aero Dynamics</option>
            <option value="SUP-002">SUP-002: Nova Technologies</option>
          </select>
        </div>
      </div>

      {loading && !simulation && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-7 h-7 animate-spin text-slate-900" />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
          ⚠️ {error}
        </div>
      )}

      {simulation && stockSummary && (
        <>
          {/* Inventory Buffer & Stock Cover Reality Check */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Component Buffer vs Vendor Lead Time: {simulation.item.code}
              </h2>
              <span className="text-xs font-mono text-slate-600">
                Primary Supplier: {simulation.supplier.name}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">CURRENT STOCK</span>
                <span className="text-slate-900 text-lg font-bold">{stockSummary.currentStock} {simulation.item.unitOfMeasure}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">DAILY DEMAND</span>
                <span className="text-slate-700 text-lg font-bold">{stockSummary.avgDailyDemand} {simulation.item.unitOfMeasure}/day</span>
              </div>
              <div className="bg-red-50/70 p-3 rounded border border-red-200">
                <span className="text-[10px] text-red-700 block font-semibold">STOCK COVER</span>
                <span className="text-red-700 text-lg font-bold">{stockSummary.daysOfStockCover} Days</span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">SUPPLIER LEAD TIME</span>
                <span className="text-slate-900 text-lg font-bold">{stockSummary.supplierLeadTimeDays} Days</span>
              </div>
            </div>

            {/* Visual Deficit Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-slate-600">
                  Buffer Margin: {stockSummary.daysOfStockCover}d inventory cover vs {stockSummary.supplierLeadTimeDays}d lead time
                </span>
                <span className="text-red-700 font-bold">
                  ⚠️ {stockSummary.bufferDeficitDays} Days Deficit
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className="bg-red-600 h-full"
                  style={{ width: `${(stockSummary.daysOfStockCover / stockSummary.supplierLeadTimeDays) * 100}%` }}
                />
                <div
                  className="bg-slate-300 h-full flex-1"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Note: Placing new orders on hold without a qualified alternative risks assembly line starvation in {stockSummary.daysOfStockCover} days.
              </p>
            </div>
          </div>

          {/* System Recommendation Banner */}
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs">
            <div>
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold block mb-1">
                Data-Backed Strategy Recommendation
              </span>
              <p className="text-xs text-slate-100 leading-relaxed font-sans font-medium whitespace-pre-line">
                {simulation.recommendationRationale}
              </p>
            </div>
          </div>

          {/* Options Comparison Cards Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Decision Strategies Evaluated</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulation.options.map(option => {
                const isRec = option.isRecommended;
                return (
                  <div
                    key={option.id}
                    className={`rounded-lg border p-5 flex flex-col justify-between transition-all bg-white ${
                      isRec
                        ? 'border-slate-900 ring-1 ring-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                          isRec ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isRec ? 'RECOMMENDED OPTION' : 'ALTERNATIVE STRATEGY'}
                        </span>

                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                          option.stockOutRiskPct >= 70
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : option.stockOutRiskPct >= 30
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          Stock-Out Risk: {option.stockOutRiskPct}%
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1.5">{option.name}</h3>
                      <p className="text-xs text-slate-600 mb-3">{option.strategy}</p>

                      {/* Financial & Operational Impact Metrics */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block">EST. FINANCIAL IMPACT</span>
                          <span className="text-slate-900 font-semibold">{option.estimatedFinancialImpact}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">LEAD TIME</span>
                          <span className="text-slate-900 font-semibold">{option.leadTimeDays} Days</span>
                        </div>
                      </div>

                      {/* Effects on Quality & Compliance */}
                      <div className="space-y-1.5 text-xs text-slate-700 mb-3 border-t border-slate-100 pt-2.5">
                        <div>
                          <strong className="text-slate-900">Quality Impact:</strong> {option.qualityRiskImpact}
                        </div>
                        <div>
                          <strong className="text-slate-900">Compliance Impact:</strong> {option.complianceRiskImpact}
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5 mb-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-700 uppercase font-bold block flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-slate-500" /> Advantages
                          </span>
                          {option.advantages.map((adv, i) => (
                            <p key={i} className="text-slate-600 text-[11px] leading-tight">• {adv}</p>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-700 uppercase font-bold block flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3 text-slate-500" /> Disadvantages
                          </span>
                          {option.disadvantages.map((dis, i) => (
                            <p key={i} className="text-slate-600 text-[11px] leading-tight">• {dis}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Type: {option.actionDraftTemplate.actionType}
                      </span>
                      <button
                        onClick={() => handleCreateDraft(option)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isRec
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <span>Draft Action from Strategy</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
