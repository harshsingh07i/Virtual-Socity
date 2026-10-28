import { NextResponse } from 'next/server';
import {
  getState,
  resetActiveSession,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  stepSimulation,
  setSpeed,
  loadSession,
  createSession,
} from '@/lib/society';
import { simulationWorker } from '@/lib/simulation-worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let hasCheckedRestartRecovery = false;

export async function GET() {
  try {
    if (!hasCheckedRestartRecovery) {
      hasCheckedRestartRecovery = true;
      await simulationWorker.recoverFromRestart().catch(console.error);
    }
    const state = await getState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve simulation state.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'speed') {
      const speed = typeof body.speed === 'number' ? body.speed : 1;
      const applied = setSpeed(speed);
      const state = await getState();
      return NextResponse.json({ ...state, speed: applied, message: `Speed set to ${applied}x.` });
    }

    if (action === 'start') {
      const state = await startSimulation();
      return NextResponse.json({ ...state, message: 'Simulation started.' });
    }

    if (action === 'pause') {
      const state = await pauseSimulation();
      return NextResponse.json({ ...state, message: 'Simulation paused.' });
    }

    if (action === 'resume') {
      const state = await resumeSimulation();
      return NextResponse.json({ ...state, message: 'Simulation resumed.' });
    }

    if (action === 'stop') {
      const state = await stopSimulation();
      return NextResponse.json({ ...state, message: 'Simulation explicitly stopped by overseer.' });
    }

    if (action === 'step') {
      const state = await stepSimulation();
      return NextResponse.json({ ...state, message: 'Stepped forward one turn.' });
    }

    if (action === 'reset') {
      const state = await resetActiveSession();
      return NextResponse.json({ ...state, message: 'Simulation reset to Year 1, Day 1, 00:00.' });
    }

    if (action === 'load') {
      if (!body.sessionId) {
        return NextResponse.json({ error: 'sessionId is required to load a session.' }, { status: 400 });
      }
      const state = await loadSession(body.sessionId);
      return NextResponse.json({ ...state, message: `Loaded session "${state.sessionTitle}".` });
    }

    if (action === 'create') {
      const state = await createSession(body.title);
      return NextResponse.json({ ...state, message: `Created new session "${state.sessionTitle}".` });
    }

    if (action === 'save') {
      const state = await getState();
      return NextResponse.json({ ...state, message: 'Session state saved.' });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: start, pause, resume, stop, step, speed, reset, load, create, save.' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing simulation request.' },
      { status: 500 }
    );
  }
}
