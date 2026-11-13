import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, RefreshCw, Server, Database, ShieldCheck, Cpu, Key } from 'lucide-react';
import { apiService, SystemHealthStatus } from '../services/api.ts';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getHealthCheck();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to reach backend health endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
            <Server className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">System Diagnostics &amp; Health</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live verification of backend services, Firebase, and algorithm engines</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Querying /api/healthCheck...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300 mb-4">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
              Connection Error
            </div>
            <p className="mt-1">{error}</p>
          </div>
        ) : health ? (
          <div className="space-y-3.5">
            {/* Service Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Backend Express */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Express Backend
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    <CheckCircle className="h-3 w-3" />
                    {health.backend}
                  </span>
                </div>
              </div>

              {/* Simulation Engine */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Cpu className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    OS Algorithms
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    <CheckCircle className="h-3 w-3" />
                    {health.simulationEngine}
                  </span>
                </div>
              </div>

              {/* Firestore */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Cloud Firestore
                  </span>
                  <span className={`flex items-center gap-1 font-mono text-[10px] font-bold uppercase ${
                    health.firestore === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {health.firestore === 'connected' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {health.firestore}
                  </span>
                </div>
              </div>

              {/* Firebase Admin */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    Firebase Admin
                  </span>
                  <span className={`flex items-center gap-1 font-mono text-[10px] font-bold uppercase ${
                    health.firebaseAdmin === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    {health.firebaseAdmin}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin and Configuration details */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Designated Single Admin:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{health.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Provisioned Project ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{health.details?.projectId || 'gen-lang-client-0928383406'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service Account Credential:</span>
                <span className={`font-mono text-[11px] ${health.details?.hasServiceAccount ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {health.details?.hasServiceAccount ? 'Active (Private Key Configured)' : 'Standard Application Mode'}
                </span>
              </div>
            </div>

            {/* Informational Guidance */}
            {health.details?.instructions && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 text-[11px] text-slate-600 dark:text-slate-400">
                <Key className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>{health.details.instructions}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-test Services
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
