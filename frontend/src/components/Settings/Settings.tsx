import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  EyeSlashIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Settings state
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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      {/* Video & Audio Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <VideoCameraIcon className="w-5 h-5 mr-2" />
          Video & Audio
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Camera</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enable camera for video chats</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.cameraEnabled} onChange={(value) => updateSetting('cameraEnabled', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MicrophoneIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Microphone</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enable microphone for audio</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.micEnabled} onChange={(value) => updateSetting('micEnabled', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SpeakerWaveIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Speaker</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enable audio output</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.speakerEnabled} onChange={(value) => updateSetting('speakerEnabled', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Video Quality</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Choose video quality preference</div>
            </div>
            <select 
              value={settings.videoQuality}
              onChange={(e) => updateSetting('videoQuality', e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            >
              <option value="low">Low (Data Saver)</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy & Safety */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ShieldCheckIcon className="w-5 h-5 mr-2" />
          Privacy & Safety
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Allow Strangers</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connect with random strangers</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.allowStrangers} onChange={(value) => updateSetting('allowStrangers', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Auto-Report Suspicious Activity</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Automatically report inappropriate behavior</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.reportSuspicious} onChange={(value) => updateSetting('reportSuspicious', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <EyeSlashIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Block Inappropriate Content</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI-powered content filtering</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.blockInappropriate} onChange={(value) => updateSetting('blockInappropriate', value)} />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">Age Verification Required</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">You must be 18+ to use Omegoo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BellIcon className="w-5 h-5 mr-2" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Chat Notifications</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Get notified about new matches</div>
            </div>
            <ToggleSwitch enabled={settings.chatNotifications} onChange={(value) => updateSetting('chatNotifications', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">System Notifications</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Updates and system messages</div>
            </div>
            <ToggleSwitch enabled={settings.systemNotifications} onChange={(value) => updateSetting('systemNotifications', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Sound Effects</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Play sounds for notifications</div>
            </div>
            <ToggleSwitch enabled={settings.soundEnabled} onChange={(value) => updateSetting('soundEnabled', value)} />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <SunIcon className="w-5 h-5 mr-2" />
          Appearance
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MoonIcon className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Switch to dark theme</div>
              </div>
            </div>
            <ToggleSwitch enabled={settings.darkMode} onChange={(value) => updateSetting('darkMode', value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Language</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred language</div>
            </div>
            <select 
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matching Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matching Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-2">Default Chat Mode</div>
            <div className="grid grid-cols-3 gap-3">
              {['text', 'video', 'audio'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSetting('matchingMode', mode)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.matchingMode === mode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{mode}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
          Save Settings
        </button>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          Changes are saved automatically
        </p>
      </div>
    </div>
  );
};

export default Settings;