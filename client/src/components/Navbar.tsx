import React from 'react';
import { 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Network, 
  History, 
  BookOpen, 
  MessageSquarePlus, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  ShieldAlert,
  Server
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';

export type ActiveTab = 'overview' | 'bankers' | 'rag' | 'detection' | 'practice' | 'history' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenFeedback: () => void;
  onOpenHealth: () => void;
  systemOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenFeedback,
  onOpenHealth,
  systemOnline
}) => {
  const { user, isAdmin, logout } = useAuth();

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const showAdminBadge = isAdmin || isExactAdminEmail;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('overview')} 
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight text-white">DeadlockSense</span>
              <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 border border-cyan-800/60">
                OS LAB
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">Deadlock Detection &amp; Banker&apos;s Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('bankers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'bankers'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Banker&apos;s Lab
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'rag'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            RAG &amp; WFG
          </button>

          <button
            onClick={() => setActiveTab('detection')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'detection'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Detection &amp; Recovery
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'practice'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            OS Exercises
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Saved Simulations
            </button>
          )}

          {showAdminBadge && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80 shadow-sm shadow-amber-900/20'
                  : 'text-amber-400/80 hover:bg-amber-950/30 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Admin Console
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Health status button */}
          <button
            onClick={onOpenHealth}
            title="System & Database Connectivity Status"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800"
          >
            <span className={`h-2 w-2 rounded-full ${systemOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-amber-400'}`} />
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">{systemOnline ? 'System Online' : 'Check Status'}</span>
          </button>

          {/* Feedback Button */}
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-800 hover:text-cyan-400"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-900/60 text-[11px] font-bold text-cyan-300">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden max-w-[120px] truncate text-slate-300 sm:block">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                {showAdminBadge && (
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-300 border border-amber-500/40">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-900 bg-slate-950 px-2 py-1.5 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'overview' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('bankers')}
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'bankers' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Banker&apos;s Lab
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'rag' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          RAG &amp; WFG
        </button>
        <button
          onClick={() => setActiveTab('detection')}
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'detection' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Detection
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'practice' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Exercises
        </button>
        {user && (
          <button
            onClick={() => setActiveTab('history')}
            className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'history' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
          >
            Saved
          </button>
        )}
        {showAdminBadge && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${activeTab === 'admin' ? 'bg-amber-950 text-amber-300' : 'text-amber-400'}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
