import { NextRequest, NextResponse } from 'next/server';
import { fetchHackerRankData } from '@/lib/platforms/hackerrank';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
  }

  try {
    const data = await fetchHackerRankData(handle);
    return NextResponse.json(data);
  } catch (error) {
    console.error('HackerRank API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    const status = message.toLowerCase().includes('not found') ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
