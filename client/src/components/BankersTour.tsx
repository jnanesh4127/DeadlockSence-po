import React, { useEffect, useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Compass, 
  Sparkles, 
  HelpCircle,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  description: string;
  formula?: string;
  tip?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetId: 'tour-header',
    title: "Welcome to Banker's Algorithm Lab",
    badge: "Core OS Concept",
    description: "The Banker's Algorithm (developed by Edsger Dijkstra) is a deadlock avoidance algorithm. It simulates the allocation of declared peak resources, testing for safety before granting requests so the system never enters an unsafe state.",
    tip: "You can use the presets in the top right to quickly load textbook scenarios like Silberschatz 5-process matrices.",
    position: 'bottom'
  },
  {
    id: 'total',
    targetId: 'tour-total-resources',
    title: "1. Total Resources Vector (E)",
    badge: "System Capacity",
    description: "Represents the total physical count of resource instances present in the operating system (e.g., A=10 CPU cores, B=5 Memory channels, C=7 Storage controllers).",
    formula: "Total = [ R_1, R_2, ..., R_m ]",
    tip: "Edit any cell to dynamically test hardware expansion or downsizing.",
    position: 'bottom'
  },
  {
    id: 'available',
    targetId: 'tour-available-vector',
    title: "2. Available Vector (A)",
    badge: "Free Resources",
    description: "The quantity of each resource type currently unallocated and free to be assigned to waiting processes.",
    formula: "Available[j] = Total[j] - Σ Allocation[i][j]",
    tip: "If any Available count turns negative (red), the sum of current allocations exceeds total physical capacity!",
    position: 'bottom'
  },
  {
    id: 'allocation',
    targetId: 'tour-allocation-matrix',
    title: "3. Current Allocation Matrix",
    badge: "Held Resources",
    description: "An n × m matrix showing how many instances of each resource are currently held by each process (P0 to Pn).",
    formula: "Allocation[i][j] ≤ Max[i][j]",
    tip: "When a process finishes running, all its allocated instances are freed and returned to the Available pool.",
    position: 'top'
  },
  {
    id: 'max',
    targetId: 'tour-max-matrix',
    title: "4. Maximum Claim Matrix",
    badge: "Declared Peak",
    description: "Defines the absolute maximum resource demand that each process may request before terminating. In Banker's algorithm, this upper bound must be declared upfront.",
    formula: "Max[i][j] ≥ Allocation[i][j]",
    tip: "A process is prohibited from ever requesting more than its declared maximum claim.",
    position: 'top'
  },
  {
    id: 'need',
    targetId: 'tour-need-matrix',
    title: "5. Calculated Need Matrix",
    badge: "Remaining Demand",
    description: "Calculated automatically by subtracting Allocation from Max. This represents the additional resources process i requires to complete execution.",
    formula: "Need[i][j] = Max[i][j] - Allocation[i][j]",
    tip: "A process can execute if and only if its Need is component-wise less than or equal to current Work (Need[i] ≤ Work).",
    position: 'top'
  },
  {
    id: 'safety',
    targetId: 'tour-safety-verdict',
    title: "6. Safety Algorithm & Safe Sequence",
    badge: "Safety Check",
    description: "The OS searches for an execution order <P_i1, P_i2, ..., P_in> where every process can obtain its maximum need, finish, and release resources.",
    formula: "Work = Work + Allocation[i] (after process finishes)",
    tip: "If a complete sequence of length n is discovered, the system is in a SAFE state. Otherwise, it is UNSAFE.",
    position: 'left'
  },
  {
    id: 'request',
    targetId: 'tour-request-tester',
    title: "7. Resource Request Simulator",
    badge: "Pretend Allocation",
    description: "When process Pi requests vector Y: (1) Check Y ≤ Need[i], (2) Check Y ≤ Available, (3) Pretend to allocate and run safety check. If safe, grant; if unsafe, process Pi must wait.",
    formula: "Available' = Available - Y; Alloc' = Alloc + Y; Need' = Need - Y",
    tip: "Test requests like [1, 0, 2] for P1 to verify how the OS guards against deadlock transitions.",
    position: 'left'
  }
];

interface BankersTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankersTour: React.FC<BankersTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (isOpen) {
      // Scroll target into view smoothly
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, currentStep, step.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div 
        onClick={onClose} 
        className="pointer-events-auto absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
      />

      {/* Floating Tour Guide Dialog */}
      <div className="pointer-events-auto relative z-10 w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-950/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Compass className="h-4 w-4 animate-spin-slow" />
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Interactive Walkthrough
              </span>
              <div className="text-xs text-slate-400">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-800/80">
              {step.badge}
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {step.title}
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Formula Callout */}
          {step.formula && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-cyan-300 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-sans">Formula:</span>
              <span className="font-bold">{step.formula}</span>
            </div>
          )}

          {/* Pro Tip Callout */}
          {step.tip && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-2.5 text-[11px] text-blue-300">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
              <span><strong>OS Tip:</strong> {step.tip}</span>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep 
                    ? 'w-5 bg-cyan-400' 
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Jump to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Finish Tour
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
