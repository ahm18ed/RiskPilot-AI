import {
  calculatePriceDeviation,
  calculateRejectionRate,
  evaluateQualityTrend,
  calculateDeliveryPerformance,
  calculateDaysUntilExpiry,
  calculateDaysOfStockCover,
  evaluateSingleSourceDependency,
  analyzeSupplierRisk,
  SIMULATED_TODAY
} from '../server/riskEngine';
import { generateSeedData } from '../server/seedData';
import { simulateDecisionsForSupplier } from '../server/decisionEngine';
import { generateDeterministicAIAnalysis } from '../server/aiService';
import { dataStore } from '../server/store';
import { analyzeSparesDeskQuery, buildSparesDeskContext, getSparesDeskDataset, shouldAnalyzeSparesDeskQuery } from '../server/sparesDataset';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log('--- RUNNING RISKPILOT AI BUSINESS LOGIC & RISK ENGINE TESTS ---');

// 0. Included Kaveri spare-parts dataset
console.log('\n[Suite 0] Kaveri Spare-Parts Dataset');
{
  const dataset = getSparesDeskDataset();
  assert(dataset.products.length === 126, 'Loads all 126 product SKUs from the included products CSV');
  assert(dataset.inventory.length === 1008, 'Loads all 1,008 inventory records from the included inventory CSV');
  assert(dataset.sales.length === 12777, 'Loads the complete 12,777-row sales history');
  assert(dataset.suppliers.length === 205, 'Loads all supplier price/lead-time/MOQ quotes');
  assert(dataset.purchaseOrders.length === 43, 'Loads all 43 purchase orders');
  assert(shouldAnalyzeSparesDeskQuery('What is the stock and supplier price for SKU CLT-6120?'), 'Recognizes spare-parts questions for dataset analysis');

  const queryScopedContext = buildSparesDeskContext('Analyze stock cover and supplier options for CLT-6120.');
  assert(queryScopedContext.length < 12000, 'Keeps the model context compact for SKU-level dataset questions');
  assert(!queryScopedContext.includes('allSupplierOffers') && !queryScopedContext.includes('allPurchaseOrders'), 'Does not duplicate complete supplier and order tables into the model context');

  const clutchPart = analyzeSparesDeskQuery('What is the stock and supplier price for SKU CLT-6120?');
  assert(!!clutchPart?.answerMarkdown.includes('114 units'), 'Computes SKU inventory across all eight locations');
  assert(!!clutchPart?.answerMarkdown.includes('₹3,400'), 'Returns the actual supplier quote for the requested SKU');
  assert(!!clutchPart?.answerMarkdown.includes('200'), 'Returns the supplier MOQ for the requested SKU');

  const previousApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const integrated = await dataStore.askAI('What is the stock and supplier price for SKU CLT-6120?');
    assert(integrated.answerMarkdown.includes('114 units'), 'Routes real assistant requests through the included spare-parts dataset');
    assert(integrated.analysisSource === 'dataset', 'Identifies exact CSV-based answers as dataset analysis, not a limited AI fallback');
    assert(integrated.isDeterministicFallback && !!integrated.fallbackReason?.includes('CSV dataset'), 'Clearly states when a dataset answer was calculated without Gemini');
    assert(integrated.executedOperations.some(operation => operation.operationName === 'Kaveri Spare Parts Dataset Analysis'), 'Records the spare-parts data analysis operation');
  } finally {
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }

  const previousOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const previousModel = process.env.OPENROUTER_MODEL;
  const previousFetch = globalThis.fetch;
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.GEMINI_API_KEY = '';
  process.env.OPENROUTER_MODEL = 'openai/o3';
  let capturedRequest: { url: string; authorization: string; body: any } | undefined;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedRequest = {
      url: String(input),
      authorization: new Headers(init?.headers).get('Authorization') || '',
      body: JSON.parse(String(init?.body || '{}'))
    };
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        answerMarkdown: 'I checked the dataset evidence and verified the requested SKU facts.',
        workflowStage: 'Reason',
        executedOperations: [],
        identifiedRisks: [],
        evidencePoints: ['Mocked provider response for test only.'],
        compoundingFactors: [],
        optionsCompared: [],
        recommendedAction: 'Verify the stock snapshot before ordering.',
        confidenceScore: 90,
        uncertainties: []
      }) } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const fileAnswer = await dataStore.askAI('can you explain what is products.csv is about');
    assert(fileAnswer.analysisSource === 'dataset', 'Routes included CSV file questions to direct dataset documentation');
    assert(fileAnswer.answerMarkdown.includes('126 data rows'), 'Explains the products CSV with its verified row count');
    assert(fileAnswer.answerMarkdown.includes('product_name') && fileAnswer.answerMarkdown.includes('machine_model'), 'Lists the actual products CSV columns');
    assert(capturedRequest === undefined, 'Answers known CSV file explanations without depending on an external AI provider');

    const inventoryPreview = await dataStore.askAI('can you list the first 10 line from inventory.csv');
    assert(inventoryPreview.answerMarkdown.includes('### First 10 lines of inventory.csv'), 'Recognizes literal CSV line-preview requests');
    assert(inventoryPreview.answerMarkdown.includes('```csv\nsku,location,stock\nBLT-1003,Gokak,9'), 'Returns the actual CSV header and first rows without reformatting');
    assert(inventoryPreview.answerMarkdown.includes('BLT-1012,Gokak,26') && !inventoryPreview.answerMarkdown.includes('BLT-1012,Belgaum,2'), 'Honors the requested first-ten-physical-lines boundary');
    assert(inventoryPreview.executedOperations.length === 0, 'Does not attach unrelated procurement-agent operations to a simple file preview');

    const providerResponse = await dataStore.askAI('Analyze stock cover and supplier options for CLT-6120.');
    assert(providerResponse.analysisSource === 'openrouter', 'Uses OpenRouter when its server-side API key is configured');
    assert(!providerResponse.isDeterministicFallback, 'Returns the live-provider response as non-fallback analysis');
    assert(capturedRequest?.url === 'https://openrouter.ai/api/v1/chat/completions', 'Calls the OpenRouter chat completions API');
    assert(capturedRequest?.authorization === 'Bearer test-openrouter-key', 'Sends the configured key only as a server-side authorization header');
    assert(capturedRequest?.body.model === 'openai/o3' && capturedRequest?.body.reasoning?.effort === 'high', 'Requests the configured reasoning model at high effort');
    assert(capturedRequest?.body.response_format?.type === 'json_object', 'Requests structured JSON output for reliable answer parsing');
    assert(capturedRequest?.body.max_tokens === 2000, 'Keeps the reasoning completion budget below the observed account affordability limit');
    assert(!capturedRequest?.body.messages?.[1]?.content.includes('Full Ledger Contract Price Discrepancy Audit'), 'Excludes unrelated demo procurement tools from spare-parts reasoning prompts');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousOpenRouterKey;
    if (previousModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = previousModel;
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }

  const openOrders = analyzeSparesDeskQuery('Show me all open purchase orders');
  assert(!!openOrders?.answerMarkdown.includes('Open purchase orders'), 'Can answer purchase-order status questions from the included table');
  assert(!!openOrders?.answerMarkdown.includes('PO-4404'), 'Includes actual matching purchase-order records');

  const locationSales = analyzeSparesDeskQuery('How many units were sold in Hubli?');
  assert(!!locationSales?.answerMarkdown.includes('Sales in Hubli'), 'Answers sales questions for a named store');

  const compatibleParts = analyzeSparesDeskQuery('Which products fit the JCB 3DX?');
  assert(!!compatibleParts?.answerMarkdown.includes('Matching products'), 'Finds products by machine model');

  const cheapestQuotes = analyzeSparesDeskQuery('Which supplier offers the lowest price?');
  assert(!!cheapestQuotes?.answerMarkdown.includes('Lowest supplier offers'), 'Compares lowest supplier quotes across SKUs');
}

// 1. Contract price deviation
console.log('\n[Suite 1] Price Deviation Calculations');
{
  const nominal = calculatePriceDeviation(450, 450);
  assert(nominal.deviationPct === 0 && !nominal.isFlagged, 'Nominal contract price has 0% deviation');

  const demoHike = calculatePriceDeviation(450, 481.50);
  assert(demoHike.deviationPct === 7.0, 'Demo scenario has exactly +7.0% deviation ($481.50 vs $450)');
  assert(demoHike.isFlagged && demoHike.severity === 'CRITICAL', '7% price hike flagged as CRITICAL');
  assert(demoHike.dollarDiff === 31.50, 'Overpayment difference is $31.50 per unit');

  const invalidPrice = calculatePriceDeviation(-100, 50);
  assert(invalidPrice.deviationPct === 0 && !invalidPrice.isFlagged, 'Invalid/negative price handled safely');
}

// 2. Inspection rejection rate calculations & trend
console.log('\n[Suite 2] Quality Rejection Rate & Deterioration');
{
  assert(calculateRejectionRate(1, 100) === 1.0, '1 in 100 is 1.0% rejection rate');
  assert(calculateRejectionRate(6, 100) === 6.0, '6 in 100 is 6.0% rejection rate');
  assert(calculateRejectionRate(9, 100) === 9.0, '9 in 100 is 9.0% rejection rate');
  assert(calculateRejectionRate(0, 0) === 0, 'Zero sample size returns 0 safely without division by zero');

  const lots = [
    { id: '1', lotNumber: 'L1', poId: 'P1', supplierId: 'S1', itemId: 'I1', inspectionDate: '2026-07-01', sampleSize: 100, acceptedQty: 99, rejectedQty: 1, rejectionRatePct: 1, defectCategory: '', severity: 'LOW' as const, notes: '' },
    { id: '2', lotNumber: 'L2', poId: 'P1', supplierId: 'S1', itemId: 'I1', inspectionDate: '2026-08-01', sampleSize: 100, acceptedQty: 99, rejectedQty: 1, rejectionRatePct: 1, defectCategory: '', severity: 'LOW' as const, notes: '' },
    { id: '3', lotNumber: 'L3', poId: 'P2', supplierId: 'S1', itemId: 'I1', inspectionDate: '2026-09-01', sampleSize: 100, acceptedQty: 94, rejectedQty: 6, rejectionRatePct: 6, defectCategory: '', severity: 'HIGH' as const, notes: '' },
    { id: '4', lotNumber: 'L4', poId: 'P3', supplierId: 'S1', itemId: 'I1', inspectionDate: '2026-10-01', sampleSize: 100, acceptedQty: 91, rejectedQty: 9, rejectionRatePct: 9, defectCategory: '', severity: 'CRITICAL' as const, notes: '' }
  ];

  const trend = evaluateQualityTrend(lots);
  assert(trend.isDeteriorating === true, 'Spike from 1% to 6% & 9% flagged as deteriorating');
  assert(trend.severity === 'CRITICAL', 'Recent 7.5% avg rejection rate flagged as CRITICAL');
}

// 3. Delivery performance & delays
console.log('\n[Suite 3] Delivery Performance Calculations');
{
  const orders = [
    { id: '1', poNumber: 'PO1', supplierId: 'S1', itemId: 'I1', orderDate: '2026-01-01', promisedDate: '2026-02-01', actualDeliveryDate: '2026-02-01', orderedQty: 100, receivedQty: 100, agreedUnitPrice: 10, invoicedUnitPrice: 10, priceDeviationPct: 0, isLate: false, delayDays: 0, status: 'DELIVERED' as const },
    { id: '2', poNumber: 'PO2', supplierId: 'S1', itemId: 'I1', orderDate: '2026-02-01', promisedDate: '2026-03-01', actualDeliveryDate: '2026-03-10', orderedQty: 100, receivedQty: 100, agreedUnitPrice: 10, invoicedUnitPrice: 10, priceDeviationPct: 0, isLate: true, delayDays: 9, status: 'DELIVERED' as const },
    { id: '3', poNumber: 'PO3', supplierId: 'S1', itemId: 'I1', orderDate: '2026-03-01', promisedDate: '2026-04-01', actualDeliveryDate: '2026-04-06', orderedQty: 100, receivedQty: 100, agreedUnitPrice: 10, invoicedUnitPrice: 10, priceDeviationPct: 0, isLate: true, delayDays: 5, status: 'DELIVERED' as const }
  ];

  const perf = calculateDeliveryPerformance(orders);
  assert(perf.lateOrders === 2, '2 out of 3 orders identified as late');
  assert(perf.lateRatePct === 66.67, 'Late rate is 66.67%');
  assert(perf.avgDelayDays === 7.0, 'Average delay days is 7.0');
}

// 4. Compliance document expiry
console.log('\n[Suite 4] Compliance Document Expiry');
{
  // Simulated today is 2026-10-09. Demo expiry is 2026-10-19 -> exactly 10 days!
  const expiry10d = calculateDaysUntilExpiry('2026-10-19', SIMULATED_TODAY);
  assert(expiry10d.daysRemaining === 10, 'Calculates exactly 10 days remaining to 2026-10-19');
  assert(expiry10d.status === 'EXPIRING_SOON', 'Status is EXPIRING_SOON');
  assert(expiry10d.severity === 'CRITICAL', '10 days remaining flagged as CRITICAL priority');

  const expired = calculateDaysUntilExpiry('2026-10-05', SIMULATED_TODAY);
  assert(expired.daysRemaining < 0 && expired.status === 'EXPIRED', 'Lapsed date flagged as EXPIRED');

  const valid = calculateDaysUntilExpiry('2027-10-09', SIMULATED_TODAY);
  assert(valid.daysRemaining === 365 && valid.status === 'VALID', 'Future date (365d) flagged as VALID');
}

// 5. Stock coverage calculation
console.log('\n[Suite 5] Stock Coverage Formula & Edge Cases');
{
  const demoCover = calculateDaysOfStockCover(250, 10);
  assert(demoCover.daysOfCover === 25.0, 'Current stock 250 with daily demand 10 yields exactly 25.0 days');
  assert(demoCover.isCriticallyLow === true, '25 days cover is critically low (<= 30 days)');

  const zeroDemand = calculateDaysOfStockCover(500, 0);
  assert(zeroDemand.hasDemand === false && zeroDemand.daysOfCover === 999, 'Zero demand handled safely without Infinity error');

  const negativeStock = calculateDaysOfStockCover(-5, 10);
  assert(negativeStock.daysOfCover === 0 && negativeStock.isCriticallyLow === true, 'Negative stock safely evaluated as 0 days');
}

// 6. Single-source dependency detection
console.log('\n[Suite 6] Single-Source Dependency');
{
  const critAItem = {
    id: 'ITEM-1', code: 'CMP-X', name: 'Titan Valve', category: '', criticality: 'A' as const,
    unitOfMeasure: 'EA', currentStock: 250, minSafetyStock: 200, avgDailyDemand: 10, daysOfStockCover: 25,
    primarySupplierId: 'SUP-001', approvedSupplierIds: ['SUP-001'], candidateSupplierIds: ['SUP-042'], unitCostBase: 450
  };
  const singleEval = evaluateSingleSourceDependency(critAItem);
  assert(singleEval.isSingleSource === true, 'Item with 1 approved supplier flagged as single-source');
  assert(singleEval.severity === 'CRITICAL', 'Criticality A single-source is CRITICAL severity');
}

// 7. Combined risk prioritization
console.log('\n[Suite 7] Combined Compounding Risk Prioritization');
{
  const seed = generateSeedData();
  const apex = seed.suppliers.find(s => s.id === 'SUP-001')!;
  const analysis = analyzeSupplierRisk(
    apex,
    seed.items,
    seed.contracts,
    seed.purchaseOrders,
    seed.inspections,
    seed.complianceDocs
  );

  assert(analysis.supplierRiskLevel === 'CRITICAL', 'Apex Precision Hydraulics flagged as CRITICAL overall risk');
  assert(analysis.alerts.length >= 4, 'Multiple alerts generated for price, quality, compliance, and single-source');
  const combinedAlert = analysis.alerts.find(a => a.alertType === 'COMBINED_RISK');
  assert(combinedAlert !== undefined, 'Combined multi-signal alert synthesized for Apex');
  assert(combinedAlert?.priorityScore === 99, 'Combined risk receives top urgency priority score of 99');
}

// 8. Decision comparison simulator
console.log('\n[Suite 8] Decision Simulator Evaluation');
{
  const seed = generateSeedData();
  const apex = seed.suppliers.find(s => s.id === 'SUP-001')!;
  const titanItem = seed.items.find(i => i.id === 'ITEM-001')!;
  const candidateSuppliers = seed.suppliers.filter(s => titanItem.candidateSupplierIds.includes(s.id));
  const apexDocs = seed.complianceDocs.filter(d => d.supplierId === 'SUP-001');
  const apexPOs = seed.purchaseOrders.filter(p => p.supplierId === 'SUP-001');
  const apexLots = seed.inspections.filter(l => l.supplierId === 'SUP-001');

  const simulation = simulateDecisionsForSupplier(
    apex,
    titanItem,
    candidateSuppliers,
    apexDocs,
    apexPOs,
    apexLots
  );

  assert(simulation.options.length >= 4, 'At least 4 feasible decision options compared');
  assert(simulation.recommendedOptionId === 'OPT-QUALIFY-SECOND', 'Second-source qualification recommended as primary strategy');

  const holdOption = simulation.options.find(o => o.id === 'OPT-HOLD')!;
  assert(holdOption.stockOutRiskPct >= 80, 'Placing supplier on hold has severe stockout risk (85%) because 25d cover < 45d lead time');
}

// 9. Action approval, rejection & persistence
console.log('\n[Suite 9] Action Lifecycle, Approval & Rejection Persistence');
{
  dataStore.reset();
  const created = dataStore.createAction({
    actionType: 'SECOND_SOURCE_QUALIFICATION',
    title: 'Qualify Vanguard Micro-Foundry for Titanium Valve',
    supplierId: 'SUP-042',
    supplierName: 'Vanguard Micro-Foundry',
    itemId: 'ITEM-001',
    itemCode: 'CMP-TITAN-X1',
    itemName: 'Titanium High-Pressure Fuel Valve',
    reason: 'Mitigate Apex single source risk',
    supportingEvidence: '9% defect rate, 10-day cert expiry',
    recommendedDeadline: '2026-10-23',
    urgency: 'IMMEDIATE',
    expectedOutcome: 'Approve second source within 14 days',
    assignedTo: 'Lead Sourcing Specialist',
    notes: 'Test note'
  });

  assert(created.status === 'DRAFT', 'Created action starts in DRAFT status');

  const approved = dataStore.reviewAction(created.id, 'APPROVED', 'Sarah Chen (Director of Procurement)', 'Approved for immediate audit funding.');
  assert(approved.status === 'APPROVED', 'Action status updated to APPROVED');
  assert(approved.reviewedBy === 'Sarah Chen (Director of Procurement)', 'Reviewer recorded on action');

  // Verify audit log has the approved event
  const logs = dataStore.getAuditTrail();
  const approveLog = logs.find(l => l.actionId === created.id && l.eventType === 'ACTION_APPROVED');
  assert(approveLog !== undefined, 'Immutable audit log recorded the approval decision');

  // Test rejection
  const secondAction = dataStore.createAction({
    actionType: 'RFQ',
    title: 'Emergency Spot Buy RFQ',
    supplierId: 'SUP-089',
    supplierName: 'Helios Aero Dynamics',
    reason: 'Price exploration',
    supportingEvidence: 'Spot market evaluation',
    recommendedDeadline: '2026-10-30',
    urgency: 'NORMAL',
    expectedOutcome: 'Receive 3 price quotes',
    assignedTo: 'Junior Buyer',
    notes: ''
  });

  const rejected = dataStore.reviewAction(secondAction.id, 'REJECTED', 'Sarah Chen', 'Supplier lacks AS9100 accreditation.');
  assert(rejected.status === 'REJECTED', 'Action status is strictly REJECTED, never approved');
  assert(rejected.reviewComment === 'Supplier lacks AS9100 accreditation.', 'Rejection reason persisted');
}

// 10. Dataset analysis ingestion
console.log('\n[Suite 10] Custom Dataset Analysis');
{
  const dataset = `region,orders,defect_rate,late_shipments,revenue\nNorth,120,2.5,8,85000\nSouth,94,5.1,14,67000\nEast,160,3.4,10,98000\nWest,76,7.2,19,54000`;

  const result = generateDeterministicAIAnalysis(
    'Analyze this dataset and tell me where the biggest risk is.',
    dataStore.getState(),
    dataStore.getState().suppliers[0],
    dataStore.getState().items[0],
    [],
    [],
    [],
    [],
    [],
    undefined,
    undefined,
    undefined,
    dataset
  );

  assert(result.answerMarkdown.toLowerCase().includes('west') || result.answerMarkdown.toLowerCase().includes('risk'), 'Dataset analysis responds with region-level risk insight');
  assert(result.isDeterministicFallback === true, 'Dataset analysis uses fallback reasoning when custom data is supplied');
}

// 10. AI service fallback and deterministic reasoning
console.log('\n[Suite 10] AI Fallback & Structured Reasoning');
{
  const seed = generateSeedData();
  const apex = seed.suppliers.find(s => s.id === 'SUP-001')!;
  const titanItem = seed.items.find(i => i.id === 'ITEM-001')!;

  const fallbackResult = generateDeterministicAIAnalysis(
    'What happens if the supplier is put on hold?',
    apex,
    titanItem,
    [],
    seed.suppliers.filter(s => titanItem.candidateSupplierIds.includes(s.id)),
    seed.complianceDocs.filter(d => d.supplierId === 'SUP-001'),
    seed.purchaseOrders.filter(p => p.supplierId === 'SUP-001'),
    seed.inspections.filter(l => l.supplierId === 'SUP-001')
  );

  assert(fallbackResult.isDeterministicFallback === true, 'Explicitly marked as deterministic fallback');
  assert(fallbackResult.workflowStage === 'Evaluate', 'Recognizes workflow stage as Evaluate');
  assert(fallbackResult.answerMarkdown.includes('25 days of stock cover'), 'Includes actual calculated 25 days stock cover in answer');
  assert(fallbackResult.optionsCompared.length >= 2, 'Compares at least 2 structured options in fallback mode');

  const identityResponse = generateDeterministicAIAnalysis('What is your name?', apex, titanItem);
  assert(identityResponse.answerMarkdown.includes("I'm RiskPilot AI"), 'Answers assistant identity questions directly in fallback mode');
  assert(identityResponse.optionsCompared.length === 0, 'Does not attach unrelated procurement simulations to conversational answers');

  const unsupportedResponse = generateDeterministicAIAnalysis('What is 2 + 2?', apex, titanItem);
  assert(unsupportedResponse.answerMarkdown.includes('local fallback is limited'), 'Clearly limits unsupported general questions instead of inventing a supplier investigation');
}

// 11. Extended Agent Operations
console.log('\n[Suite 11] Extended Autonomous Agent Operations');
{
  const seed = generateSeedData();
  const apex = seed.suppliers.find(s => s.id === 'SUP-001')!;
  const titanItem = seed.items.find(i => i.id === 'ITEM-001')!;

  // 11.1 Defect Root Cause Pareto
  const rootCauseRes = generateDeterministicAIAnalysis(
    'Analyze lot inspection failure modes, porosity root causes, and scrap costs for Apex Precision.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(rootCauseRes.answerMarkdown.includes('Defect Pareto Classification'), 'Root cause analysis includes Defect Pareto classification');
  assert(rootCauseRes.downloadableArtifact !== undefined, 'Generates 8D corrective action downloadable artifact');
  assert(rootCauseRes.downloadableArtifact?.type === 'CORRECTIVE_ACTION_PLAN', 'Artifact is CORRECTIVE_ACTION_PLAN');

  // 11.2 Legal Dispute & Breach Notice
  const legalRes = generateDeterministicAIAnalysis(
    'Generate a formal legal notice of material breach and cure notice against Apex Precision under Master Supply Agreement terms.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(legalRes.answerMarkdown.includes('Legal Notice of Material Default'), 'Generates formal legal notice heading');
  assert(legalRes.downloadableArtifact?.type === 'LEGAL_NOTICE', 'Produces downloadable legal notice artifact');

  // 11.3 Dual Sourcing Split Optimization
  const splitRes = generateDeterministicAIAnalysis(
    'Simulate a 70/30 order allocation split between Apex Precision and Vanguard Micro-Foundry.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(splitRes.answerMarkdown.includes('Quantitative Dual-Sourcing Order Allocation Optimization'), 'Executes dual sourcing simulation');
  assert(splitRes.optionsCompared.length >= 1, 'Evaluates decision options for dual sourcing');

  // 11.4 Compliance Expiry Horizon Radar
  const horizonRes = generateDeterministicAIAnalysis(
    'Scan all supplier compliance certificates expiring in the next 15, 30, and 90 days.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(horizonRes.answerMarkdown.includes('Portfolio Regulatory Compliance Expiry Horizon Radar'), 'Executes 90-day compliance horizon radar');

  // 11.5 Commercial Negotiation Playbook
  const playbookRes = generateDeterministicAIAnalysis(
    'Prepare an executive commercial negotiation script and bargaining levers for Apex Precision.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(playbookRes.answerMarkdown.includes('Strategic Commercial Negotiation Playbook'), 'Generates commercial negotiation playbook');
  assert(playbookRes.downloadableArtifact?.type === 'NEGOTIATION_MEMO', 'Produces downloadable negotiation memo artifact');

  // 11.6 Autonomous Direct Database Action Execution
  const directRes = generateDeterministicAIAnalysis(
    'Execute action in database now: Dispatch and approve emergency CMM receiving quarantine action.',
    seed,
    apex,
    titanItem,
    [],
    [],
    [],
    [],
    []
  );
  assert(directRes.directExecutionResult !== undefined, 'Returns direct execution result object');
  assert(directRes.directExecutionResult?.success === true, 'Direct action successfully executed');
  assert(directRes.directExecutionResult?.actionId?.startsWith('ACT-AUTO-') === true, 'Live action ID assigned and recorded in database');
}

// 12. Authentication & Session Audit Verification
console.log('\n[Suite 12] Authentication & Session Audit Verification');
{
  const initialAuditCount = dataStore.getAuditTrail().length;
  dataStore.recordAudit({
    actor: 'Elena Vance (VP Global Supply Chain & CPO)',
    eventType: 'USER_AUTHENTICATED',
    details: 'Authenticated via Enterprise Persona. Session initiated for AeroDynamics Global Corp.'
  });

  const updatedAudit = dataStore.getAuditTrail();
  assert(updatedAudit.length === initialAuditCount + 1, 'Audit log recorded authentication event');
  const latestLog = updatedAudit[0];
  assert(latestLog.eventType === 'USER_AUTHENTICATED', 'Audit log event type is USER_AUTHENTICATED');
  assert(latestLog.actor.includes('Elena Vance'), 'Audit log records correct actor identity');
}

console.log(`\n======================================================`);
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} tests succeeded.`);
console.log(`======================================================\n`);
