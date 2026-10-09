import {
  Supplier,
  ComponentItem,
  Contract,
  PurchaseOrder,
  InspectionLot,
  ComplianceDoc,
  RiskAlert,
  DecisionOption,
  ActionDraft,
  AuditLog,
  Severity,
  SupplierStatus
} from '../../server/types';
import { AIStructuredResponse } from '../../server/aiService';
import { DecisionSimulationResult } from '../../server/decisionEngine';

export type { AIStructuredResponse };

export interface DashboardResponse {
  metrics: {
    totalSuppliers: number;
    highRiskSuppliers: number;
    criticalItemsAtRisk: number;
    expiringComplianceDocsCount: number;
    worseningQualityCount: number;
    priceDeviationCount: number;
    totalActiveAlerts: number;
    draftActionsCount: number;
  };
  charts: {
    severityDistribution: { name: string; count: number; color: string }[];
    categoryDistribution: { category: string; alerts: number }[];
  };
  urgentAlerts: RiskAlert[];
  topSuppliersAtRisk: (Supplier & {
    computedRiskLevel: Severity;
    alerts: RiskAlert[];
    metrics: any;
    explanation: string;
  })[];
  filteredSuppliers: (Supplier & {
    computedRiskLevel: Severity;
    alerts: RiskAlert[];
    metrics: any;
    explanation: string;
  })[];
  totalFiltered: number;
  simulatedReferenceDate: string;
}

export interface SupplierDetailResponse {
  supplier: Supplier & {
    computedRiskLevel: Severity;
    explanation: string;
  };
  metrics: any;
  alerts: RiskAlert[];
  items: ComponentItem[];
  contracts: Contract[];
  purchaseOrders: PurchaseOrder[];
  inspections: InspectionLot[];
  complianceDocs: ComplianceDoc[];
  alternatives: Supplier[];
  relatedActions: ActionDraft[];
}

export const api = {
  async getDashboard(params?: {
    severity?: Severity | 'ALL';
    status?: SupplierStatus | 'ALL';
    search?: string;
  }): Promise<DashboardResponse> {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const res = await fetch(`/api/dashboard?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  async getSuppliers(): Promise<{ suppliers: any[]; total: number }> {
    const res = await fetch('/api/suppliers');
    if (!res.ok) throw new Error('Failed to load suppliers');
    return res.json();
  },

  async getSupplierDetail(id: string): Promise<SupplierDetailResponse> {
    const res = await fetch(`/api/suppliers/${id}`);
    if (!res.ok) throw new Error(`Failed to load supplier ${id}`);
    return res.json();
  },

  async getItems(): Promise<{ items: ComponentItem[] }> {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Failed to load items');
    return res.json();
  },

  async simulateDecision(supplierId: string, itemId?: string): Promise<DecisionSimulationResult> {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId, itemId })
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async askAI(
    query: string,
    supplierId?: string,
    itemId?: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
    stressParams?: { demandSurgePct?: number; delayDays?: number },
    splitParams?: { primaryPct?: number },
    sensitivityParams?: { defectThresholdPct?: number; priceDeviationPct?: number }
  ): Promise<AIStructuredResponse> {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, supplierId, itemId, history, stressParams, splitParams, sensitivityParams })
    });
    if (!res.ok) throw new Error('AI query failed');
    return res.json();
  },

  async updateSupplierStatus(
    supplierId: string,
    status: SupplierStatus,
    reason?: string,
    actor?: string
  ): Promise<Supplier> {
    const res = await fetch(`/api/suppliers/${supplierId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, actor })
    });
    if (!res.ok) throw new Error('Failed to update supplier status');
    return res.json();
  },

  async getActions(status?: string): Promise<{ actions: ActionDraft[] }> {
    const url = status && status !== 'ALL' ? `/api/actions?status=${status}` : '/api/actions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load actions');
    return res.json();
  },

  async createAction(action: Partial<ActionDraft>): Promise<ActionDraft> {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
    if (!res.ok) throw new Error('Failed to create action');
    return res.json();
  },

  async updateAction(id: string, updates: Partial<ActionDraft>): Promise<ActionDraft> {
    const res = await fetch(`/api/actions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update action');
    return res.json();
  },

  async reviewAction(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewerName?: string,
    comment?: string
  ): Promise<ActionDraft> {
    const res = await fetch(`/api/actions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewerName, comment })
    });
    if (!res.ok) throw new Error('Failed to submit action review');
    return res.json();
  },

  async getAuditTrail(): Promise<{ logs: AuditLog[] }> {
    const res = await fetch('/api/audit-trail');
    if (!res.ok) throw new Error('Failed to load audit trail');
    return res.json();
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  async login(payload: { email: string; password?: string; personaId?: string; provider?: string }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(payload: { name: string; email: string; role: string; organization: string; department?: string; password: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  }
};
