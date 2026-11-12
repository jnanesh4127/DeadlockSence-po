import { BankersInput, RecoveryPlanResult, RecoveryVictimOption } from './types.ts';
import { calculateAvailable, runBankersSafety } from './bankers.ts';

export interface RecoveryInput extends BankersInput {
  deadlockedIndices: number[];
  processPriorities?: number[]; // Optional priority (higher = more important)
  processCpuTimes?: number[];   // Optional runtime in seconds (more time = higher abort cost)
}

/**
 * Calculates recovery strategies for deadlocked processes
 */
export function calculateRecoveryPlan(input: RecoveryInput, strategy: 'termination' | 'preemption' = 'termination'): RecoveryPlanResult {
  const { resourceNames, processNames, totalResources, allocation, max, deadlockedIndices } = input;
  const n = processNames.length;
  const m = resourceNames.length;

  if (deadlockedIndices.length === 0) {
    const available = calculateAvailable(totalResources, allocation);
    return {
      method: strategy,
      recommendedVictims: [],
      simulatedStateAfterRecovery: {
        freedResources: {},
        newAvailable: available,
        isSafeNow: true
      },
      explanation: 'No recovery needed: System has no deadlocked processes.'
    };
  }

  // Cost calculation for candidate victims among deadlocked processes
  // Lower cost = better victim to terminate
  const victimOptions: RecoveryVictimOption[] = deadlockedIndices.map(idx => {
    const pName = processNames[idx];
    const priority = input.processPriorities?.[idx] ?? 5; // default 5 out of 10
    const cpuTime = input.processCpuTimes?.[idx] ?? 10;   // default 10s
    
    // Resources held
    let totalHeld = 0;
    const resourcesHeld: { [res: string]: number } = {};
    for (let j = 0; j < m; j++) {
      const held = allocation[idx]?.[j] || 0;
      resourcesHeld[resourceNames[j]] = held;
      totalHeld += held;
    }

    // Cost formula: Higher priority & higher CPU time = higher cost. Higher resources held = lower relative cost (more bang for buck!)
    // Cost = (priority * 20) + (cpuTime * 2) - (totalHeld * 15)
    const cost = Math.max(1, (priority * 20) + (cpuTime * 2) - (totalHeld * 15));

    return {
      processId: `P${idx}`,
      processName: pName,
      cost,
      resourcesHeld,
      rationale: `Holds ${totalHeld} total resource instances. Priority: ${priority}/10, Runtime: ${cpuTime}s. Cost score: ${cost}.`
    };
  });

  // Sort victims by lowest cost
  victimOptions.sort((a, b) => a.cost - b.cost);

  // Simulate recovery by terminating the best victim (or preempting its resources)
  const bestVictim = victimOptions[0];
  const victimIdx = processNames.indexOf(bestVictim.processName);

  // New simulated allocation where victimIdx releases all allocated resources
  const simulatedAllocation = allocation.map((row, i) =>
    i === victimIdx ? new Array(m).fill(0) : [...row]
  );

  const newAvailable = calculateAvailable(totalResources, simulatedAllocation);

  // Check if system is safe after victim termination
  const remainingSafety = runBankersSafety({
    resourceNames,
    processNames,
    totalResources,
    allocation: simulatedAllocation,
    max
  });

  const freedResources: { [resourceName: string]: number } = {};
  for (let j = 0; j < m; j++) {
    freedResources[resourceNames[j]] = allocation[victimIdx]?.[j] || 0;
  }

  const actionVerb = strategy === 'termination' ? 'Terminating process' : 'Preempting resources from';
  const explanation = `${actionVerb} ${bestVictim.processName} frees [${Object.entries(freedResources).map(([k, v]) => `${k}:${v}`).join(', ')}]. System safety after recovery: ${remainingSafety.isSafe ? 'SAFE (Safe Sequence: ' + remainingSafety.safeSequence.join(' → ') + ')' : 'UNSAFE (Further terminations may be required).'}`;

  return {
    method: strategy,
    recommendedVictims: victimOptions,
    simulatedStateAfterRecovery: {
      freedResources,
      newAvailable,
      isSafeNow: remainingSafety.isSafe
    },
    explanation
  };
}
