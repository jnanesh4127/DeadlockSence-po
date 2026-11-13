import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Save, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Compass,
  Info,
  BookOpen,
  Shuffle,
  BarChart3,
  Download,
  Upload,
  Undo2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { apiService } from '../services/api.ts';
import type { BankersInput, BankersResult, ResourceRequestResult } from '../algorithms/types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { BankersTour } from './BankersTour.tsx';
import { TutorialModal } from './TutorialModal.tsx';

// Preset configurations
const PRESETS = {
  classicSafe: {
    title: "Classic Safe State (Silberschatz)",
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
  },
  unsafeState: {
    title: "Unsafe Deadlock Vulnerability",
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
  },
  fourResources: {
    title: "4-Resource System (A, B, C, D)",
    resourceNames: ['A', 'B', 'C', 'D'],
    processNames: ['P0', 'P1', 'P2', 'P3'],
    totalResources: [6, 5, 7, 6],
    allocation: [
      [0, 0, 1, 2],
      [1, 0, 0, 0],
      [1, 3, 5, 4],
      [0, 6, 3, 2]
    ],
    max: [
      [0, 0, 1, 2],
      [1, 7, 5, 0],
      [2, 3, 5, 6],
      [0, 6, 5, 2]
    ]
  }
};

interface BankersLabProps {
  onOpenAuth: () => void;
}

interface MatrixSnapshot {
  resourceNames: string[];
  processNames: string[];
  totalResources: number[];
  allocation: number[][];
  max: number[][];
  safetyResult: BankersResult | null;
  actionLabel: string;
}

export const BankersLab: React.FC<BankersLabProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [resourceNames, setResourceNames] = useState<string[]>(PRESETS.classicSafe.resourceNames);
  const [processNames, setProcessNames] = useState<string[]>(PRESETS.classicSafe.processNames);
  const [totalResources, setTotalResources] = useState<number[]>(PRESETS.classicSafe.totalResources);
  const [allocation, setAllocation] = useState<number[][]>(PRESETS.classicSafe.allocation);
  const [max, setMax] = useState<number[][]>(PRESETS.classicSafe.max);

  // Safety & Request execution state
  const [safetyResult, setSafetyResult] = useState<BankersResult | null>(null);
  const [runningCheck, setRunningCheck] = useState(false);
  const [requestProcessIdx, setRequestProcessIdx] = useState<number>(1);
  const [requestVector, setRequestVector] = useState<number[]>([1, 0, 2]);
  const [requestResult, setRequestResult] = useState<ResourceRequestResult | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Saving & Import state
  const [simulationTitle, setSimulationTitle] = useState('My Banker’s Simulation');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Guided Walkthrough Tour & History State
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [chartResourceFilter, setChartResourceFilter] = useState<'all' | number>('all');
  const [undoStack, setUndoStack] = useState<MatrixSnapshot[]>([]);

  const pushUndoSnapshot = (actionLabel: string) => {
    const snapshot: MatrixSnapshot = {
      resourceNames: [...resourceNames],
      processNames: [...processNames],
      totalResources: [...totalResources],
      allocation: allocation.map((r) => [...r]),
      max: max.map((r) => [...r]),
      safetyResult,
      actionLabel
    };
    setUndoStack((prev) => [...prev.slice(-49), snapshot]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setResourceNames(previous.resourceNames);
    setProcessNames(previous.processNames);
    setTotalResources(previous.totalResources);
    setAllocation(previous.allocation);
    setMax(previous.max);
    setChartResourceFilter('all');
    setRequestProcessIdx(0);
    setRequestVector(new Array(previous.resourceNames.length).fill(0));
    setRequestResult(null);
    setGeneralError(null);
    setSafetyResult(previous.safetyResult);

    if (user?.email) {
      runSafetyCheck({
        resourceNames: previous.resourceNames,
        processNames: previous.processNames,
        totalResources: previous.totalResources,
        allocation: previous.allocation,
        max: previous.max
      });
    }
  };

  // Auto-calculated Need and Available
  const calculateNeedLocal = () => {
    return max.map((row, i) =>
      row.map((maxVal, j) => Math.max(0, maxVal - (allocation[i]?.[j] || 0)))
    );
  };

  const calculateAvailableLocal = () => {
    return totalResources.map((tot, j) => {
      const allocatedSum = allocation.reduce((sum, row) => sum + (row[j] || 0), 0);
      return tot - allocatedSum;
    });
  };

  const localNeed = calculateNeedLocal();
  const localAvailable = calculateAvailableLocal();

  // Build Recharts data for Allocation vs Max per process with saturation %
  const chartData = processNames.map((pName, pIdx) => {
    if (chartResourceFilter === 'all') {
      const allocSum = (allocation[pIdx] || []).reduce((acc, v) => acc + (v || 0), 0);
      const maxSum = (max[pIdx] || []).reduce((acc, v) => acc + (v || 0), 0);
      const saturation = maxSum > 0 ? Math.round((allocSum / maxSum) * 100) : allocSum > 0 ? 100 : 0;
      return {
        process: pName,
        Allocation: allocSum,
        Max: maxSum,
        Need: Math.max(0, maxSum - allocSum),
        saturation,
      };
    } else {
      const rIdx = chartResourceFilter;
      const allocVal = allocation[pIdx]?.[rIdx] || 0;
      const maxVal = max[pIdx]?.[rIdx] || 0;
      const saturation = maxVal > 0 ? Math.round((allocVal / maxVal) * 100) : allocVal > 0 ? 100 : 0;
      return {
        process: pName,
        Allocation: allocVal,
        Max: maxVal,
        Need: Math.max(0, maxVal - allocVal),
        saturation,
      };
    }
  });

  const systemTotalUnits =
    chartResourceFilter === 'all'
      ? totalResources.reduce((acc, v) => acc + (v || 0), 0)
      : totalResources[chartResourceFilter] || 0;
  const systemAllocatedUnits = chartData.reduce((acc, item) => acc + item.Allocation, 0);
  const systemSaturationPercent =
    systemTotalUnits > 0 ? Math.round((systemAllocatedUnits / systemTotalUnits) * 100) : 0;

  // Run initial safety check when authenticated with email
  useEffect(() => {
    if (user?.email) {
      runSafetyCheck();
    }
  }, [user?.email]);

  const runSafetyCheck = async (overrideInput?: BankersInput) => {
    if (!user?.email) {
      setGeneralError('Please sign in with your email ID before running simulations.');
      onOpenAuth();
      return;
    }
    setRunningCheck(true);
    setGeneralError(null);
    try {
      const payload = overrideInput ?? {
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max
      };
      const res = await apiService.runBankersSafety(payload);
      setSafetyResult(res);
    } catch (err: any) {
      setGeneralError(err.response?.data?.error || err.message || 'Safety execution failed.');
    } finally {
      setRunningCheck(false);
    }
  };

  // Auto-generate mathematically valid Allocation, Max, and Total/Available matrices
  const generateValidMatrices = () => {
    const numProcesses = processNames.length;
    const numResources = resourceNames.length;

    const newAllocation: number[][] = [];
    const newMax: number[][] = [];

    for (let i = 0; i < numProcesses; i++) {
      const allocRow: number[] = [];
      const maxRow: number[] = [];
      for (let j = 0; j < numResources; j++) {
        const allocVal = Math.floor(Math.random() * 4); // 0..3
        const extraNeed = Math.floor(Math.random() * 5); // 0..4
        allocRow.push(allocVal);
        maxRow.push(allocVal + extraNeed); // Guarantees Allocation[i][j] <= Max[i][j]
      }
      newAllocation.push(allocRow);
      newMax.push(maxRow);
    }

    // Compute sum of allocated per resource and add positive available headroom (1..4)
    const newTotal: number[] = [];
    for (let j = 0; j < numResources; j++) {
      let colSum = 0;
      for (let i = 0; i < numProcesses; i++) {
        colSum += newAllocation[i][j];
      }
      const headroom = 1 + Math.floor(Math.random() * 4); // Guarantees Available[j] >= 1
      newTotal.push(colSum + headroom);
    }

    pushUndoSnapshot('Auto-Generate matrices');

    setTotalResources(newTotal);
    setAllocation(newAllocation);
    setMax(newMax);
    setRequestProcessIdx(0);
    setRequestVector(new Array(numResources).fill(0));
    setRequestResult(null);

    runSafetyCheck({
      resourceNames,
      processNames,
      totalResources: newTotal,
      allocation: newAllocation,
      max: newMax
    });
  };

  const handleTestRequest = async () => {
    if (!user?.email) {
      setGeneralError('Please sign in with your email ID before evaluating resource requests.');
      onOpenAuth();
      return;
    }
    setRequesting(true);
    setGeneralError(null);
    try {
      const res = await apiService.requestResource({
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max,
        processIndex: requestProcessIdx,
        request: requestVector
      });
      setRequestResult(res);
    } catch (err: any) {
      setGeneralError(err.response?.data?.error || err.message || 'Request evaluation failed.');
    } finally {
      setRequesting(false);
    }
  };

  const applyGrantedRequest = () => {
    if (requestResult?.granted && requestResult.updatedAllocation) {
      pushUndoSnapshot('Apply resource request');
      const nextAllocation = requestResult.updatedAllocation.map((r) => [...r]);
      setAllocation(nextAllocation);
      runSafetyCheck({
        resourceNames,
        processNames,
        totalResources,
        allocation: nextAllocation,
        max
      });
      setRequestResult(null);
    }
  };

  const handleSaveSimulation = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setSaving(true);
    try {
      await apiService.saveSimulation({
        title: simulationTitle,
        algorithm: 'bankers',
        resourceNames,
        processNames,
        totalResources,
        allocation,
        max,
        isSafe: safetyResult?.isSafe,
        safeSequence: safetyResult?.safeSequence
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save simulation to Cloud Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const escapeCsvCell = (value: string | number) => {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadResults = () => {
    const rows: string[][] = [];
    const statusLabel = safetyResult
      ? safetyResult.isSafe
        ? 'SAFE'
        : 'UNSAFE'
      : 'NOT EVALUATED';

    rows.push(['DeadlockSense - Banker\'s Algorithm Export']);
    rows.push(['Simulation Title', simulationTitle || 'Banker\'s Simulation']);
    rows.push(['Exported At', new Date().toISOString()]);
    rows.push(['Safety Status', statusLabel]);

    if (safetyResult) {
      if (safetyResult.isSafe) {
        rows.push(['Safe Sequence', safetyResult.safeSequence.join(' -> ')]);
      } else {
        rows.push([
          'Unresolved Processes',
          (safetyResult.unresolvedProcesses || []).join(', ') || 'None'
        ]);
      }
      rows.push(['Summary', safetyResult.explanation]);
    }

    rows.push([]);
    rows.push(['System Resource Vectors']);
    rows.push(['Resource', ...resourceNames]);
    rows.push(['Total Resources (E)', ...totalResources.map(String)]);
    rows.push(['Available Vector (A)', ...localAvailable.map(String)]);

    rows.push([]);
    rows.push(['Process Matrices']);
    rows.push([
      'Process',
      ...resourceNames.map((r) => `Allocation (${r})`),
      ...resourceNames.map((r) => `Max (${r})`),
      ...resourceNames.map((r) => `Need (${r})`)
    ]);

    processNames.forEach((pName, pIdx) => {
      rows.push([
        pName,
        ...resourceNames.map((_, rIdx) => String(allocation[pIdx]?.[rIdx] ?? 0)),
        ...resourceNames.map((_, rIdx) => String(max[pIdx]?.[rIdx] ?? 0)),
        ...resourceNames.map((_, rIdx) => String(localNeed[pIdx]?.[rIdx] ?? 0))
      ]);
    });

    if (safetyResult && safetyResult.steps.length > 0) {
      rows.push([]);
      rows.push(['Safety Execution Steps']);
      rows.push(['Step', 'Process', 'Work Before', 'Need', 'Work After', 'Explanation']);
      safetyResult.steps.forEach((step) => {
        rows.push([
          String(step.stepNumber),
          step.processName,
          `[${step.workBefore.join(', ')}]`,
          `[${step.need.join(', ')}]`,
          `[${step.workAfter.join(', ')}]`,
          step.explanation
        ]);
      });
    }

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (simulationTitle || 'bankers-results')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${slug || 'bankers-results'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvRows = (rawText: string): string[][] => {
    const cleanText = rawText.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\r' || char === '\n') {
          if (char === '\r' && nextChar === '\n') i++;
          currentRow.push(currentCell.trim());
          if (currentRow.some((cell) => cell !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const extractResourceLabel = (header: string, fallbackIndex: number): string => {
    const parenMatch = header.match(/\(([^)]+)\)/);
    if (parenMatch?.[1]) return parenMatch[1].trim();
    const bracketMatch = header.match(/\[([^\]]+)\]/);
    if (bracketMatch?.[1]) return bracketMatch[1].trim();
    const stripped = header
      .replace(/^(allocation|alloc|max|maximum|need)[_\s:-]*/i, '')
      .trim();
    return stripped || `R${fallbackIndex + 1}`;
  };

  const parseNonNegativeInt = (raw: string | undefined): number | null => {
    if (raw === undefined || raw === '') return null;
    const num = Number(raw);
    if (!Number.isInteger(num) || num < 0) return null;
    return num;
  };

  const parseMatricesCsv = (csvText: string): BankersInput => {
    const rows = parseCsvRows(csvText);
    if (rows.length === 0) {
      throw new Error('The uploaded CSV file is empty.');
    }

    let parsedResourceNames: string[] = [];
    let parsedTotalResources: number[] | null = null;
    let parsedAvailable: number[] | null = null;
    let parsedProcessNames: string[] = [];
    let parsedAllocation: number[][] = [];
    let parsedMax: number[][] = [];

    // Check for vector rows anywhere before or outside the process matrix table
    for (const row of rows) {
      const first = (row[0] || '').toLowerCase();
      if (first === 'resource' || first === 'resources') {
        const names = row.slice(1).filter(Boolean);
        if (names.length > 0) parsedResourceNames = names;
      } else if (first.startsWith('total resources') || first === 'total') {
        const vals = row.slice(1).map((c) => parseNonNegativeInt(c));
        if (vals.length > 0 && vals.every((v): v is number => v !== null)) {
          parsedTotalResources = vals;
        }
      } else if (first.startsWith('available')) {
        const vals = row.slice(1).map((c) => parseNonNegativeInt(c));
        if (vals.length > 0 && vals.every((v): v is number => v !== null)) {
          parsedAvailable = vals;
        }
      }
    }

    // Strategy 1: Combined Process Matrices header (e.g. Process, Allocation (A)..., Max (A)...)
    const matrixHeaderIdx = rows.findIndex((row) => {
      const first = (row[0] || '').toLowerCase();
      const hasAlloc = row.some((c) => /^alloc/i.test(c));
      const hasMax = row.some((c) => /^max/i.test(c));
      return (first === 'process' || first === 'pid' || first === 'name') && hasAlloc && hasMax;
    });

    if (matrixHeaderIdx !== -1) {
      const header = rows[matrixHeaderIdx];
      const allocIndices: number[] = [];
      const maxIndices: number[] = [];

      header.forEach((col, idx) => {
        if (idx === 0) return;
        if (/^alloc/i.test(col)) allocIndices.push(idx);
        else if (/^max/i.test(col)) maxIndices.push(idx);
      });

      if (allocIndices.length === 0 || allocIndices.length !== maxIndices.length) {
        throw new Error(
          'CSV header must contain matching Allocation and Max columns for each resource.'
        );
      }

      if (parsedResourceNames.length !== allocIndices.length) {
        parsedResourceNames = allocIndices.map((colIdx, idx) =>
          extractResourceLabel(header[colIdx], idx)
        );
      }

      for (let r = matrixHeaderIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        const firstCell = (row[0] || '').trim();
        const lowerFirst = firstCell.toLowerCase();

        // Stop if we reached another section (e.g. Safety Execution Steps)
        if (
          !firstCell ||
          lowerFirst.startsWith('safety execution') ||
          lowerFirst === 'step'
        ) {
          break;
        }

        if (lowerFirst.startsWith('available')) {
          const vals = allocIndices.map((idx) => parseNonNegativeInt(row[idx]));
          if (vals.every((v): v is number => v !== null)) {
            parsedAvailable = vals;
          }
          continue;
        }

        const allocRow = allocIndices.map((idx) => parseNonNegativeInt(row[idx]));
        const maxRow = maxIndices.map((idx) => parseNonNegativeInt(row[idx]));

        if (
          allocRow.some((v) => v === null) ||
          maxRow.some((v) => v === null)
        ) {
          throw new Error(
            `Invalid numeric matrix value on row for process "${firstCell}".`
          );
        }

        parsedProcessNames.push(firstCell);
        parsedAllocation.push(allocRow as number[]);
        parsedMax.push(maxRow as number[]);
      }
    } else {
      // Strategy 2: Separate sections (Allocation section & Max section)
      const allocSectionIdx = rows.findIndex((r) =>
        /^allocation$/i.test((r[0] || '').trim())
      );
      const maxSectionIdx = rows.findIndex((r) =>
        /^max(imum)?$/i.test((r[0] || '').trim())
      );

      if (allocSectionIdx === -1 || maxSectionIdx === -1) {
        throw new Error(
          'Unrecognized CSV format. Expected a Process table with Allocation & Max columns (or exported DeadlockSense CSV).'
        );
      }

      const readSectionRows = (startIdx: number) => {
        const entries: { name: string; values: number[] }[] = [];
        let headers: string[] = [];
        for (let r = startIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          const label = (row[0] || '').trim();
          const lower = label.toLowerCase();
          if (
            !label ||
            lower === 'allocation' ||
            lower === 'max' ||
            lower === 'maximum' ||
            lower.startsWith('available') ||
            lower.startsWith('total')
          ) {
            break;
          }
          const nums = row.slice(1).map((c) => parseNonNegativeInt(c));
          if (nums.length > 0 && nums.every((v): v is number => v !== null)) {
            entries.push({ name: label, values: nums });
          } else if (entries.length === 0 && (lower === 'process' || lower === 'name')) {
            headers = row.slice(1).filter(Boolean);
          }
        }
        return { entries, headers };
      };

      const allocSec = readSectionRows(allocSectionIdx);
      const maxSec = readSectionRows(maxSectionIdx);

      if (
        allocSec.entries.length === 0 ||
        allocSec.entries.length !== maxSec.entries.length
      ) {
        throw new Error('Allocation and Max sections must contain the same number of processes.');
      }

      const numRes = allocSec.entries[0].values.length;
      if (parsedResourceNames.length !== numRes) {
        parsedResourceNames =
          allocSec.headers.length === numRes
            ? allocSec.headers
            : Array.from({ length: numRes }, (_, i) => `R${i + 1}`);
      }

      parsedProcessNames = allocSec.entries.map((e) => e.name);
      parsedAllocation = allocSec.entries.map((e) => e.values);
      parsedMax = maxSec.entries.map((e) => e.values);
    }

    if (parsedProcessNames.length === 0 || parsedResourceNames.length === 0) {
      throw new Error('No process rows were found in the uploaded CSV.');
    }

    const numResources = parsedResourceNames.length;
    const allocatedSums = Array.from({ length: numResources }, (_, j) =>
      parsedAllocation.reduce((sum, row) => sum + (row[j] ?? 0), 0)
    );

    let finalTotalResources: number[];
    if (parsedAvailable && parsedAvailable.length === numResources) {
      finalTotalResources = allocatedSums.map((sum, j) => sum + parsedAvailable![j]);
    } else if (parsedTotalResources && parsedTotalResources.length === numResources) {
      finalTotalResources = parsedTotalResources;
    } else {
      finalTotalResources = allocatedSums.map((sum) => sum + 1);
    }

    return {
      resourceNames: parsedResourceNames,
      processNames: parsedProcessNames,
      totalResources: finalTotalResources,
      allocation: parsedAllocation,
      max: parsedMax
    };
  };

  const handleImportMatricesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setGeneralError(null);
    setImportMessage(null);

    try {
      const text = await file.text();
      const imported = parseMatricesCsv(text);

      pushUndoSnapshot('Import CSV matrices');

      setResourceNames(imported.resourceNames);
      setProcessNames(imported.processNames);
      setTotalResources(imported.totalResources);
      setAllocation(imported.allocation);
      setMax(imported.max);
      setChartResourceFilter('all');
      setRequestProcessIdx(0);
      setRequestVector(new Array(imported.resourceNames.length).fill(0));
      setRequestResult(null);

      setImportMessage(
        `Imported ${imported.processNames.length} processes & ${imported.resourceNames.length} resources from "${file.name}".`
      );
      setTimeout(() => setImportMessage(null), 5000);

      await runSafetyCheck(imported);
    } catch (err: any) {
      setGeneralError(err?.message || 'Failed to parse the uploaded CSV file.');
    }
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    pushUndoSnapshot(`Load preset (${p.title})`);
    setResourceNames([...p.resourceNames]);
    setProcessNames([...p.processNames]);
    setTotalResources([...p.totalResources]);
    setAllocation(p.allocation.map(r => [...r]));
    setMax(p.max.map(r => [...r]));
    setChartResourceFilter('all');
    setRequestProcessIdx(0);
    setRequestVector(new Array(p.resourceNames.length).fill(0));
    setRequestResult(null);
    runSafetyCheck({
      resourceNames: [...p.resourceNames],
      processNames: [...p.processNames],
      totalResources: [...p.totalResources],
      allocation: p.allocation.map(r => [...r]),
      max: p.max.map(r => [...r])
    });
  };

  const updateAllocationCell = (pIdx: number, rIdx: number, val: number) => {
    const normalized = Math.max(0, val);
    if ((allocation[pIdx]?.[rIdx] ?? 0) === normalized) return;
    pushUndoSnapshot(`Edit Allocation (${processNames[pIdx]}, ${resourceNames[rIdx]})`);
    const next = allocation.map((row, i) =>
      i === pIdx ? row.map((c, j) => (j === rIdx ? normalized : c)) : [...row]
    );
    setAllocation(next);
  };

  const updateMaxCell = (pIdx: number, rIdx: number, val: number) => {
    const normalized = Math.max(0, val);
    if ((max[pIdx]?.[rIdx] ?? 0) === normalized) return;
    pushUndoSnapshot(`Edit Max (${processNames[pIdx]}, ${resourceNames[rIdx]})`);
    const next = max.map((row, i) =>
      i === pIdx ? row.map((c, j) => (j === rIdx ? normalized : c)) : [...row]
    );
    setMax(next);
  };

  const updateTotalCell = (rIdx: number, val: number) => {
    const normalized = Math.max(0, val);
    if ((totalResources[rIdx] ?? 0) === normalized) return;
    pushUndoSnapshot(`Edit Total/Available (${resourceNames[rIdx]})`);
    const next = [...totalResources];
    next[rIdx] = normalized;
    setTotalResources(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Guided Tour Launcher */}
      <div 
        id="tour-header"
        className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-center lg:justify-between transition-all"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">{t.bankers.title}</h1>
            <span className="rounded bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 border border-cyan-800/60">
              {t.bankers.badge}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t.bankers.subtitle}
          </p>
        </div>

        {/* Action Controls & Walkthrough Launcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Show Tutorial Button */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 transition-all shadow-sm shadow-blue-950"
            title={t.bankers.showTutorialTooltip}
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            <span>{t.bankers.showTutorial}</span>
          </button>

          {/* Guided Walkthrough Tour Button */}
          <button
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all shadow-sm shadow-cyan-950"
            title={t.bankers.guidedTourTooltip}
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>{t.bankers.guidedTour}</span>
          </button>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 hidden sm:inline">{t.bankers.presetsLabel}</span>
            <button
              onClick={() => loadPreset('classicSafe')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              {t.bankers.presetSafe}
            </button>
            <button
              onClick={() => loadPreset('unsafeState')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
            >
              {t.bankers.presetUnsafe}
            </button>
            <button
              onClick={() => loadPreset('fourResources')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              {t.bankers.presetFour}
            </button>
          </div>
        </div>
      </div>

      {generalError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/80 bg-red-950/50 p-4 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{generalError}</span>
        </div>
      )}

      {importMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* Main Matrix Editor Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Resource Vectors & Matrices (2 cols wide) */}
        <div className="xl:col-span-2 min-w-0 space-y-6">
          {/* Total & Available Vectors */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.bankers.resourceVectors}
              </h3>
              <span className="text-[11px] text-slate-500">
                {t.bankers.resourceVectorsHint}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Resources Card */}
              <div 
                id="tour-total-resources"
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition-all focus-within:border-cyan-500/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">{t.bankers.totalResources}</span>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTooltip('total')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="text-slate-500 hover:text-cyan-400"
                      title={t.bankers.totalTooltip}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">{t.bankers.systemCapacity}</span>
                </div>

                {/* Tooltip Popup */}
                {hoveredTooltip === 'total' && (
                  <div className="absolute left-3 top-10 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-[11px] text-slate-300 shadow-xl pointer-events-none">
                    {t.bankers.totalTooltip}
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => (
                    <div key={r} className="flex flex-col items-center">
                      <span className="font-mono text-[11px] text-cyan-400 font-semibold mb-1">{r}</span>
                      <input
                        type="number"
                        min="0"
                        value={totalResources[idx] ?? 0}
                        onChange={(e) => updateTotalCell(idx, parseInt(e.target.value) || 0)}
                        className="w-14 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-center font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Vector Card */}
              <div 
                id="tour-available-vector"
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">{t.bankers.availableVector}</span>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTooltip('available')}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className="text-slate-500 hover:text-emerald-400"
                      title={t.bankers.availableTooltip}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">{t.bankers.availableSub}</span>
                </div>

                {/* Tooltip Popup */}
                {hoveredTooltip === 'available' && (
                  <div className="absolute left-3 top-10 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-[11px] text-slate-300 shadow-xl pointer-events-none">
                    {t.bankers.availableTooltip}
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => {
                    const avail = localAvailable[idx];
                    return (
                      <div key={r} className="flex flex-col items-center">
                        <span className="font-mono text-[11px] text-emerald-400 font-semibold mb-1">{r}</span>
                        <div className={`w-14 rounded-lg border p-1.5 text-center font-mono text-xs font-bold ${
                          avail < 0
                            ? 'border-red-600 bg-red-950 text-red-300'
                            : 'border-slate-800 bg-slate-900/90 text-emerald-300'
                        }`}>
                          {avail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Matrices: Allocation, Max, and Need */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.bankers.processMatrices}
              </h3>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span>{t.bankers.formulaLabel}</span>
                <span className="rounded bg-slate-950 px-2 py-0.5 text-amber-300 border border-slate-800">
                  Need = Max - Allocation
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">{t.bankers.colProcess}</th>
                    
                    {/* Allocation Header */}
                    <th 
                      id="tour-allocation-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-cyan-300">{t.bankers.colAllocation}</span>
                        <span className="text-[10px] font-mono text-slate-500">{t.bankers.colHeld}</span>
                      </div>
                    </th>

                    {/* Maximum Claim Header */}
                    <th 
                      id="tour-max-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-blue-300">{t.bankers.colMax}</span>
                        <span className="text-[10px] font-mono text-slate-500">{t.bankers.colPeak}</span>
                      </div>
                    </th>

                    {/* Need Header */}
                    <th 
                      id="tour-need-matrix" 
                      className="py-2.5 px-3 text-center border-l border-slate-800/80 bg-slate-950/30" 
                      colSpan={resourceNames.length}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-amber-300">{t.bankers.colNeed}</span>
                        <span className="text-[10px] font-mono text-slate-500">{t.bankers.colNeedFormula}</span>
                      </div>
                    </th>
                  </tr>

                  {/* Resource Column Sub-headers */}
                  <tr className="border-b border-slate-800/70 text-[10px] text-slate-500 font-mono">
                    <th className="py-1 px-3">{t.bankers.colName}</th>
                    {resourceNames.map(r => (
                      <th key={`alloc-h-${r}`} className="text-center py-1 px-1.5 text-cyan-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                    {resourceNames.map(r => (
                      <th key={`max-h-${r}`} className="text-center py-1 px-1.5 text-blue-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                    {resourceNames.map(r => (
                      <th key={`need-h-${r}`} className="text-center py-1 px-1.5 text-amber-400 border-l first:border-l-0 border-slate-800/40">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {processNames.map((pName, pIdx) => (
                    <tr key={pName} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 font-bold text-white font-sans">{pName}</td>

                      {/* Allocation inputs */}
                      {resourceNames.map((_, rIdx) => (
                        <td key={`alloc-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={allocation[pIdx]?.[rIdx] ?? 0}
                            onChange={(e) => updateAllocationCell(pIdx, rIdx, parseInt(e.target.value) || 0)}
                            className="w-10 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* Max inputs */}
                      {resourceNames.map((_, rIdx) => (
                        <td key={`max-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={max[pIdx]?.[rIdx] ?? 0}
                            onChange={(e) => updateMaxCell(pIdx, rIdx, parseInt(e.target.value) || 0)}
                            className="w-10 rounded border border-slate-700 bg-slate-950 p-1 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* Calculated Need cells */}
                      {resourceNames.map((_, rIdx) => {
                        const needVal = localNeed[pIdx]?.[rIdx] ?? 0;
                        return (
                          <td key={`need-${pIdx}-${rIdx}`} className="py-1 px-1 text-center">
                            <span className="inline-block w-10 rounded bg-slate-950/80 py-1 text-center text-xs font-semibold text-amber-300 border border-slate-800">
                              {needVal}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix action buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="tour-safety-check"
                  onClick={() => runSafetyCheck()}
                  disabled={runningCheck}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  {runningCheck ? t.bankers.verifying : t.bankers.runSafety}
                </button>
                <button
                  onClick={generateValidMatrices}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500 transition-colors"
                  title={t.bankers.autoGenerateTooltip}
                >
                  <Shuffle className="h-3.5 w-3.5 text-emerald-400" />
                  {t.bankers.autoGenerate}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportMatricesFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-violet-700/60 bg-violet-950/40 px-3.5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-900/50 hover:border-violet-500 transition-colors"
                  title={t.bankers.importMatricesTooltip}
                >
                  <Upload className="h-3.5 w-3.5 text-violet-400" />
                  {t.bankers.importMatrices}
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-700/60 bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-950/40 disabled:hover:border-amber-700/60"
                  title={
                    undoStack.length > 0
                      ? `${t.bankers.undoTooltipPrefix} ${undoStack[undoStack.length - 1].actionLabel}`
                      : t.bankers.undoEmptyTooltip
                  }
                >
                  <Undo2 className="h-3.5 w-3.5 text-amber-400" />
                  {t.bankers.undo}{undoStack.length > 0 ? ` (${undoStack.length})` : ''}
                </button>
                <button
                  onClick={() => loadPreset('classicSafe')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.bankers.reset}
                </button>
              </div>

              {/* Save Simulation to Firestore */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t.bankers.simTitlePlaceholder}
                  value={simulationTitle}
                  onChange={(e) => setSimulationTitle(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveSimulation}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? t.bankers.saving : saveSuccess ? t.bankers.savedCloud : t.bankers.save}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadResults}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-700/60 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-500 transition-colors"
                  title={t.bankers.downloadTooltip}
                >
                  <Download className="h-3.5 w-3.5 text-indigo-400" />
                  {t.bankers.downloadResults}
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Bar Graph: Allocation vs Max Resources per Process */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {t.bankers.chartTitle}
                    </h3>
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        systemSaturationPercent > 100
                          ? 'border-red-700/70 bg-red-950/50 text-red-300'
                          : systemSaturationPercent >= 80
                          ? 'border-amber-700/70 bg-amber-950/50 text-amber-300'
                          : 'border-cyan-800/70 bg-cyan-950/50 text-cyan-300'
                      }`}
                    >
                      {t.bankers.poolSaturation}: {systemSaturationPercent}% ({systemAllocatedUnits}/{systemTotalUnits})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t.bankers.chartSubtitle}
                  </p>
                </div>
              </div>

              {/* Resource Filter Selector */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChartResourceFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    chartResourceFilter === 'all'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.bankers.allResources}
                </button>
                {resourceNames.map((resName, idx) => (
                  <button
                    key={`chart-filter-${resName}`}
                    type="button"
                    onClick={() => setChartResourceFilter(idx)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                      chartResourceFilter === idx
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {resName}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full min-w-0 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="process" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }} 
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const row = payload[0]?.payload as {
                        Allocation: number;
                        Max: number;
                        Need: number;
                        saturation: number;
                      };
                      const scopeLabel =
                        chartResourceFilter === 'all'
                          ? t.bankers.allResources
                          : `${resourceNames[chartResourceFilter] ?? ''}`;
                      const satClass =
                        row.saturation > 100
                          ? 'text-red-300'
                          : row.saturation >= 80
                          ? 'text-amber-300'
                          : 'text-emerald-300';
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
                          <div className="mb-1.5 flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                            <span className="font-bold text-white">{label}</span>
                            <span className="font-mono text-[10px] text-slate-400">{scopeLabel}</span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex items-center justify-between gap-4 text-cyan-300">
                              <span>{t.bankers.chartAllocName}:</span>
                              <span className="font-bold">{row.Allocation}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-blue-300">
                              <span>{t.bankers.chartMaxName}:</span>
                              <span className="font-bold">{row.Max}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-amber-300">
                              <span>{t.bankers.chartNeedName}:</span>
                              <span className="font-bold">{row.Need}</span>
                            </div>
                            <div className={`flex items-center justify-between gap-4 border-t border-slate-800 pt-1 ${satClass}`}>
                              <span>{t.bankers.chartClaimSat}:</span>
                              <span className="font-bold">{row.saturation}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar 
                    dataKey="Allocation" 
                    name={t.bankers.chartAllocName} 
                    fill="#06b6d4" 
                    radius={[4, 4, 0, 0]} 
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`alloc-cell-${entry.process}`}
                        fill={
                          entry.saturation > 100
                            ? '#ef4444'
                            : entry.saturation >= 80
                            ? '#f59e0b'
                            : '#06b6d4'
                        }
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="Max" 
                    name={t.bankers.chartMaxName} 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-end gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
                {t.bankers.satLow}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                {t.bankers.satHigh}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                {t.bankers.satOver}
              </span>
            </div>
          </div>

          {/* Step-by-Step Safety Execution Log */}
          {safetyResult && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {t.bankers.executionSteps}
              </h3>
              {safetyResult.steps.length > 0 ? (
                <div className="space-y-2">
                  {safetyResult.steps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-950 text-cyan-400 font-mono font-bold text-[11px] border border-cyan-800">
                        #{st.stepNumber}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-sans">{st.processName}</span>
                          <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                            {t.bankers.needSatisfied}
                          </span>
                        </div>
                        <p className="text-slate-400">{st.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs text-red-300">
                  {t.bankers.noProcessSatisfied}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Safety Verdict & Resource Request Tester */}
        <div className="space-y-6">
          {/* Safety State Result Card */}
          <div 
            id="tour-safety-verdict"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {t.bankers.safetyVerdict}
            </h3>

            {safetyResult ? (
              <div className={`rounded-xl border p-4 ${
                safetyResult.isSafe 
                  ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200' 
                  : 'border-red-800/80 bg-red-950/40 text-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  {safetyResult.isSafe ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>{t.bankers.safeState}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span>{t.bankers.unsafeState}</span>
                    </>
                  )}
                </div>

                {safetyResult.isSafe ? (
                  <div className="space-y-2 mt-3">
                    <span className="text-[11px] text-emerald-400 font-medium">{t.bankers.safeSequence}</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                      {safetyResult.safeSequence.map((p, idx) => (
                        <React.Fragment key={p}>
                          <span className="rounded-lg bg-emerald-900/60 px-2 py-1 font-bold text-emerald-300 border border-emerald-700/60">
                            {p}
                          </span>
                          {idx < safetyResult.safeSequence.length - 1 && (
                            <span className="text-emerald-500 font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 mt-2 text-xs text-red-300/90">
                    <p>{t.bankers.unresolvedLabel}</p>
                    <span className="font-mono font-bold text-red-400">
                      [{safetyResult.unresolvedProcesses?.join(', ')}]
                    </span>
                  </div>
                )}

                <p className="mt-3 text-xs leading-relaxed opacity-85 border-t border-slate-800/50 pt-2.5">
                  {safetyResult.explanation}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                {t.bankers.emptyVerdict}
              </div>
            )}
          </div>

          {/* Resource Request Algorithm Panel */}
          <div 
            id="tour-request-tester"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.bankers.requestTester}
              </h3>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">
                {t.bankers.pretendAlloc}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {t.bankers.requestDesc}
            </p>

            <div className="space-y-3">
              {/* Select Process */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t.bankers.requestingProcess}</label>
                <select
                  value={requestProcessIdx}
                  onChange={(e) => setRequestProcessIdx(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {processNames.map((p, idx) => (
                    <option key={p} value={idx}>
                      {p} (Need: [{localNeed[idx]?.join(', ')}])
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Vector Inputs */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.bankers.requestedVector}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {resourceNames.map((r, idx) => (
                    <div key={`req-${r}`} className="flex flex-col items-center">
                      <span className="font-mono text-[10px] text-slate-400 mb-0.5">{r}</span>
                      <input
                        type="number"
                        min="0"
                        value={requestVector[idx] ?? 0}
                        onChange={(e) => {
                          const next = [...requestVector];
                          next[idx] = parseInt(e.target.value) || 0;
                          setRequestVector(next);
                        }}
                        className="w-12 rounded-lg border border-slate-700 bg-slate-950 p-1 text-center font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTestRequest}
                disabled={requesting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                {requesting ? t.bankers.evaluating : t.bankers.evaluateRequest}
              </button>
            </div>

            {/* Request Evaluation Output */}
            {requestResult && (
              <div className={`mt-4 rounded-xl border p-3.5 text-xs ${
                requestResult.granted
                  ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-800/80 bg-red-950/40 text-red-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {requestResult.granted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{t.bankers.requestGranted}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span>{t.bankers.requestDenied}</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed opacity-90">{requestResult.reason}</p>

                {requestResult.granted && (
                  <button
                    onClick={applyGrantedRequest}
                    className="mt-3 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 py-1.5 font-semibold text-white transition-colors"
                  >
                    {t.bankers.applyAlloc}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guided Walkthrough Modal Component */}
      <BankersTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* TutorialModal Component */}
      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />
    </div>
  );
};
