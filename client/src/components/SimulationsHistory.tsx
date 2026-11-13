import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  History,
  Play,
  Trash2,
  RefreshCw,
  AlertCircle,
  Printer,
  X,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { apiService, UserSimulationRecord } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';

interface SimulationsHistoryProps {
  onLoadSimulation: (sim: UserSimulationRecord) => void;
}

interface ReportMetrics {
  allocatedTotals: number[];
  availableTotals: number[];
  utilizationPct: number[];
  needMatrix: number[][] | null;
}

const computeReportMetrics = (sim: UserSimulationRecord): ReportMetrics => {
  const numResources = sim.resourceNames.length;
  const allocatedTotals = Array.from({ length: numResources }, (_, rIdx) =>
    sim.allocation.reduce((sum, row) => sum + (Number(row?.[rIdx]) || 0), 0)
  );

  const availableTotals = Array.from({ length: numResources }, (_, rIdx) =>
    (Number(sim.totalResources?.[rIdx]) || 0) - allocatedTotals[rIdx]
  );

  const utilizationPct = Array.from({ length: numResources }, (_, rIdx) => {
    const total = Number(sim.totalResources?.[rIdx]) || 0;
    if (total <= 0) return 0;
    return Math.round((allocatedTotals[rIdx] / total) * 1000) / 10;
  });

  const needMatrix =
    sim.max && sim.max.length > 0
      ? sim.processNames.map((_, pIdx) =>
          sim.resourceNames.map(
            (__, rIdx) =>
              (Number(sim.max?.[pIdx]?.[rIdx]) || 0) -
              (Number(sim.allocation?.[pIdx]?.[rIdx]) || 0)
          )
        )
      : null;

  return {
    allocatedTotals,
    availableTotals,
    utilizationPct,
    needMatrix,
  };
};

interface MatrixTableProps {
  title: string;
  processColLabel: string;
  processNames: string[];
  resourceNames: string[];
  matrix: number[][];
}

const PrintableMatrixTable: React.FC<MatrixTableProps> = ({
  title,
  processColLabel,
  processNames,
  resourceNames,
  matrix,
}) => (
  <div className="print-break-inside-avoid rounded-lg border border-slate-200 overflow-hidden">
    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs font-mono">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <th className="px-3 py-2 font-semibold">{processColLabel}</th>
            {resourceNames.map((res, idx) => (
              <th key={idx} className="px-3 py-2 text-right font-semibold">
                {res}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processNames.map((proc, pIdx) => (
            <tr
              key={pIdx}
              className="border-b border-slate-100 last:border-b-0 odd:bg-white even:bg-slate-50/50"
            >
              <td className="px-3 py-1.5 font-semibold text-slate-800">{proc}</td>
              {resourceNames.map((_, rIdx) => (
                <td key={rIdx} className="px-3 py-1.5 text-right text-slate-700">
                  {matrix?.[pIdx]?.[rIdx] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SimulationsHistory: React.FC<SimulationsHistoryProps> = ({ onLoadSimulation }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [simulations, setSimulations] = useState<UserSimulationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportSim, setReportSim] = useState<UserSimulationRecord | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>('');

  const fetchSimulations = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSimulations();
      setSimulations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [user]);

  useEffect(() => {
    if (!reportSim) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReportSim(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportSim]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await apiService.deleteSimulation(id);
      setSimulations((prev) => prev.filter((s) => s.id !== id));
      if (reportSim?.id === id) {
        setReportSim(null);
      }
    } catch (err: any) {
      setError(`Delete failed: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleOpenReport = (sim: UserSimulationRecord) => {
    setReportGeneratedAt(new Date().toLocaleString());
    setReportSim(sim);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const reportMetrics = useMemo(
    () => (reportSim ? computeReportMetrics(reportSim) : null),
    [reportSim]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <History className="h-4 w-4" />
            </span>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.history.title}</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t.history.subtitlePrefix} ({user?.email})
          </p>
        </div>

        <button
          onClick={fetchSimulations}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t.history.refresh}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400">{t.history.loading}</span>
        </div>
      ) : simulations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <History className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">{t.history.emptyTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {t.history.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 mb-2 tabular-nums">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {sim.algorithm.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{new Date(sim.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1.5">{sim.title}</h3>
                {sim.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{sim.description}</p>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 tabular-nums mb-4">
                  <div className="flex justify-between gap-2 py-1.5">
                    <span className="text-slate-400 dark:text-slate-500">{t.history.processes}</span>
                    <span className="truncate font-medium">{sim.processNames.join(', ')}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5">
                    <span className="text-slate-400 dark:text-slate-500">{t.history.resources}</span>
                    <span className="truncate font-medium">{sim.resourceNames.join(', ')}</span>
                  </div>
                  {sim.isSafe !== undefined && (
                    <div className="flex justify-between gap-2 py-1.5">
                      <span className="text-slate-400 dark:text-slate-500">{t.history.verdict}</span>
                      <span className={sim.isSafe ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                        {sim.isSafe ? t.history.safe : t.history.unsafe}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onLoadSimulation(sim)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    {t.history.loadIntoLab}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReport(sim)}
                    title={t.history.printReportTooltip}
                    className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {t.history.printReport}
                  </button>
                </div>

                {confirmDeleteId === sim.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={deletingId === sim.id}
                      onClick={() => handleDelete(sim.id)}
                      className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      {deletingId === sim.id ? '...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(sim.id)}
                    title={t.history.deleteTooltip}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Report Preview Portal */}
      {reportSim &&
        reportMetrics &&
        createPortal(
          <div
            className="print-portal-root fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setReportSim(null);
              }
            }}
          >
            {/* Preview Action Toolbar (hidden when printing) */}
            <div className="print:hidden mx-auto mb-4 flex max-w-4xl items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Printer className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">{t.history.reportHeader}</h2>
                  <p className="text-[11px] text-slate-400">{reportSim.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {t.history.printNowBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setReportSim(null)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {t.history.closeBtn}
                </button>
              </div>
            </div>

            {/* White-Paper Formatted Printable Sheet */}
            <article className="print-report-sheet mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 sm:p-10 text-slate-900 shadow-2xl space-y-6">
              {/* Document Header */}
              <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs uppercase tracking-widest">
                    <Cpu className="h-4 w-4" />
                    <span>DeadlockSense</span>
                  </div>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                    {reportSim.title}
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500">{t.history.reportSubheader}</p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold uppercase text-slate-800">
                    {reportSim.algorithm.replace(/_/g, ' ')}
                  </span>
                  {reportSim.isSafe !== undefined ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold ${
                        reportSim.isSafe
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-red-300 bg-red-50 text-red-800'
                      }`}
                    >
                      {reportSim.isSafe ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-red-700" />
                      )}
                      {reportSim.isSafe ? t.history.safe : t.history.unsafe}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {t.history.notRecorded}
                    </span>
                  )}
                </div>
              </header>

              {/* Metadata Grid */}
              <section className="print-break-inside-avoid grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.history.recordId}
                  </div>
                  <div className="mt-0.5 font-mono font-semibold text-slate-800 break-all">
                    {reportSim.id}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.history.algorithmLabel}
                  </div>
                  <div className="mt-0.5 font-mono font-semibold text-slate-800 uppercase">
                    {reportSim.algorithm}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.history.createdAt}
                  </div>
                  <div className="mt-0.5 font-medium text-slate-800">
                    {new Date(reportSim.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.history.generatedAt}
                  </div>
                  <div className="mt-0.5 font-medium text-slate-800">{reportGeneratedAt}</div>
                </div>
                <div className="col-span-2 sm:col-span-4 border-t border-slate-200 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-2">
                      {t.history.ownerLabel}:
                    </span>
                    <span className="font-mono text-xs font-medium text-slate-800">
                      {user?.email || reportSim.userId}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    {reportSim.processNames.length} {t.history.processes.replace(':', '')} •{' '}
                    {reportSim.resourceNames.length} {t.history.resources.replace(':', '')}
                  </div>
                </div>
              </section>

              {/* Optional Scenario Description */}
              {reportSim.description && (
                <section className="print-break-inside-avoid rounded-lg border border-slate-200 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t.history.notesTitle}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                    {reportSim.description}
                  </p>
                </section>
              )}

              {/* Safe Execution Sequence */}
              {reportSim.safeSequence && reportSim.safeSequence.length > 0 && (
                <section className="print-break-inside-avoid rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      {t.history.safeSequenceLabel}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    {reportSim.safeSequence.map((proc, idx) => (
                      <React.Fragment key={idx}>
                        <span className="rounded border border-emerald-300 bg-white px-2.5 py-1 font-bold text-emerald-900">
                          {proc}
                        </span>
                        {idx < reportSim.safeSequence!.length - 1 && (
                          <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </section>
              )}

              {/* Resource Vectors & Utilization Table */}
              <section className="print-break-inside-avoid rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t.history.resourceVectorsTitle}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-2 font-semibold">{t.history.resources.replace(':', '')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t.history.totalCapacity}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t.history.allocatedSum}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t.history.availableSum}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t.history.utilization}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportSim.resourceNames.map((res, rIdx) => {
                        const pct = reportMetrics.utilizationPct[rIdx] ?? 0;
                        const avail = reportMetrics.availableTotals[rIdx] ?? 0;
                        return (
                          <tr
                            key={rIdx}
                            className="border-b border-slate-100 last:border-b-0 odd:bg-white even:bg-slate-50/50"
                          >
                            <td className="px-3 py-2 font-bold text-slate-800">{res}</td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {reportSim.totalResources?.[rIdx] ?? 0}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {reportMetrics.allocatedTotals[rIdx] ?? 0}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-semibold ${
                                avail < 0 ? 'text-red-700' : 'text-emerald-700'
                              }`}
                            >
                              {avail}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${
                                  pct > 100
                                    ? 'bg-red-100 text-red-800'
                                    : pct >= 80
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Process Matrices */}
              <section className="grid grid-cols-1 gap-4">
                <PrintableMatrixTable
                  title={t.history.allocationMatrix}
                  processColLabel={t.history.processCol}
                  processNames={reportSim.processNames}
                  resourceNames={reportSim.resourceNames}
                  matrix={reportSim.allocation}
                />

                {reportSim.max && reportSim.max.length > 0 && (
                  <PrintableMatrixTable
                    title={t.history.maxMatrix}
                    processColLabel={t.history.processCol}
                    processNames={reportSim.processNames}
                    resourceNames={reportSim.resourceNames}
                    matrix={reportSim.max}
                  />
                )}

                {reportMetrics.needMatrix && (
                  <PrintableMatrixTable
                    title={t.history.needMatrix}
                    processColLabel={t.history.processCol}
                    processNames={reportSim.processNames}
                    resourceNames={reportSim.resourceNames}
                    matrix={reportMetrics.needMatrix}
                  />
                )}

                {reportSim.request && reportSim.request.length > 0 && (
                  <PrintableMatrixTable
                    title={t.history.requestMatrix}
                    processColLabel={t.history.processCol}
                    processNames={reportSim.processNames}
                    resourceNames={reportSim.resourceNames}
                    matrix={reportSim.request}
                  />
                )}
              </section>

              {/* Document Footer */}
              <footer className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
                <span>{t.history.footerText}</span>
                <span className="font-mono">ID: {reportSim.id}</span>
              </footer>
            </article>
          </div>,
          document.body
        )}
    </div>
  );
};
