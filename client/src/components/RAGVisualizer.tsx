import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Play, 
  RotateCcw, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { apiService } from '../services/api.ts';
import { RAGNode, RAGEdge, RAGAnalysisResult } from '../algorithms/types.ts';
import { useAuth } from '../context/AuthContext.tsx';

// Preset Scenarios
const RAG_PRESETS = {
  singleInstanceDeadlock: {
    title: "Single-Instance Deadlock Cycle (P0, P1, P2)",
    nodes: [
      { id: 'P0', label: 'P0', type: 'process' as const },
      { id: 'P1', label: 'P1', type: 'process' as const },
      { id: 'P2', label: 'P2', type: 'process' as const },
      { id: 'R1', label: 'R1', type: 'resource' as const, instances: 1 },
      { id: 'R2', label: 'R2', type: 'resource' as const, instances: 1 },
      { id: 'R3', label: 'R3', type: 'resource' as const, instances: 1 }
    ],
    edges: [
      { id: 'e1', from: 'R1', to: 'P0', type: 'assignment' as const },
      { id: 'e2', from: 'P0', to: 'R2', type: 'request' as const },
      { id: 'e3', from: 'R2', to: 'P1', type: 'assignment' as const },
      { id: 'e4', from: 'P1', to: 'R3', type: 'request' as const },
      { id: 'e5', from: 'R3', to: 'P2', type: 'assignment' as const },
      { id: 'e6', from: 'P2', to: 'R1', type: 'request' as const },
    ]
  },
  multiInstanceWithCycleNoDeadlock: {
    title: "Multi-Instance Cycle WITHOUT Deadlock",
    nodes: [
      { id: 'P1', label: 'P1', type: 'process' as const },
      { id: 'P2', label: 'P2', type: 'process' as const },
      { id: 'P3', label: 'P3', type: 'process' as const },
      { id: 'P4', label: 'P4', type: 'process' as const },
      { id: 'R1', label: 'R1', type: 'resource' as const, instances: 2 },
      { id: 'R2', label: 'R2', type: 'resource' as const, instances: 2 }
    ],
    edges: [
      { id: 'e1', from: 'P1', to: 'R1', type: 'request' as const },
      { id: 'e2', from: 'R1', to: 'P2', type: 'assignment' as const },
      { id: 'e3', from: 'R1', to: 'P3', type: 'assignment' as const },
      { id: 'e4', from: 'P3', to: 'R2', type: 'request' as const },
      { id: 'e5', from: 'R2', to: 'P1', type: 'assignment' as const },
      { id: 'e6', from: 'R2', to: 'P4', type: 'assignment' as const },
    ]
  },
  diningPhilosophers: {
    title: "Dining Philosophers Resource Graph (5 Philosophers, 5 Forks)",
    nodes: [
      { id: 'P0', label: 'Phil 0', type: 'process' as const },
      { id: 'P1', label: 'Phil 1', type: 'process' as const },
      { id: 'P2', label: 'Phil 2', type: 'process' as const },
      { id: 'R0', label: 'Fork 0', type: 'resource' as const, instances: 1 },
      { id: 'R1', label: 'Fork 1', type: 'resource' as const, instances: 1 },
      { id: 'R2', label: 'Fork 2', type: 'resource' as const, instances: 1 }
    ],
    edges: [
      { id: 'e1', from: 'R0', to: 'P0', type: 'assignment' as const },
      { id: 'e2', from: 'P0', to: 'R1', type: 'request' as const },
      { id: 'e3', from: 'R1', to: 'P1', type: 'assignment' as const },
      { id: 'e4', from: 'P1', to: 'R2', type: 'request' as const },
      { id: 'e5', from: 'R2', to: 'P2', type: 'assignment' as const },
      { id: 'e6', from: 'P2', to: 'R0', type: 'request' as const },
    ]
  }
};

export const RAGVisualizer: React.FC = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<RAGNode[]>(RAG_PRESETS.singleInstanceDeadlock.nodes);
  const [edges, setEdges] = useState<RAGEdge[]>(RAG_PRESETS.singleInstanceDeadlock.edges);
  const [analysis, setAnalysis] = useState<RAGAnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<'rag' | 'wfg'>('rag');
  const [analyzing, setAnalyzing] = useState(false);

  // New Edge form state
  const [newEdgeFrom, setNewEdgeFrom] = useState('');
  const [newEdgeTo, setNewEdgeTo] = useState('');
  const [newEdgeType, setNewEdgeType] = useState<'assignment' | 'request'>('request');

  useEffect(() => {
    if (user?.email) {
      runAnalysis();
    }
  }, [nodes, edges, user?.email]);

  const runAnalysis = async () => {
    if (!user?.email) return;
    setAnalyzing(true);
    try {
      const res = await apiService.analyzeRAG({ nodes, edges });
      setAnalysis(res);
    } catch (e: any) {
      console.warn("RAG analysis warning:", e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPreset = (presetKey: keyof typeof RAG_PRESETS) => {
    const p = RAG_PRESETS[presetKey];
    setNodes(p.nodes.map(n => ({ ...n })));
    setEdges(p.edges.map(e => ({ ...e })));
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo) return;

    const fromNode = nodes.find(n => n.id === newEdgeFrom);
    const toNode = nodes.find(n => n.id === newEdgeTo);

    if (!fromNode || !toNode) return;

    // Assignment must be Resource -> Process
    // Request must be Process -> Resource
    let inferredType: 'assignment' | 'request' = 'request';
    if (fromNode.type === 'resource' && toNode.type === 'process') {
      inferredType = 'assignment';
    } else if (fromNode.type === 'process' && toNode.type === 'resource') {
      inferredType = 'request';
    } else {
      // In RAG, direct Process->Process or Resource->Resource edges are invalid
      alert("In a Resource Allocation Graph: Request edges are Process → Resource; Assignment edges are Resource → Process.");
      return;
    }

    const newEdge: RAGEdge = {
      id: `edge_${Date.now()}`,
      from: newEdgeFrom,
      to: newEdgeTo,
      type: inferredType
    };

    setEdges([...edges, newEdge]);
    setNewEdgeFrom('');
    setNewEdgeTo('');
  };

  const removeEdge = (edgeId: string) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  };

  // Node position layout calculation (circle for SVG)
  const getNodePosition = (nodeId: string, index: number, total: number) => {
    const centerX = 300;
    const centerY = 240;
    const radius = 170;
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, idx) => {
    nodePositions.set(n.id, getNodePosition(n.id, idx, nodes.length));
  });

  // Check if an edge is part of a detected cycle
  const isEdgeInCycle = (from: string, to: string) => {
    if (!analysis || !analysis.hasCycle) return false;
    return analysis.cycles.some(cycle => {
      for (let i = 0; i < cycle.length - 1; i++) {
        if (cycle[i] === from && cycle[i + 1] === to) return true;
      }
      return false;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Presets */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Network className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">Resource Allocation Graph (RAG) &amp; Wait-For Graph (WFG)</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Interactive directed graph visualizer, cycle detection via DFS, and Wait-For Graph reduction
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Presets:</span>
          <button
            onClick={() => loadPreset('singleInstanceDeadlock')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Single-Instance Deadlock
          </button>
          <button
            onClick={() => loadPreset('multiInstanceWithCycleNoDeadlock')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
          >
            Multi-Instance Cycle (No Deadlock)
          </button>
          <button
            onClick={() => loadPreset('diningPhilosophers')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
          >
            Dining Philosophers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Interactive Graph SVG Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            {/* Graph Header / View Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('rag')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'rag'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Resource Allocation Graph (RAG)
                </button>
                <button
                  onClick={() => setViewMode('wfg')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'wfg'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Wait-For Graph (WFG)
                </button>
              </div>

              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Play className="h-3 w-3 text-cyan-400 fill-cyan-400" />
                Analyze Graph
              </button>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-4 min-h-[460px]">
              <svg width="600" height="480" className="max-w-full">
                <defs>
                  {/* Arrow markers */}
                  <marker
                    id="arrow-assignment"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                  </marker>
                  <marker
                    id="arrow-request"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                  <marker
                    id="arrow-cycle"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                  <marker
                    id="arrow-wfg"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                  </marker>
                </defs>

                {/* Draw Edges */}
                {viewMode === 'rag' ? (
                  edges.map((e) => {
                    const fromPos = nodePositions.get(e.from);
                    const toPos = nodePositions.get(e.to);
                    if (!fromPos || !toPos) return null;

                    const inCycle = isEdgeInCycle(e.from, e.to);
                    const strokeColor = inCycle 
                      ? '#ef4444' 
                      : (e.type === 'assignment' ? '#06b6d4' : '#f59e0b');
                    const marker = inCycle 
                      ? 'url(#arrow-cycle)' 
                      : (e.type === 'assignment' ? 'url(#arrow-assignment)' : 'url(#arrow-request)');

                    return (
                      <g key={e.id}>
                        <line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={strokeColor}
                          strokeWidth={inCycle ? 2.5 : 1.75}
                          strokeDasharray={e.type === 'request' ? '4 3' : 'none'}
                          markerEnd={marker}
                          className={inCycle ? 'animate-pulse' : ''}
                        />
                      </g>
                    );
                  })
                ) : (
                  // WFG Edges
                  analysis?.wfgEdges?.map((we, i) => {
                    const fromPos = nodePositions.get(we.from);
                    const toPos = nodePositions.get(we.to);
                    if (!fromPos || !toPos) return null;

                    return (
                      <line
                        key={`wfg-${i}`}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        markerEnd="url(#arrow-wfg)"
                      />
                    );
                  })
                )}

                {/* Draw Nodes */}
                {nodes.map((node) => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;

                  // In WFG, hide resource nodes
                  if (viewMode === 'wfg' && node.type === 'resource') return null;

                  if (node.type === 'process') {
                    // Process: Circle
                    return (
                      <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle
                          r="22"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          className="transition-transform hover:scale-110"
                        />
                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fill="#f8fafc"
                          fontSize="12"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  } else {
                    // Resource: Rectangle with dot instances
                    const instances = node.instances || 1;
                    return (
                      <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                        <rect
                          x="-22"
                          y="-22"
                          width="44"
                          height="44"
                          rx="6"
                          fill="#1e1b4b"
                          stroke="#818cf8"
                          strokeWidth="2"
                        />
                        <text
                          textAnchor="middle"
                          dy="-8"
                          fill="#c7d2fe"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {node.label}
                        </text>
                        {/* Instance count dots */}
                        <g transform="translate(0, 8)">
                          {Array.from({ length: Math.min(instances, 4) }).map((_, dotIdx) => (
                            <circle
                              key={dotIdx}
                              cx={(dotIdx - (Math.min(instances, 4) - 1) / 2) * 8}
                              cy="0"
                              r="2.5"
                              fill="#38bdf8"
                            />
                          ))}
                        </g>
                      </g>
                    );
                  }
                })}
              </svg>

              {/* Canvas Legend */}
              <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-sky-400 bg-slate-900 inline-block" />
                  Process Node
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-indigo-400 bg-indigo-950 inline-block" />
                  Resource Node
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-cyan-400 inline-block" />
                  Assignment (R → P)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-b border-dashed border-amber-400 inline-block" />
                  Request (P → R)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-red-500 inline-block" />
                  Cycle Edge
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Graph Analysis Verdict & Edge Editor */}
        <div className="space-y-6">
          {/* Analysis Verdict */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Graph Analysis Verdict
            </h3>

            {analysis ? (
              <div className={`rounded-xl border p-4 ${
                analysis.isDeadlocked
                  ? 'border-red-800/80 bg-red-950/40 text-red-200'
                  : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  {analysis.isDeadlocked ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span>Deadlock Confirmed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>No Deadlock</span>
                    </>
                  )}
                </div>

                <div className="space-y-2 mt-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                    <span>Graph Cycles:</span>
                    <span className="font-mono font-bold">
                      {analysis.hasCycle ? `${analysis.cycles.length} Cycle(s) Found` : 'No Cycles'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                    <span>Resource Model:</span>
                    <span className="font-mono font-bold">
                      {analysis.isSingleInstanceOnly ? 'Single-Instance Only' : 'Multiple-Instance'}
                    </span>
                  </div>

                  {analysis.hasCycle && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold opacity-90">Cycle Path(s):</span>
                      {analysis.cycles.map((c, i) => (
                        <div key={i} className="font-mono text-[11px] bg-slate-950/70 p-1.5 rounded border border-slate-800/50">
                          {c.join(' → ')}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 leading-relaxed opacity-90 text-[11px] border-t border-slate-800/60 pt-2">
                    {analysis.reasoning}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Educational Insight Callout */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 text-xs text-blue-300">
              <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <span>
                <strong>Operating System Invariant:</strong> In single-instance systems, a cycle is a necessary and sufficient condition for deadlock. In multi-instance systems, a cycle is necessary but NOT sufficient, because processes outside the cycle may release instances.
              </span>
            </div>
          </div>

          {/* Add Edge & Manage Edges */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Add Graph Edge
            </h3>

            <form onSubmit={handleAddEdge} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">From Node</label>
                  <select
                    value={newEdgeFrom}
                    onChange={(e) => setNewEdgeFrom(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {nodes.map(n => (
                      <option key={`from-${n.id}`} value={n.id}>
                        {n.label} ({n.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">To Node</label>
                  <select
                    value={newEdgeTo}
                    onChange={(e) => setNewEdgeTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {nodes.map(n => (
                      <option key={`to-${n.id}`} value={n.id}>
                        {n.label} ({n.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-cyan-400" />
                Add Edge
              </button>
            </form>

            {/* Edge list */}
            <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <span className="text-[11px] text-slate-500 block">Existing Edges ({edges.length}):</span>
              {edges.map(e => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white">{e.from}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="text-white">{e.to}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                      e.type === 'assignment' ? 'text-cyan-400 bg-cyan-950/60' : 'text-amber-400 bg-amber-950/60'
                    }`}>
                      {e.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeEdge(e.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
