'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { calculateStats, createEmptyStats, toValidDate } from '@/lib/utils/stats';

interface Platform {
  name: 'codeforces' | 'leetcode' | 'hackerrank';
  handle: string;
  enabled: boolean;
  lastSynced?: Date;
  stats?: Record<string, unknown>;
}

interface Problem {
  id: string;
  platform: string;
  title: string;
  problemUrl?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  rating?: number;
  tags: string[];
  solvedAt?: Date;
}

interface UserStats {
  totalSolved: number;
  byPlatform: Record<string, number>;
  byDifficulty: { Easy: number; Medium: number; Hard: number };
  byTag: Record<string, number>;
  streak: number;
  lastActivity?: Date;
}

export interface Goal {
  id: string;
  title: string;
  subtitle: string;
  metric: 'totalSolved' | 'hardSolved' | 'streak' | 'tagSolved';
  tag?: string;
  target: number;
  initialValue: number;
  color: string;
  createdAt: unknown;
  status: 'active' | 'completed';
}

interface SyncContextType {
  platforms: Platform[];
  problems: Problem[];
  goals: Goal[];
  stats: UserStats;
  loading: boolean;
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
  addPlatform: (name: string, handle: string) => Promise<void>;
  removePlatform: (name: string) => Promise<void>;
  syncPlatform: (name: string) => Promise<void>;
  syncAll: () => Promise<void>;
  refreshData: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

type SyncResult = { success: boolean; synced: number; error: string | null };

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<UserStats>(createEmptyStats());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshData = useCallback(async () => {
    if (!user) {
      setPlatforms([]);
      setProblems([]);
      setGoals([]);
      setStats(createEmptyStats());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userSnap, platformsSnap, problemsSnap, goalsSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDocs(collection(db, 'users', user.uid, 'platforms')),
        getDocs(collection(db, 'users', user.uid, 'problems')),
        getDocs(collection(db, 'users', user.uid, 'goals')),
      ]);

      const platformsList: Platform[] = [];
      platformsSnap.forEach(d => {
        platformsList.push({
          name: d.id as Platform['name'],
          handle: d.data().handle,
          enabled: d.data().enabled ?? true,
          lastSynced: d.data().lastSynced?.toDate?.() || d.data().lastSynced,
          stats: d.data().stats,
        });
      });

      const problemsList: Problem[] = [];
      problemsSnap.forEach(d => {
        const data = d.data();
        problemsList.push({
          id: d.id,
          platform: data.platform,
          title: data.title,
          problemUrl: data.problemUrl,
          difficulty: data.difficulty,
          rating: data.rating,
          tags: data.tags || [],
          solvedAt: data.solvedAt?.toDate?.() || data.solvedAt,
        });
      });

      const goalsList: Goal[] = [];
      goalsSnap.forEach(d => {
        const data = d.data();
        goalsList.push({
          id: d.id,
          title: data.title,
          subtitle: data.subtitle,
          metric: data.metric,
          tag: data.tag,
          target: data.target,
          initialValue: data.initialValue || 0,
          color: data.color || '#81ecff',
          createdAt: data.createdAt,
          status: data.status || 'active',
        });
      });

      setPlatforms(platformsList);
      setProblems(problemsList);
      setGoals(goalsList);
      setStats(calculateStats(problemsList));

      const userLastSync = userSnap.data()?.lastSync;
      setLastSync(toValidDate(userLastSync?.toDate?.() || userLastSync));
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setPlatforms([]);
      setProblems([]);
      setGoals([]);
      setStats(createEmptyStats());
      setLoading(false);
    }
  }, [user, refreshData]);

  const syncViaServer = async (platformInputs: Array<{ name: string; handle: string }>) => {
    if (!user) {
      return Object.fromEntries(
        platformInputs.map((platform) => [
          platform.name,
          { success: false, synced: 0, error: 'Not authenticated' } as SyncResult,
        ])
      ) as Record<string, SyncResult>;
    }

    const idToken = await user.getIdToken();
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ platforms: platformInputs }),
    });

    const payload = await response.json().catch(() => ({} as { error?: string; results?: Record<string, SyncResult> }));
    const resultMap = payload.results || {};

    if (!response.ok && Object.keys(resultMap).length === 0) {
      throw new Error(payload.error || 'Sync request failed');
    }

    return Object.fromEntries(
      platformInputs.map((platform) => {
        const result = resultMap[platform.name];
        if (result) {
          return [platform.name, result as SyncResult];
        }

        return [platform.name, {
          success: false,
          synced: 0,
          error: payload.error || 'Sync failed',
        } as SyncResult];
      })
    ) as Record<string, SyncResult>;
  };

  const executeSync = async (platformInputs: Array<{ name: string; handle: string }>, errorMessage: string) => {
    if (!user) return;

    setSyncing(true);
    setError(null);

    try {
      const results = await syncViaServer(platformInputs);

      const failedPlatforms = Object.entries(results)
        .filter(([, result]) => !result.success)
        .map(([name]) => name);

      if (failedPlatforms.length > 0 && failedPlatforms.length === platformInputs.length) {
        const details = Object.entries(results)
          .map(([name, result]) => (result.error ? `${name}: ${result.error}` : name))
          .join(' | ');
        throw new Error(details || `Sync failed for all platforms: ${failedPlatforms.join(', ')}`);
      }

      await refreshData();
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const syncPlatform = async (name: string) => {
    if (!user) return;

    const platform = platforms.find(p => p.name === name);
    if (!platform?.handle) {
      setError(`Please add ${name} handle first`);
      return;
    }

    await executeSync([{ name, handle: platform.handle }], `Failed to sync ${name}`);
  };

  const addPlatform = async (name: string, handle: string) => {
    if (!user) return;

    const normalizedHandle = handle.trim();
    if (!normalizedHandle) {
      setError('Handle cannot be empty');
      return;
    }

    try {
      await executeSync([{ name, handle: normalizedHandle }], `Failed to sync ${name}`);
    } catch (err) {
      console.error('Error adding platform:', err);
      setError('Failed to add platform');
    }
  };

  const removePlatform = async (name: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'platforms', name));
      setPlatforms(prev => prev.filter(p => p.name !== name));
    } catch (err) {
      console.error('Error removing platform:', err);
      setError('Failed to remove platform');
    }
  };

  const syncAll = async () => {
    if (!user) return;

    const enabledPlatforms = platforms.filter(p => p.enabled && p.handle);
    if (enabledPlatforms.length === 0) {
      setError('No platforms to sync');
      return;
    }

    await executeSync(
      enabledPlatforms.map(p => ({ name: p.name, handle: p.handle })),
      'Failed to sync platforms'
    );
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;
    setError(null);
    try {
      const goalId = crypto.randomUUID();
      await setDoc(doc(db, 'users', user.uid, 'goals', goalId), {
        ...goalData,
        createdAt: serverTimestamp(),
        status: 'active',
      });
      await refreshData();
    } catch (err) {
      console.error('Error adding goal:', err);
      setError('Failed to add goal');
      throw err;
    }
  };

  const removeGoal = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      await refreshData();
    } catch (err) {
      console.error('Error removing goal:', err);
      setError('Failed to remove goal');
      throw err;
    }
  };

  return (
    <SyncContext.Provider
      value={{
        platforms,
        problems,
        goals,
        stats,
        loading,
        syncing,
        lastSync,
        error,
        addPlatform,
        removePlatform,
        syncPlatform,
        syncAll,
        refreshData,
        addGoal,
        removeGoal,
        clearError,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
