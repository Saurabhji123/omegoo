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
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { VOICE_FILTER_PRESETS, VoiceFilterType } from '../../types/voiceFilters';
import { FACE_MASK_PRESETS, FaceMaskType } from '../../types/arFilters';

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
    
    // Voice Filters
    defaultVoiceFilter: 'none' as VoiceFilterType,
    autoEnableVoiceFilter: false,
    voiceFilterIntensityPreset: 0.6,
    voiceFilterPerformanceMode: false,
    
    // AR Face Masks & Blur
    defaultARMask: 'none',
    autoEnableBlur: false,
    defaultBlurDuration: 10,
    arPerformanceMode: false,
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
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border border-white/15 transition-all duration-200 ${
        enabled ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/30' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-900/80 via-blue-900/70 to-indigo-900/80 px-6 py-6 sm:py-8 shadow-2xl">
        <div className="absolute -top-24 -right-10 h-44 w-44 rounded-full bg-purple-400/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Control Center</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Settings</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
              Personalize your chat experience, keep privacy safeguards on, and stay in sync across devices.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white/80">
            {saving ? 'Saving changes...' : 'Auto-save is active'}
          </div>
        </div>
      </div>

      {/* Video & Audio Settings */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center text-lg font-semibold text-white">
              <VideoCameraIcon className="mr-2 h-5 w-5" />
              Video & Audio
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Streaming ready
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <VideoCameraIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Camera</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Enable camera for video chats</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.cameraEnabled} onChange={(value) => updateSetting('cameraEnabled', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <MicrophoneIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Microphone</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Enable microphone for audio</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.micEnabled} onChange={(value) => updateSetting('micEnabled', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <SpeakerWaveIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Speaker</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Enable audio output</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.speakerEnabled} onChange={(value) => updateSetting('speakerEnabled', value)} />
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div>
                <div className="font-medium text-white text-sm sm:text-base">Video Quality</div>
                <div className="text-xs sm:text-sm text-white/60">Choose your preferred stream quality</div>
              </div>
              <select 
                value={settings.videoQuality}
                onChange={(e) => updateSetting('videoQuality', e.target.value)}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-inner transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="low" className="bg-slate-900 text-white">Low (Data Saver)</option>
                <option value="medium" className="bg-slate-900 text-white">Medium</option>
                <option value="high" className="bg-slate-900 text-white">High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Filters */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center text-lg font-semibold text-white">
              <SparklesIcon className="mr-2 h-5 w-5" />
              Voice Filters
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              AI-Powered
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Default Voice Filter */}
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div className="flex-1">
                <div className="font-medium text-white text-sm sm:text-base">Default Voice Filter</div>
                <div className="text-xs sm:text-sm text-white/60">Choose your preferred voice effect for audio calls</div>
              </div>
              <select 
                value={settings.defaultVoiceFilter}
                onChange={(e) => updateSetting('defaultVoiceFilter', e.target.value as VoiceFilterType)}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-inner transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {(Object.keys(VOICE_FILTER_PRESETS) as VoiceFilterType[]).map((filterType) => {
                  const preset = VOICE_FILTER_PRESETS[filterType];
                  return (
                    <option key={filterType} value={filterType} className="bg-slate-900 text-white">
                      {preset.emoji} {preset.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Auto-Enable Filter */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Auto-Enable on Join</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Automatically apply default filter when joining calls</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.autoEnableVoiceFilter} onChange={(value) => updateSetting('autoEnableVoiceFilter', value)} />
            </div>

            {/* Intensity Presets */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="mb-3">
                <div className="font-medium text-white text-sm sm:text-base">Default Intensity</div>
                <div className="text-xs sm:text-sm text-white/60">Set how strong the voice filter effect should be</div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Subtle', value: 0.3, emoji: '🔹' },
                  { label: 'Medium', value: 0.6, emoji: '🔸' },
                  { label: 'Strong', value: 0.9, emoji: '🔶' }
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSetting('voiceFilterIntensityPreset', preset.value)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                      settings.voiceFilterIntensityPreset === preset.value
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{preset.emoji}</div>
                    <div>{preset.label}</div>
                    <div className="text-xs opacity-60 mt-1">{Math.round(preset.value * 100)}%</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Mode */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Performance Mode</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Optimize filters for low-end devices (reduces quality)</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.voiceFilterPerformanceMode} onChange={(value) => updateSetting('voiceFilterPerformanceMode', value)} />
            </div>

            {/* Info Banner */}
            <div className="rounded-2xl border border-purple-400/40 bg-purple-500/10 px-4 py-4 text-sm text-purple-100">
              <div className="flex items-start gap-3">
                <SparklesIcon className="mt-1 h-5 w-5" />
                <div>
                  <div className="font-semibold uppercase tracking-wide text-xs text-purple-100">Real-Time Voice Transformation</div>
                  <p className="mt-1 text-purple-100/80">Voice filters are applied in real-time during audio calls. You can always change filters mid-call. Battery usage may increase with active filters.</p>
                </div>
              </div>
            </div>

            {/* Clear Cache Button */}
            <button
              onClick={() => {
                localStorage.removeItem('omegoo_voice_filter');
                localStorage.removeItem('omegoo_voice_intensity');
                setSaveMessage('Voice filter cache cleared successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              }}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              Clear Voice Filter Cache
            </button>
          </div>
        </div>
      </div>

      {/* AR Face Masks & Blur */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center text-lg font-semibold text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mr-2 h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
              AR Face Masks & Blur
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Privacy First
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Default AR Mask */}
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div className="flex-1">
                <div className="font-medium text-white text-sm sm:text-base">Default Face Mask</div>
                <div className="text-xs sm:text-sm text-white/60">Choose your preferred mask for video calls</div>
              </div>
              <select 
                value={settings.defaultARMask}
                onChange={(e) => updateSetting('defaultARMask', e.target.value as FaceMaskType)}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-inner transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {(Object.keys(FACE_MASK_PRESETS) as FaceMaskType[]).map((maskType) => {
                  const preset = FACE_MASK_PRESETS[maskType];
                  return (
                    <option key={maskType} value={maskType} className="bg-slate-900 text-white">
                      {preset.emoji} {preset.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Auto-Enable Blur */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Auto-Blur on Join</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Automatically blur video when joining calls for privacy</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.autoEnableBlur} onChange={(value) => updateSetting('autoEnableBlur', value)} />
            </div>

            {/* Blur Duration Presets */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="mb-3">
                <div className="font-medium text-white text-sm sm:text-base">Default Blur Duration</div>
                <div className="text-xs sm:text-sm text-white/60">How long video stays blurred before auto-reveal</div>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: '5s', value: 5, emoji: '⚡' },
                  { label: '10s', value: 10, emoji: '⏱️' },
                  { label: '15s', value: 15, emoji: '🕐' },
                  { label: '30s', value: 30, emoji: '⏰' }
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSetting('defaultBlurDuration', preset.value)}
                    className={`rounded-2xl border px-2 py-3 text-sm font-semibold transition sm:px-3 ${
                      settings.defaultBlurDuration === preset.value
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{preset.emoji}</div>
                    <div>{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Mode */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">AR Performance Mode</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Optimize face detection for low-end devices (reduces accuracy)</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.arPerformanceMode} onChange={(value) => updateSetting('arPerformanceMode', value)} />
            </div>

            {/* Info Banner */}
            <div className="rounded-2xl border border-blue-400/40 bg-blue-500/10 px-4 py-4 text-sm text-blue-100">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mt-1 h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <div className="font-semibold uppercase tracking-wide text-xs text-blue-100">Client-Side Face Detection</div>
                  <p className="mt-1 text-blue-100/80">Face masks and blur effects are processed locally on your device using TensorFlow.js. No video data is sent to external servers. Blur countdown can be manually revealed or auto-reveals at end.</p>
                </div>
              </div>
            </div>

            {/* Clear Cache Button */}
            <button
              onClick={() => {
                localStorage.removeItem('omegoo_ar_mask');
                localStorage.removeItem('omegoo_blur_duration');
                localStorage.removeItem('omegoo_blur_enabled');
                setSaveMessage('AR filter cache cleared successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              }}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              Clear AR Cache
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Safety */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center text-lg font-semibold text-white">
              <ShieldCheckIcon className="mr-2 h-5 w-5" />
              Privacy & Safety
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Always-on safeguards
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Allow Strangers</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Connect with new people in discovery mode</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.allowStrangers} onChange={(value) => updateSetting('allowStrangers', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Auto-Report Suspicious Activity</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Automatically flag behaviour that breaks community rules</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.reportSuspicious} onChange={(value) => updateSetting('reportSuspicious', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-1 items-center space-x-3">
                <EyeSlashIcon className="h-5 w-5 text-white/60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base">Block Inappropriate Content</div>
                  <div className="text-xs sm:text-sm text-white/60 truncate">Enable AI-powered content filtering</div>
                </div>
              </div>
              <ToggleSwitch enabled={settings.blockInappropriate} onChange={(value) => updateSetting('blockInappropriate', value)} />
            </div>

            <div className="rounded-2xl border border-blue-400/40 bg-blue-500/10 px-4 py-4 text-sm text-blue-100">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="mt-1 h-5 w-5" />
                <div>
                  <div className="font-semibold uppercase tracking-wide text-xs text-blue-100">Age Verification Required</div>
                  <p className="mt-1 text-blue-100/80">You must be 18+ to use Omegoo. Verification unlocks video and audio chat access.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center text-lg font-semibold text-white">
              <BellIcon className="mr-2 h-5 w-5" />
              Notifications
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Stay connected
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm sm:text-base">Chat Notifications</div>
                <div className="text-xs sm:text-sm text-white/60 truncate">Get notified about new matches</div>
              </div>
              <ToggleSwitch enabled={settings.chatNotifications} onChange={(value) => updateSetting('chatNotifications', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm sm:text-base">System Notifications</div>
                <div className="text-xs sm:text-sm text-white/60 truncate">Updates and system messages</div>
              </div>
              <ToggleSwitch enabled={settings.systemNotifications} onChange={(value) => updateSetting('systemNotifications', value)} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm sm:text-base">Sound Effects</div>
                <div className="text-xs sm:text-sm text-white/60 truncate">Play sounds for notifications</div>
              </div>
              <ToggleSwitch enabled={settings.soundEnabled} onChange={(value) => updateSetting('soundEnabled', value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Matching Preferences */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Matching Preferences</h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Tailor discovery
            </span>
          </div>
          
          <div className="mt-4 space-y-4">
            <div>
              <div className="font-medium text-white text-sm sm:text-base">Default Chat Mode</div>
              <p className="mt-1 text-xs sm:text-sm text-white/60">Choose how Omegoo connects you when you hit match.</p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {['text', 'video', 'audio'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('matchingMode', mode)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition sm:px-4 ${
                      settings.matchingMode === mode
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save Status */}
      {saveMessage && (
        <div className={`rounded-3xl border px-4 py-4 text-center shadow-2xl sm:px-6 sm:py-5 ${
          saveMessage.includes('success')
            ? 'border-green-400/50 bg-green-500/10'
            : 'border-red-400/50 bg-red-500/10'
        }`}>
          <p className={`text-sm font-semibold sm:text-base ${
            saveMessage.includes('success') ? 'text-green-100' : 'text-red-200'
          }`}>
            {saveMessage}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-4 text-center shadow-lg backdrop-blur-sm sm:p-6">
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