import {
  generateSeedData,
  DatabaseState
} from './seedData';
import {
  analyzeSupplierRisk,
  DEFAULT_THRESHOLDS,
  SIMULATED_TODAY
} from './riskEngine';
import {
  ActionDraft,
  AuditLog,
  Severity,
  SupplierStatus,
  Supplier,
  RiskAlert
} from './types';
import { simulateDecisionsForSupplier } from './decisionEngine';
import { runAIInvestigation, AIStructuredResponse } from './aiService';

class ProcurementDataStore {
  private state: DatabaseState;

  constructor() {
    this.state = generateSeedData();
  }

  public reset(): void {
    this.state = generateSeedData();
    this.recordAudit({
      actor: 'System Administrator',
      eventType: 'DATASET_RESET',
      details: 'Restored canonical procurement dataset to initial reproducible state.'
    });
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public recordAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      id: `AUDIT-${String(this.state.auditLogs.length + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.state.auditLogs.unshift(log);
    return log;
  }

  // Dashboard Aggregations
  public getDashboardData(filters?: {
    severity?: Severity | 'ALL';
    status?: SupplierStatus | 'ALL';
    search?: string;
  }) {
    const suppliers = this.state.suppliers;
    const items = this.state.items;
    const contracts = this.state.contracts;
    const pos = this.state.purchaseOrders;
    const lots = this.state.inspections;
    const docs = this.state.complianceDocs;

    // Analyze all suppliers through risk engine
    const analyzedSuppliers = suppliers.map(s => {
      const analysis = analyzeSupplierRisk(s, items, contracts, pos, lots, docs);
      return {
        ...s,
        computedRiskLevel: analysis.supplierRiskLevel,
        alerts: analysis.alerts,
        metrics: analysis.metrics,
        explanation: analysis.explanation
      };
    });

    // Counts
    const totalSuppliers = suppliers.length;
    const highRiskSuppliers = analyzedSuppliers.filter(
      s => s.computedRiskLevel === 'CRITICAL' || s.computedRiskLevel === 'HIGH'
    ).length;

    // Critical components at risk (Criticality A with stock cover < 35 or single source or supplier critical/high)
    const criticalItemsAtRisk = items.filter(item => {
      if (item.criticality !== 'A') return false;
      const supp = analyzedSuppliers.find(s => s.id === item.primarySupplierId);
      const isLowStock = item.daysOfStockCover <= DEFAULT_THRESHOLDS.lowStockCoverDays;
      const isSingle = item.approvedSupplierIds.length <= 1;
      const isSuppRisk = supp && (supp.computedRiskLevel === 'CRITICAL' || supp.computedRiskLevel === 'HIGH');
      return isLowStock || isSingle || isSuppRisk;
    }).length;

    // Expiring compliance docs (within 30 days or expired)
    const expiringDocs = docs.filter(d => d.daysUntilExpiry <= DEFAULT_THRESHOLDS.complianceWarningDays);

    // Suppliers with worsening quality
    const worseningQualitySuppliers = analyzedSuppliers.filter(
      s => s.metrics.recentRejectionRatePct >= DEFAULT_THRESHOLDS.rejectionRateWarningPct
    );

    // Suppliers with prices above contract
    const priceDeviationSuppliers = analyzedSuppliers.filter(
      s => s.metrics.priceDeviationPct >= DEFAULT_THRESHOLDS.priceDeviationWarningPct
    );

    // Collect all active alerts across all suppliers, sorted by priority score descending
    const allAlerts: RiskAlert[] = [];
    analyzedSuppliers.forEach(s => {
      allAlerts.push(...s.alerts);
    });
    allAlerts.sort((a, b) => b.priorityScore - a.priorityScore);

    // Filter suppliers if requested
    let filteredSuppliers = [...analyzedSuppliers];
    if (filters?.severity && filters.severity !== 'ALL') {
      filteredSuppliers = filteredSuppliers.filter(s => s.computedRiskLevel === filters.severity);
    }
    if (filters?.status && filters.status !== 'ALL') {
      filteredSuppliers = filteredSuppliers.filter(s => s.status === filters.status);
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(
        s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      );
    }

    // Risk distribution stats for charts
    const severityDistribution = [
      { name: 'Critical', count: analyzedSuppliers.filter(s => s.computedRiskLevel === 'CRITICAL').length, color: '#ef4444' },
      { name: 'High', count: analyzedSuppliers.filter(s => s.computedRiskLevel === 'HIGH').length, color: '#f97316' },
      { name: 'Medium', count: analyzedSuppliers.filter(s => s.computedRiskLevel === 'MEDIUM').length, color: '#eab308' },
      { name: 'Low', count: analyzedSuppliers.filter(s => s.computedRiskLevel === 'LOW').length, color: '#10b981' }
    ];

    const categoryDistribution = [
      { category: 'Quality Defect Surge', alerts: allAlerts.filter(a => a.alertType === 'QUALITY_DETERIORATION').length },
      { category: 'Contract Price Creep', alerts: allAlerts.filter(a => a.alertType === 'PRICE_DEVIATION').length },
      { category: 'Compliance Expiry', alerts: allAlerts.filter(a => a.alertType === 'COMPLIANCE_EXPIRING').length },
      { category: 'Single-Source Bottleneck', alerts: allAlerts.filter(a => a.alertType === 'SINGLE_SOURCE').length },
      { category: 'Combined Compounding', alerts: allAlerts.filter(a => a.alertType === 'COMBINED_RISK').length },
      { category: 'Late Delivery Trends', alerts: allAlerts.filter(a => a.alertType === 'DELIVERY_DELAYS').length }
    ];

    return {
      metrics: {
        totalSuppliers,
        highRiskSuppliers,
        criticalItemsAtRisk,
        expiringComplianceDocsCount: expiringDocs.length,
        worseningQualityCount: worseningQualitySuppliers.length,
        priceDeviationCount: priceDeviationSuppliers.length,
        totalActiveAlerts: allAlerts.length,
        draftActionsCount: this.state.actions.filter(a => a.status === 'DRAFT').length
      },
      charts: {
        severityDistribution,
        categoryDistribution
      },
      urgentAlerts: allAlerts.slice(0, 10),
      topSuppliersAtRisk: analyzedSuppliers
        .filter(s => s.computedRiskLevel === 'CRITICAL' || s.computedRiskLevel === 'HIGH')
        .slice(0, 6),
      filteredSuppliers: filteredSuppliers.slice(0, 50),
      totalFiltered: filteredSuppliers.length,
      simulatedReferenceDate: SIMULATED_TODAY.toISOString().split('T')[0]
    };
  }

  // Supplier Deep Dive
  public getSupplierDetail(supplierId: string) {
    const supplier = this.state.suppliers.find(s => s.id === supplierId);
    if (!supplier) return null;

    const items = this.state.items.filter(
      i => i.primarySupplierId === supplierId || i.approvedSupplierIds.includes(supplierId)
    );
    const contracts = this.state.contracts.filter(c => c.supplierId === supplierId);
    const purchaseOrders = this.state.purchaseOrders.filter(po => po.supplierId === supplierId);
    const inspections = this.state.inspections.filter(l => l.supplierId === supplierId);
    const complianceDocs = this.state.complianceDocs.filter(d => d.supplierId === supplierId);

    const riskAnalysis = analyzeSupplierRisk(
      supplier,
      this.state.items,
      this.state.contracts,
      this.state.purchaseOrders,
      this.state.inspections,
      this.state.complianceDocs
    );

    // Find candidate alternative suppliers for supplier's items
    const candidateSupplierIds = new Set<string>();
    items.forEach(item => {
      item.candidateSupplierIds.forEach(id => candidateSupplierIds.add(id));
      item.approvedSupplierIds.forEach(id => {
        if (id !== supplierId) candidateSupplierIds.add(id);
      });
    });

    const alternatives = this.state.suppliers.filter(s => candidateSupplierIds.has(s.id));

    // Existing actions for this supplier
    const relatedActions = this.state.actions.filter(a => a.supplierId === supplierId);

    return {
      supplier: {
        ...supplier,
        computedRiskLevel: riskAnalysis.supplierRiskLevel,
        explanation: riskAnalysis.explanation
      },
      metrics: riskAnalysis.metrics,
      alerts: riskAnalysis.alerts,
      items,
      contracts,
      purchaseOrders,
      inspections,
      complianceDocs,
      alternatives,
      relatedActions
    };
  }

  // Decision Simulation
  public simulateDecision(supplierId: string, itemId?: string) {
    const supplier = this.state.suppliers.find(s => s.id === supplierId);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    let item = this.state.items.find(i => i.id === itemId);
    if (!item) {
      item = this.state.items.find(
        i => i.primarySupplierId === supplierId || i.approvedSupplierIds.includes(supplierId)
      ) || this.state.items[0];
    }

    const candidateSuppliers = this.state.suppliers.filter(s =>
      item.candidateSupplierIds.includes(s.id) || item.approvedSupplierIds.includes(s.id)
    );

    const complianceDocs = this.state.complianceDocs.filter(d => d.supplierId === supplierId);
    const orders = this.state.purchaseOrders.filter(o => o.supplierId === supplierId && o.itemId === item.id);
    const lots = this.state.inspections.filter(l => l.supplierId === supplierId && l.itemId === item.id);

    const result = simulateDecisionsForSupplier(
      supplier,
      item,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots
    );

    this.recordAudit({
      actor: 'Decision Simulator Engine',
      eventType: 'SIMULATION_EVALUATED',
      details: `Evaluated ${result.options.length} operational decisions for ${supplier.name} on ${item.code}. Recommended: ${result.recommendedOptionId}.`,
      metadata: { supplierId, itemId: item.id, recommendedOption: result.recommendedOptionId }
    });

    return result;
  }

  // AI Assistant Query
  public async askAI(
    query: string,
    supplierId?: string,
    itemId?: string,
    history?: any[],
    stressParams?: { demandSurgePct?: number; delayDays?: number },
    splitParams?: { primaryPct?: number },
    sensitivityParams?: { defectThresholdPct?: number; priceDeviationPct?: number },
    datasetContext?: string
  ): Promise<AIStructuredResponse> {
    const targetSupplierId = supplierId || 'SUP-001';
    const supplier = this.state.suppliers.find(s => s.id === targetSupplierId) || this.state.suppliers[0];

    const targetItemId = itemId || 'ITEM-001';
    const item = this.state.items.find(i => i.id === targetItemId) || this.state.items[0];

    const candidateSuppliers = this.state.suppliers.filter(s =>
      item.candidateSupplierIds.includes(s.id) || item.approvedSupplierIds.includes(s.id)
    );

    const complianceDocs = this.state.complianceDocs.filter(d => d.supplierId === supplier.id);
    const orders = this.state.purchaseOrders.filter(o => o.supplierId === supplier.id);
    const lots = this.state.inspections.filter(l => l.supplierId === supplier.id);

    const riskAnalysis = analyzeSupplierRisk(
      supplier,
      this.state.items,
      this.state.contracts,
      this.state.purchaseOrders,
      this.state.inspections,
      this.state.complianceDocs
    );

    const aiResponse = await runAIInvestigation(
      query,
      this.state,
      supplier,
      item,
      riskAnalysis.alerts,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots,
      history,
      stressParams,
      splitParams,
      sensitivityParams,
      datasetContext
    );

    this.recordAudit({
      actor: aiResponse.isDeterministicFallback ? 'RiskPilot Multi-Op Engine' : 'RiskPilot AI Agent',
      eventType: 'RECOMMENDATION_GENERATED',
      details: `Agent Q&A: "${query.substring(0, 60)}..." -> Stage: ${aiResponse.workflowStage} (${aiResponse.executedOperations.length} ops run)`,
      metadata: {
        query,
        supplierId: supplier.id,
        confidence: aiResponse.confidenceScore,
        operationsRun: aiResponse.executedOperations.map(o => o.operationType),
        isFallback: aiResponse.isDeterministicFallback
      }
    });

    return aiResponse;
  }

  public updateSupplierStatus(
    supplierId: string,
    newStatus: SupplierStatus,
    reason: string = 'Administrative review',
    actor: string = 'Procurement Manager'
  ): Supplier {
    const supp = this.state.suppliers.find(s => s.id === supplierId);
    if (!supp) throw new Error(`Supplier ${supplierId} not found`);

    const prevStatus = supp.status;
    supp.status = newStatus;

    this.recordAudit({
      actor,
      eventType: 'DRAFT_UPDATED',
      details: `Supplier ${supp.name} (${supplierId}) status changed from ${prevStatus} to ${newStatus}. Reason: ${reason}`,
      metadata: { supplierId, prevStatus, newStatus, reason }
    });

    return supp;
  }

  // Action Management
  public getActions(statusFilter?: string): ActionDraft[] {
    if (!statusFilter || statusFilter === 'ALL') {
      return this.state.actions;
    }
    return this.state.actions.filter(a => a.status === statusFilter);
  }

  public createAction(draftData: Omit<ActionDraft, 'id' | 'createdAt' | 'status'>): ActionDraft {
    const newAction: ActionDraft = {
      id: `ACT-${new Date().getFullYear()}-${String(this.state.actions.length + 1).padStart(3, '0')}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      ...draftData
    };
    this.state.actions.unshift(newAction);

    this.recordAudit({
      actionId: newAction.id,
      actor: 'Procurement Specialist',
      eventType: 'DRAFT_CREATED',
      details: `Created draft action ${newAction.id} (${newAction.actionType}): "${newAction.title}" for ${newAction.supplierName}.`,
      metadata: { actionId: newAction.id, supplierId: newAction.supplierId }
    });

    return newAction;
  }

  public updateAction(id: string, updates: Partial<ActionDraft>): ActionDraft {
    const idx = this.state.actions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Action ${id} not found`);

    const existing = this.state.actions[idx];
    if (existing.status === 'APPROVED') {
      throw new Error(`Cannot modify action ${id} once approved.`);
    }

    const updated: ActionDraft = {
      ...existing,
      ...updates,
      id: existing.id // Keep immutable ID
    };

    this.state.actions[idx] = updated;

    this.recordAudit({
      actionId: id,
      actor: 'Procurement Specialist',
      eventType: 'DRAFT_UPDATED',
      details: `Updated action ${id}: "${updated.title}".`,
      metadata: { actionId: id, updates }
    });

    return updated;
  }

  public reviewAction(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewerName: string = 'Procurement Manager',
    reviewComment?: string
  ): ActionDraft {
    const idx = this.state.actions.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Action ${id} not found`);

    const existing = this.state.actions[idx];
    const newStatus = decision;

    const updated: ActionDraft = {
      ...existing,
      status: newStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerName,
      reviewComment: reviewComment || (decision === 'APPROVED' ? 'Approved for execution.' : 'Declined.')
    };

    this.state.actions[idx] = updated;

    this.recordAudit({
      actionId: id,
      actor: reviewerName,
      eventType: decision === 'APPROVED' ? 'ACTION_APPROVED' : 'ACTION_REJECTED',
      details: `${decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'} action ${id}: "${existing.title}". Comment: ${updated.reviewComment}`,
      metadata: {
        actionId: id,
        decision,
        reviewer: reviewerName,
        comment: updated.reviewComment
      }
    });

    return updated;
  }

  public getAuditTrail(): AuditLog[] {
    return this.state.auditLogs;
  }

  public getItems() {
    return this.state.items;
  }
}

export const dataStore = new ProcurementDataStore();
