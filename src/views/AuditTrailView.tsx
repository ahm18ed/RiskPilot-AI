import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Brain,
  SlidersHorizontal,
  FilePlus,
  RefreshCw,
  Search
} from 'lucide-react';
import { AuditLog } from '../../server/types';

interface AuditTrailViewProps {
  logs: AuditLog[];
  loading: boolean;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs, loading }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => {
    if (eventTypeFilter !== 'ALL' && log.eventType !== eventTypeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getEventBadge = (eventType: AuditLog['eventType']) => {
    switch (eventType) {
      case 'ACTION_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            HUMAN SIGN-OFF (APPROVED)
          </span>
        );
      case 'ACTION_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            HUMAN DECLINED (REJECTED)
          </span>
        );
      case 'RECOMMENDATION_GENERATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <Brain className="w-3 h-3 text-slate-600" />
            AI PROPOSAL GENERATED
          </span>
        );
      case 'SIMULATION_EVALUATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <SlidersHorizontal className="w-3 h-3 text-slate-600" />
            DECISION SIMULATION RUN
          </span>
        );
      case 'DRAFT_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <FilePlus className="w-3 h-3 text-blue-600" />
            DRAFT ACTION CREATED
          </span>
        );
      case 'DATASET_RESET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <RefreshCw className="w-3 h-3 text-slate-500" />
            DATASET RESTORED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {eventType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            Immutable Procurement Governance Audit Trail
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Chronological audit ledger recording AI diagnostic recommendations, simulated decisions, human approvals, rejections, and timestamped sign-offs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-mono">Event Filter:</label>
          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Governance Events</option>
            <option value="ACTION_APPROVED">Human Sign-Offs (Approved)</option>
            <option value="ACTION_REJECTED">Human Rejections</option>
            <option value="RECOMMENDATION_GENERATED">AI System Recommendations</option>
            <option value="SIMULATION_EVALUATED">Decision Simulations</option>
            <option value="DRAFT_CREATED">Draft Creations</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-52"
          />
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Event ID & Timestamp</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">Actor / Deciding Authority</th>
                <th className="py-2.5 px-4">Audit Record Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const isApproval = log.eventType === 'ACTION_APPROVED';
                  const isRejection = log.eventType === 'ACTION_REJECTED';
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isApproval
                          ? 'bg-emerald-50/20'
                          : isRejection
                          ? 'bg-rose-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <div className="font-semibold text-slate-900">{log.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getEventBadge(log.eventType)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className={`font-semibold ${
                          isApproval ? 'text-emerald-800' : isRejection ? 'text-rose-800' : 'text-slate-800'
                        }`}>
                          {log.actor}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p className="leading-relaxed">{log.details}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 inline-block">
                            Metadata: {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    No governance audit entries match the search filter.
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
