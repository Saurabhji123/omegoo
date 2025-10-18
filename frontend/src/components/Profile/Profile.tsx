import React from 'react';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
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
    </div>
  );
};

export default Profile;