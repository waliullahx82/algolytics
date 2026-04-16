const HACKERRANK_BASE_URL = process.env.HACKERRANK_API_BASE_URL || 'https://www.hackerrank.com';

type JsonObject = Record<string, unknown>;

interface RecentChallengesResponse {
  models?: JsonObject[];
  cursor?: string | null;
  last_page?: boolean;
}

function toIsoTimestamp(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchJson(path: string): Promise<JsonObject> {
  const response = await fetch(`${HACKERRANK_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'algolytics-sync/1.0',
      Accept: 'application/json',
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== 'object') {
    if (response.status === 404) {
      throw new Error('User not found on HackerRank');
    }
    throw new Error(`HackerRank API ${path} failed with status ${response.status}`);
  }

  return payload as JsonObject;
}

async function fetchAllRecentChallenges(handle: string): Promise<JsonObject[]> {
  const uniqueBySlug = new Map<string, JsonObject>();
  let cursor: string | null = null;
  let lastPage = false;
  let pageCount = 0;
  const maxPages = 20;

  while (!lastPage && pageCount < maxPages && uniqueBySlug.size < 500) {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const payload = (await fetchJson(
      `/rest/hackers/${encodeURIComponent(handle)}/recent_challenges?limit=100${cursorParam}`
    )) as RecentChallengesResponse;

    const models = Array.isArray(payload.models) ? payload.models : [];
    for (const challenge of models) {
      const slug = String(challenge.ch_slug || challenge.slug || challenge.name || '').trim();
      if (!slug) continue;
      if (!uniqueBySlug.has(slug)) {
        uniqueBySlug.set(slug, challenge);
      }
    }

    cursor = typeof payload.cursor === 'string' && payload.cursor ? payload.cursor : null;
    lastPage = payload.last_page === true || !cursor;
    pageCount += 1;
  }

  return Array.from(uniqueBySlug.values());
}

export async function fetchHackerRankData(handle: string) {
  try {
    const profilePayload = await fetchJson(
      `/rest/contests/master/hackers/${encodeURIComponent(handle)}/profile`
    );

    const profile =
      profilePayload && typeof profilePayload.model === 'object'
        ? (profilePayload.model as JsonObject)
        : null;

    if (!profile) {
      throw new Error('User not found on HackerRank');
    }

    const recentChallenges = await fetchAllRecentChallenges(handle);

    const solvedProblems = recentChallenges.map((challenge, index) => {
      const slug = String(challenge.ch_slug || challenge.slug || '').trim();
      const title = String(challenge.name || challenge.title || slug || `Challenge ${index + 1}`);
      const contestSlug = String(challenge.con_slug || 'master').trim() || 'master';
      const solvedAt = toIsoTimestamp(challenge.created_at || challenge.solved_at || challenge.timestamp);

      return {
        id: slug || `${contestSlug}-${index}`,
        code: slug || null,
        title,
        name: title,
        difficulty: 'Medium' as const,
        tags: [],
        problemUrl: slug
          ? `${HACKERRANK_BASE_URL}/challenges/${slug}/problem`
          : `${HACKERRANK_BASE_URL}/domains`,
        solvedAt,
      };
    });

    const stats = {
      username: String(profile.username || handle),
      name: String(profile.name || ''),
      title: String(profile.title || ''),
      country: String(profile.country || ''),
      school: String(profile.school || ''),
      level: Number(profile.level || 0),
      eventCount: Number(profile.event_count || 0),
      followersCount: Number(profile.followers_count || 0),
      totalSolved: solvedProblems.length,
      avatar: String(profile.avatar || ''),
    };

    return {
      success: true,
      stats,
      totalSolved: solvedProblems.length,
      solvedProblems,
      recentSubmissions: solvedProblems.slice(0, 20),
    };
  } catch (error) {
    console.error('HackerRank helper error:', error);
    throw error;
  }
}
