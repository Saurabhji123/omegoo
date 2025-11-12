import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import adminApi from '../../services/adminApi';
import { API_BASE_URL } from '../../services/api';

type AdminAccount = {
  id: string;
  email?: string;
  username?: string;
  role?: 'admin' | 'super_admin';
  permissions?: string[];
};

type AdminProps = {
  admin: AdminAccount | null;
  onLogout: () => void;
};

type UserItem = {
  id: string;
  email?: string;
  username?: string;
  tier?: 'guest' | 'user' | 'admin' | 'super_admin';
  coins?: number;
  isBanned?: boolean;
  status?: 'active' | 'banned' | 'suspended';
  reportCount?: number;
  totalChats?: number;
  dailyChats?: number;
  isVerified?: boolean;
  gender?: string;
  createdAt?: string;
  lastSeenAt?: string;
  lastActiveAt?: string;
};

type BanItem = UserItem & {
  banInfo?: {
    reason?: string;
    bannedAt?: string;
    expiresAt?: string | null;
    banType?: 'temporary' | 'permanent';
    duration?: number;
  };
};

type ReportItem = {
  id: string;
  status: string;
  reportedUserEmail?: string;
  reporterUserEmail?: string;
  reason?: string;
};

type Notice = {
  kind: 'success' | 'error' | 'info';
  message: string;
};

type AnalyticsSeries = {
  type: string;
  total: number;
  daily: Array<{ date: string; count: number }>;
};

type CoinAdjustment = {
  id: string;
  userId: string;
  delta: number;
  reason?: string;
  adminId?: string;
  adminUsername?: string;
  previousCoins: number;
  newCoins: number;
  createdAt: string;
};

type BanDraft = {
  userId: string;
  userLabel: string;
  banType: 'temporary' | 'permanent';
  durationHours: number;
  reason: string;
};

const TABS = ['overview', 'users', 'bans', 'reports', 'analytics', 'incidents'] as const;
const ANALYTICS_COLORS = ['#8b5cf6', '#0ea5e9', '#f97316', '#22c55e', '#facc15'];

const toDateTimeInputValue = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffsetMinutes = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - tzOffsetMinutes * 60 * 1000);
  return localTime.toISOString().slice(0, 16);
};

const toIsoIfPresent = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

const AdminDashboard: React.FC<AdminProps> = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('overview');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BanItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [statusSummary, setStatusSummary] = useState<any | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSeries[]>([]);

  const [usersLoading, setUsersLoading] = useState(false);
  const [bansLoading, setBansLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [incidentMsg, setIncidentMsg] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState(14);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [reportStatusDrafts, setReportStatusDrafts] = useState<Record<string, 'pending' | 'reviewed' | 'resolved'>>({});
  const [banDraft, setBanDraft] = useState<BanDraft | null>(null);
  const [coinForm, setCoinForm] = useState<{ delta: string; reason: string }>({ delta: '', reason: '' });
  const [coinHistory, setCoinHistory] = useState<Record<string, CoinAdjustment[]>>({});
  const [incidentPublishAt, setIncidentPublishAt] = useState('');
  const [incidentExpiresAt, setIncidentExpiresAt] = useState('');
  const [incidentRequiresAck, setIncidentRequiresAck] = useState(false);
  const [incidentAudience, setIncidentAudience] = useState<'all' | 'web' | 'mobile'>('all');
  const [incidentFallbackUrl, setIncidentFallbackUrl] = useState('');
  const [roleDraft, setRoleDraft] = useState<'guest' | 'user' | 'admin' | 'super_admin'>('user');
  const [roleUpdating, setRoleUpdating] = useState(false);

  const selectClassName =
    'appearance-none rounded-xl border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-white/90 shadow-sm transition-colors duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60';

  const adminPermissions = Array.isArray(admin?.permissions) ? admin.permissions : [];
  const canManageUsers = admin?.role === 'super_admin' || adminPermissions.includes('manage_users');
  const canManageRoles = admin?.role === 'super_admin';

  const showNotice = useCallback((next: Notice) => {
    setNotice(next);
    window.setTimeout(() => {
      setNotice((current) => (current === next ? null : current));
    }, 4000);
  }, []);

  const fetchStatusSummary = useCallback(async () => {
    try {
      const res = await adminApi.get('/status/summary');
      if (res.data?.success) {
        const summary = res.data.summary ?? null;
        setStatusSummary(summary);

        const latestIncident = summary?.activeIncident || summary?.upcomingIncident;
        if (latestIncident) {
          if (!incidentMsg) {
            setIncidentMsg(latestIncident.message ?? '');
          }
          setIncidentSeverity((latestIncident.severity as any) || 'info');
          setIncidentFallbackUrl(latestIncident.fallbackUrl || '');
          setIncidentPublishAt(toDateTimeInputValue(latestIncident.publishAt));
          setIncidentExpiresAt(toDateTimeInputValue(latestIncident.expiresAt));
          setIncidentRequiresAck(Boolean(latestIncident.requiresAck));
          setIncidentAudience((latestIncident.audience as 'all' | 'web' | 'mobile') || 'all');
        }
      }
    } catch (err) {
      console.error('Status summary fetch failed', err);
    }
  }, [incidentMsg]);

  const fetchUsers = useCallback(
    async (query?: string) => {
      setUsersLoading(true);
      try {
        const params: Record<string, string> = {};
        if (query) {
          params.search = query;
        }
        if (userStatusFilter !== 'all') {
          params.status = userStatusFilter;
        }

        const res = await adminApi.get('/users', {
          params: Object.keys(params).length ? params : undefined
        });

        if (res.data?.success) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Fetch users failed', err);
        showNotice({ kind: 'error', message: 'Unable to load users right now.' });
      } finally {
        setUsersLoading(false);
      }
    },
    [showNotice, userStatusFilter]
  );

  const fetchBannedUsers = useCallback(async () => {
    setBansLoading(true);
    try {
      const res = await adminApi.get('/bans');
      if (res.data?.success) {
        setBannedUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Fetch bans failed', err);
      showNotice({ kind: 'error', message: 'Unable to load banned users.' });
    } finally {
      setBansLoading(false);
    }
  }, [showNotice]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params: { limit: number; status?: string } = { limit: 200 };
      if (reportStatusFilter !== 'all') {
        params.status = reportStatusFilter;
      }

      const res = await adminApi.get('/reports', { params });
      if (res.data?.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Fetch reports failed', err);
      showNotice({ kind: 'error', message: 'Unable to load reports.' });
    } finally {
      setReportsLoading(false);
    }
  }, [reportStatusFilter, showNotice]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [statsRes, summaryRes] = await Promise.all([
        adminApi.get('/analytics'),
        adminApi.get('/analytics/summary', { params: { days: analyticsRange } })
      ]);

      if (statsRes.data?.success) {
        setAnalytics(statsRes.data.data || statsRes.data.summary || null);
      }

      if (summaryRes.data?.success) {
        setAnalyticsSummary(summaryRes.data.summary || []);
      }
    } catch (err) {
      console.error('Fetch analytics failed', err);
      showNotice({ kind: 'error', message: 'Unable to load analytics.' });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange, showNotice]);

  const fetchCoinHistory = useCallback(async (userId: string) => {
    try {
      const res = await adminApi.get(`/users/${userId}/coins/history`, { params: { limit: 25 } });
      if (res.data?.success) {
        setCoinHistory((current) => ({
          ...current,
          [userId]: res.data.history || []
        }));
      }
    } catch (err) {
      console.error('Fetch coin history failed', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalytics();
      fetchStatusSummary();
    }
    if (activeTab === 'users') {
      fetchUsers(search);
    }
    if (activeTab === 'bans') {
      fetchBannedUsers();
    }
    if (activeTab === 'reports') {
      fetchReports();
    }
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics, fetchBannedUsers, fetchReports, fetchUsers, fetchStatusSummary, search]);

  useEffect(() => {
    const drafts: Record<string, 'pending' | 'reviewed' | 'resolved'> = {};
    reports.forEach((report) => {
      const status = (['pending', 'reviewed', 'resolved'] as const).includes(report.status as any)
        ? (report.status as 'pending' | 'reviewed' | 'resolved')
        : 'pending';
      drafts[report.id] = status;
    });
    setReportStatusDrafts(drafts);
  }, [reports]);

  useEffect(() => {
    if (selectedUser) {
      fetchCoinHistory(selectedUser.id);
      setCoinForm({ delta: '', reason: '' });
    }
  }, [fetchCoinHistory, selectedUser]);

  useEffect(() => {
    if (selectedUser?.tier) {
      setRoleDraft(selectedUser.tier as 'guest' | 'user' | 'admin' | 'super_admin');
    } else {
      setRoleDraft('user');
    }
  }, [selectedUser]);

  const overviewMetrics = useMemo(() => {
    const items: { label: string; value: React.ReactNode }[] = [];

    const totalUsers = analytics?.totalUsers ?? analytics?.users?.total ?? null;
    if (typeof totalUsers === 'number') {
      items.push({ label: 'Total Users', value: totalUsers.toLocaleString() });
    }

    const activeUsers = analytics?.activeUsers ?? analytics?.users?.active ?? null;
    if (typeof activeUsers === 'number') {
      items.push({ label: 'Active Users', value: activeUsers.toLocaleString() });
    }

    const matchesToday = analytics?.matchesToday ?? analytics?.matches?.today ?? null;
    if (typeof matchesToday === 'number') {
      items.push({ label: 'Matches Today', value: matchesToday.toLocaleString() });
    }

    const activeIncident = statusSummary?.activeIncident;
    if (activeIncident) {
      items.push({ label: 'Open Incidents', value: 1 });
    }

    if (!activeIncident && statusSummary?.upcomingIncident) {
      const publishEta = statusSummary.upcomingIncident.publishAt
        ? new Date(statusSummary.upcomingIncident.publishAt).toLocaleString()
        : 'Pending';
      items.push({ label: 'Scheduled Incident', value: publishEta });
    }

    const queueTotal =
      statusSummary?.queues?.totalWaiting ??
      statusSummary?.queues?.total ??
      statusSummary?.queue?.total ??
      null;

    if (typeof queueTotal === 'number') {
      items.push({ label: 'Queued Users', value: queueTotal });
    }

    const revenue30 = analytics?.revenueLast30d ?? analytics?.revenue?.last30d ?? null;
    if (typeof revenue30 === 'number') {
      items.push({ label: 'Revenue · 30d', value: `₹${revenue30.toLocaleString()}` });
    }

    return items.slice(0, 6);
  }, [analytics, statusSummary]);

  const analyticPairs = useMemo(() => {
    if (!analytics || typeof analytics !== 'object') return [] as { key: string; value: React.ReactNode }[];

    const pairs: { key: string; value: React.ReactNode }[] = [];

    const entries = Object.entries(analytics as Record<string, any>);
    entries.forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (typeof value === 'number') {
        pairs.push({ key, value: value.toLocaleString() });
        return;
      }
      if (typeof value === 'string') {
        pairs.push({ key, value });
        return;
      }
      if (Array.isArray(value)) {
        pairs.push({ key, value: `${value.length} items` });
        return;
      }
      if (typeof value === 'object') {
        const nestedNumbers = Object.entries(value).filter(([, v]) => typeof v === 'number');
        if (nestedNumbers.length) {
          pairs.push({
            key,
            value: (
              <div className="grid gap-2 text-xs text-white/70">
                {nestedNumbers.map(([nestedKey, nestedValue]) => (
                  <div key={`${key}-${nestedKey}`} className="flex items-center justify-between">
                    <span className="uppercase tracking-wide text-white/50">{nestedKey}</span>
                    <span className="font-semibold text-white/80">{(nestedValue as number).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )
          });
        }
      }
    });

    return pairs;
  }, [analytics]);

  const selectedCoinHistory = useMemo(() => {
    if (!selectedUser) {
      return [] as CoinAdjustment[];
    }
    return coinHistory[selectedUser.id] || [];
  }, [coinHistory, selectedUser]);

  const analyticsChartData = useMemo(() => {
    if (!analyticsSummary.length) {
      return [] as Array<Record<string, number | string>>;
    }

    const buckets = new Map<string, Record<string, number | string>>();
    analyticsSummary.forEach((series) => {
      series.daily.forEach(({ date, count }) => {
        if (!buckets.has(date)) {
          buckets.set(date, { date });
        }
        const bucket = buckets.get(date)!;
        bucket[series.type] = count;
      });
    });

    return Array.from(buckets.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [analyticsSummary]);

  const analyticsSeriesKeys = useMemo(() => analyticsSummary.map((series) => series.type), [analyticsSummary]);

  const openBanModal = (user: UserItem) => {
    const label = user.email || user.username || user.id;
    setBanDraft({
      userId: user.id,
      userLabel: label,
      banType: 'temporary',
      durationHours: 24,
      reason: 'Manual ban via admin panel'
    });
  };

  const closeBanModal = () => setBanDraft(null);

  const submitBanDraft = async () => {
    if (!banDraft) {
      return;
    }

    const payload: {
      userId: string;
      banType: 'temporary' | 'permanent';
      duration?: number;
      reason?: string;
    } = {
      userId: banDraft.userId,
      banType: banDraft.banType,
      reason: banDraft.reason.trim() || 'Manual ban via admin panel'
    };

    if (banDraft.banType === 'temporary') {
      const seconds = Math.max(1, banDraft.durationHours) * 3600;
      payload.duration = seconds;
    }

    try {
      setActionLoading(true);
      const res = await adminApi.post('/ban', payload);
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'User banned successfully.' });
        await Promise.all([fetchUsers(search), fetchBannedUsers()]);
      }
    } catch (err: any) {
      console.error('Ban failed', err);
      const message = err?.response?.data?.error || 'Ban failed.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
      closeBanModal();
    }
  };

  const handleRoleUpdate = async (nextRole: 'guest' | 'user' | 'admin' | 'super_admin') => {
    if (!selectedUser) {
      return;
    }

    if (!canManageRoles) {
      showNotice({ kind: 'error', message: 'Only super admins can modify roles.' });
      return;
    }

    const currentTier = (selectedUser.tier as 'guest' | 'user' | 'admin' | 'super_admin') || 'user';
    if (nextRole === currentTier) {
      showNotice({ kind: 'info', message: 'User already has this role.' });
      return;
    }

    if (nextRole === 'super_admin') {
      const confirmed = window.confirm('Promote this user to super admin? Only two super admins are allowed at a time.');
      if (!confirmed) {
        return;
      }
    }

    if (currentTier === 'super_admin' && nextRole !== 'super_admin') {
      const confirmed = window.confirm('Demote this super admin? Existing sessions will immediately lose elevated access.');
      if (!confirmed) {
        return;
      }
    }

    try {
      setRoleUpdating(true);
      const res = await adminApi.put(`/users/${selectedUser.id}/role`, { role: nextRole });

      if (res.data?.success) {
        const refreshedTier = (res.data?.user?.tier as 'guest' | 'user' | 'admin' | 'super_admin') || nextRole;

        setSelectedUser((current) =>
          current && current.id === selectedUser.id
            ? { ...current, tier: refreshedTier }
            : current
        );

        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id
              ? { ...user, tier: refreshedTier }
              : user
          )
        );

        setRoleDraft(refreshedTier);
        showNotice({ kind: 'success', message: 'Role updated successfully.' });
      }
    } catch (err: any) {
      console.error('Role update failed', err);
      const message = err?.response?.data?.error || 'Failed to update role.';
      showNotice({ kind: 'error', message });
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleCoinAdjust = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      return;
    }

    if (!canManageUsers) {
      showNotice({ kind: 'error', message: 'Only super admins can adjust coins manually.' });
      return;
    }

    const deltaValue = Number(coinForm.delta);
    if (!Number.isFinite(deltaValue) || deltaValue === 0) {
      showNotice({ kind: 'error', message: 'Enter a non-zero numeric delta.' });
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminApi.post(`/users/${selectedUser.id}/coins`, {
        delta: deltaValue,
        reason: coinForm.reason.trim() || undefined
      });

      if (res.data?.success) {
        const updatedUser = res.data.user as UserItem | undefined;
        const adjustment = res.data.adjustment as CoinAdjustment | undefined;

        if (updatedUser) {
          setSelectedUser((current) => (current && current.id === updatedUser.id ? { ...current, coins: updatedUser.coins } : current));
          setUsers((current) =>
            current.map((user) =>
              user.id === updatedUser.id
                ? { ...user, coins: updatedUser.coins }
                : user
            )
          );
        }

        if (adjustment) {
          setCoinHistory((current) => {
            const existing = current[selectedUser.id] || [];
            return {
              ...current,
              [selectedUser.id]: [adjustment, ...existing].slice(0, 25)
            };
          });
        } else {
          fetchCoinHistory(selectedUser.id);
        }

        setCoinForm({ delta: '', reason: '' });
        showNotice({ kind: 'success', message: 'Coins updated.' });
      }
    } catch (err: any) {
      console.error('Coin adjustment failed', err);
      const message = err?.response?.data?.error || 'Failed to adjust coins.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!window.confirm('Unban this user?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminApi.post('/unban', { userId });
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'User unbanned.' });
        fetchUsers(search);
        fetchBannedUsers();
      }
    } catch (err: any) {
      console.error('Unban failed', err);
      const message = err?.response?.data?.error || 'Unban failed.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!canManageUsers) {
      showNotice({ kind: 'error', message: 'Only super admins can delete accounts from the dashboard.' });
      return;
    }

    if (!window.confirm('Delete this user permanently? This cannot be undone.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminApi.delete(`/users/${userId}`);
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'User deleted.' });
        fetchUsers(search);
        fetchBannedUsers();
      }
    } catch (err: any) {
      console.error('Delete user failed', err);
      const message = err?.response?.data?.error || 'Delete failed.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    nextStatus: 'pending' | 'reviewed' | 'resolved'
  ) => {
    try {
      setActionLoading(true);
      const res = await adminApi.patch(`/reports/${reportId}`, { status: nextStatus });
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'Report updated.' });
        await fetchReports();
      }
    } catch (err: any) {
      console.error('Update report failed', err);
      const message = err?.response?.data?.error || 'Update failed.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const publishIncident = async () => {
    if (!incidentMsg.trim()) {
      showNotice({ kind: 'error', message: 'Incident message required.' });
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminApi.put('/status/incident', {
        incident: {
          message: incidentMsg,
          severity: incidentSeverity,
          publishAt: toIsoIfPresent(incidentPublishAt) || undefined,
          expiresAt: toIsoIfPresent(incidentExpiresAt) || undefined,
          requiresAck: incidentRequiresAck,
          audience: incidentAudience,
          fallbackUrl: incidentFallbackUrl.trim() || undefined
        }
      });
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'Incident banner live.' });
        setIncidentMsg('');
        fetchStatusSummary();
      }
    } catch (err: any) {
      console.error('Publish incident failed', err);
      const message = err?.response?.data?.error || 'Failed to publish incident.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const clearIncident = async () => {
    if (!window.confirm('Clear the active incident banner?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminApi.delete('/status/incident');
      if (res.data?.success) {
        showNotice({ kind: 'success', message: 'Incident cleared.' });
        fetchStatusSummary();
      }
    } catch (err: any) {
      console.error('Clear incident failed', err);
      const message = err?.response?.data?.error || 'Failed to clear incident.';
      showNotice({ kind: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const incidentActive = statusSummary?.activeIncident || statusSummary?.incident || null;
  const incidentUpcoming = statusSummary?.upcomingIncident || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 py-8 px-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-indigo-950/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/70">
                Welcome back,{' '}
                <span className="font-medium text-white/90">{admin?.username || admin?.email || 'Admin'}</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {incidentActive && (
                <div className="rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-amber-100">
                  Active Incident: {incidentActive.message}
                </div>
              )}
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-red-900/30 transition hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-white/70">
            {TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-900/40'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </nav>
        </header>

        {notice && (
          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm shadow-md backdrop-blur ${
              notice.kind === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50'
                : notice.kind === 'error'
                ? 'border-rose-400/40 bg-rose-500/15 text-rose-50'
                : 'border-indigo-400/40 bg-indigo-500/15 text-indigo-50'
            }`}
          >
            <span>{notice.message}</span>
            <button
              onClick={() => setNotice(null)}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
          {activeTab === 'overview' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {overviewMetrics.length === 0 && !analyticsLoading && (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-white/60">
                    No overview metrics yet.
                  </div>
                )}
                {overviewMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 via-white/5 to-transparent p-5 shadow-lg shadow-indigo-950/40 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
                  >
                    <p className="text-xs uppercase tracking-wide text-white/60">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <h3 className="text-lg font-semibold text-white">Realtime Queues</h3>
                  <p className="text-xs uppercase tracking-wide text-white/50">Users waiting per mode</p>
                  <div className="mt-4 space-y-2">
                    {(() => {
                      const queueBreakdown =
                        statusSummary?.queues?.queues ??
                        statusSummary?.queue ??
                        null;

                      if (!queueBreakdown) {
                        return (
                          <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/60">
                            No queue telemetry available.
                          </div>
                        );
                      }

                      const entries = Object.entries(queueBreakdown as Record<string, number>)
                        .filter(([mode]) => mode !== 'total' && mode !== 'totalWaiting');

                      if (entries.length === 0) {
                        return (
                          <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/60">
                            No queue telemetry available.
                          </div>
                        );
                      }

                      return entries.map(([mode, value]) => (
                        <div key={mode} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                          <span className="uppercase tracking-wide text-white/60">{mode}</span>
                          <span className="text-lg font-semibold text-white">{value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <h3 className="text-lg font-semibold text-white">Active Incident</h3>
                  {incidentActive ? (
                    <div className="mt-4 space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-wide text-white/70">
                        Severity: {incidentActive.severity}
                      </div>
                      <p className="text-sm text-white/80">{incidentActive.message}</p>
                      {incidentActive.startedAt && (
                        <p className="text-xs text-white/50">
                          Started {new Date(incidentActive.startedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
                      No active incident banners.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    fetchUsers(search.trim() || undefined);
                  }}
                  className="flex flex-wrap gap-3"
                >
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by email, username, or ID"
                    className="min-w-[240px] rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <select
                    value={userStatusFilter}
                    onChange={(event) => setUserStatusFilter(event.target.value as 'all' | 'active' | 'banned')}
                    className={`${selectClassName} rounded-full`}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-400 hover:to-indigo-400"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setUserStatusFilter('all');
                      fetchUsers();
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Show All
                  </button>
                </form>
                <div className="text-xs uppercase tracking-wide text-white/60">
                  {usersLoading ? 'Loading users…' : `${users.length} users loaded`}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full text-sm text-white">
                    <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
                      <tr>
                        <th className="px-4 py-3">User ID</th>
                        <th className="px-4 py-3">Identity</th>
                        <th className="px-4 py-3">Coins</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {usersLoading && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-white/60">
                            Fetching users…
                          </td>
                        </tr>
                      )}
                      {!usersLoading && users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-white/60">
                            No users found.
                          </td>
                        </tr>
                      )}
                      {!usersLoading &&
                        users.map((user) => (
                          <tr key={user.id} className="transition hover:bg-white/10">
                            <td className="px-4 py-3 font-mono text-xs text-white/70">{user.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-white/90">{user.email || user.username || '—'}</span>
                                {user.email && user.username && (
                                  <span className="text-xs text-white/50">{user.username}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white/80">{user.coins ?? '—'}</td>
                            <td className="px-4 py-3 text-white/80">{user.tier ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                                >
                                  Inspect
                                </button>
                                {!user.isBanned ? (
                                  <button
                                    onClick={() => openBanModal(user)}
                                    disabled={actionLoading}
                                    className="rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-red-900/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Ban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnban(user.id)}
                                    disabled={actionLoading}
                                    className="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Unban
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={actionLoading || !canManageUsers}
                                  className={`rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 ${!canManageUsers ? 'opacity-40 cursor-not-allowed hover:bg-white/10' : ''}`}
                                  title={canManageUsers ? 'Delete user' : 'Super admin only'}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedUser && (
                <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">User snapshot</h3>
                      <p className="text-xs uppercase tracking-wide text-white/50">Internal reference view</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <StatChip label="User ID" value={selectedUser.id} />
                    <StatChip label="Email" value={selectedUser.email || '—'} />
                    <StatChip label="Username" value={selectedUser.username || '—'} />
                    <StatChip label="Tier" value={selectedUser.tier || '—'} />
                    <StatChip label="Coins" value={selectedUser.coins ?? '—'} />
                    <StatChip label="Status" value={selectedUser.isBanned ? 'Banned' : 'Active'} tone={selectedUser.isBanned ? 'warning' : 'info'} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Role &amp; access</h4>
                        <p className="text-xs text-white/60">Promote or demote this account to adjust admin capabilities.</p>
                      </div>
                      {canManageRoles ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={roleDraft}
                            onChange={(event) => setRoleDraft(event.target.value as 'guest' | 'user' | 'admin' | 'super_admin')}
                            className={`${selectClassName} rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide`}
                          >
                            <option value="guest">Guest</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRoleUpdate(roleDraft)}
                            disabled={roleUpdating || roleDraft === (selectedUser.tier as 'guest' | 'user' | 'admin' | 'super_admin')}
                            className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {roleUpdating ? 'Updating…' : 'Update role'}
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                          Super admin only
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-white/50">
                      Super admins are capped at two accounts. Admins inherit user passwords and must login with their regular Omegoo credentials.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {canManageUsers ? (
                      <form onSubmit={handleCoinAdjust} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <h4 className="text-sm font-semibold text-white">Adjust coins</h4>
                        <p className="mt-1 text-xs text-white/60">Positive values grant coins, negative values deduct.</p>
                        <div className="mt-4 flex flex-col gap-3">
                          <div className="flex flex-wrap gap-3">
                            <input
                              type="number"
                              step="1"
                              value={coinForm.delta}
                              onChange={(event) => setCoinForm((current) => ({ ...current, delta: event.target.value }))}
                              placeholder="e.g. +10 or -5"
                              className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none sm:w-40"
                            />
                            <input
                              value={coinForm.reason}
                              onChange={(event) => setCoinForm((current) => ({ ...current, reason: event.target.value }))}
                              placeholder="Reason (optional)"
                              className="flex-1 min-w-[160px] rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Apply adjustment
                            </button>
                            <button
                              type="button"
                              onClick={() => setCoinForm({ delta: '', reason: '' })}
                              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                        Coin adjustments are restricted to super admins.
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <h4 className="text-sm font-semibold text-white">Adjustment history</h4>
                      <p className="mt-1 text-xs text-white/60">Most recent 25 manual changes.</p>
                      <div className="mt-4 space-y-3">
                        {selectedCoinHistory.length === 0 ? (
                          <p className="rounded-xl bg-white/5 px-4 py-3 text-xs text-white/60">No manual adjustments recorded.</p>
                        ) : (
                          selectedCoinHistory.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className={entry.delta >= 0 ? 'font-semibold text-emerald-300' : 'font-semibold text-rose-300'}>
                                  {entry.delta >= 0 ? '+' : ''}{entry.delta}
                                </span>
                                <span className="text-white/60">
                                  {entry.previousCoins} → {entry.newCoins}
                                </span>
                              </div>
                              {entry.reason && (
                                <p className="mt-2 text-white/70">{entry.reason}</p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
                                <span>{new Date(entry.createdAt).toLocaleString()}</span>
                                {entry.adminUsername && (
                                  <span>By {entry.adminUsername}</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bans' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Banned users</h2>
                <button
                  onClick={fetchBannedUsers}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {bansLoading && (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                    Loading banned users…
                  </div>
                )}
                {!bansLoading && bannedUsers.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                    No users are currently banned.
                  </div>
                )}
                {!bansLoading &&
                  bannedUsers.map((user) => (
                    <div key={user.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/15 via-white/5 to-transparent p-5 shadow-lg shadow-red-900/30 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-red-300/40 hover:shadow-2xl">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/60">User</p>
                          <p className="text-sm text-white/90">{user.email || user.username || user.id}</p>
                        </div>
                        <span className="rounded-full bg-red-500/60 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
                          Banned
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 text-xs text-white/70">
                        <StatLine label="Reason" value={user.banInfo?.reason || '—'} />
                        <StatLine
                          label="Banned at"
                          value={user.banInfo?.bannedAt ? new Date(user.banInfo.bannedAt).toLocaleString() : '—'}
                        />
                        <StatLine
                          label="Expires"
                          value={
                            user.banInfo?.banType === 'temporary'
                              ? user.banInfo?.expiresAt
                                ? new Date(user.banInfo.expiresAt).toLocaleString()
                                : 'Duration unknown'
                              : 'Permanent'
                          }
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUnban(user.id)}
                          disabled={actionLoading}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/40 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Unban user
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                        >
                          Inspect profile
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">User reports</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={reportStatusFilter}
                    onChange={(event) => setReportStatusFilter(event.target.value as 'all' | 'pending' | 'reviewed' | 'resolved')}
                    className={`${selectClassName} rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide`}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="all">All</option>
                  </select>
                  <button
                    onClick={fetchReports}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {reportsLoading && (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                    Loading reports…
                  </div>
                )}
                {!reportsLoading && reports.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                    No reports awaiting review.
                  </div>
                )}
                {!reportsLoading &&
                  reports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 via-white/5 to-transparent p-5 shadow-lg shadow-purple-950/30 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">Report ID</p>
                          <p className="font-mono text-sm text-white/80">{report.id}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                          {report.status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">Against</p>
                          <p>{report.reportedUserEmail || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/50">Reported by</p>
                          <p>{report.reporterUserEmail || '—'}</p>
                        </div>
                      </div>
                      {report.reason && (
                        <p className="mt-4 rounded-xl bg-black/30 p-4 text-sm text-white/80">{report.reason}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <select
                          value={reportStatusDrafts[report.id] || report.status}
                          onChange={(event) =>
                            setReportStatusDrafts((current) => ({
                              ...current,
                              [report.id]: event.target.value as 'pending' | 'reviewed' | 'resolved'
                            }))
                          }
                          className={`${selectClassName} rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => updateReportStatus(report.id, reportStatusDrafts[report.id] || 'resolved')}
                          disabled={actionLoading}
                          className="rounded-full bg-emerald-500/80 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Update status
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold">Analytics snapshot</h2>
                  <select
                    value={analyticsRange}
                    onChange={(event) => setAnalyticsRange(Number(event.target.value))}
                    className={`${selectClassName} rounded-full px-4 py-2 text-xs font-semibold`}
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
                <button
                  onClick={fetchAnalytics}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>

              {analyticsLoading && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                  Loading analytics…
                </div>
              )}

              {!analyticsLoading && analyticPairs.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-white/60">
                  No analytics data ready yet.
                </div>
              )}

              {!analyticsLoading && analyticPairs.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {analyticPairs.map((pair) => (
                    <div key={pair.key} className="rounded-2xl border border-white/10 bg-black/30 p-5 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">
                      <p className="text-xs uppercase tracking-wide text-white/50">{pair.key}</p>
                      <div className="mt-3 text-sm text-white/80">{pair.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {!analyticsLoading && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 transition-transform duration-300 ease-out hover:border-white/20 hover:shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Daily trends</h3>
                      <p className="text-xs uppercase tracking-wide text-white/50">Past {analyticsRange} days</p>
                    </div>
                  </div>
                  <div className="mt-4 h-72">
                    {analyticsChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsChartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#cbd5f5" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                          <YAxis allowDecimals={false} stroke="#cbd5f5" tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                          <Tooltip labelStyle={{ color: '#111827' }} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
                          <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                          {analyticsSeriesKeys.map((key, index) => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 5 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/60">
                        No event telemetry for the selected window.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6 text-white animate-fade-in">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Incident broadcast</h2>
                  <p className="text-sm text-white/60">Push critical messages to every user instantly.</p>
                </div>
                <a
                  href={`${API_BASE_URL}/api/status/summary`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  View status API
                </a>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <label className="text-xs uppercase tracking-wide text-white/50">Incident message</label>
                <textarea
                  value={incidentMsg}
                  onChange={(event) => setIncidentMsg(event.target.value)}
                  className="mt-2 h-32 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Describe the issue, impact, and mitigation plan."
                />

                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs uppercase tracking-wide text-white/50">Severity</label>
                    <select
                      value={incidentSeverity}
                      onChange={(event) => setIncidentSeverity(event.target.value as any)}
                      className={`${selectClassName} rounded-full px-4 py-2`}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={publishIncident}
                      disabled={actionLoading}
                      className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Publish alert
                    </button>
                    <button
                      onClick={clearIncident}
                      disabled={actionLoading}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Clear banner
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="flex flex-col text-xs uppercase tracking-wide text-white/50">
                      Publish at
                      <span className="text-[11px] normal-case text-white/40">Leave blank to publish immediately.</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={incidentPublishAt}
                      onChange={(event) => setIncidentPublishAt(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex flex-col text-xs uppercase tracking-wide text-white/50">
                      Auto-expire at
                      <span className="text-[11px] normal-case text-white/40">Optional end-of-life for the banner.</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={incidentExpiresAt}
                      onChange={(event) => setIncidentExpiresAt(event.target.value)}
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-white/50">Target audience</label>
                    <select
                      value={incidentAudience}
                      onChange={(event) => setIncidentAudience(event.target.value as 'all' | 'web' | 'mobile')}
                      className={`${selectClassName} w-full`}
                    >
                      <option value="all">All clients</option>
                      <option value="web">Web only</option>
                      <option value="mobile">Mobile only</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-white/50">Fallback link</label>
                    <input
                      type="url"
                      value={incidentFallbackUrl}
                      onChange={(event) => setIncidentFallbackUrl(event.target.value)}
                      placeholder="Status page or help doc"
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={incidentRequiresAck}
                      onChange={(event) => setIncidentRequiresAck(event.target.checked)}
                      className="h-4 w-4 rounded border-white/30 bg-black/60 text-indigo-500 focus:ring-indigo-500"
                    />
                    Require in-app acknowledgement before the user can continue.
                  </label>
                </div>
              </div>

              {incidentUpcoming && (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Scheduled incident</h3>
                      <p className="text-xs uppercase tracking-wide text-white/50">
                        Publishes {incidentUpcoming.publishAt ? new Date(incidentUpcoming.publishAt).toLocaleString() : 'when manually triggered'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                      {incidentUpcoming.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">{incidentUpcoming.message}</p>
                  <div className="mt-4 grid gap-3 text-xs text-white/60 md:grid-cols-2">
                    {incidentUpcoming.expiresAt && <div>Expires {new Date(incidentUpcoming.expiresAt).toLocaleString()}</div>}
                    {incidentUpcoming.audience && <div>Audience · {incidentUpcoming.audience}</div>}
                    {incidentUpcoming.requiresAck ? <div>Requires acknowledgement</div> : <div>No acknowledgement needed</div>}
                    {incidentUpcoming.fallbackUrl && (
                      <a
                        href={incidentUpcoming.fallbackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 underline"
                      >
                        View fallback link
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {banDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-black to-slate-900 p-6 text-white shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Confirm ban</h3>
                  <p className="text-sm text-white/60">{banDraft.userLabel}</p>
                </div>
                <button onClick={closeBanModal} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white">
                  Close
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitBanDraft();
                }}
                className="mt-6 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-white/50">Ban duration</label>
                  <select
                    value={banDraft.banType}
                    onChange={(event) =>
                      setBanDraft((current) =>
                        current ? { ...current, banType: event.target.value as 'temporary' | 'permanent' } : current
                      )
                    }
                    className={`${selectClassName} w-full focus:border-red-400 focus:ring-red-400/30`}
                  >
                    <option value="temporary">Temporary</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>

                {banDraft.banType === 'temporary' && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-white/50">Duration (hours)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={banDraft.durationHours}
                      onChange={(event) =>
                        setBanDraft((current) =>
                          current ? { ...current, durationHours: Number(event.target.value) || current.durationHours } : current
                        )
                      }
                      className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus:border-red-400 focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-white/50">Reason</label>
                  <textarea
                    value={banDraft.reason}
                    onChange={(event) =>
                      setBanDraft((current) => (current ? { ...current, reason: event.target.value } : current))
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-red-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeBanModal}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Confirm ban
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type StatChipProps = {
  label: string;
  value: React.ReactNode;
  tone?: 'info' | 'warning';
};

const StatChip: React.FC<StatChipProps> = ({ label, value, tone = 'info' }) => {
  const toneClass = tone === 'warning' ? 'border-amber-400/40 bg-amber-500/20 text-amber-50' : 'border-white/15 bg-white/5 text-white/80';
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

type StatLineProps = {
  label: string;
  value: React.ReactNode;
};

const StatLine: React.FC<StatLineProps> = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
    <span className="uppercase tracking-wide text-white/50">{label}</span>
    <span className="text-white/80">{value}</span>
  </div>
);

export default AdminDashboard;


