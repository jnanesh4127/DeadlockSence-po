import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ChevronRight,
  Flame,
  FileText,
  HelpCircle,
  X,
  Play,
  Activity,
  Database,
  Layers,
  BookOpen,
  Clock,
} from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';
import { apiService } from '../services/api.ts';
import { DeadlockRiskResult } from '../algorithms/types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';

interface DashboardOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenHealth: () => void;
  onOpenAuth: () => void;
}

interface RingMetricProps {
  percent: number;
  label: string;
  color: string;
}

const CircularRing: React.FC<RingMetricProps> = ({ percent, label, color }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="3.5"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100 tabular-nums">
        {label}
      </span>
    </div>
  );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [riskData, setRiskData] = useState<DeadlockRiskResult | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const hasAuthenticatedEmail = Boolean(user?.email && user.email.includes('@'));
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Engineer';

  useEffect(() => {
    if (!hasAuthenticatedEmail) {
      setRiskData(null);
      setSavedCount(0);
      return;
    }

    apiService
      .calculateRiskAssessment({
        resourceNames: ['CPU', 'Memory', 'Disk'],
        processNames: ['P0', 'P1', 'P2', 'P3'],
        totalResources: [10, 5, 7],
        allocation: [
          [0, 1, 0],
          [2, 0, 0],
          [3, 0, 2],
          [2, 1, 1],
        ],
        max: [
          [7, 5, 3],
          [3, 2, 2],
          [9, 0, 2],
          [2, 2, 2],
        ],
      })
      .then((res) => setRiskData(res))
      .catch(() => {});

    apiService
      .getSimulations()
      .then((sims) => setSavedCount(sims.length))
      .catch(() => {});
  }, [hasAuthenticatedEmail]);

  const handleLaunchSimulator = (tab: ActiveTab) => {
    onNavigate(tab);
    if (!hasAuthenticatedEmail) {
      onOpenAuth();
    }
  };

  const safetyScore = riskData ? Math.max(5, Math.min(100, 100 - riskData.overallRiskScore)) : 80;
  const safetyLabel = riskData ? `${riskData.riskLevel} RISK` : 'BASELINE SAFE';
  const cpuUtil = riskData?.metrics?.utilizationPercent?.CPU ?? 70;
  const memUtil = riskData?.metrics?.utilizationPercent?.Memory ?? 40;
  const peakContention = riskData
    ? Math.max(...Object.values(riskData.metrics.contentionRate), 1)
    : 2.3;
  const contentionPercent = Math.min(100, Math.round((peakContention / 4) * 100));

  const gaugeRadius = 78;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (safetyScore / 100) * gaugeCircumference;
  const gaugeColor =
    safetyScore >= 70 ? '#10B981' : safetyScore >= 45 ? '#F59E0B' : '#EF4444';

  const modulesTable = [
    {
      id: 'bankers' as ActiveTab,
      letter: 'B',
      badgeBg: 'bg-orange-500',
      title: "Banker's Safety Lab",
      subtitle: '5 processes · 3 resources',
      progress: 100,
      barColor: 'bg-orange-500',
      focus: 'Avoidance',
      status: 'Interactive',
      statusType: 'active' as const,
    },
    {
      id: 'rag' as ActiveTab,
      letter: 'R',
      badgeBg: 'bg-sky-500',
      title: 'RAG & Wait-For Graph',
      subtitle: 'DFS cycle · Single/Multi',
      progress: 85,
      barColor: 'bg-sky-500',
      focus: 'Graph Theory',
      status: 'Interactive',
      statusType: 'active' as const,
    },
    {
      id: 'detection' as ActiveTab,
      letter: 'D',
      badgeBg: 'bg-violet-500',
      title: 'Detection & Recovery',
      subtitle: 'Victim cost · Rollback',
      progress: 75,
      barColor: 'bg-violet-500',
      focus: 'Recovery',
      status: 'Ready',
      statusType: 'ready' as const,
    },
    {
      id: 'practice' as ActiveTab,
      letter: 'P',
      badgeBg: 'bg-emerald-500',
      title: 'OS Lab Exercises',
      subtitle: '4 quizzes · Coffman rules',
      progress: 100,
      barColor: 'bg-emerald-500',
      focus: 'Assessment',
      status: 'Completed',
      statusType: 'done' as const,
    },
  ];

  const coffmanChecklist = [
    { label: 'Mutex', active: true },
    { label: 'Hold', active: true },
    { label: 'NoPre', active: true },
    { label: 'Cycle', active: true },
    { label: 'Banker', active: true },
    { label: 'RAG', active: hasAuthenticatedEmail },
    { label: 'Recov', active: hasAuthenticatedEmail },
  ];

  return (
    <div className="space-y-5">
      {/* Top Mint Banner */}
      {!bannerDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-950 dark:text-emerald-100">
          <p className="leading-relaxed">
            {hasAuthenticatedEmail ? (
              <>
                <span className="font-semibold">Welcome back, {displayName}!</span> System deadlock
                diagnostics and Banker&apos;s safety simulation labs are ready for interactive analysis.
              </>
            ) : (
              <>
                <span className="font-semibold">{t.overview.authBannerTitle}:</span>{' '}
                {t.overview.authBannerDesc}{' '}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="ml-1 font-semibold text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-800 dark:hover:text-emerald-300"
                >
                  {t.gate.signInWithEmail}
                </button>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="rounded-md p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Row 1: 3-Column Bento Summary Cards */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card 1: Overall Safety Gauge */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              {t.overview.riskTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deadlock avoidance &amp; pool safety index
            </p>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center pb-1">
            <div className="relative w-52 h-28 flex items-end justify-center">
              <svg viewBox="0 0 200 112" className="w-full h-full overflow-visible">
                <path
                  d="M 22 98 A 78 78 0 0 1 178 98"
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 22 98 A 78 78 0 0 1 178 98"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                />
              </svg>
              <div className="absolute bottom-2 text-center">
                <div className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {safetyScore}%
                </div>
                <div className="font-mono text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  {safetyLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 3 Stacked Metric Rows with Circular Progress Rings */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                <Cpu className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                Interactive OS Labs
              </span>
            </div>
            <CircularRing percent={100} label="4" color="#10B981" />
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
                <Activity className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  CPU Pool Utilization
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  Allocated capacity
                </div>
              </div>
            </div>
            <CircularRing percent={cpuUtil} label={`${cpuUtil}%`} color="#0EA5E9" />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-500 dark:text-rose-400">
                <Database className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Saved Simulations
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  Cloud Firestore records
                </div>
              </div>
            </div>
            <CircularRing
              percent={Math.min(100, Math.max(15, savedCount * 20))}
              label={String(savedCount)}
              color="#F43F5E"
            />
          </div>
        </div>

        {/* Card 3: 3 Stacked Contention & Readiness Rows */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/70 text-orange-500 dark:text-orange-400">
                <Layers className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Peak Contention Ratio
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  Need / Available
                </div>
              </div>
            </div>
            <CircularRing percent={contentionPercent} label={`${peakContention}x`} color="#F97316" />
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                OS Exercises Ready
              </span>
            </div>
            <CircularRing percent={100} label="4/4" color="#8B5CF6" />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Memory Pool Usage
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  Active system baseline
                </div>
              </div>
            </div>
            <CircularRing percent={memUtil} label={`${memUtil}%`} color="#6366F1" />
          </div>
        </div>
      </section>

      {/* Row 2: Main 8/4 Bento Split */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-start">
        {/* Left 8 Columns */}
        <div className="xl:col-span-8 space-y-5">
          {/* Featured Simulation Labs Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Featured Simulation Labs
              </h3>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Deadlock Avoidance &amp; Graph Analysis
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Lab Row 1 */}
              <div className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <svg viewBox="0 0 64 40" className="h-9 w-14">
                      <rect x="4" y="6" width="16" height="8" rx="2" fill="#10B981" opacity="0.85" />
                      <rect x="24" y="6" width="16" height="8" rx="2" fill="#0EA5E9" opacity="0.7" />
                      <rect x="44" y="6" width="16" height="8" rx="2" className="fill-slate-200 dark:fill-slate-700" />
                      <rect x="4" y="18" width="24" height="6" rx="2" className="fill-slate-300 dark:fill-slate-700" />
                      <rect x="32" y="18" width="28" height="6" rx="2" fill="#10B981" opacity="0.45" />
                      <rect x="4" y="28" width="18" height="6" rx="2" fill="#F59E0B" opacity="0.7" />
                      <rect x="26" y="28" width="34" height="6" rx="2" className="fill-slate-300 dark:fill-slate-700" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.overview.launchBankers} — Matrix &amp; Safety Engine
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                        Avoidance
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Available · Allocation · Max · Need
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    5 Proc · 3 Res
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchSimulator('bankers')}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors whitespace-nowrap"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    Launch
                  </button>
                </div>
              </div>

              {/* Lab Row 2 */}
              <div className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <svg viewBox="0 0 64 40" className="h-9 w-14">
                      <circle cx="14" cy="12" r="5" fill="#0EA5E9" />
                      <circle cx="50" cy="12" r="5" fill="#10B981" />
                      <rect x="27" y="24" width="10" height="10" rx="2" fill="#F59E0B" />
                      <line x1="18" y1="15" x2="27" y2="27" stroke="#64748B" strokeWidth="1.5" />
                      <line x1="37" y1="27" x2="46" y2="15" stroke="#10B981" strokeWidth="1.5" />
                      <line x1="45" y1="12" x2="19" y2="12" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="2 2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.overview.analyzeGraphs} — RAG &amp; Wait-For Topology
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                        Graph Theory
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        DFS cycle detection &amp; multi-instance check
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Interactive Canvas
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    <span>Visual</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchSimulator('rag')}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors whitespace-nowrap"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table Card: System Modules */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                System Modules &amp; Labs (4)
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Click any module to enter workspace
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Module name</th>
                    <th className="pb-3 px-4 font-medium">Coverage</th>
                    <th className="pb-3 px-4 font-medium">Focus</th>
                    <th className="pb-3 pl-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {modulesTable.map((mod) => (
                    <tr
                      key={mod.id}
                      onClick={() =>
                        mod.id === 'practice' ? onNavigate('practice') : handleLaunchSimulator(mod.id)
                      }
                      className="group cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${mod.badgeBg}`}
                          >
                            {mod.letter}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">{mod.subtitle}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 min-w-[120px]">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${mod.barColor}`}
                              style={{ width: `${mod.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                            {mod.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {mod.focus}
                      </td>

                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                              mod.statusType === 'done'
                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : mod.statusType === 'active'
                                ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                                : 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            {mod.statusType === 'done' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {mod.status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="xl:col-span-4 space-y-5">
          {/* Card C: 4 Coffman Conditions & Engine Readiness */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              4 Coffman Conditions Active
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              All four must hold simultaneously for deadlock
            </p>

            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
              {coffmanChecklist.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      item.active
                        ? 'bg-orange-50 dark:bg-orange-950/70 text-orange-500 dark:text-orange-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <Flame className="h-4 w-4 fill-current" />
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>· 4 Coffman conditions</span>
              <span>· 3 solver engines</span>
            </div>
          </div>

          {/* Card D: Quick Scenario Action Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 transition-colors">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Active Scenario Preset
            </h3>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Classic Safe State (Silberschatz)
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400 mr-1.5">
                    Banker&apos;s
                  </span>
                  · 5 Processes · 3 Resources
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Verify Need ≤ Available safety chain</span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => (user ? onNavigate('history') : onOpenAuth())}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span>{user ? 'Saved List' : 'Sign In'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSimulator('bankers')}
                className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                Open Lab
              </button>
            </div>
          </div>

          {/* Card E: OS Practice Quizzes */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                OS Practice Quizzes
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                See all
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Banker&apos;s Safety Check
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">4 questions · 5 min</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('practice')}
                  className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <span>Start</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      RAG Cycle Sufficiency
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Graph theory · 5 min</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('practice')}
                  className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <span>Start</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
