/**
 * Automated Verification Test Suite for Phase A & Phase B
 * Tests:
 * 1. Deterministic simulation clock progression (hours, days, seasons, multi-year)
 * 2. Progression beyond day 365 (never auto-stops, rolls to Year 2 Day 1, totalDays 366+)
 * 3. Lifecycle controls: Start, Pause, Resume, Explicit Stop
 * 4. Restart recovery from persisted SQLite state
 * 5. Multi-speed configuration (1x, 5x, 20x, 100x)
 */

import { advanceClock, calculatePhase, calculateSeason } from '../lib/simulation-clock';
import { prisma } from '../lib/prisma';
import { simulationWorker } from '../lib/simulation-worker';
import { createSession, loadSession, resetActiveSession, getState } from '../lib/society';

let passes = 0;
let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passes++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failures++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('--- PHASE B AUTOMATED TEST SUITE: CLOCK & WORKER DURABILITY ---');
  console.log('===============================================================\n');

  // TEST 1: Clock Advancement & Day Rollover
  console.log('TEST 1: Clock Advancement & Daily Rollover');
  {
    const clock0 = { hour: 23, day: 1, year: 1, totalDays: 1, rounds: 23 };
    const clock1 = advanceClock(clock0, 1);
    assert(clock1.hour === 0, 'Hour wrapped from 23 to 00:00');
    assert(clock1.day === 2, 'Day rolled from 1 to 2');
    assert(clock1.totalDays === 2, 'totalDays incremented to 2');
    assert(clock1.year === 1, 'Year remains 1');
    assert(clock1.dayChanged === true, 'dayChanged flag is true');
    assert(clock1.phase === 'night', 'Hour 0 is night phase');
  }

  // TEST 2: Seasonal Transitions
  console.log('\nTEST 2: Seasonal Transitions Across 365 Days');
  {
    assert(calculateSeason(1) === 'Spring', 'Day 1 is Spring');
    assert(calculateSeason(91) === 'Spring', 'Day 91 is Spring');
    assert(calculateSeason(92) === 'Summer', 'Day 92 transitions to Summer');
    assert(calculateSeason(182) === 'Summer', 'Day 182 is Summer');
    assert(calculateSeason(183) === 'Autumn', 'Day 183 transitions to Autumn');
    assert(calculateSeason(273) === 'Autumn', 'Day 273 is Autumn');
    assert(calculateSeason(274) === 'Winter', 'Day 274 transitions to Winter');
    assert(calculateSeason(365) === 'Winter', 'Day 365 is Winter');
  }

  // TEST 3: Progression Beyond Day 365 (Never Auto-Stop)
  console.log('\nTEST 3: Progression Beyond Day 365 (Year 2 Rollover)');
  {
    const endOfYear = { hour: 23, day: 365, year: 1, totalDays: 365, rounds: 8759 };
    const newYear = advanceClock(endOfYear, 1);

    assert(newYear.hour === 0, 'Hour rolled to 00:00');
    assert(newYear.day === 1, 'Day of year reset to 1 for the new year');
    assert(newYear.year === 2, 'Year incremented to 2');
    assert(newYear.totalDays === 366, 'Cumulative totalDays advanced to 366');
    assert(newYear.season === 'Spring', 'Season cycled back to Spring for Year 2');
    assert(newYear.yearChanged === true, 'yearChanged event triggered');
    assert(newYear.rounds === 8760, 'Tick rounds accurately advanced');

    // Multi-year advancement: Advance through year 2 (365 days = 8760 hours)
    const endOfYear2 = advanceClock(newYear, 8760);
    assert(endOfYear2.year === 3, 'Year advanced to 3 after another 365 days');
    assert(endOfYear2.totalDays === 731, 'totalDays advanced to 731 without stopping');
  }

  // TEST 4: Speed Controls
  console.log('\nTEST 4: Speed Controls (1x, 5x, 20x, 100x)');
  {
    assert(simulationWorker.setSpeed(1) === 1, 'Set speed to 1x');
    assert(simulationWorker.setSpeed(5) === 5, 'Set speed to 5x');
    assert(simulationWorker.setSpeed(20) === 20, 'Set speed to 20x');
    assert(simulationWorker.setSpeed(100) === 100, 'Set speed to 100x');
    // Test clamping limits
    assert(simulationWorker.setSpeed(0.01) === 0.25, 'Min speed clamped to 0.25x');
    assert(simulationWorker.setSpeed(500) === 100, 'Max speed clamped to 100x');
    simulationWorker.setSpeed(20);
  }

  // TEST 5: Database Lifecycle - Start, Pause, Resume, Explicit Stop
  console.log('\nTEST 5: Database Lifecycle Controls (Start, Pause, Resume, Stop)');
  {
    const session = await createSession('Phase B Test Society');
    assert(session.sessionId.length > 0, `Created test session: ${session.sessionId}`);
    assert(session.status === 'idle', 'Initial status is idle');
    assert(session.day === 1, 'Initial day is 1');
    assert(session.year === 1, 'Initial year is 1');

    // 1. Start simulation
    const started = await simulationWorker.start(session.sessionId);
    assert(started.status === 'running', 'Worker status transitioned to running');

    // Verify DB reflects running status
    const dbRunning = await prisma.simulationSession.findUnique({ where: { id: session.sessionId } });
    assert(dbRunning?.status === 'running', 'DB session status updated to running');
    assert(dbRunning?.stoppedAt === null, 'stoppedAt is null while running');

    // 2. Step turn while running/testing
    const stepped = await simulationWorker.step();
    assert(stepped.hour === 1, 'Step incremented hour to 1');
    assert(stepped.rounds >= 1, 'Step incremented rounds count');

    // 3. Pause simulation
    const paused = await simulationWorker.pause();
    assert(paused.status === 'paused', 'Worker status transitioned to paused');
    const dbPaused = await prisma.simulationSession.findUnique({ where: { id: session.sessionId } });
    assert(dbPaused?.status === 'paused', 'DB session status updated to paused');
    const pausedHour = paused.hour;
    const pausedRounds = paused.rounds;

    // 4. Resume simulation
    const resumed = await simulationWorker.resume();
    assert(resumed.status === 'running', 'Worker resumed to running status');
    assert(resumed.hour === pausedHour, 'Hour preserved exactly from paused state');
    assert(resumed.rounds === pausedRounds, 'Rounds preserved exactly from paused state');
    const dbResumed = await prisma.simulationSession.findUnique({ where: { id: session.sessionId } });
    assert(dbResumed?.status === 'running', 'DB status confirmed running');

    // 5. Explicit Stop simulation
    const stopped = await simulationWorker.stop();
    assert(stopped.status === 'stopped', 'Worker transitioned to stopped');
    assert(stopped.stoppedAt !== undefined, 'stoppedAt timestamp recorded in state');
    const dbStopped = await prisma.simulationSession.findUnique({ where: { id: session.sessionId } });
    assert(dbStopped?.status === 'stopped', 'DB status updated to stopped');
    assert(dbStopped?.stoppedAt !== null, 'DB stoppedAt timestamp saved');
  }

  // TEST 6: Server Restart Recovery
  console.log('\nTEST 6: Server Restart Recovery');
  {
    // Simulate server crash while session was running
    const crashSession = await createSession('Crash Recovery Test');
    await prisma.simulationSession.update({
      where: { id: crashSession.sessionId },
      data: {
        status: 'running',
        hour: 14,
        day: 42,
        year: 1,
        totalDays: 42,
        rounds: 1022,
        lastProcessedAt: new Date(),
      },
    });

    // Worker simulates fresh restart boot
    const recoveryResult = await simulationWorker.recoverFromRestart();
    assert(recoveryResult.recovered === true, 'Detected running session and recovered successfully');
    assert(recoveryResult.status === 'running', 'Worker resumed in running state');

    const stateAfterRecovery = await getState();
    assert(stateAfterRecovery.day === 42, 'Recovered exact day (42)');
    assert(stateAfterRecovery.hour === 14, 'Recovered exact hour (14:00)');
    assert(stateAfterRecovery.rounds === 1022, 'Recovered exact round count (1022)');

    // Verify recovery event logged to DB
    const recoveryEvent = await prisma.simulationEvent.findFirst({
      where: { sessionId: crashSession.sessionId, text: { contains: 'Server restarted' } },
    });
    assert(recoveryEvent !== null, 'Restart recovery event was recorded in the database');

    // Stop worker cleanly after test
    await simulationWorker.stop();
  }

  // TEST 7: Progression Beyond Day 365 In SQLite Database
  console.log('\nTEST 7: SQLite Progression Beyond Day 365 (Live DB Transition)');
  {
    const yearEndSession = await createSession('Year 2 Transition Session');
    
    // Fast forward to Day 365, 23:00
    await prisma.simulationSession.update({
      where: { id: yearEndSession.sessionId },
      data: {
        hour: 23,
        day: 365,
        totalDays: 365,
        year: 1,
        season: 'Winter',
        rounds: 8759,
        status: 'running',
      },
    });

    // Load into state
    await loadSession(yearEndSession.sessionId);
    await simulationWorker.start(yearEndSession.sessionId);

    // Execute the midnight tick into Year 2
    await simulationWorker.step();

    // Verify database record
    const postYearDb = await prisma.simulationSession.findUnique({
      where: { id: yearEndSession.sessionId },
    });

    assert(postYearDb?.year === 2, `Database session year rolled to Year 2 (was ${postYearDb?.year})`);
    assert(postYearDb?.day === 1, `Database session day reset to Day 1 (was ${postYearDb?.day})`);
    assert(postYearDb?.totalDays === 366, `Database totalDays incremented to 366 (was ${postYearDb?.totalDays})`);
    assert(postYearDb?.season === 'Spring', `Database season reset to Spring (was ${postYearDb?.season})`);
    assert(postYearDb?.hour === 0, `Database hour is 00:00 (was ${postYearDb?.hour})`);
    assert(postYearDb?.status !== 'completed', 'Simulation DID NOT auto-stop; status is still active');

    // Verify annual milestone event logged
    const yearEvent = await prisma.simulationEvent.findFirst({
      where: { sessionId: yearEndSession.sessionId, text: { contains: 'Year 2 has begun' } },
    });
    assert(yearEvent !== null, 'Annual milestone event logged in database: ' + yearEvent?.text);

    // Stop cleanly
    await simulationWorker.stop();
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passes} PASSED, ${failures} FAILED`);
  console.log('===============================================================\n');

  if (failures > 0) {
    process.exit(1);
  }
}

void runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
