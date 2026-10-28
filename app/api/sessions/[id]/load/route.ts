import { NextResponse } from 'next/server';
import { loadSession } from '@/lib/society';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await loadSession(id);
    return NextResponse.json({ ...session, message: `Loaded session "${session.sessionTitle}".` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load session.' },
      { status: 500 }
    );
  }
}
