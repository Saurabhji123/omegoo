import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalReports: number;
  pendingReports: number;
  totalSessions: number;
}

interface Report {
  id: string;
  sessionId: string;
  reportedUserId: string;
  reporterUserId: string;
  violationType: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

interface BannedUser {
  id: string;
  deviceId: string;
  status: string;
  banInfo: {
    banType: 'temporary' | 'permanent';
    bannedAt: string;
    expiresAt?: string;
    reason: string;
    reportCount: number;
  };
}

interface AdminDashboardProps {
  token: string;
  admin: any;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, admin, onLogout }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    totalSessions: 0
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reports' | 'bans'>('overview');
  const [loading, setLoading] = useState(true);

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, reportsRes, bansRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, axiosConfig),
        axios.get(`${API_URL}/api/admin/reports?limit=50`, axiosConfig),
        axios.get(`${API_URL}/api/admin/bans`, axiosConfig)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports);
      }

      if (bansRes.data.success) {
        setBannedUsers(bansRes.data.users);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      if (error.response?.status === 401) {
        window.alert('Session expired. Please login again.');
        onLogout();
      }
      setLoading(false);
    }
  };

  const handleReportStatusUpdate = async (reportId: string, newStatus: 'reviewed' | 'resolved') => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/admin/reports/${reportId}`,
        { status: newStatus },
        axiosConfig
      );

      if (response.data.success) {
        window.alert('Report status updated!');
        fetchDashboardData();
      }
    } catch (error: any) {
      window.alert('Failed to update report: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to unban this user?')) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/unban`,
        { userId },
        axiosConfig
      );

      if (response.data.success) {
        window.alert('User unbanned successfully!');
        fetchDashboardData();
      }
    } catch (error: any) {
      window.alert('Failed to unban user: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white border-opacity-20">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-purple-200">{title}</p>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-300 mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-purple-200">Welcome, {admin.username} ({admin.role})</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-purple-200 text-sm">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-2 border border-white border-opacity-20">
          <nav className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'reports', label: 'Reports', icon: ExclamationTriangleIcon },
              { id: 'bans', label: 'Banned Users', icon: NoSymbolIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition ${
                  selectedTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-200 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={<UsersIcon className="h-8 w-8 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={<EyeIcon className="h-8 w-8 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Banned Users"
                value={stats.bannedUsers}
                icon={<NoSymbolIcon className="h-8 w-8 text-white" />}
                color="bg-red-500"
              />
              <StatCard
                title="Total Reports"
                value={stats.totalReports}
                icon={<ExclamationTriangleIcon className="h-8 w-8 text-white" />}
                color="bg-yellow-500"
              />
              <StatCard
                title="Pending Reports"
                value={stats.pendingReports}
                icon={<DocumentTextIcon className="h-8 w-8 text-white" />}
                color="bg-orange-500"
              />
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions}
                icon={<ShieldCheckIcon className="h-8 w-8 text-white" />}
                color="bg-purple-500"
              />
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-lg border border-white border-opacity-20 p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Moderation Reports</h3>
            
            {reports.length === 0 ? (
              <p className="text-purple-200 text-center py-8">No reports found</p>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className="bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-500 text-white' :
                          report.status === 'reviewed' ? 'bg-blue-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                        <h4 className="text-lg font-semibold text-white mt-2">
                          {report.violationType.replace(/_/g, ' ').toUpperCase()}
                        </h4>
                      </div>
                      <span className="text-sm text-purple-200">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-purple-100 mb-3">{report.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-purple-200">
                      <div>
                        <span>Reported User: <span className="font-mono">{report.reportedUserId}</span></span>
                        <span className="mx-2">|</span>
                        <span>Session: <span className="font-mono">{report.sessionId}</span></span>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReportStatusUpdate(report.id, 'reviewed')}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleReportStatusUpdate(report.id, 'resolved')}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bans Tab */}
        {selectedTab === 'bans' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-lg border border-white border-opacity-20 p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Banned Users</h3>
            
            {bannedUsers.length === 0 ? (
              <p className="text-purple-200 text-center py-8">No banned users</p>
            ) : (
              <div className="space-y-4">
                {bannedUsers.map(user => (
                  <div key={user.id} className="bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            user.banInfo.banType === 'permanent' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-orange-500 text-white'
                          }`}>
                            {user.banInfo.banType.toUpperCase()}
                          </span>
                          <span className="text-sm font-mono text-purple-100">{user.id}</span>
                        </div>
                        
                        <p className="text-purple-100 mb-2">
                          <span className="font-semibold">Reason:</span> {user.banInfo.reason}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-purple-200">
                          <span>Reports: {user.banInfo.reportCount}</span>
                          <span>Banned: {new Date(user.banInfo.bannedAt).toLocaleDateString()}</span>
                          {user.banInfo.expiresAt && (
                            <span>Expires: {new Date(user.banInfo.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition ml-4"
                      >
                        Unban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
