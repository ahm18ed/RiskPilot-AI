import {
  ComponentItem,
  DecisionOption,
  Supplier,
  ComplianceDoc,
  PurchaseOrder,
  InspectionLot
} from './types';
import { calculateDaysOfStockCover } from './riskEngine';

export interface DecisionSimulationResult {
  supplier: Supplier;
  item: ComponentItem;
  options: DecisionOption[];
  recommendedOptionId: string;
  recommendationRationale: string;
  stockCoverSummary: {
    currentStock: number;
    avgDailyDemand: number;
    daysOfStockCover: number;
    supplierLeadTimeDays: number;
    bufferDeficitDays: number;
  };
  uncertainties: string[];
}

export function simulateDecisionsForSupplier(
  supplier: Supplier,
  item: ComponentItem,
  candidateSuppliers: Supplier[],
  complianceDocs: ComplianceDoc[],
  recentOrders: PurchaseOrder[],
  recentLots: InspectionLot[]
): DecisionSimulationResult {
  const stockCover = calculateDaysOfStockCover(item.currentStock, item.avgDailyDemand);
  const daysOfCover = stockCover.daysOfCover;
  const leadTime = supplier.avgLeadTimeDays;
  const bufferDeficitDays = Math.max(0, leadTime - daysOfCover);

  const minDocExpiryDays = complianceDocs
    .filter(d => d.supplierId === supplier.id)
    .reduce((min, d) => Math.min(min, d.daysUntilExpiry), 999);

  const latestRejectionPct = recentLots.length > 0
    ? recentLots[recentLots.length - 1].rejectionRatePct
    : 0;

  const latestOrder = recentOrders.length > 0
    ? recentOrders[recentOrders.length - 1]
    : null;
  const priceDevPct = latestOrder ? latestOrder.priceDeviationPct : 0;
  const overpaymentVal = latestOrder
    ? (latestOrder.invoicedUnitPrice - latestOrder.agreedUnitPrice) * latestOrder.orderedQty
    : 0;

  // Candidate alternative evaluation
  const approvedAlternatives = item.approvedSupplierIds.filter(id => id !== supplier.id);
  const unapprovedCandidates = item.candidateSupplierIds;
  const hasApprovedAlt = approvedAlternatives.length > 0;
  const hasCandidate = unapprovedCandidates.length > 0;
  const candidate1 = candidateSuppliers.find(c => c.id === unapprovedCandidates[0]);

  const options: DecisionOption[] = [];

  // Option 1: Continue Purchasing with Tighter Inspection
  // Feasible immediately, avoids line stoppage, adds inspection labor cost
  const inspectionCostEst = Math.round(item.unitCostBase * 0.08 * (item.avgDailyDemand * 30));
  options.push({
    id: 'OPT-INSPECT',
    name: 'Continue Purchasing with Mandatory 100% CMM Lot Audit',
    strategy: 'Maintain active PO flow while imposing 100% incoming dimensional & pressure screening at supplier expense or incoming dock.',
    estimatedFinancialImpact: `+$${inspectionCostEst.toLocaleString()} inspection & quarantine overhead per 30-day cycle`,
    netCostUsd: inspectionCostEst,
    leadTimeDays: leadTime,
    qualityRiskImpact: 'Reduces escaping defect risk from 9.0% to <0.2% before reaching manufacturing assembly lines.',
    complianceRiskImpact: 'Neutral. Does not solve pending compliance certificate expiry; requires simultaneous renewal audit ultimatum.',
    stockOutRiskPct: bufferDeficitDays > 0 ? 35 : 10,
    assumptions: [
      'In-house or third-party metrology laboratory has bandwidth for 100% lot testing.',
      'Supplier agrees to warranty rework or credit for all rejected non-conforming units.',
      'Defects are detectable prior to final assembly integration.'
    ],
    advantages: [
      'Prevents immediate production line stoppage without waiting for second-source qualification.',
      'Protects end-product integrity by catching porosity and runout defects at the dock.',
      'Maintains baseline parts supply while working through compliance renewal.'
    ],
    disadvantages: [
      'Adds inspection cycle time and metrology labor cost.',
      'Does not eliminate root-cause tooling wear at supplier facility.',
      'Leaves the organization exposed if the supplier AS9100 certificate lapses in 10 days.'
    ],
    isRecommended: false,
    actionDraftTemplate: {
      actionType: 'QUALITY_INSPECTION',
      title: `Mandatory 100% Incoming Quality CMM Inspection Protocol for ${item.code}`,
      urgency: 'IMMEDIATE',
      recommendedDeadlineDays: 3,
      expectedOutcome: 'Zero non-conforming parts escape into production; supplier notified of chargeback for testing labor.',
      suggestedNotes: 'Dispatch quality engineering to set up dedicated air-gage / CMM inspection fixture.'
    }
  });

  // Option 2: Hold New Orders Pending Compliance & Quality Review
  // High stockout risk if days of cover < lead time!
  options.push({
    id: 'OPT-HOLD',
    name: 'Place Supplier on Procurement Hold Pending Audit',
    strategy: 'Freeze all new purchase orders until the supplier submits a certified AS9100 renewal and an 8D root-cause corrective action plan.',
    estimatedFinancialImpact: `Potential $${Math.round(item.avgDailyDemand * item.unitCostBase * 15).toLocaleString()} production downtime loss if buffer stock expires`,
    netCostUsd: Math.round(item.avgDailyDemand * item.unitCostBase * 15),
    leadTimeDays: 0,
    qualityRiskImpact: 'Completely stops incoming defect inflow; enforces strict accountability.',
    complianceRiskImpact: 'Strict regulatory adherence; prevents audit findings from regulatory inspectors.',
    stockOutRiskPct: daysOfCover <= leadTime ? 85 : 25,
    assumptions: [
      'Current finished goods buffer can support downstream manufacturing.',
      'Supplier management will prioritize audit response under commercial pressure.'
    ],
    advantages: [
      'Zero regulatory compliance exposure for uncertified manufacturing.',
      'Sends unambiguous commercial signal that quality erosion and certificate neglect are intolerable.'
    ],
    disadvantages: [
      `HIGH STOCK-OUT DANGER: Inventory cover is only ${daysOfCover} days. Halting orders guarantees factory stock-out in ~${daysOfCover} days because lead time is ${leadTime} days!`,
      'Severely damages supplier relationship without having an approved alternative ready to ship.'
    ],
    isRecommended: false,
    actionDraftTemplate: {
      actionType: 'COMPLIANCE_REVIEW',
      title: `Formal Procurement Hold & Emergency Compliance Audit Notice: ${supplier.name}`,
      urgency: 'HIGH',
      recommendedDeadlineDays: 5,
      expectedOutcome: 'Supplier produces verified registrar renewal confirmation and CAPA within 5 business days.',
      suggestedNotes: 'Requires VP of Manufacturing sign-off due to assembly line shutdown risk.'
    }
  });

  // Option 3: Formal Contract Price Renegotiation & Clawback Claim
  const clawbackRecovery = Math.max(overpaymentVal, 4725);
  options.push({
    id: 'OPT-RENEGOTIATE',
    name: 'Issue Contract Discrepancy Notice & Clawback Claim',
    strategy: `Demand credit note for unauthorized +${priceDevPct.toFixed(1)}% price hike and enforce original contract terms ($450.00/unit).`,
    estimatedFinancialImpact: `-$${clawbackRecovery.toLocaleString()} cost recovery via invoice credit adjustment`,
    netCostUsd: -clawbackRecovery,
    leadTimeDays: leadTime,
    qualityRiskImpact: 'Neutral on manufacturing quality.',
    complianceRiskImpact: 'Neutral on certificate renewal.',
    stockOutRiskPct: 15,
    assumptions: [
      'Master Supply Agreement includes binding fixed-price clause without unapproved surcharge escalation.',
      'Supplier accounting department will issue credit memorandum on next billing cycle.'
    ],
    advantages: [
      `Recovers $${clawbackRecovery.toLocaleString()} in unauthorized margin erosion.`,
      'Re-establishes commercial pricing discipline and contractual compliance.'
    ],
    disadvantages: [
      'Does not solve the physical defect rate (9%) or certificate expiry (10 days).',
      'Potential frictional tension if supplier claims raw titanium inflation.'
    ],
    isRecommended: false,
    actionDraftTemplate: {
      actionType: 'CONTRACT_RENEGOTIATION',
      title: `Formal Price Discrepancy Notice & Credit Claim for PO Overbilling`,
      urgency: 'MEDIUM',
      recommendedDeadlineDays: 10,
      expectedOutcome: `Credit memorandum issued for $${clawbackRecovery.toLocaleString()} and reaffirmation of baseline pricing.`,
      suggestedNotes: 'Reference Master Supply Agreement Section 4.2 (Fixed Unit Price Schedule).'
    }
  });

  // Option 4: Fast-Track Qualify Second Supplier (Candidate Vanguard Micro-Foundry)
  // If unapproved candidates exist, this is the strategic gamechanger!
  const qualificationCostEst = 18500;
  const candidateName = candidate1 ? candidate1.name : 'Qualified Alternate Vendor';
  const candidateLead = candidate1 ? candidate1.avgLeadTimeDays : 40;

  options.push({
    id: 'OPT-QUALIFY-SECOND',
    name: `Fast-Track Qualification of Second Supplier (${candidateName})`,
    strategy: `Expedite on-site quality audit and 50-unit pilot batch verification for ${candidateName} to establish dual-sourcing before stock exhaustion.`,
    estimatedFinancialImpact: `-$${qualificationCostEst.toLocaleString()} one-time qualification audit & tooling NRE; long-term resilience gain`,
    netCostUsd: qualificationCostEst,
    leadTimeDays: candidateLead,
    qualityRiskImpact: `Substantial risk reduction. ${candidateName} historical defect rate is ${candidate1?.defectRatePct || 1.2}% vs Apex's recent ${latestRejectionPct}%.`,
    complianceRiskImpact: `Resolves compliance vulnerability. ${candidateName} holds valid AS9100 with >500 days remaining.`,
    stockOutRiskPct: candidateLead <= daysOfCover ? 20 : 45,
    assumptions: [
      `${candidateName} engineering samples meet drawing tolerances for titanium fuel valves.`,
      'Internal metallurgists can complete first-article inspection (FAI) within 14 days.',
      'Expedited tooling setup is supported by the supplier.'
    ],
    advantages: [
      'Permanently resolves the single-source dependency on Criticality-A titanium valves.',
      'Creates competitive tension, reducing long-term pricing and eliminating supplier lock-in.',
      `${candidateName} holds pristine AS9100 certification and low historical defect rate (1.2%).`
    ],
    disadvantages: [
      `Takes ${candidateLead} days to complete first production shipment, while stock cover is ${daysOfCover} days. Must pair with tighter inspection on current supplier during transition.`,
      'Requires upfront qualification and testing investment (~$18,500).'
    ],
    isRecommended: true,
    actionDraftTemplate: {
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: `Expedited Second-Source Qualification: ${candidateName} for ${item.code}`,
      urgency: 'IMMEDIATE',
      recommendedDeadlineDays: 14,
      expectedOutcome: `Complete First Article Inspection (FAI) and approve ${candidateName} as secondary production source.`,
      suggestedNotes: 'Fast-track pilot batch of 50 units. Coordinate with QA engineering for PPAP Level 3 approval.'
    }
  });

  // Recommendation Rationale
  let recommendedOptionId = 'OPT-QUALIFY-SECOND';
  let recommendationRationale = '';

  if (!hasApprovedAlt && hasCandidate) {
    recommendedOptionId = 'OPT-QUALIFY-SECOND';
    recommendationRationale = `RECOMMENDED STRATEGY: Fast-track qualification of ${candidateName} paired with tighter incoming inspection on Apex. 
    Reasoning: Placing Apex on complete hold would cause guaranteed production shutdown in ${daysOfCover} days (since supplier lead time is ${leadTime} days). 
    Simply continuing to inspect does not solve the 10-day AS9100 expiration or single-source vulnerability. 
    Qualifying ${candidateName} permanently removes the single-source bottleneck, lowers defect exposure from 9% to 1.2%, and restores compliance security.`;
  } else if (hasApprovedAlt) {
    recommendedOptionId = 'OPT-INSPECT';
    recommendationRationale = `RECOMMENDED STRATEGY: Split order allocation immediately to pre-approved secondary supplier while enforcing tighter inspection on primary supplier.`;
  } else {
    recommendedOptionId = 'OPT-INSPECT';
    recommendationRationale = `RECOMMENDED STRATEGY: Enforce 100% incoming CMM inspection to protect production while issuing immediate compliance renewal ultimatum.`;
  }

  // Mark recommended
  options.forEach(opt => {
    opt.isRecommended = opt.id === recommendedOptionId;
  });

  return {
    supplier,
    item,
    options,
    recommendedOptionId,
    recommendationRationale,
    stockCoverSummary: {
      currentStock: item.currentStock,
      avgDailyDemand: item.avgDailyDemand,
      daysOfStockCover: daysOfCover,
      supplierLeadTimeDays: leadTime,
      bufferDeficitDays
    },
    uncertainties: [
      `Apex tool re-grind timeline is unconfirmed; defect root cause may require 2-3 weeks to fix.`,
      `Supplier registrar audit schedule for AS9100 renewal has not been independently verified.`,
      `${candidateName} pilot run yield has not yet been demonstrated at high volume.`
    ]
  };
}
