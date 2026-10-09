import {
  Supplier,
  ComponentItem,
  Contract,
  PurchaseOrder,
  InspectionLot,
  ComplianceDoc,
  ActionDraft,
  AuditLog,
  Severity,
  SupplierStatus
} from './types';
import { SIMULATED_TODAY } from './riskEngine';

// Seeded deterministic pseudo-random number generator for reproducible seed data
class SeededRandom {
  private seed: number;
  constructor(seed: number = 42871) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export interface DatabaseState {
  suppliers: Supplier[];
  items: ComponentItem[];
  contracts: Contract[];
  purchaseOrders: PurchaseOrder[];
  inspections: InspectionLot[];
  complianceDocs: ComplianceDoc[];
  actions: ActionDraft[];
  auditLogs: AuditLog[];
}

export function generateSeedData(): DatabaseState {
  const rng = new SeededRandom(20261009);

  // 1. DEMO SCENARIO SUPPLIER & ALTERNATIVES
  const demoSupplier: Supplier = {
    id: 'SUP-001',
    code: 'APEX-HYD',
    name: 'Apex Precision Hydraulics',
    country: 'United States',
    city: 'Cleveland, OH',
    tier: 1,
    category: 'Precision Machining & Hydraulics',
    status: 'APPROVED',
    contactName: 'Marcus Vance',
    contactEmail: 'm.vance@apexhydraulics.com',
    onTimeDeliveryPct: 82.5,
    defectRatePct: 7.5,
    avgLeadTimeDays: 45,
    annualSpendUsd: 1850000,
    overallRiskLevel: 'CRITICAL',
    notes: 'Sole approved provider for aerospace-grade titanium fuel valves. Critical supplier experiencing production anomalies.'
  };

  const altSupplier1: Supplier = {
    id: 'SUP-042',
    code: 'VANG-FOUNDRY',
    name: 'Vanguard Micro-Foundry',
    country: 'Germany',
    city: 'Stuttgart',
    tier: 2,
    category: 'High-Temp Metal Casting',
    status: 'UNDER_REVIEW',
    contactName: 'Greta Lindner',
    contactEmail: 'g.lindner@vanguard-foundry.de',
    onTimeDeliveryPct: 94.0,
    defectRatePct: 1.2,
    avgLeadTimeDays: 40,
    annualSpendUsd: 450000,
    overallRiskLevel: 'LOW',
    notes: 'Candidate backup for titanium valve bodies. Factory quality audit completed at 65% score; awaiting pilot batch verification.'
  };

  const altSupplier2: Supplier = {
    id: 'SUP-089',
    code: 'HELIOS-AERO',
    name: 'Helios Aero Dynamics',
    country: 'Japan',
    city: 'Nagoya',
    tier: 2,
    category: 'Aerospace Mechanical Components',
    status: 'CONDITIONAL',
    contactName: 'Kenji Sato',
    contactEmail: 'k.sato@helios-aero.co.jp',
    onTimeDeliveryPct: 91.5,
    defectRatePct: 1.8,
    avgLeadTimeDays: 52,
    annualSpendUsd: 280000,
    overallRiskLevel: 'MEDIUM',
    notes: 'Commercial quotation received. Engineering sample batch submitted; quality certification audit pending.'
  };

  // Generate remaining 147 suppliers to reach 150
  const supplierPrefixes = [
    'Aero', 'Titan', 'Nova', 'Pinnacle', 'Quantum', 'Nexus', 'Vortex', 'Synapse',
    'Acu', 'Precision', 'Hyper', 'Vector', 'Orbit', 'Stellar', 'Prime', 'Omni',
    'Core', 'Atlas', 'Zephyr', 'Vertex', 'Dynamic', 'Matrix', 'Delta', 'Pulse'
  ];
  const supplierSuffixes = [
    'Systems', 'Technologies', 'Dynamics', 'Solutions', 'Components', 'Industries',
    'Engineering', 'Precision', 'Manufacturing', 'Fabrication', 'Aerospace', 'Advanced Materials'
  ];
  const countries = [
    { country: 'United States', cities: ['Detroit, MI', 'Austin, TX', 'Seattle, WA', 'Phoenix, AZ', 'Chicago, IL'] },
    { country: 'Germany', cities: ['Munich', 'Stuttgart', 'Hamburg', 'Frankfurt', 'Dortmund'] },
    { country: 'Japan', cities: ['Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Yokohama'] },
    { country: 'Taiwan', cities: ['Hsinchu', 'Taipei', 'Taichung', 'Kaohsiung'] },
    { country: 'South Korea', cities: ['Seoul', 'Incheon', 'Suwon', 'Ulsan'] },
    { country: 'Canada', cities: ['Montreal', 'Toronto', 'Calgary', 'Vancouver'] },
    { country: 'Mexico', cities: ['Monterrey', 'Querétaro', 'Tijuana', 'Guadalajara'] },
    { country: 'United Kingdom', cities: ['Sheffield', 'Birmingham', 'Bristol', 'Coventry'] }
  ];
  const categories = [
    'Precision Machining & Hydraulics',
    'Semiconductors & Microcontrollers',
    'Structural Composites & Alloys',
    'Sensor Arrays & Optics',
    'Electromechanical Actuators',
    'Thermal Management & Coolers',
    'Industrial Fasteners & Seals',
    'Power Electronics & Battery Cells'
  ];

  const remainingSuppliers: Supplier[] = [];
  for (let i = 2; i <= 150; i++) {
    if (i === 42 || i === 89) continue; // Already explicitly defined
    const id = `SUP-${String(i).padStart(3, '0')}`;
    const name = `${rng.choice(supplierPrefixes)} ${rng.choice(supplierSuffixes)}`;
    const location = rng.choice(countries);
    const city = rng.choice(location.cities);
    const category = rng.choice(categories);

    // Intentional distribution:
    // ~10 high risk, ~25 medium risk, remainder low risk
    let overallRiskLevel: Severity = 'LOW';
    let status: SupplierStatus = 'APPROVED';
    let onTimeDeliveryPct = rng.range(92, 99);
    let defectRatePct = rng.range(0.4, 1.8);

    if (i % 14 === 0) {
      overallRiskLevel = 'HIGH';
      status = rng.choice(['UNDER_REVIEW', 'CONDITIONAL']);
      onTimeDeliveryPct = rng.range(75, 84);
      defectRatePct = rng.range(3.5, 5.2);
    } else if (i % 6 === 0) {
      overallRiskLevel = 'MEDIUM';
      status = 'APPROVED';
      onTimeDeliveryPct = rng.range(85, 91);
      defectRatePct = rng.range(2.0, 3.2);
    }

    remainingSuppliers.push({
      id,
      code: `${name.substring(0, 4).toUpperCase()}-${id.substring(4)}`,
      name,
      country: location.country,
      city,
      tier: rng.choice([1, 1, 2, 2, 3]),
      category,
      status,
      contactName: `Manager ${name.split(' ')[0]}`,
      contactEmail: `procurement@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      onTimeDeliveryPct: Number(onTimeDeliveryPct.toFixed(1)),
      defectRatePct: Number(defectRatePct.toFixed(2)),
      avgLeadTimeDays: rng.rangeInt(20, 60),
      annualSpendUsd: rng.rangeInt(150000, 2400000),
      overallRiskLevel,
      notes: overallRiskLevel === 'HIGH' ? 'Flagged for quality or delivery variance.' : 'Standard operational vendor.'
    });
  }

  const suppliers: Supplier[] = [demoSupplier, altSupplier1, altSupplier2, ...remainingSuppliers];

  // 2. ITEMS & INVENTORY
  // Demo Critical Item
  const demoItem: ComponentItem = {
    id: 'ITEM-001',
    code: 'CMP-TITAN-X1',
    name: 'Titanium High-Pressure Fuel Valve',
    category: 'Precision Machining & Hydraulics',
    criticality: 'A',
    unitOfMeasure: 'EA',
    currentStock: 250,
    minSafetyStock: 200,
    avgDailyDemand: 10, // 250 / 10 = exactly 25.0 days of stock cover
    daysOfStockCover: 25.0,
    primarySupplierId: 'SUP-001',
    approvedSupplierIds: ['SUP-001'], // Sole approved supplier!
    candidateSupplierIds: ['SUP-042', 'SUP-089'], // 2 unapproved alternatives!
    unitCostBase: 450.0
  };

  const sampleItems: ComponentItem[] = [
    demoItem,
    {
      id: 'ITEM-002',
      code: 'CMP-MCU-ARM9',
      name: 'Automotive Dual-Core Cortex Controller',
      category: 'Semiconductors & Microcontrollers',
      criticality: 'A',
      unitOfMeasure: 'EA',
      currentStock: 1200,
      minSafetyStock: 800,
      avgDailyDemand: 40,
      daysOfStockCover: 30.0,
      primarySupplierId: 'SUP-002',
      approvedSupplierIds: ['SUP-002'],
      candidateSupplierIds: ['SUP-007'],
      unitCostBase: 88.0
    },
    {
      id: 'ITEM-003',
      code: 'CMP-OPT-LIDAR',
      name: 'High-Res Solid-State LiDAR Receiver',
      category: 'Sensor Arrays & Optics',
      criticality: 'A',
      unitOfMeasure: 'EA',
      currentStock: 450,
      minSafetyStock: 300,
      avgDailyDemand: 15,
      daysOfStockCover: 30.0,
      primarySupplierId: 'SUP-003',
      approvedSupplierIds: ['SUP-003', 'SUP-008'],
      candidateSupplierIds: [],
      unitCostBase: 620.0
    },
    {
      id: 'ITEM-004',
      code: 'CMP-SERVO-500W',
      name: 'Brushless Actuator Servo Motor 500W',
      category: 'Electromechanical Actuators',
      criticality: 'B',
      unitOfMeasure: 'EA',
      currentStock: 850,
      minSafetyStock: 400,
      avgDailyDemand: 20,
      daysOfStockCover: 42.5,
      primarySupplierId: 'SUP-004',
      approvedSupplierIds: ['SUP-004', 'SUP-012'],
      candidateSupplierIds: [],
      unitCostBase: 145.0
    },
    {
      id: 'ITEM-005',
      code: 'CMP-CARB-WING',
      name: 'Prepreg Carbon Fiber Stiffener Spar',
      category: 'Structural Composites & Alloys',
      criticality: 'B',
      unitOfMeasure: 'EA',
      currentStock: 1600,
      minSafetyStock: 600,
      avgDailyDemand: 32,
      daysOfStockCover: 50.0,
      primarySupplierId: 'SUP-005',
      approvedSupplierIds: ['SUP-005', 'SUP-015'],
      candidateSupplierIds: [],
      unitCostBase: 310.0
    },
    {
      id: 'ITEM-006',
      code: 'CMP-SEAL-HNBR',
      name: 'Cryogenic HNBR High-Pressure O-Ring',
      category: 'Industrial Fasteners & Seals',
      criticality: 'C',
      unitOfMeasure: 'PK',
      currentStock: 4500,
      minSafetyStock: 1000,
      avgDailyDemand: 60,
      daysOfStockCover: 75.0,
      primarySupplierId: 'SUP-006',
      approvedSupplierIds: ['SUP-006', 'SUP-018', 'SUP-025'],
      candidateSupplierIds: [],
      unitCostBase: 12.5
    }
  ];

  // Distribute items across suppliers
  const items: ComponentItem[] = [...sampleItems];
  for (let i = 7; i <= 35; i++) {
    const supp = suppliers[i % suppliers.length];
    const code = `CMP-GEN-${String(i).padStart(3, '0')}`;
    const crit = i % 4 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C';
    const demand = rng.rangeInt(5, 50);
    const stock = rng.rangeInt(demand * 15, demand * 60);
    items.push({
      id: `ITEM-${String(i).padStart(3, '0')}`,
      code,
      name: `${supp.category.split('&')[0].trim()} Module ${i}`,
      category: supp.category,
      criticality: crit,
      unitOfMeasure: 'EA',
      currentStock: stock,
      minSafetyStock: demand * 15,
      avgDailyDemand: demand,
      daysOfStockCover: Number((stock / demand).toFixed(1)),
      primarySupplierId: supp.id,
      approvedSupplierIds: [supp.id],
      candidateSupplierIds: [],
      unitCostBase: rng.rangeInt(45, 800)
    });
  }

  // 3. CONTRACTS
  const contracts: Contract[] = [
    {
      id: 'CNT-2025-001',
      contractNumber: 'CTR-APEX-TITAN-2025',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      agreedPrice: 450.0, // Agreed contract price: $450.00
      currency: 'USD',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      paymentTerms: 'Net 45',
      status: 'ACTIVE'
    }
  ];

  for (const item of items) {
    if (item.id === 'ITEM-001') continue;
    contracts.push({
      id: `CNT-${item.id}`,
      contractNumber: `CTR-${item.code}-2025`,
      supplierId: item.primarySupplierId,
      itemId: item.id,
      agreedPrice: item.unitCostBase,
      currency: 'USD',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      paymentTerms: 'Net 30',
      status: 'ACTIVE'
    });
  }

  // 4. PURCHASE ORDERS
  // Demo Scenario POs:
  // Contract price is $450.00.
  // Most recent PO-2026-881 invoiced at $481.50 -> ((481.50 - 450)/450) = +7.00% price deviation!
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'PO-APEX-01',
      poNumber: 'PO-2026-712',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      orderDate: '2026-06-10',
      promisedDate: '2026-07-25',
      actualDeliveryDate: '2026-07-25',
      orderedQty: 100,
      receivedQty: 100,
      agreedUnitPrice: 450.0,
      invoicedUnitPrice: 450.0,
      priceDeviationPct: 0.0,
      isLate: false,
      delayDays: 0,
      status: 'DELIVERED'
    },
    {
      id: 'PO-APEX-02',
      poNumber: 'PO-2026-799',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      orderDate: '2026-07-20',
      promisedDate: '2026-09-05',
      actualDeliveryDate: '2026-09-11',
      orderedQty: 120,
      receivedQty: 120,
      agreedUnitPrice: 450.0,
      invoicedUnitPrice: 450.0,
      priceDeviationPct: 0.0,
      isLate: true,
      delayDays: 6,
      status: 'DELIVERED'
    },
    {
      id: 'PO-APEX-03',
      poNumber: 'PO-2026-881',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      orderDate: '2026-08-25',
      promisedDate: '2026-10-01',
      actualDeliveryDate: '2026-10-05',
      orderedQty: 150,
      receivedQty: 150,
      agreedUnitPrice: 450.0,
      invoicedUnitPrice: 481.50, // EXACTLY +7.0% DEVIATION ($450 * 1.07 = $481.50)
      priceDeviationPct: 7.0,
      isLate: true,
      delayDays: 4,
      status: 'DELIVERED'
    }
  ];

  // Additional POs for other items
  for (let i = 2; i <= 35; i++) {
    const item = items[i - 1];
    const agreed = item.unitCostBase;
    // 3 POs per item
    for (let p = 1; p <= 3; p++) {
      const isDeviated = (i === 14 && p === 3); // Intentional price deviation on supplier 14
      const invoiced = isDeviated ? Number((agreed * 1.055).toFixed(2)) : agreed;
      const devPct = Number((((invoiced - agreed) / agreed) * 100).toFixed(2));
      const isLate = (i % 5 === 0 && p === 3);

      purchaseOrders.push({
        id: `PO-${item.id}-${p}`,
        poNumber: `PO-2026-${String(1000 + i * 10 + p)}`,
        supplierId: item.primarySupplierId,
        itemId: item.id,
        orderDate: `2026-0${5 + p}-15`,
        promisedDate: `2026-0${6 + p}-25`,
        actualDeliveryDate: `2026-0${6 + p}-${isLate ? 29 : 23}`,
        orderedQty: rng.rangeInt(50, 200),
        receivedQty: rng.rangeInt(50, 200),
        agreedUnitPrice: agreed,
        invoicedUnitPrice: invoiced,
        priceDeviationPct: devPct,
        isLate,
        delayDays: isLate ? 6 : 0,
        status: 'DELIVERED'
      });
    }
  }

  // 5. INSPECTION LOTS
  // Demo Scenario:
  // Historical rate near 1.0% (e.g. 1.0% and 0.9%)
  // Recent inspection rejection rates of 6% and 9%!
  const inspections: InspectionLot[] = [
    {
      id: 'LOT-APEX-01',
      lotNumber: 'LOT-2026-0810',
      poId: 'PO-APEX-01',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      inspectionDate: '2026-07-26',
      sampleSize: 100,
      acceptedQty: 99,
      rejectedQty: 1, // 1.0% historical rejection rate
      rejectionRatePct: 1.0,
      defectCategory: 'Micro-burr on thread',
      severity: 'LOW',
      notes: 'Nominal baseline quality inspection lot.'
    },
    {
      id: 'LOT-APEX-02',
      lotNumber: 'LOT-2026-0855',
      poId: 'PO-APEX-01',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      inspectionDate: '2026-08-15',
      sampleSize: 100,
      acceptedQty: 99,
      rejectedQty: 1, // 1.0% historical baseline
      rejectionRatePct: 1.0,
      defectCategory: 'Surface roughness variance',
      severity: 'LOW',
      notes: 'Historical production lot within spec limits.'
    },
    {
      id: 'LOT-APEX-03',
      lotNumber: 'LOT-2026-0941',
      poId: 'PO-APEX-02',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      inspectionDate: '2026-09-12',
      sampleSize: 100,
      acceptedQty: 94,
      rejectedQty: 6, // EXACTLY 6% REJECTION RATE
      rejectionRatePct: 6.0,
      defectCategory: 'High-pressure seal seat concentricity runout',
      severity: 'HIGH',
      notes: 'Alarming jump in runout concentricity defects. 6 units failed helium leak check.'
    },
    {
      id: 'LOT-APEX-04',
      lotNumber: 'LOT-2026-0988',
      poId: 'PO-APEX-03',
      supplierId: 'SUP-001',
      itemId: 'ITEM-001',
      inspectionDate: '2026-10-06',
      sampleSize: 100,
      acceptedQty: 91,
      rejectedQty: 9, // EXACTLY 9% REJECTION RATE
      rejectionRatePct: 9.0,
      defectCategory: 'Seat porosity & dimensional tolerance out-of-spec',
      severity: 'CRITICAL',
      notes: 'Critical spike: 9 units failed pressure burst validation. Tooling wear suspected at supplier facility.'
    }
  ];

  // Inspection lots for remaining items
  for (let i = 2; i <= 35; i++) {
    const item = items[i - 1];
    inspections.push({
      id: `LOT-${item.id}-01`,
      lotNumber: `LOT-2026-${String(2000 + i * 5)}`,
      poId: `PO-${item.id}-1`,
      supplierId: item.primarySupplierId,
      itemId: item.id,
      inspectionDate: '2026-08-20',
      sampleSize: 100,
      acceptedQty: 99,
      rejectedQty: 1,
      rejectionRatePct: 1.0,
      defectCategory: 'Minor packaging wear',
      severity: 'LOW',
      notes: 'Compliant baseline lot.'
    });
    inspections.push({
      id: `LOT-${item.id}-02`,
      lotNumber: `LOT-2026-${String(2001 + i * 5)}`,
      poId: `PO-${item.id}-2`,
      supplierId: item.primarySupplierId,
      itemId: item.id,
      inspectionDate: '2026-09-28',
      sampleSize: 100,
      acceptedQty: 99,
      rejectedQty: 1,
      rejectionRatePct: 1.0,
      defectCategory: 'None',
      severity: 'LOW',
      notes: 'Standard passing inspection lot.'
    });
  }

  // 6. COMPLIANCE DOCUMENTS
  // Demo Scenario:
  // Reference date: 2026-10-09
  // Certificate expiring in EXACTLY 10 DAYS:
  // Expiry date = 2026-10-19!
  const complianceDocs: ComplianceDoc[] = [
    {
      id: 'DOC-APEX-01',
      supplierId: 'SUP-001',
      docType: 'AS9100',
      docNumber: 'AS-9100-REV-D-7741',
      issuer: 'TÜV SÜD Aerospace Certification',
      issueDate: '2023-10-19',
      expiryDate: '2026-10-19', // EXACTLY 10 DAYS REMAINING FROM 2026-10-09!
      daysUntilExpiry: 10,
      status: 'EXPIRING_SOON',
      verificationUrl: 'https://cert.tuvsud.com/verify/AS-9100-7741'
    },
    {
      id: 'DOC-APEX-02',
      supplierId: 'SUP-001',
      docType: 'ISO_9001',
      docNumber: 'ISO-9001-2015-8821',
      issuer: 'BSI Assurance Services',
      issueDate: '2024-03-15',
      expiryDate: '2027-03-15',
      daysUntilExpiry: 522,
      status: 'VALID'
    },
    {
      id: 'DOC-APEX-03',
      supplierId: 'SUP-001',
      docType: 'ROHS_REACH',
      docNumber: 'RR-DECL-APEX-2026',
      issuer: 'Intertek Compliance Labs',
      issueDate: '2026-01-10',
      expiryDate: '2027-01-10',
      daysUntilExpiry: 93,
      status: 'VALID'
    }
  ];

  // Candidate alternative suppliers compliance docs
  complianceDocs.push({
    id: 'DOC-VANG-01',
    supplierId: 'SUP-042',
    docType: 'AS9100',
    docNumber: 'AS-9100-VANG-2024',
    issuer: 'DEKRA Certification GmbH',
    issueDate: '2024-05-10',
    expiryDate: '2027-05-10',
    daysUntilExpiry: 578,
    status: 'VALID'
  });
  complianceDocs.push({
    id: 'DOC-HELIOS-01',
    supplierId: 'SUP-089',
    docType: 'ISO_9001',
    docNumber: 'ISO-9001-JQA-4412',
    issuer: 'Japan Quality Assurance Agency (JQA)',
    issueDate: '2024-08-01',
    expiryDate: '2027-08-01',
    daysUntilExpiry: 661,
    status: 'VALID'
  });

  // Docs for remaining suppliers
  for (let i = 2; i <= 150; i++) {
    if (i === 42 || i === 89) continue;
    const supp = suppliers.find(s => s.id === `SUP-${String(i).padStart(3, '0')}`);
    if (!supp) continue;

    // Distribute a couple expiring soon and one expired
    let days = rng.rangeInt(60, 700);
    if (i === 18) days = 5; // Expiring in 5 days
    if (i === 24) days = 18; // Expiring in 18 days
    if (i === 31) days = -3; // Expired 3 days ago

    const expDate = new Date(SIMULATED_TODAY.getTime() + days * 86400000).toISOString().split('T')[0];
    const status = days <= 0 ? 'EXPIRED' : days <= 30 ? 'EXPIRING_SOON' : 'VALID';

    complianceDocs.push({
      id: `DOC-SUP-${String(i).padStart(3, '0')}-01`,
      supplierId: supp.id,
      docType: rng.choice(['ISO_9001', 'ISO_14001', 'IATF_16949', 'AS9100']),
      docNumber: `CERT-${String(i).padStart(3, '0')}-${rng.rangeInt(1000, 9999)}`,
      issuer: rng.choice(['DNV GL', 'SGS', 'Bureau Veritas', 'TÜV Rheinland']),
      issueDate: '2024-01-15',
      expiryDate: expDate,
      daysUntilExpiry: days,
      status
    });
  }

  // 7. INITIAL ACTIONS & AUDIT TRAIL
  const actions: ActionDraft[] = [
    {
      id: 'ACT-2026-001',
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: 'Fast-Track Qualification: Vanguard Micro-Foundry for Titanium Valve',
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: 'ITEM-001',
      itemCode: 'CMP-TITAN-X1',
      itemName: 'Titanium High-Pressure Fuel Valve',
      reason: 'Mitigate critical sole-source dependency on Apex Precision Hydraulics due to escalating defect rates and 10-day certificate expiry window.',
      supportingEvidence: 'Apex inspection rejection rate surged to 9.0%; AS9100 certificate expires in 10 days; current stock cover is 25.0 days against 45-day vendor lead time.',
      recommendedDeadline: '2026-10-23',
      urgency: 'IMMEDIATE',
      expectedOutcome: 'Complete stage-2 quality audit and approve pilot test batch of 50 valve bodies within 14 calendar days.',
      status: 'DRAFT',
      assignedTo: 'Lead Metallurgical Engineer & Procurement Director',
      notes: 'Critical path task. Coordinate with tooling team to expedite CMM qualification program.',
      createdAt: '2026-10-09T03:15:00Z'
    },
    {
      id: 'ACT-2026-002',
      actionType: 'QUALITY_INSPECTION',
      title: 'Mandatory Level 3 Incoming Lot CMM Audit on Apex Deliveries',
      supplierId: 'SUP-001',
      supplierName: 'Apex Precision Hydraulics',
      itemId: 'ITEM-001',
      itemCode: 'CMP-TITAN-X1',
      itemName: 'Titanium High-Pressure Fuel Valve',
      reason: 'Recent lot rejections at 6% and 9% indicate out-of-tolerance concentricity runout and porosity.',
      supportingEvidence: 'Lots LOT-2026-0941 (6% rejects) and LOT-2026-0988 (9% rejects) failed helium leak checks.',
      recommendedDeadline: '2026-10-12',
      urgency: 'IMMEDIATE',
      expectedOutcome: 'Halt uninspected dock-to-stock deliveries. Enforce 100% CMM runout verification on next 3 shipments.',
      status: 'APPROVED',
      assignedTo: 'Incoming Quality Control Supervisor',
      notes: 'Approved by Senior Procurement Manager. Quarantine hold active for unverified lots.',
      createdAt: '2026-10-08T14:30:00Z',
      reviewedAt: '2026-10-08T16:00:00Z',
      reviewedBy: 'Elena Rostova (Head of Sourcing)',
      reviewComment: 'Immediate risk mitigation approved. Quality team dispatched to quarantine incoming dock.'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'AUDIT-001',
      timestamp: '2026-10-08T14:30:00Z',
      actor: 'RiskPilot Decision Engine',
      eventType: 'RECOMMENDATION_GENERATED',
      details: 'Evaluated compounding risk on SUP-001: 9% reject spike, 10-day AS9100 expiry, +7% price hike.',
      metadata: { supplierId: 'SUP-001', itemId: 'ITEM-001', riskScore: 99 }
    },
    {
      id: 'AUDIT-002',
      actionId: 'ACT-2026-002',
      timestamp: '2026-10-08T16:00:00Z',
      actor: 'Elena Rostova (Head of Sourcing)',
      eventType: 'ACTION_APPROVED',
      details: 'Approved mandatory Level 3 incoming quality inspection for Apex Precision Hydraulics.',
      metadata: { actionId: 'ACT-2026-002', status: 'APPROVED' }
    },
    {
      id: 'AUDIT-003',
      actionId: 'ACT-2026-001',
      timestamp: '2026-10-09T03:15:00Z',
      actor: 'RiskPilot AI Agent',
      eventType: 'DRAFT_CREATED',
      details: 'Synthesized second-source fast-track qualification draft ACT-2026-001 for Vanguard Micro-Foundry.',
      metadata: { actionId: 'ACT-2026-001', candidateSupplier: 'SUP-042' }
    }
  ];

  return {
    suppliers,
    items,
    contracts,
    purchaseOrders,
    inspections,
    complianceDocs,
    actions,
    auditLogs
  };
}
