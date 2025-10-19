import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  VideoCameraIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch fresh user data when profile loads
  useEffect(() => {
    console.log('🔄 Profile loaded - refreshing user data from database');
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Listen for real-time stats updates
  useEffect(() => {
    const handleStatsUpdate = (event: any) => {
      console.log('👤 Profile received stats update:', event.detail);
      forceUpdate({}); // Force re-render to show updated stats
    };
    
    window.addEventListener('user-stats-update', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('user-stats-update', handleStatsUpdate);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // Validation
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      // TODO: Call API to change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return { color: 'bg-yellow-500', text: 'Premium', icon: '👑' };
      case 'verified':
        return { color: 'bg-blue-500', text: 'Verified', icon: '✓' };
      case 'guest':
      default:
        return { color: 'bg-gray-500', text: 'Guest', icon: '👤' };
    }
  };

  const tierBadge = getTierBadge(user?.tier || 'guest');

  // Anonymous user view
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Profile</h1>
        
        {/* Anonymous Profile Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-6 sm:p-8 text-center">
          <UserCircleIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-white mb-2">Anonymous User</h2>
          <p className="text-gray-300 mb-6">
            You're currently browsing as a guest. Login or register to save your preferences and access all features.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
            >
              Login / Register
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-medium rounded-lg transition-all border border-white border-opacity-20"
            >
              Continue Browsing
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">What you'll get with an account:</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-white">50 Daily Coins</h4>
                <p className="text-sm text-gray-300">Auto-renewed every day to chat with others</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <VideoCameraIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-white">Video, Audio & Text Chat</h4>
                <p className="text-sm text-gray-300">Connect with people from around the world</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-white">Safe & Anonymous</h4>
                <p className="text-sm text-gray-300">Your privacy is protected at all times</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Your Profile</h1>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
      
      {/* Profile Card */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <UserCircleIcon className="w-24 h-24 text-gray-400" />
            <div className={`absolute -bottom-2 -right-2 ${tierBadge.color} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}>
              {tierBadge.icon}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
              <h2 className="text-xl font-bold text-white">
                {user?.username || 'Anonymous User'}
              </h2>
              <span className={`${tierBadge.color} text-white px-2 py-1 rounded text-sm font-medium`}>
                {tierBadge.text}
              </span>
            </div>
            
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              {user?.email || 'No email'}
            </p>
            
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-400">
              <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{user?.coins || 0}</span>
              <span>coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{user?.totalChats || 0}</div>
          <div className="text-xs sm:text-sm text-gray-300">Total Chats</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{user?.dailyChats || 0}</div>
          <div className="text-xs sm:text-sm text-gray-300">Today's Chats</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{user?.coins || 0}</div>
          <div className="text-xs sm:text-sm text-gray-300">Total Coins</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <span className={`inline-block w-6 h-6 sm:w-8 sm:h-8 ${tierBadge.color} rounded-full mx-auto mb-2 flex items-center justify-center text-lg`}>
            {tierBadge.icon}
          </span>
          <div className="text-sm sm:text-base font-bold text-white">{tierBadge.text}</div>
          <div className="text-xs sm:text-sm text-gray-300">Account Status</div>
        </div>
      </div>

      {/* Safety & Privacy */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Safety & Privacy</h3>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-white bg-opacity-5 rounded-lg">
            <div>
              <h4 className="font-medium text-white text-sm sm:text-base">Anonymous Mode</h4>
              <p className="text-xs sm:text-sm text-gray-300">Your identity is always protected</p>
            </div>
            <div className="text-green-400">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-white bg-opacity-5 rounded-lg">
            <div>
              <h4 className="font-medium text-white text-sm sm:text-base">Age Verification</h4>
              <p className="text-xs sm:text-sm text-gray-300">Confirmed 18+ years old</p>
            </div>
            <div className="text-green-400">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-white bg-opacity-5 rounded-lg">
            <div>
              <h4 className="font-medium text-white text-sm sm:text-base">Data Protection</h4>
              <p className="text-xs sm:text-sm text-gray-300">Conversations are not stored</p>
            </div>
            <div className="text-green-400">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
        
        <div className="space-y-3">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-sm sm:text-base group-hover:text-blue-400 transition-colors">
                  Change Password
                </div>
                <div className="text-xs sm:text-sm text-gray-300">
                  {user?.passwordHash ? 'Update your password' : 'Set a password (OAuth user)'}
                </div>
              </div>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full text-left p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-sm sm:text-base group-hover:text-red-400 transition-colors">
                  Logout
                </div>
                <div className="text-xs sm:text-sm text-gray-300">Sign out from your account</div>
              </div>
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
            </div>
          </button>

          <button className="w-full text-left p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
            <div className="font-medium text-white text-sm sm:text-base">Privacy Settings</div>
            <div className="text-xs sm:text-sm text-gray-300">Manage your privacy preferences</div>
          </button>

          <button className="w-full text-left p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors text-red-400">
            <div className="font-medium text-sm sm:text-base">Delete Account</div>
            <div className="text-xs sm:text-sm">Permanently remove your account</div>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white border-opacity-20">
            <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
            
            {passwordError && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
                Password changed successfully!
              </div>
            )}

            <div className="space-y-4">
              {user?.passwordHash && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter current password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;