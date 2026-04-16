import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const CODEFORCES_API = 'https://codeforces.com/api';
const CODEFORCES_API_KEY = process.env.CODEFORCES_API_KEY;
const CODEFORCES_API_SECRET = process.env.CODEFORCES_API_SECRET;

interface CodeforcesSubmission {
  id: number;
  contestId: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
  };
  verdict: string;
  testset: string;
  lang: string;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  creationTimeSeconds: number;
}

interface CodeforcesUserInfo {
  handle: string;
  rating?: number;
  rank?: string;
  maxRating?: number;
  maxRank?: string;
  lastName: string;
  firstName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  avatar: string;
  titlePhoto: string;
}

function toIsoTimestamp(timestampSeconds: unknown): string | null {
  if (typeof timestampSeconds !== 'number' || !Number.isFinite(timestampSeconds)) {
    return null;
  }

  const date = new Date(timestampSeconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildCodeforcesSignedUrl(method: string, params: Record<string, string>): string {
  const queryEntries = Object.entries({
    ...params,
    apiKey: CODEFORCES_API_KEY as string,
    time: String(Math.floor(Date.now() / 1000)),
  }).sort(([a], [b]) => a.localeCompare(b));

  const queryString = new URLSearchParams(queryEntries).toString();
  const rand = randomBytes(3).toString('hex');
  const toHash = `${rand}/${method}?${queryString}#${CODEFORCES_API_SECRET}`;
  const apiSig = `${rand}${createHash('sha512').update(toHash).digest('hex')}`;

  return `${CODEFORCES_API}/${method}?${queryString}&apiSig=${apiSig}`;
}

function buildCodeforcesUrl(method: string, params: Record<string, string>): string {
  if (CODEFORCES_API_KEY && CODEFORCES_API_SECRET) {
    return buildCodeforcesSignedUrl(method, params);
  }

  return `${CODEFORCES_API}/${method}?${new URLSearchParams(params).toString()}`;
}

function buildCodeforcesUnsignedUrl(method: string, params: Record<string, string>): string {
  return `${CODEFORCES_API}/${method}?${new URLSearchParams(params).toString()}`;
}

async function fetchCodeforcesData(method: string, params: Record<string, string>) {
  const signedEnabled = Boolean(CODEFORCES_API_KEY && CODEFORCES_API_SECRET);

  const parseResponse = async (url: string) => {
    const response = await fetch(url);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`Codeforces ${method} HTTP ${response.status}`);
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error(`Codeforces ${method} returned invalid JSON`);
    }

    return payload as { status?: string; comment?: string; result?: unknown };
  };

  const firstPayload = await parseResponse(buildCodeforcesUrl(method, params));
  if (firstPayload.status === 'OK') {
    return firstPayload;
  }

  // If signed auth fails (bad apiSig/time/key/secret), retry anonymously for public endpoints.
  if (signedEnabled) {
    const fallbackPayload = await parseResponse(buildCodeforcesUnsignedUrl(method, params));
    if (fallbackPayload.status === 'OK') {
      return fallbackPayload;
    }
    throw new Error(fallbackPayload.comment || firstPayload.comment || `Codeforces ${method} request failed`);
  }

  throw new Error(firstPayload.comment || `Codeforces ${method} request failed`);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
  }

  try {
    const submissionsData = await fetchCodeforcesData('user.status', { handle });
    let userInfo: CodeforcesUserInfo | null = null;

    try {
      const userInfoData = await fetchCodeforcesData('user.info', { handles: handle });
      const result = Array.isArray(userInfoData.result) ? userInfoData.result : [];
      userInfo = (result[0] as CodeforcesUserInfo | undefined) || null;
    } catch (userInfoError) {
      console.warn('Codeforces user.info warning:', userInfoError);
    }
    
    const submissions = Array.isArray(submissionsData.result)
      ? (submissionsData.result as CodeforcesSubmission[])
      : [];

    const solvedProblems = new Map<string, CodeforcesSubmission>();
    
    submissions.forEach((sub) => {
      if (sub.verdict === 'OK') {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedProblems.has(key)) {
          solvedProblems.set(key, sub);
        }
      }
    });

    const solvedList = Array.from(solvedProblems.values()).map((sub) => ({
      id: `${sub.problem.contestId}-${sub.problem.index}`,
      title: sub.problem.name,
      contestId: sub.problem.contestId,
      index: sub.problem.index,
      name: sub.problem.name,
      rating: sub.problem.rating,
      difficulty: sub.problem.rating
        ? sub.problem.rating < 1300
          ? 'Easy'
          : sub.problem.rating < 1900
            ? 'Medium'
            : 'Hard'
        : 'Medium',
      problemUrl: `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`,
      tags: sub.problem.tags,
      solvedAt: toIsoTimestamp(sub.creationTimeSeconds),
      lastSubmission: {
        lang: sub.lang,
        time: sub.timeConsumedMillis,
        memory: sub.memoryConsumedBytes,
      },
    }));

    const stats = {
      totalSolved: solvedList.length,
      rating: userInfo?.rating || null,
      rank: userInfo?.rank || null,
      maxRating: userInfo?.maxRating || null,
      maxRank: userInfo?.maxRank || null,
      avatar: userInfo?.avatar || null,
      titlePhoto: userInfo?.titlePhoto || null,
    };

    return NextResponse.json({
      success: true,
      stats,
      solvedProblems: solvedList,
      recentSubmissions: submissions.slice(0, 20).map((sub) => ({
        id: sub.id,
        problem: {
          name: sub.problem.name,
          index: sub.problem.index,
        },
        verdict: sub.verdict,
        lang: sub.lang,
        time: sub.timeConsumedMillis,
        memory: sub.memoryConsumedBytes,
        timestamp: toIsoTimestamp(sub.creationTimeSeconds),
      })),
    });
  } catch (error) {
    console.error('Codeforces API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 502 }
    );
  }
}
