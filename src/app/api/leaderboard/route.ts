import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, verifyIdToken } from '@/lib/server/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

type InternalStats = {
  totalSolved: number;
  weeklySolved: number;
  hardSolved: number;
  streak: number;
};

type DecodedTokenLike = {
  uid: string;
};

function getStartOfWeekUtc() {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utc.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + mondayOffset);
  return utc;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  const maybeDate = value as Date;
  if (typeof maybeDate?.getTime === 'function') {
    const time = maybeDate.getTime();
    return Number.isNaN(time) ? null : maybeDate;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const converted = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function calculateStreak(solvedDates: Date[]) {
  if (solvedDates.length === 0) return 0;

  const distinctDays = new Set(
    solvedDates
      .map((date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized.toISOString();
      })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(today);

  while (distinctDays.has(cursor.toISOString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeStats(
  docs: Array<{ difficulty?: unknown; solvedAt?: unknown }>,
  weekStart: Date
): InternalStats {
  const solvedDates: Date[] = [];
  let hardSolved = 0;
  let weeklySolved = 0;

  for (const doc of docs) {
    const solvedAt = toDate(doc.solvedAt);
    if (!solvedAt) continue;

    solvedDates.push(solvedAt);

    if (typeof doc.difficulty === 'string' && doc.difficulty.toLowerCase() === 'hard') {
      hardSolved++;
    }

    if (solvedAt >= weekStart) {
      weeklySolved++;
    }
  }

  return {
    totalSolved: solvedDates.length,
    weeklySolved,
    hardSolved,
    streak: calculateStreak(solvedDates),
  };
}

function scoreForWindow(window: LeaderboardWindow, stats: InternalStats) {
  if (window === 'weekly') {
    return stats.weeklySolved * 12 + stats.hardSolved * 4 + stats.streak * 3;
  }

  return stats.totalSolved * 10 + stats.hardSolved * 5 + stats.streak * 3;
}

async function getOptionalDecodedToken(request: NextRequest): Promise<DecodedTokenLike | null> {
  try {
    const decoded = await verifyIdToken(request);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

async function buildEntryForUser(
  uid: string,
  displayName: string,
  photoURL: string | null,
  weekStart: Date,
  window: LeaderboardWindow
): Promise<LeaderboardEntry> {
  const adminDb = getFirestore(getAdminApp());
  const problemsSnapshot = await adminDb.collection('users').doc(uid).collection('problems').get();

  const stats = computeStats(
    problemsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        difficulty: data.difficulty,
        solvedAt: data.solvedAt,
      };
    }),
    weekStart
  );

  return {
    uid,
    displayName,
    photoURL,
    score: scoreForWindow(window, stats),
    totalSolved: stats.totalSolved,
    weeklySolved: stats.weeklySolved,
    hardSolved: stats.hardSolved,
    streak: stats.streak,
    rank: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const adminDb = getFirestore(getAdminApp());
    const searchParams = request.nextUrl.searchParams;
    const window = searchParams.get('window') === 'allTime' ? 'allTime' : 'weekly';
    const limitParam = Number(searchParams.get('limit') || '50');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 50;
    const weekStart = getStartOfWeekUtc();

    const usersSnapshot = await adminDb.collection('users').get();
    const publicUsers = usersSnapshot.docs.filter((doc) => {
      const data = doc.data();
      const profile = data.leaderboardProfile as { isPublic?: boolean } | undefined;
      return Boolean(profile?.isPublic);
    });

    const publicEntries = await Promise.all(
      publicUsers.map(async (userDoc) => {
        const data = userDoc.data();
        const profile = data.leaderboardProfile as { alias?: string } | undefined;

        const displayName =
          (typeof profile?.alias === 'string' && profile.alias.trim()) ||
          (typeof data.displayName === 'string' && data.displayName) ||
          'Anonymous Coder';

        return buildEntryForUser(
          userDoc.id,
          displayName,
          typeof data.photoURL === 'string' ? data.photoURL : null,
          weekStart,
          window
        );
      })
    );

    const sortedEntries = publicEntries
      .sort((a, b) => b.score - a.score || b.totalSolved - a.totalSolved)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const decoded = await getOptionalDecodedToken(request);
    let me: (LeaderboardEntry & { isPublic: boolean }) | null = null;

    if (decoded) {
      const meDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (meDoc.exists) {
        const meData = meDoc.data() || {};
        const meProfile = meData.leaderboardProfile as { isPublic?: boolean; alias?: string } | undefined;
        const displayName =
          (typeof meProfile?.alias === 'string' && meProfile.alias.trim()) ||
          (typeof meData.displayName === 'string' && meData.displayName) ||
          'You';

        const mePublicEntry = sortedEntries.find((entry) => entry.uid === decoded.uid);

        if (mePublicEntry) {
          me = {
            ...mePublicEntry,
            isPublic: true,
          };
        } else {
          const meEntry = await buildEntryForUser(
            decoded.uid,
            displayName,
            typeof meData.photoURL === 'string' ? meData.photoURL : null,
            weekStart,
            window
          );

          me = {
            ...meEntry,
            rank: meEntry.score > 0
              ? sortedEntries.filter((entry) => entry.score > meEntry.score).length + 1
              : 0,
            isPublic: Boolean(meProfile?.isPublic),
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      window,
      generatedAt: new Date().toISOString(),
      entries: sortedEntries.slice(0, limit),
      me,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
