import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Network, 
  Layers, 
  BookOpen, 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Database, 
  ArrowRight, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';
import { apiService } from '../services/api.ts';
import { DeadlockRiskResult } from '../algorithms/types.ts';

interface DashboardOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenHealth: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate, onOpenHealth }) => {
  const [riskData, setRiskData] = useState<DeadlockRiskResult | null>(null);

  useEffect(() => {
    // Initial benchmark risk assessment based on standard baseline
    apiService.calculateRiskAssessment({
      resourceNames: ['CPU', 'Memory', 'Disk'],
      processNames: ['P0', 'P1', 'P2', 'P3'],
      totalResources: [10, 5, 7],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1]
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2]
      ]
    }).then(res => setRiskData(res)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/80 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Operating System Laboratory
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Deadlock Detection, Prevention &amp; Banker&apos;s Engine
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Simulate and mathematically verify Operating System deadlock conditions, compute Banker&apos;s algorithm safe sequences, render Resource Allocation Graphs (RAG) and Wait-For Graphs (WFG), and execute automated recovery plans.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('bankers')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-600/25 hover:from-cyan-500 hover:to-blue-500 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Launch Banker&apos;s Lab
            </button>
            <button
              onClick={() => onNavigate('rag')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Network className="h-4 w-4 text-cyan-400" />
              Analyze Graphs
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Risk Diagnostic Meter */}
      {riskData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Operating System Deadlock Risk Assessment
              </h2>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
              riskData.riskLevel === 'LOW' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              riskData.riskLevel === 'MODERATE' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
              riskData.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              'bg-red-950 text-red-400 border border-red-800'
            }`}>
              {riskData.riskLevel} RISK ({riskData.overallRiskScore}%)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Utilization Gauge */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
              <span className="text-xs text-slate-400">Resource Utilization</span>
              <div className="space-y-1.5 pt-1">
                {Object.entries(riskData.metrics.utilizationPercent).map(([res, pct]) => (
                  <div key={res} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300">{res}</span>
                      <span className="text-cyan-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contention Rate */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
              <span className="text-xs text-slate-400">Contention Ratios (Need / Available)</span>
              <div className="space-y-1.5 pt-1">
                {Object.entries(riskData.metrics.contentionRate).map(([res, rate]) => (
                  <div key={res} className="flex justify-between items-center text-[11px] font-mono border-b border-slate-800/60 pb-1">
                    <span className="text-slate-300">{res}</span>
                    <span className={`font-bold ${rate > 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {rate}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
              <span className="text-xs text-slate-400 font-semibold block mb-1">OS Recommendations</span>
              <ul className="space-y-1 text-[11px] text-slate-300 leading-snug">
                {riskData.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modules Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Module 1: Bankers */}
        <div 
          onClick={() => onNavigate('bankers')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-600/70 hover:bg-slate-900 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Banker&apos;s Safety Lab</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive matrix editor for Available, Allocation, Max, and Need. Run step-by-step safety evaluations and test resource requests.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Explore Matrices</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Module 2: RAG & WFG */}
        <div 
          onClick={() => onNavigate('rag')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-600/70 hover:bg-slate-900 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 text-blue-400 border border-blue-800 mb-3 group-hover:scale-105 transition-transform">
              <Network className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">RAG &amp; Wait-For Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize assignment and request edges. Perform DFS cycle detection and learn why multi-instance cycles don&apos;t always guarantee deadlock.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Visualizer Canvas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Module 3: Detection */}
        <div 
          onClick={() => onNavigate('detection')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-600/70 hover:bg-slate-900 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 text-purple-400 border border-purple-800 mb-3 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Detection &amp; Recovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-instance deadlock detection algorithm, victim process termination cost analysis, and rollback state simulation.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Run Detection</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Module 4: Practice Lab */}
        <div 
          onClick={() => onNavigate('practice')}
          className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-600/70 hover:bg-slate-900 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">OS Lab Exercises</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test your knowledge on safe vs unsafe transitions, cycle necessity vs sufficiency, and Coffman deadlock conditions.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Start Practice</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* The 4 Coffman Conditions Cheatsheet */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          The 4 Coffman Conditions (Must hold simultaneously for Deadlock)
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
            <span className="font-bold text-cyan-400 font-mono">1. Mutual Exclusion</span>
            <p className="text-slate-400 leading-relaxed">
              At least one resource must be held in a non-shareable mode; only one process can use it at any time.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
            <span className="font-bold text-cyan-400 font-mono">2. Hold and Wait</span>
            <p className="text-slate-400 leading-relaxed">
              A process must be currently holding at least one resource and requesting additional resources held by other processes.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
            <span className="font-bold text-cyan-400 font-mono">3. No Preemption</span>
            <p className="text-slate-400 leading-relaxed">
              Resources cannot be forcibly preempted from a process; they can only be released voluntarily after task completion.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
            <span className="font-bold text-cyan-400 font-mono">4. Circular Wait</span>
            <p className="text-slate-400 leading-relaxed">
              A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
