import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Play, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Send,
  Save,
  ArrowRight
} from 'lucide-react';

interface BankersTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
}

export const BankersTutorialModal: React.FC<BankersTutorialModalProps> = ({ 
  isOpen, 
  onClose,
  onStartTour 
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'instructions' | 'rules'>('concepts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Banker&apos;s Algorithm Tutorial</h2>
              <p className="text-xs text-slate-400">Core OS concepts, mathematical matrices &amp; simulator instructions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/40 px-5 pt-3">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold transition-colors ${
              activeTab === 'concepts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Core Concepts
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold transition-colors ${
              activeTab === 'instructions'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            How to Use the Tool
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold transition-colors ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Invariants &amp; Rules
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300">
          {/* TAB 1: CONCEPTS */}
          {activeTab === 'concepts' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 leading-relaxed">
                <span className="font-semibold text-cyan-300 block mb-1">What is Banker&apos;s Algorithm?</span>
                Designed by Edsger Dijkstra, the Banker&apos;s Algorithm is a <strong>deadlock avoidance</strong> algorithm for systems with multiple instances of each resource type. It ensures the system never enters an <strong>Unsafe State</strong> by testing whether granting a request could lead to deadlock.
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
                  The Four Essential Data Structures
                </h4>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-mono font-bold text-cyan-400">Available Vector [m]</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If <code className="text-cyan-300">Available[j] = k</code>, there are <code className="text-cyan-300">k</code> instances of resource type <code className="text-cyan-300">R_j</code> currently available in the system.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-mono font-bold text-blue-400">Max Matrix [n × m]</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If <code className="text-blue-300">Max[i][j] = k</code>, process <code className="text-blue-300">P_i</code> may request at most <code className="text-blue-300">k</code> instances of resource type <code className="text-blue-300">R_j</code>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-mono font-bold text-purple-400">Allocation Matrix [n × m]</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If <code className="text-purple-300">Allocation[i][j] = k</code>, process <code className="text-purple-300">P_i</code> is currently allocated <code className="text-purple-300">k</code> instances of resource <code className="text-purple-300">R_j</code>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-mono font-bold text-amber-400">Need Matrix [n × m]</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Calculated as <code className="text-amber-300">Need[i][j] = Max[i][j] - Allocation[i][j]</code>. The remaining resources process <code className="text-amber-300">P_i</code> may need to complete.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <span className="font-bold text-white block">The Safety Criterion &amp; Safe Sequence</span>
                <p className="text-slate-400 leading-relaxed">
                  A state is safe if there exists a safe sequence <code className="font-mono text-cyan-300">&lt;P_0, P_1, ..., P_n&gt;</code> such that for each <code className="font-mono">P_i</code>, its remaining need can be satisfied by current available resources plus all resources released by preceding processes:
                </p>
                <div className="rounded-lg bg-slate-900 p-2 text-center font-mono text-cyan-400 text-[11px] border border-slate-800">
                  Need_i ≤ Work &nbsp;→&nbsp; Work&apos; = Work + Allocation_i &nbsp;→&nbsp; Finish[i] = true
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Select a Preset or Input Custom Values</h4>
                  <p className="text-slate-400">
                    Click <strong>Classic Safe</strong>, <strong>Unsafe State</strong>, or <strong>4-Resource</strong> to populate benchmark textbook scenarios, or directly edit the Total, Allocation, and Max claim inputs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Observe Automatic Need &amp; Available Calculation</h4>
                  <p className="text-slate-400">
                    The simulator automatically recalculates <code className="text-amber-300">Need = Max - Allocation</code> and <code className="text-emerald-300">Available = Total - Allocated</code> as you modify values.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Run the Safety Algorithm</h4>
                  <p className="text-slate-400">
                    Click <strong>Run Safety Algorithm</strong>. The backend algorithm executes step-by-step, logging which process qualified, how the Work vector updated, and presenting the final safe sequence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Test Hypothetical Resource Requests</h4>
                  <p className="text-slate-400">
                    In the right-hand <strong>Resource Request Tester</strong> panel, pick a process, specify a requested vector (e.g. <code className="font-mono text-cyan-300">[1, 0, 2]</code>), and click <strong>Evaluate Request</strong>. If safe, you can apply the allocation directly to the matrix!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                  5
                </span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Save Simulation to Cloud Firestore</h4>
                  <p className="text-slate-400">
                    Sign in to your account and enter a title to preserve custom configurations in Cloud Firestore under your isolated user records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVARIANTS & RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3.5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Safe State vs Unsafe State vs Deadlock
                </div>
                <p className="text-slate-400 leading-relaxed">
                  An <strong>Unsafe State is NOT necessarily a deadlock</strong>; rather, it is a state from which the OS cannot guarantee avoidance of deadlock if processes simultaneously demand their peak maximum claims. Every deadlocked state is unsafe, but not every unsafe state is currently deadlocked.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Request Algorithm Validation Conditions
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong className="text-slate-300">Condition 1:</strong> <code className="text-cyan-300">Request_i ≤ Need_i</code> (Process must not exceed declared peak claim).</li>
                  <li><strong className="text-slate-300">Condition 2:</strong> <code className="text-cyan-300">Request_i ≤ Available</code> (Resources must physically exist right now; otherwise process must wait).</li>
                  <li><strong className="text-slate-300">Condition 3:</strong> Pretend state must satisfy the <strong>Safety Algorithm</strong> before actual allocation.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                <span className="font-bold text-white block">Resource Conservation Rule</span>
                <p className="text-slate-400 leading-relaxed">
                  Total physical resource units for any resource <code className="font-mono text-cyan-300">j</code> must always equal <code className="font-mono text-cyan-300">Available[j] + Σ_i Allocation[i][j]</code>. Available cannot be negative.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 p-4">
          {onStartTour ? (
            <button
              onClick={() => {
                onClose();
                onStartTour();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Launch Step-by-Step Guided Tour</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            Got it, Let&apos;s Simulate
          </button>
        </div>
      </div>
    </div>
  );
};
