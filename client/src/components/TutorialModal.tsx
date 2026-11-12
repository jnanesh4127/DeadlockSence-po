import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  BookOpen, 
  Layers, 
  Database, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  Info
} from 'lucide-react';

export interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepContent {
  stepNumber: number;
  badge: string;
  title: string;
  matrixFormula?: string;
  summary: string;
  details: string[];
  example?: {
    label: string;
    value: string;
  };
}

const TUTORIAL_STEPS: StepContent[] = [
  {
    stepNumber: 1,
    badge: "Deadlock Avoidance",
    title: "Overview of Banker's Algorithm",
    summary: "Banker's Algorithm, developed by Edsger Dijkstra, is a classic deadlock avoidance strategy for systems with multiple instances of each resource type.",
    details: [
      "Deadlock avoidance requires the OS to be given advance information concerning which resources a process will request during its execution.",
      "The algorithm tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources.",
      "A state is considered SAFE if there exists an execution sequence allowing all processes to finish without entering a deadlock."
    ],
    example: {
      label: "Key Invariant",
      value: "A request is granted ONLY if the resulting system state remains SAFE."
    }
  },
  {
    stepNumber: 2,
    badge: "Vector (m resources)",
    title: "1. Available Resources Vector (Available)",
    matrixFormula: "Available[j] = Total[j] - Σ_i Allocation[i][j]",
    summary: "A 1D vector of length m representing the quantity of each resource type currently unallocated and free for distribution.",
    details: [
      "If Available[j] = k, there are k instances of resource R_j currently available for processes to request.",
      "As processes are allocated resources, Available decreases. When processes terminate and release resources, Available increases.",
      "Available cannot be negative. If any element is negative, total allocations exceed total physical system capacity."
    ],
    example: {
      label: "Example Vector",
      value: "Available = [ A: 3, B: 3, C: 2 ] free instances"
    }
  },
  {
    stepNumber: 3,
    badge: "Matrix (n × m)",
    title: "2. Maximum Claim Matrix (Max)",
    matrixFormula: "Max[i][j] = Peak demand of process P_i for resource R_j",
    summary: "An n × m matrix defining the maximum number of instances of each resource that each process may request before completion.",
    details: [
      "Every process must declare its absolute maximum resource requirement upfront before execution begins.",
      "A process is strictly forbidden from requesting more than its declared maximum claim at any point in time.",
      "Max[i][j] must be greater than or equal to current Allocation[i][j]."
    ],
    example: {
      label: "Process P0 Claim",
      value: "Max[0] = [ A: 7, B: 5, C: 3 ]"
    }
  },
  {
    stepNumber: 4,
    badge: "Matrix (n × m)",
    title: "3. Current Allocation Matrix (Allocation)",
    matrixFormula: "Allocation[i][j] = Currently held instances",
    summary: "An n × m matrix specifying the number of instances of each resource type currently allocated to and held by each process.",
    details: [
      "Allocation[i][j] represents resources that are locked by process P_i and cannot be used by other processes.",
      "The sum of all allocations for resource j cannot exceed the total system capacity: Σ_i Allocation[i][j] ≤ Total[j].",
      "When process P_i completes execution, all its allocated instances are freed and added back to Available."
    ],
    example: {
      label: "Process P1 Holding",
      value: "Allocation[1] = [ A: 2, B: 0, C: 0 ]"
    }
  },
  {
    stepNumber: 5,
    badge: "Matrix (n × m)",
    title: "4. Need Matrix (Need)",
    matrixFormula: "Need[i][j] = Max[i][j] - Allocation[i][j]",
    summary: "An n × m matrix indicating the remaining resource instances each process may require to finish its task.",
    details: [
      "Calculated automatically: Need is simply what a process might still ask for (Max minus what it already holds).",
      "During the safety check, process P_i can only proceed if its Need is less than or equal to currently available resources: Need[i] ≤ Work.",
      "If a process's Need is [0, 0, 0], it has acquired all required resources and will finish and release."
    ],
    example: {
      label: "P0 Need Calculation",
      value: "Max [7, 5, 3] - Alloc [0, 1, 0] = Need [7, 4, 3]"
    }
  },
  {
    stepNumber: 6,
    badge: "Algorithm Execution",
    title: "5. The Safety Algorithm & Safe Sequence",
    matrixFormula: "Need_i ≤ Work  →  Work = Work + Allocation_i",
    summary: "The OS iterates through processes to find an execution order where every process can complete safely.",
    details: [
      "Initialize Work = Available and Finish[i] = false for all processes.",
      "Find an index i such that Finish[i] == false and Need[i] ≤ Work. If found: Work = Work + Allocation[i], Finish[i] = true, and repeat.",
      "If all Finish[i] == true, a SAFE sequence exists (e.g. <P1 → P3 → P4 → P0 → P2>). The system is in a SAFE state.",
      "If any Finish[i] remains false, no safe sequence exists; the system is in an UNSAFE state."
    ],
    example: {
      label: "Resulting Safe Sequence",
      value: "< P1 → P3 → P4 → P0 → P2 >"
    }
  },
  {
    stepNumber: 7,
    badge: "Pretend Allocation",
    title: "6. Resource Request Algorithm",
    matrixFormula: "Request_i ≤ Need_i  AND  Request_i ≤ Available",
    summary: "When a process requests resources, the OS evaluates whether granting it maintains system safety.",
    details: [
      "1. Check if Request_i ≤ Need_i. If not, raise error (process exceeded maximum claim).",
      "2. Check if Request_i ≤ Available. If not, process must wait (resources not available).",
      "3. Pretend allocation: Available' = Available - Request, Alloc' = Alloc + Request, Need' = Need - Request.",
      "4. Run the Safety Algorithm on pretend state: If Safe → Grant request; If Unsafe → Roll back and make process wait."
    ],
    example: {
      label: "Request Rule",
      value: "Prevents transition into an Unsafe state before actual assignment."
    }
  }
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Banker&apos;s Algorithm Tutorial</h2>
              <p className="text-xs text-slate-400">
                Step-by-step walkthrough of Available, Max, Allocation &amp; Need matrices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Navigation Dots & Progress Bar */}
        <div className="border-b border-slate-800/80 bg-slate-950/40 px-6 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}: {step.title}
            </span>
            <span className="font-mono text-cyan-400">
              {Math.round(((currentStep + 1) / TUTORIAL_STEPS.length) * 100)}% Complete
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((s, idx) => (
              <button
                key={s.stepNumber}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-cyan-400'
                    : idx < currentStep
                    ? 'bg-cyan-900/80 hover:bg-cyan-700'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Badge & Title */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-950/90 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-800">
              {step.badge}
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {step.title}
            </h3>
          </div>

          {/* High-level summary */}
          <p className="text-sm leading-relaxed text-slate-300">
            {step.summary}
          </p>

          {/* Mathematical Formula Callout */}
          {step.matrixFormula && (
            <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/30 p-3 font-mono text-xs text-cyan-300 flex items-center justify-between">
              <span className="text-[11px] font-sans text-slate-400">Mathematical Formula:</span>
              <span className="font-bold">{step.matrixFormula}</span>
            </div>
          )}

          {/* Bulleted Explanation List */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Key Mechanism &amp; Invariants:
            </span>
            <ul className="space-y-2">
              {step.details.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Concrete Example Box */}
          {step.example && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold">{step.example.label}:</span>
              </div>
              <p className="font-mono text-xs font-semibold text-emerald-300 pl-5">
                {step.example.value}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <>
                  <Check className="h-4 w-4" />
                  Finish Tutorial
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
