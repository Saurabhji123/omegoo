import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ExclamationTriangleIcon, 
  BanknotesIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  totalReports: number;
  pendingReports: number;
  revenue: number;
  moderationActions: number;
}

interface RecentReport {
  id: string;
  sessionId: string;
  reportType: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  userId: string;
}

interface OnlineUser {
  id: string;
  tier: number;
  status: 'active' | 'in_chat' | 'queue';
  lastActivity: string;
  sessionId?: string;
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalReports: 0,
    pendingReports: 0,
    revenue: 0,
    moderationActions: 0
  });

  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'reports' | 'moderation' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual API endpoints
      setStats({
        totalUsers: 12450,
        activeUsers: 234,
        totalSessions: 8765,
        activeSessions: 45,
        totalReports: 128,
        pendingReports: 12,
        revenue: 85420,
        moderationActions: 67
      });

      setRecentReports([
        {
          id: '1',
          sessionId: 'sess_123',
          reportType: 'inappropriate_content',
          description: 'User showing inappropriate content',
          status: 'pending',
          createdAt: new Date().toISOString(),
          userId: 'user_456'
        },
        {
          id: '2',
          sessionId: 'sess_124',
          reportType: 'harassment',
          description: 'Verbal harassment and threats',
          status: 'reviewed',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          userId: 'user_789'
        }
      ]);

      setOnlineUsers([
        {
          id: 'user_001',
          tier: 2,
          status: 'in_chat',
          lastActivity: new Date().toISOString(),
          sessionId: 'sess_active_1'
        },
        {
          id: 'user_002',
          tier: 1,
          status: 'queue',
          lastActivity: new Date(Date.now() - 120000).toISOString()
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss' | 'ban_user') => {
    try {
      // Simulate API call
      console.log(`Taking action ${action} on report ${reportId}`);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to handle report action:', error);
    }
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {typeof value === 'number' && title.includes('Revenue') ? `₹${value.toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ClockIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'users', label: 'Users', icon: UsersIcon },
            { id: 'reports', label: 'Reports', icon: ExclamationTriangleIcon },
            { id: 'moderation', label: 'Moderation', icon: ShieldCheckIcon },
            { id: 'analytics', label: 'Analytics', icon: DocumentTextIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<UsersIcon className="h-6 w-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<EyeIcon className="h-6 w-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Active Sessions"
              value={stats.activeSessions}
              icon={<ClockIcon className="h-6 w-6 text-white" />}
              color="bg-yellow-500"
            />
            <StatCard
              title="Pending Reports"
              value={stats.pendingReports}
              icon={<ExclamationTriangleIcon className="h-6 w-6 text-white" />}
              color="bg-red-500"
            />
          </div>

          {/* Revenue and Moderation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Revenue (This Month)"
              value={stats.revenue}
              icon={<BanknotesIcon className="h-6 w-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Moderation Actions"
              value={stats.moderationActions}
              icon={<ShieldCheckIcon className="h-6 w-6 text-white" />}
              color="bg-indigo-500"
            />
          </div>

          {/* Recent Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Reports</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.reportType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Session: {report.sessionId} | User: {report.userId}
                      </p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReportAction(report.id, 'approve')}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'ban_user')}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Ban User
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Online Users</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        user.status === 'active' ? 'bg-green-500' :
                        user.status === 'in_chat' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          User {user.id} (Tier {user.tier})
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {user.status} | Last activity: {new Date(user.lastActivity).toLocaleTimeString()}
                        </p>
                        {user.sessionId && (
                          <p className="text-xs text-gray-500">Session: {user.sessionId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        View Details
                      </button>
                      <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                        Ban User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {selectedTab !== 'overview' && selectedTab !== 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} section coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default Admin;