import React from 'react';
import { Severity, Criticality, ActionStatus, SupplierStatus } from '../../server/types';

export const RiskBadge: React.FC<{ severity: Severity; size?: 'sm' | 'md' }> = ({
  severity,
  size = 'md'
}) => {
  const isSm = size === 'sm';
  const styles: Record<Severity, string> = {
    CRITICAL: 'bg-red-50 text-red-800 border-red-200',
    HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    LOW: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const dots: Record<Severity, string> = {
    CRITICAL: 'bg-red-600',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold border rounded-sm ${styles[severity]} ${
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[severity]}`} />
      {severity}
    </span>
  );
};

export const CriticalityBadge: React.FC<{ criticality: Criticality }> = ({ criticality }) => {
  const styles: Record<Criticality, string> = {
    A: 'bg-red-50 text-red-800 border-red-200 font-bold',
    B: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    C: 'bg-slate-100 text-slate-600 border-slate-200 font-normal'
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono border rounded-sm ${styles[criticality]}`}
      title={`Criticality Class ${criticality}`}
    >
      Class {criticality}
    </span>
  );
};

export const ActionStatusBadge: React.FC<{ status: ActionStatus }> = ({ status }) => {
  const styles: Record<ActionStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
    COMPLETED: 'bg-slate-800 text-white border-slate-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-semibold uppercase border rounded-sm ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const SupplierStatusBadge: React.FC<{ status: SupplierStatus }> = ({ status }) => {
  const styles: Record<SupplierStatus, string> = {
    APPROVED: 'bg-slate-100 text-slate-800 border-slate-200',
    CONDITIONAL: 'bg-amber-50 text-amber-800 border-amber-200',
    UNDER_REVIEW: 'bg-blue-50 text-blue-800 border-blue-200',
    SUSPENDED: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium border rounded-sm ${styles[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
