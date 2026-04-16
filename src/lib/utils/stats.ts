import type { Problem, UserStats } from '@/types';

export function toValidDate(value: unknown): Date | null {
  if (!value) return null;

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => unknown }).toDate === 'function') {
    const converted = (value as { toDate: () => unknown }).toDate();
    return toValidDate(converted);
  }

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createEmptyStats(): UserStats {
  return {
    totalSolved: 0,
    byPlatform: {},
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
    byTag: {},
    streak: 0,
  };
}

export function calculateStreak(sortedProblems: Pick<Problem, 'solvedAt'>[]): number {
  if (sortedProblems.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const solvedDates = new Set<string>();
  sortedProblems.forEach((problem) => {
    const date = toValidDate(problem.solvedAt);
    if (!date) return;
    date.setHours(0, 0, 0, 0);
    solvedDates.add(date.toISOString());
  });

  let streak = 0;
  let currentDate = today;

  while (solvedDates.has(currentDate.toISOString())) {
    streak++;
    currentDate = new Date(currentDate.getTime() - 86400000);
  }

  return streak;
}

export function calculateStats(problemList: Problem[]): UserStats {
  const newStats = createEmptyStats();
  newStats.totalSolved = problemList.length;

  problemList.forEach((problem) => {
    if (problem.platform) {
      newStats.byPlatform[problem.platform] = (newStats.byPlatform[problem.platform] || 0) + 1;
    }

    if (problem.difficulty && newStats.byDifficulty[problem.difficulty] !== undefined) {
      newStats.byDifficulty[problem.difficulty]++;
    }

    problem.tags.forEach((tag) => {
      newStats.byTag[tag] = (newStats.byTag[tag] || 0) + 1;
    });
  });

  if (problemList.length > 0) {
    const sorted = [...problemList].sort((a, b) => {
      const dateA = toValidDate(a.solvedAt);
      const dateB = toValidDate(b.solvedAt);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    newStats.lastActivity = toValidDate(sorted[0]?.solvedAt) || undefined;
    newStats.streak = calculateStreak(sorted);
  }

  return newStats;
}