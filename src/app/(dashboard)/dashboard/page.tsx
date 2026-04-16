'use client';

import { TrendingUp, Flame, Trophy, RefreshCw } from 'lucide-react';
import { useSync } from '@/lib/SyncContext';

function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getColor(count: number) {
  if (count === 0) return { bg: "#1f262e" };
  if (count < 2) return { bg: "rgba(195, 244, 0, 0.2)" };
  if (count < 5) return { bg: "rgba(195, 244, 0, 0.4)" };
  if (count < 10) return { bg: "rgba(195, 244, 0, 0.7)" };
  return { bg: "#c3f400", shadow: "0 0 8px rgba(195, 244, 0, 0.3)" };
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatStatValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'N/A';
}

export default function DashboardPage() {
  const { problems, stats, loading, syncing, platforms, goals } = useSync();

  const solvedByDay = problems.reduce<Record<string, number>>((acc, problem) => {
    const solvedAt = toValidDate(problem.solvedAt);
    if (!solvedAt) return acc;

    const dateStr = solvedAt.toISOString().slice(0, 10);
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  const recentActivity = problems
    .filter((p) => toValidDate(p.solvedAt))
    .sort((a, b) => {
      const bTime = toValidDate(b.solvedAt)?.getTime() ?? 0;
      const aTime = toValidDate(a.solvedAt)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 10)
    .map(p => ({
      problem: p.title,
      language: typeof p.platform === 'string' ? p.platform.toUpperCase() : 'UNKNOWN',
      time: p.rating ? `Rating ${p.rating}` : p.difficulty || 'Solved',
      memory: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags.slice(0, 2).join(', ') : '',
      status: 'success',
      ago: getTimeAgo(toValidDate(p.solvedAt) || new Date()),
    }));

  const weeklyStreak = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const now = new Date();
    const dayIndex = (now.getDay() + 6) % 7;
    const offset = dayIndex - index;
    const target = new Date(now);
    target.setDate(now.getDate() - offset);

    return {
      day,
      completed: Boolean(solvedByDay[target.toISOString().slice(0, 10)]),
    };
  });

  const generateHeatmapData = () => {
    const weeks: { style: any; dateStr: string; count: number }[][] = [];
    const today = new Date();

    for (let w = 51; w >= 0; w--) {
      const week: { style: any; dateStr: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));

        const dateStr = date.toISOString().slice(0, 10);
        const solvedCount = solvedByDay[dateStr] || 0;
        const colorData = getColor(solvedCount);

        week.push({
          style: {
            backgroundColor: colorData.bg,
            boxShadow: colorData.shadow || 'none'
          },
          dateStr: dateStr,
          count: solvedCount
        });
      }
      weeks.push(week);
    }
    return weeks;
  };

  const activeDaysLast30 = Array.from({ length: 30 }, (_, idx) => idx).reduce<number>((count, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - idx);
    const dayKey = date.toISOString().slice(0, 10);
    return count + (solvedByDay[dayKey] ? 1 : 0);
  }, 0);

  const consistencyScore = Math.round((activeDaysLast30 / 30) * 100);

  const getGoalCurrent = (goal: any) => {
    switch (goal.metric) {
      case 'hardSolved':
        return stats.byDifficulty.Hard;
      case 'streak':
        return stats.streak;
      case 'tagSolved':
        return goal.tag ? (stats.byTag[goal.tag] || 0) : 0;
      case 'totalSolved':
      default:
        return stats.totalSolved;
    }
  };

  const activeMissions = goals
    .filter(g => g.status === 'active')
    .slice(0, 3)
    .map(goal => {
      const currentRaw = getGoalCurrent(goal);
      const current = goal.metric === 'tagSolved' ? currentRaw - (goal.initialValue || 0) : currentRaw;
      const progress = Math.min(100, Math.round((current / goal.target) * 100));
      return { ...goal, current, progress };
    });

  const heatmapData = generateHeatmapData();
  const bestDaySolved = Math.max(...Object.values(solvedByDay), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#81ecff] animate-spin" />
          <p className="text-[#a7abb2]">Loading your data...</p>
        </div>
      </div>
    );
  }

  const displayActivity = recentActivity;

  return (
    <div className="space-y-8">
      {/* Row 1: Key Metrics & Streak */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-8 bg-[#141a20] rounded-xl p-8 border border-[#43484e]/10 hover:bg-[#1a2027] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#81ecff]/5 rounded-full blur-3xl group-hover:bg-[#81ecff]/10 transition-colors"></div>
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[#a7abb2] text-xs uppercase tracking-widest font-headline">Total Solved</p>
              <h2 className="text-5xl font-black text-[#eaeef5] font-headline tracking-tighter">
                {stats.totalSolved.toLocaleString()}
              </h2>
              <div className="flex items-center gap-2 text-[#c3f400] text-xs font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Keep it up!</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[#a7abb2] text-xs uppercase tracking-widest font-bold">By Platform</p>
              <div className="space-y-1">
                {Object.entries(stats.byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between items-center">
                    <span className="text-[#eaeef5] capitalize">{platform}</span>
                    <span className="text-[#81ecff] font-mono">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.byPlatform).length === 0 && (
                  <span className="text-[#a7abb2] text-sm">Add platforms to sync</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[#a7abb2] text-xs uppercase tracking-widest font-bold">Consistency (30d)</p>
              <h2 className="text-5xl font-black tracking-tighter text-[#d277ff]">
                {consistencyScore}%
              </h2>
              <div className="w-full bg-[#1a2027] h-1 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#d277ff] h-full shadow-[0_0_8px_rgba(210,119,255,0.4)]"
                  style={{ width: `${consistencyScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Streak Card */}
        <div className="md:col-span-4 bg-[#141a20] rounded-xl p-8 border border-[#43484e]/10 hover:bg-[#1a2027] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[#a7abb2] text-xs uppercase tracking-widest font-headline">Current Streak</p>
              <h3 className="text-4xl font-black text-[#eaeef5] font-headline tracking-tighter">{stats.streak} Days</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.streak > 0 ? 'bg-[#ff716c]/20 animate-pulse' : 'bg-[#1f262e]'}`}>
              <Flame className={`w-7 h-7 ${stats.streak > 0 ? 'text-[#ff716c]' : 'text-[#a7abb2]'}`} />
            </div>
          </div>
          <div className="mt-8 flex gap-1">
            {weeklyStreak.map((day, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${day.completed ? 'bg-[#c3f400]' : 'bg-[#1f262e]'}`}
                title={day.day}
              />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[#a7abb2] font-mono uppercase tracking-tight">
            {stats.streak > 0 ? `Next milestone: ${50 - (stats.streak % 50)} Day Badge` : 'Solve a problem to start!'}
          </p>
        </div>
      </div>

      {/* Row 2: 12-Month Activity Heatmap */}
      <div className="bg-[#141a20] rounded-xl p-8 border border-[#43484e]/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-xl font-bold font-headline text-[#eaeef5]">Algorithmic Pulse</h3>
            <p className="text-sm text-[#a7abb2]">
              {problems.length.toLocaleString()} submissions in the last year
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#a7abb2] font-mono uppercase tracking-wider">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#1f262e]"></div>
              <div className="w-3 h-3 rounded-sm bg-[#c3f400]/20"></div>
              <div className="w-3 h-3 rounded-sm bg-[#c3f400]/40"></div>
              <div className="w-3 h-3 rounded-sm bg-[#c3f400]/70"></div>
              <div className="w-3 h-3 rounded-sm bg-[#c3f400] shadow-[0_0_8px_rgba(195,244,0,0.3)]"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 pb-2">
            {heatmapData.map((week: any, weekIndex: number) =>
              week.map((item: any, dayIndex: number) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="w-3 h-3 rounded-sm hover:ring-1 hover:ring-[#81ecff] transition-all cursor-crosshair"
                  style={item.style}
                  title={`${item.dateStr}: ${item.count} submission${item.count !== 1 ? 's' : ''}`}
                />
              ))
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-[#a7abb2] font-mono">
          <span>{activeDaysLast30}/30 active days this month</span>
          <span>Max activity: {bestDaySolved} solved/day</span>
        </div>
      </div>

      {/* Row 3: Difficulty Breakdown & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating Trajectory (Replacing Mastery Levels) */}
        <div className="lg:col-span-7 bg-[#141a20] rounded-xl p-8 space-y-8 border border-[#43484e]/10">
          <h3 className="text-xl font-bold font-headline text-[#eaeef5]">Rating Trajectory</h3>
          <div className="space-y-12">
            {/* Codeforces Trajectory */}
            <div className="relative h-24 w-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#ff716c] font-headline uppercase tracking-wider">Codeforces</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#ff716c]/10 text-[#ff716c] text-[10px] font-bold">LIVE</span>
                </div>
                {(() => {
                  const codeforcesPlatform = platforms.find((p) => p.name === 'codeforces');
                  const rating = formatStatValue(codeforcesPlatform?.stats?.rating);
                  const rank = formatStatValue(codeforcesPlatform?.stats?.rank);

                  return (
                <span className="mono text-xs text-[#eaeef5]">
                    {rating}
                    <span className="text-[#a7abb2] ml-1">({rank})</span>
                </span>
                  );
                })()}
              </div>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,50 Q50,45 100,48 T200,20 T300,15 T400,5" fill="none" stroke="#ff716c" strokeWidth="2" strokeLinecap="round" />
                <circle cx="400" cy="5" fill="#ff716c" r="3" className="animate-pulse" />
                <defs>
                  <linearGradient id="grad-cf" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#ff716c', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: '#ff716c', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* LeetCode Trajectory */}
            <div className="relative h-24 w-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#81ecff] font-headline uppercase tracking-wider">LeetCode</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#81ecff]/10 text-[#81ecff] text-[10px] font-bold">CONNECTED</span>
                </div>
                {(() => {
                  const leetcodePlatform = platforms.find((p) => p.name === 'leetcode');
                  const ranking = formatStatValue(leetcodePlatform?.stats?.ranking);

                  return (
                <span className="mono text-xs text-[#eaeef5]">
                    Rank: {ranking}
                </span>
                  );
                })()}
              </div>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,55 Q50,52 100,30 T200,25 T300,10 T400,2" fill="none" stroke="#81ecff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="400" cy="2" fill="#81ecff" r="3" className="animate-pulse" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activity & Missions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div className="bg-[#141a20] rounded-xl p-6 border border-[#c3f400]/20 shadow-[0_0_15px_rgba(195,244,0,0.05)] relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#c3f400]/5 rounded-full blur-2xl"></div>
              <h3 className="text-sm font-bold font-headline text-[#c3f400] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Active Missions
              </h3>
              <div className="space-y-4">
                {activeMissions.map((mission) => (
                  <div key={mission.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-[#eaeef5] leading-tight">{mission.title.replace('Mission: ', '')}</p>
                        <p className="text-[10px] text-[#a7abb2]">{mission.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#c3f400]">{mission.current}/{mission.target}</span>
                    </div>
                    <div className="w-full bg-[#1a2027] h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${mission.progress}%`,
                          backgroundColor: mission.color,
                          boxShadow: `0 0 8px ${mission.color}40`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <a href="/goals" className="block text-center mt-4 text-[10px] text-[#a7abb2] hover:text-[#c3f400] transition-colors uppercase font-bold tracking-tighter">
                Manage all goals →
              </a>
            </div>
          )}


          <div className="bg-[#141a20] rounded-xl p-8 flex flex-col border border-[#43484e]/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-headline text-[#eaeef5]">Recent Activity</h3>
              <a href="/problems" className="text-xs text-[#81ecff] hover:underline font-headline font-bold">
                View All
              </a>
            </div>
          <div className="space-y-4 flex-1">
            {displayActivity.length > 0 ? displayActivity.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0e1419] border border-transparent hover:border-[#43484e]/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-[#c3f400] shadow-[0_0_8px_rgba(195,244,0,0.5)]' : 'bg-[#ff716c] animate-pulse'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-[#eaeef5]">{item.problem}</p>
                    <p className="text-[10px] text-[#a7abb2] font-mono">
                      {item.language} {item.time && `• ${item.time}`} {item.memory && `• ${item.memory}`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#a7abb2] font-mono">{item.ago}</span>
              </div>
            )) : (
              <div className="text-sm text-[#a7abb2] p-3 rounded-lg bg-[#0e1419]">
                Sync your accounts to populate recent activity.
              </div>
            )}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-[#1f262e] flex items-center gap-4">
            <Trophy className="w-6 h-6 text-[#c3f400]" />
            <div>
              <p className="text-xs font-bold text-[#eaeef5]">System Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-[#81ecff] animate-ping' : 'bg-[#c3f400]'}`}></div>
                <p className="text-[10px] text-[#a7abb2] font-mono">
                  {syncing ? 'Syncing data...' : 'All judges online'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}


