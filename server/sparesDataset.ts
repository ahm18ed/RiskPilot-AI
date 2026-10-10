import { readFileSync } from 'node:fs';
import type { AIStructuredResponse } from './aiService';

type CsvRow = Record<string, string>;

interface ProductRow {
  sku: string;
  name: string;
  model: string;
  category: string;
}

interface InventoryRow {
  sku: string;
  location: string;
  stock: number;
}

interface SalesRow {
  date: string;
  sku: string;
  location: string;
  qty: number;
}

interface SupplierOffer {
  supplier: string;
  sku: string;
  price: number;
  leadDays: number;
  moq: number;
}

interface PurchaseOrderRow {
  po: string;
  supplier: string;
  sku: string;
  qty: number;
  expectedDate: string;
  status: string;
}

export interface SparesDeskDataset {
  snapshotDate: string;
  products: ProductRow[];
  inventory: InventoryRow[];
  sales: SalesRow[];
  suppliers: SupplierOffer[];
  purchaseOrders: PurchaseOrderRow[];
  rawCsvLines: Record<string, string[]>;
  salesStart: string;
  salesEnd: string;
  salesCalendarDays: number;
}

function parseCsv(text: string): CsvRow[] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++;
      row.push(field);
      if (row.some(value => value.length > 0)) records.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some(value => value.length > 0)) records.push(row);
  }

  const headers = (records.shift() ?? []).map(header => header.trim());
  return records.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()])));
}

function readCsv(fileName: string): CsvRow[] {
  return parseCsv(readFileSync(new URL(`../data/spares-desk/${fileName}`, import.meta.url), 'utf8'));
}

function readCsvLines(fileName: string): string[] {
  const content = readFileSync(new URL(`../data/spares-desk/${fileName}`, import.meta.url), 'utf8');
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd().split('\n');
}

let cachedDataset: SparesDeskDataset | undefined;

export function getSparesDeskDataset(): SparesDeskDataset {
  if (cachedDataset) return cachedDataset;

  const products = readCsv('products.csv').map(row => ({
    sku: row.sku,
    name: row.product_name,
    model: row.machine_model,
    category: row.category
  }));
  const inventory = readCsv('inventory.csv').map(row => ({ sku: row.sku, location: row.location, stock: Number(row.stock) || 0 }));
  const sales = readCsv('sales.csv').map(row => ({ sku: row.sku, location: row.location, date: row.date, qty: Number(row.qty_sold) || 0 }));
  const suppliers = readCsv('suppliers.csv').map(row => ({
    supplier: row.supplier,
    sku: row.sku,
    price: Number(row.price) || 0,
    leadDays: Number(row.lead_time_days) || 0,
    moq: Number(row.moq) || 0
  }));
  const purchaseOrders = readCsv('purchase_orders.csv').map(row => ({
    po: row.po,
    supplier: row.supplier,
    sku: row.sku,
    qty: Number(row.qty) || 0,
    expectedDate: row.expected_date,
    status: row.status
  }));

  const salesDates = sales.map(row => row.date).sort();
  const salesStart = salesDates[0] ?? '';
  const salesEnd = salesDates[salesDates.length - 1] ?? '';
  const salesCalendarDays = salesStart && salesEnd
    ? Math.floor((Date.parse(`${salesEnd}T00:00:00Z`) - Date.parse(`${salesStart}T00:00:00Z`)) / 86_400_000) + 1
    : 1;

  cachedDataset = {
    snapshotDate: '2026-11-16',
    products,
    inventory,
    sales,
    suppliers,
    purchaseOrders,
    rawCsvLines: Object.fromEntries(['products.csv', 'inventory.csv', 'sales.csv', 'suppliers.csv', 'purchase_orders.csv'].map(fileName => [fileName, readCsvLines(fileName)])),
    salesStart,
    salesEnd,
    salesCalendarDays
  };
  return cachedDataset;
}

const locationNames = ['Bagalkot', 'Belgaum', 'Bijapur', 'Dharwad', 'Gokak', 'Hubli', 'Belgaum WH', 'Hubli WH'];
const numberWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const formatNumber = (value: number, digits = 1) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
const money = (value: number) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}`;
const markdownTable = (headers: string[], rows: (string | number)[][]) =>
  `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;

interface SkuMetrics {
  product: ProductRow;
  stockByLocation: Map<string, number>;
  totalStock: number;
  salesQty: number;
  dailyDemand: number;
  daysCover: number | null;
  offers: SupplierOffer[];
  orders: PurchaseOrderRow[];
}

function getSkuMetrics(dataset: SparesDeskDataset): SkuMetrics[] {
  const products = new Map(dataset.products.map(product => [product.sku, product]));
  const metrics = new Map<string, SkuMetrics>();
  for (const product of dataset.products) {
    metrics.set(product.sku, {
      product,
      stockByLocation: new Map(),
      totalStock: 0,
      salesQty: 0,
      dailyDemand: 0,
      daysCover: null,
      offers: [],
      orders: []
    });
  }
  for (const row of dataset.inventory) {
    const item = metrics.get(row.sku);
    if (!item) continue;
    item.stockByLocation.set(row.location, row.stock);
    item.totalStock += row.stock;
  }
  for (const row of dataset.sales) {
    const item = metrics.get(row.sku);
    if (item) item.salesQty += row.qty;
  }
  for (const item of metrics.values()) {
    item.dailyDemand = item.salesQty / dataset.salesCalendarDays;
    item.daysCover = item.dailyDemand > 0 ? item.totalStock / item.dailyDemand : null;
    item.offers = dataset.suppliers.filter(offer => offer.sku === item.product.sku).sort((a, b) => a.price - b.price);
    item.orders = dataset.purchaseOrders.filter(order => order.sku === item.product.sku);
  }
  return [...metrics.values()].filter(item => products.has(item.product.sku));
}

function getDatasetTotals(dataset: SparesDeskDataset, metrics: SkuMetrics[]) {
  const totalStock = dataset.inventory.reduce((sum, row) => sum + row.stock, 0);
  const totalSales = dataset.sales.reduce((sum, row) => sum + row.qty, 0);
  const locationSales = new Map<string, number>();
  for (const row of dataset.sales) locationSales.set(row.location, (locationSales.get(row.location) ?? 0) + row.qty);
  const categories = new Map<string, { skus: number; sales: number; stock: number }>();
  for (const item of metrics) {
    const current = categories.get(item.product.category) ?? { skus: 0, sales: 0, stock: 0 };
    current.skus++;
    current.sales += item.salesQty;
    current.stock += item.totalStock;
    categories.set(item.product.category, current);
  }
  return { totalStock, totalSales, locationSales, categories };
}

function findRequestedSku(query: string, metrics: SkuMetrics[]): SkuMetrics | undefined {
  const skuMatch = query.match(/\b[A-Z]{3}-\d{4}\b/i)?.[0]?.toUpperCase();
  if (skuMatch) return metrics.find(item => item.product.sku === skuMatch);
  const normalized = query.toLowerCase();
  return metrics.find(item => item.product.name.length > 4 && normalized.includes(item.product.name.toLowerCase()))
    ?? metrics.find(item => item.product.model.length > 4 && normalized.includes(item.product.model.toLowerCase()));
}

export function shouldAnalyzeSparesDeskQuery(query: string): boolean {
  const q = query.toLowerCase();
  const dataset = getSparesDeskDataset();
  if (/\b(?:products|inventory|sales|suppliers|purchase_orders)\.csv\b/i.test(q)) return true;
  const knownEntity = dataset.products.some(row => q.includes(row.sku.toLowerCase()))
    || dataset.products.some(row => q.includes(row.model.toLowerCase()))
    || dataset.products.some(row => q.includes(row.category.toLowerCase()))
    || dataset.suppliers.some(row => q.includes(row.supplier.toLowerCase()))
    || locationNames.some(location => q.includes(location.toLowerCase()));
  return knownEntity || /\b(spare parts?|sku|product|inventory|stock|sales|sold|reorder|restock|purchase orders?|\bpo\b|suppliers?|vendors?|supplier quote|supplier price|lead time|moq|store|warehouse|tractor|machine model|category)\b/i.test(query);
}

export function isSparesDatasetFileQuestion(query: string): boolean {
  return /\b(?:products|inventory|sales|suppliers|purchase_orders)\.csv\b/i.test(query);
}

export function buildSparesDeskContext(query: string): string {
  const dataset = getSparesDeskDataset();
  const metrics = getSkuMetrics(dataset);
  const totals = getDatasetTotals(dataset, metrics);
  const requested = findRequestedSku(query, metrics);
  const topSellers = [...metrics].sort((a, b) => b.salesQty - a.salesQty).slice(0, 8);
  const lowCover = metrics.filter(item => item.daysCover !== null).sort((a, b) => (a.daysCover ?? Infinity) - (b.daysCover ?? Infinity)).slice(0, 10);
  const matchingOffers = requested?.offers ?? dataset.suppliers.filter(offer => query.toLowerCase().includes(offer.supplier.toLowerCase()));
  const matchingOrders = requested?.orders ?? dataset.purchaseOrders.filter(order => query.toLowerCase().includes(order.supplier.toLowerCase()) || /purchase order|\bpo\b|open order|pending order/i.test(query));
  const result = {
    source: 'Kaveri Spares & Hydraulics challenge dataset',
    snapshotDate: dataset.snapshotDate,
    salesRange: { start: dataset.salesStart, end: dataset.salesEnd, calendarDays: dataset.salesCalendarDays, note: 'Dates missing from sales.csv represent zero sales.' },
    totals: {
      productSkus: dataset.products.length,
      inventoryRecords: dataset.inventory.length,
      supplierOffers: dataset.suppliers.length,
      uniqueSuppliers: new Set(dataset.suppliers.map(row => row.supplier)).size,
      purchaseOrders: dataset.purchaseOrders.length,
      salesRows: dataset.sales.length,
      unitsSold: totals.totalSales,
      unitsInStock: totals.totalStock
    },
    salesByLocation: [...totals.locationSales.entries()].map(([location, qty]) => ({ location, unitsSold: qty })).sort((a, b) => b.unitsSold - a.unitsSold),
    topSellers: topSellers.map(item => ({ sku: item.product.sku, product: item.product.name, category: item.product.category, unitsSold: item.salesQty, totalStock: item.totalStock, daysOfCover: item.daysCover === null ? 'no recorded sales' : Number(item.daysCover.toFixed(1)) })),
    lowestStockCover: lowCover.map(item => ({ sku: item.product.sku, product: item.product.name, unitsSold: item.salesQty, dailyDemand: Number(item.dailyDemand.toFixed(2)), totalStock: item.totalStock, daysOfCover: Number((item.daysCover ?? 0).toFixed(1)), lowestQuotedLeadDays: item.offers.length ? Math.min(...item.offers.map(offer => offer.leadDays)) : null })),
    matchingProduct: requested ? {
      ...requested.product,
      stockByLocation: Object.fromEntries(locationNames.map(location => [location, requested.stockByLocation.get(location) ?? 0])),
      totalStock: requested.totalStock,
      unitsSoldInPeriod: requested.salesQty,
      averageDailyDemand: Number(requested.dailyDemand.toFixed(2)),
      estimatedDaysOfCover: requested.daysCover === null ? null : Number(requested.daysCover.toFixed(1)),
      supplierOffers: requested.offers,
      purchaseOrders: requested.orders
    } : null,
    matchingSupplierOffers: matchingOffers.slice(0, 12),
    matchingPurchaseOrders: matchingOrders.slice(0, 12),
    categoryTotals: [...totals.categories.entries()].map(([category, values]) => ({ category, ...values, unitsSold: values.sales })).sort((a, b) => b.unitsSold - a.unitsSold),
    purchaseOrderStatusCounts: Object.fromEntries([...new Set(dataset.purchaseOrders.map(order => order.status))].map(status => [status, dataset.purchaseOrders.filter(order => order.status === status).length]))
  };
  return JSON.stringify(result);
}

function response(answerMarkdown: string, evidencePoints: string[], recommendation = 'Use the figures above for prioritization; confirm any changed stock or supplier terms before placing an order.', operationName: string | null = 'Kaveri Spare Parts Dataset Analysis'): AIStructuredResponse {
  return {
    answerMarkdown,
    analysisSource: 'dataset',
    workflowStage: 'Evaluate',
    executedOperations: operationName ? [{
      operationType: 'SUPPLIER_RISK_INVESTIGATION',
      operationName,
      parameters: { source: 'Kaveri Spares & Hydraulics CSV snapshot', tables: ['products', 'inventory', 'sales', 'suppliers', 'purchase_orders'] },
      computedMetrics: { snapshotDate: '2026-11-16', salesRows: 12777 },
      executionTimestamp: new Date().toISOString()
    }] : [],
    identifiedRisks: [],
    evidencePoints,
    compoundingFactors: [],
    optionsCompared: [],
    recommendedAction: recommendation,
    confidenceScore: 94,
    uncertainties: ['This is the provided snapshot: stock is dated 2026-11-16 and sales history runs through 2026-11-15. It may not reflect later changes.'],
    isDeterministicFallback: true,
    fallbackReason: 'Exact calculations are being made from the included Kaveri spare-parts CSV snapshot.'
  };
}

export function analyzeSparesDeskQuery(query: string): AIStructuredResponse | null {
  if (!shouldAnalyzeSparesDeskQuery(query)) return null;
  const dataset = getSparesDeskDataset();
  const metrics = getSkuMetrics(dataset);
  const totals = getDatasetTotals(dataset, metrics);
  const q = query.toLowerCase();
  const selected = findRequestedSku(query, metrics);

  const fileMatch = query.match(/\b(products|inventory|sales|suppliers|purchase_orders)\.csv\b/i)?.[0]?.toLowerCase();
  if (fileMatch) {
    const lineRequest = query.match(/\bfirst\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:csv\s+)?lines?\b/i);
    const rowRequest = query.match(/\bfirst\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:csv\s+)?(?:data\s+)?(?:rows?|records?)\b/i);
    const previewRequest = lineRequest || rowRequest;
    if (previewRequest) {
      const requestedCount = Number(previewRequest[1]) || numberWords[previewRequest[1].toLowerCase()] || 10;
      const count = Math.min(Math.max(requestedCount, 1), 50);
      const sourceLines = dataset.rawCsvLines[fileMatch];
      const isLineCount = !!lineRequest;
      const displayedLines = sourceLines.slice(0, isLineCount ? count : count + 1);
      const answer = [
        `### First ${Math.min(displayedLines.length, count)} ${isLineCount ? 'lines' : 'data rows'} of ${fileMatch}`,
        isLineCount
          ? 'These are the literal first lines from the CSV, including its header if it falls within the requested line count.'
          : 'The header is shown, followed by the requested number of data rows.',
        '',
        '```csv',
        ...displayedLines,
        '```',
        '',
        `Source snapshot: ${dataset.snapshotDate}.`
      ].join('\n');
      return response(answer, [`Returned ${displayedLines.length} literal CSV lines from ${fileMatch}.`], 'Preview source rows only; this is not a complete file export.', null);
    }

    const fileDescriptions: Record<string, { purpose: string; columns: string[]; records: number; howItConnects: string }> = {
      'products.csv': {
        purpose: 'The product catalogue: one row per spare part, with its SKU, display name, compatible machine model, and category.',
        columns: ['sku', 'product_name', 'machine_model', 'category'],
        records: dataset.products.length,
        howItConnects: 'Join this file to the other four files using sku.'
      },
      'inventory.csv': {
        purpose: 'The inventory snapshot by SKU and store or warehouse location. It records on-hand stock at the snapshot date.',
        columns: ['sku', 'location', 'stock'],
        records: dataset.inventory.length,
        howItConnects: `Join to products.csv using sku. Locations include ${locationNames.join(', ')}.`
      },
      'sales.csv': {
        purpose: 'Historical units sold for each SKU at each location on each date.',
        columns: ['date', 'sku', 'location', 'qty_sold'],
        records: dataset.sales.length,
        howItConnects: `Join to products.csv using sku; use location for store-level demand. The supplied notes say omitted dates mean zero sales. Coverage is ${dataset.salesStart} through ${dataset.salesEnd}.`
      },
      'suppliers.csv': {
        purpose: 'Supplier offers by SKU, including price, quoted lead time, and minimum order quantity (MOQ). Prices are in Indian rupees per unit.',
        columns: ['supplier', 'sku', 'price', 'lead_time_days', 'moq'],
        records: dataset.suppliers.length,
        howItConnects: 'Join to products, stock, sales, and purchase orders using sku; compare offers for the same SKU.'
      },
      'purchase_orders.csv': {
        purpose: 'Purchase orders listing the supplier, SKU, ordered quantity, expected date, and current order status.',
        columns: ['po', 'supplier', 'sku', 'qty', 'expected_date', 'status'],
        records: dataset.purchaseOrders.length,
        howItConnects: 'Join to products, inventory, sales, and supplier offers using sku; status values include Open, Confirmed, and Received.'
      }
    };
    const description = fileDescriptions[fileMatch];
    return response(
      `### ${fileMatch}\n${description.purpose}\n\n**Records:** ${description.records.toLocaleString('en-IN')} data rows (excluding the header).\n\n**Columns:** ${description.columns.map(column => `\`${column}\``).join(', ')}.\n\n**How it fits the dataset:** ${description.howItConnects}\n\nThe complete snapshot is dated **${dataset.snapshotDate}**; sales history ends **${dataset.salesEnd}**.`,
      [
        `${fileMatch}: ${description.records} records and columns ${description.columns.join(', ')}.`,
        description.howItConnects,
        `Dataset snapshot: ${dataset.snapshotDate}; sales history ends ${dataset.salesEnd}.`
      ],
      `Use ${fileMatch} with the other CSVs to answer cross-table questions; confirm the snapshot dates before relying on the figures for current purchasing decisions.`
    );
  }

  const requestedCategory = [...totals.categories.keys()].find(category => q.includes(category.toLowerCase()));
  const requestedModel = [...new Set(dataset.products.map(product => product.model))].find(model => q.includes(model.toLowerCase()));
  if ((requestedCategory || requestedModel) && /\b(list|show|which|what|find|products?|skus?|parts?)\b/i.test(query)) {
    const matches = dataset.products.filter(product =>
      (!requestedCategory || product.category === requestedCategory) &&
      (!requestedModel || product.model === requestedModel)
    );
    const rows = matches.map(product => [product.sku, product.name, product.category, product.model]);
    return response(
      `### Matching products\nFound **${matches.length}** product(s)${requestedCategory ? ` in ${requestedCategory}` : ''}${requestedModel ? ` compatible with ${requestedModel}` : ''}.\n\n${markdownTable(['SKU', 'Product', 'Category', 'Machine model'], rows)}`,
      matches.slice(0, 8).map(product => `${product.sku}: ${product.name}, ${product.category}, ${product.model}.`)
    );
  }

  if (/\b(out of stock|zero stock|no stock|stockout|stock-out)\b/i.test(query)) {
    const location = locationNames.find(name => q.includes(name.toLowerCase()));
    const outOfStock = location
      ? metrics.filter(item => (item.stockByLocation.get(location) ?? 0) === 0)
      : metrics.filter(item => item.totalStock === 0);
    const rows = outOfStock.map(item => [item.product.sku, item.product.name, location ? location : item.totalStock, item.salesQty]);
    return response(
      `### ${location ? `Zero-stock SKUs in ${location}` : 'SKUs with zero stock across all locations'}\nFound **${outOfStock.length}** matching SKU(s).${location ? ' Zero stock is checked at the named location; other stores or warehouses may still have units.' : ''}\n\n${markdownTable(['SKU', 'Product', location ? `Stock at ${location}` : 'Total stock', 'Units sold in period'], rows)}`,
      outOfStock.slice(0, 10).map(item => `${item.product.sku} (${item.product.name}): ${location ? `0 units at ${location}` : '0 units total'}; ${item.salesQty} units sold during the dataset window.`),
      location ? `Check transfer availability from other branches or warehouses before buying; the zero is location-specific.` : 'Check supplier availability and open orders for the affected SKUs before deciding on emergency replenishment.'
    );
  }

  const requestedLocation = locationNames.find(name => q.includes(name.toLowerCase()));
  if (requestedLocation && /\b(sales|sold|demand|selling)\b/i.test(query)) {
    const bySku = new Map<string, number>();
    for (const row of dataset.sales) {
      if (row.location === requestedLocation) bySku.set(row.sku, (bySku.get(row.sku) ?? 0) + row.qty);
    }
    const rankedSales = [...bySku.entries()].sort((a, b) => b[1] - a[1]);
    const locationUnits = rankedSales.reduce((sum, [, qty]) => sum + qty, 0);
    const rows = rankedSales.slice(0, 15).map(([sku, qty]) => {
      const product = dataset.products.find(item => item.sku === sku);
      return [sku, product?.name ?? 'Unknown product', qty];
    });
    return response(
      `### Sales in ${requestedLocation}\n**${locationUnits.toLocaleString('en-IN')} units** were recorded over ${dataset.salesCalendarDays} calendar days (${dataset.salesStart}–${dataset.salesEnd}). The table lists the 15 highest-selling SKUs at this location.\n\n${markdownTable(['SKU', 'Product', 'Units sold'], rows)}`,
      rankedSales.slice(0, 8).map(([sku, qty]) => `${sku}: ${qty} units sold in ${requestedLocation}.`)
    );
  }

  if (requestedLocation && /\b(stock|inventory|availability|available|units)\b/i.test(query)) {
    const locationStock = metrics.map(item => ({ item, stock: item.stockByLocation.get(requestedLocation) ?? 0 }))
      .sort((a, b) => a.stock - b.stock).slice(0, 20);
    const rows = locationStock.map(({ item, stock }) => [item.product.sku, item.product.name, stock, item.salesQty]);
    return response(
      `### Lowest stock in ${requestedLocation}\nShowing the 20 lowest-stock SKUs by listed on-hand stock. Sales are total units over the supplied ${dataset.salesCalendarDays}-day window.\n\n${markdownTable(['SKU', 'Product', `Units at ${requestedLocation}`, 'Units sold overall'], rows)}`,
      locationStock.slice(0, 8).map(({ item, stock }) => `${item.product.sku}: ${stock} units at ${requestedLocation}; ${item.salesQty} total units sold in the period.`)
    );
  }

  if (/\b(stock|inventory|on.hand|available)\b/i.test(query) && /\b(most|highest|largest|maximum)\b/i.test(query)) {
    const rankedStock = [...metrics].sort((a, b) => b.totalStock - a.totalStock).slice(0, 15);
    const rows = rankedStock.map(item => [item.product.sku, item.product.name, item.totalStock, item.product.category]);
    return response(
      `### Highest total stock by SKU\nThis ranks stock summed across the six stores and two warehouses in the ${dataset.snapshotDate} inventory snapshot.\n\n${markdownTable(['SKU', 'Product', 'Total units', 'Category'], rows)}`,
      rankedStock.slice(0, 8).map(item => `${item.product.sku}: ${item.totalStock} units across all locations.`)
    );
  }

  if (/\b(how many|count|number of|overview|summari[sz]e|dataset|data snapshot|what data)\b/i.test(query)) {
    const supplierCount = new Set(dataset.suppliers.map(offer => offer.supplier)).size;
    return response(
      `### Dataset snapshot\nThis snapshot contains **${dataset.products.length} SKUs**, **${dataset.inventory.length.toLocaleString('en-IN')} inventory records** across ${locationNames.length} locations, **${new Set(dataset.sales.map(row => `${row.date}|${row.sku}|${row.location}`)).size.toLocaleString('en-IN')} sales records**, **${supplierCount} suppliers** with ${dataset.suppliers.length} SKU-level offers, and **${dataset.purchaseOrders.length} purchase orders**.\n\nThe inventory snapshot date is **${dataset.snapshotDate}**. Sales history covers **${dataset.salesStart} through ${dataset.salesEnd}** (${dataset.salesCalendarDays} calendar days), with **${totals.totalSales.toLocaleString('en-IN')} units sold** and **${totals.totalStock.toLocaleString('en-IN')} units currently listed in inventory**.`,
      [`Products: ${dataset.products.length}; inventory records: ${dataset.inventory.length}; supplier offers: ${dataset.suppliers.length}; purchase orders: ${dataset.purchaseOrders.length}.`, `Sales range: ${dataset.salesStart}–${dataset.salesEnd}; recorded rows: ${dataset.sales.length}; units sold: ${totals.totalSales.toLocaleString('en-IN')}.`]
    );
  }

  if (selected && (/\b(stock|inventory|sales|sold|supplier|price|quote|lead|moq|order|purchase|product|sku|cover|reorder|restock)\b/i.test(query) || /\b[A-Z]{3}-\d{4}\b/i.test(query))) {
    const stockRows = locationNames.map(location => [location, selected.stockByLocation.get(location) ?? 0]);
    const offerRows = selected.offers.map(offer => [offer.supplier, money(offer.price), `${offer.leadDays} days`, offer.moq]);
    const orderRows = selected.orders.map(order => [order.po, order.supplier, order.qty, order.expectedDate, order.status]);
    const answer = [
      `### ${selected.product.sku} — ${selected.product.name}\n**Category:** ${selected.product.category} · **Machine:** ${selected.product.model}\n\n**Inventory:** ${selected.totalStock} units across locations. Sales totaled **${selected.salesQty} units** over ${dataset.salesCalendarDays} calendar days (${formatNumber(selected.dailyDemand, 2)} units/day on average).${selected.daysCover === null ? ' No sales are recorded for this SKU in the supplied period.' : ` Estimated cover at that historical average is **${formatNumber(selected.daysCover)} days**; this is a simple estimate, not a forecast.`}`,
      `**Stock by location**\n${markdownTable(['Location', 'Units'], stockRows)}`,
      `**Supplier offers**\n${selected.offers.length ? markdownTable(['Supplier', 'Price/unit', 'Lead time', 'MOQ'], offerRows) : 'No supplier offer is listed for this SKU.'}`,
      `**Purchase orders**\n${selected.orders.length ? markdownTable(['PO', 'Supplier', 'Qty', 'Expected', 'Status'], orderRows) : 'No purchase order is listed for this SKU.'}`
    ].join('\n\n');
    return response(answer, [
      `${selected.product.sku}: ${selected.totalStock} units of stock across ${locationNames.length} locations.`,
      `Sales: ${selected.salesQty} units over ${dataset.salesCalendarDays} calendar days (${formatNumber(selected.dailyDemand, 2)} units/day).`,
      selected.offers.length ? `Lowest quote: ${selected.offers[0].supplier} at ${money(selected.offers[0].price)}/unit; lead ${selected.offers[0].leadDays} days; MOQ ${selected.offers[0].moq}.` : 'No supplier quotes found.'
    ], selected.daysCover !== null && selected.offers.length && selected.daysCover < Math.min(...selected.offers.map(offer => offer.leadDays))
      ? `Review replenishment for ${selected.product.sku}: estimated stock cover is below the shortest quoted lead time; verify local availability and open purchase orders before ordering.`
      : `For ${selected.product.sku}, compare its stock allocation and open purchase orders with the supplier lead time before deciding to replenish.`);
  }

  if (/\b(reorder|restock|replenish|stockout|stock-out|running out|low stock|urgent stock|shortage|what should i order|what to order)\b/i.test(query)) {
    const ranked = metrics.filter(item => item.daysCover !== null && item.offers.length > 0)
      .map(item => ({ ...item, shortestLead: Math.min(...item.offers.map(offer => offer.leadDays)) }))
      .sort((a, b) => ((a.daysCover ?? Infinity) - a.shortestLead) - ((b.daysCover ?? Infinity) - b.shortestLead))
      .slice(0, 10);
    const answerRows = ranked.map(item => [item.product.sku, item.product.name, item.totalStock, formatNumber(item.dailyDemand, 2), formatNumber(item.daysCover ?? 0), `${item.shortestLead} days`, item.daysCover! < item.shortestLead ? 'Cover below lead time' : 'Review demand/stock']);
    return response(
      `### Replenishment candidates\nRanked by estimated days of stock cover compared with the shortest supplier lead time. Demand is calculated from total sales divided by the ${dataset.salesCalendarDays}-day sales window; these are screening signals, not purchase instructions.\n\n${markdownTable(['SKU', 'Product', 'Stock', 'Avg. daily sales', 'Est. cover (days)', 'Min. lead', 'Signal'], answerRows)}\n\nValidate safety-stock targets, local store allocation, supplier MOQ, and open purchase orders before placing a replenishment order.`,
      ranked.slice(0, 5).map(item => `${item.product.sku}: ${item.totalStock} units in stock; ${formatNumber(item.dailyDemand, 2)} units/day; estimated ${formatNumber(item.daysCover ?? 0)} days cover vs ${item.shortestLead}-day shortest quoted lead time.`),
      'Review the SKUs whose estimated cover is below the shortest quoted lead time first; confirm open orders and demand forecast, then calculate replenishment quantities using the business safety-stock policy.'
    );
  }

  if (/\b(top|most|highest|best|fastest|popular|selling|sell|sold|demand)\b/i.test(query) && /sales|sold|selling|demand|product|sku|category|store|location|city/i.test(query)) {
    if (/\b(category|categories)\b/i.test(query)) {
      const categories = [...totals.categories.entries()].map(([category, values]) => ({ category, ...values })).sort((a, b) => b.sales - a.sales);
      const rows = categories.map(item => [item.category, item.skus, item.sales, item.stock]);
      return response(`### Sales by product category\n${markdownTable(['Category', 'SKUs', 'Units sold', 'Units in stock'], rows)}\n\nCategory sales total ${totals.totalSales.toLocaleString('en-IN')} units across the supplied sales window.`, rows.slice(0, 3).map(row => `${row[0]}: ${row[2]} units sold across ${row[1]} SKUs.`));
    }

    if (/\b(store|location|city|warehouse)\b/i.test(query)) {
      const locationRows = [...totals.locationSales.entries()].sort((a, b) => b[1] - a[1]);
      const rows = locationRows.map(([location, units]) => [location, units]);
      return response(`### Sales by location\n${markdownTable(['Location', 'Units sold'], rows)}\n\nSales history spans ${dataset.salesStart} to ${dataset.salesEnd}. The source notes that dates missing from sales.csv mean zero sales.`, rows.slice(0, 3).map(([location, units]) => `${location}: ${units} units sold.`));
    }

    const top = [...metrics].sort((a, b) => b.salesQty - a.salesQty).slice(0, 15);
    const rows = top.map(item => [item.product.sku, item.product.name, item.product.category, item.salesQty, item.totalStock]);
    return response(`### Top-selling products\n${markdownTable(['SKU', 'Product', 'Category', 'Units sold', 'Current stock'], rows)}\n\nRanked by total recorded sales from ${dataset.salesStart} through ${dataset.salesEnd}.`, top.slice(0, 5).map(item => `${item.product.sku} (${item.product.name}): ${item.salesQty} units sold; ${item.totalStock} units in stock.`));
  }

  if (/\b(purchase orders?|\bpo\b|open (?:purchase )?orders?|pending (?:purchase )?orders?|confirmed (?:purchase )?orders?|received (?:purchase )?orders?)\b/i.test(query)) {
    const statusFilter = /\b(open|pending)\b/i.test(query) ? 'Open' : /\bconfirmed\b/i.test(query) ? 'Confirmed' : /\breceived\b/i.test(query) ? 'Received' : undefined;
    const filtered = dataset.purchaseOrders.filter(order => !statusFilter || order.status.toLowerCase() === statusFilter.toLowerCase());
    const rows = filtered.map(order => [order.po, order.supplier, order.sku, order.qty, order.expectedDate, order.status]);
    return response(`### ${statusFilter ?? 'All'} purchase orders\n**${filtered.length}** order(s)${statusFilter ? ` with status ${statusFilter}` : ''}. Dates are the supplied expected delivery dates.\n\n${markdownTable(['PO', 'Supplier', 'SKU', 'Qty', 'Expected date', 'Status'], rows)}`, [`${filtered.length} purchase orders matched${statusFilter ? ` status=${statusFilter}` : ''}.`, `Dataset snapshot date: ${dataset.snapshotDate}.`]);
  }

  if (/\b(supplier|supplier quote|supplier price|vendor|lead time|moq|cheapest|lowest price)\b/i.test(query)) {
    const offers = selected?.offers ?? dataset.suppliers.filter(offer => q.includes(offer.supplier.toLowerCase()));
    if (offers.length > 0) {
      const offerRows = offers.sort((a, b) => a.price - b.price).map(offer => [offer.sku, offer.supplier, money(offer.price), `${offer.leadDays} days`, offer.moq]);
      return response(`### Supplier offers\n${markdownTable(['SKU', 'Supplier', 'Price/unit', 'Lead time', 'MOQ'], offerRows)}`, offers.slice(0, 8).map(offer => `${offer.sku}: ${offer.supplier} quoted ${money(offer.price)}/unit, ${offer.leadDays}-day lead, MOQ ${offer.moq}.`));
    }

    if (/\b(cheapest|lowest price|best price|fastest|shortest lead)\b/i.test(query)) {
      const picks = metrics.filter(item => item.offers.length > 0).map(item => ({
        item,
        offer: /\b(fastest|shortest lead)\b/i.test(query)
          ? [...item.offers].sort((a, b) => a.leadDays - b.leadDays || a.price - b.price)[0]
          : item.offers[0]
      })).sort((a, b) => /\b(fastest|shortest lead)\b/i.test(query)
        ? a.offer.leadDays - b.offer.leadDays || a.offer.price - b.offer.price
        : a.offer.price - b.offer.price).slice(0, 15);
      const rows = picks.map(({ item, offer }) => [item.product.sku, item.product.name, offer.supplier, money(offer.price), `${offer.leadDays} days`, offer.moq]);
      return response(
        `### ${/\b(fastest|shortest lead)\b/i.test(query) ? 'Fastest supplier offers' : 'Lowest supplier offers'}\nThe table shows the lowest price or shortest quoted lead time per SKU, depending on your question. Confirm MOQ and stock availability before selecting a supplier.\n\n${markdownTable(['SKU', 'Product', 'Supplier', 'Price/unit', 'Lead time', 'MOQ'], rows)}`,
        picks.slice(0, 8).map(({ item, offer }) => `${item.product.sku}: ${offer.supplier}, ${money(offer.price)}/unit, ${offer.leadDays}-day lead, MOQ ${offer.moq}.`)
      );
    }

    const priceSpread = metrics.filter(item => item.offers.length > 1).map(item => ({ item, saving: item.offers[item.offers.length - 1].price - item.offers[0].price })).sort((a, b) => b.saving - a.saving).slice(0, 10);
    const rows = priceSpread.map(({ item, saving }) => [item.product.sku, item.product.name, item.offers[0].supplier, money(item.offers[0].price), money(saving)]);
    return response(`### Largest quoted price spreads\nThese are differences between the highest and lowest listed supplier prices for the same SKU; they do not account for freight, quality, or MOQ.\n\n${markdownTable(['SKU', 'Product', 'Lowest-price supplier', 'Lowest quote', 'Spread/unit'], rows)}`, priceSpread.slice(0, 5).map(({ item, saving }) => `${item.product.sku}: lowest quote ${money(item.offers[0].price)} from ${item.offers[0].supplier}; quoted spread ${money(saving)} per unit.`));
  }

  if (selected) {
    const item = selected;
    const answer = `### ${item.product.sku} — ${item.product.name}\nCategory: ${item.product.category}; machine: ${item.product.model}.\n\nTotal listed stock is ${item.totalStock} units; ${item.salesQty} units sold across ${dataset.salesCalendarDays} calendar days. ${item.offers.length} supplier quotes and ${item.orders.length} purchase orders are listed.`;
    return response(answer, [`${item.product.sku}: ${item.product.name}, ${item.product.category}, compatible model ${item.product.model}.`, `${item.totalStock} units in inventory; ${item.salesQty} units sold during the observed window.`]);
  }

  const brief = [...metrics].filter(item => item.daysCover !== null).sort((a, b) => (a.daysCover ?? Infinity) - (b.daysCover ?? Infinity)).slice(0, 8);
  return response(
    `### Spare-parts dataset analysis\nThe dataset combines **${dataset.products.length} products**, inventory by store/warehouse, ${dataset.sales.length.toLocaleString('en-IN')} sales rows, ${dataset.suppliers.length} SKU-level supplier offers, and ${dataset.purchaseOrders.length} purchase orders.\n\nSnapshot: inventory as of **${dataset.snapshotDate}**; sales history **${dataset.salesStart}–${dataset.salesEnd}**. Total recorded demand is **${totals.totalSales.toLocaleString('en-IN')} units** across **${totals.totalStock.toLocaleString('en-IN')} units** of listed stock.\n\nLowest estimated stock cover among items with recorded sales:\n${markdownTable(['SKU', 'Product', 'Stock', 'Units sold', 'Est. cover'], brief.map(item => [item.product.sku, item.product.name, item.totalStock, item.salesQty, `${formatNumber(item.daysCover ?? 0)} days`]))}\n\nAsk about a SKU, stock by location, fast-selling products, supplier prices/lead times, or purchase orders for more detail.`,
    brief.map(item => `${item.product.sku}: estimated ${formatNumber(item.daysCover ?? 0)} days stock cover from ${item.totalStock} units and ${item.salesQty} sales over ${dataset.salesCalendarDays} days.`)
  );
}
