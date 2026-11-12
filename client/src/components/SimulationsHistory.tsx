import React, { useEffect, useState } from 'react';
import { History, Play, Trash2, Calendar, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { apiService, UserSimulationRecord } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface SimulationsHistoryProps {
  onLoadSimulation: (sim: UserSimulationRecord) => void;
}

export const SimulationsHistory: React.FC<SimulationsHistoryProps> = ({ onLoadSimulation }) => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<UserSimulationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulations = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSimulations();
      setSimulations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this simulation from Cloud Firestore?')) return;
    try {
      await apiService.deleteSimulation(id);
      setSimulations(simulations.filter(s => s.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <History className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">Your Saved Simulations</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Scenarios stored in Cloud Firestore under your isolated user account ({user?.email})
          </p>
        </div>

        <button
          onClick={fetchSimulations}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-xs text-slate-400">Fetching simulations from Cloud Firestore...</span>
        </div>
      ) : simulations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <History className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No Simulations Saved Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Go to the Banker&apos;s Lab or Detection Console and click &quot;Save&quot; to preserve your matrix configurations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 border border-cyan-800">
                    {sim.algorithm.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(sim.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{sim.title}</h3>
                {sim.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{sim.description}</p>
                )}

                <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Processes:</span>
                    <span>{sim.processNames.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resources:</span>
                    <span>{sim.resourceNames.join(', ')}</span>
                  </div>
                  {sim.isSafe !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verdict:</span>
                      <span className={sim.isSafe ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {sim.isSafe ? 'SAFE' : 'UNSAFE'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <button
                  onClick={() => onLoadSimulation(sim)}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-cyan-400" />
                  Load into Lab
                </button>

                <button
                  onClick={() => handleDelete(sim.id)}
                  title="Delete Simulation"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
