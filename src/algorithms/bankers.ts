import { BankersInput, BankersResult, BankersStep, ResourceRequestInput, ResourceRequestResult } from './types.ts';

/**
 * Calculates the Available vector: Available[j] = Total[j] - Sum_i(Allocation[i][j])
 */
export function calculateAvailable(totalResources: number[], allocation: number[][]): number[] {
  const m = totalResources.length;
  const available = [...totalResources];
  for (let j = 0; j < m; j++) {
    let allocatedSum = 0;
    for (let i = 0; i < allocation.length; i++) {
      allocatedSum += (allocation[i][j] || 0);
    }
    available[j] = available[j] - allocatedSum;
  }
  return available;
}

/**
 * Calculates the Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export function calculateNeed(max: number[][], allocation: number[][]): number[][] {
  const n = max.length;
  const m = max[0] ? max[0].length : 0;
  const need: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      const maxVal = max[i][j] || 0;
      const allocVal = allocation[i]?.[j] || 0;
      const diff = maxVal - allocVal;
      if (diff < 0) {
        throw new Error(`Process ${i} has Allocation greater than Max for resource ${j}. Allocation cannot exceed Max.`);
      }
      row.push(diff);
    }
    need.push(row);
  }
  return need;
}

/**
 * Executes the Safety Algorithm of Banker's Algorithm
 */
export function runBankersSafety(input: BankersInput): BankersResult {
  const { resourceNames, processNames, totalResources, allocation, max } = input;
  const n = processNames.length;
  const m = resourceNames.length;

  const need = calculateNeed(max, allocation);
  const available = calculateAvailable(totalResources, allocation);

  // Validate initial availability
  for (let j = 0; j < m; j++) {
    if (available[j] < 0) {
      return {
        isSafe: false,
        needMatrix: need,
        available,
        safeSequence: [],
        safeSequenceIndices: [],
        steps: [],
        explanation: `Invalid initial state: Total allocated resources for ${resourceNames[j]} (${totalResources[j] - available[j]}) exceeds total capacity (${totalResources[j]}). Available cannot be negative (${available[j]}).`,
        unresolvedProcesses: [...processNames]
      };
    }
  }

  const work = [...available];
  const finish = new Array(n).fill(false);
  const safeSequenceIndices: number[] = [];
  const steps: BankersStep[] = [];

  let count = 0;
  let progressMade = true;
  let stepNum = 1;

  while (count < n && progressMade) {
    progressMade = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Need_i <= Work
        let canExecute = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > work[j]) {
            canExecute = false;
            break;
          }
        }

        if (canExecute) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          safeSequenceIndices.push(i);
          count++;
          progressMade = true;

          steps.push({
            stepNumber: stepNum++,
            processIndex: i,
            processName: processNames[i],
            workBefore,
            need: [...need[i]],
            canExecute: true,
            workAfter: [...work],
            finishState: [...finish],
            explanation: `Process ${processNames[i]} can execute: Need [${need[i].join(', ')}] ≤ Work [${workBefore.join(', ')}]. After completion, it releases Allocation [${allocation[i].join(', ')}]. New Work = [${work.join(', ')}].`
          });
        }
      }
    }
  }

  const isSafe = count === n;
  const unresolvedProcesses = isSafe 
    ? [] 
    : processNames.filter((_, idx) => !finish[idx]);

  const safeSequence = safeSequenceIndices.map(idx => processNames[idx]);

  const explanation = isSafe
    ? `System is in a SAFE state. Found safe sequence: <${safeSequence.join(' → ')}>. All processes can complete without deadlock.`
    : `System is in an UNSAFE state (Deadlock Risk). No safe execution sequence exists for remaining processes: [${unresolvedProcesses.join(', ')}]. Available resources [${work.join(', ')}] are insufficient for their needs.`;

  return {
    isSafe,
    needMatrix: need,
    available,
    safeSequence,
    safeSequenceIndices,
    steps,
    explanation,
    unresolvedProcesses
  };
}

/**
 * Executes the Resource Request Algorithm
 */
export function handleResourceRequest(input: ResourceRequestInput): ResourceRequestResult {
  const { resourceNames, processNames, totalResources, allocation, max, processIndex, request } = input;
  const m = resourceNames.length;
  const processName = processNames[processIndex] || `P${processIndex}`;

  const need = calculateNeed(max, allocation);
  const available = calculateAvailable(totalResources, allocation);

  // Condition 1: Request_i <= Need_i
  for (let j = 0; j < m; j++) {
    if (request[j] > need[processIndex][j]) {
      return {
        granted: false,
        reason: `Error: Process ${processName} requested ${request[j]} instances of ${resourceNames[j]}, which exceeds its declared maximum need of ${need[processIndex][j]}.`,
        isSafe: false
      };
    }
  }

  // Condition 2: Request_i <= Available
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      return {
        granted: false,
        reason: `Wait: Process ${processName} requested ${request[j]} instances of ${resourceNames[j]}, but only ${available[j]} are currently available. Process must wait.`,
        isSafe: false
      };
    }
  }

  // Pretend allocation:
  const pretendAllocation = allocation.map((row, i) => 
    i === processIndex 
      ? row.map((val, j) => val + request[j])
      : [...row]
  );

  // Run Safety Algorithm on pretend state
  const safetyCheck = runBankersSafety({
    resourceNames,
    processNames,
    totalResources,
    allocation: pretendAllocation,
    max
  });

  const updatedNeed = calculateNeed(max, pretendAllocation);
  const updatedAvailable = calculateAvailable(totalResources, pretendAllocation);

  if (safetyCheck.isSafe) {
    return {
      granted: true,
      reason: `Request Granted: Allocating [${request.join(', ')}] to ${processName} leaves system in a SAFE state with sequence <${safetyCheck.safeSequence.join(' → ')}>.`,
      isSafe: true,
      bankersResult: safetyCheck,
      updatedAvailable,
      updatedAllocation: pretendAllocation,
      updatedNeed
    };
  } else {
    return {
      granted: false,
      reason: `Request Denied: Granting request [${request.join(', ')}] to ${processName} would transition the system into an UNSAFE state. Allocation was rolled back.`,
      isSafe: false,
      bankersResult: safetyCheck
    };
  }
}
