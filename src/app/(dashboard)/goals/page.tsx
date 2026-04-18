'use client';

import { useEffect, useState } from 'react';
import { Plus, Trophy, LayoutGrid, TrendingUp, ExternalLink, Check, X } from 'lucide-react';
import { useSync } from '@/lib/SyncContext';

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

const GOALS_STORAGE_KEY = 'algolytics.customGoals';
const WEEKLY_CHALLENGES_STORAGE_KEY = 'algolytics.weeklyChallenges';

type GoalMetric = 'totalSolved' | 'hardSolved' | 'streak';

type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  metric: GoalMetric;
  target: number;
  color: string;
};

type EnrolledWeeklyChallenge = WeeklyChallenge & {
  weekKey: string;
  baseline: number;
  enrolledAt: string;
};

type CustomGoal = {
  id: string;
  title: string;
  subtitle: string;
  metric: GoalMetric;
  target: number;
  current: number;
  color: string;
};

const WEEKLY_CHALLENGE_LIBRARY: WeeklyChallenge[] = [
  {
    id: 'weekly-volume-12',
    title: 'Weekly Sprint: 12 Solves',
    description: 'Finish 12 problems this week across any platform.',
    metric: 'totalSolved',
    target: 12,
    color: '#81ecff',
  },
  {
    id: 'weekly-hard-3',
    title: 'Hard Hunter: 3 Hard',
    description: 'Complete 3 hard problems this week.',
    metric: 'hardSolved',
    target: 3,
    color: '#ff716c',
  },
  {
    id: 'weekly-streak-5',
    title: 'Consistency Lock: 5-Day Streak',
    description: 'Reach a 5-day streak this week.',
    metric: 'streak',
    target: 5,
    color: '#c3f400',
  },
];

function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getCurrentWeekKey() {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utc.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + mondayOffset);
  return utc.toISOString().slice(0, 10);
}

function loadCustomGoalsFromStorage(): CustomGoal[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((goal) => ({
        id: String(goal.id || crypto.randomUUID()),
        title: String(goal.title || 'Untitled Goal'),
        subtitle: String(goal.subtitle || ''),
        metric: goal.metric === 'hardSolved' || goal.metric === 'streak' ? goal.metric : 'totalSolved',
        target: safeNumber(goal.target) || 1,
        current: safeNumber(goal.current),
        color: String(goal.color || '#81ecff'),
      }))
      .slice(0, 12);
  } catch {
    return [];
  }
}

function loadWeeklyChallengesFromStorage(): EnrolledWeeklyChallenge[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(WEEKLY_CHALLENGES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const currentWeekKey = getCurrentWeekKey();
    return parsed
      .map((challenge) => ({
        id: String(challenge.id || ''),
        title: String(challenge.title || 'Weekly Challenge'),
        description: String(challenge.description || ''),
        metric: challenge.metric === 'hardSolved' || challenge.metric === 'streak' ? challenge.metric : 'totalSolved',
        target: Math.max(1, safeNumber(challenge.target) || 1),
        color: String(challenge.color || '#81ecff'),
        weekKey: String(challenge.weekKey || currentWeekKey),
        baseline: safeNumber(challenge.baseline),
        enrolledAt: String(challenge.enrolledAt || new Date().toISOString()),
      }))
      .filter((challenge) => challenge.weekKey === currentWeekKey);
  } catch {
    return [];
  }
}

export default function GoalsPage() {
  const { platforms, addPlatform, removePlatform, syncPlatform, syncing, stats } = useSync();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>(loadCustomGoalsFromStorage);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSubtitle, setGoalSubtitle] = useState('');
  const [goalMetric, setGoalMetric] = useState<GoalMetric>('totalSolved');
  const [goalTarget, setGoalTarget] = useState('10');
  const [goalColor, setGoalColor] = useState('#81ecff');
  const [enrolledWeeklyChallenges, setEnrolledWeeklyChallenges] = useState<EnrolledWeeklyChallenge[]>(loadWeeklyChallengesFromStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(customGoals));
    } catch {
      // Ignore storage failures; the page still works without persistence.
    }
  }, [customGoals]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WEEKLY_CHALLENGES_STORAGE_KEY, JSON.stringify(enrolledWeeklyChallenges));
    } catch {
      // Ignore storage failures; weekly challenge enrollment remains functional for current session.
    }
  }, [enrolledWeeklyChallenges]);

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

  const getGoalCurrent = (goal: CustomGoal) => {
    switch (goal.metric) {
      case 'hardSolved':
        return stats.byDifficulty.Hard;
      case 'streak':
        return stats.streak;
      case 'totalSolved':
      default:
        return stats.totalSolved;
    }
  };

  const getMetricValue = (metric: GoalMetric) => {
    switch (metric) {
      case 'hardSolved':
        return stats.byDifficulty.Hard;
      case 'streak':
        return stats.streak;
      case 'totalSolved':
      default:
        return stats.totalSolved;
    }
  };

  const enrollWeeklyChallenge = (challenge: WeeklyChallenge) => {
    const currentWeekKey = getCurrentWeekKey();
    const alreadyEnrolled = enrolledWeeklyChallenges.some((entry) => entry.id === challenge.id && entry.weekKey === currentWeekKey);
    if (alreadyEnrolled) return;

    setEnrolledWeeklyChallenges((prev) => [
      {
        ...challenge,
        weekKey: currentWeekKey,
        baseline: getMetricValue(challenge.metric),
        enrolledAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const withdrawWeeklyChallenge = (challengeId: string) => {
    const currentWeekKey = getCurrentWeekKey();
    setEnrolledWeeklyChallenges((prev) => prev.filter((entry) => !(entry.id === challengeId && entry.weekKey === currentWeekKey)));
  };

  const getWeeklyProgress = (challenge: EnrolledWeeklyChallenge) => {
    const currentValue = getMetricValue(challenge.metric);
    const progressValue = challenge.metric === 'streak'
      ? Math.max(0, currentValue)
      : Math.max(0, currentValue - challenge.baseline);

    const percent = Math.min(100, Math.round((progressValue / challenge.target) * 100));

    return {
      current: Math.min(progressValue, challenge.target),
      rawCurrent: progressValue,
      percent,
    };
  };

  const addCustomGoal = () => {
    const target = Number(goalTarget);
    if (!goalTitle.trim() || !Number.isFinite(target) || target <= 0) return;

    const current = getGoalCurrent({
      id: '',
      title: goalTitle.trim(),
      subtitle: goalSubtitle.trim() || 'Personal milestone',
      metric: goalMetric,
      target,
      current: 0,
      color: goalColor,
    });

    const nextGoal: CustomGoal = {
      id: crypto.randomUUID(),
      title: goalTitle.trim(),
      subtitle: goalSubtitle.trim() || 'Personal milestone',
      metric: goalMetric,
      target,
      current,
      color: goalColor,
    };

    setCustomGoals((prev) => [nextGoal, ...prev].slice(0, 12));
    setShowGoalModal(false);
    setGoalTitle('');
    setGoalSubtitle('');
    setGoalMetric('totalSolved');
    setGoalTarget('10');
    setGoalColor('#81ecff');
  };

  const removeCustomGoal = (goalId: string) => {
    setCustomGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const generatedGoals = [
    {
      id: 'weekly-volume',
      label: 'Consistency',
      title: 'Solve 25 problems this month',
      subtitle: 'Monthly volume target',
      current: Math.min(stats.totalSolved, 25),
      target: 25,
      color: '#d277ff',
    },
    {
      id: 'hard-focus',
      label: 'Difficulty',
      title: 'Solve 10 hard problems',
      subtitle: 'Push your upper bound',
      current: Math.min(stats.byDifficulty.Hard, 10),
      target: 10,
      color: '#c3f400',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Connected Platforms */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#a7abb2]">
              Connected Platforms
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-[#81ecff] hover:underline"
            >
              + Add
            </button>
          </div>

          <div className="space-y-4">
            {platforms.map((platform) => {
              const config = getPlatformConfig(platform.name);
              const isConnected = !!platform.handle;
              const lastSynced = formatDate(platform.lastSynced);

              return (
                <div key={platform.name} className="bg-[#141a20] p-6 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config?.color}20` }}
                      >
                        <Trophy className="w-5 h-5" style={{ color: config?.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{config?.displayName}</p>
                        <p className="text-xs text-[#a7abb2]">
                          {lastSynced
                            ? `Synced ${lastSynced}`
                            : isConnected
                              ? 'Ready to sync'
                              : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlatform(platform.name)}
                      className="p-2 text-[#a7abb2] hover:text-[#ff716c] transition-colors"
                      title="Remove platform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isConnected ? (
                    <>
                      <div className="flex items-center gap-2 bg-[#000000] rounded-md px-3 py-2">
                        <span className="text-sm text-[#81ecff] font-mono flex-1">{platform.handle}</span>
                        <a
                          href={`${config?.url}${platform.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#a7abb2] hover:text-[#81ecff]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <button
                        onClick={() => handleSync(platform.name)}
                        disabled={syncing}
                        className="w-full py-2 rounded-md bg-[#1f262e] text-[#81ecff] text-sm font-bold hover:bg-[#252d35] transition-colors disabled:opacity-50"
                      >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-[#a7abb2]">Add handle to start syncing</p>
                  )}
                </div>
              );
            })}

            {platforms.length === 0 && (
              <div className="bg-[#141a20] p-6 rounded-xl text-center">
                <p className="text-[#a7abb2] mb-4">No platforms connected yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-[#81ecff] hover:underline text-sm"
                >
                  + Add your first platform
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {Object.keys(stats.byPlatform).length > 0 && (
            <div className="bg-[#0e1419] p-4 rounded-xl">
              <p className="text-xs text-[#a7abb2] uppercase tracking-widest mb-3">Sync Stats</p>
              <div className="space-y-2">
                {Object.entries(stats.byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between">
                    <span className="text-sm capitalize text-[#eaeef5]">{platform}</span>
                    <span className="text-sm font-mono text-[#81ecff]">{count} problems</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Goals Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#a7abb2]">
              Your Goals
            </h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="gradient-btn text-[#003840] font-bold text-sm px-5 py-2 rounded-md shadow-lg shadow-[#81ecff]/10 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>

          {customGoals.length > 0 && (
            <div className="bg-[#141a20] rounded-xl p-6 space-y-4 border border-[#43484e]/15">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#eaeef5]">Custom Goals</h4>
                  <p className="text-xs text-[#a7abb2]">Stored locally in your browser</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#81ecff]">
                  {customGoals.length} active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customGoals.map((goal) => {
                  const current = getGoalCurrent(goal);
                  const percent = Math.min(100, Math.round((current / goal.target) * 100));

                  return (
                    <div key={goal.id} className="bg-[#0e1419] p-4 rounded-lg border border-[#43484e]/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-3"
                            style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                          >
                            {goal.metric}
                          </div>
                          <h5 className="text-sm font-bold text-[#eaeef5]">{goal.title}</h5>
                          <p className="text-xs text-[#a7abb2] mt-1">{goal.subtitle}</p>
                        </div>
                        <button
                          onClick={() => removeCustomGoal(goal.id)}
                          className="text-[#a7abb2] hover:text-[#ff716c] transition-colors"
                          title="Remove goal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-black" style={{ color: goal.color }}>
                            {current}/{goal.target}
                          </span>
                          <p className="text-[10px] text-[#a7abb2] uppercase tracking-widest">Progress</p>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-[#1f262e] stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                            <circle
                              className="stroke-current"
                              cx="50"
                              cy="50"
                              fill="transparent"
                              r="40"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 - (251.2 * percent) / 100}
                              strokeLinecap="round"
                              strokeWidth="8"
                              style={{ color: goal.color }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#eaeef5]">
                            {percent}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-[#141a20] rounded-xl p-6 space-y-5 border border-[#43484e]/15">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#eaeef5]">Weekly Challenges</h4>
                <p className="text-xs text-[#a7abb2]">Enroll in weekly missions and track progress in real time.</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#81ecff]">Week of {getCurrentWeekKey()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WEEKLY_CHALLENGE_LIBRARY.map((challenge) => {
                const enrolled = enrolledWeeklyChallenges.some((entry) => entry.id === challenge.id && entry.weekKey === getCurrentWeekKey());

                return (
                  <div key={challenge.id} className="bg-[#0e1419] rounded-lg p-4 border border-[#43484e]/10">
                    <div
                      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-3"
                      style={{ backgroundColor: `${challenge.color}20`, color: challenge.color }}
                    >
                      {challenge.metric}
                    </div>
                    <h5 className="text-sm font-bold text-[#eaeef5]">{challenge.title}</h5>
                    <p className="text-xs text-[#a7abb2] mt-1">{challenge.description}</p>
                    <button
                      onClick={() => enrollWeeklyChallenge(challenge)}
                      disabled={enrolled}
                      className="mt-4 w-full py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60"
                      style={{
                        backgroundColor: enrolled ? '#1f262e' : `${challenge.color}20`,
                        color: enrolled ? '#a7abb2' : challenge.color,
                      }}
                    >
                      {enrolled ? 'Enrolled' : 'Enroll'}
                    </button>
                  </div>
                );
              })}
            </div>

            {enrolledWeeklyChallenges.length > 0 && (
              <div className="space-y-3 pt-2">
                <h5 className="text-xs uppercase tracking-widest text-[#a7abb2] font-bold">Active Weekly Enrollments</h5>
                {enrolledWeeklyChallenges.map((challenge) => {
                  const progress = getWeeklyProgress(challenge);

                  return (
                    <div key={`${challenge.id}-${challenge.weekKey}`} className="bg-[#0e1419] rounded-lg p-4 border border-[#43484e]/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#eaeef5]">{challenge.title}</p>
                          <p className="text-xs text-[#a7abb2] mt-1">
                            {progress.rawCurrent}/{challenge.target} completed this week
                          </p>
                        </div>
                        <button
                          onClick={() => withdrawWeeklyChallenge(challenge.id)}
                          className="text-[10px] uppercase tracking-widest text-[#a7abb2] hover:text-[#ff716c]"
                        >
                          Withdraw
                        </button>
                      </div>
                      <div className="mt-3 w-full h-2 rounded-full bg-[#1f262e] overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${progress.percent}%`,
                            backgroundColor: challenge.color,
                            boxShadow: `0 0 8px ${challenge.color}55`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-[#a7abb2]">{progress.percent}% complete</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedGoals.map((goal) => {
              const percent = Math.round((goal.current / goal.target) * 100);

              return (
                <div key={goal.id} className="bg-[#1a2027] p-8 rounded-xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {goal.id === 'weekly-volume' ? (
                      <LayoutGrid className="w-16 h-16" style={{ color: goal.color }} />
                    ) : (
                      <TrendingUp className="w-16 h-16" style={{ color: goal.color }} />
                    )}
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div
                        className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-4"
                        style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                      >
                        {goal.label}
                      </div>
                      <h4 className="text-lg font-bold leading-tight mb-2">{goal.title}</h4>
                      <p className="text-[#a7abb2] text-xs mb-8">{goal.subtitle}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black" style={{ color: goal.color }}>
                          {goal.current}/{goal.target}
                        </span>
                        <span className="text-xs text-[#a7abb2]">Completed</span>
                      </div>
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle className="text-[#1f262e] stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
                          <circle
                            className="stroke-current"
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r="40"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * percent) / 100}
                            strokeLinecap="round"
                            strokeWidth="8"
                            style={{ color: goal.color }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#eaeef5]">{percent}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-[#0e1419] border border-[#43484e]/15 p-8 rounded-xl flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1f262e] flex items-center justify-center">
                <Check className="w-6 h-6 text-[#81ecff]" />
              </div>
              <div>
                <p className="text-sm font-bold">Live Goal Tracking Enabled</p>
                <p className="text-xs text-[#a7abb2] mt-1">Goals now adapt to your synced progress automatically.</p>
              </div>
            </div>
          </div>

          {/* Insight Card */}
          <div className="bg-[#141a20] rounded-xl p-8 border-l-4 border-[#c3f400]/50">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h5 className="text-lg font-bold text-[#eaeef5] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c3f400] animate-pulse"></span>
                  Algorithmic Pulse Insight
                </h5>
                <p className="text-[#a7abb2] text-sm mt-2 leading-relaxed">
                  {platforms.length > 0 
                    ? `Based on your ${Object.keys(stats.byPlatform).length > 0 ? Object.keys(stats.byPlatform)[0] : 'platform'} activity, keep solving consistently to improve your skills!`
                    : 'Connect a platform to get personalized insights about your progress.'
                  }
                </p>
              </div>
              <button className="bg-[#1f262e] px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest text-[#c3f400] hover:bg-[#252d35] transition-colors whitespace-nowrap">
                Learn More
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-[#43484e]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#81ecff]">Add Platform</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#a7abb2] hover:text-[#eaeef5]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                  Select Platform
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => setNewPlatform(platform.name)}
                      className={`p-3 rounded-lg border transition-all ${
                        newPlatform === platform.name
                          ? 'border-[#81ecff] bg-[#81ecff]/10'
                          : 'border-[#43484e]/20 hover:border-[#81ecff]/40'
                      }`}
                    >
                      <span 
                        className="text-sm font-bold"
                        style={{ color: newPlatform === platform.name ? platform.color : '#eaeef5' }}
                      >
                        {platform.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                  Username / Handle
                </label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder={PLATFORM_OPTIONS.find(p => p.name === newPlatform)?.placeholder || 'Enter handle'}
                  className="w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                />
              </div>

              <button
                onClick={handleAddPlatform}
                disabled={!newPlatform || !newHandle}
                className="w-full py-4 gradient-btn text-[#003840] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#81ecff]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Add & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-8 border border-[#43484e]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#81ecff]">Add Goal</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-[#a7abb2] hover:text-[#eaeef5]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Solve 15 medium problems"
                  className="w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={goalSubtitle}
                  onChange={(e) => setGoalSubtitle(e.target.value)}
                  placeholder="Monthly growth target"
                  className="w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                    Metric
                  </label>
                  <select
                    value={goalMetric}
                    onChange={(e) => setGoalMetric(e.target.value as GoalMetric)}
                    className="w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                  >
                    <option value="totalSolved">Total solved</option>
                    <option value="hardSolved">Hard solved</option>
                    <option value="streak">Streak days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                    Target
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full bg-[#000000] border border-[#43484e]/30 rounded-lg p-3 text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#a7abb2] mb-2">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={goalColor}
                  onChange={(e) => setGoalColor(e.target.value)}
                  className="w-full h-12 bg-[#000000] border border-[#43484e]/30 rounded-lg p-2"
                />
              </div>

              <button
                onClick={addCustomGoal}
                disabled={!goalTitle.trim() || !Number.isFinite(Number(goalTarget)) || Number(goalTarget) <= 0}
                className="w-full py-4 gradient-btn text-[#003840] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#81ecff]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
