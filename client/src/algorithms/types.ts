export interface BankersInput {
  resourceNames: string[];
  processNames: string[];
  totalResources: number[];
  allocation: number[][]; // [processIndex][resourceIndex]
  max: number[][];        // [processIndex][resourceIndex]
}

export interface BankersStep {
  stepNumber: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  need: number[];
  canExecute: boolean;
  workAfter: number[];
  finishState: boolean[];
  explanation: string;
}

export interface BankersResult {
  isSafe: boolean;
  needMatrix: number[][];
  available: number[];
  safeSequence: string[];
  safeSequenceIndices: number[];
  steps: BankersStep[];
  explanation: string;
  unresolvedProcesses?: string[];
}

export interface ResourceRequestInput extends BankersInput {
  processIndex: number;
  request: number[];
}

export interface ResourceRequestResult {
  granted: boolean;
  reason: string;
  isSafe: boolean;
  bankersResult?: BankersResult;
  updatedAvailable?: number[];
  updatedAllocation?: number[][];
  updatedNeed?: number[][];
}

export interface DeadlockDetectionInput {
  resourceNames: string[];
  processNames: string[];
  available: number[];
  allocation: number[][];
  request: number[][]; // Current pending requests
}

export interface DeadlockDetectionStep {
  stepNumber: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  request: number[];
  satisfied: boolean;
  workAfter: number[];
  finishState: boolean[];
  explanation: string;
}

export interface DeadlockDetectionResult {
  isDeadlocked: boolean;
  deadlockedProcesses: string[];
  deadlockedIndices: number[];
  steps: DeadlockDetectionStep[];
  workHistory: number[][];
  summary: string;
}

export interface RAGNode {
  id: string;
  label: string;
  type: 'process' | 'resource';
  instances?: number; // For resources
  availableInstances?: number;
}

export interface RAGEdge {
  id: string;
  from: string; // id
  to: string;   // id
  type: 'assignment' | 'request'; // assignment: R -> P, request: P -> R
  count?: number;
}

export interface RAGAnalysisInput {
  nodes: RAGNode[];
  edges: RAGEdge[];
}

export interface RAGAnalysisResult {
  hasCycle: boolean;
  cycles: string[][]; // Array of node id paths
  isDeadlocked: boolean;
  isSingleInstanceOnly: boolean;
  reasoning: string;
  wfgNodes?: { id: string; label: string }[];
  wfgEdges?: { from: string; to: string }[];
}

export interface RecoveryVictimOption {
  processId: string;
  processName: string;
  cost: number;
  resourcesHeld: { [resourceName: string]: number };
  rationale: string;
}

export interface RecoveryPlanResult {
  method: 'termination' | 'preemption';
  recommendedVictims: RecoveryVictimOption[];
  simulatedStateAfterRecovery: {
    freedResources: { [resourceName: string]: number };
    newAvailable: number[];
    isSafeNow: boolean;
  };
  explanation: string;
}

export interface DeadlockRiskResult {
  overallRiskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  metrics: {
    utilizationPercent: { [resource: string]: number };
    contentionRate: { [resource: string]: number };
    headroomRatio: number; // available vs average need
    cycleRisk: boolean;
  };
  bottlenecks: string[];
  recommendations: string[];
}
