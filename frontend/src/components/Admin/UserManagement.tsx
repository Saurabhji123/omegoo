import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Use production URL when deployed, localhost only for local dev
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocalhost ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com';

interface User {
  id: string;
  username: string;
  email: string;
  tier: 'guest' | 'user' | 'admin' | 'super_admin';
  status: 'active' | 'banned' | 'suspended';
  reportCount: number;
  isVerified: boolean;
  coins: number;
  totalChats: number;
  dailyChats: number;
  createdAt: string;
  lastActiveAt: string;
}

interface UserManagementProps {
  token: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/users`, axiosConfig);
      
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await axios.put(
        `${API_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        axiosConfig
      );

      if (response.data.success) {
        alert('Role updated successfully!');
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.error || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUnban = async (userId: string, currentStatus: string) => {
    const action = currentStatus === 'banned' ? 'unban' : 'ban';
    
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      
      if (action === 'ban') {
        await axios.post(
          `${API_URL}/api/admin/ban`,
          {
            userId,
            banType: 'temporary',
            duration: 7,
            reason: 'Manual ban by admin'
          },
          axiosConfig
        );
      } else {
        await axios.post(
          `${API_URL}/api/admin/unban`,
          { userId },
          axiosConfig
        );
      }

      alert(`User ${action}ned successfully!`);
      fetchUsers();
    } catch (error: any) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to permanently delete this user? This action cannot be undone!')) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await axios.delete(
        `${API_URL}/api/admin/users/${userId}`,
        axiosConfig
      );

      if (response.data.success) {
        alert('User deleted successfully!');
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (tier: string) => {
    switch (tier) {
      case 'super_admin':
        return 'bg-purple-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'user':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportWarningColor = (count: number) => {
    if (count >= 9) return 'text-red-600 font-bold';
    if (count >= 6) return 'text-orange-600 font-semibold';
    if (count >= 3) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
          <div className="text-gray-300 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
          <div className="text-gray-300 text-sm">✅ Verified</div>
          <div className="text-2xl font-bold text-green-400">
            {users.filter(u => u.isVerified).length}
          </div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
          <div className="text-gray-300 text-sm">❌ Unverified</div>
          <div className="text-2xl font-bold text-red-400">
            {users.filter(u => !u.isVerified).length}
          </div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
          <div className="text-gray-300 text-sm">Banned</div>
          <div className="text-2xl font-bold text-red-400">
            {users.filter(u => u.status === 'banned').length}
          </div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
          <div className="text-gray-300 text-sm">With Reports</div>
          <div className="text-2xl font-bold text-yellow-400">
            {users.filter(u => u.reportCount > 0).length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white bg-opacity-5 backdrop-blur-md rounded-xl border border-white border-opacity-10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white bg-opacity-10 border-b border-white border-opacity-10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Email</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">Verified</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">Reports</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">Chats</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-5">
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`hover:bg-white hover:bg-opacity-5 transition-colors ${
                    index === 0 ? 'rounded-t-xl' : ''
                  } ${index === filteredUsers.length - 1 ? 'rounded-b-xl' : ''}`}
                >
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.username || 'Anonymous'}</div>
                        <div className="text-gray-400 text-sm">ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="text-gray-300">{user.email || 'No email'}</div>
                  </td>

                  {/* Verification Status */}
                  <td className="px-6 py-4 text-center">
                    {user.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Unverified
                      </span>
                    )}
                  </td>

                  {/* Role Dropdown */}
                  <td className="px-6 py-4">
                    <select
                      value={user.tier}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={actionLoading === user.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.tier)} cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50`}
                    >
                      <option value="guest">Guest</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>

                  {/* Reports */}
                  <td className="px-6 py-4 text-center">
                    <div className={`flex items-center justify-center space-x-1 ${getReportWarningColor(user.reportCount)}`}>
                      {user.reportCount > 0 && <ExclamationTriangleIcon className="w-4 h-4" />}
                      <span className="font-semibold">{user.reportCount}</span>
                    </div>
                    {user.reportCount >= 3 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {user.reportCount >= 9 ? 'Perm ban' : user.reportCount >= 6 ? '2wk ban' : '1wk ban'}
                      </div>
                    )}
                  </td>

                  {/* Chats */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-white font-medium">{user.totalChats || 0}</div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Ban/Unban Button */}
                      <button
                        onClick={() => handleBanUnban(user.id, user.status)}
                        disabled={actionLoading === user.id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.status === 'banned'
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                        title={user.status === 'banned' ? 'Unban' : 'Ban'}
                      >
                        {user.status === 'banned' ? (
                          <ShieldCheckIcon className="w-4 h-4" />
                        ) : (
                          <NoSymbolIcon className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Delete User"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white bg-opacity-5 backdrop-blur-md rounded-xl border border-white border-opacity-10 p-4">
        <div className="text-sm text-gray-300">
          <strong className="text-white">Report System:</strong>
          <ul className="mt-2 space-y-1 ml-4">
            <li><span className="text-yellow-400">3 reports</span> = 1 week ban (automatic)</li>
            <li><span className="text-orange-400">6 reports</span> = 2 weeks ban (automatic)</li>
            <li><span className="text-red-400">9+ reports</span> = Permanent ban (automatic)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
