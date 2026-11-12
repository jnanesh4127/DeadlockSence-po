import { DeadlockDetectionInput, DeadlockDetectionResult, DeadlockDetectionStep } from './types.ts';

/**
 * Standard OS Deadlock Detection Algorithm for Multiple-Instance Resources
 * Reference: Silberschatz, Galvin, Gagne - Operating System Concepts
 * 1. Let Work and Finish be vectors of length m and n respectively.
 *    Initialize Work = Available
 *    For i = 0,1,...,n-1:
 *      if Allocation_i != 0, then Finish[i] = false;
 *      else Finish[i] = true;
 * 2. Find an index i such that:
 *    a) Finish[i] == false
 *    b) Request_i <= Work
 *    If no such i exists, go to step 4.
 * 3. Work = Work + Allocation_i
 *    Finish[i] = true
 *    go to step 2.
 * 4. If Finish[i] == false, for some i, 0 <= i < n, then the system is in deadlock.
 *    Moreover, if Finish[i] == false, then process P_i is deadlocked.
 */
export function runDeadlockDetection(input: DeadlockDetectionInput): DeadlockDetectionResult {
  const { resourceNames, processNames, available, allocation, request } = input;
  const n = processNames.length;
  const m = resourceNames.length;

  const work = [...available];
  const finish = new Array(n).fill(false);
  const steps: DeadlockDetectionStep[] = [];
  const workHistory: number[][] = [[...work]];

  // Step 1: Initialize Finish
  for (let i = 0; i < n; i++) {
    let hasAllocation = false;
    for (let j = 0; j < m; j++) {
      if ((allocation[i]?.[j] || 0) > 0) {
        hasAllocation = true;
        break;
      }
    }
    // If a process holds no resources, it cannot be part of a deadlock cycle
    if (!hasAllocation) {
      finish[i] = true;
    }
  }

  let progressMade = true;
  let stepNum = 1;

  // Step 2 & 3: Iterate until no unmarked process can be satisfied
  while (progressMade) {
    progressMade = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Request_i <= Work
        let canSatisfy = true;
        for (let j = 0; j < m; j++) {
          const reqVal = request[i]?.[j] || 0;
          if (reqVal > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        if (canSatisfy) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += (allocation[i]?.[j] || 0);
          }
          finish[i] = true;
          progressMade = true;
          workHistory.push([...work]);

          steps.push({
            stepNumber: stepNum++,
            processIndex: i,
            processName: processNames[i],
            workBefore,
            request: [...(request[i] || [])],
            satisfied: true,
            workAfter: [...work],
            finishState: [...finish],
            explanation: `Process ${processNames[i]} request [${(request[i] || []).join(', ')}] can be satisfied with current Work [${workBefore.join(', ')}]. Process finishes and releases [${(allocation[i] || []).join(', ')}]. New Work = [${work.join(', ')}].`
          });
        }
      }
    }
  }

  // Step 4: Any process with finish[i] == false is deadlocked
  const deadlockedIndices: number[] = [];
  const deadlockedProcesses: string[] = [];

  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      deadlockedIndices.push(i);
      deadlockedProcesses.push(processNames[i]);
    }
  }

  const isDeadlocked = deadlockedProcesses.length > 0;
  const summary = isDeadlocked
    ? `DEADLOCK CONFIRMED: ${deadlockedProcesses.length} process(es) [${deadlockedProcesses.join(', ')}] are in deadlock. Available resources [${work.join(', ')}] are insufficient to satisfy their pending requests.`
    : `NO DEADLOCK DETECTED: All processes can either proceed or have no outstanding resource requests. The system is operating normally.`;

  return {
    isDeadlocked,
    deadlockedProcesses,
    deadlockedIndices,
    steps,
    workHistory,
    summary
  };
}
