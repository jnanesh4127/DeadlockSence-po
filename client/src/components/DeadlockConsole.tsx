import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertOctagon, 
  LifeBuoy, 
  Flame, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api.ts';
import { DeadlockDetectionResult, RecoveryPlanResult } from '../algorithms/types.ts';

const DETECTION_PRESETS = {
  deadlockedSystem: {
    title: "Multi-Instance Resource Deadlock",
    resourceNames: ['R1', 'R2', 'R3'],
    processNames: ['P0', 'P1', 'P2', 'P3'],
    available: [0, 0, 0],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 3],
      [2, 1, 1]
    ],
    request: [
      [0, 0, 0],
      [2, 0, 2],
      [0, 0, 0],
      [1, 0, 0]
    ],
    max: [
      [0, 1, 0],
      [4, 0, 2],
      [3, 0, 3],
      [3, 1, 1]
    ]
  },
  resolvedSystem: {
    title: "Normal Running Pipeline (No Deadlock)",
    resourceNames: ['CPU', 'Disk', 'Memory'],
    processNames: ['P0', 'P1', 'P2'],
    available: [2, 1, 1],
    allocation: [
      [1, 0, 1],
      [0, 1, 0],
      [1, 1, 0]
    ],
    request: [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 0]
    ],
    max: [
      [2, 1, 1],
      [1, 2, 1],
      [2, 1, 1]
    ]
  }
};

export const DeadlockConsole: React.FC = () => {
  const [resourceNames, setResourceNames] = useState<string[]>(DETECTION_PRESETS.deadlockedSystem.resourceNames);
  const [processNames, setProcessNames] = useState<string[]>(DETECTION_PRESETS.deadlockedSystem.processNames);
  const [available, setAvailable] = useState<number[]>(DETECTION_PRESETS.deadlockedSystem.available);
  const [allocation, setAllocation] = useState<number[][]>(DETECTION_PRESETS.deadlockedSystem.allocation);
  const [requestMatrix, setRequestMatrix] = useState<number[][]>(DETECTION_PRESETS.deadlockedSystem.request);
  const [maxMatrix, setMaxMatrix] = useState<number[][]>(DETECTION_PRESETS.deadlockedSystem.max);

  const [detectionResult, setDetectionResult] = useState<DeadlockDetectionResult | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const handleRunDetection = async () => {
    setLoading(true);
    setRecoveryPlan(null);
    try {
      const res = await apiService.runDeadlockDetection({
        resourceNames,
        processNames,
        available,
        allocation,
        request: requestMatrix
      });
      setDetectionResult(res);

      if (res.isDeadlocked) {
        // Automatically suggest recovery plan
        const rec = await apiService.calculateRecoveryPlan({
          resourceNames,
          processNames,
          totalResources: available.map((a, j) => a + allocation.reduce((s, r) => s + (r[j] || 0), 0)),
          allocation,
          max: maxMatrix,
          deadlockedIndices: res.deadlockedIndices,
          strategy: 'termination'
        });
        setRecoveryPlan(rec);
      }
    } catch (e: any) {
      alert(`Detection failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (key: keyof typeof DETECTION_PRESETS) => {
    const p = DETECTION_PRESETS[key];
    setResourceNames([...p.resourceNames]);
    setProcessNames([...p.processNames]);
    setAvailable([...p.available]);
    setAllocation(p.allocation.map(r => [...r]));
    setRequestMatrix(p.request.map(r => [...r]));
    setMaxMatrix(p.max.map(r => [...r]));
    setDetectionResult(null);
    setRecoveryPlan(null);
  };

  const handleSimulateRecovery = () => {
    if (!recoveryPlan || recoveryPlan.recommendedVictims.length === 0) return;
    const bestVictim = recoveryPlan.recommendedVictims[0];
    const victimIdx = processNames.indexOf(bestVictim.processName);
    if (victimIdx === -1) return;

    // Simulate victim process termination: release its allocation
    const newAlloc = allocation.map((row, i) =>
      i === victimIdx ? new Array(resourceNames.length).fill(0) : [...row]
    );
    const newReq = requestMatrix.map((row, i) =>
      i === victimIdx ? new Array(resourceNames.length).fill(0) : [...row]
    );

    // Increase available by victim allocation
    const newAvail = [...available];
    for (let j = 0; j < resourceNames.length; j++) {
      newAvail[j] += allocation[victimIdx][j];
    }

    setAllocation(newAlloc);
    setRequestMatrix(newReq);
    setAvailable(newAvail);

    // Re-run detection on new state
    apiService.runDeadlockDetection({
      resourceNames,
      processNames,
      available: newAvail,
      allocation: newAlloc,
      request: newReq
    }).then(res => {
      setDetectionResult(res);
      setRecoveryPlan(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">Deadlock Detection &amp; Recovery Console</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Multi-Instance Matrix Reduction Algorithm, Victim Cost Analysis &amp; Process Recovery Simulation
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Presets:</span>
          <button
            onClick={() => loadPreset('deadlockedSystem')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Deadlocked State (4P, 3R)
          </button>
          <button
            onClick={() => loadPreset('resolvedSystem')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Deadlock-Free Pipeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left 2 Cols: Matrix Inputs & Step Logs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Available Vector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Currently Available Resources (Work Vector)
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto">
              {resourceNames.map((r, idx) => (
                <div key={r} className="flex flex-col items-center">
                  <span className="font-mono text-xs font-bold text-cyan-400 mb-1">{r}</span>
                  <input
                    type="number"
                    min="0"
                    value={available[idx] ?? 0}
                    onChange={(e) => {
                      const next = [...available];
                      next[idx] = parseInt(e.target.value) || 0;
                      setAvailable(next);
                    }}
                    className="w-16 rounded-xl border border-slate-700 bg-slate-950 p-2 text-center font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Allocation & Request Matrices */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Allocation &amp; Request Matrices
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2 px-3 font-semibold">Process</th>
                    <th className="py-2 px-3 text-center" colSpan={resourceNames.length}>
                      Currently Allocated
                    </th>
                    <th className="py-2 px-3 text-center" colSpan={resourceNames.length}>
                      Outstanding Request (Wait)
                    </th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                  <tr className="border-b border-slate-800/70 text-[10px] text-slate-500 font-mono">
                    <th className="py-1 px-3">Name</th>
                    {resourceNames.map(r => (
                      <th key={`det-a-${r}`} className="text-center py-1 px-1.5 text-cyan-400">{r}</th>
                    ))}
                    {resourceNames.map(r => (
                      <th key={`det-r-${r}`} className="text-center py-1 px-1.5 text-amber-400">{r}</th>
                    ))}
                    <th className="text-center py-1 px-2">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {processNames.map((pName, pIdx) => {
                    const isDeadlocked = detectionResult?.deadlockedIndices.includes(pIdx);
                    return (
                      <tr 
                        key={pName} 
                        className={`transition-colors ${
                          isDeadlocked ? 'bg-red-950/30' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-white font-sans flex items-center gap-1.5">
                          {pName}
                          {isDeadlocked && (
                            <span className="rounded bg-red-900/60 px-1 py-0.2 text-[9px] text-red-300 border border-red-700/60">
                              DEADLOCKED
                            </span>
                          )}
                        </td>

                        {/* Allocation cells */}
                        {resourceNames.map((_, rIdx) => (
                          <td key={`alloc-c-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                            <input
                              type="number"
                              min="0"
                              value={allocation[pIdx]?.[rIdx] ?? 0}
                              onChange={(e) => {
                                const next = allocation.map((row, i) =>
                                  i === pIdx ? row.map((c, j) => (j === rIdx ? parseInt(e.target.value) || 0 : c)) : [...row]
                                );
                                setAllocation(next);
                              }}
                              className="w-12 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                        ))}

                        {/* Request cells */}
                        {resourceNames.map((_, rIdx) => (
                          <td key={`req-c-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                            <input
                              type="number"
                              min="0"
                              value={requestMatrix[pIdx]?.[rIdx] ?? 0}
                              onChange={(e) => {
                                const next = requestMatrix.map((row, i) =>
                                  i === pIdx ? row.map((c, j) => (j === rIdx ? parseInt(e.target.value) || 0 : c)) : [...row]
                                );
                                setRequestMatrix(next);
                              }}
                              className="w-12 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                        ))}

                        <td className="py-1 px-2 text-center font-sans text-xs">
                          {detectionResult ? (
                            isDeadlocked ? (
                              <span className="text-red-400 font-semibold">Blocked</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Unmarked / Free</span>
                            )
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={handleRunDetection}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                {loading ? 'Evaluating...' : 'Run Deadlock Detection'}
              </button>

              <button
                onClick={() => loadPreset('deadlockedSystem')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Matrices
              </button>
            </div>
          </div>

          {/* Detection Step Trace */}
          {detectionResult && detectionResult.steps.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Algorithm Execution Trace
              </h3>
              <div className="space-y-2">
                {detectionResult.steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-950 text-cyan-400 font-mono font-bold text-[11px] border border-cyan-800">
                      #{st.stepNumber}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-sans">{st.processName}</span>
                        <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                          Satisfied with available Work
                        </span>
                      </div>
                      <p className="text-slate-400">{st.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Detection Verdict & Recovery Planner */}
        <div className="space-y-6">
          {/* Verdict Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Detection Verdict
            </h3>

            {detectionResult ? (
              <div className={`rounded-xl border p-4 ${
                detectionResult.isDeadlocked
                  ? 'border-red-800/80 bg-red-950/40 text-red-200'
                  : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  {detectionResult.isDeadlocked ? (
                    <>
                      <AlertOctagon className="h-5 w-5 text-red-400" />
                      <span>Deadlock Detected!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>No Deadlock in System</span>
                    </>
                  )}
                </div>

                {detectionResult.isDeadlocked ? (
                  <div className="space-y-2 mt-2 text-xs">
                    <p>Deadlocked processes unable to make progress:</p>
                    <div className="flex flex-wrap gap-1.5 font-mono">
                      {detectionResult.deadlockedProcesses.map(p => (
                        <span key={p} className="rounded bg-red-900/70 px-2 py-0.5 font-bold text-red-200 border border-red-700/60">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="mt-3 text-xs leading-relaxed opacity-90 border-t border-slate-800/60 pt-2.5">
                  {detectionResult.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                Click &quot;Run Deadlock Detection&quot; to test whether the system is deadlocked.
              </div>
            )}
          </div>

          {/* Recovery Strategy & Victim Selection */}
          {recoveryPlan && recoveryPlan.recommendedVictims.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Recommended Recovery Strategy
                </h3>
              </div>

              <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-3.5 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-amber-300 font-semibold block mb-1">
                    Optimal Victim Process to Terminate:
                  </span>
                  <div className="flex items-center justify-between rounded-lg border border-amber-800/60 bg-amber-950/70 p-2.5">
                    <span className="font-bold text-amber-200 text-sm">
                      {recoveryPlan.recommendedVictims[0].processName}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300">
                      Cost Score: {recoveryPlan.recommendedVictims[0].cost}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {recoveryPlan.recommendedVictims[0].rationale}
                  </p>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed border-t border-amber-900/40 pt-2">
                  {recoveryPlan.explanation}
                </p>

                <button
                  onClick={handleSimulateRecovery}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 py-2 font-semibold text-white transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Simulate Termination of {recoveryPlan.recommendedVictims[0].processName}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
