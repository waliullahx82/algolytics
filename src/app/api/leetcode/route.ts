import { NextRequest, NextResponse } from 'next/server';
import { fetchLeetCodeData } from '@/lib/platforms/leetcode';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
  }

  try {
    const data = await fetchLeetCodeData(handle);
    return NextResponse.json(data);
  } catch (error) {
    console.error('LeetCode API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    const status = message.includes('not found') ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
