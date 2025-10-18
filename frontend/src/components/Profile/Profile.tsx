import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserCircleIcon, 
  ChatBubbleLeftRightIcon, 
  VideoCameraIcon,
  ClockIcon,
  FlagIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('Anonymous User');

  // Mock user statistics - in a real app, this would come from the backend
  const stats = {
    totalChats: 47,
    totalTime: 235, // minutes
    reportsMade: 2,
    trustScore: 85
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Your Profile</h1>
      
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
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-xl font-bold bg-transparent border-b border-gray-400 focus:border-blue-500 outline-none text-white text-center sm:text-left"
                  onBlur={() => setIsEditing(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditing(false)}
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {displayName}
                </h2>
              )}
              <span className={`${tierBadge.color} text-white px-2 py-1 rounded text-sm font-medium`}>
                {tierBadge.text}
              </span>
            </div>
            
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              Device ID: {user?.deviceId || 'Unknown'}
            </p>
            
            <p className="text-sm text-gray-400">
              Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalChats}</div>
          <div className="text-xs sm:text-sm text-gray-300">Total Chats</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{formatTime(stats.totalTime)}</div>
          <div className="text-xs sm:text-sm text-gray-300">Time Spent</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <FlagIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.reportsMade}</div>
          <div className="text-xs sm:text-sm text-gray-300">Reports Made</div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6 text-center">
          <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.trustScore}%</div>
          <div className="text-xs sm:text-sm text-gray-300">Trust Score</div>
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
          <button className="w-full text-left p-3 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
            <div className="font-medium text-white text-sm sm:text-base">Change Display Name</div>
            <div className="text-xs sm:text-sm text-gray-300">Update how others see you</div>
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