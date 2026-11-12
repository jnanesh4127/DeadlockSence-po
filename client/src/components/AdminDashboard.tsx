import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Download, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Lock, 
  Unlock,
  AlertTriangle,
  Star
} from 'lucide-react';
import { 
  apiService, 
  UserProfileRecord, 
  UserSimulationRecord, 
  FeedbackItem, 
  AdminAnalyticsData 
} from '../services/api.ts';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'users' | 'simulations' | 'feedback'>('analytics');
  
  // Data states
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [users, setUsers] = useState<UserProfileRecord[]>([]);
  const [simulations, setSimulations] = useState<UserSimulationRecord[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, usersData, simsData, fbData] = await Promise.all([
        apiService.getAdminAnalytics(),
        apiService.getAdminUsers(),
        apiService.getAdminSimulations(),
        apiService.getAdminFeedback(),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData);
      setSimulations(simsData);
      setFeedback(fbData);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load administrator records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserDisabled = async (uid: string, currentDisabled: boolean) => {
    setActionLoading(uid);
    try {
      await apiService.toggleUserDisabled(uid, !currentDisabled);
      setUsers(users.map(u => u.uid === uid ? { ...u, disabled: !currentDisabled } : u));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm(`Delete user '${uid}' permanently from system?`)) return;
    setActionLoading(uid);
    try {
      await apiService.deleteUser(uid);
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err: any) {
      alert(`User deletion failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: 'resolved' | 'pending') => {
    setActionLoading(id);
    try {
      await apiService.updateFeedbackStatus(id, status);
      setFeedback(feedback.map(f => f.id === id ? { ...f, status } : f));
    } catch (err: any) {
      alert(`Feedback status update failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Delete this feedback item from database?')) return;
    setActionLoading(id);
    try {
      await apiService.deleteFeedback(id);
      setFeedback(feedback.filter(f => f.id !== id));
    } catch (err: any) {
      alert(`Delete feedback failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadUsersCSV = async () => {
    try {
      const csv = await apiService.exportUsersCSV();
      downloadBlob(csv, 'deadlocksense_users.csv', 'text/csv');
    } catch (err: any) {
      alert(`CSV export failed: ${err.message}`);
    }
  };

  const handleDownloadSimulationsCSV = async () => {
    try {
      const csv = await apiService.exportSimulationsCSV();
      downloadBlob(csv, 'deadlocksense_simulations.csv', 'text/csv');
    } catch (err: any) {
      alert(`CSV export failed: ${err.message}`);
    }
  };

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && !u.disabled;
    if (statusFilter === 'disabled') return matchesSearch && !!u.disabled;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-white">Administrator Control Console</h1>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40">
              {ADMIN_EMAIL}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Protected endpoint for user administration, simulation records, feedback management, and Cloud Firestore analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Firestore
          </button>
          <button
            onClick={handleDownloadUsersCSV}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-400 hover:border-cyan-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Users CSV
          </button>
          <button
            onClick={handleDownloadSimulationsCSV}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-400 hover:border-cyan-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Sims CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeAdminTab === 'analytics'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          System Analytics
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeAdminTab === 'users'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Registered Users ({users.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('simulations')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeAdminTab === 'simulations'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          User Simulations ({simulations.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('feedback')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeAdminTab === 'feedback'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Feedback Submissions ({feedback.length})
        </button>
      </div>

      {/* Tab 1: Analytics */}
      {activeAdminTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Total Users</span>
              <p className="font-mono text-2xl font-bold text-white mt-1">{analytics.totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Total Simulations</span>
              <p className="font-mono text-2xl font-bold text-cyan-400 mt-1">{analytics.totalSimulations}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Pending Feedback</span>
              <p className="font-mono text-2xl font-bold text-amber-400 mt-1">{analytics.pendingFeedback}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Total Feedback</span>
              <p className="font-mono text-2xl font-bold text-blue-400 mt-1">{analytics.totalFeedback}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Simulation Safety Distribution
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-center">
                <span className="text-xs text-emerald-400 font-semibold">Safe Scenarios</span>
                <p className="font-mono text-3xl font-bold text-emerald-300 mt-1">
                  {analytics.safeSimulationsCount}
                </p>
              </div>
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-center">
                <span className="text-xs text-red-400 font-semibold">Unsafe Scenarios</span>
                <p className="font-mono text-3xl font-bold text-red-300 mt-1">
                  {analytics.unsafeSimulationsCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeAdminTab === 'users' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by email, name or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5">
              {(['all', 'active', 'disabled'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                    statusFilter === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Registered</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{u.displayName || 'User'}</div>
                      <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${
                        u.disabled ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.disabled ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        {u.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleUserDisabled(u.uid, !!u.disabled)}
                            disabled={actionLoading === u.uid}
                            title={u.disabled ? 'Enable Account' : 'Disable Account'}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                          >
                            {u.disabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={actionLoading === u.uid}
                            title="Delete User"
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Simulations Management */}
      {activeAdminTab === 'simulations' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Platform Simulations Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {simulations.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">{s.title}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{s.algorithm}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[120px]">{s.userId}</td>
                    <td className="py-2.5 px-3">
                      <span className={s.isSafe ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {s.isSafe ? 'SAFE' : 'UNSAFE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Feedback Management */}
      {activeAdminTab === 'feedback' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            User Feedback &amp; Issues
          </h3>
          <div className="space-y-3">
            {feedback.map(fb => (
              <div
                key={fb.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                      {fb.category.toUpperCase()}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{fb.userEmail}</span>
                    <div className="flex items-center text-amber-400 gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span className="font-mono text-[11px]">{fb.rating}/5</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                      fb.status === 'resolved' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {fb.status}
                    </span>
                    <button
                      onClick={() => handleUpdateFeedbackStatus(fb.id, fb.status === 'resolved' ? 'pending' : 'resolved')}
                      disabled={actionLoading === fb.id}
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:text-white"
                    >
                      {fb.status === 'resolved' ? 'Re-open' : 'Mark Resolved'}
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(fb.id)}
                      disabled={actionLoading === fb.id}
                      className="rounded p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  {fb.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>ID: {fb.id}</span>
                  <span>Submitted: {new Date(fb.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
