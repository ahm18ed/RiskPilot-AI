import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from './store';
import { Severity, SupplierStatus, ActionType, Urgency } from './types';

export const apiRouter = Router();

// 1. Dashboard summary
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  try {
    const severity = (req.query.severity as Severity | 'ALL') || 'ALL';
    const status = (req.query.status as SupplierStatus | 'ALL') || 'ALL';
    const search = (req.query.search as string) || '';

    const data = dataStore.getDashboardData({ severity, status, search });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard data' });
  }
});

// 2. Suppliers list
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  try {
    const data = dataStore.getDashboardData();
    res.json({
      suppliers: data.filteredSuppliers,
      total: data.totalFiltered
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch suppliers' });
  }
});

// 3. Supplier Deep Dive
apiRouter.get('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = dataStore.getSupplierDetail(id);
    if (!detail) {
      return res.status(404).json({ error: `Supplier ${id} not found` });
    }
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch supplier details' });
  }
});

// 3b. Update supplier status
const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'CONDITIONAL', 'UNDER_REVIEW', 'SUSPENDED']),
  reason: z.string().optional(),
  actor: z.string().optional()
});

apiRouter.put('/suppliers/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateStatusSchema.parse(req.body);
    const updated = dataStore.updateSupplierStatus(id, parsed.status, parsed.reason, parsed.actor);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update supplier status' });
  }
});

// 4. Items list
apiRouter.get('/items', (req: Request, res: Response) => {
  try {
    const items = dataStore.getItems();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch items' });
  }
});

// 5. Decision Simulator
const simulateSchema = z.object({
  supplierId: z.string().min(1),
  itemId: z.string().optional()
});

apiRouter.post('/simulate', (req: Request, res: Response) => {
  try {
    const parsed = simulateSchema.parse(req.body);
    const result = dataStore.simulateDecision(parsed.supplierId, parsed.itemId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid simulation parameters' });
  }
});

// 6. AI Assistant Investigation
const aiAskSchema = z.object({
  query: z.string().min(1),
  supplierId: z.string().optional(),
  itemId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  stressParams: z.object({
    demandSurgePct: z.number().optional(),
    delayDays: z.number().optional()
  }).optional(),
  splitParams: z.object({
    primaryPct: z.number().optional()
  }).optional(),
  sensitivityParams: z.object({
    defectThresholdPct: z.number().optional(),
    priceDeviationPct: z.number().optional()
  }).optional()
});

apiRouter.post('/ai/ask', async (req: Request, res: Response) => {
  try {
    const parsed = aiAskSchema.parse(req.body);
    const result = await dataStore.askAI(
      parsed.query,
      parsed.supplierId,
      parsed.itemId,
      parsed.history,
      parsed.stressParams,
      parsed.splitParams,
      parsed.sensitivityParams
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process AI investigation' });
  }
});

// 7. Actions list
apiRouter.get('/actions', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const actions = dataStore.getActions(status);
    res.json({ actions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch actions' });
  }
});

// 8. Create Action Draft
const createActionSchema = z.object({
  actionType: z.enum(['RFQ', 'QUALITY_INSPECTION', 'COMPLIANCE_REVIEW', 'CONTRACT_RENEGOTIATION', 'SECOND_SOURCE_QUALIFICATION']),
  title: z.string().min(3),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  itemId: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  reason: z.string().min(5),
  supportingEvidence: z.string().min(5),
  recommendedDeadline: z.string().min(5),
  urgency: z.enum(['IMMEDIATE', 'HIGH', 'MEDIUM', 'NORMAL']),
  expectedOutcome: z.string().min(5),
  assignedTo: z.string().min(2),
  notes: z.string().default('')
});

apiRouter.post('/actions', (req: Request, res: Response) => {
  try {
    const parsed = createActionSchema.parse(req.body);
    const created = dataStore.createAction(parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid action data' });
  }
});

// 9. Edit Action Draft
apiRouter.put('/actions/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = dataStore.updateAction(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update action' });
  }
});

// 10. Review Action (Approve / Reject)
const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reviewerName: z.string().default('Procurement Manager'),
  comment: z.string().optional()
});

apiRouter.post('/actions/:id/review', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = reviewSchema.parse(req.body);
    const reviewed = dataStore.reviewAction(id, parsed.decision, parsed.reviewerName, parsed.comment);
    res.json(reviewed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to review action' });
  }
});

// 11. Audit Trail
apiRouter.get('/audit-trail', (req: Request, res: Response) => {
  try {
    const logs = dataStore.getAuditTrail();
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit trail' });
  }
});

// 12. Reset to canonical baseline seed
apiRouter.post('/reset', (req: Request, res: Response) => {
  try {
    dataStore.reset();
    res.json({ success: true, message: 'Database reset to initial reproducible seed data.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset database' });
  }
});

// 13. Authentication Endpoints
const DEFAULT_PERSONAS = [
  {
    id: 'usr-elena',
    name: 'Elena Vance',
    email: 'elena.vance@aerodynamics.com',
    role: 'CHIEF_PROCUREMENT_OFFICER',
    title: 'VP Global Supply Chain & CPO',
    department: 'Executive Procurement Committee',
    organization: 'AeroDynamics Global Corp',
    permissions: [
      'APPROVE_ACTIONS',
      'OVERRIDE_SUPPLIER_STATUS',
      'EXECUTE_CONTRACTS',
      'VIEW_SOX_AUDIT',
      'EXPORT_REPORTS',
      'ADMIN_SETTINGS'
    ]
  },
  {
    id: 'usr-marcus',
    name: 'Marcus Chen',
    email: 'marcus.chen@aerodynamics.com',
    role: 'SOURCING_SPECIALIST',
    title: 'Lead Sourcing Specialist & Risk Modeler',
    department: 'Strategic Sourcing & Category Management',
    organization: 'AeroDynamics Global Corp',
    permissions: [
      'RUN_SIMULATIONS',
      'DRAFT_ACTIONS',
      'INITIATE_RFQ',
      'VIEW_SUPPLIERS',
      'EDIT_ACTIONS'
    ]
  },
  {
    id: 'usr-sarah',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@aerodynamics.com',
    role: 'QUALITY_DIRECTOR',
    title: 'Director of QA & AS9100 Compliance',
    department: 'Quality Engineering & Regulatory Compliance',
    organization: 'AeroDynamics Global Corp',
    permissions: [
      'INSPECT_LOTS',
      'QUARANTINE_SUPPLIERS',
      'APPROVE_ACTIONS',
      'UPDATE_COMPLIANCE',
      'VIEW_SUPPLIERS'
    ]
  },
  {
    id: 'usr-alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@aerodynamics.com',
    role: 'SOX_AUDITOR',
    title: 'Senior Governance & Internal SOX Auditor',
    department: 'Internal Audit & Regulatory Governance',
    organization: 'AeroDynamics Global Corp',
    permissions: [
      'VIEW_SOX_AUDIT',
      'VERIFY_AUDIT_HASH',
      'EXPORT_AUDIT_LOGS',
      'INSPECT_DECISIONS'
    ]
  }
];

apiRouter.get('/auth/personas', (_req: Request, res: Response) => {
  res.json({ personas: DEFAULT_PERSONAS });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  personaId: z.string().optional(),
  provider: z.string().optional()
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, personaId, provider } = loginSchema.parse(req.body);

    let user = DEFAULT_PERSONAS.find(p => p.id === personaId || p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user session for arbitrary valid enterprise email
      const name = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
      user = {
        id: `usr-${Date.now().toString(36)}`,
        name: name || 'Enterprise Operator',
        email: email,
        role: 'SOURCING_SPECIALIST',
        title: 'Enterprise Sourcing Specialist',
        department: 'Strategic Sourcing',
        organization: email.includes('@') ? email.split('@')[1].split('.')[0].toUpperCase() + ' Corp' : 'Enterprise Procurement',
        permissions: ['RUN_SIMULATIONS', 'DRAFT_ACTIONS', 'INITIATE_RFQ', 'VIEW_SUPPLIERS']
      };
    }

    // Record login in audit log
    dataStore.recordAudit({
      actor: `${user.name} (${user.title})`,
      eventType: 'USER_AUTHENTICATED',
      details: `Authenticated via ${provider || (personaId ? '1-Click Persona' : 'Enterprise Credentials')}. Session initiated for ${user.organization}.`
    });

    res.json({
      success: true,
      user,
      token: `rp_sess_${Buffer.from(user.email).toString('base64')}_${Date.now()}`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Authentication failed' });
  }
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['CHIEF_PROCUREMENT_OFFICER', 'SOURCING_SPECIALIST', 'QUALITY_DIRECTOR', 'SOX_AUDITOR']),
  organization: z.string().min(2),
  department: z.string().optional(),
  password: z.string().min(6)
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const titleMap: Record<string, string> = {
      CHIEF_PROCUREMENT_OFFICER: 'VP Procurement & Supply Chain',
      SOURCING_SPECIALIST: 'Senior Sourcing & Risk Specialist',
      QUALITY_DIRECTOR: 'Director of QA & Quality Assurance',
      SOX_AUDITOR: 'Internal SOX & Governance Auditor'
    };

    const permMap: Record<string, string[]> = {
      CHIEF_PROCUREMENT_OFFICER: ['APPROVE_ACTIONS', 'OVERRIDE_SUPPLIER_STATUS', 'EXECUTE_CONTRACTS', 'VIEW_SOX_AUDIT'],
      SOURCING_SPECIALIST: ['RUN_SIMULATIONS', 'DRAFT_ACTIONS', 'INITIATE_RFQ', 'VIEW_SUPPLIERS'],
      QUALITY_DIRECTOR: ['INSPECT_LOTS', 'QUARANTINE_SUPPLIERS', 'APPROVE_ACTIONS', 'UPDATE_COMPLIANCE'],
      SOX_AUDITOR: ['VIEW_SOX_AUDIT', 'VERIFY_AUDIT_HASH', 'EXPORT_AUDIT_LOGS']
    };

    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: data.name,
      email: data.email,
      role: data.role,
      title: titleMap[data.role] || 'Procurement Specialist',
      department: data.department || 'Strategic Procurement',
      organization: data.organization,
      permissions: permMap[data.role] || ['VIEW_SUPPLIERS']
    };

    dataStore.recordAudit({
      actor: `${newUser.name} (${newUser.title})`,
      eventType: 'USER_REGISTERED',
      details: `New enterprise profile created in department: ${newUser.department} (${newUser.organization}).`
    });

    res.status(201).json({
      success: true,
      user: newUser,
      token: `rp_sess_${Buffer.from(newUser.email).toString('base64')}_${Date.now()}`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});
