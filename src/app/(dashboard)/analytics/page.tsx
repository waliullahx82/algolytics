'use client';

import { useEffect, useMemo, useState } from 'react';
import { Radar } from 'lucide-react';
import { useSync } from '@/lib/SyncContext';

function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getColor(count: number) {
  if (count === 0) return "#1f262e";
  if (count < 2) return "rgba(195, 244, 0, 0.2)";
  if (count < 5) return "rgba(195, 244, 0, 0.4)";
  if (count < 10) return "rgba(195, 244, 0, 0.7)";
  return "#c3f400";
}

interface CodeforcesSolvedProblem {
  id: string;
  solvedAt?: string;
}

interface CodeforcesApiResponse {
  success: boolean;
  solvedProblems?: CodeforcesSolvedProblem[];
  error?: string;
}

export default function AnalyticsPage() {
  const { stats, problems, loading, syncing, platforms, addGoal } = useSync();
  const [pulseByDay, setPulseByDay] = useState<Record<string, number>>({});
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseError, setPulseError] = useState<string | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<{ title: string, task: string, platform: string }[]>([]);

  const topicTags = Object.entries(stats.byTag)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const strongestTopicCount = topicTags[0]?.[1] || 0;
  const weakTopics = topicTags
    .slice()
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([name, count]) => {
      const progress = strongestTopicCount > 0 ? Math.round((count / strongestTopicCount) * 100) : 0;
      const gap = `${Math.max(0, 100 - progress)}%`;
      return {
        name,
        gap,
        progress,
        recommendation: `Solve 5 more ${name} problems this week`,
      };
    });

  const platformData = Object.entries(stats.byPlatform).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    solved: count,
  }));

  const maxSolved = Math.max(...platformData.map((platform) => platform.solved), 1);
  const solvedByDay = problems.reduce<Record<string, number>>((acc, problem) => {
    const solvedAt = toValidDate(problem.solvedAt);
    if (!solvedAt) return acc;

    const dateStr = solvedAt.toISOString().slice(0, 10);
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  const codeforcesHandle =
    platforms.find((platform) => platform.name === 'codeforces' && platform.enabled)?.handle?.trim() || '';

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAlgorithmicPulse() {
      if (!codeforcesHandle) {
        setPulseByDay({});
        setPulseError(null);
        return;
      }

      setPulseLoading(true);
      setPulseError(null);

      try {
        const response = await fetch(`/api/codeforces?handle=${encodeURIComponent(codeforcesHandle)}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as CodeforcesApiResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load Codeforces pulse');
        }

        const dailyCount = (payload.solvedProblems || []).reduce<Record<string, number>>((acc, problem) => {
          const solvedAt = toValidDate(problem.solvedAt);
          if (!solvedAt) return acc;

          const date = solvedAt.toISOString().slice(0, 10);
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        setPulseByDay(dailyCount);
      } catch (err) {
        if (controller.signal.aborted) return;
        setPulseByDay({});
        setPulseError(err instanceof Error ? err.message : 'Failed to load pulse data');
      } finally {
        if (!controller.signal.aborted) {
          setPulseLoading(false);
        }
      }
    }

    fetchAlgorithmicPulse();

    return () => controller.abort();
  }, [codeforcesHandle]);

  const algorithmicPulseCells = useMemo(() => {
    const days = 365;
    const today = new Date();

    return Array.from({ length: days + 1 }).map((_, index) => {
      const offset = days - index;
      const d = new Date(today);
      d.setDate(today.getDate() - offset);

      const dateStr = d.toISOString().slice(0, 10);
      const count = pulseByDay[dateStr] || 0;

      return {
        dateStr,
        count,
      };
    });
  }, [pulseByDay]);

  const handleGenerateRoadmap = () => {
    setIsGeneratingRoadmap(true);
    // Simulate AI Analysis
    setTimeout(() => {
      const plans = weakTopics.map(topic => ({
        title: topic.name,
        task: `Solve 3 medium-level ${topic.name} problems`,
        platform: Math.random() > 0.5 ? 'Codeforces' : 'LeetCode'
      }));
      setGeneratedRoadmap(plans);
      setIsGeneratingRoadmap(false);
      setShowRoadmap(true);
    }, 2000);
  };

  const handleStartMission = async () => {
    setIsGeneratingRoadmap(true);
    try {
      if (!addGoal) {
        console.error('Goal system not ready');
        return;
      }

      for (const mission of generatedRoadmap) {
        // Find current progress for this tag as the initialValue
        const initialValue = stats.byTag[mission.title] || 0;

        await addGoal({
          title: `Mission: ${mission.title}`,
          subtitle: mission.task,
          metric: 'tagSolved',
          tag: mission.title,
          target: 3, // Per the simulated task "Solve 3 problems"
          initialValue,
          color: Math.random() > 0.5 ? '#c3f400' : '#81ecff',
        });
      }
      setShowRoadmap(false);
    } catch (err) {
      console.error('Failed to start mission:', err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <Radar className="w-8 h-8 text-[#81ecff] animate-pulse" />
          <p className="text-[#a7abb2]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#eaeef5] font-headline">Precision Analytics</h2>
          <p className="text-[#a7abb2] mt-2 font-headline uppercase tracking-widest text-[10px]">
            Deep-dive into your algorithmic proficiency and performance trends.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#141a20] px-4 py-2 rounded-lg flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-[#81ecff] animate-pulse' : 'bg-[#c3f400]'} shadow-[0_0_8px_rgba(195,244,0,0.6)]`}></div>
            <span className="text-xs font-mono text-[#c3f400] uppercase tracking-widest">
              {syncing ? 'Syncing...' : 'Live Data'}
            </span>
          </div>
        </div>
      </section>
      {/* Global Footer Status */}
      <footer className="bg-[#0e1419] rounded-xl p-4 flex flex-wrap justify-between items-center border border-[#43484e]/10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[#a7abb2] tracking-wider">Total Solved</span>
            <span className="text-sm font-bold font-mono">{stats.totalSolved}</span>
          </div>
          <div className="flex flex-col border-l border-[#43484e]/30 pl-8">
            <span className="text-[10px] uppercase text-[#a7abb2] tracking-wider">Easy</span>
            <span className="text-sm font-bold font-mono text-[#00d4ec]">{stats.byDifficulty.Easy}</span>
          </div>
          <div className="flex flex-col border-l border-[#43484e]/30 pl-8">
            <span className="text-[10px] uppercase text-[#a7abb2] tracking-wider">Medium</span>
            <span className="text-sm font-bold font-mono text-[#c3f400]">{stats.byDifficulty.Medium}</span>
          </div>
          <div className="flex flex-col border-l border-[#43484e]/30 pl-8">
            <span className="text-[10px] uppercase text-[#a7abb2] tracking-wider">Hard</span>
            <span className="text-sm font-bold font-mono text-[#ff716c]">{stats.byDifficulty.Hard}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold">{stats.streak} Day Streak</span>
            <span className="text-[10px] text-[#c3f400]">Keep it up!</span>
          </div>
        </div>
      </footer>
      {/* Top Topics */}
      <div className="bg-[#141a20] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#eaeef5] mb-6">Top Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topicTags.map(([tag, count], i) => (
            <div
              key={tag}
              className="flex items-center gap-2 bg-[#0e1419] px-4 py-2 rounded-full"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: i === 0 ? '#d277ff' : i === 1 ? '#81ecff' : i === 2 ? '#c3f400' : '#1f262e',
                  color: i < 3 ? '#0a0f14' : '#a7abb2'
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-[#eaeef5]">{tag}</span>
              <span className="text-xs font-mono text-[#a7abb2]">{count}</span>
            </div>
          ))}
          {topicTags.length === 0 && (
            <p className="text-[#a7abb2] text-sm">Sync your platforms to see topic analysis</p>
          )}
        </div>
      </div>


      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Topic Proficiency Radar */}
        <div className="md:col-span-7 bg-[#141a20] p-6 rounded-xl relative overflow-hidden group border border-[#43484e]/10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#81ecff] font-headline">Topic Proficiency</h3>
              <p className="text-xs text-[#a7abb2] font-headline uppercase tracking-tight">Multi-dimensional skill mapping</p>
            </div>
            <Radar className="w-6 h-6 text-[#81ecff]/40" />
          </div>

          <div className="flex justify-center items-center py-12 relative">
            {/* Abstract Radar Chart */}
            <div className="w-64 h-64 border border-[#43484e]/20 absolute" style={{ clipPath: 'polygon(50% 0%, 97.5% 34.5%, 79% 90.5%, 21% 90.5%, 2.5% 34.5%)', opacity: 0.2 }}></div>
            <div className="w-48 h-48 border border-[#43484e]/30 absolute" style={{ clipPath: 'polygon(50% 0%, 97.5% 34.5%, 79% 90.5%, 21% 90.5%, 2.5% 34.5%)', opacity: 0.4 }}></div>
            <div className="w-32 h-32 border border-[#43484e]/40 absolute" style={{ clipPath: 'polygon(50% 0%, 97.5% 34.5%, 79% 90.5%, 21% 90.5%, 2.5% 34.5%)', opacity: 0.6 }}></div>

            <div className="w-64 h-64 relative">
              <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(210,119,255,0.4)]" viewBox="0 0 100 100">
                <polygon
                  fill="rgba(210,119,255,0.2)"
                  points="50,5 90,35 75,85 30,80 15,40"
                  stroke="#d277ff"
                  strokeWidth="1.5"
                />
                <circle cx="50" cy="5" fill="#d277ff" r="1.5" />
                <circle cx="90" cy="35" fill="#d277ff" r="1.5" />
                <circle cx="75" cy="85" fill="#d277ff" r="1.5" />
                <circle cx="30" cy="80" fill="#d277ff" r="1.5" />
                <circle cx="15" cy="40" fill="#d277ff" r="1.5" />
              </svg>
              {topicTags.slice(0, 5).map((tag, i) => {
                const positions = [
                  { top: '-24px', left: '50%', transform: 'translateX(-50%)' },
                  { top: '25%', right: '-60px' },
                  { bottom: '-20px', right: '25%' },
                  { bottom: '-20px', left: '25%' },
                  { top: '25%', left: '-60px' },
                ];
                return (
                  <span
                    key={tag[0]}
                    className="absolute text-[10px] font-mono text-[#a7abb2] uppercase"
                    style={positions[i]}
                  >
                    {tag[0].split(' ')[0]}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-[#0e1419] p-3 rounded-lg">
              <span className="text-[10px] text-[#a7abb2] uppercase tracking-tighter">Peak Domain</span>
              <p className="text-sm font-bold text-[#d277ff]">{topicTags[0]?.[0] || 'N/A'}</p>
            </div>
            <div className="bg-[#0e1419] p-3 rounded-lg">
              <span className="text-[10px] text-[#a7abb2] uppercase tracking-tighter">Growth Needed</span>
              <p className="text-sm font-bold text-[#c3f400]">Practice Weak Areas</p>
            </div>
          </div>
        </div>

        {/* Recommended Topics */}
        <div className="md:col-span-5 bg-[#1a2027] p-6 rounded-xl border border-[#43484e]/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#eaeef5] font-headline">Practice Strategy</h3>
            <span className="text-xs bg-[#d277ff]/10 text-[#d277ff] px-2 py-0.5 rounded font-mono">Priority: High</span>
          </div>

          <div className="space-y-4">
            {weakTopics.length > 0 ? weakTopics.map((topic, index) => (
              <div
                key={index}
                className="group bg-[#000000] p-4 rounded-lg hover:bg-[#252d35] transition-colors cursor-pointer"
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold">{topic.name}</span>
                  <span className="text-xs text-[#c3f400]">{topic.gap} Gap</span>
                </div>
                <div className="w-full bg-[#1f262e] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#c3f400] h-full shadow-[0_0_8px_rgba(195,244,0,0.5)]"
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#a7abb2] mt-2">Recommended: {topic.recommendation}</p>
              </div>
            )) : (
              <div className="bg-[#000000] p-4 rounded-lg text-sm text-[#a7abb2]">
                Sync your platforms to generate a personalized practice strategy.
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateRoadmap}
            disabled={isGeneratingRoadmap || weakTopics.length === 0}
            className="w-full mt-6 py-3 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-sm hover:bg-[#81ecff] hover:text-[#003840] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingRoadmap ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Proficiency...
              </>
            ) : (
              'Generate Daily Roadmap'
            )}
          </button>
        </div>

        {/* Roadmap Modal */}
        {showRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#141a20] border border-[#43484e]/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black font-headline text-[#81ecff]">Daily Mission</h2>
                    <p className="text-xs text-[#a7abb2] font-headline uppercase tracking-widest mt-1">Generated Based on skill gaps</p>
                  </div>
                  <button onClick={() => setShowRoadmap(false)} className="text-[#a7abb2] hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {generatedRoadmap.map((item, i) => (
                    <div key={i} className="bg-[#0e1419] p-4 rounded-xl border border-[#43484e]/10 group hover:border-[#c3f400]/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[#c3f400] font-headline uppercase tracking-wider">{item.platform}</span>
                        <span className="text-[10px] text-[#a7abb2] font-mono">TASK 0{i + 1}</span>
                      </div>
                      <h4 className="text-lg font-bold text-[#eaeef5]">{item.title}</h4>
                      <p className="text-sm text-[#a7abb2] mt-1">{item.task}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartMission}
                  disabled={isGeneratingRoadmap}
                  className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0a0f14] font-bold font-headline hover:shadow-[0_0_20px_rgba(195,244,0,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Initializing Mission...
                    </>
                  ) : (
                    'START MISSION'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Platform Efficiency */}
        <div className="md:col-span-8 bg-[#141a20] p-6 rounded-xl border border-[#43484e]/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#eaeef5] font-headline">Platform Efficiency</h3>
              <p className="text-xs text-[#a7abb2] font-headline uppercase tracking-tight">Solved volume by platform</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-[#81ecff]"></div>
                <span className="text-[10px] uppercase text-[#a7abb2]">Solved</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-6 h-48 px-4">
            {(platformData.length > 0 ? platformData : [
              { name: 'No Data', solved: 0 },
            ]).map((platform, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-3 h-full justify-end group"
              >
                <div className="relative w-12 flex flex-col justify-end h-full gap-1">
                  <div className="bg-[#1f262e] w-full rounded-t-sm" style={{ height: '100%' }} />
                  <div
                    className="absolute bottom-0 bg-[#81ecff] w-full rounded-t-sm shadow-[0_-4px_12px_rgba(129,236,255,0.2)]"
                    style={{ height: `${platform.solved > 0 ? (platform.solved / maxSolved) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-[#a7abb2]">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithmic Pulse (Heatmap Pulse) */}
        <div className="md:col-span-4 bg-[#141a20] p-6 rounded-xl overflow-hidden relative border border-[#43484e]/10">
          <h3 className="text-lg font-bold font-headline text-[#eaeef5] mb-6">Heatmap Pulse</h3>

          <div className="grid grid-cols-7 gap-1">
            {algorithmicPulseCells.slice(-28).map((cell) => (
              <div
                key={cell.dateStr}
                className="aspect-square rounded-sm hover:opacity-100 transition-opacity cursor-pointer"
                style={{
                  backgroundColor: getColor(cell.count),
                  boxShadow: cell.count >= 10 ? '0 0 8px rgba(195, 244, 0, 0.3)' : 'none'
                }}
                title={`${cell.dateStr}: ${cell.count} solved`}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center relative z-10">
            <div>
              <p className="text-2xl font-bold font-headline text-[#c3f400]">{stats.streak} Days</p>
              <p className="text-[10px] text-[#a7abb2] uppercase font-headline">Current Streak</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-headline text-[#eaeef5]">{problems.length}</p>
              <p className="text-[10px] text-[#a7abb2] uppercase font-headline">Problems/Year</p>
            </div>
          </div>

          {/* Aesthetic Glow Background */}
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#c3f400]/10 blur-[40px] rounded-full invisible md:visible"></div>
        </div>
      </div>


    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
