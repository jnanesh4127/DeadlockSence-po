import { describe, it, expect } from 'vitest';
import { 
  runBankersSafety, 
  handleResourceRequest, 
  calculateAvailable, 
  calculateNeed 
} from '../src/algorithms/bankers.ts';
import { runDeadlockDetection } from '../src/algorithms/deadlockDetection.ts';
import { findDirectedCycles, analyzeRAG } from '../src/algorithms/rag.ts';
import { calculateRecoveryPlan } from '../src/algorithms/recovery.ts';
import { calculateDeadlockRisk } from '../src/algorithms/riskAssessment.ts';

describe("OS Algorithm Engine Tests", () => {
  // Classic Silberschatz Banker's Algorithm Safe Scenario
  const classicSafeInput = {
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
  };

  it("1 & 2: Banker's Algorithm identifies a Safe State and calculates correct Need and Available", () => {
    const need = calculateNeed(classicSafeInput.max, classicSafeInput.allocation);
    expect(need).toEqual([
      [7, 4, 3],
      [1, 2, 2],
      [6, 0, 0],
      [0, 1, 1],
      [4, 3, 1]
    ]);

    const available = calculateAvailable(classicSafeInput.totalResources, classicSafeInput.allocation);
    expect(available).toEqual([3, 3, 2]);

    const result = runBankersSafety(classicSafeInput);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence.length).toBe(5);
    // Sequence starts with P1 or P3
    expect(['P1', 'P3']).toContain(result.safeSequence[0]);
  });

  it("3: Banker's Algorithm correctly detects an Unsafe State", () => {
    const unsafeInput = {
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
    };
    // Available = [0, 0], Need P0 = [1, 2], Need P1 = [2, 1] -> Neither can execute!
    const result = runBankersSafety(unsafeInput);
    expect(result.isSafe).toBe(false);
    expect(result.unresolvedProcesses?.length).toBe(2);
    expect(result.safeSequence.length).toBe(0);
  });

  it("4: Resource Request Algorithm grants valid safe request", () => {
    // P1 requests [1, 0, 2]
    const result = handleResourceRequest({
      ...classicSafeInput,
      processIndex: 1,
      request: [1, 0, 2]
    });

    expect(result.granted).toBe(true);
    expect(result.isSafe).toBe(true);
    expect(result.updatedAvailable).toEqual([2, 3, 0]);
  });

  it("5: Resource Request Algorithm rejects requests exceeding Need", () => {
    // P0 declared Need is [7, 4, 3]. Requesting 5 of B exceeds Need[0][1]=4.
    const result = handleResourceRequest({
      ...classicSafeInput,
      processIndex: 0,
      request: [1, 5, 1]
    });

    expect(result.granted).toBe(false);
    expect(result.reason).toContain('exceeds its declared maximum need');
  });

  it("6: Deadlock Detection identifies deadlocked processes in multi-instance systems", () => {
    const deadlockInput = {
      resourceNames: ['R1', 'R2'],
      processNames: ['P0', 'P1', 'P2'],
      available: [0, 0],
      allocation: [
        [1, 0],
        [0, 1],
        [0, 0]
      ],
      request: [
        [0, 1], // P0 waiting for R2
        [1, 0], // P1 waiting for R1
        [0, 0]  // P2 has no request
      ]
    };

    const detection = runDeadlockDetection(deadlockInput);
    expect(detection.isDeadlocked).toBe(true);
    expect(detection.deadlockedProcesses).toContain('P0');
    expect(detection.deadlockedProcesses).toContain('P1');
    expect(detection.deadlockedProcesses).not.toContain('P2');
  });

  it("7: DFS Cycle Detection extracts directed cycles accurately", () => {
    const adj = new Map<string, string[]>();
    adj.set('A', ['B']);
    adj.set('B', ['C']);
    adj.set('C', ['A', 'D']);
    adj.set('D', []);

    const cycles = findDirectedCycles(adj);
    expect(cycles.length).toBe(1);
    expect(cycles[0]).toContain('A');
    expect(cycles[0]).toContain('B');
    expect(cycles[0]).toContain('C');
  });

  it("8: RAG Analysis distinguishes single-instance cycles (deadlock) from multi-instance", () => {
    // Single-instance with cycle
    const singleInstanceRAG = {
      nodes: [
        { id: 'P0', label: 'P0', type: 'process' as const },
        { id: 'P1', label: 'P1', type: 'process' as const },
        { id: 'R1', label: 'R1', type: 'resource' as const, instances: 1 },
        { id: 'R2', label: 'R2', type: 'resource' as const, instances: 1 }
      ],
      edges: [
        { id: 'e1', from: 'P0', to: 'R1', type: 'request' as const },
        { id: 'e2', from: 'R1', to: 'P1', type: 'assignment' as const },
        { id: 'e3', from: 'P1', to: 'R2', type: 'request' as const },
        { id: 'e4', from: 'R2', to: 'P0', type: 'assignment' as const }
      ]
    };

    const result = analyzeRAG(singleInstanceRAG);
    expect(result.hasCycle).toBe(true);
    expect(result.isSingleInstanceOnly).toBe(true);
    expect(result.isDeadlocked).toBe(true);
    expect(result.wfgEdges?.length).toBe(2);
  });

  it("9: Deadlock Recovery evaluates optimal victim process and calculates recovery state", () => {
    const recoveryPlan = calculateRecoveryPlan({
      ...classicSafeInput,
      deadlockedIndices: [0, 1]
    }, 'termination');

    expect(recoveryPlan.recommendedVictims.length).toBe(2);
    expect(recoveryPlan.simulatedStateAfterRecovery).toBeDefined();
    expect(recoveryPlan.explanation).toContain('Terminating process');
  });

  it("10: Deadlock Risk Assessment computes metric bottlenecks and health recommendations", () => {
    const risk = calculateDeadlockRisk(classicSafeInput);
    expect(risk.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(risk.overallRiskScore).toBeLessThanOrEqual(100);
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(risk.riskLevel);
    expect(risk.recommendations.length).toBeGreaterThan(0);
  });
});
