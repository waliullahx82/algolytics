const LEETCODE_API_BASE_URL = process.env.LEETCODE_API_BASE_URL || 'https://alfa-leetcode-api.onrender.com';

type JsonObject = Record<string, unknown>;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const n = toNumber(value);
    if (n !== null) return n;
  }
  return 0;
}

function toIsoTimestamp(value: unknown): string | null {
  const raw = toNumber(value);
  if (raw === null) return null;

  // alfa API timestamps are usually unix seconds.
  const ms = raw < 1_000_000_000_000 ? raw * 1000 : raw;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDifficulty(value: unknown): 'Easy' | 'Medium' | 'Hard' {
  const text = String(value || '').toLowerCase();
  if (text.includes('easy')) return 'Easy';
  if (text.includes('hard')) return 'Hard';
  return 'Medium';
}

async function fetchJson(path: string): Promise<JsonObject | unknown[]> {
  const response = await fetch(`${LEETCODE_API_BASE_URL}/${path}`, {
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload === null) {
    throw new Error(`LeetCode API ${path} failed with status ${response.status}`);
  }

  return payload as JsonObject | unknown[];
}

function extractSubmissions(payload: JsonObject | unknown[]): JsonObject[] {
  if (Array.isArray(payload)) {
    return payload.filter((x): x is JsonObject => Boolean(x && typeof x === 'object'));
  }

  const candidates = [
    payload.submission,
    payload.submissions,
    payload.acSubmission,
    payload.acSubmissionList,
    payload.recentAcSubmissionList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((x): x is JsonObject => Boolean(x && typeof x === 'object'));
    }
  }

  return [];
}

function extractStats(profilePayload: JsonObject | unknown[] | null, solvedPayload: JsonObject | unknown[] | null, handle: string) {
  const profile = Array.isArray(profilePayload) ? {} : (profilePayload || {});
  const solved = Array.isArray(solvedPayload) ? {} : (solvedPayload || {});

  const easySolved = firstNumber((solved as JsonObject).easySolved, (solved as JsonObject).easy);
  const mediumSolved = firstNumber((solved as JsonObject).mediumSolved, (solved as JsonObject).medium);
  const hardSolved = firstNumber((solved as JsonObject).hardSolved, (solved as JsonObject).hard);

  const totalSolved = firstNumber(
    (solved as JsonObject).totalSolved,
    (solved as JsonObject).solvedProblem,
    (solved as JsonObject).acceptedProblemCount,
    easySolved + mediumSolved + hardSolved
  );

  return {
    username: String((profile as JsonObject).username || handle),
    ranking: firstNumber((profile as JsonObject).ranking, (profile as JsonObject).rank),
    avatar: String((profile as JsonObject).avatar || (profile as JsonObject).userAvatar || ''),
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
  };
}

export async function fetchLeetCodeData(handle: string) {
  try {
    const [profilePayload, solvedPayload, submissionsPayload] = await Promise.all([
      fetchJson(encodeURIComponent(handle)),
      fetchJson(`${encodeURIComponent(handle)}/solved`),
      fetchJson(`${encodeURIComponent(handle)}/acSubmission?limit=100`),
    ]);

    const stats = extractStats(profilePayload, solvedPayload, handle);
    const submissions = extractSubmissions(submissionsPayload);

    if (submissions.length === 0 && stats.totalSolved === 0) {
      throw new Error('User not found on LeetCode');
    }

    const solvedProblems = submissions.map((sub, index) => {
      const title = String(sub.title || sub.problemName || sub.name || 'Unknown Problem');
      const titleSlug = String(sub.titleSlug || sub.slug || '').trim();
      const solvedAt = toIsoTimestamp(sub.timestamp || sub.time || sub.submitTime);

      return {
        id: String(sub.id || titleSlug || `${title}-${index}`),
        title,
        titleSlug: titleSlug || null,
        difficulty: normalizeDifficulty(sub.difficulty),
        tags: Array.isArray(sub.topicTags)
          ? sub.topicTags.map((t) => String((t as JsonObject).name || t)).filter(Boolean)
          : [],
        problemUrl: titleSlug ? `https://leetcode.com/problems/${titleSlug}` : null,
        lang: sub.lang,
        runtime: sub.runtime,
        memory: sub.memory,
        solvedAt,
      };
    });

    return {
      success: true,
      stats,
      solvedProblems,
      recentSubmissions: submissions.slice(0, 20),
    };
  } catch (error) {
    console.error('LeetCode helper error:', error);
    throw error;
  }
}
