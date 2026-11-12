import React, { useState } from 'react';
import { BookOpen, CheckCircle2, XCircle, ArrowRight, Award, RotateCcw, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  title: string;
  question: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    title: "Banker's Algorithm: Safe State Verification",
    question: "Given 5 processes (P0-P4) and 3 resources (A,B,C) with Available = [3, 3, 2] and P1's Need = [1, 2, 2]. Can P1 execute safely first?",
    scenario: "Total = [10, 5, 7], Available = [3, 3, 2]. P1 Allocation = [2, 0, 0], Max = [3, 2, 2] -> Need = [1, 2, 2].",
    options: [
      "Yes, because Need [1, 2, 2] ≤ Available [3, 3, 2]",
      "No, because Available is less than Max",
      "No, P1 must wait for P0 to release first",
      "Only if P1 requests single-instance allocation"
    ],
    correctIndex: 0,
    explanation: "Correct! The condition in Banker's Safety Algorithm is Need_i ≤ Work. Since Need [1, 2, 2] is component-wise less than or equal to Work [3, 3, 2], P1 can safely execute, finish, and release its allocation [2, 0, 0]."
  },
  {
    id: 'q2',
    title: "Graph Theory: Necessary vs Sufficient Conditions",
    question: "In a multiple-instance Resource Allocation Graph (RAG), if a directed cycle exists, is the system definitely in a deadlock?",
    scenario: "R1 and R2 have 2 instances each. P1 and P3 are involved in a cycle with R1 and R2, while P2 and P4 also hold instances of R1 and R2 but have no outstanding requests.",
    options: [
      "Yes, any cycle always proves deadlock regardless of instance counts",
      "No, because external processes holding resource instances may finish and break the cycle",
      "Yes, but only if the cycle contains an odd number of vertices",
      "No, cycles are only relevant in Wait-For Graphs"
    ],
    correctIndex: 1,
    explanation: "Correct! In multiple-instance resource systems, a cycle is a NECESSARY condition for deadlock, but NOT a sufficient one. If other processes outside the cycle hold instances and finish without making further requests, they release instances to break the cycle."
  },
  {
    id: 'q3',
    title: "Resource Request Safety Guarantee",
    question: "When a process makes a valid resource request (Request ≤ Need and Request ≤ Available), under what condition will the OS grant the allocation?",
    scenario: "The OS simulates allocation in a pretend state and runs the safety check.",
    options: [
      "Immediately, because the resources are already available",
      "Only if the simulated pretend state is verified to be in a SAFE state",
      "Only if all other processes are currently idle",
      "Only if the process is marked as highest priority"
    ],
    correctIndex: 1,
    explanation: "Correct! Banker's Algorithm ensures deadlock avoidance by pretending to allocate the request, then executing the Safety Algorithm. The request is granted if and only if the resulting system state remains SAFE."
  },
  {
    id: 'q4',
    title: "Wait-For Graph (WFG) Reduction",
    question: "Which type of resource systems allow the Resource Allocation Graph to be reduced directly into a Wait-For Graph (WFG)?",
    scenario: "A WFG replaces resource nodes with direct directed edges between waiting processes.",
    options: [
      "Only multiple-instance resource systems",
      "Only single-instance resource systems",
      "Any distributed system with shared memory",
      "Systems with preemption enabled"
    ],
    correctIndex: 1,
    explanation: "Correct! Wait-For Graphs are valid exclusively for single-instance resource systems, where an edge Pi → Pj represents that Pi is waiting for Pj to release a single-instance resource."
  }
];

export const PracticeLab: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    setAnswered(true);
    if (selectedOption === currentQ.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
            <BookOpen className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-bold text-white">OS Deadlock Practice &amp; Knowledge Lab</h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Master the four conditions of deadlock, Banker&apos;s algorithm invariants, and graph theory proofs
        </p>
      </div>

      {completed ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Exercise Completed!</h2>
          <p className="text-sm text-slate-300">
            Your Score: <span className="font-mono font-bold text-cyan-400 text-lg">{score}</span> / {QUIZ_QUESTIONS.length} ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%)
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {score === QUIZ_QUESTIONS.length
              ? "Flawless score! You have demonstrated comprehensive command of Operating System deadlock detection and avoidance principles."
              : "Good effort! Review the explanations to reinforce your understanding of single vs multi-instance resource systems."}
          </p>
          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Exercises
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}</span>
              <span className="font-mono">Current Score: {score}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question title & statement */}
          <div>
            <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 border border-cyan-800">
              {currentQ.title}
            </span>
            <h2 className="text-base font-bold text-white mt-2 mb-2">{currentQ.question}</h2>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
              {currentQ.scenario}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "border-slate-800 bg-slate-950 hover:bg-slate-800/80 text-slate-300";
              if (answered) {
                if (isCorrect) {
                  btnStyle = "border-emerald-600 bg-emerald-950/60 text-emerald-200";
                } else if (isSelected) {
                  btnStyle = "border-red-600 bg-red-950/60 text-red-200";
                }
              } else if (isSelected) {
                btnStyle = "border-cyan-500 bg-cyan-950/40 text-cyan-200";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-xs transition-colors ${btnStyle}`}
                >
                  <span className="flex-1">{opt}</span>
                  {answered && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 ml-2" />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation */}
          {answered && (
            <div className={`rounded-xl border p-4 text-xs leading-relaxed ${
              selectedOption === currentQ.correctIndex
                ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
                : 'border-amber-800/80 bg-amber-950/40 text-amber-200'
            }`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                Explanation
              </div>
              <p>{currentQ.explanation}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end pt-2">
            {!answered ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
                className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-xs font-semibold text-white hover:from-cyan-500 hover:to-blue-500 transition-all"
              >
                {currentIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
