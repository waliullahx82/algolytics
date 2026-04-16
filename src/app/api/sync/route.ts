import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, getAdminApp } from '@/lib/server/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

type PlatformName = 'codeforces' | 'leetcode' | 'hackerrank';

interface PlatformInput {
  name: PlatformName;
  handle: string;
}

type SyncResult = { success: boolean; synced: number; error: string | null };

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get userId from token
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request);
    } catch (authError) {
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const platforms = body.platforms as PlatformInput[];

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 });
    }

    const adminDb = getFirestore(getAdminApp());

    const results: Record<PlatformName, SyncResult> = {
      codeforces: { success: false, synced: 0, error: null },
      leetcode: { success: false, synced: 0, error: null },
      hackerrank: { success: false, synced: 0, error: null },
    };

    for (const platform of platforms) {
      const name = platform.name;
      const handle = platform.handle;

      if (!handle) continue;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/${name}?handle=${encodeURIComponent(handle)}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            (payload as { error?: string })?.error || `API returned ${response.status}`
          );
        }

        const data = payload;

        if (data.success) {
          const platformRef = adminDb.collection('users').doc(userId).collection('platforms').doc(name);
          await platformRef.set(stripUndefined({
            name,
            handle,
            enabled: true,
            lastSynced: FieldValue.serverTimestamp(),
            stats: data.stats || data,
          }), { merge: true });

          const problemsRef = adminDb.collection('users').doc(userId).collection('problems');

          const problemList = data.solvedProblems || [];
          let syncedCount = 0;

          for (const problem of problemList.slice(0, 500)) {
            const normalizedId = String(problem.id || problem.code || problem.titleSlug || problem.index || problem.title || 'unknown');
            const problemId = `${name}_${normalizedId}`;
            const solvedAtRaw = problem.solvedAt || problem.timestamp;
            const parsedSolvedAt = solvedAtRaw ? new Date(solvedAtRaw) : null;
            const solvedAt = parsedSolvedAt && !Number.isNaN(parsedSolvedAt.getTime()) ? parsedSolvedAt : new Date();
            const title = problem.title || problem.name || problem.problem?.name || problem.code || normalizedId;

            const existingDoc = await problemsRef.doc(problemId).get();

            if (!existingDoc.exists) {
              await problemsRef.doc(problemId).set(stripUndefined({
                platform: name,
                title,
                problemUrl: problem.titleSlug
                  ? `https://leetcode.com/problems/${problem.titleSlug}`
                  : (problem.problemUrl || null),
                difficulty: problem.difficulty ?? null,
                rating: problem.rating ?? null,
                tags: problem.tags || [],
                solvedAt,
                createdAt: FieldValue.serverTimestamp(),
              }));
              syncedCount++;
            }
          }

          results[name] = {
            success: true,
            synced: syncedCount,
            error: null,
          };
        }
      } catch (error: unknown) {
        results[name] = {
          success: false,
          synced: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const successfulPlatforms = Object.values(results).filter(r => r.success).length;
    const hasSuccess = successfulPlatforms > 0;

    // Only record lastSync when at least one platform actually synced.
    if (hasSuccess) {
      await adminDb.collection('users').doc(userId).set({
        lastSync: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    if (!hasSuccess) {
      const failureDetails = Object.entries(results)
        .filter(([, result]) => !result.success && result.error)
        .map(([platform, result]) => `${platform}: ${result.error}`)
        .join(' | ');

      return NextResponse.json(
        {
          success: false,
          error: failureDetails ? `All platform syncs failed - ${failureDetails}` : 'All platform syncs failed',
          results,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication and get userId from token
  let userId: string;
  try {
    userId = await getAuthenticatedUserId(request);
  } catch (authError) {
    return NextResponse.json(
      { error: authError instanceof Error ? authError.message : 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const adminDb = getFirestore(getAdminApp());
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ platforms: [], problems: [] });
    }

    const platformsSnapshot = await adminDb.collection('users').doc(userId).collection('platforms').get();
    const problemsSnapshot = await adminDb.collection('users').doc(userId).collection('problems').get();

    const platforms = platformsSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      lastSynced: d.data().lastSynced?.toDate?.() || null,
    }));

    const problems = problemsSnapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        platform: data.platform,
        title: data.title,
        difficulty: data.difficulty,
        tags: data.tags || [],
        solvedAt: data.solvedAt?.toDate?.() || null,
      };
    });

    const stats = {
      totalSolved: problems.length,
      byPlatform: {} as Record<string, number>,
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      byTag: {} as Record<string, number>,
    };

    problems.forEach((p) => {
      const platform = typeof p.platform === 'string' ? p.platform : null;
      const difficulty = p.difficulty as keyof typeof stats.byDifficulty | undefined;
      const tags = Array.isArray(p.tags) ? p.tags : [];

      if (platform) {
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
      }
      if (difficulty && stats.byDifficulty[difficulty] !== undefined) {
        stats.byDifficulty[difficulty]++;
      }
      tags.forEach((tag: string) => {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      });
    });

    return NextResponse.json({
      platforms,
      problems,
      stats,
      lastSync: userDoc.data()?.lastSync?.toDate?.() || null,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
