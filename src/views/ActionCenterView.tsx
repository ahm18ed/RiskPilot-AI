import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Edit3,
  Eye,
  PlusCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  User,
  FileText,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { ActionDraft, ActionStatus, ActionType, Urgency } from '../../server/types';
import { ActionStatusBadge } from '../components/Badges';

interface ActionCenterViewProps {
  actions: ActionDraft[];
  loading: boolean;
  onApproveAction: (id: string, reviewerName: string, comment: string) => Promise<void>;
  onRejectAction: (id: string, reviewerName: string, reason: string) => Promise<void>;
  onUpdateAction: (id: string, updates: Partial<ActionDraft>) => Promise<void>;
  onCreateAction: (action: Partial<ActionDraft>) => Promise<void>;
}

export const ActionCenterView: React.FC<ActionCenterViewProps> = ({
  actions,
  loading,
  onApproveAction,
  onRejectAction,
  onUpdateAction,
  onCreateAction
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [reviewingAction, setReviewingAction] = useState<ActionDraft | null>(null);
  const [editingAction, setEditingAction] = useState<ActionDraft | null>(null);
  const [approvingAction, setApprovingAction] = useState<ActionDraft | null>(null);
  const [rejectingAction, setRejectingAction] = useState<ActionDraft | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [approvalComment, setApprovalComment] = useState('Approved following multi-signal supplier risk review.');
  const [reviewerName, setReviewerName] = useState('Senior Procurement Manager');
  const [rejectionReason, setRejectionReason] = useState('Requires additional technical specification or alternative commercial terms.');

  // New action form state
  const [newActionForm, setNewActionForm] = useState<Partial<ActionDraft>>({
    actionType: 'SECOND_SOURCE_QUALIFICATION',
    title: '',
    supplierId: 'SUP-042',
    supplierName: 'Vanguard Micro-Foundry',
    itemId: 'ITEM-001',
    itemCode: 'CMP-TITAN-X1',
    itemName: 'Titanium High-Pressure Fuel Valve',
    reason: '',
    supportingEvidence: '',
    recommendedDeadline: '2026-10-25',
    urgency: 'HIGH',
    expectedOutcome: '',
    assignedTo: 'Lead Sourcing Specialist',
    notes: ''
  });

  // Filter actions
  const filtered = actions.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && a.actionType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.supplierName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmApproval = async () => {
    if (!approvingAction) return;
    await onApproveAction(approvingAction.id, reviewerName, approvalComment);
    setApprovingAction(null);
  };

  const handleConfirmRejection = async () => {
    if (!rejectingAction) return;
    await onRejectAction(rejectingAction.id, reviewerName, rejectionReason);
    setRejectingAction(null);
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;
    await onUpdateAction(editingAction.id, editingAction);
    setEditingAction(null);
  };

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionForm.title || !newActionForm.reason) return;
    await onCreateAction(newActionForm);
    setIsCreatingNew(false);
    setNewActionForm({
      actionType: 'SECOND_SOURCE_QUALIFICATION',
      title: '',
      supplierId: 'SUP-042',
      supplierName: 'Vanguard Micro-Foundry',
      itemId: 'ITEM-001',
      itemCode: 'CMP-TITAN-X1',
      itemName: 'Titanium High-Pressure Fuel Valve',
      reason: '',
      supportingEvidence: '',
      recommendedDeadline: '2026-10-25',
      urgency: 'HIGH',
      expectedOutcome: '',
      assignedTo: 'Lead Sourcing Specialist',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-700" />
            Procurement Action Approval Center
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Structured governance workflow for RFQs, supplier quality audits, compliance holds, contract clawbacks, and second-source qualification.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create New Sourcing Draft</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            {['ALL', 'DRAFT', 'APPROVED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Action Types</option>
            <option value="SECOND_SOURCE_QUALIFICATION">Second-Source Qualification</option>
            <option value="QUALITY_INSPECTION">Quality Inspection</option>
            <option value="COMPLIANCE_REVIEW">Compliance Review</option>
            <option value="CONTRACT_RENEGOTIATION">Contract Renegotiation</option>
            <option value="RFQ">RFQ (Request for Quotation)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-52"
          />
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(action => {
            const isDraft = action.status === 'DRAFT';
            return (
              <div
                key={action.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {action.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{action.title}</h3>
                    <ActionStatusBadge status={action.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      action.urgency === 'IMMEDIATE'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      Urgency: {action.urgency}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: <strong className="text-slate-900">{action.recommendedDeadline}</strong>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">TARGET SUPPLIER & ITEM</span>
                    <span className="text-slate-900 font-semibold">{action.supplierName}</span>
                    {action.itemCode && (
                      <span className="text-slate-500 font-mono text-[11px] block">{action.itemCode} ({action.itemName})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">ASSIGNED PROCUREMENT OWNER</span>
                    <span className="text-slate-700">{action.assignedTo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-mono">EXPECTED OUTCOME</span>
                    <span className="text-slate-700 line-clamp-1">{action.expectedOutcome}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 mb-3">
                  <strong className="text-slate-900 font-sans">Business Rationale & Evidence:</strong>{' '}
                  {action.reason} — {action.supportingEvidence}
                </div>

                {/* Approval Details If Reviewed */}
                {action.reviewedAt && (
                  <div className={`text-xs p-2.5 rounded border font-mono mb-3 ${
                    action.status === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <strong>Decision Signed by:</strong> {action.reviewedBy} at {new Date(action.reviewedAt).toLocaleString()}
                    <div className="mt-0.5 font-sans text-slate-700">Comment: "{action.reviewComment}"</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">Type: {action.actionType}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewingAction(action)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>

                    {isDraft && (
                      <>
                        <button
                          onClick={() => setEditingAction(action)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setApprovingAction(action)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingAction(action)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-lg">
            No procurement actions match the filter criteria.
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">{reviewingAction.id}</span>
                <h3 className="text-base font-bold text-slate-900">{reviewingAction.title}</h3>
              </div>
              <button
                onClick={() => setReviewingAction(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">SUPPLIER</span>
                  <span className="text-slate-900 font-bold">{reviewingAction.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ITEM</span>
                  <span className="text-slate-900 font-bold">{reviewingAction.itemCode || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">URGENCY</span>
                  <span className="text-red-700 font-bold">{reviewingAction.urgency}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">DEADLINE</span>
                  <span className="text-slate-900 font-bold">{reviewingAction.recommendedDeadline}</span>
                </div>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1">Reason & Business Trigger:</strong>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {reviewingAction.reason}
                </p>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1">Empirical Supporting Evidence:</strong>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed font-mono">
                  {reviewingAction.supportingEvidence}
                </p>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1">Expected Operational Outcome:</strong>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {reviewingAction.expectedOutcome}
                </p>
              </div>

              {reviewingAction.notes && (
                <div>
                  <strong className="text-slate-800 block mb-1">Internal Notes:</strong>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {reviewingAction.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setReviewingAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approvingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Approve Procurement Action
            </h3>
            <p className="text-xs text-slate-600">
              Sign off on execution of <strong className="text-slate-900">{approvingAction.title}</strong> ({approvingAction.id}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Sign-Off Manager Name:</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Approval Comments / Audit Justification:</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={e => setApprovalComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setApprovingAction(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs cursor-pointer"
              >
                Confirm Approval & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Sourcing Action
            </h3>
            <p className="text-xs text-slate-600">
              Decline draft <strong className="text-slate-900">{rejectingAction.title}</strong>. This decision will be logged to the immutable audit trail.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Reviewer Name:</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Mandatory Rejection Justification:</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectingAction(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded text-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmEdit}
            className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-slate-700" />
              Edit Action Draft ({editingAction.id})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Action Title:</label>
                <input
                  type="text"
                  value={editingAction.title}
                  onChange={e => setEditingAction({ ...editingAction, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Urgency:</label>
                  <select
                    value={editingAction.urgency}
                    onChange={e => setEditingAction({ ...editingAction, urgency: e.target.value as Urgency })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-2 text-slate-800"
                  >
                    <option value="IMMEDIATE">IMMEDIATE</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Deadline Date:</label>
                  <input
                    type="date"
                    value={editingAction.recommendedDeadline}
                    onChange={e => setEditingAction({ ...editingAction, recommendedDeadline: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Expected Outcome:</label>
                <input
                  type="text"
                  value={editingAction.expectedOutcome}
                  onChange={e => setEditingAction({ ...editingAction, expectedOutcome: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Assigned Sourcing Specialist:</label>
                <input
                  type="text"
                  value={editingAction.assignedTo}
                  onChange={e => setEditingAction({ ...editingAction, assignedTo: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create New Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCreate}
            className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-slate-700" />
              Create Structured Sourcing Action
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Action Type:</label>
                <select
                  value={newActionForm.actionType}
                  onChange={e => setNewActionForm({ ...newActionForm, actionType: e.target.value as ActionType })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-2 text-slate-800"
                >
                  <option value="SECOND_SOURCE_QUALIFICATION">Second-Source Qualification Task</option>
                  <option value="QUALITY_INSPECTION">Supplier Quality Inspection</option>
                  <option value="COMPLIANCE_REVIEW">Compliance Review & Audit</option>
                  <option value="CONTRACT_RENEGOTIATION">Contract Renegotiation Request</option>
                  <option value="RFQ">Request for Quotation (RFQ)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Action Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Expedited FAI Audit on Vanguard Micro-Foundry"
                  value={newActionForm.title}
                  onChange={e => setNewActionForm({ ...newActionForm, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Target Supplier Name:</label>
                  <input
                    type="text"
                    value={newActionForm.supplierName}
                    onChange={e => setNewActionForm({ ...newActionForm, supplierName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Component Code:</label>
                  <input
                    type="text"
                    value={newActionForm.itemCode}
                    onChange={e => setNewActionForm({ ...newActionForm, itemCode: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Reason & Problem Trigger:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sole source dependency on critical valve with 9% defect rate"
                  value={newActionForm.reason}
                  onChange={e => setNewActionForm({ ...newActionForm, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Supporting Analytical Evidence:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 25 days stock cover remaining vs 45 days supplier lead time"
                  value={newActionForm.supportingEvidence}
                  onChange={e => setNewActionForm({ ...newActionForm, supportingEvidence: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Urgency:</label>
                  <select
                    value={newActionForm.urgency}
                    onChange={e => setNewActionForm({ ...newActionForm, urgency: e.target.value as Urgency })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-2 text-slate-800"
                  >
                    <option value="IMMEDIATE">IMMEDIATE</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Target Deadline:</label>
                  <input
                    type="date"
                    value={newActionForm.recommendedDeadline}
                    onChange={e => setNewActionForm({ ...newActionForm, recommendedDeadline: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Expected Outcome:</label>
                <input
                  type="text"
                  placeholder="e.g. Complete pilot batch testing of 50 units"
                  value={newActionForm.expectedOutcome}
                  onChange={e => setNewActionForm({ ...newActionForm, expectedOutcome: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs cursor-pointer"
              >
                Create Action Draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
