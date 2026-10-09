import {
  ComponentItem,
  Contract,
  InspectionLot,
  PurchaseOrder,
  ComplianceDoc,
  Supplier,
  RiskAlert,
  Severity,
  ThresholdConfig
} from './types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  priceDeviationWarningPct: 3.0,
  priceDeviationCriticalPct: 6.0,
  rejectionRateWarningPct: 3.0,
  rejectionRateCriticalPct: 5.0,
  complianceWarningDays: 30,
  complianceCriticalDays: 10,
  lowStockCoverDays: 30,
  lateDeliveryWarningPct: 15.0,
};

// Reference current date for simulated procurement system: Oct 9, 2026
export const SIMULATED_TODAY = new Date('2026-10-09T00:00:00Z');

/**
 * 1. Price deviation calculation
 */
export function calculatePriceDeviation(contractPrice: number, invoicedPrice: number): {
  deviationPct: number;
  dollarDiff: number;
  isFlagged: boolean;
  severity: Severity;
} {
  if (contractPrice <= 0 || invoicedPrice <= 0 || isNaN(contractPrice) || isNaN(invoicedPrice)) {
    return { deviationPct: 0, dollarDiff: 0, isFlagged: false, severity: 'LOW' };
  }

  const dollarDiff = invoicedPrice - contractPrice;
  const deviationPct = ((invoicedPrice - contractPrice) / contractPrice) * 100;

  let severity: Severity = 'LOW';
  let isFlagged = false;

  if (deviationPct >= DEFAULT_THRESHOLDS.priceDeviationCriticalPct) {
    severity = 'CRITICAL';
    isFlagged = true;
  } else if (deviationPct >= DEFAULT_THRESHOLDS.priceDeviationWarningPct) {
    severity = 'HIGH';
    isFlagged = true;
  }

  return {
    deviationPct: Number(deviationPct.toFixed(2)),
    dollarDiff: Number(dollarDiff.toFixed(2)),
    isFlagged,
    severity
  };
}

/**
 * 2. Quality rejection rate calculation
 */
export function calculateRejectionRate(rejectedQty: number, sampleSize: number): number {
  if (!sampleSize || sampleSize <= 0 || isNaN(sampleSize) || rejectedQty < 0 || isNaN(rejectedQty)) {
    return 0;
  }
  return Number(((rejectedQty / sampleSize) * 100).toFixed(2));
}

/**
 * Compare recent inspection lots with historical baseline
 */
export function evaluateQualityTrend(lots: InspectionLot[]): {
  historicalRatePct: number;
  recentRatePct: number;
  isDeteriorating: boolean;
  severity: Severity;
  recentLots: InspectionLot[];
} {
  if (!lots || lots.length === 0) {
    return {
      historicalRatePct: 0,
      recentRatePct: 0,
      isDeteriorating: false,
      severity: 'LOW',
      recentLots: []
    };
  }

  // Sort by inspection date ascending
  const sorted = [...lots].sort(
    (a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime()
  );

  // Consider last 2 lots as "recent", remaining as "historical"
  const recentSlice = sorted.slice(-2);
  const historicalSlice = sorted.length > 2 ? sorted.slice(0, -2) : sorted;

  const totalRecentSample = recentSlice.reduce((acc, l) => acc + l.sampleSize, 0);
  const totalRecentRejects = recentSlice.reduce((acc, l) => acc + l.rejectedQty, 0);
  const recentRate = calculateRejectionRate(totalRecentRejects, totalRecentSample);

  const totalHistSample = historicalSlice.reduce((acc, l) => acc + l.sampleSize, 0);
  const totalHistRejects = historicalSlice.reduce((acc, l) => acc + l.rejectedQty, 0);
  const histRate = calculateRejectionRate(totalHistRejects, totalHistSample);

  const delta = recentRate - histRate;
  let severity: Severity = 'LOW';
  let isDeteriorating = false;

  if (recentRate >= DEFAULT_THRESHOLDS.rejectionRateCriticalPct || delta >= 4.0) {
    severity = 'CRITICAL';
    isDeteriorating = true;
  } else if (recentRate >= DEFAULT_THRESHOLDS.rejectionRateWarningPct || delta >= 2.0) {
    severity = 'HIGH';
    isDeteriorating = true;
  }

  return {
    historicalRatePct: histRate,
    recentRatePct: recentRate,
    isDeteriorating,
    severity,
    recentLots: recentSlice
  };
}

/**
 * 3. Delivery performance & delay calculations
 */
export function calculateDeliveryPerformance(orders: PurchaseOrder[]): {
  totalOrders: number;
  lateOrders: number;
  lateRatePct: number;
  avgDelayDays: number;
  severity: Severity;
} {
  if (!orders || orders.length === 0) {
    return { totalOrders: 0, lateOrders: 0, lateRatePct: 0, avgDelayDays: 0, severity: 'LOW' };
  }

  const delivered = orders.filter(o => o.status === 'DELIVERED' || o.actualDeliveryDate !== null);
  if (delivered.length === 0) {
    return { totalOrders: orders.length, lateOrders: 0, lateRatePct: 0, avgDelayDays: 0, severity: 'LOW' };
  }

  let lateCount = 0;
  let totalDelayDays = 0;

  for (const po of delivered) {
    if (po.isLate || (po.actualDeliveryDate && po.actualDeliveryDate > po.promisedDate)) {
      lateCount++;
      totalDelayDays += Math.max(0, po.delayDays);
    }
  }

  const lateRatePct = Number(((lateCount / delivered.length) * 100).toFixed(2));
  const avgDelayDays = lateCount > 0 ? Number((totalDelayDays / lateCount).toFixed(1)) : 0;

  let severity: Severity = 'LOW';
  if (lateRatePct >= 35 || avgDelayDays >= 14) {
    severity = 'CRITICAL';
  } else if (lateRatePct >= DEFAULT_THRESHOLDS.lateDeliveryWarningPct || avgDelayDays >= 7) {
    severity = 'HIGH';
  } else if (lateRatePct >= 10) {
    severity = 'MEDIUM';
  }

  return {
    totalOrders: delivered.length,
    lateOrders: lateCount,
    lateRatePct,
    avgDelayDays,
    severity
  };
}

/**
 * 4. Compliance document expiry calculation
 */
export function calculateDaysUntilExpiry(
  expiryDateStr: string,
  referenceDate: Date = SIMULATED_TODAY
): {
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  severity: Severity;
} {
  if (!expiryDateStr) {
    return { daysRemaining: -999, status: 'EXPIRED', severity: 'CRITICAL' };
  }

  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { daysRemaining, status: 'EXPIRED', severity: 'CRITICAL' };
  } else if (daysRemaining <= DEFAULT_THRESHOLDS.complianceCriticalDays) {
    return { daysRemaining, status: 'EXPIRING_SOON', severity: 'CRITICAL' };
  } else if (daysRemaining <= DEFAULT_THRESHOLDS.complianceWarningDays) {
    return { daysRemaining, status: 'EXPIRING_SOON', severity: 'HIGH' };
  }

  return { daysRemaining, status: 'VALID', severity: 'LOW' };
}

/**
 * 5. Stock coverage calculation
 * Formula: days_of_stock_cover = current_stock / average_daily_demand
 * Safe with zero or missing demand.
 */
export function calculateDaysOfStockCover(
  currentStock: number,
  avgDailyDemand: number
): {
  daysOfCover: number;
  hasDemand: boolean;
  isCriticallyLow: boolean;
} {
  if (avgDailyDemand === undefined || avgDailyDemand === null || avgDailyDemand <= 0 || isNaN(avgDailyDemand)) {
    return {
      daysOfCover: 999, // Safely marked infinite/not depleted
      hasDemand: false,
      isCriticallyLow: false
    };
  }

  if (currentStock <= 0 || isNaN(currentStock)) {
    return {
      daysOfCover: 0,
      hasDemand: true,
      isCriticallyLow: true
    };
  }

  const days = Number((currentStock / avgDailyDemand).toFixed(1));
  return {
    daysOfCover: days,
    hasDemand: true,
    isCriticallyLow: days <= DEFAULT_THRESHOLDS.lowStockCoverDays
  };
}

/**
 * 6. Single-source dependency detection
 */
export function evaluateSingleSourceDependency(item: ComponentItem): {
  isSingleSource: boolean;
  severity: Severity;
} {
  const approvedCount = item.approvedSupplierIds?.length || 0;
  if (approvedCount <= 1 && item.criticality === 'A') {
    return { isSingleSource: true, severity: 'CRITICAL' };
  }
  if (approvedCount <= 1 && item.criticality === 'B') {
    return { isSingleSource: true, severity: 'HIGH' };
  }
  return { isSingleSource: false, severity: 'LOW' };
}

/**
 * 7. Combined Supplier & Item Multi-Signal Risk Engine
 * Analyzes interconnected risks, builds concrete risk alerts with supporting numbers and evidence.
 */
export function analyzeSupplierRisk(
  supplier: Supplier,
  items: ComponentItem[],
  contracts: Contract[],
  purchaseOrders: PurchaseOrder[],
  inspections: InspectionLot[],
  complianceDocs: ComplianceDoc[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): {
  supplierRiskLevel: Severity;
  alerts: RiskAlert[];
  metrics: {
    priceDeviationPct: number;
    unauthorizedOverpaymentTotal: number;
    recentRejectionRatePct: number;
    historicalRejectionRatePct: number;
    lateDeliveryPct: number;
    avgDelayDays: number;
    minDocDaysRemaining: number;
    expiringDocCount: number;
    criticalItemsCount: number;
    singleSourceItemsCount: number;
    minStockCoverDays: number;
  };
  explanation: string;
} {
  const alerts: RiskAlert[] = [];
  const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id);
  const supplierLots = inspections.filter(lot => lot.supplierId === supplier.id);
  const supplierDocs = complianceDocs.filter(doc => doc.supplierId === supplier.id);
  const supplierItems = items.filter(
    item => item.primarySupplierId === supplier.id || item.approvedSupplierIds.includes(supplier.id)
  );

  // Missing data checks
  if (supplierDocs.length === 0) {
    alerts.push({
      id: `alert-missing-doc-${supplier.id}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      alertType: 'DATA_INCOMPLETE',
      severity: 'HIGH',
      title: 'Missing Compliance Documentation',
      reason: 'No compliance records on file. Supplier cannot be validated for regulatory standards.',
      supportingEvidence: '0 compliance certificates registered in the master record.',
      metrics: {},
      priorityScore: 70,
      timestamp: SIMULATED_TODAY.toISOString()
    });
  }

  // A. Price Deviation Analysis
  let maxPriceDev = 0;
  let totalOverpayment = 0;
  const recentPOs = supplierPOs.slice(-5);

  for (const po of recentPOs) {
    const contract = contracts.find(c => c.supplierId === supplier.id && c.itemId === po.itemId);
    const agreedPrice = contract ? contract.agreedPrice : po.agreedUnitPrice;
    const { deviationPct, dollarDiff, isFlagged, severity } = calculatePriceDeviation(agreedPrice, po.invoicedUnitPrice);

    if (isFlagged && deviationPct > 0) {
      const overpayment = dollarDiff * po.orderedQty;
      totalOverpayment += overpayment;
      if (deviationPct > maxPriceDev) maxPriceDev = deviationPct;

      const item = items.find(i => i.id === po.itemId);
      alerts.push({
        id: `alert-price-${po.id}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemId: item?.id,
        itemCode: item?.code,
        itemName: item?.name,
        alertType: 'PRICE_DEVIATION',
        severity,
        title: `Contract Price Deviation: +${deviationPct}% on PO ${po.poNumber}`,
        reason: `Invoiced unit price of $${po.invoicedUnitPrice.toFixed(2)} exceeds agreed contract price of $${agreedPrice.toFixed(2)}.`,
        supportingEvidence: `PO ${po.poNumber} billed +${deviationPct}% over baseline; total unauthorized discrepancy of $${overpayment.toFixed(2)}.`,
        metrics: {
          priceDeviationPct: deviationPct,
          unauthorizedOverpaymentTotal: overpayment
        },
        priorityScore: severity === 'CRITICAL' ? 85 : 65,
        timestamp: po.orderDate
      });
    }
  }

  // B. Quality Deterioration Analysis
  const qualityTrend = evaluateQualityTrend(supplierLots);
  if (qualityTrend.isDeteriorating) {
    alerts.push({
      id: `alert-quality-${supplier.id}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      alertType: 'QUALITY_DETERIORATION',
      severity: qualityTrend.severity,
      title: `Surging Inspection Rejection Rate (${qualityTrend.recentRatePct}% vs ${qualityTrend.historicalRatePct}% baseline)`,
      reason: `Recent incoming lots demonstrate significant quality deterioration compared to historical averages.`,
      supportingEvidence: `Latest 2 lots inspected had average ${qualityTrend.recentRatePct}% rejections (historical baseline was ${qualityTrend.historicalRatePct}%). Defect samples: ${qualityTrend.recentLots.map(l => `${l.lotNumber} (${l.rejectionRatePct}%)`).join(', ')}.`,
      metrics: {
        recentRejectionRatePct: qualityTrend.recentRatePct,
        historicalRejectionRatePct: qualityTrend.historicalRatePct
      },
      priorityScore: qualityTrend.severity === 'CRITICAL' ? 90 : 70,
      timestamp: SIMULATED_TODAY.toISOString()
    });
  }

  // C. Delivery Performance Analysis
  const deliveryPerf = calculateDeliveryPerformance(supplierPOs);
  if (deliveryPerf.severity === 'CRITICAL' || deliveryPerf.severity === 'HIGH') {
    alerts.push({
      id: `alert-delivery-${supplier.id}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      alertType: 'DELIVERY_DELAYS',
      severity: deliveryPerf.severity,
      title: `Elevated Late Delivery Frequency (${deliveryPerf.lateRatePct}%, avg ${deliveryPerf.avgDelayDays}d delay)`,
      reason: `Supplier fulfillment schedules have deteriorated past SLA tolerance.`,
      supportingEvidence: `${deliveryPerf.lateOrders} out of ${deliveryPerf.totalOrders} recorded POs arrived past promised receipt date, averaging ${deliveryPerf.avgDelayDays} days late.`,
      metrics: {
        lateDeliveryPct: deliveryPerf.lateRatePct,
        avgDelayDays: deliveryPerf.avgDelayDays
      },
      priorityScore: deliveryPerf.severity === 'CRITICAL' ? 80 : 60,
      timestamp: SIMULATED_TODAY.toISOString()
    });
  }

  // D. Compliance Expiry Analysis
  let minDaysRemaining = 9999;
  let expiringCount = 0;

  for (const doc of supplierDocs) {
    const expiryEval = calculateDaysUntilExpiry(doc.expiryDate);
    if (expiryEval.daysRemaining < minDaysRemaining) {
      minDaysRemaining = expiryEval.daysRemaining;
    }

    if (expiryEval.status === 'EXPIRED' || expiryEval.status === 'EXPIRING_SOON') {
      expiringCount++;
      alerts.push({
        id: `alert-compliance-${doc.id}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        alertType: 'COMPLIANCE_EXPIRING',
        severity: expiryEval.severity,
        title: `${doc.docType} Certificate ${expiryEval.daysRemaining <= 0 ? 'Expired' : `Expiring in ${expiryEval.daysRemaining} Days`}`,
        reason: `Mandatory quality/compliance certification #${doc.docNumber} issued by ${doc.issuer} is ${expiryEval.daysRemaining <= 0 ? 'expired' : 'nearing expiration'}.`,
        supportingEvidence: `Expiry date is ${doc.expiryDate} (${expiryEval.daysRemaining} days remaining from today). Missing renewal risks immediate audit shutdown.`,
        metrics: {
          daysUntilDocExpiry: expiryEval.daysRemaining
        },
        priorityScore: expiryEval.severity === 'CRITICAL' ? 88 : 68,
        timestamp: SIMULATED_TODAY.toISOString()
      });
    }
  }

  // E. Single-Source & Stock Coverage Analysis
  let criticalCount = 0;
  let singleSourceCount = 0;
  let minStockCover = 9999;

  for (const item of supplierItems) {
    if (item.criticality === 'A') criticalCount++;
    const singleSource = evaluateSingleSourceDependency(item);
    if (singleSource.isSingleSource) singleSourceCount++;

    const cover = calculateDaysOfStockCover(item.currentStock, item.avgDailyDemand);
    if (cover.daysOfCover < minStockCover) {
      minStockCover = cover.daysOfCover;
    }

    if (singleSource.isSingleSource) {
      alerts.push({
        id: `alert-single-source-${item.id}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        alertType: 'SINGLE_SOURCE',
        severity: singleSource.severity,
        title: `Single-Source Dependency: Critical Item ${item.code} (${item.name})`,
        reason: `Criticality ${item.criticality} component has only 1 approved supplier (${supplier.name}) with zero qualified backups.`,
        supportingEvidence: `Current stock cover: ${cover.daysOfCover} days. Approved suppliers: 1 (${supplier.name}). Disruption will directly halt production.`,
        metrics: {
          approvedSupplierCount: item.approvedSupplierIds.length,
          daysOfStockCover: cover.daysOfCover,
          leadTimeDays: supplier.avgLeadTimeDays
        },
        priorityScore: singleSource.severity === 'CRITICAL' ? 92 : 72,
        timestamp: SIMULATED_TODAY.toISOString()
      });
    }
  }

  // F. COMBINED MULTI-SIGNAL ESCALATION
  // Connect signals: If quality, price, delivery, or compliance warnings affect a critical item with low stock cover:
  const hasQualityWarning = qualityTrend.isDeteriorating;
  const hasPriceWarning = maxPriceDev >= thresholds.priceDeviationWarningPct;
  const hasComplianceWarning = minDaysRemaining <= thresholds.complianceWarningDays;
  const hasDeliveryWarning = deliveryPerf.lateRatePct >= thresholds.lateDeliveryWarningPct;
  const hasSingleSourceCritical = singleSourceCount > 0 && criticalCount > 0;
  const hasLowStockCover = minStockCover <= thresholds.lowStockCoverDays;

  const warningCount = [
    hasQualityWarning,
    hasPriceWarning,
    hasComplianceWarning,
    hasDeliveryWarning,
    hasSingleSourceCritical,
    hasLowStockCover
  ].filter(Boolean).length;

  let overallRiskLevel: Severity = 'LOW';
  let explanation = `${supplier.name} maintains acceptable risk metrics across pricing, quality, and delivery.`;

  if (hasSingleSourceCritical && hasLowStockCover && (hasQualityWarning || hasComplianceWarning || hasPriceWarning)) {
    // Serious combined multi-signal compounding risk!
    overallRiskLevel = 'CRITICAL';
    const primaryItem = supplierItems.find(i => i.criticality === 'A') || supplierItems[0];

    const compoundAlert: RiskAlert = {
      id: `alert-combined-${supplier.id}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: primaryItem?.id,
      itemCode: primaryItem?.code,
      itemName: primaryItem?.name,
      alertType: 'COMBINED_RISK',
      severity: 'CRITICAL',
      title: `CRITICAL COMBINED RISK: Compounding Vulnerabilities on ${primaryItem ? primaryItem.name : 'Key Parts'}`,
      reason: `Multiple concurrent warning signals converge on a sole-sourced Criticality-A component with only ${minStockCover} days of inventory cover.`,
      supportingEvidence: [
        hasQualityWarning ? `Quality: Spike to ${qualityTrend.recentRatePct}% rejection rate (vs ${qualityTrend.historicalRatePct}% baseline)` : null,
        hasPriceWarning ? `Pricing: +${maxPriceDev}% unauthorized PO price deviation ($${totalOverpayment.toFixed(2)} unrecovered)` : null,
        hasComplianceWarning ? `Compliance: Certificate expiring in ${minDaysRemaining} days without approved renewal` : null,
        `Inventory: Only ${minStockCover} days of stock cover vs ${supplier.avgLeadTimeDays} days supplier lead time`,
        `Sourcing: Sole approved supplier with 0 approved backups`
      ].filter(Boolean).join(' | '),
      metrics: {
        priceDeviationPct: maxPriceDev,
        recentRejectionRatePct: qualityTrend.recentRatePct,
        historicalRejectionRatePct: qualityTrend.historicalRatePct,
        daysUntilDocExpiry: minDaysRemaining,
        daysOfStockCover: minStockCover,
        approvedSupplierCount: 1,
        leadTimeDays: supplier.avgLeadTimeDays,
        unauthorizedOverpaymentTotal: totalOverpayment
      },
      priorityScore: 99,
      timestamp: SIMULATED_TODAY.toISOString()
    };

    alerts.unshift(compoundAlert);
    explanation = `HIGH URGENCY: ${supplier.name} combines sole-source dependency on Criticality-A item (${primaryItem?.code || 'Key item'}), surging quality rejects (${qualityTrend.recentRatePct}%), impending compliance expiration (${minDaysRemaining}d), and price creep (+${maxPriceDev}%) with just ${minStockCover} days of buffer stock.`;
  } else if (warningCount >= 3 || (criticalCount > 0 && (hasQualityWarning || hasComplianceWarning))) {
    overallRiskLevel = 'HIGH';
    explanation = `${supplier.name} exhibits multiple operational warnings (${warningCount} active signals) requiring procurement intervention.`;
  } else if (warningCount >= 1) {
    overallRiskLevel = 'MEDIUM';
    explanation = `${supplier.name} exhibits isolated performance anomalies (${warningCount} signal) under standard monitoring.`;
  }

  return {
    supplierRiskLevel: overallRiskLevel,
    alerts,
    metrics: {
      priceDeviationPct: maxPriceDev,
      unauthorizedOverpaymentTotal: totalOverpayment,
      recentRejectionRatePct: qualityTrend.recentRatePct,
      historicalRejectionRatePct: qualityTrend.historicalRatePct,
      lateDeliveryPct: deliveryPerf.lateRatePct,
      avgDelayDays: deliveryPerf.avgDelayDays,
      minDocDaysRemaining: minDaysRemaining === 9999 ? -1 : minDaysRemaining,
      expiringDocCount: expiringCount,
      criticalItemsCount: criticalCount,
      singleSourceItemsCount: singleSourceCount,
      minStockCoverDays: minStockCover === 9999 ? 999 : minStockCover
    },
    explanation
  };
}
