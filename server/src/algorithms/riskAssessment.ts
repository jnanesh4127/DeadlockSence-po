import type { BankersInput, DeadlockRiskResult } from './types.ts';
import { calculateAvailable, calculateNeed, runBankersSafety } from './bankers.ts';

export function calculateDeadlockRisk(input: BankersInput): DeadlockRiskResult {
  const { resourceNames, processNames, totalResources, allocation, max } = input;
  const n = processNames.length;
  const m = resourceNames.length;

  const available = calculateAvailable(totalResources, allocation);
  const need = calculateNeed(max, allocation);
  const safety = runBankersSafety(input);

  const utilizationPercent: { [resource: string]: number } = {};
  const contentionRate: { [resource: string]: number } = {};
  const bottlenecks: string[] = [];
  const recommendations: string[] = [];

  let totalAllocatedInstances = 0;
  let totalCapacity = 0;
  let highUtilizationCount = 0;

  for (let j = 0; j < m; j++) {
    const res = resourceNames[j];
    const total = totalResources[j];
    const avail = available[j];
    const alloc = total - avail;

    totalAllocatedInstances += alloc;
    totalCapacity += total;

    const util = total > 0 ? (alloc / total) * 100 : 0;
    utilizationPercent[res] = Math.round(util);

    // Contention: Total need across all processes vs available
    let totalNeedForRes = 0;
    for (let i = 0; i < n; i++) {
      totalNeedForRes += need[i][j];
    }

    const contention = avail > 0 ? (totalNeedForRes / avail) : (totalNeedForRes > 0 ? 10 : 0);
    contentionRate[res] = parseFloat(contention.toFixed(2));

    if (util >= 85) {
      bottlenecks.push(`Resource '${res}' is heavily utilized (${Math.round(util)}% allocated).`);
      highUtilizationCount++;
    }

    if (contention > 3.0) {
      bottlenecks.push(`Severe contention on '${res}': outstanding need is ${contention.toFixed(1)}x currently available.`);
    }
  }

  // Headroom ratio: Average available vs average need
  let avgAvail = available.reduce((a, b) => a + b, 0) / (m || 1);
  let totalNeedAll = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      totalNeedAll += need[i][j];
    }
  }
  const avgNeedPerProcess = totalNeedAll / ((n || 1) * (m || 1));
  const headroomRatio = avgNeedPerProcess > 0 ? parseFloat((avgAvail / avgNeedPerProcess).toFixed(2)) : 1.0;

  // Base score calculation
  let riskScore = 0;

  if (!safety.isSafe) {
    riskScore += 65; // High initial risk for unsafe state
  }

  // Add utilization factor (up to 20 pts)
  const avgUtil = totalCapacity > 0 ? (totalAllocatedInstances / totalCapacity) * 100 : 0;
  riskScore += (avgUtil / 100) * 20;

  // Add bottleneck count factor
  riskScore += Math.min(15, highUtilizationCount * 5);

  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';

  // Generate actionable recommendations
  if (!safety.isSafe) {
    recommendations.push("System is currently in an UNSAFE state. Avoid approving new resource requests until running processes release resources.");
    recommendations.push("Consider terminating or preempting resources from victim processes identified by the recovery engine.");
  } else {
    recommendations.push(`System is currently in a SAFE state with safe sequence: <${safety.safeSequence.join(' → ')}>.`);
  }

  if (bottlenecks.length > 0) {
    recommendations.push("Consider increasing capacity of highly contended resources to avoid pipeline stalls.");
  } else {
    recommendations.push("Resource headroom is adequate. Regular Banker's checks are sufficient.");
  }

  return {
    overallRiskScore: riskScore,
    riskLevel,
    metrics: {
      utilizationPercent,
      contentionRate,
      headroomRatio,
      cycleRisk: !safety.isSafe
    },
    bottlenecks,
    recommendations
  };
}
