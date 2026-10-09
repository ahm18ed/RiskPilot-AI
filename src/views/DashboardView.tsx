import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  FileCheck2,
  TrendingDown,
  DollarSign,
  PackageCheck,
  Search,
  Filter,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { DashboardResponse } from '../services/api';
import { RiskBadge, SupplierStatusBadge } from '../components/Badges';
import { Severity, SupplierStatus } from '../../server/types';

interface DashboardViewProps {
  data: DashboardResponse | null;
  loading: boolean;
  onSelectSupplier: (supplierId: string) => void;
  onOpenSimulator: (supplierId: string) => void;
  onFilterChange: (filters: { severity?: Severity | 'ALL'; status?: SupplierStatus | 'ALL'; search?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onSelectSupplier,
  onOpenSimulator,
  onFilterChange
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<SupplierStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSeveritySelect = (sev: Severity | 'ALL') => {
    setSelectedSeverity(sev);
    onFilterChange({ severity: sev, status: selectedStatus, search: searchQuery });
  };

  const handleStatusSelect = (st: SupplierStatus | 'ALL') => {
    setSelectedStatus(st);
    onFilterChange({ severity: selectedSeverity, status: st, search: searchQuery });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onFilterChange({ severity: selectedSeverity, status: selectedStatus, search: val });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-mono">Loading supplier risk matrix...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Page Title & Mission */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Supplier Risk & Governance Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Surveillance of 150 component vendors across contract price variance, quality defect rates, regulatory certificate expiries, and inventory stock-out buffers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSupplier('SUP-001')}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Demonstration: Apex Precision (SUP-001)</span>
            <ChevronRight className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Clean, high-legibility enterprise cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Suppliers */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Total Suppliers</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.totalSuppliers ?? 150}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tier 1–3 active vendors</div>
        </div>

        {/* High Risk Suppliers */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Critical / High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600">
            {metrics?.highRiskSuppliers ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Require immediate audit</div>
        </div>

        {/* Critical Components at Risk */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Critical Items at Risk</span>
            <PackageCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.criticalItemsAtRisk ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Class-A single-sourced</div>
        </div>

        {/* Expiring Compliance Docs */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Expiring Certificates</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {metrics?.expiringComplianceDocsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lapsing within ≤30 days</div>
        </div>

        {/* Worsening Quality */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Quality Defect Spike</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.worseningQualityCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Rejections &gt;3.0% threshold</div>
        </div>

        {/* Price Above Contract */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Price Over Contract</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics?.priceDeviationCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">POs billed above agreement</div>
        </div>
      </div>

      {/* Middle Row: Urgent Issues Feed + Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Alerts Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Prioritized Supplier Vulnerabilities</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Ranked by Composite Threat Score</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {data?.urgentAlerts && data.urgentAlerts.length > 0 ? (
              data.urgentAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => onSelectSupplier(alert.supplierId)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer group hover:bg-slate-50 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50/40 border-red-200'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-50/40 border-orange-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RiskBadge severity={alert.severity} size="sm" />
                      <span className="font-semibold text-xs text-slate-900 group-hover:text-slate-800 transition-colors">
                        {alert.supplierName}
                      </span>
                      {alert.itemCode && (
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {alert.itemCode}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                      Score {alert.priorityScore}
                    </span>
                  </div>

                  <p className="text-xs text-slate-900 mt-1.5 font-medium">{alert.title}</p>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {alert.reason}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-[11px] truncate max-w-[85%] text-slate-600">
                      Evidence: {alert.supportingEvidence}
                    </span>
                    <span className="text-slate-900 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">No active urgent alerts detected.</div>
            )}
          </div>
        </div>

        {/* Risk Distribution Charts (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Severity Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Supplier Risk Severity Breakdown
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.charts.severityDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {(data?.charts.severityDistribution || []).map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={
                          entry.name === 'Critical'
                            ? '#dc2626'
                            : entry.name === 'High'
                            ? '#ea580c'
                            : entry.name === 'Medium'
                            ? '#d97706'
                            : '#64748b'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-xs mt-1 border-t border-slate-100 pt-2 font-mono">
              {(data?.charts.severityDistribution || []).map(item => (
                <div key={item.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.name === 'Critical'
                            ? '#dc2626'
                            : item.name === 'High'
                            ? '#ea580c'
                            : item.name === 'Medium'
                            ? '#d97706'
                            : '#64748b'
                      }}
                    />
                    <span className="text-slate-500 text-[10px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 mt-0.5">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Categories Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Warning Signals by Risk Category
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts.categoryDistribution || []} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="category" stroke="#475569" fontSize={9} width={105} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  />
                  <Bar dataKey="alerts" fill="#334155" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Matrix Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Supplier Master Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Displaying {data?.filteredSuppliers.length} of {data?.totalFiltered} filtered vendors
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor or category..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-48 sm:w-56"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={e => handleSeveritySelect(e.target.value as any)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => handleStatusSelect(e.target.value as any)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Supplier Name & Code</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Rejection %</th>
                <th className="py-2.5 px-3">Price Dev %</th>
                <th className="py-2.5 px-3">OTD %</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {data?.filteredSuppliers && data.filteredSuppliers.length > 0 ? (
                data.filteredSuppliers.map(supplier => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">
                        {supplier.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{supplier.code} · {supplier.id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={supplier.category}>
                      {supplier.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {supplier.country}
                    </td>
                    <td className="py-2.5 px-3">
                      <SupplierStatusBadge status={supplier.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge severity={supplier.computedRiskLevel} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span className={supplier.metrics.recentRejectionRatePct >= 3 ? 'text-red-700 font-bold' : 'text-slate-700'}>
                        {supplier.metrics.recentRejectionRatePct > 0 ? `${supplier.metrics.recentRejectionRatePct}%` : `${supplier.defectRatePct}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <span className={supplier.metrics.priceDeviationPct > 0 ? 'text-orange-700 font-bold' : 'text-slate-500'}>
                        {supplier.metrics.priceDeviationPct > 0 ? `+${supplier.metrics.priceDeviationPct}%` : '0.0%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                      {supplier.onTimeDeliveryPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectSupplier(supplier.id)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded transition-colors text-[11px] font-medium cursor-pointer"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => onOpenSimulator(supplier.id)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors text-[11px] font-medium cursor-pointer"
                        >
                          Simulate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No suppliers match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
