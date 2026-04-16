/**
 * Platform connection information (stored in users/{uid}/platforms/{name})
 */
export interface Platform {
  name: 'codeforces' | 'leetcode' | 'hackerrank';
  handle: string;
  enabled: boolean;
  lastSynced?: Date;
  stats?: Record<string, unknown>;
}

/**
 * Solved problem (stored in users/{uid}/problems/{id})
 * Normalized across all platforms (Codeforces, LeetCode, HackerRank)
 */
export interface Problem {
  id: string;
  platform: string;
  title: string;
  problemUrl?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  rating?: number;
  tags: string[];
  solvedAt?: Date;
  createdAt?: Date;
}

/**
 * User-level aggregated statistics
 */
export interface UserStats {
  totalSolved: number;
  byPlatform: Record<string, number>;
  byDifficulty: { Easy: number; Medium: number; Hard: number };
  byTag: Record<string, number>;
  streak: number;
  lastActivity?: Date;
}

// Placeholder for future expansion (e.g., Goals, Contests, etc.)

