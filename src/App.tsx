import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ADMIN_EMAIL } from './context/AuthContext.tsx';
import { I18nProvider, useI18n } from './context/I18nContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { SidebarNav, TopHeader, ActiveTab } from './components/Navbar.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { BankersLab } from './components/BankersLab.tsx';
import { RAGVisualizer } from './components/RAGVisualizer.tsx';
import { DeadlockConsole } from './components/DeadlockConsole.tsx';
import { PracticeLab } from './components/PracticeLab.tsx';
import { SimulationsHistory } from './components/SimulationsHistory.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { HealthCheckModal } from './components/HealthCheckModal.tsx';
import { FeedbackModal } from './components/FeedbackModal.tsx';
import { apiService, UserSimulationRecord } from './services/api.ts';
import { ShieldAlert, Cpu, Mail, Lock, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [systemOnline, setSystemOnline] = useState(true);

  useEffect(() => {
    apiService
      .getHealthCheck()
      .then(() => setSystemOnline(true))
      .catch(() => setSystemOnline(false));
  }, []);

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const hasAdminAccess = isAdmin || isExactAdminEmail;
  const hasAuthenticatedEmail = Boolean(user && user.email && user.email.includes('@'));

  const handleLoadSimulation = (_sim: UserSimulationRecord) => {
    setActiveTab('bankers');
  };

  const renderSimulationAuthGate = (labTitle: string) => {
    if (authLoading) {
      return (
        <div className="mx-auto my-12 max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t.gate.checkingSession}</p>
        </div>
      );
    }

    return (
      <div className="mx-auto my-10 max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.gate.title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {t.gate.descriptionPrefix}{' '}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{labTitle}</span>.{' '}
          {t.gate.descriptionSuffix}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {t.gate.signInWithEmail}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t.gate.returnOverview}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-studio-canvas text-slate-900 dark:text-slate-100 sm:p-4 lg:p-6 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1440px] overflow-hidden rounded-none sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        {/* Left Navigation Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenHealth={() => setIsHealthOpen(true)}
          systemOnline={systemOnline}
        />

        {/* Right Workspace Column */}
        <div className="flex flex-1 flex-col min-w-0 bg-[#FAFBFB] dark:bg-slate-950 transition-colors">
          <TopHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            onOpenHealth={() => setIsHealthOpen(true)}
            systemOnline={systemOnline}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-7">
            {activeTab === 'overview' && (
              <DashboardOverview
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenHealth={() => setIsHealthOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'bankers' &&
              (hasAuthenticatedEmail ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-6 text-slate-100 shadow-sm">
                  <BankersLab onOpenAuth={() => setIsAuthOpen(true)} />
                </div>
              ) : (
                renderSimulationAuthGate("Banker's Algorithm Lab")
              ))}

            {activeTab === 'rag' &&
              (hasAuthenticatedEmail ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-6 text-slate-100 shadow-sm">
                  <RAGVisualizer />
                </div>
              ) : (
                renderSimulationAuthGate('RAG & WFG Visualizer')
              ))}

            {activeTab === 'detection' &&
              (hasAuthenticatedEmail ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-6 text-slate-100 shadow-sm">
                  <DeadlockConsole />
                </div>
              ) : (
                renderSimulationAuthGate('Deadlock Detection & Recovery Console')
              ))}

            {activeTab === 'practice' && <PracticeLab />}

            {activeTab === 'history' && (
              <SimulationsHistory onLoadSimulation={handleLoadSimulation} />
            )}

            {activeTab === 'admin' &&
              (hasAdminAccess ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-6 text-slate-100 shadow-sm">
                  <AdminDashboard />
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
                  <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-3" />
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {t.gate.adminRequiredTitle}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-4 leading-relaxed">
                    Access to this console is restricted strictly to the designated system
                    administrator ({ADMIN_EMAIL}) with verified Firebase Custom Claims.
                  </p>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    {t.gate.returnOverview}
                  </button>
                </div>
              ))}
          </main>

          <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-display font-semibold text-slate-800 dark:text-slate-200">DeadlockSense</span>
                <span aria-hidden="true">·</span>
                <span>{t.nav.subtitle}</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                Operating Systems Deadlock Avoidance &amp; Graph Analysis
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <HealthCheckModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
