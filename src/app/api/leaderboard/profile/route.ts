import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, getAuthenticatedUserId } from '@/lib/server/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

type LeaderboardProfile = {
  isPublic: boolean;
  alias: string;
};

function normalizeAlias(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 30);
}

function normalizeIsPublic(value: unknown) {
  return Boolean(value);
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const adminDb = getFirestore(getAdminApp());
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};
    const profile = userData.leaderboardProfile as Partial<LeaderboardProfile> | undefined;

    return NextResponse.json({
      isPublic: Boolean(profile?.isPublic),
      alias: typeof profile?.alias === 'string' ? profile.alias : '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.toLowerCase().includes('authorization') || message.toLowerCase().includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();
    const isPublic = normalizeIsPublic(body?.isPublic);
    const alias = normalizeAlias(body?.alias);

    const adminDb = getFirestore(getAdminApp());
    await adminDb.collection('users').doc(userId).set(
      {
        leaderboardProfile: {
          isPublic,
          alias,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, isPublic, alias });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    const status = message.toLowerCase().includes('authorization') || message.toLowerCase().includes('token') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
