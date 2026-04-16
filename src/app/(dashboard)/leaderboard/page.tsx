'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Trophy, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

type LeaderboardWindow = 'weekly' | 'allTime';

type LeaderboardEntry = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  totalSolved: number;
  weeklySolved: number;
  hardSolved: number;
  streak: number;
  rank: number;
};

type LeaderboardResponse = {
  success: boolean;
  window: LeaderboardWindow;
  generatedAt: string;
  entries: LeaderboardEntry[];
  me: (LeaderboardEntry & { isPublic: boolean }) | null;
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [window, setWindow] = useState<LeaderboardWindow>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<(LeaderboardEntry & { isPublic: boolean }) | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/leaderboard?window=${window}&limit=50`, { headers });
        const payload = (await response.json()) as Partial<LeaderboardResponse> & { error?: string };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load leaderboard');
        }

        if (!mounted) return;
        setEntries(Array.isArray(payload.entries) ? payload.entries : []);
        setMe(payload.me || null);
      } catch (err) {
        if (!mounted) return;
        setEntries([]);
        setMe(null);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [window, user]);

  const topScore = entries[0]?.score || 0;

  const averageStreak = useMemo(() => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.streak, 0);
    return Math.round(total / entries.length);
  }, [entries]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#eaeef5]">Community Leaderboard</h2>
          <p className="text-[#a7abb2] mt-2 max-w-2xl">
            Live global ranking across users who have made their profile public.
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-[#141a20] p-1 border border-[#43484e]/20">
          <button
            onClick={() => setWindow('weekly')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
              window === 'weekly' ? 'bg-[#1f262e] text-[#81ecff]' : 'text-[#a7abb2] hover:text-[#eaeef5]'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setWindow('allTime')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
              window === 'allTime' ? 'bg-[#1f262e] text-[#81ecff]' : 'text-[#a7abb2] hover:text-[#eaeef5]'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141a20] rounded-xl border border-[#43484e]/10 p-5">
          <div className="flex items-center gap-2 text-[#c3f400] mb-2">
            <Crown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Top Score</span>
          </div>
          <p className="text-3xl font-black text-[#eaeef5]">{topScore}</p>
          <p className="text-xs text-[#a7abb2] mt-1">Scoring factors: solved volume, hard solved, and streak consistency.</p>
        </div>

        <div className="bg-[#141a20] rounded-xl border border-[#43484e]/10 p-5">
          <div className="flex items-center gap-2 text-[#81ecff] mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Public Profiles</span>
          </div>
          <p className="text-3xl font-black text-[#eaeef5]">{entries.length}</p>
          <p className="text-xs text-[#a7abb2] mt-1">Public profiles participating in this leaderboard window.</p>
        </div>

        <div className="bg-[#141a20] rounded-xl border border-[#43484e]/10 p-5">
          <div className="flex items-center gap-2 text-[#ff716c] mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Avg Streak</span>
          </div>
          <p className="text-3xl font-black text-[#eaeef5]">{averageStreak} days</p>
          <p className="text-xs text-[#a7abb2] mt-1">Average streak for currently visible ranked users.</p>
        </div>
      </div>

      {me && (
        <div className="bg-[#141a20] rounded-xl border border-[#81ecff]/20 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#a7abb2]">Your standing</p>
            <p className="text-sm font-bold text-[#eaeef5] mt-1">
              {me.isPublic ? `#${me.rank || '-'} ${me.displayName}` : `${me.displayName} (private profile)`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-[#a7abb2]">Score</p>
            <p className="text-lg font-black text-[#81ecff]">{me.score}</p>
          </div>
        </div>
      )}

      <div className="bg-[#141a20] rounded-xl border border-[#43484e]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#43484e]/10 flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-widest text-[#a7abb2] font-bold">Leaderboard Rows</h3>
          <span className="text-[10px] uppercase tracking-wider text-[#81ecff]">Live dataset</span>
        </div>
        <div className="divide-y divide-[#43484e]/10">
          {loading ? (
            <div className="px-6 py-8 text-sm text-[#a7abb2] flex items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-[#81ecff]" />
              Loading leaderboard...
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-sm text-[#ff716c]">{error}</div>
          ) : entries.length === 0 ? (
            <div className="px-6 py-8 text-sm text-[#a7abb2]">No public profiles found yet. Enable your public profile from Settings to appear here.</div>
          ) : entries.map((row) => (
            <div key={row.uid} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#1f262e] flex items-center justify-center" style={{ color: '#81ecff' }}>
                  <Medal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#eaeef5] truncate">#{row.rank} {row.displayName}</p>
                  <p className="text-xs text-[#a7abb2] truncate">{window === 'weekly' ? `${row.weeklySolved} solved this week` : `${row.totalSolved} solved overall`}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#a7abb2]">Score</p>
                  <p className="text-sm font-bold text-[#eaeef5]">{row.score}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#a7abb2]">Total</p>
                  <p className="text-sm font-bold text-[#eaeef5]">{row.totalSolved}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#a7abb2]">Streak</p>
                  <p className="text-sm font-bold text-[#eaeef5]">{row.streak}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#a7abb2]">Hard</p>
                  <p className="text-sm font-bold text-[#eaeef5]">{row.hardSolved}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
