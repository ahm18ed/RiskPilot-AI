import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  PackageCheck,
  TrendingDown,
  Clock,
  ShieldCheck,
  FileText,
  DollarSign,
  ChevronLeft,
  SlidersHorizontal,
  Brain,
  PlusCircle,
  ExternalLink,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SupplierDetailResponse } from '../services/api';
import { RiskBadge, CriticalityBadge, SupplierStatusBadge, ActionStatusBadge } from '../components/Badges';

interface SupplierDetailViewProps {
  supplierData: SupplierDetailResponse | null;
  loading: boolean;
  onBack: () => void;
  onOpenSimulator: (supplierId: string, itemId?: string) => void;
  onAskAI: (supplierId: string, itemId?: string) => void;
  onCreateAction: (supplierId: string, itemId?: string) => void;
}

export const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({
  supplierData,
  loading,
  onBack,
  onOpenSimulator,
  onAskAI,
  onCreateAction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'pricing' | 'quality' | 'compliance' | 'alternatives'>('overview');

  if (loading && !supplierData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-mono">Loading supplier dossier...</p>
        </div>
      </div>
    );
  }

  if (!supplierData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No supplier selected for investigation.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded text-xs hover:bg-slate-800 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { supplier, metrics, alerts, items, contracts, purchaseOrders, inspections, complianceDocs, alternatives, relatedActions } = supplierData;
  const primaryItem = items[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          Back to Executive Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskAI(supplier.id, primaryItem?.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-slate-500" />
            Ask AI Copilot
          </button>
          <button
            onClick={() => onOpenSimulator(supplier.id, primaryItem?.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Simulate Decision Options
          </button>
          <button
            onClick={() => onCreateAction(supplier.id, primaryItem?.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
            Draft Action
          </button>
        </div>
      </div>

      {/* Supplier Identity Dossier Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{supplier.name}</h1>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {supplier.code} · {supplier.id}
                </span>
                <SupplierStatusBadge status={supplier.status} />
                <RiskBadge severity={supplier.computedRiskLevel} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {supplier.category} · {supplier.city}, {supplier.country} · Tier {supplier.tier} Supplier
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded">
              <span className="text-slate-500 text-[10px] block">ANNUAL SPEND</span>
              <span className="text-slate-900 font-bold">${(supplier.annualSpendUsd / 1000).toFixed(0)}k USD</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded">
              <span className="text-slate-500 text-[10px] block">AVG LEAD TIME</span>
              <span className="text-slate-900 font-bold">{supplier.avgLeadTimeDays} Days</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded">
              <span className="text-slate-500 text-[10px] block">ON-TIME DELIVERY</span>
              <span className="text-slate-900 font-bold">{supplier.onTimeDeliveryPct}%</span>
            </div>
          </div>
        </div>

        {/* Compounding Warning Synthesized Explanation Banner */}
        <div className={`mt-4 p-3.5 rounded border ${
          supplier.computedRiskLevel === 'CRITICAL'
            ? 'bg-red-50/60 border-red-200 text-slate-800'
            : supplier.computedRiskLevel === 'HIGH'
            ? 'bg-orange-50/60 border-orange-200 text-slate-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <span className="font-semibold text-xs text-slate-900 block mb-0.5">
                Multi-Signal Risk Synthesis:
              </span>
              <p className="text-xs leading-relaxed text-slate-700">{supplier.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Dossier Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium overflow-x-auto bg-white px-2 rounded-t-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Warning Signals ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'items'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Supplied Items & Stock Cover ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'pricing'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Contract vs PO Invoices ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'quality'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Quality Inspections ({inspections.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'compliance'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Compliance Documents ({complianceDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('alternatives')}
          className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'alternatives'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Alternative Suppliers ({alternatives.length})
        </button>
      </div>

      {/* Tab Panels */}
      {/* 1. Overview & Warnings */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <RiskBadge severity={alert.severity} size="sm" />
                    <span className="text-[11px] font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      Threat Score {alert.priorityScore}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{alert.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5">{alert.reason}</p>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-700 font-mono">
                    <span className="text-slate-500 block mb-0.5 font-sans font-semibold text-[10px] uppercase">
                      Analytical Evidence:
                    </span>
                    {alert.supportingEvidence}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">Alert: {alert.alertType}</span>
                  <button
                    onClick={() => onOpenSimulator(supplier.id, alert.itemId)}
                    className="text-slate-900 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Simulate Strategy →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Supplied Items & Stock Coverage */}
      {activeTab === 'items' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Supplied Components & Inventory Cover Analysis</h3>
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Component Code & Name</th>
                  <th className="py-2.5 px-3">Criticality</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3">Daily Demand</th>
                  <th className="py-2.5 px-3">Stock Cover</th>
                  <th className="py-2.5 px-3">Lead Time vs Stock</th>
                  <th className="py-2.5 px-3">Approved Sources</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map(item => {
                  const leadTime = supplier.avgLeadTimeDays;
                  const deficit = leadTime - item.daysOfStockCover;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.code}</div>
                      </td>
                      <td className="py-3 px-3">
                        <CriticalityBadge criticality={item.criticality} />
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-900">
                        {item.currentStock.toLocaleString()} {item.unitOfMeasure}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600">
                        {item.avgDailyDemand} {item.unitOfMeasure}/day
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.daysOfStockCover <= 30
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.daysOfStockCover} Days
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {deficit > 0 ? (
                          <span className="text-red-700 font-semibold">
                            ⚠️ {deficit}d DEFICIT (Lead: {leadTime}d)
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            Safe (+{Math.abs(deficit)}d buffer)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        <span className={item.approvedSupplierIds.length <= 1 ? 'text-red-700 font-bold' : 'text-slate-600'}>
                          {item.approvedSupplierIds.length === 1 ? '1 (SOLE SOURCE)' : `${item.approvedSupplierIds.length} approved`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenSimulator(supplier.id, item.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium cursor-pointer"
                        >
                          Simulate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Pricing & PO Invoices */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Purchase Order Price Audits vs Contract</h3>
              <p className="text-xs text-slate-500">
                Compares unit price billed on each purchase order against Master Supply Agreement rate.
              </p>
            </div>
            {contracts[0] && (
              <div className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                <span className="text-slate-500">Contract Agreement: </span>
                <span className="text-slate-900 font-bold">${contracts[0].agreedPrice.toFixed(2)} USD</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Order Date</th>
                  <th className="py-2 px-3">Ordered Qty</th>
                  <th className="py-2 px-3">Contract Price</th>
                  <th className="py-2 px-3">Invoiced Price</th>
                  <th className="py-2 px-3">Variance %</th>
                  <th className="py-2 px-3">Overpayment Impact</th>
                  <th className="py-2 px-3">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {purchaseOrders.map(po => {
                  const overpay = (po.invoicedUnitPrice - po.agreedUnitPrice) * po.orderedQty;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{po.poNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">{po.orderDate}</td>
                      <td className="py-2.5 px-3 text-slate-700">{po.orderedQty} EA</td>
                      <td className="py-2.5 px-3 text-slate-500">${po.agreedUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">${po.invoicedUnitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          po.priceDeviationPct > 5
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : po.priceDeviationPct > 0
                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                            : 'text-slate-500'
                        }`}>
                          {po.priceDeviationPct > 0 ? `+${po.priceDeviationPct}%` : '0.0%'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {overpay > 0 ? (
                          <span className="text-red-700 font-bold">+${overpay.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">$0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-sans">
                        {po.isLate ? (
                          <span className="text-amber-800 font-medium">Late ({po.delayDays}d delay)</span>
                        ) : (
                          <span className="text-emerald-700">On-Time</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Quality Inspections */}
      {activeTab === 'quality' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incoming Lot Quality Inspections</h3>
              <p className="text-xs text-slate-500">
                Receiving inspection history showing historical baseline vs recent lot rejection spikes.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500">Historical Avg: <strong className="text-slate-900">1.0%</strong></span>
              <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                Recent Spike: 7.5% Avg (Lots at 6% & 9%)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Lot Number</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Sample Size</th>
                  <th className="py-2 px-3">Rejects</th>
                  <th className="py-2 px-3">Rejection Rate %</th>
                  <th className="py-2 px-3">Defect Category</th>
                  <th className="py-2 px-3">Inspector Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {inspections.map(lot => (
                  <tr key={lot.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{lot.lotNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{lot.inspectionDate}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">{lot.sampleSize} units</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span className={lot.rejectedQty >= 5 ? 'text-red-700 font-bold' : 'text-slate-500'}>
                        {lot.rejectedQty} units
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        lot.rejectionRatePct >= 5
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : lot.rejectionRatePct >= 3
                          ? 'bg-orange-50 text-orange-800 border border-orange-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lot.rejectionRatePct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{lot.defectCategory}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs">{lot.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Compliance Certificates */}
      {activeTab === 'compliance' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Regulatory & Quality Compliance Certificates</h3>
            <p className="text-xs text-slate-500">
              Audited certificates for aerospace & international quality standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceDocs.map(doc => (
              <div
                key={doc.id}
                className={`p-4 rounded-lg border flex flex-col justify-between ${
                  doc.daysUntilExpiry <= 10
                    ? 'bg-red-50/60 border-red-200'
                    : doc.daysUntilExpiry <= 30
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {doc.docType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      doc.daysUntilExpiry <= 10
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : doc.daysUntilExpiry <= 30
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {doc.daysUntilExpiry <= 0
                        ? 'EXPIRED'
                        : doc.daysUntilExpiry <= 30
                        ? `EXPIRING IN ${doc.daysUntilExpiry} DAYS`
                        : `${doc.daysUntilExpiry} Days Remaining`}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700 font-mono">
                    <div>Certificate: <span className="text-slate-900 font-semibold">{doc.docNumber}</span></div>
                    <div>Issuer: <span className="text-slate-500">{doc.issuer}</span></div>
                    <div>Expiry Date: <span className="text-slate-900 font-bold">{doc.expiryDate}</span></div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Status: {doc.status}</span>
                  {doc.verificationUrl && (
                    <a
                      href={doc.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 hover:underline flex items-center gap-1 font-mono"
                    >
                      Audit Record <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Alternative Suppliers */}
      {activeTab === 'alternatives' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Candidate Backup Sources for {primaryItem?.code || 'Key Components'}</h3>
            <p className="text-xs text-slate-500">
              Evaluation of unapproved and conditional alternative suppliers in qualification pipeline.
            </p>
          </div>

          {alternatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternatives.map(alt => (
                <div key={alt.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-sm">{alt.name}</span>
                      <SupplierStatusBadge status={alt.status} />
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      {alt.city}, {alt.country} · {alt.category}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">LEAD TIME</span>
                        <span className="text-slate-900 font-bold">{alt.avgLeadTimeDays}d</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DEFECT %</span>
                        <span className="text-slate-900 font-bold">{alt.defectRatePct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">OTD %</span>
                        <span className="text-slate-900 font-bold">{alt.onTimeDeliveryPct}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 italic">{alt.notes}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-mono">
                      {alt.id === 'SUP-042' ? 'Primary Dual-Source Target' : 'Secondary Candidate'}
                    </span>
                    <button
                      onClick={() => onOpenSimulator(supplier.id, primaryItem?.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium cursor-pointer"
                    >
                      Compare Feasibility →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Zero candidate alternative suppliers found in master catalog for this item.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
