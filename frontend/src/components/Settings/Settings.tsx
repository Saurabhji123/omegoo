import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { 
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  // MoonIcon, // Reserved for dark mode toggle
  // SunIcon, // Reserved for dark mode toggle
  BellIcon,
  EyeSlashIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Settings state - initialized from user preferences
  const [settings, setSettings] = useState({
    // Video & Audio
    cameraEnabled: true,
    micEnabled: true,
    speakerEnabled: true,
    videoQuality: 'high',
    
    // Privacy & Safety
    allowStrangers: true,
    reportSuspicious: true,
    blockInappropriate: true,
    ageVerification: true,
    
    // Notifications
    chatNotifications: true,
    systemNotifications: true,
    soundEnabled: true,
    
    // Appearance
    darkMode: false,
    language: 'en',
    
    // Matching Preferences
    matchingMode: 'video',
    interestTags: [] as string[],
  });

  // Load settings from user preferences on mount
  useEffect(() => {
    if (user?.preferences) {
      setSettings(prev => ({
        ...prev,
        ...(user.preferences.settings || {}),
        videoQuality: user.preferences.videoQuality || 'high',
        matchingMode: user.preferences.matchingMode || 'video',
      }));
    }
  }, [user]);

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Auto-save to database
    await saveSettingsToDatabase(newSettings);
  };

  const saveSettingsToDatabase = async (settingsToSave: any) => {
    try {
      setSaving(true);
      await userAPI.updatePreferences({
        settings: settingsToSave,
        videoQuality: settingsToSave.videoQuality,
        matchingMode: settingsToSave.matchingMode,
      });
      
      // Refresh user data to get updated preferences
      await refreshUser();
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (value: boolean) => void }> = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Settings</h1>

      {/* Video & Audio Settings */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <VideoCameraIcon className="w-5 h-5 mr-2" />
          Video & Audio
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <VideoCameraIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Camera</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">Enable camera for video chats</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.cameraEnabled} onChange={(value) => updateSetting('cameraEnabled', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <MicrophoneIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Microphone</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">Enable microphone for audio</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.micEnabled} onChange={(value) => updateSetting('micEnabled', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <SpeakerWaveIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Speaker</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">Enable audio output</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.speakerEnabled} onChange={(value) => updateSetting('speakerEnabled', value)} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <div className="font-medium text-white text-sm sm:text-base">Video Quality</div>
              <div className="text-xs sm:text-sm text-gray-300">Choose video quality preference</div>
            </div>
            <select 
              value={settings.videoQuality}
              onChange={(e) => updateSetting('videoQuality', e.target.value)}
              className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-2 border-purple-500 border-opacity-50 rounded-lg px-4 py-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-400 transition-all cursor-pointer"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9), rgba(30, 58, 138, 0.9), rgba(49, 46, 129, 0.9))',
              }}
            >
              <option value="low" className="bg-purple-900 text-white py-2">Low (Data Saver)</option>
              <option value="medium" className="bg-purple-900 text-white py-2">Medium</option>
              <option value="high" className="bg-purple-900 text-white py-2">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy & Safety */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <ShieldCheckIcon className="w-5 h-5 mr-2" />
          Privacy & Safety
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <UserGroupIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Allow Strangers</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">Connect with random strangers</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.allowStrangers} onChange={(value) => updateSetting('allowStrangers', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Auto-Report Suspicious Activity</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">Automatically report inappropriate behavior</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.reportSuspicious} onChange={(value) => updateSetting('reportSuspicious', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <EyeSlashIcon className="w-5 h-5 text-gray-300" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm sm:text-base">Block Inappropriate Content</div>
                <div className="text-xs sm:text-sm text-gray-300 truncate">AI-powered content filtering</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.blockInappropriate} onChange={(value) => updateSetting('blockInappropriate', value)} />
          </div>

          <div className="p-3 sm:p-4 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-400 border-opacity-30">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-blue-300" />
              <div>
                <div className="font-medium text-blue-200 text-sm sm:text-base">Age Verification Required</div>
                <div className="text-xs sm:text-sm text-blue-300">You must be 18+ to use Omegoo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BellIcon className="w-5 h-5 mr-2" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm sm:text-base">Chat Notifications</div>
              <div className="text-xs sm:text-sm text-gray-300 truncate">Get notified about new matches</div>
            </div>
            <ToggleSwitch enabled={settings.chatNotifications} onChange={(value) => updateSetting('chatNotifications', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm sm:text-base">System Notifications</div>
              <div className="text-xs sm:text-sm text-gray-300 truncate">Updates and system messages</div>
            </div>
            <ToggleSwitch enabled={settings.systemNotifications} onChange={(value) => updateSetting('systemNotifications', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm sm:text-base">Sound Effects</div>
              <div className="text-xs sm:text-sm text-gray-300 truncate">Play sounds for notifications</div>
            </div>
            <ToggleSwitch enabled={settings.soundEnabled} onChange={(value) => updateSetting('soundEnabled', value)} />
          </div>
        </div>
      </div>

      {/* Matching Preferences */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border border-white border-opacity-20 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Matching Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <div className="font-medium text-white mb-2 text-sm sm:text-base">Default Chat Mode</div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['text', 'video', 'audio'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSetting('matchingMode', mode)}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                    settings.matchingMode === mode
                      ? 'border-blue-400 bg-blue-500 bg-opacity-20'
                      : 'border-white border-opacity-30 hover:border-opacity-50'
                  }`}
                >
                  <div className="font-medium text-white capitalize text-sm sm:text-base">{mode}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save Status */}
      {saveMessage && (
        <div className={`bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl border ${
          saveMessage.includes('success') 
            ? 'border-green-500 border-opacity-50' 
            : 'border-red-500 border-opacity-50'
        } p-4 sm:p-6`}>
          <p className={`text-center font-medium ${
            saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'
          }`}>
            {saveMessage}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg border border-white border-opacity-10 p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-300 text-center flex items-center justify-center gap-2">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
              <span>Saving settings...</span>
            </>
          ) : (
            <>
              <span className="text-green-400">✓</span>
              <span>Changes are saved automatically</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Settings;