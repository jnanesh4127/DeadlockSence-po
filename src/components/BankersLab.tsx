import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Save, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Compass,
  Info,
  BookOpen
} from 'lucide-react';
import { apiService } from '../services/api.ts';
import { BankersResult, ResourceRequestResult } from '../algorithms/types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { BankersTour } from './BankersTour.tsx';
import { TutorialModal } from './TutorialModal.tsx';

// Preset configurations
const PRESETS = {
  classicSafe: {
    title: "Classic Safe State (Silberschatz)",
    resourceNames: ['A', 'B', 'C'],
    processNames: ['P0', 'P1', 'P2', 'P3', 'P4'],
    totalResources: [10, 5, 7],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ],
    max: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ]
  },
  unsafeState: {
    title: "Unsafe Deadlock Vulnerability",
    resourceNames: ['R1', 'R2'],
    processNames: ['P0', 'P1'],
    totalResources: [3, 3],
    allocation: [
      [2, 1],
      [1, 2]
    ],
    max: [
      [3, 3],
      [3, 3]
    ]
  },
  fourResources: {
    title: "4-Resource System (A, B, C, D)",
    resourceNames: ['A', 'B', 'C', 'D'],
    processNames: ['P0', 'P1', 'P2', 'P3'],
    totalResources: [6, 5, 7, 6],
    allocation: [
      [0, 0, 1, 2],
      [1, 0, 0, 0],
      [1, 3, 5, 4],
      [0, 6, 3, 2]
    ],
    max: [
      [0, 0, 1, 2],
      [1, 7, 5, 0],
      [2, 3, 5, 6],
      [0, 6, 5, 2]
    ]
  }
};

interface BankersLabProps {
  onOpenAuth: () => void;
}

export const BankersLab: React.FC<BankersLabProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();

  const [resourceNames, setResourceNames] = useState<string[]>(PRESETS.classicSafe.resourceNames);
  const [processNames, setProcessNames] = useState<string[]>(PRESETS.classicSafe.processNames);
  const [totalResources, setTotalResources] = useState<number[]>(PRESETS.classicSafe.totalResources);
  const [allocation, setAllocation] = useState<number[][]>(PRESETS.classicSafe.allocation);
  const [max, setMax] = useState<number[][]>(PRESETS.classicSafe.max);

  // Safety & Request execution state
  const [safetyResult, setSafetyResult] = useState<BankersResult | null>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [requestProcessIdx, setRequestProcessIdx] = useState<number>(1);
  const [requestVector, setRequestVector] = useState<number[]>([1, 0, 2]);
  const [requestResult, setRequestResult] = useState<ResourceRequestResult | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Saving state
  const [simulationTitle, setSimulationTitle] = useState('My Banker’s Simulation');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Guided Walkthrough Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Auto-calculated Need and Available
  const calculateNeedLocal = () => {
    return max.map((row, i) =>
      row.map((maxVal, j) => Math.max(0, maxVal - (allocation[i]?.[j] || 0)))
    );
  };

  const calculateAvailableLocal = () => {
    return totalResources.map((tot, j) => {
      const allocatedSum = allocation.reduce((sum, row) => sum + (row[j] || 0), 0);
      return tot - allocatedSum;
    });
  };

  const localNeed = calculateNeedLocal();
  const localAvailable = calculateAvailableLocal();

  // Run initial safety check
  useEffect(() => {
    runSafetyCheck();
  }, []);

  const runSafetyCheck = async () => {
    setRunningCheck(true);
    setGeneralError(null);
    try {
      const res = await apiService.runBankersSafety({
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max
      });
      setSafetyResult(res);
    } catch (err: any) {
      setGeneralError(err.response?.data?.error || err.message || 'Safety execution failed.');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleTestRequest = async () => {
    setRequesting(true);
    setGeneralError(null);
    try {
      const res = await apiService.requestResource({
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max,
        processIndex: requestProcessIdx,
        request: requestVector
      });
      setRequestResult(res);
    } catch (err: any) {
      setGeneralError(err.response?.data?.error || err.message || 'Request evaluation failed.');
    } finally {
      setRequesting(false);
    }
  };

  const applyGrantedRequest = () => {
    if (requestResult?.granted && requestResult.updatedAllocation) {
      setAllocation(requestResult.updatedAllocation);
      runSafetyCheck();
      setRequestResult(null);
    }
  };

  const handleSaveSimulation = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setSaving(true);
    try {
      await apiService.saveSimulation({
        title: simulationTitle,
        algorithm: 'bankers',
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max,
        isSafe: safetyResult?.isSafe,
        safeSequence: safetyResult?.safeSequence
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save simulation to Cloud Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setResourceNames([...p.resourceNames]);
    setProcessNames([...p.processNames]);
    setTotalResources([...p.totalResources]);
    setAllocation(p.allocation.map(r => [...r]));
    setMax(p.max.map(r => [...r]));
    setRequestVector(new Array(p.resourceNames.length).fill(0));
    setSafetyResult(null);
    setRequestResult(null);
  };

  const updateAllocationCell = (pIdx: number, rIdx: number, val: number) => {
    const next = allocation.map((row, i) =>
      i === pIdx ? row.map((c, j) => (j === rIdx ? Math.max(0, val) : c)) : [...row]
    );
    setAllocation(next);
  };

  const updateMaxCell = (pIdx: number, rIdx: number, val: number) => {
    const next = max.map((row, i) =>
      i === pIdx ? row.map((c, j) => (j === rIdx ? Math.max(0, val) : c)) : [...row]
    );
    setMax(next);
  };

  const updateTotalCell = (rIdx: number, val: number) => {
    const next = [...totalResources];
    next[rIdx] = Math.max(0, val);
    setTotalResources(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Guided Tour Launcher */}
      <div 
        id="tour-header"
        className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between transition-all"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">Banker&apos;s Algorithm Simulator</h1>
            <span className="rounded bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 border border-cyan-800/60">
              Interactive Lab
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Deadlock Avoidance with Safety Sequence Analysis &amp; Resource Request Verification
          </p>
        </div>

        {/* Action Controls & Walkthrough Launcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Show Tutorial Button */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 transition-all shadow-sm shadow-blue-950"
            title="Show Tutorial &amp; Concepts Overview"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            <span>Show Tutorial</span>
          </button>

          {/* Guided Walkthrough Tour Button */}
          <button
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all shadow-sm shadow-cyan-950"
            title="Start Interactive Walkthrough"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Interactive Guided Tour</span>
          </button>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 hidden sm:inline">Presets:</span>
            <button
              onClick={() => loadPreset('classicSafe')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              Classic Safe
            </button>
            <button
              onClick={() => loadPreset('unsafeState')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
            >
              Unsafe State
            </button>
            <button
              onClick={() => loadPreset('fourResources')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              4-Resource
            </button>
          </div>
        </div>
      </div>

      {generalError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/80 bg-red-950/50 p-4 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main Matrix Editor Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Resource Vectors & Matrices (2 cols wide) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Total & Available Vectors */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resource Vectors
              </h3>
              <span className="text-[11px] text-slate-500">
                Total instances (E) vs Currently available (A)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Resources Card */}
              <div 
                id="tour-total-resources"
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition-all focus-within:border-cyan-500/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">Total Resources (E)</span>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTooltip('total')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="text-slate-500 hover:text-cyan-400"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">System Capacity</span>
                </div>

                {/* Tooltip Popup */}
                {hoveredTooltip === 'total' && (
                  <div className="absolute left-3 top-10 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-[11px] text-slate-300 shadow-xl pointer-events-none">
                    <strong>Total Resources:</strong> The total physical hardware capacity of each resource type configured in the system.
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => (
                    <div key={r} className="flex flex-col items-center">
                      <span className="font-mono text-[11px] text-cyan-400 font-semibold mb-1">{r}</span>
                      <input
                        type="number"
                        min="0"
                        value={totalResources[idx] ?? 0}
                        onChange={(e) => updateTotalCell(idx, parseInt(e.target.value) || 0)}
                        className="w-14 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-center font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Vector Card */}
              <div 
                id="tour-available-vector"
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">Available Vector (A)</span>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTooltip('available')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="text-slate-500 hover:text-emerald-400"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Total - Allocated</span>
                </div>

                {/* Tooltip Popup */}
                {hoveredTooltip === 'available' && (
                  <div className="absolute left-3 top-10 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-[11px] text-slate-300 shadow-xl pointer-events-none">
                    <strong>Available Vector:</strong> Available[j] = Total[j] - Σ_i Allocation[i][j]. The unallocated free resources available for requests.
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => {
                    const avail = localAvailable[idx];
                    return (
                      <div key={r} className="flex flex-col items-center">
                        <span className="font-mono text-[11px] text-emerald-400 font-semibold mb-1">{r}</span>
                        <div className={`w-14 rounded-lg border p-1.5 text-center font-mono text-xs font-bold ${
                          avail < 0
                            ? 'border-red-600 bg-red-950 text-red-300'
                            : 'border-slate-800 bg-slate-900/90 text-emerald-300'
                        }`}>
                          {avail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Matrices: Allocation, Max, and Need */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Process Resource Matrices
              </h3>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span>Formula:</span>
                <span className="rounded bg-slate-950 px-2 py-0.5 text-amber-300 border border-slate-800">
                  Need = Max - Allocation
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Process</th>
                    
                    {/* Allocation Header */}
                    <th 
                      id="tour-allocation-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-cyan-300">Allocation</span>
                        <span className="text-[10px] font-mono text-slate-500">(Held)</span>
                      </div>
                    </th>

                    {/* Maximum Claim Header */}
                    <th 
                      id="tour-max-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-blue-300">Maximum Claim</span>
                        <span className="text-[10px] font-mono text-slate-500">(Peak)</span>
                      </div>
                    </th>

                    {/* Need Header */}
                    <th 
                      id="tour-need-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-amber-300">Need Matrix</span>
                        <span className="text-[10px] font-mono text-slate-500">(Max - Alloc)</span>
                      </div>
                    </th>
                  </tr>

                  {/* Resource Column Sub-headers */}
                  <tr className="border-b border-slate-800/70 text-[10px] text-slate-500 font-mono">
                    <th className="py-1 px-3">Name</th>
                    {resourceNames.map(r => (
                      <th key={`alloc-h-${r}`} className="text-center py-1 px-1.5 text-cyan-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                    {resourceNames.map(r => (
                      <th key={`max-h-${r}`} className="text-center py-1 px-1.5 text-blue-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                    {resourceNames.map(r => (
                      <th key={`need-h-${r}`} className="text-center py-1 px-1.5 text-amber-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {processNames.map((pName, pIdx) => (
                    <tr key={pName} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 font-bold text-white font-sans">{pName}</td>

                      {/* Allocation inputs */}
                      {resourceNames.map((_, rIdx) => (
                        <td key={`alloc-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={allocation[pIdx]?.[rIdx] ?? 0}
                            onChange={(e) => updateAllocationCell(pIdx, rIdx, parseInt(e.target.value) || 0)}
                            className="w-10 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* Max inputs */}
                      {resourceNames.map((_, rIdx) => (
                        <td key={`max-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={max[pIdx]?.[rIdx] ?? 0}
                            onChange={(e) => updateMaxCell(pIdx, rIdx, parseInt(e.target.value) || 0)}
                            className="w-10 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* Calculated Need cells */}
                      {resourceNames.map((_, rIdx) => {
                        const needVal = localNeed[pIdx]?.[rIdx] ?? 0;
                        return (
                          <td key={`need-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                            <span className="inline-block w-10 rounded bg-slate-950/80 py-1 text-center text-xs font-semibold text-amber-300 border border-slate-800">
                              {needVal}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix action buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <button
                  id="tour-safety-check"
                  onClick={runSafetyCheck}
                  disabled={runningCheck}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  {runningCheck ? 'Verifying...' : 'Run Safety Algorithm'}
                </button>
                <button
                  onClick={() => loadPreset('classicSafe')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              {/* Save Simulation to Firestore */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Simulation Title..."
                  value={simulationTitle}
                  onChange={(e) => setSimulationTitle(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveSimulation}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving...' : saveSuccess ? 'Saved to Cloud!' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Safety Execution Log */}
          {safetyResult && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Safety Algorithm Execution Steps
              </h3>
              {safetyResult.steps.length > 0 ? (
                <div className="space-y-2">
                  {safetyResult.steps.map((st) => (
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
                            Need ≤ Work satisfied
                          </span>
                        </div>
                        <p className="text-slate-400">{st.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs text-red-300">
                  No process could satisfy the safety condition. Immediate unsafe state.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Safety Verdict & Resource Request Tester */}
        <div className="space-y-6">
          {/* Safety State Result Card */}
          <div 
            id="tour-safety-verdict"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Safety Verdict
            </h3>

            {safetyResult ? (
              <div className={`rounded-xl border p-4 ${
                safetyResult.isSafe 
                  ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200' 
                  : 'border-red-800/80 bg-red-950/40 text-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  {safetyResult.isSafe ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>System in SAFE State</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span>System in UNSAFE State</span>
                    </>
                  )}
                </div>

                {safetyResult.isSafe ? (
                  <div className="space-y-2 mt-3">
                    <span className="text-[11px] text-emerald-400 font-medium">Safe Execution Sequence:</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                      {safetyResult.safeSequence.map((p, idx) => (
                        <React.Fragment key={p}>
                          <span className="rounded-lg bg-emerald-900/60 px-2 py-1 font-bold text-emerald-300 border border-emerald-700/60">
                            {p}
                          </span>
                          {idx < safetyResult.safeSequence.length - 1 && (
                            <span className="text-emerald-500 font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 mt-2 text-xs text-red-300/90">
                    <p>Unresolved processes cannot complete without additional resource releases:</p>
                    <span className="font-mono font-bold text-red-400">
                      [{safetyResult.unresolvedProcesses?.join(', ')}]
                    </span>
                  </div>
                )}

                <p className="mt-3 text-xs leading-relaxed opacity-85 border-t border-slate-800/50 pt-2.5">
                  {safetyResult.explanation}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                Click &quot;Run Safety Algorithm&quot; to evaluate current matrices.
              </div>
            )}
          </div>

          {/* Resource Request Algorithm Panel */}
          <div 
            id="tour-request-tester"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resource Request Tester
              </h3>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">
                Pretend Allocation
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Test whether allocating requested resources to a process maintains a safe state.
            </p>

            <div className="space-y-3">
              {/* Select Process */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Requesting Process</label>
                <select
                  value={requestProcessIdx}
                  onChange={(e) => setRequestProcessIdx(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {processNames.map((p, idx) => (
                    <option key={p} value={idx}>
                      {p} (Current Need: [{localNeed[idx]?.join(', ')}])
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Vector Inputs */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Requested Vector
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => (
                    <div key={`req-${r}`} className="flex flex-col items-center">
                      <span className="font-mono text-[10px] text-slate-400 mb-0.5">{r}</span>
                      <input
                        type="number"
                        min="0"
                        value={requestVector[idx] ?? 0}
                        onChange={(e) => {
                          const next = [...requestVector];
                          next[idx] = parseInt(e.target.value) || 0;
                          setRequestVector(next);
                        }}
                        className="w-12 rounded-lg border border-slate-700 bg-slate-950 p-1 text-center font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTestRequest}
                disabled={requesting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                {requesting ? 'Evaluating...' : 'Evaluate Request'}
              </button>
            </div>

            {/* Request Evaluation Output */}
            {requestResult && (
              <div className={`mt-4 rounded-xl border p-3.5 text-xs ${
                requestResult.granted
                  ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-800/80 bg-red-950/40 text-red-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {requestResult.granted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Request can be GRANTED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span>Request DENIED</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed opacity-90">{requestResult.reason}</p>

                {requestResult.granted && (
                  <button
                    onClick={applyGrantedRequest}
                    className="mt-3 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 py-1.5 font-semibold text-white transition-colors"
                  >
                    Apply Allocation to Matrices
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guided Walkthrough Modal Component */}
      <BankersTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* TutorialModal Component */}
      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />
    </div>
  );
};
