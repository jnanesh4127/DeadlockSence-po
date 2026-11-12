import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, ADMIN_EMAIL } from './context/AuthContext.tsx';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
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
import { ShieldAlert, Cpu } from 'lucide-react';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [systemOnline, setSystemOnline] = useState(true);

  // Check system health on boot
  useEffect(() => {
    apiService.getHealthCheck()
      .then(() => setSystemOnline(true))
      .catch(() => setSystemOnline(false));
  }, []);

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const hasAdminAccess = isAdmin || isExactAdminEmail;

  const handleLoadSimulation = (sim: UserSimulationRecord) => {
    setActiveTab('bankers');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        systemOnline={systemOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <DashboardOverview
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenHealth={() => setIsHealthOpen(true)}
          />
        )}

        {activeTab === 'bankers' && (
          <BankersLab onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {activeTab === 'rag' && <RAGVisualizer />}

        {activeTab === 'detection' && <DeadlockConsole />}

        {activeTab === 'practice' && <PracticeLab />}

        {activeTab === 'history' && (
          <SimulationsHistory onLoadSimulation={handleLoadSimulation} />
        )}

        {activeTab === 'admin' && (
          hasAdminAccess ? (
            <AdminDashboard />
          ) : (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-12 text-center max-w-xl mx-auto my-12">
              <ShieldAlert className="mx-auto h-12 w-12 text-red-400 mb-3" />
              <h2 className="text-lg font-bold text-white">Administrator Privileges Required</h2>
              <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
                Access to this console is restricted strictly to the designated system administrator ({ADMIN_EMAIL}) with verified Firebase Custom Claims.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Return to Overview
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">DeadlockSense</span>
            <span>- Operating System Deadlock &amp; Banker&apos;s Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Cloud Firestore Connected</span>
            <span>•</span>
            <span>Single Admin: {ADMIN_EMAIL}</span>
          </div>
        </div>
      </footer>

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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
