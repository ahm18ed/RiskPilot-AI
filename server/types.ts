export type Criticality = 'A' | 'B' | 'C';
export type SupplierStatus = 'APPROVED' | 'CONDITIONAL' | 'UNDER_REVIEW' | 'SUSPENDED';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertType =
  | 'PRICE_DEVIATION'
  | 'QUALITY_DETERIORATION'
  | 'DELIVERY_DELAYS'
  | 'COMPLIANCE_EXPIRING'
  | 'SINGLE_SOURCE'
  | 'COMBINED_RISK'
  | 'DATA_INCOMPLETE';

export type ActionType =
  | 'RFQ'
  | 'QUALITY_INSPECTION'
  | 'COMPLIANCE_REVIEW'
  | 'CONTRACT_RENEGOTIATION'
  | 'SECOND_SOURCE_QUALIFICATION';

export type ActionStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type Urgency = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'NORMAL';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  tier: number;
  category: string;
  status: SupplierStatus;
  contactName: string;
  contactEmail: string;
  onTimeDeliveryPct: number;
  defectRatePct: number;
  avgLeadTimeDays: number;
  annualSpendUsd: number;
  overallRiskLevel: Severity;
  notes?: string;
}

export interface ComponentItem {
  id: string;
  code: string;
  name: string;
  category: string;
  criticality: Criticality;
  unitOfMeasure: string;
  currentStock: number;
  minSafetyStock: number;
  avgDailyDemand: number;
  daysOfStockCover: number;
  primarySupplierId: string;
  approvedSupplierIds: string[];
  candidateSupplierIds: string[];
  unitCostBase: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  supplierId: string;
  itemId: string;
  agreedPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  status: 'ACTIVE' | 'EXPIRED' | 'RENEGOTIATION';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  itemId: string;
  orderDate: string;
  promisedDate: string;
  actualDeliveryDate: string | null;
  orderedQty: number;
  receivedQty: number;
  agreedUnitPrice: number;
  invoicedUnitPrice: number;
  priceDeviationPct: number;
  isLate: boolean;
  delayDays: number;
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
}

export interface InspectionLot {
  id: string;
  lotNumber: string;
  poId: string;
  supplierId: string;
  itemId: string;
  inspectionDate: string;
  sampleSize: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectionRatePct: number;
  defectCategory: string;
  severity: Severity;
  notes: string;
}

export type ComplianceDocType =
  | 'ISO_9001'
  | 'ISO_14001'
  | 'IATF_16949'
  | 'AS9100'
  | 'ROHS_REACH'
  | 'ITAR';

export interface ComplianceDoc {
  id: string;
  supplierId: string;
  docType: ComplianceDocType;
  docNumber: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  verificationUrl?: string;
}

export interface RiskAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  alertType: AlertType;
  severity: Severity;
  title: string;
  reason: string;
  supportingEvidence: string;
  metrics: {
    priceDeviationPct?: number;
    recentRejectionRatePct?: number;
    historicalRejectionRatePct?: number;
    lateDeliveryPct?: number;
    avgDelayDays?: number;
    daysUntilDocExpiry?: number;
    daysOfStockCover?: number;
    approvedSupplierCount?: number;
    leadTimeDays?: number;
    unauthorizedOverpaymentTotal?: number;
  };
  priorityScore: number;
  timestamp: string;
}

export interface DecisionOption {
  id: string;
  name: string;
  strategy: string;
  estimatedFinancialImpact: string;
  netCostUsd: number;
  leadTimeDays: number;
  qualityRiskImpact: string;
  complianceRiskImpact: string;
  stockOutRiskPct: number;
  assumptions: string[];
  advantages: string[];
  disadvantages: string[];
  isRecommended: boolean;
  actionDraftTemplate: {
    actionType: ActionType;
    title: string;
    urgency: Urgency;
    recommendedDeadlineDays: number;
    expectedOutcome: string;
    suggestedNotes: string;
  };
}

export interface ActionDraft {
  id: string;
  actionType: ActionType;
  title: string;
  supplierId: string;
  supplierName: string;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  reason: string;
  supportingEvidence: string;
  recommendedDeadline: string;
  urgency: Urgency;
  expectedOutcome: string;
  status: ActionStatus;
  assignedTo: string;
  notes: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface AuditLog {
  id: string;
  actionId?: string;
  timestamp: string;
  actor: string;
  eventType:
    | 'RECOMMENDATION_GENERATED'
    | 'SIMULATION_EVALUATED'
    | 'DRAFT_CREATED'
    | 'DRAFT_UPDATED'
    | 'ACTION_APPROVED'
    | 'ACTION_REJECTED'
    | 'SYSTEM_RECALCULATION'
    | 'DATASET_RESET'
    | 'USER_AUTHENTICATED'
    | 'USER_REGISTERED';
  details: string;
  metadata?: Record<string, any>;
}

export interface ThresholdConfig {
  priceDeviationWarningPct: number; // e.g. 3.0
  priceDeviationCriticalPct: number; // e.g. 5.0
  rejectionRateWarningPct: number; // e.g. 3.0
  rejectionRateCriticalPct: number; // e.g. 6.0
  complianceWarningDays: number; // e.g. 30
  complianceCriticalDays: number; // e.g. 10
  lowStockCoverDays: number; // e.g. 30
  lateDeliveryWarningPct: number; // e.g. 15.0
}

export type AgentOperationType =
  | 'PORTFOLIO_FINANCIAL_AUDIT'
  | 'INVENTORY_STRESS_TEST'
  | 'HEAD_TO_HEAD_COMPARISON'
  | 'SINGLE_SOURCE_BOTTLENECK_SCAN'
  | 'CUSTOM_ACTION_DRAFT_GENERATION'
  | 'SUPPLIER_RISK_INVESTIGATION'
  | 'EXECUTIVE_BRIEFING'
  | 'DECISION_SIMULATION'
  | 'ROOT_CAUSE_DEFECT_ANALYSIS'
  | 'LEGAL_DISPUTE_CURE_NOTICE'
  | 'SOURCING_SPLIT_OPTIMIZER'
  | 'COMPLIANCE_EXPIRY_HORIZON'
  | 'SENSITIVITY_THRESHOLD_ANALYSIS'
  | 'NEGOTIATION_PLAYBOOK'
  | 'DIRECT_ACTION_DISPATCH'
  | 'SUPPLIER_STATUS_UPDATE';

export interface OperationExecutionLog {
  operationType: AgentOperationType;
  operationName: string;
  parameters: Record<string, any>;
  computedMetrics: Record<string, any>;
  executionTimestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  operations?: OperationExecutionLog[];
  suggestedActionDraft?: Partial<ActionDraft>;
}
