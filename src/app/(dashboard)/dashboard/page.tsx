'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User, Bell, Palette, Database, Trophy, ExternalLink, X, Plus, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSync } from '@/lib/SyncContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PLATFORM_OPTIONS = [
  {
    name: 'codeforces',
    displayName: 'Codeforces',
    placeholder: 'Enter your Codeforces handle',
    url: 'https://codeforces.com/profile/',
    color: '#ff716c'
  },
  {
    name: 'leetcode',
    displayName: 'LeetCode',
    placeholder: 'Enter your LeetCode username',
    url: 'https://leetcode.com/',
    color: '#81ecff'
  },
  {
    name: 'hackerrank',
    displayName: 'HackerRank',
    placeholder: 'Enter your HackerRank username',
    url: 'https://www.hackerrank.com/profile/',
    color: '#c3f400'
  },
];

type UserPreferences = {
  theme: 'dark';
  language: string;
  timezone: string;
  streakReminders: boolean;
  contestAlerts: boolean;
  weeklyDigest: boolean;
};

type LeaderboardProfileSettings = {
  isPublic: boolean;
  alias: string;
};

type SettingsItem = {
  label: string;
  value: string;
  danger?: boolean;
};

type SettingsSection = {
  title: string;
  icon: typeof User;
  items: SettingsItem[];
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  language: 'English',
  timezone: 'Auto-detect',
  streakReminders: true,
  contestAlerts: true,
  weeklyDigest: true,
};

function toValidDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date | string | number | null | undefined): string | null {
  const validDate = toValidDate(date);
  if (!validDate) return null;
  const now = new Date();
  const diff = now.getTime() - validDate.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { platforms, addPlatform, removePlatform, syncPlatform, syncing, stats } = useSync();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [leaderboardProfile, setLeaderboardProfile] = useState<LeaderboardProfileSettings>({ isPublic: false, alias: '' });
  const [savingLeaderboardProfile, setSavingLeaderboardProfile] = useState(false);
  const [leaderboardProfileMessage, setLeaderboardProfileMessage] = useState<string | null>(null);

  const getPlatformConfig = (name: string) =>
    PLATFORM_OPTIONS.find(p => p.name === name);

  const handleAddPlatform = async () => {
    if (newPlatform && newHandle) {
      await addPlatform(newPlatform, newHandle);
      setShowAddModal(false);
      setNewPlatform('');
      setNewHandle('');
    }
  };

  const handleSync = async (name: string) => {
    await syncPlatform(name);
  };

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const getAuthHeaders = async () => {
      const token = await user.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
      };
    };

    const loadPreferences = async () => {
      try {
        const preferencesDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'));
        if (!preferencesDoc.exists()) return;

        const data = preferencesDoc.data();
        if (!mounted) return;
        setPreferences((prev) => ({
          ...prev,
          ...data,
        } as UserPreferences));
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    };

    const loadLeaderboardProfile = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/leaderboard/profile', { headers });
        if (!response.ok) return;
        const payload = await response.json();

        if (!mounted) return;
        setLeaderboardProfile({
          isPublic: Boolean(payload.isPublic),
          alias: typeof payload.alias === 'string' ? payload.alias : '',
        });
      } catch (err) {
        console.error('Failed to load leaderboard profile:', err);
      }
    };

    loadPreferences();
    loadLeaderboardProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const savePreferences = async () => {
    if (!user) return;

    setSavingPreferences(true);
    setPreferencesMessage(null);
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), preferences, { merge: true });
      setPreferencesMessage('Preferences saved.');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setPreferencesMessage('Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const saveLeaderboardProfile = async () => {
    if (!user) return;

    setSavingLeaderboardProfile(true);
    setLeaderboardProfileMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/leaderboard/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublic: leaderboardProfile.isPublic,
          alias: leaderboardProfile.alias,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save privacy settings');
      }

      setLeaderboardProfileMessage('Leaderboard privacy saved.');
    } catch (err) {
      console.error('Failed to save leaderboard profile:', err);
      setLeaderboardProfileMessage('Failed to save leaderboard privacy.');
    } finally {
      setSavingLeaderboardProfile(false);
    }
  };

  const exportData = () => {
    const payload = {
      user: {
        uid: user?.uid || null,
        displayName: user?.displayName || null,
        email: user?.email || null,
      },
      preferences,
      stats,
      platforms,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'algolytics-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Display Name', value: user?.displayName || 'Not set' },
        { label: 'Email', value: user?.email || 'Not set' },
        { label: 'Member Since', value: 'Recently' },
      ],
    },
    {
      title: 'Preferences',
      icon: Palette,
      items: [
        { label: 'Theme', value: 'Dark (Neon Architect)' },
        { label: 'Language', value: preferences.language },
        { label: 'Timezone', value: preferences.timezone },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Streak Reminders', value: preferences.streakReminders ? 'Enabled' : 'Disabled' },
        { label: 'Contest Alerts', value: preferences.contestAlerts ? 'Enabled' : 'Disabled' },
        { label: 'Weekly Digest', value: preferences.weeklyDigest ? 'Enabled' : 'Disabled' },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#eaeef5]">Settings</h2>
          <p className="text-[#a7abb2] mt-2">Manage your account preferences and configurations.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="gradient-btn text-[#003840] font-bold text-sm px-6 py-2.5 rounded-lg shadow-lg shadow-[#81ecff]/10 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Connect Platform
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Account Settings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-6">
            {settingsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-[#141a20] rounded-xl overflow-hidden border border-[#43484e]/10">
                  <div className="px-6 py-4 bg-[#1a2027] border-b border-[#43484e]/10 flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#81ecff]" />
                    <h3 className="font-bold text-[#eaeef5]">{section.title}</h3>
                  </div>
                  <div className="divide-y divide-[#43484e]/10">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="px-6 py-4 flex items-center justify-between hover:bg-[#1a2027]/50 transition-colors">
                        <span className="text-sm text-[#eaeef5]">{item.label}</span>
                        <span className={`text-sm font-mono ${item.danger ? 'text-[#ff716c]' : 'text-[#a7abb2]'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="bg-[#141a20] rounded-xl p-6 border border-[#43484e]/10 space-y-5">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#81ecff]" />
                <h3 className="font-bold text-[#eaeef5]">Editable Preferences</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-[#a7abb2]">
                  Language
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value }))}
                    className="mt-2 w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5]"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                  </select>
                </label>

                <label className="text-sm text-[#a7abb2]">
                  Timezone
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="mt-2 w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5]"
                  >
                    <option>Auto-detect</option>
                    <option>UTC</option>
                    <option>Asia/Kolkata</option>
                    <option>Europe/London</option>
                    <option>America/New_York</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-xs text-[#a7abb2] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.streakReminders}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, streakReminders: e.target.checked }))}
                  />
                  Streak reminders
                </label>
                <label className="text-xs text-[#a7abb2] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.contestAlerts}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, contestAlerts: e.target.checked }))}
                  />
                  Contest alerts
                </label>
                <label className="text-xs text-[#a7abb2] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.weeklyDigest}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, weeklyDigest: e.target.checked }))}
                  />
                  Weekly digest
                </label>
              </div>

              <div className="pt-4 border-t border-[#43484e]/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#81ecff]" />
                  <h4 className="text-sm font-bold text-[#eaeef5]">Leaderboard Privacy</h4>
                </div>

                <label className="text-xs text-[#a7abb2] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={leaderboardProfile.isPublic}
                    onChange={(e) => setLeaderboardProfile((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Make my profile visible on global leaderboard
                </label>

                <label className="text-sm text-[#a7abb2] block">
                  Public alias
                  <input
                    type="text"
                    maxLength={30}
                    value={leaderboardProfile.alias}
                    onChange={(e) => setLeaderboardProfile((prev) => ({ ...prev, alias: e.target.value }))}
                    placeholder={user?.displayName || 'Anonymous Coder'}
                    className="mt-2 w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5]"
                  />
                </label>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveLeaderboardProfile}
                    disabled={savingLeaderboardProfile}
                    className="px-4 py-2 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-xs uppercase tracking-wider disabled:opacity-60"
                  >
                    {savingLeaderboardProfile ? 'Saving...' : 'Save Leaderboard Privacy'}
                  </button>
                  {leaderboardProfileMessage && <span className="text-xs text-[#a7abb2]">{leaderboardProfileMessage}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={savePreferences}
                  disabled={savingPreferences}
                  className="px-4 py-2 rounded-lg bg-[#81ecff] text-[#003840] font-bold text-sm disabled:opacity-60"
                >
                  {savingPreferences ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  onClick={exportData}
                  className="px-4 py-2 rounded-lg bg-[#1f262e] text-[#eaeef5] font-bold text-sm"
                >
                  Export Data
                </button>
                {preferencesMessage && <span className="text-xs text-[#a7abb2]">{preferencesMessage}</span>}
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-[#141a20] rounded-xl p-8 flex items-center gap-6 border border-[#43484e]/10">
              <div className="w-20 h-20 rounded-full bg-[#1f262e] border-2 border-[#81ecff]/20 overflow-hidden">
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#81ecff]">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#eaeef5]">{user?.displayName || 'User'}</h3>
                <p className="text-[#a7abb2]">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 bg-[#c3f400]/10 text-[#c3f400] text-xs font-bold rounded">
                  Level 1 Newcomer
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Connections */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#a7abb2] px-1">
            Platforms
          </h3>

          <div className="space-y-4">
            {platforms.map((platform) => {
              const config = getPlatformConfig(platform.name);
              const isConnected = !!platform.handle;
              const lastSynced = formatDate(platform.lastSynced);

              return (
                <div key={platform.name} className="bg-[#141a20] p-6 rounded-xl space-y-4 border border-[#43484e]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config?.color}20` }}>
                        <Trophy className="w-5 h-5" style={{ color: config?.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{config?.displayName}</p>
                        <p className="text-xs text-[#a7abb2]">
                          {lastSynced ? `Synced ${lastSynced}` : isConnected ? 'Ready to sync' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removePlatform(platform.name)} className="p-2 text-[#a7abb2] hover:text-[#ff716c] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isConnected ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-[#000000] rounded-md px-3 py-2">
                        <span className="text-sm text-[#81ecff] font-mono flex-1">{platform.handle}</span>
                        <a href={`${config?.url}${platform.handle}`} target="_blank" rel="noopener noreferrer" className="text-[#a7abb2] hover:text-[#81ecff]">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <button onClick={() => handleSync(platform.name)} disabled={syncing} className="w-full py-2 rounded-md bg-[#1f262e] text-[#81ecff] text-sm font-bold hover:bg-[#252d35] transition-colors disabled:opacity-50">
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#a7abb2]">Connect to start tracking</p>
                  )}
                </div>
              );
            })}

            {platforms.length === 0 && (
              <div className="bg-[#141a20] p-8 rounded-xl text-center border border-[#43484e]/10 border-dashed">
                <p className="text-[#a7abb2] text-sm mb-4">No platforms linked</p>
                <button onClick={() => setShowAddModal(true)} className="text-[#81ecff] hover:underline text-sm font-bold">
                  + Link Platform
                </button>
              </div>
            )}
          </div>

          {/* Sync Stats Summary */}
          {Object.keys(stats.byPlatform).length > 0 && (
            <div className="bg-[#0e1419] p-5 rounded-xl border border-[#43484e]/10">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#81ecff]" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#eaeef5]">Sync Statistics</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between items-center">
                    <span className="text-xs capitalize text-[#a7abb2]">{platform}</span>
                    <div className="h-1 flex-1 mx-4 bg-[#1f262e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#81ecff]" style={{ width: `${Math.min(100, (count / stats.totalSolved) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-mono text-[#eaeef5]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-[#43484e]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#81ecff]">Link Platform</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#a7abb2] hover:text-[#eaeef5]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-3 px-1">
                  Select Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => setNewPlatform(platform.name)}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${newPlatform === platform.name
                        ? 'border-[#81ecff] bg-[#81ecff]/10 scale-[1.05]'
                        : 'border-[#43484e]/20 hover:border-[#81ecff]/40'
                        }`}
                    >
                      <Trophy className="w-5 h-5" style={{ color: platform.color }} />
                      <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: newPlatform === platform.name ? platform.color : '#a7abb2' }}>
                        {platform.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2 px-1">
                  Username / Handle
                </label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder={PLATFORM_OPTIONS.find(p => p.name === newPlatform)?.placeholder || 'Enter your handle'}
                  className="w-full bg-[#000000] border border-[#43484e]/30 rounded-xl p-4 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none transition-all"
                />
              </div>

              <button
                onClick={handleAddPlatform}
                disabled={!newPlatform || !newHandle}
                className="w-full py-4 gradient-btn text-[#003840] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#81ecff]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Add & Sync Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
