export type UserRole =
  | 'CHIEF_PROCUREMENT_OFFICER'
  | 'SOURCING_SPECIALIST'
  | 'QUALITY_DIRECTOR'
  | 'SOX_AUDITOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  organization: string;
  avatarUrl?: string;
  permissions: string[];
  bio?: string;
}

export const ENTERPRISE_PERSONAS: UserProfile[] = [
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
    ],
    bio: 'Oversees $420M strategic aerospace procurement spend across 150 Tier-1/Tier-2 suppliers.'
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
    ],
    bio: 'Specializes in high-criticality titanium alloy and hydraulic component dual-sourcing strategies.'
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
    ],
    bio: 'Mandates AS9100, FAA conformity audits, and quality defect root-cause resolution.'
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
    ],
    bio: 'Validates immutable transaction logs, dual-approval compliance, and regulatory traceability.'
  }
];

export const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string; description: string }> = {
  CHIEF_PROCUREMENT_OFFICER: {
    label: 'Chief Procurement Officer',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Executive authority: final sign-off on dual-sourcing, holds & contract amendments.'
  },
  SOURCING_SPECIALIST: {
    label: 'Lead Sourcing Specialist',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Operational lead: models trade-offs, runs Monte Carlo simulations & drafts RFQs.'
  },
  QUALITY_DIRECTOR: {
    label: 'Quality & Compliance Director',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Quality oversight: reviews lot defect spikes, compliance audits & non-conformance.'
  },
  SOX_AUDITOR: {
    label: 'Internal SOX / ISO Auditor',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Governance oversight: verifies immutable audit trails, hash integrity & governance.'
  }
};
