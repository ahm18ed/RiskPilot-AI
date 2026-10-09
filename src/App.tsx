import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingPageView } from './views/LandingPageView';
import { LoginPage } from './views/LoginPage';
import { SignupPage } from './views/SignupPage';
import { DashboardView } from './views/DashboardView';
import { SupplierDetailView } from './views/SupplierDetailView';
import { AiAssistantView } from './views/AiAssistantView';
import { DecisionSimulatorView } from './views/DecisionSimulatorView';
import { ActionCenterView } from './views/ActionCenterView';
import { AuditTrailView } from './views/AuditTrailView';
import { api, DashboardResponse, SupplierDetailResponse } from './services/api';
import { ActionDraft, AuditLog, Severity, SupplierStatus } from '../server/types';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type AppPage = 'landing' | 'login' | 'signup' | 'workspace';

function getInitialPage(): AppPage {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('/login') || hash === '#login') return 'login';
  if (
    path.includes('/signup') ||
    path.includes('/register') ||
    path.includes('/signin') ||
    hash === '#signup' ||
    hash === '#register' ||
    hash === '#signin'
  ) {
    return 'signup';
  }
  if (path.includes('/workspace') || path.includes('/app') || hash === '#workspace' || hash === '#app') {
    return 'workspace';
  }

  // Default to landing page for root visits
  return 'landing';
}

function RiskPilotApp() {
  const { user, isAuthenticated, isLoading, loginAsPersona } = useAuth();

  // Page routing: 'landing' | 'login' | 'signup' | 'workspace'
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('SUP-001');

  // Auth modal state (retained as fast in-workspace helper if needed)
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'persona' | 'login' | 'register'>('persona');

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<SupplierDetailResponse | null>(null);
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [loadingSupplier, setLoadingSupplier] = useState<boolean>(false);
  const [loadingActions, setLoadingActions] = useState<boolean>(false);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // URL history routing navigation helper with Authentication Guard
  const navigateTo = (page: AppPage) => {
    if (page === 'workspace' && !isAuthenticated) {
      showToast('Authentication Required: Please sign in or select an Enterprise Persona to access the workspace.', 'error');
      setCurrentPage('login');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.pushState({ page: 'login' }, '', '/login');
      }
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let path = '/';
    if (page === 'login') path = '/login';
    else if (page === 'signup') path = '/signup';
    else if (page === 'workspace') path = '/workspace';
    else path = '/';

    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ page }, '', path);
    }
  };

  // Protected route guard: Redirect unauthenticated workspace visits to login page
  useEffect(() => {
    if (!isLoading && !isAuthenticated && currentPage === 'workspace') {
      showToast('Authentication Required: Please sign in or select an Enterprise Persona to access the workspace.', 'error');
      setCurrentPage('login');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.pushState({ page: 'login' }, '', '/login');
      }
    }
  }, [isLoading, isAuthenticated, currentPage]);

  // Browser back/forward navigation support
  useEffect(() => {
    const handlePopState = () => {
      const page = getInitialPage();
      if (page === 'workspace' && !isAuthenticated) {
        setCurrentPage('login');
      } else {
        setCurrentPage(page);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Load Dashboard Data
  const loadDashboard = async (filters?: { severity?: Severity | 'ALL'; status?: SupplierStatus | 'ALL'; search?: string }) => {
    setLoadingDashboard(true);
    try {
      const data = await api.getDashboard(filters);
      setDashboardData(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load Supplier Detail
  const loadSupplierDetail = async (id: string) => {
    setLoadingSupplier(true);
    try {
      const data = await api.getSupplierDetail(id);
      setSupplierDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load supplier details', 'error');
    } finally {
      setLoadingSupplier(false);
    }
  };

  // Load Actions
  const loadActions = async () => {
    setLoadingActions(true);
    try {
      const res = await api.getActions();
      setActions(res.actions);
    } catch (err: any) {
      showToast(err.message || 'Failed to load actions', 'error');
    } finally {
      setLoadingActions(false);
    }
  };

  // Load Audit Trail
  const loadAuditTrail = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.getAuditTrail();
      setAuditLogs(res.logs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit trail', 'error');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    loadDashboard();
    loadActions();
    loadAuditTrail();
  }, []);

  // Sync supplier detail when selectedSupplierId changes
  useEffect(() => {
    if (selectedSupplierId) {
      loadSupplierDetail(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  // Tab change handlers
  const handleSelectSupplier = (id: string) => {
    setSelectedSupplierId(id);
    setActiveTab('investigation');
  };

  const handleOpenSimulator = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setActiveTab('simulator');
  };

  const handleAskAI = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setActiveTab('ai-assistant');
  };

  // Action Center operations
  const handleCreateAction = async (draft: any) => {
    try {
      const actorName = user ? `${user.name} (${user.title})` : 'Chief Procurement Officer';
      const created = await api.createAction({ ...draft, assignedTo: draft.assignedTo || actorName });
      setActions(prev => [created, ...prev]);
      showToast(`Action "${created.title}" drafted successfully.`, 'success');
      loadAuditTrail();
      setActiveTab('actions');
    } catch (err: any) {
      showToast(err.message || 'Failed to draft action', 'error');
    }
  };

  const handleApproveAction = async (id: string, notes?: string) => {
    try {
      const approverName = user ? `${user.name} (${user.title})` : 'Chief Procurement Officer';
      const reviewed = await api.reviewAction(id, 'APPROVED', approverName, notes);
      setActions(prev => prev.map(a => (a.id === id ? reviewed : a)));
      showToast(`Action "${reviewed.title}" approved and dispatched.`, 'success');
      loadAuditTrail();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve action', 'error');
    }
  };

  const handleRejectAction = async (id: string, reason: string) => {
    try {
      const rejectorName = user ? `${user.name} (${user.title})` : 'Chief Procurement Officer';
      const reviewed = await api.reviewAction(id, 'REJECTED', rejectorName, reason);
      setActions(prev => prev.map(a => (a.id === id ? reviewed : a)));
      showToast(`Action marked as rejected: ${reason}`, 'info');
      loadAuditTrail();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject action', 'error');
    }
  };

  const handleUpdateAction = async (id: string, updates: Partial<ActionDraft>) => {
    try {
      const updated = await api.updateAction(id, updates);
      setActions(prev => prev.map(a => (a.id === id ? updated : a)));
      showToast('Action updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update action', 'error');
    }
  };

  // Reset Demo Dataset
  const handleResetData = async () => {
    if (!window.confirm('Reset all demo data back to initial canonical baseline (Apex Precision SUP-001 scenario)?')) {
      return;
    }
    try {
      await api.resetData();
      await loadDashboard();
      await loadActions();
      await loadAuditTrail();
      setSelectedSupplierId('SUP-001');
      showToast('Database reset to canonical seed data.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database', 'error');
    }
  };

  const handleOpenAuthModal = (tab: 'persona' | 'login' | 'register' = 'persona') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const draftActionsCount = actions.filter(a => a.status === 'DRAFT').length;
  const criticalAlertsCount = dashboardData?.urgentAlerts.filter(a => a.severity === 'CRITICAL').length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Verifying Enterprise RiskPilot Session...</p>
        <p className="text-xs text-slate-400 font-mono mt-1">SOX 404 & AS9100 Identity Handshake</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs font-medium bg-white border-slate-200 text-slate-900 animate-in fade-in slide-in-from-bottom-2">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-slate-700" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auxiliary Authentication Modal (for fast persona switching in-app) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        onSuccess={() => {
          showToast(`Welcome! Authenticated successfully.`, 'success');
          navigateTo('workspace');
        }}
      />

      {/* Dedicated Page 1: Landing Page */}
      {currentPage === 'landing' && (
        <LandingPageView
          onEnterWorkspace={() => navigateTo('workspace')}
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToSignup={() => navigateTo('signup')}
          onOpenAuthModal={handleOpenAuthModal}
        />
      )}

      {/* Dedicated Page 2: Login Page */}
      {currentPage === 'login' && (
        <LoginPage
          onNavigateToSignup={() => navigateTo('signup')}
          onNavigateToLanding={() => navigateTo('landing')}
          onLoginSuccess={() => {
            showToast('Signed in successfully! Welcome to RiskPilot AI.', 'success');
            navigateTo('workspace');
          }}
        />
      )}

      {/* Dedicated Page 3: Sign In / Sign Up / Register Page */}
      {currentPage === 'signup' && (
        <SignupPage
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToLanding={() => navigateTo('landing')}
          onSignupSuccess={() => {
            showToast('Enterprise account created! Welcome to your RiskPilot AI workspace.', 'success');
            navigateTo('workspace');
          }}
        />
      )}

      {/* Dedicated Page 4: Protected Interactive Risk Intelligence Workspace */}
      {currentPage === 'workspace' && isAuthenticated && (
        <>
          {/* Main Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSelectSupplier={handleSelectSupplier}
            onResetData={handleResetData}
            onOpenLanding={() => navigateTo('landing')}
            onNavigateToLogin={() => navigateTo('login')}
            onNavigateToSignup={() => navigateTo('signup')}
            onOpenAuthModal={handleOpenAuthModal}
            draftActionsCount={draftActionsCount}
            criticalAlertsCount={criticalAlertsCount}
          />

          {/* Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                data={dashboardData}
                loading={loadingDashboard}
                onSelectSupplier={handleSelectSupplier}
                onOpenSimulator={handleOpenSimulator}
                onFilterChange={filters => loadDashboard(filters)}
              />
            )}

            {activeTab === 'investigation' && (
              <SupplierDetailView
                supplierData={supplierDetail}
                loading={loadingSupplier}
                onBack={() => setActiveTab('dashboard')}
                onOpenSimulator={handleOpenSimulator}
                onAskAI={handleAskAI}
                onCreateAction={id => {
                  handleCreateAction({
                    actionType: 'SECOND_SOURCE_QUALIFICATION',
                    title: `Expedited Sourcing Review for ${supplierDetail?.supplier.name}`,
                    supplierId: id,
                    supplierName: supplierDetail?.supplier.name || '',
                    reason: 'Supplier flagged for compounding risk.',
                    supportingEvidence: supplierDetail?.supplier.explanation || '',
                    recommendedDeadline: '2026-10-25',
                    urgency: 'HIGH',
                    expectedOutcome: 'Restore supply continuity and mitigate single-source failure.',
                    assignedTo: user?.name || 'Lead Sourcing Specialist',
                    notes: ''
                  });
                }}
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AiAssistantView
                initialSupplierId={selectedSupplierId}
                onTransferAction={handleCreateAction}
                onSelectSupplier={handleSelectSupplier}
              />
            )}

            {activeTab === 'simulator' && (
              <DecisionSimulatorView
                initialSupplierId={selectedSupplierId}
                onDraftAction={handleCreateAction}
                onSelectSupplier={handleSelectSupplier}
              />
            )}

            {activeTab === 'actions' && (
              <ActionCenterView
                actions={actions}
                loading={loadingActions}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                onUpdateAction={handleUpdateAction}
                onCreateAction={handleCreateAction}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView logs={auditLogs} loading={loadingAudit} />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span>RiskPilot AI © 2026 · Autonomous Supplier Risk & Procurement Intelligence</span>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => navigateTo('landing')}
                  className="text-slate-700 hover:text-slate-900 underline font-sans cursor-pointer"
                >
                  Landing Page
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => navigateTo('login')}
                  className="text-slate-700 hover:text-slate-900 underline font-sans cursor-pointer"
                >
                  Switch / Login
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => navigateTo('signup')}
                  className="text-slate-700 hover:text-slate-900 underline font-sans cursor-pointer"
                >
                  Register
                </button>
              </div>
              <div className="text-[11px] text-slate-400">
                Logged in as: <strong className="text-slate-700">{user?.name || 'Evaluation Mode'}</strong> ({user?.role || 'Guest'}) · SOX 404
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RiskPilotApp />
    </AuthProvider>
  );
}
