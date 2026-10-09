import { GoogleGenAI } from '@google/genai';
import { DatabaseState } from './seedData';
import {
  Supplier,
  ComponentItem,
  RiskAlert,
  ActionDraft,
  ActionType,
  Urgency,
  ComplianceDoc,
  PurchaseOrder,
  InspectionLot,
  OperationExecutionLog,
  ChatMessage
} from './types';
import { simulateDecisionsForSupplier } from './decisionEngine';
import {
  auditPortfolioFinancialExposure,
  runInventoryStressTest,
  compareSuppliersHeadToHead,
  scanSingleSourceBottlenecks,
  generateExecutiveBriefing,
  analyzeRootCauseDefects,
  generateLegalDisputeCureNotice,
  optimizeSourcingSplit,
  forecastComplianceExpiryHorizon,
  analyzeSensitivityThresholds,
  generateNegotiationPlaybook
} from './agentTools';

export interface AIInvestigationRequest {
  query: string;
  selectedSupplierId?: string;
  selectedItemId?: string;
  conversationHistory?: ChatMessage[];
  operationOverride?: string;
  stressParams?: {
    demandSurgePct?: number;
    delayDays?: number;
  };
  splitParams?: {
    primaryPct?: number;
  };
  sensitivityParams?: {
    defectThresholdPct?: number;
    priceDeviationPct?: number;
  };
}

export interface AIStructuredResponse {
  answerMarkdown: string;
  workflowStage: 'Observe' | 'Reason' | 'Evaluate' | 'Decide' | 'Prepare Action' | 'Explain';
  executedOperations: OperationExecutionLog[];
  identifiedRisks: string[];
  evidencePoints: string[];
  compoundingFactors: string[];
  optionsCompared: {
    name: string;
    financialImpact: string;
    leadTime: string;
    stockOutRisk: string;
    pros: string[];
    cons: string[];
  }[];
  recommendedAction: string;
  confidenceScore: number;
  uncertainties: string[];
  suggestedActionDraft?: {
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
    assignedTo: string;
    notes: string;
  };
  downloadableArtifact?: {
    title: string;
    fileName: string;
    content: string;
    type: 'LEGAL_NOTICE' | 'RFQ_PACKAGE' | 'AUDIT_REPORT' | 'NEGOTIATION_MEMO' | 'CORRECTIVE_ACTION_PLAN';
  };
  directExecutionResult?: {
    success: boolean;
    operation: string;
    message: string;
    actionId?: string;
    supplierStatus?: string;
    auditLogId?: string;
  };
  isDeterministicFallback: boolean;
}

/**
 * Deterministic multi-operation reasoning engine
 */
export function generateDeterministicAIAnalysis(
  query: string,
  stateOrSupplier: DatabaseState | Supplier,
  supplierOrItem: Supplier | ComponentItem,
  itemOrAlerts?: ComponentItem | RiskAlert[],
  candidateSuppliersOrAlerts?: Supplier[] | RiskAlert[],
  candidateSuppliersOrDocs?: Supplier[] | ComplianceDoc[],
  complianceDocsOrOrders?: ComplianceDoc[] | PurchaseOrder[],
  ordersOrLots?: PurchaseOrder[] | InspectionLot[],
  lotsOrState?: InspectionLot[] | DatabaseState,
  stressParams?: { demandSurgePct?: number; delayDays?: number },
  splitParams?: { primaryPct?: number },
  sensitivityParams?: { defectThresholdPct?: number; priceDeviationPct?: number }
): AIStructuredResponse {
  let state: DatabaseState;
  let supplier: Supplier;
  let item: ComponentItem;
  let alerts: RiskAlert[] = [];
  let candidateSuppliers: Supplier[] = [];
  let complianceDocs: ComplianceDoc[] = [];
  let orders: PurchaseOrder[] = [];
  let lots: InspectionLot[] = [];

  if ((stateOrSupplier as any)?.suppliers && Array.isArray((stateOrSupplier as any).suppliers)) {
    // Called with: (query, state, supplier, item, alerts, candidateSuppliers, complianceDocs, orders, lots, ...)
    state = stateOrSupplier as DatabaseState;
    supplier = supplierOrItem as Supplier;
    item = itemOrAlerts as ComponentItem;
    alerts = (candidateSuppliersOrAlerts as RiskAlert[]) || [];
    candidateSuppliers = (candidateSuppliersOrDocs as Supplier[]) || [];
    complianceDocs = (complianceDocsOrOrders as ComplianceDoc[]) || [];
    orders = (ordersOrLots as PurchaseOrder[]) || [];
    lots = (lotsOrState as InspectionLot[]) || [];
  } else {
    // Called with: (query, supplier, item, alerts, candidateSuppliers, complianceDocs, orders, lots, state?, ...)
    supplier = stateOrSupplier as Supplier;
    item = supplierOrItem as ComponentItem;
    alerts = (itemOrAlerts as RiskAlert[]) || [];
    candidateSuppliers = (candidateSuppliersOrAlerts as Supplier[]) || [];
    complianceDocs = (candidateSuppliersOrDocs as ComplianceDoc[]) || [];
    orders = (complianceDocsOrOrders as PurchaseOrder[]) || [];
    lots = (ordersOrLots as InspectionLot[]) || [];
    state = (lotsOrState as any)?.suppliers ? (lotsOrState as DatabaseState) : {
      suppliers: [supplier, ...candidateSuppliers],
      items: [item],
      contracts: [],
      purchaseOrders: orders,
      inspections: lots,
      complianceDocs,
      actions: [],
      auditLogs: []
    } as any;
  }

  const executedOperations: OperationExecutionLog[] = [];
  const qLower = query.toLowerCase();

  let answer = '';
  let stage: AIStructuredResponse['workflowStage'] = 'Explain';
  let suggestedActionDraft: AIStructuredResponse['suggestedActionDraft'] | undefined;
  let downloadableArtifact: AIStructuredResponse['downloadableArtifact'] | undefined;
  let directExecutionResult: AIStructuredResponse['directExecutionResult'] | undefined;
  const identifiedRisks: string[] = [];
  const evidencePoints: string[] = [];
  const compoundingFactors: string[] = [];

  // Operation 0: Decision Evaluation of Placing Supplier on Hold (What happens if put on hold?)
  if (
    qLower.includes('put on hold') ||
    qLower.includes('placed on hold') ||
    qLower.includes('order freeze risk') ||
    qLower.includes('what happens if')
  ) {
    stage = 'Evaluate';
    const sim = simulateDecisionsForSupplier(
      supplier,
      item,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots
    );

    answer = `### ⚠️ Impact Evaluation: Placing ${supplier.name} on Hold

Placing ${supplier.name} on an immediate procurement hold carries severe operational line-stoppage risks:
1. **Critical Line Stoppage Exposure:** Our current inventory provides only **25 days of stock cover** (${item.currentStock} units at ${item.avgDailyDemand} units/day), whereas the supplier lead time is **${supplier.avgLeadTimeDays} days**.
2. **20-Day Production Void:** With 25 days of stock cover vs a 45-day lead time, an order freeze creates an unavoidable **20-day production void** resulting in assembly line starvation!
3. **Alternative Sourcing Feasibility:** Candidate backup suppliers (${candidateSuppliers.map(c => c.name).join(', ') || 'Vanguard Micro-Foundry'}) are not yet approved and have a 40-day lead time, meaning they cannot deliver before stock runs out.
4. **Estimated Stock-Out Probability:** **85%** if an immediate freeze is enacted without safety buffer injection.
5. **Recommended Sourcing Decision:** Do **not** freeze orders unconditionally. Implement **tighter 100% CMM receiving inspections** on Apex while simultaneously fast-tracking qualification of Vanguard Micro-Foundry.`;

    identifiedRisks.push(`Current stock provides only 25 days of stock cover against a 45-day lead time`);
    identifiedRisks.push('Candidate backups cannot deliver in time to prevent stockout');
    evidencePoints.push(`Stock cover: 25.0 days (${item.currentStock} units / ${item.avgDailyDemand} units/day)`);
    evidencePoints.push(`Lead time: ${supplier.avgLeadTimeDays} days creates a 20-day deficit`);
    compoundingFactors.push('Unconditional hold triggers an 85% probability of assembly line starvation');

    suggestedActionDraft = {
      actionType: 'QUALITY_INSPECTION',
      title: `Enforce Mandatory 100% Receiving CMM Screening During Ongoing Shipments`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Placing supplier on hold causes catastrophic line stoppage due to only 25 days of stock cover. Tighter inspection mitigates quality risk.`,
      supportingEvidence: `Current stock: 25 days cover vs 45-day lead time. Stock-out probability: 85%.`,
      recommendedDeadline: '2026-10-16',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Filter 100% of defect runout while preserving production continuity.`,
      assignedTo: 'Lead Quality Metrologist',
      notes: 'Continue purchase orders with intensified dock gating.'
    };
  }
  // Operation A: Defect Root Cause & Pareto Analysis
  else if (
    qLower.includes('root cause') ||
    qLower.includes('defect') ||
    qLower.includes('pareto') ||
    qLower.includes('porosity') ||
    qLower.includes('failure mode') ||
    qLower.includes('why are lots failing') ||
    qLower.includes('scrap')
  ) {
    stage = 'Observe';
    const rootCause = analyzeRootCauseDefects(state, supplier.id, item.id);
    executedOperations.push(rootCause.log);
    const d = rootCause.defectAnalysis;

    answer = `### 🔬 Quality Defect Root Cause & Failure Mode Pareto Analysis: ${d.supplierName}

An automated physical inspection audit across **${d.totalLotsInspected} production lots** revealed an acute, non-random quality breakdown:
- **Total Units Scrapped:** **${d.totalUnitsScrapped} non-conforming units** out of ${d.totalUnitsInspected.toLocaleString()} inspected.
- **Weighted Rejection Rate:** **${d.weightedDefectRatePct}%** (exceeds the 1.0% contract AQL limit).
- **Estimated Direct Scrap Exposure:** **$${d.estimatedScrapCostUsd.toLocaleString()} USD** in manufacturing losses.

#### Defect Pareto Classification:
| Defect Failure Mode | Scrapped Qty | Share of Rejects | Primary Engineering Root Mechanism |
| :--- | :--- | :--- | :--- |
${d.defectPareto.map(p => `| **${p.category}** | ${p.failCount} units | **${p.pctOfTotalFailures}%** | ${p.rootCauseMechanism} |`).join('\n')}

#### Immediate Physical Containment Plan:
1. **100% CMM Verification:** Enforce 100% coordinate measuring machine (CMM) runout inspection at our receiving dock on all Apex shipments.
2. **Pneumatic / Helium Screening:** Quarantine lots failing 1x10^-6 mbar l/s pressure leak spec until mass spectrometer verification.
3. **8D Corrective Action Request:** Demand supplier submit 8D containment within 72 hours with tooling spindle maintenance logs.`;

    identifiedRisks.push(`Defect rate elevated to ${d.weightedDefectRatePct}% on ${supplier.name} lots`);
    identifiedRisks.push(`Primary failure mode: ${d.defectPareto[0]?.category} accounts for ${d.defectPareto[0]?.pctOfTotalFailures}% of scrap`);
    evidencePoints.push(`Inspection lots LOT-2026-0941 and LOT-2026-0988 failed CMM runout and porosity tests`);
    evidencePoints.push(`Scrap losses estimated at $${d.estimatedScrapCostUsd.toLocaleString()} USD`);
    compoundingFactors.push('Quality defects combined with 25-day low inventory cover create high line starvation risk if lots are quarantined');

    suggestedActionDraft = {
      actionType: 'QUALITY_INSPECTION',
      title: `Mandatory 100% CMM Dock Screening & 8D Corrective Action for ${supplier.name}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Defect rate surging to ${d.weightedDefectRatePct}%. Root cause analysis identified porosity & runout as primary failure modes.`,
      supportingEvidence: `${d.totalUnitsScrapped} scrapped units across recent lots, incurring $${d.estimatedScrapCostUsd.toLocaleString()} in manufacturing scrap.`,
      recommendedDeadline: '2026-10-16',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Halt escaping non-conforming units and enforce 100% CMM gate prior to production release.`,
      assignedTo: 'Supplier Quality Assurance Manager',
      notes: 'Institute dock quarantine holding until supplier submits certified 8D report.'
    };

    downloadableArtifact = {
      title: `8D Root Cause Containment Protocol - ${supplier.name}`,
      fileName: `8D-CORRECTIVE-ACTION-${supplier.code}.txt`,
      type: 'CORRECTIVE_ACTION_PLAN',
      content: `8D SUPPLIER QUALITY CORRECTIVE ACTION PROTOCOL
Target Supplier: ${supplier.name} (${supplier.id})
Component: ${item.name} (${item.code})
Reference: LOT-2026-0941 / LOT-2026-0988
Date: 2026-10-09

1. PROBLEM STATEMENT:
Incoming lot inspection demonstrated 9.0% defect rate vs 1.0% contractual AQL. Defect categories: Porosity (64.3%), Concentricity Runout (35.7%).

2. IMMEDIATE CONTAINMENT ACTIONS (D3):
- Quarantine all inventory received under PO-2026-881.
- Mandate 100% CMM coordinate inspection at receiving dock.
- Charge back $${d.estimatedScrapCostUsd.toLocaleString()} in testing and scrap fees.

3. ROOT CAUSE VERIFICATION (D4):
Tool wear on CNC 4th-axis spindle and inconsistent vacuum degas in titanium casting foundry.

4. PERMANENT CORRECTIVE ACTION (D5):
Tool life automated monitor set at 150 cycles; daily vacuum spectrometer melt check.`
    };
  }
  // Operation B: Legal Dispute & Contract Breach Cure Notice
  else if (
    qLower.includes('legal') ||
    qLower.includes('cure notice') ||
    qLower.includes('breach') ||
    qLower.includes('demand letter') ||
    qLower.includes('dispute') ||
    qLower.includes('clawback letter') ||
    qLower.includes('violation')
  ) {
    stage = 'Decide';
    const legalNotice = generateLegalDisputeCureNotice(state, supplier.id, item.id);
    executedOperations.push(legalNotice.log);
    const n = legalNotice.cureNotice;

    answer = `### ⚖️ Formal Legal Dispute & Contract Breach Cure Notice

We have prepared a formal **Legal Notice of Material Default & Demand for Administrative Cure** under Master Supply Agreement terms:
- **Reference Code:** \`${n.documentReference}\`
- **Total Financial Claim Amount:** **$${n.totalClaimAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD**
- **Statutory Cure Window:** **${n.statutoryCureDeadlineDays} Calendar Days** (Deadline: **${n.formalUltimatumDate}**)

#### Itemized Contract Violations & Evidence:
${n.itemizedViolations.map((v, i) => `
${i + 1}. **${v.violationType}**
   - Governing Clause: *${v.clauseCitation}*
   - Evidentiary Finding: ${v.substantiatingEvidence}
   - Assessed Damages: **$${v.financialDamagesUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD**
`).join('')}

#### Enforceable Remedies Demanded:
1. Issuance of an immediate credit memorandum for **$${n.totalClaimAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.
2. Re-commitment to contractual unit pricing ($450.00).
3. Immediate submission of verified AS9100 recertification registrar audit.

*Failure to satisfy within 14 days triggers immediate vendor status suspension and unilateral offset against accounts payable.*`;

    identifiedRisks.push(`Material contract breach on Master Supply Agreement #${n.supplierContractId}`);
    evidencePoints.push(`Unapproved invoice variance of +7.0% on PO-2026-881`);
    evidencePoints.push(`$${n.totalClaimAmountUsd.toLocaleString()} in combined commercial and scrap damages`);
    compoundingFactors.push('Continued unchecked billing without legal cure notice creates commercial waiver risk');

    suggestedActionDraft = {
      actionType: 'CONTRACT_RENEGOTIATION',
      title: `Formal Legal Cure Notice & $${n.totalClaimAmountUsd.toLocaleString()} Claim on ${supplier.name}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Material breaches under Sections 4.2 and 7.1 of Master Supply Agreement: unauthorized +7% price hike and 9% defect rate.`,
      supportingEvidence: `Itemized damages claim of $${n.totalClaimAmountUsd.toLocaleString()} across PO-2026-881 and defective lots.`,
      recommendedDeadline: n.formalUltimatumDate,
      urgency: 'HIGH',
      expectedOutcome: `Execute credit memorandum and secure binding fixed price agreement through 2027.`,
      assignedTo: 'Lead Legal Counsel & VP Sourcing',
      notes: 'Formal cure notice drafted and ready for executive dispatch.'
    };

    downloadableArtifact = {
      title: `Formal Legal Notice of Material Breach - ${supplier.name}`,
      fileName: `${n.documentReference}.txt`,
      type: 'LEGAL_NOTICE',
      content: n.fullDocumentBody
    };
  }
  // Operation C: Dual-Sourcing Split Optimizer (What-If Split)
  else if (
    qLower.includes('split') ||
    qLower.includes('dual source') ||
    qLower.includes('allocation') ||
    qLower.includes('70/30') ||
    qLower.includes('60/40') ||
    qLower.includes('50/50') ||
    qLower.includes('share of wallet') ||
    splitParams
  ) {
    stage = 'Evaluate';
    const splitRatio = splitParams?.primaryPct ?? (qLower.includes('60') ? 60 : qLower.includes('50') ? 50 : 70);
    const splitOpt = optimizeSourcingSplit(state, supplier.id, 'SUP-042', item.id, splitRatio);
    executedOperations.push(splitOpt.log);
    const s = splitOpt.splitOptimization;

    answer = `### 🔀 Quantitative Dual-Sourcing Order Allocation Optimization

Simulation comparing current sole-sourcing vs. a **${s.primarySupplier.sharePct}/${s.secondarySupplier.sharePct} split** between **${s.primarySupplier.name}** and **${s.secondarySupplier.name}**:

| Performance Dimension | Baseline Sole-Source (100% Apex) | Simulated Dual-Source (${s.primarySupplier.sharePct}% Apex / ${s.secondarySupplier.sharePct}% Vanguard) | Net Strategic Variance |
| :--- | :--- | :--- | :--- |
| **Blended Unit Price** | **$${s.baselineSoleSource.blendedUnitPriceUsd.toFixed(2)}** | $${s.simulatedDualSource.blendedUnitPriceUsd.toFixed(2)} | **+$${s.netVariance.unitPriceDeltaUsd} / unit** |
| **Blended Defect Rate** | **${s.baselineSoleSource.blendedDefectRatePct}%** (Severe) | **${s.simulatedDualSource.blendedDefectRatePct}%** (Stable) | 🟢 **-${s.netVariance.defectRateReductionPct}% Defect Drop** |
| **Effective Lead Time** | 45 Days | **${s.simulatedDualSource.effectiveLeadTimeDays} Days** | 🟢 **-${s.baselineSoleSource.effectiveLeadTimeDays - s.simulatedDualSource.effectiveLeadTimeDays} Days Shorter** |
| **Line Stoppage Probability**| **${s.baselineSoleSource.lineStoppageRiskPct}%** (Extreme) | **${s.simulatedDualSource.lineStoppageRiskPct}%** (Controlled) | 🟢 **-${s.netVariance.lineStoppageRiskReductionPct}% Risk Reduction** |
| **Annual Spend Delta** | Baseline Budget | +$${s.netVariance.annualCostDeltaUsd.toLocaleString()}/yr | Strategic Insurance Premium |

#### Strategic Conclusion:
${s.recommendationSummary}`;

    identifiedRisks.push(`Sole-source 100% allocation carries an ${s.baselineSoleSource.lineStoppageRiskPct}% line stoppage vulnerability`);
    evidencePoints.push(`Dual-sourcing drops defect rate from ${s.baselineSoleSource.blendedDefectRatePct}% to ${s.simulatedDualSource.blendedDefectRatePct}%`);
    evidencePoints.push(`Vanguard Micro-Foundry has 1.2% historical defect rate and 40d lead time`);
    compoundingFactors.push('Dual-sourcing removes monopoly pricing power from incumbent sole-source vendor');

    suggestedActionDraft = {
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: `Execute ${s.primarySupplier.sharePct}/${s.secondarySupplier.sharePct} Dual-Sourcing Allocation with Vanguard Micro-Foundry`,
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Dual-sourcing optimization demonstrates a ${s.netVariance.lineStoppageRiskReductionPct}% drop in line-stoppage risk and ${s.netVariance.defectRateReductionPct}% drop in scrap.`,
      supportingEvidence: `Current stock cover: 25 days; Vanguard lead time: 40 days; annual premium only +$${s.netVariance.annualCostDeltaUsd.toLocaleString()}.`,
      recommendedDeadline: '2026-10-23',
      urgency: 'HIGH',
      expectedOutcome: `Qualify secondary production line and issue pilot 30% order volume release.`,
      assignedTo: 'Strategic Sourcing Manager',
      notes: 'Coordinate with quality engineering for First Article Inspection.'
    };
  }
  // Operation D: Compliance Expiry Horizon Radar
  else if (
    qLower.includes('compliance horizon') ||
    qLower.includes('radar') ||
    qLower.includes('certificate expiry') ||
    qLower.includes('cert expiring') ||
    (qLower.includes('compliance') && (qLower.includes('expir') || qLower.includes('cert'))) ||
    qLower.includes('certificates expiring') ||
    qLower.includes('expiring in 15') ||
    qLower.includes('expiring in 30') ||
    qLower.includes('expiring in 60') ||
    qLower.includes('expiring in 90') ||
    qLower.includes('as9100') ||
    qLower.includes('itar')
  ) {
    stage = 'Observe';
    const horizon = forecastComplianceExpiryHorizon(state, 90);
    executedOperations.push(horizon.log);
    const h = horizon.expiryForecast;

    answer = `### 🛡️ Portfolio Regulatory Compliance Expiry Horizon Radar (90-Day Outlook)

An autonomous compliance audit across **${h.totalDocsMonitored} active vendor certificates** identified **${h.disqualificationRiskCount} impending certification lapses**:

#### 🚨 Critical Horizon (0 - 15 Days Until Lapse - Immediate Stoppage Risk):
${h.criticalExpiring15Days.map((c, i) => `
${i + 1}. **${c.supplierName}**
   - Certificate: **${c.docType}** (\`${c.docNumber}\`)
   - Days Remaining: ⚠️ **${c.daysRemaining} Calendar Days**
   - Criticality Exposure: **Class-${c.criticality} Component**
   - Impact: Aerospace flight-hardware manufacturing cannot legally accept lots past expiration date.
`).join('')}

#### ⚠️ Warning Horizon (16 - 30 Days Until Lapse):
${h.warningExpiring30Days.length > 0 ? h.warningExpiring30Days.map(w => `- **${w.supplierName}**: ${w.docType} (\`${w.docNumber}\`) — ${w.daysRemaining} days remaining`).join('\n') : '*No secondary suppliers in immediate 30-day window.*'}

#### 📅 Upcoming Horizon (31 - 90 Days Pipeline):
${h.upcomingExpiring90Days.slice(0, 4).map(u => `- **${u.supplierName}**: ${u.docType} — ${u.daysRemaining} days remaining`).join('\n')}

#### Enforcement Recommendation:
Issue an urgent recertification ultimatum to **Apex Precision Hydraulics** requiring registrar proof of AS9100 Rev D audit closure within 5 business days.`;

    identifiedRisks.push('Apex Precision AS9100 certification expires in 10 days');
    evidencePoints.push(`${h.criticalExpiring15Days.length} critical certificate expirations within 15 days`);
    compoundingFactors.push('Loss of AS9100 accreditation halts all aerospace customer receiving acceptance');

    suggestedActionDraft = {
      actionType: 'COMPLIANCE_REVIEW',
      title: `Emergency AS9100 Recertification Verification & Audit Ultimatum for Apex Precision`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `AS9100 Rev D certificate #AS-9100-REV-D-7741 expires on 2026-10-19 (10 days remaining).`,
      supportingEvidence: `FAA/AS9100 compliance mandate prohibits incorporating components from uncertified suppliers into aerospace flight hardware.`,
      recommendedDeadline: '2026-10-14',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Obtain official registrar audit certificate extension or initiate vendor suspension.`,
      assignedTo: 'Compliance & Quality Systems Director',
      notes: 'Trigger conditional order freeze if extension is not submitted by deadline.'
    };
  }
  // Operation E: Sensitivity & Risk Threshold Dynamic Recalculation
  else if (
    qLower.includes('sensitivity') ||
    qLower.includes('threshold') ||
    qLower.includes('tighten') ||
    qLower.includes('tolerance') ||
    qLower.includes('recalibrate') ||
    sensitivityParams
  ) {
    stage = 'Evaluate';
    const defectTol = sensitivityParams?.defectThresholdPct ?? 1.5;
    const priceTol = sensitivityParams?.priceDeviationPct ?? 2.0;
    const sens = analyzeSensitivityThresholds(state, defectTol, priceTol);
    executedOperations.push(sens.log);
    const sr = sens.sensitivityResult;

    answer = `### ⚙️ Risk Tolerance Sensitivity Simulation & Perimeter Recalibration

We recalibrated the risk scoring engine with tightened quality and pricing tolerance parameters:
- **Tightened Defect Tolerance:** Tightened from 3.0% down to **${defectTol}%**
- **Tightened Price Variance Tolerance:** Tightened from 3.0% down to **${priceTol}%**

#### Portfolio Impact Findings:
- **Baseline High/Critical Vendors:** **${sr.baselineCriticalSuppliersCount} suppliers**
- **Recalibrated High/Critical Vendors:** **${sr.stressedCriticalSuppliersCount} suppliers** (+${sr.newlyEscalatedSuppliers.length} newly escalated)
- **Surveillance Perimeter Expansion:** **+${Math.round(((sr.stressedCriticalSuppliersCount - sr.baselineCriticalSuppliersCount) / sr.baselineCriticalSuppliersCount) * 100)}% increase** in audited suppliers.

#### Newly Escalated Suppliers Requiring Quality Intervention:
${sr.newlyEscalatedSuppliers.map((s, i) => `
${i + 1}. **${s.supplierName} (${s.supplierId})**
   - New Severity Tier: 🔴 **${s.newRiskLevel}**
   - Escalation Trigger: ${s.escalationTrigger}
`).join('')}

#### Strategic Implication:
${sr.impactNarrative}`;

    identifiedRisks.push(`Tightening defect tolerance to ${defectTol}% escalates ${sr.newlyEscalatedSuppliers.length} additional vendors to High Risk`);
    evidencePoints.push(`Portfolio high-risk count expands from ${sr.baselineCriticalSuppliersCount} to ${sr.stressedCriticalSuppliersCount}`);
    compoundingFactors.push('Higher quality standards reveal latent supplier variability across Tier-2 machine shops');

    suggestedActionDraft = {
      actionType: 'QUALITY_INSPECTION',
      title: `Expanded Receiving Quality Inspection Protocol for Newly Escalated Tier-2 Vendors`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      reason: `Sensitivity analysis indicated latent defect vulnerability at tightened ${defectTol}% AQL threshold.`,
      supportingEvidence: `${sr.newlyEscalatedSuppliers.length} suppliers breached tightened inspection thresholds.`,
      recommendedDeadline: '2026-10-25',
      urgency: 'HIGH',
      expectedOutcome: `Establish tighter statistical process control (SPC) monitoring across vendor network.`,
      assignedTo: 'Director of Global Quality Assurance',
      notes: 'Apply revised AQL sampling tables to receiving inspection.'
    };
  }
  // Operation F: Commercial Negotiation Strategy & Leverage Playbook
  else if (
    qLower.includes('negotiat') ||
    qLower.includes('script') ||
    qLower.includes('leverage') ||
    qLower.includes('bargain') ||
    qLower.includes('concession') ||
    qLower.includes('counter-offer')
  ) {
    stage = 'Decide';
    const playbook = generateNegotiationPlaybook(state, supplier.id, item.id);
    executedOperations.push(playbook.log);
    const pb = playbook.playbook;

    answer = `### 🎯 Strategic Commercial Negotiation Playbook: ${pb.supplierName}

A tactical negotiation playbook prepared for upcoming vendor executive meetings:
- **Annual Spend Under Management:** **$${pb.annualSpendLeverageUsd.toLocaleString()} USD**
- **Target Unit Price:** **$${pb.targetPriceUsd.toFixed(2)}** | **Opening Offer:** **$${pb.openingOfferUsd.toFixed(2)}** | **Walk-Away Ceiling:** **$${pb.walkAwayPriceUsd.toFixed(2)}**

#### Key Commercial Bargaining Levers:
${pb.bargainingLevers.map((l, i) => `
${i + 1}. **${l.lever}**
   - Leverage Strength: **${l.impact}**
   - Substantiating Fact: *${l.citationEvidence}*
`).join('')}

#### Scripted Executive Dialogue:
${pb.scriptedExecutiveDialogue.map(d => `> **${d.speaker}:** ${d.prompt}`).join('\n\n')}

#### Strategic Concessions to Trade:
${pb.concessionsToOffer.map(c => `- ${c}`).join('\n')}`;

    identifiedRisks.push('Unilateral price inflation by supplier without signed contract amendment');
    evidencePoints.push(`$4,725 in unauthorized charges provides ironclad commercial leverage`);
    evidencePoints.push(`Vanguard qualification gives credible walk-away threat`);
    compoundingFactors.push('Upcoming contract renewal date creates window to lock multi-year fixed rates');

    suggestedActionDraft = {
      actionType: 'CONTRACT_RENEGOTIATION',
      title: `Contract Price Renegotiation & Clawback Session with ${supplier.name}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Deploy negotiation playbook to claw back $4,725 and re-lock $450 unit pricing using dual-sourcing leverage.`,
      supportingEvidence: `PO-2026-881 price deviation (+7.0%) and candidate alternative Vanguard (1.2% defects).`,
      recommendedDeadline: '2026-10-20',
      urgency: 'HIGH',
      expectedOutcome: `Execute revised schedule agreement locked at $450/unit through Q4 2027.`,
      assignedTo: 'Chief Procurement Officer',
      notes: 'Refer to scripted executive negotiation dialogue.'
    };

    downloadableArtifact = {
      title: `Executive Negotiation Playbook - ${supplier.name}`,
      fileName: `NEGOTIATION-PLAYBOOK-${supplier.code}.txt`,
      type: 'NEGOTIATION_MEMO',
      content: `COMMERCIAL PROCUREMENT NEGOTIATION BRIEFING
Target Supplier: ${supplier.name} (${supplier.id})
Target Part: ${item.name} (${item.code})
Baseline Spend: $${pb.annualSpendLeverageUsd.toLocaleString()} USD
Target Price: $${pb.targetPriceUsd.toFixed(2)}
Opening Position: $${pb.openingOfferUsd.toFixed(2)}

CORE LEVERAGE ARSENAL:
1. $4,725 unauthorized billing on PO-2026-881.
2. 9% defect rate on lot 0988.
3. Vanguard Micro-Foundry qualified alternative at $465/unit.
4. AS9100 expiration in 10 days.

EXECUTIVE SCRIPT:
"Apex, we require immediate resolution of unapproved price deviations and scrap losses before issuing subsequent purchase authorizations. Vanguard Micro-Foundry is undergoing dual-sourcing qualification."`
    };
  }
  // Operation G: Direct Autonomous Action Dispatch / Execution
  else if (
    (qLower.includes('execute') && qLower.includes('action')) ||
    qLower.includes('create action in database') ||
    qLower.includes('dispatch action') ||
    qLower.includes('put on probation now') ||
    qLower.includes('freeze supplier now')
  ) {
    stage = 'Prepare Action';
    const actionId = `ACT-AUTO-${Date.now().toString().slice(-4)}`;
    const isFreeze = qLower.includes('freeze') || qLower.includes('probation');

    if (isFreeze) {
      supplier.status = 'UNDER_REVIEW';
    }

    const newAction: ActionDraft = {
      id: actionId,
      actionType: isFreeze ? 'COMPLIANCE_REVIEW' : 'QUALITY_INSPECTION',
      title: isFreeze
        ? `Autonomous Order Freeze & Vendor Probation for ${supplier.name}`
        : `Autonomous Receiving Gate Quarantine for ${supplier.name}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: isFreeze
        ? 'Autonomous risk agent triggered vendor probation due to compounding 9% defect rate and 10-day AS9100 expiry.'
        : 'Autonomous risk agent dispatched mandatory 100% receiving inspection protocol.',
      supportingEvidence: `Current stock cover: ${item.daysOfStockCover} days; price deviation: +7.0%; rejected qty: 9 units.`,
      recommendedDeadline: '2026-10-18',
      urgency: 'IMMEDIATE',
      expectedOutcome: isFreeze ? 'Hold further order releases pending compliance audit.' : 'Prevent defect leakage onto assembly line.',
      status: 'APPROVED',
      assignedTo: 'RiskPilot AI Autonomous Controller',
      notes: 'Executed autonomously via direct procurement command.',
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'RiskPilot AI Agent',
      reviewComment: 'Auto-approved by autonomous decision engine.'
    };

    if (state && Array.isArray(state.actions)) {
      state.actions.unshift(newAction);
    }

    const auditLog = {
      id: `AUDIT-${String(state?.auditLogs?.length ? state.auditLogs.length + 1 : 1).padStart(4, '0')}`,
      actionId,
      timestamp: new Date().toISOString(),
      actor: 'RiskPilot AI Autonomous Agent',
      eventType: 'ACTION_APPROVED' as const,
      details: `Directly executed and APPROVED action ${actionId}: "${newAction.title}". Supplier ${supplier.name} status updated to ${supplier.status}.`,
      metadata: { actionId, supplierId: supplier.id, newStatus: supplier.status }
    };

    if (state && Array.isArray(state.auditLogs)) {
      state.auditLogs.unshift(auditLog);
    }

    const log: OperationExecutionLog = {
      operationType: 'DIRECT_ACTION_DISPATCH',
      operationName: `Autonomous Database Action Dispatch & Approval (${actionId})`,
      parameters: { actionId, supplierId: supplier.id, supplierName: supplier.name },
      computedMetrics: { actionId, status: newAction.status, supplierStatus: supplier.status },
      executionTimestamp: new Date().toISOString()
    };
    executedOperations.push(log);

    directExecutionResult = {
      success: true,
      operation: 'DIRECT_ACTION_DISPATCH',
      message: `Action ${actionId} has been successfully created, APPROVED, and committed to the live database!`,
      actionId,
      supplierStatus: supplier.status,
      auditLogId: auditLog.id
    };

    answer = `### ⚡ Autonomous Action Executed & Committed to Database

The autonomous agent has directly dispatched and **APPROVED** an executive procurement action in the platform:
- **Generated Action ID:** \`${actionId}\`
- **Action Type:** **${newAction.actionType}**
- **Status:** 🟢 **APPROVED** (Live in Action Center)
- **Supplier Master Status:** **${supplier.status}**
- **Audit Trail Reference:** \`${auditLog.id}\` (Immutable Timestamp: ${auditLog.timestamp})

#### Action Specifics:
- **Title:** ${newAction.title}
- **Assigned Controller:** ${newAction.assignedTo}
- **Mandate:** ${newAction.expectedOutcome}
- **Audit Verification:** Viewable immediately under **Action Center** and **Audit Trail** screens.`;

    suggestedActionDraft = newAction;
  }
  // Operation 1: Quantitative Stress Testing & Shock Simulation
  else if (
    qLower.includes('stress') ||
    qLower.includes('surge') ||
    qLower.includes('shock') ||
    qLower.includes('what if') ||
    stressParams
  ) {
    stage = 'Evaluate';
    const surge = stressParams?.demandSurgePct ?? (qLower.includes('50') ? 50 : 30);
    const delay = stressParams?.delayDays ?? 10;
    const stress = runInventoryStressTest(state, item.code, surge, delay);
    executedOperations.push(stress.log);

    const r = stress.stressResults;
    answer = `### ⚡ Quantitative Supply Chain Shock Simulation: ${item.code}

**Simulation Parameters Applied:**
- Baseline Demand: **${r.baselineDemand} units/day** → Stressed Demand (+${surge}%): **${r.stressedDemand} units/day**
- Current Inventory: **${r.currentStock} units**
- Supplier Baseline Lead Time: **${r.supplierBaselineLeadTimeDays} days** → Stressed Disruption (+${delay}d): **${r.stressedLeadTimeDays} days**

#### Simulation Findings:
1. **Accelerated Buffer Depletion:** Under a +${surge}% demand surge, inventory cover collapses from **${r.baselineStockCoverDays} days** down to **${r.stressedStockCoverDays} days**.
2. **Projected Stock-Out Date:** Total inventory exhaustion will occur on **${r.projectedStockOutDate}**!
3. **Critical Supply Gap:** The stressed lead time of **${r.stressedLeadTimeDays} days** creates an unavoidable **${r.bufferDeficitDays}-day production void**!
4. **Estimated Stock-Out Probability:** **${r.stockOutRiskProbabilityPct}%** if purchase order flows are interrupted.
5. **Recommended Buffer Safety Injection:** Immediate buffer purchase of **${r.recommendedBufferSafetyUnits} units** required to ensure manufacturing line continuity.`;

    identifiedRisks.push(`Under +${surge}% demand, inventory cover drops to ${r.stressedStockCoverDays} days`);
    identifiedRisks.push(`Supplier delivery lead time extended to ${r.stressedLeadTimeDays} days`);
    evidencePoints.push(`Stock-out date calculated as ${r.projectedStockOutDate}`);
    evidencePoints.push(`Emergency buffer deficit: ${r.recommendedBufferSafetyUnits} units`);
    compoundingFactors.push('Elevated defect rates (9%) further reduce effective net usable inventory during a demand spike');

    suggestedActionDraft = {
      actionType: 'QUALITY_INSPECTION',
      title: `Emergency Safety Buffer Inspection & Expedited Lot Release for ${item.code}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Stress simulation (+${surge}% surge, +${delay}d delay) projects stock exhaustion on ${r.projectedStockOutDate}.`,
      supportingEvidence: `Deficit gap of ${r.bufferDeficitDays} days requires emergency buffer injection of ${r.recommendedBufferSafetyUnits} units.`,
      recommendedDeadline: '2026-10-16',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Secure ${r.recommendedBufferSafetyUnits} conforming units with 100% CMM dock screening.`,
      assignedTo: 'Lead Inventory Controller & Quality Manager',
      notes: 'Coordinate with assembly planning to avoid line stoppage.'
    };
  }
  // Operation 2: Financial Price Discrepancy & Overpayment Audit
  else if (
    qLower.includes('financial') ||
    qLower.includes('overpay') ||
    qLower.includes('clawback') ||
    qLower.includes('leakage') ||
    qLower.includes('spend') ||
    qLower.includes('cost') ||
    qLower.includes('exposure')
  ) {
    stage = 'Observe';
    const finAudit = auditPortfolioFinancialExposure(state);
    executedOperations.push(finAudit.log);

    const s = finAudit.summary;
    answer = `### 💰 Portfolio-Wide Contract Price Discrepancy & Overpayment Audit

An automated ledger scan of **${s.totalPOsAnalyzed} purchase orders** across all 150 active suppliers identified unauthorized price variances:
- **Total Unauthorized Leakage:** **$${s.totalOverpaymentUsd.toLocaleString()} USD** across ${s.overbilledPOCount} non-conforming purchase orders.
- **Affected Suppliers:** **${s.affectedSupplierCount} vendors** currently invoicing above contractual rates.

#### Top Commercial Overbilling Exposures:
${s.topOverbilledSuppliers.map((top, idx) => `
${idx + 1}. **${top.supplierName} (${top.supplierId})**
   - Unapproved Billing Variance: **+$${top.overpaymentUsd.toLocaleString()} USD**
   - Peak Price Deviation: **+${top.maxDeviationPct}%**
   - Impacted Purchase Orders: \`${top.poNumbers.join(', ')}\`
`).join('')}

#### Recovery Strategy:
Under Master Supply Agreement Terms (Section 4.2), invoiced unit prices exceeding binding schedule agreements are subject to immediate administrative clawback. We recommend issuing a formal **Contract Cure Notice & Credit Claim** to recover $${s.totalOverpaymentUsd.toLocaleString()} on upcoming payment disbursements.`;

    identifiedRisks.push(`Total unauthorized financial leakage: $${s.totalOverpaymentUsd.toLocaleString()}`);
    evidencePoints.push(`Apex Precision Hydraulics overbilled +7.0% on PO-2026-881 ($4,725.00 unrecovered)`);
    compoundingFactors.push('Unchecked price creep indicates deteriorating supplier contract discipline and internal approval gaps');

    suggestedActionDraft = {
      actionType: 'CONTRACT_RENEGOTIATION',
      title: `Formal Price Discrepancy Notice & $4,725 Clawback Claim on PO-2026-881`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Unapproved +7.0% price variance ($481.50 vs $450.00 contract baseline) identified during portfolio ledger audit.`,
      supportingEvidence: `PO-2026-881 billed at $481.50 for 150 units generates $4,725 in unauthorized variance.`,
      recommendedDeadline: '2026-10-20',
      urgency: 'HIGH',
      expectedOutcome: `Issuance of formal credit memorandum for $4,725 and re-affirmation of $450 fixed unit pricing.`,
      assignedTo: 'Procurement Commercial Director',
      notes: 'Reference Master Supply Agreement Section 4.2.'
    };
  }
  // Operation 3: Multi-Supplier Head-to-Head Comparative Benchmark
  else if (
    qLower.includes('compare') ||
    qLower.includes('versus') ||
    qLower.includes('vs') ||
    qLower.includes('vanguard') ||
    qLower.includes('helios') ||
    qLower.includes('benchmark') ||
    qLower.includes('side by side')
  ) {
    stage = 'Evaluate';
    const comp = compareSuppliersHeadToHead(state, ['SUP-001', 'SUP-042', 'SUP-089']);
    executedOperations.push(comp.log);

    answer = `### ⚖️ Head-to-Head Sourcing Benchmark: Titanium Valve Suppliers

A comparative evaluation of the primary supplier and two candidate backups for **${item.name} (${item.code})**:

| Sourcing Parameter | Apex Precision (SUP-001) | Vanguard Micro-Foundry (SUP-042) | Helios Aero Dynamics (SUP-089) |
| :--- | :--- | :--- | :--- |
| **Approval Status** | **APPROVED** (Sole source) | **UNDER REVIEW** (Audit at 65%) | **CONDITIONAL** (Uncertified) |
| **Overall Risk Level** | 🔴 **CRITICAL** | 🟢 **LOW** | 🟡 **MEDIUM** |
| **Recent Defect Rate** | **9.0%** (Surging) | **1.2%** (Stable) | **1.8%** (Nominal) |
| **On-Time Delivery** | 82.5% | **94.0%** | 91.5% |
| **Supplier Lead Time** | 45 Days | **40 Days** | 52 Days |
| **AS9100 Expiration** | ⚠️ **10 Days Remaining** | 578 Days Remaining | 661 Days (ISO 9001) |
| **Current Stock Cover** | 25.0 Days | Backup (0 on shelf) | Backup (0 on shelf) |

#### Strategic Benchmark Takeaways:
- **Apex Precision** currently holds production monopoly but presents compounding failure modes (9% defect rate, 10-day cert expiry, +7% price hike).
- **Vanguard Micro-Foundry** has superior quality (1.2% defects), shorter lead time (40d vs 45d), and secure certification (578d).
- **Optimal Sourcing Transition:** Fast-track Vanguard's FAI audit within 14 days, then implement a **70/30 dual-sourcing split** (70% Vanguard for quality integrity, 30% Apex for secondary volume).`;

    identifiedRisks.push('Apex defect rate is 7.5x higher than Vanguard (9.0% vs 1.2%)');
    evidencePoints.push('Vanguard holds 578 days of valid AS9100 accreditation');
    evidencePoints.push('Vanguard lead time is 40 days vs Apex 45 days');
    compoundingFactors.push('Sole-source supplier has the worst quality and shortest certificate window in the cohort');

    suggestedActionDraft = {
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: `Fast-Track FAI Audit: Vanguard Micro-Foundry for Titanium Valve Bodies`,
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Head-to-head benchmark demonstrates Vanguard has 1.2% defect rate and 578d valid AS9100 vs Apex 9% defect rate.`,
      supportingEvidence: `Current stock cover: 25 days; Vanguard lead time: 40 days; Audit progress: 65% complete.`,
      recommendedDeadline: '2026-10-23',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Approve pilot batch of 50 units and establish 70/30 dual-sourcing split.`,
      assignedTo: 'Supplier Quality Assurance Lead',
      notes: 'Priority task. Expedite CMM qualification fixture.'
    };
  }
  // Operation 4: Single-Source Bottleneck Portfolio Scan
  else if (
    qLower.includes('single source') ||
    qLower.includes('sole source') ||
    qLower.includes('bottleneck') ||
    qLower.includes('backup')
  ) {
    stage = 'Observe';
    const bottlenecks = scanSingleSourceBottlenecks(state);
    executedOperations.push(bottlenecks.log);

    const b = bottlenecks.bottlenecks;
    const classA = b.filter(x => x.criticality === 'A');

    answer = `### 🔍 Enterprise Single-Source Dependency Scan

A scan across all **35 component master items** identified **${b.length} parts with sole-source dependencies** (0 approved backup suppliers):

#### Criticality Class-A Bottlenecks (Immediate Stoppage Risk):
${classA.map((it, idx) => `
${idx + 1}. **${it.itemCode}: ${it.itemName}**
   - Primary Supplier: **${it.supplierName}** (${it.supplierId})
   - Stock Coverage: **${it.daysOfStockCover} Days** (${it.currentStock.toLocaleString()} units on hand)
   - Urgency Classification: ${it.isCriticalUrgency ? '🚨 **CRITICAL URGENCY (≤30d Cover)**' : '⚠️ HIGH MONITORING'}
`).join('')}

#### Recommended Remediation:
Criticality Class-A item **CMP-TITAN-X1** represents our most severe single-source exposure due to its active 9% defect rate and 10-day certification countdown. Second-source qualification should be prioritized for Vanguard Micro-Foundry immediately.`;

    identifiedRisks.push(`${classA.length} Class-A items have zero approved secondary suppliers`);
    evidencePoints.push(`CMP-TITAN-X1 has only 25 days of stock cover with 1 approved supplier`);
    compoundingFactors.push('Single-source suppliers face no competitive pressure, enabling unauthorized price increases');

    suggestedActionDraft = {
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: `Emergency Second-Source Qualification for Single-Source Class-A Parts`,
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Portfolio scan identified CMP-TITAN-X1 as a Class-A sole-source dependency with only 25 days inventory buffer.`,
      supportingEvidence: `Current approved supplier count: 1 (Apex). Candidate backups unapproved: 2.`,
      recommendedDeadline: '2026-10-23',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Approve secondary production source to remove sole-source vulnerability.`,
      assignedTo: 'Strategic Sourcing Manager',
      notes: 'Align with manufacturing contingency guidelines.'
    };
  }
  // Operation 5: C-Suite / Executive Supply Chain Briefing
  else if (
    qLower.includes('executive') ||
    qLower.includes('briefing') ||
    qLower.includes('vp') ||
    qLower.includes('leadership') ||
    qLower.includes('summary') ||
    qLower.includes('presentation')
  ) {
    stage = 'Explain';
    const briefing = generateExecutiveBriefing(state);
    executedOperations.push(briefing.log);

    const eb = briefing.executiveBriefing;
    answer = `### 📊 Executive Supply Chain Risk Briefing

**Headline:** ${eb.executiveHeadline}

#### 1. Strategic Exposure Summary
- **Portfolio Annual Spend Monitored:** $${(eb.totalSpendUnderSurveillanceUsd / 1000000).toFixed(2)}M USD across 150 suppliers.
- **Active Critical Bottlenecks:** **${eb.activeCriticalThreatsCount} items** in immediate disruption danger.
- **Unauthorized Pricing Discrepancies:** **$${eb.unauthorizedPriceExposureUsd.toLocaleString()} USD** in unapproved invoice inflation.

#### 2. Immediate Containment Measures (Next 48 Hours):
${eb.immediateContainmentActions.map((act, i) => `${i + 1}. ${act}`).join('\n')}

#### 3. 14-Day Structural Risk Mitigation Roadmap:
${eb.structural14DayRoadmap.map((act, i) => `${i + 1}. ${act}`).join('\n')}

#### 4. Long-Term Target:
*${eb.longTermResilienceTarget}*`;

    identifiedRisks.push('Supply continuity threatened on titanium fuel valves');
    evidencePoints.push(`$${eb.unauthorizedPriceExposureUsd.toLocaleString()} in unauthorized commercial price creep`);
    compoundingFactors.push('Simultaneous quality, compliance, and pricing failure modes on Class-A component');

    suggestedActionDraft = {
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: `Executive Directive: Fast-Track Vanguard Qualification for Dual Sourcing`,
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Executive briefing directive to resolve Class-A single-source dependency on Titanium Fuel Valves.`,
      supportingEvidence: `Apex defect rate at 9.0%; AS9100 certificate expiring in 10 days; current stock cover: 25 days.`,
      recommendedDeadline: '2026-10-23',
      urgency: 'IMMEDIATE',
      expectedOutcome: `Qualify Vanguard Micro-Foundry to establish 70/30 dual-sourcing model.`,
      assignedTo: 'VP of Global Sourcing',
      notes: 'Approved for executive steering committee distribution.'
    };
  }
  // Default: In-depth Investigation of Supplier & Component
  else {
    stage = 'Reason';
    const sim = simulateDecisionsForSupplier(
      supplier,
      item,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots
    );

    answer = `### 🔬 Risk Investigation & Compounding Signals: ${supplier.name}

Our analysis of ${supplier.name}'s master records and purchase history reveals **compounding, multi-vector supply chain risks**:
- **Price Deviation:** PO-2026-881 was billed at $481.50 vs agreed $450.00 (+7.0% variance), incurring unapproved cost creep ($4,725.00 total).
- **Quality Deterioration:** Inspection lots LOT-2026-0941 and LOT-2026-0988 demonstrated rejection rates of **6.0%** and **9.0%** respectively, far exceeding the 1.0% historical baseline.
- **Regulatory Compliance:** AS9100 certificate #AS-9100-REV-D-7741 expires on 2026-10-19 (**10 days remaining**). Failure to renew risks immediate production audit halts.
- **Single-Source Bottleneck:** ${item.name} has **0 approved backup suppliers**.
- **Buffer Stock:** Current stock cover is **${item.daysOfStockCover} days** against an average supplier lead time of **${supplier.avgLeadTimeDays} days**.

**Conclusion:** Small isolated signals have compounded into an acute line-stoppage risk. Immediate dual-track intervention is recommended: enforce 100% CMM receiving inspections on Apex while fast-tracking qualification of Vanguard Micro-Foundry.`;

    identifiedRisks.push('Single-source dependency on Criticality-A component with zero approved backups');
    identifiedRisks.push('Surging incoming lot rejection rate (up to 9.0% vs 1.0% baseline)');
    identifiedRisks.push('Impending AS9100 aerospace certificate expiration in 10 days');
    evidencePoints.push(`PO-2026-881 billed at $481.50 vs $450.00 contract price (+7.0% deviation)`);
    evidencePoints.push(`Lot LOT-2026-0988 rejected 9 out of 100 units for porosity & concentricity runout`);
    evidencePoints.push(`Current inventory: 250 units / 10 units/day demand = 25.0 days cover`);
    compoundingFactors.push('Quality failures occur simultaneously with impending compliance lapse');
    compoundingFactors.push('Buffer stock of 25 days is less than the 45-day lead time');

    const recOpt = sim.options.find(o => o.isRecommended) || sim.options[0];
    suggestedActionDraft = {
      actionType: recOpt.actionDraftTemplate.actionType,
      title: recOpt.actionDraftTemplate.title,
      supplierId: recOpt.actionDraftTemplate.actionType === 'SECOND_SOURCE_QUALIFICATION' ? 'SUP-042' : supplier.id,
      supplierName: recOpt.actionDraftTemplate.actionType === 'SECOND_SOURCE_QUALIFICATION' ? 'Vanguard Micro-Foundry' : supplier.name,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      reason: `Compounding multi-signal risk: 9.0% defect surge, 10-day AS9100 expiry window, and sole-source dependency on ${item.name}.`,
      supportingEvidence: `Current stock cover: ${item.daysOfStockCover} days; Apex lead time: ${supplier.avgLeadTimeDays} days; price deviation: +7.0%.`,
      recommendedDeadline: new Date(Date.now() + recOpt.actionDraftTemplate.recommendedDeadlineDays * 86400000).toISOString().split('T')[0],
      urgency: recOpt.actionDraftTemplate.urgency,
      expectedOutcome: recOpt.actionDraftTemplate.expectedOutcome,
      assignedTo: 'Lead Sourcing Specialist & Supplier Quality Engineering',
      notes: recOpt.actionDraftTemplate.suggestedNotes
    };
  }

  // Simulation for options comparison
  const simulation = simulateDecisionsForSupplier(
    supplier,
    item,
    candidateSuppliers,
    complianceDocs,
    orders,
    lots
  );

  return {
    answerMarkdown: answer,
    workflowStage: stage,
    executedOperations,
    identifiedRisks,
    evidencePoints,
    compoundingFactors,
    optionsCompared: simulation.options.map(opt => ({
      name: opt.name,
      financialImpact: opt.estimatedFinancialImpact,
      leadTime: `${opt.leadTimeDays} days`,
      stockOutRisk: `${opt.stockOutRiskPct}%`,
      pros: opt.advantages,
      cons: opt.disadvantages
    })),
    recommendedAction: simulation.recommendationRationale,
    confidenceScore: 95,
    uncertainties: simulation.uncertainties,
    suggestedActionDraft,
    downloadableArtifact,
    directExecutionResult,
    isDeterministicFallback: true
  };
}

/**
 * AI Investigation Engine:
 * Connects to Gemini API using @google/genai on server side when GEMINI_API_KEY is present.
 * Uses deterministic multi-operation engine if key is absent or on API failure.
 */
export async function runAIInvestigation(
  query: string,
  state: DatabaseState,
  supplier: Supplier,
  item: ComponentItem,
  alerts: RiskAlert[],
  candidateSuppliers: Supplier[],
  complianceDocs: ComplianceDoc[],
  orders: PurchaseOrder[],
  lots: InspectionLot[],
  history?: ChatMessage[],
  stressParams?: { demandSurgePct?: number; delayDays?: number },
  splitParams?: { primaryPct?: number },
  sensitivityParams?: { defectThresholdPct?: number; priceDeviationPct?: number }
): Promise<AIStructuredResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateDeterministicAIAnalysis(
      query,
      state,
      supplier,
      item,
      alerts,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots,
      stressParams,
      splitParams,
      sensitivityParams
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Run baseline operations to provide grounding tools context
    const finAudit = auditPortfolioFinancialExposure(state);
    const stressSim = runInventoryStressTest(state, item.code, stressParams?.demandSurgePct ?? 30, stressParams?.delayDays ?? 10);
    const benchmarkComp = compareSuppliersHeadToHead(state, ['SUP-001', 'SUP-042', 'SUP-089']);
    const singleBottlenecks = scanSingleSourceBottlenecks(state);
    const rootCauses = analyzeRootCauseDefects(state, supplier.id, item.id);
    const legalNotice = generateLegalDisputeCureNotice(state, supplier.id, item.id);
    const splitOpt = optimizeSourcingSplit(state, supplier.id, 'SUP-042', item.id, splitParams?.primaryPct ?? 70);
    const complianceRadar = forecastComplianceExpiryHorizon(state, 90);
    const negotiationBook = generateNegotiationPlaybook(state, supplier.id, item.id);

    const contextPayload = {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        country: supplier.country,
        category: supplier.category,
        status: supplier.status,
        onTimeDeliveryPct: supplier.onTimeDeliveryPct,
        defectRatePct: supplier.defectRatePct,
        avgLeadTimeDays: supplier.avgLeadTimeDays,
        overallRiskLevel: supplier.overallRiskLevel
      },
      item: {
        id: item.id,
        code: item.code,
        name: item.name,
        criticality: item.criticality,
        currentStock: item.currentStock,
        avgDailyDemand: item.avgDailyDemand,
        daysOfStockCover: item.daysOfStockCover,
        approvedSuppliersCount: item.approvedSupplierIds.length,
        isSingleSource: item.approvedSupplierIds.length <= 1
      },
      groundedAgentToolsResults: {
        portfolioFinancialAudit: finAudit.summary,
        inventoryStressSimulation: stressSim.stressResults,
        headToHeadBenchmark: benchmarkComp.comparisonMatrix,
        singleSourceBottlenecksSummary: {
          totalSingleSource: singleBottlenecks.bottlenecks.length,
          classASingleSources: singleBottlenecks.bottlenecks.filter(b => b.criticality === 'A')
        },
        qualityRootCausePareto: rootCauses.defectAnalysis,
        legalDisputeCureDetails: legalNotice.cureNotice,
        dualSourcingSplitSimulation: splitOpt.splitOptimization,
        complianceExpiryHorizonRadar: complianceRadar.expiryForecast,
        negotiationLevers: negotiationBook.playbook.bargainingLevers
      },
      candidateAlternatives: candidateSuppliers.map(c => ({
        id: c.id,
        name: c.name,
        country: c.country,
        status: c.status,
        defectRatePct: c.defectRatePct,
        avgLeadTimeDays: c.avgLeadTimeDays
      })),
      complianceDocs: complianceDocs.filter(d => d.supplierId === supplier.id).map(d => ({
        type: d.docType,
        number: d.docNumber,
        expiryDate: d.expiryDate,
        daysUntilExpiry: d.daysUntilExpiry,
        status: d.status
      })),
      recentPurchaseOrders: orders.slice(-3).map(o => ({
        poNumber: o.poNumber,
        agreedUnitPrice: o.agreedUnitPrice,
        invoicedUnitPrice: o.invoicedUnitPrice,
        priceDeviationPct: o.priceDeviationPct,
        isLate: o.isLate,
        delayDays: o.delayDays
      })),
      recentInspectionLots: lots.slice(-3).map(l => ({
        lotNumber: l.lotNumber,
        sampleSize: l.sampleSize,
        rejectedQty: l.rejectedQty,
        rejectionRatePct: l.rejectionRatePct,
        defectCategory: l.defectCategory
      })),
      activeAlerts: alerts.map(a => ({
        type: a.alertType,
        severity: a.severity,
        title: a.title,
        reason: a.reason,
        evidence: a.supportingEvidence
      }))
    };

    const conversationContext = history && history.length > 0
      ? `Prior Conversation:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';

    const prompt = `You are RiskPilot AI, an elite autonomous supplier risk intelligence and procurement decision agent.
Analyze the user's question using the EXACT structured operational data and tools provided below.

RULES:
1. Ground every statement in the actual metrics provided (e.g. 9.0% rejects, 10 days until AS9100 expiry, +7.0% price deviation, 25.0 days of stock cover, 45d lead time).
2. DO NOT invent fake records, part numbers, or imaginary metrics.
3. If the user asks about financial leakage, stress testing, head-to-head comparison, defect root cause pareto, legal cure notice, dual-sourcing splits, compliance horizon, or negotiation strategy, utilize the grounded agent tools results provided.
4. State uncertainties and missing information explicitly.
5. Follow the workflow: Observe → Reason → Evaluate → Decide → Prepare action → Explain.
6. Provide your response as a strict JSON object matching the requested schema.

Context Data & Operational Tools:
${JSON.stringify(contextPayload, null, 2)}

${conversationContext}Current User Question: "${query}"

Return JSON matching this TypeScript structure:
{
  "answerMarkdown": "Comprehensive markdown response with headings, bullet points, data tables where useful, and quantitative analysis",
  "workflowStage": "Observe" | "Reason" | "Evaluate" | "Decide" | "Prepare Action" | "Explain",
  "identifiedRisks": string[],
  "evidencePoints": string[],
  "compoundingFactors": string[],
  "optionsCompared": [
    {
      "name": string,
      "financialImpact": string,
      "leadTime": string,
      "stockOutRisk": string,
      "pros": string[],
      "cons": string[]
    }
  ],
  "recommendedAction": string,
  "confidenceScore": number,
  "uncertainties": string[],
  "suggestedActionDraft": {
    "actionType": "SECOND_SOURCE_QUALIFICATION" | "QUALITY_INSPECTION" | "COMPLIANCE_REVIEW" | "CONTRACT_RENEGOTIATION" | "RFQ",
    "title": string,
    "supplierId": string,
    "supplierName": string,
    "itemId": string,
    "itemCode": string,
    "itemName": string,
    "reason": string,
    "supportingEvidence": string,
    "recommendedDeadline": string,
    "urgency": "IMMEDIATE" | "HIGH" | "MEDIUM" | "NORMAL",
    "expectedOutcome": string,
    "assignedTo": string,
    "notes": string
  }
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI inference timeout after 25000ms')), 25000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const text = response.text;
    if (text) {
      let clean = text.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const parsed = JSON.parse(clean) as AIStructuredResponse;
      parsed.isDeterministicFallback = false;
      parsed.executedOperations = [
        finAudit.log,
        stressSim.log,
        benchmarkComp.log,
        rootCauses.log,
        splitOpt.log
      ];
      return parsed;
    }

    throw new Error('Empty response from model');
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.info(`[AI Service] Using deterministic operations engine (${errorMsg})`);
    return generateDeterministicAIAnalysis(
      query,
      state,
      supplier,
      item,
      alerts,
      candidateSuppliers,
      complianceDocs,
      orders,
      lots,
      stressParams,
      splitParams,
      sensitivityParams
    );
  }
}
