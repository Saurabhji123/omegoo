import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../../services/api';
import { 
  UserCircleIcon, 
  VideoCameraIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  StarIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Profile: React.FC = () => {
  const { user, logout, refreshUser, deleteAccount } = useAuth();
  const { socket } = useSocket();
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
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [genderSelection, setGenderSelection] = useState<'male' | 'female' | 'others' | null>(null);
  const [genderSaving, setGenderSaving] = useState(false);
  const [genderError, setGenderError] = useState('');

  // Favourites state
  const [activeTab, setActiveTab] = useState<'profile' | 'favourites'>('profile');
  const [favourites, setFavourites] = useState<any[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingUser, setConnectingUser] = useState<any>(null);
  const [connectMode, setConnectMode] = useState<'text' | 'audio' | 'video'>('text');
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'waiting' | 'unavailable' | 'success'>('idle');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

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

  useEffect(() => {
    if (
      user?.gender === 'others' &&
      user?.preferences?.authProvider === 'google' &&
      !user?.preferences?.genderConfirmed
    ) {
      setGenderSelection(null);
      setShowGenderModal(true);
    } else {
      setShowGenderModal(false);
    }
  }, [user?.gender, user?.preferences?.authProvider, user?.preferences?.genderConfirmed]);

  // Fetch favourites when tab switches
  useEffect(() => {
    if (activeTab === 'favourites' && socket) {
      fetchFavourites();
    }
  }, [activeTab, socket]);

  // Socket event listeners for favourites
  useEffect(() => {
    if (!socket) return;

    const handleFavouritesList = (data: { favourites: any[] }) => {
      console.log('⭐ Received favourites list:', data.favourites);
      setFavourites(data.favourites);
      setLoadingFavourites(false);
    };

    const handleFavouriteAdded = (data: { userId: string; message: string }) => {
      console.log('✅ Favourite added:', data);
      // Refresh favourites list
      fetchFavourites();
    };

    const handleFavouriteRemoved = (data: { userId: string; message: string }) => {
      console.log('✅ Favourite removed:', data);
      // Remove from local state
      setFavourites(prev => prev.filter(fav => fav.userId !== data.userId));
      setShowRemoveConfirm(false);
      setRemovingUserId(null);
    };

    const handleFavouriteConnecting = (data: { message: string; waitTime: number }) => {
      console.log('⏳ User busy, waiting:', data);
      setConnectStatus('waiting');
    };

    const handleFavouriteUnavailable = (data: { message: string; userId: string }) => {
      console.log('❌ User unavailable:', data);
      setConnectStatus('unavailable');
      setTimeout(() => {
        setShowConnectModal(false);
        setConnectStatus('idle');
      }, 3000);
    };

    const handleMatchFound = (data: any) => {
      console.log('✅ Match found with favourite!', data);
      setConnectStatus('success');
      setTimeout(() => {
        setShowConnectModal(false);
        // Redirect to appropriate chat
        navigate(`/chat/${data.mode}`);
      }, 1000);
    };

    const handleFavouriteError = (data: { message: string }) => {
      console.error('❌ Favourite error:', data);
      alert(data.message);
      setConnectStatus('idle');
    };

    socket.on('favourites_list', handleFavouritesList);
    socket.on('favourite_added', handleFavouriteAdded);
    socket.on('favourite_removed', handleFavouriteRemoved);
    socket.on('favourite_connecting', handleFavouriteConnecting);
    socket.on('favourite_unavailable', handleFavouriteUnavailable);
    socket.on('match_found', handleMatchFound);
    socket.on('favourite_error', handleFavouriteError);

    return () => {
      socket.off('favourites_list', handleFavouritesList);
      socket.off('favourite_added', handleFavouriteAdded);
      socket.off('favourite_removed', handleFavouriteRemoved);
      socket.off('favourite_connecting', handleFavouriteConnecting);
      socket.off('favourite_unavailable', handleFavouriteUnavailable);
      socket.off('match_found', handleMatchFound);
      socket.off('favourite_error', handleFavouriteError);
    };
  }, [socket, navigate]);

  // Favourites handler functions
  const fetchFavourites = () => {
    if (!socket) return;
    setLoadingFavourites(true);
    socket.emit('get_favourites');
  };

  const handleConnectWithFavourite = (favourite: any, mode: 'text' | 'audio' | 'video') => {
    setConnectingUser(favourite);
    setConnectMode(mode);
    setConnectStatus('connecting');
    setShowConnectModal(true);

    if (socket) {
      socket.emit('connect_with_favourite', {
        favouriteUserId: favourite.userId,
        mode
      });
    }
  };

  const handleRemoveFavourite = (userId: string) => {
    setRemovingUserId(userId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveFavourite = () => {
    if (!socket || !removingUserId) return;

    socket.emit('remove_favourite', {
      favouriteUserId: removingUserId
    });
  };

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
    if (user?.hasPassword && !passwordData.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      // Call API to change password
      const currentPwd = user?.hasPassword ? passwordData.currentPassword : undefined;

      await authAPI.changePassword(currentPwd, passwordData.newPassword);

      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Refresh user data to get updated password metadata
      await refreshUser();

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) {
      return;
    }

    setDeleteError('');
    const confirmed = window.confirm('This action permanently deletes your account and all associated data. Do you want to continue?');
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount();
      alert('Your account has been deleted successfully.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Failed to delete account. Please try again.';
      setDeleteError(typeof errorMessage === 'string' ? errorMessage : 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
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

  const formatGender = (value?: 'male' | 'female' | 'others') => {
    if (!value) return 'Not specified';
    if (value === 'others') return 'Other';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatGenderPreference = (value?: 'any' | 'male' | 'female') => {
    if (!value || value === 'any') return 'Anyone';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleGenderConfirm = async () => {
    if (!genderSelection) {
      setGenderError('Please select your gender');
      return;
    }
    try {
      setGenderSaving(true);
      setGenderError('');
      await userAPI.confirmGender({ gender: genderSelection });
      await refreshUser();
      setShowGenderModal(false);
    } catch (error: any) {
      console.error('Failed to confirm gender:', error);
      setGenderError(error?.message || 'Failed to confirm gender. Please try again.');
    } finally {
      setGenderSaving(false);
    }
  };

  // Anonymous user view
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Profile</h1>
        
        {/* Anonymous Profile Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white border-opacity-20 bg-white/10 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <UserCircleIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-white mb-2">Anonymous User</h2>
            <p className="text-white/70 mb-6 text-sm sm:text-base">
              You're currently browsing as a guest. Sign in to sync your chat preferences, access all modes, and pick up conversations across devices.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 hover:from-purple-500 hover:via-blue-600 hover:to-indigo-600"
              >
                Login / Register
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold text-white/80 transition-colors border border-white/30 bg-white/5 hover:bg-white/10"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-blue-500/10 to-transparent" aria-hidden="true" />
          <div className="relative z-10 space-y-4">
            <h3 className="text-lg font-semibold text-white">What you'll get with an account:</h3>

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
      </div>
    );
  }

  // Logged-in user view
  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-900/80 via-blue-900/70 to-indigo-900/80 px-6 py-6 sm:py-8 shadow-2xl">
        <div className="absolute -top-24 -right-6 h-44 w-44 rounded-full bg-purple-400/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Profile Center</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your Profile</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
              Fine-tune your Omegoo presence, monitor session stats, and keep your account ready for the next match.
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'profile'
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          Profile
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('favourites')}
          className={`px-6 py-3 font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'favourites'
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <StarIcon className="w-5 h-5" />
          Favourites
          {favourites.length > 0 && (
            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {favourites.length}
            </span>
          )}
          {activeTab === 'favourites' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          )}
        </button>
      </div>
      
      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <>
      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-purple-500/5 to-blue-500/10" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
              <UserCircleIcon className="h-16 w-16 text-white/60" />
            </div>
            <div className={`absolute -bottom-2 -right-2 ${tierBadge.color} text-white rounded-full w-9 h-9 flex items-center justify-center text-base font-bold border border-white/40 shadow-lg`}>
              {tierBadge.icon}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-start">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                {user?.username || 'Anonymous User'}
              </h2>
              <span className={`${tierBadge.color} text-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full`}>
                {tierBadge.text}
              </span>
            </div>

            <p className="text-sm text-white/70 sm:text-base">
              {user?.email || 'No email'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80">
                <CurrencyDollarIcon className="h-4 w-4 text-yellow-300" />
                <span>{user?.coins ?? 0} coins</span>
              </span>
              {user?.gender && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                  Gender: {formatGender(user.gender)}
                </span>
              )}
              {user?.preferences?.genderPreference && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                  Looking for: {formatGenderPreference(user.preferences.genderPreference)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Gender confirmation modal for Google users */}
      {showGenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-white border-opacity-20 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Your Gender</h3>
            <p className="text-sm text-gray-200 mb-4">
              Please select your gender to continue. This choice helps us match you better and can’t be changed later.
            </p>
            <div className="space-y-3">
              {genderError && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-3 py-2 rounded-lg text-sm">
                  {genderError}
                </div>
              )}
              <select
                value={genderSelection ?? ''}
                onChange={(event) => {
                  setGenderError('');
                  setGenderSelection(event.target.value as 'male' | 'female' | 'others');
                }}
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" disabled className="bg-purple-900">Select your gender</option>
                <option value="male" className="bg-purple-900">Male</option>
                <option value="female" className="bg-purple-900">Female</option>
                <option value="others" className="bg-purple-900">Other</option>
              </select>
              <button
                onClick={handleGenderConfirm}
                disabled={genderSaving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                {genderSaving ? 'Saving...' : 'Confirm Gender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300 mx-auto mb-3" />
            <div className="text-xl sm:text-2xl font-bold text-white">{user?.totalChats || 0}</div>
            <div className="text-xs sm:text-sm text-white/70">Total Chats</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/15 via-green-400/5 to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-300 mx-auto mb-3" />
            <div className="text-xl sm:text-2xl font-bold text-white">{user?.dailyChats || 0}</div>
            <div className="text-xs sm:text-sm text-white/70">Today's Chats</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/15 via-yellow-400/5 to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 mx-auto mb-3" />
            <div className="text-xl sm:text-2xl font-bold text-white">{user?.coins || 0}</div>
            <div className="text-xs sm:text-sm text-white/70">Total Coins</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" aria-hidden="true" />
          <div className="relative z-10">
            <span className={`inline-flex h-8 w-8 sm:h-10 sm:w-10 ${tierBadge.color} rounded-full mx-auto mb-3 items-center justify-center text-lg font-semibold text-white shadow-md`}>
              {tierBadge.icon}
            </span>
            <div className="text-sm sm:text-base font-bold text-white">{tierBadge.text}</div>
            <div className="text-xs sm:text-sm text-white/70">Account Status</div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 flex justify-end">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white transition hover:border-red-300/60 hover:bg-red-500/10"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-300" />
          <span>Logout</span>
        </button>
      </div>

      {/* Safety & Privacy */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Safety & Privacy</h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Verified protections
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">Anonymous Mode</h4>
                <p className="text-xs sm:text-sm text-white/60">Your identity stays private on every match</p>
              </div>
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-300" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">Age Verification</h4>
                <p className="text-xs sm:text-sm text-white/60">We confirm all members are 18+ before entry</p>
              </div>
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-300" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">Data Protection</h4>
                <p className="text-xs sm:text-sm text-white/60">Chat sessions stay ephemeral and unrecorded</p>
              </div>
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-purple-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <h3 className="text-lg font-semibold text-white">Account</h3>
          <p className="mt-1 text-sm text-white/60">Manage access, security, and privacy preferences in one place.</p>
          
          <div className="mt-4 space-y-3">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="group w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm sm:text-base group-hover:text-blue-300">
                    Change Password
                  </div>
                  <div className="text-xs sm:text-sm text-white/60">
                    {user?.hasPassword ? 'Update your password' : 'Set a password (OAuth user)'}
                  </div>
                </div>
                <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </button>

            <button 
              onClick={() => navigate('/settings')}
              className="group w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm sm:text-base group-hover:text-blue-300">Privacy Settings</div>
                  <div className="text-xs sm:text-sm text-white/60">Manage your privacy preferences</div>
                </div>
                <ShieldCheckIcon className="h-5 w-5 text-blue-300" />
              </div>
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className={`w-full rounded-2xl border border-red-400/40 px-4 py-4 text-left transition ${isDeleting ? 'cursor-not-allowed opacity-60 bg-red-500/10' : 'bg-red-500/5 hover:bg-red-500/10'}`}
            >
              <div className="font-medium text-sm sm:text-base text-red-200">Delete Account</div>
              <div className="text-xs sm:text-sm text-red-200/80">
                {isDeleting ? 'Deleting account...' : 'Permanently remove your account'}
              </div>
            </button>
            {deleteError && (
              <div className="text-xs sm:text-sm text-red-300">
                {deleteError}
              </div>
            )}
          </div>
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
              {user?.hasPassword && (
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
        </>
      )}

      {/* Favourites Tab Content */}
      {activeTab === 'favourites' && (
        <div className="space-y-6">
          {loadingFavourites ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-white/70 mt-4">Loading favourites...</p>
            </div>
          ) : favourites.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <StarIconSolid className="w-16 h-16 text-yellow-400/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Favourites Yet</h3>
              <p className="text-white/70 mb-6">
                When chatting, swipe right to add someone to your favourites!
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favourites.map((fav) => (
                <div
                  key={fav.userId}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserCircleIcon className="w-12 h-12 text-white/60" />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                          fav.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{fav.email || 'Anonymous'}</h4>
                        <p className="text-white/50 text-sm capitalize">{fav.gender || 'Unknown'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavourite(fav.userId)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove from favourites"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {fav.interests && fav.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/50 text-xs mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {fav.interests.slice(0, 3).map((interest: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnectWithFavourite(fav, 'text')}
                      disabled={!fav.isOnline}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Text
                    </button>
                    <button
                      onClick={() => handleConnectWithFavourite(fav, 'audio')}
                      disabled={!fav.isOnline}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Audio
                    </button>
                    <button
                      onClick={() => handleConnectWithFavourite(fav, 'video')}
                      disabled={!fav.isOnline}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Video
                    </button>
                  </div>

                  {!fav.isOnline && (
                    <p className="text-yellow-400 text-xs mt-3 text-center">Offline - Last seen {new Date(fav.lastActiveAt).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
            <div className="text-center">
              {connectStatus === 'connecting' && (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold text-white mb-2">Connecting...</h3>
                  <p className="text-gray-300">Checking if user is available</p>
                </>
              )}

              {connectStatus === 'waiting' && (
                <>
                  <div className="animate-pulse">
                    <div className="text-5xl mb-4">⏳</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">User is Busy</h3>
                  <p className="text-gray-300">Waiting for availability... (10-15s)</p>
                </>
              )}

              {connectStatus === 'unavailable' && (
                <>
                  <div className="text-5xl mb-4">😔</div>
                  <h3 className="text-xl font-bold text-white mb-2">User Not Available</h3>
                  <p className="text-gray-300">Please try again later</p>
                </>
              )}

              {connectStatus === 'success' && (
                <>
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-white mb-2">Connected!</h3>
                  <p className="text-gray-300">Redirecting to chat...</p>
                </>
              )}

              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setConnectStatus('idle');
                }}
                className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="text-center">
              <TrashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Remove from Favourites?</h3>
              <p className="text-gray-300 mb-6">This user will be removed from your favourites list</p>

              <div className="flex gap-3">
                <button
                  onClick={confirmRemoveFavourite}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setRemovingUserId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
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