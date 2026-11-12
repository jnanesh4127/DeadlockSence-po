import { RAGAnalysisInput, RAGAnalysisResult, RAGEdge, RAGNode } from './types.ts';
import { runDeadlockDetection } from './deadlockDetection.ts';

/**
 * Depth-First Search to find cycles in a directed graph
 */
export function findDirectedCycles(adj: Map<string, string[]>): string[][] {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const currentPath: string[] = [];

  function dfs(node: string) {
    visited.add(node);
    recStack.add(node);
    currentPath.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStartIndex = currentPath.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycle = currentPath.slice(cycleStartIndex).concat(neighbor);
          // Check if this cycle is already discovered (normalize cycle rotation)
          const normalized = normalizeCycle(cycle);
          const isDuplicate = cycles.some(c => cyclesEqual(normalizeCycle(c), normalized));
          if (!isDuplicate) {
            cycles.push(cycle);
          }
        }
      }
    }

    currentPath.pop();
    recStack.delete(node);
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

function normalizeCycle(cycle: string[]): string[] {
  // A cycle ends with the same node as it begins: [A, B, C, A]
  const nodes = cycle.slice(0, cycle.length - 1);
  if (nodes.length === 0) return cycle;
  let minIdx = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i] < nodes[minIdx]) {
      minIdx = i;
    }
  }
  const rotated = [...nodes.slice(minIdx), ...nodes.slice(0, minIdx)];
  return [...rotated, rotated[0]];
}

function cyclesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Analyzes a Resource Allocation Graph (RAG)
 * 1. Checks if all resources are single-instance
 * 2. Builds Wait-For Graph (WFG) if single-instance
 * 3. Detects graph cycles
 * 4. In multiple-instance case, runs Deadlock Detection algorithm to verify if the cycle actually deadlocks
 */
export function analyzeRAG(input: RAGAnalysisInput): RAGAnalysisResult {
  const { nodes, edges } = input;
  const processNodes = nodes.filter(n => n.type === 'process');
  const resourceNodes = nodes.filter(n => n.type === 'resource');

  // Check if all resources are single-instance
  const isSingleInstanceOnly = resourceNodes.every(r => (r.instances ?? 1) === 1);

  // Build Adjacency List for RAG
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }

  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from)!.push(edge.to);
  }

  // Detect cycles in RAG
  const ragCycles = findDirectedCycles(adj);

  // Generate Wait-For Graph (WFG) for processes
  // In WFG, edge Pi -> Pj exists if Pi requests Rk and Rk is assigned to Pj
  const wfgNodes = processNodes.map(p => ({ id: p.id, label: p.label }));
  const wfgEdges: { from: string; to: string }[] = [];
  const wfgAdj = new Map<string, string[]>();
  for (const p of processNodes) {
    wfgAdj.set(p.id, []);
  }

  for (const p of processNodes) {
    // Find all resources requested by p: edge p -> r
    const requestEdges = edges.filter(e => e.from === p.id);
    for (const reqEdge of requestEdges) {
      const resourceId = reqEdge.to;
      // Find who holds resourceId: edge resourceId -> otherP
      const assignmentEdges = edges.filter(e => e.from === resourceId);
      for (const assignEdge of assignmentEdges) {
        const holderId = assignEdge.to;
        if (holderId !== p.id) {
          // Add WFG edge p -> holder
          if (!wfgAdj.get(p.id)!.includes(holderId)) {
            wfgAdj.get(p.id)!.push(holderId);
            wfgEdges.push({ from: p.id, to: holderId });
          }
        }
      }
    }
  }

  const wfgCycles = findDirectedCycles(wfgAdj);

  // Determine Deadlock Status
  let isDeadlocked = false;
  let reasoning = '';

  if (isSingleInstanceOnly) {
    // For single-instance resources, a cycle in the RAG / WFG is NECESSARY AND SUFFICIENT for deadlock!
    if (ragCycles.length > 0) {
      isDeadlocked = true;
      reasoning = `Single-instance resource system: Found ${ragCycles.length} cycle(s). In single-instance resource systems, a cycle is a NECESSARY and SUFFICIENT condition for deadlock. Deadlock is confirmed on cycle(s): ${ragCycles.map(c => c.join(' → ')).join('; ')}.`;
    } else {
      isDeadlocked = false;
      reasoning = `Single-instance resource system: No cycles detected in the Resource Allocation Graph. The system is provably deadlock-free.`;
    }
  } else {
    // Multiple-instance resource system:
    // A cycle is a NECESSARY condition, but NOT a sufficient condition!
    // We construct the Allocation, Request, and Available vectors to run the detection algorithm.
    const procMap = new Map(processNodes.map((p, i) => [p.id, i]));
    const resMap = new Map(resourceNodes.map((r, j) => [r.id, j]));

    const n = processNodes.length;
    const m = resourceNodes.length;
    const allocation: number[][] = Array.from({ length: n }, () => Array(m).fill(0));
    const request: number[][] = Array.from({ length: n }, () => Array(m).fill(0));
    const total: number[] = resourceNodes.map(r => r.instances ?? 1);

    for (const e of edges) {
      if (resMap.has(e.from) && procMap.has(e.to)) {
        // Assignment edge R -> P
        const rIdx = resMap.get(e.from)!;
        const pIdx = procMap.get(e.to)!;
        allocation[pIdx][rIdx] += (e.count || 1);
      } else if (procMap.has(e.from) && resMap.has(e.to)) {
        // Request edge P -> R
        const pIdx = procMap.get(e.from)!;
        const rIdx = resMap.get(e.to)!;
        request[pIdx][rIdx] += (e.count || 1);
      }
    }

    const available: number[] = [...total];
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += allocation[i][j];
      }
      available[j] -= sum;
    }

    const detection = runDeadlockDetection({
      resourceNames: resourceNodes.map(r => r.label),
      processNames: processNodes.map(p => p.label),
      available,
      allocation,
      request
    });

    isDeadlocked = detection.isDeadlocked;

    if (ragCycles.length > 0) {
      if (isDeadlocked) {
        reasoning = `Multiple-instance system: Cycle detected AND deadlock confirmed! Although a cycle in a multi-instance system is not always a deadlock, the detection algorithm confirmed that deadlocked processes [${detection.deadlockedProcesses.join(', ')}] cannot be satisfied.`;
      } else {
        reasoning = `Multiple-instance system: Cycle detected, BUT NO DEADLOCK! In a multiple-instance system, a cycle is NOT a sufficient condition for deadlock. External processes holding resource instances can complete and release instances, breaking the wait condition.`;
      }
    } else {
      isDeadlocked = false;
      reasoning = `Multiple-instance system: No cycles found in the Resource Allocation Graph. The system is free from deadlock.`;
    }
  }

  return {
    hasCycle: ragCycles.length > 0,
    cycles: ragCycles,
    isDeadlocked,
    isSingleInstanceOnly,
    reasoning,
    wfgNodes,
    wfgEdges
  };
}
